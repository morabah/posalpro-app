
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { getStripe, isStripeReady } from '@/lib/billing/stripe';
import { prisma } from '@/lib/db/prisma';
import { BillingSyncService } from '@/lib/services/BillingSyncService';
import { NextRequest } from 'next/server';

// Type definitions for Stripe webhook data
interface StripeWebhookData {
  id?: string;
  subscription?: string;
  [key: string]: unknown;
}

interface StripeEventData {
  object?: StripeWebhookData;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  // With secret configured: verify signature using raw body. Otherwise: dev scaffold allows JSON.
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const useSignature = Boolean(secret) && isStripeReady();

  try {
    let type: string | undefined;
    let data: StripeWebhookData;
    let subscriptionId: string | undefined;
    let eventId: string | undefined;

    if (useSignature) {
      const stripe = await getStripe();
      const body = await req.text();
      const sig = req.headers.get('stripe-signature');
      if (!sig) return new Response('missing signature', { status: 400 });
      const event = stripe.webhooks.constructEvent(body, sig, secret);
      type = event.type as string;
      data = (event.data?.object ?? {}) as StripeWebhookData;
      subscriptionId = data?.id || data?.subscription || undefined;
      eventId = event.id as string | undefined;
    } else {
      // Fallback for local/dev without secret
      const json = await req.json();
      type = json.type as string | undefined;
      data = json.data?.object ?? {};
      subscriptionId = data?.id || data?.subscription || undefined;
      eventId = json.id as string | undefined;
    }

    // Deduplicate webhook events by event id
    if (eventId) {
      const dedupKey = `stripe:${eventId}`;
      try {
        const ttlDays = 3;
        const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
        await prisma.idempotency.create({
          data: { key: dedupKey, route: 'stripe:webhook', userId: null, expiresAt },
        });
      } catch (e: unknown) {
        // Unique constraint violation → duplicate delivery
        const errorMessage = e instanceof Error ? e.message : '';
        const errorCode = (e as { code?: string })?.code || '';
        const msg = errorCode + errorMessage;
        if (msg.includes('P2002') || msg.toLowerCase().includes('unique')) {
          return new Response('duplicate', { status: 200 });
        }
      }
    }

    // Normalize plan nickname/name from payload
    const planName = ((data as any).plan?.nickname ||
      (data as any).plan?.name ||
      (data as any).items?.data?.[0]?.plan?.nickname ||
      (data as any).items?.data?.[0]?.plan?.name ||
      'FREE') as string;
    const seats = Number(process.env.DEFAULT_PLAN_SEATS || 5);

    if (type === 'checkout.session.completed') {
      const customerId: string | undefined = (data as any).customer as string | undefined;
      const tenantId: string | undefined =
        ((data as any).client_reference_id as string | undefined) ||
        ((data as any).metadata?.tenantId as string | undefined);
      if (customerId && tenantId) {
        await prisma.tenant
          .update({ where: { id: tenantId }, data: { stripeCustomerId: customerId } })
          .catch(() => void 0);
      }
    }

    if (type?.startsWith('customer.subscription.')) {
      const customerId: string | undefined = data.customer as string | undefined;
      let tenantId: string | undefined = undefined;

      if (customerId) {
        const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } });
        tenantId = tenant?.id ?? undefined;
      }
      if (!tenantId) {
        tenantId = ((data as any).metadata?.tenantId as string | undefined) || undefined;
      }

      if (tenantId) {
        const stripeStatus = String(data.status || '').toLowerCase();
        const statusMap: Record<string, 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED'> = {
          active: 'ACTIVE',
          trialing: 'TRIALING',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
          unpaid: 'PAST_DUE',
          incomplete: 'PAST_DUE',
          incomplete_expired: 'CANCELED',
          paused: 'PAST_DUE',
        };
        const mapped = statusMap[stripeStatus] || 'PAST_DUE';

        if (mapped === 'ACTIVE' || mapped === 'TRIALING') {
          await BillingSyncService.setTenantSubscription(tenantId, planName.toUpperCase(), seats, {
            stripeSubscriptionId: subscriptionId,
            source: 'webhook',
          });
        } else {
          // Update status and store stripeSubscriptionId without changing plan/seats
          const existing = await prisma.subscription.findFirst({ where: { tenantId } });
          if (existing) {
            await prisma.subscription.update({
              where: { id: existing.id },
              data: { status: mapped, stripeSubscriptionId: subscriptionId },
            });
          } else {
            // Create a placeholder record with FREE plan linkage if none exists
            const plan = await prisma.plan.upsert({
              where: { name: 'FREE' },
              update: { tier: 'FREE', active: true },
              create: { name: 'FREE', tier: 'FREE', active: true },
            });
            await prisma.subscription.create({
              data: {
                tenantId,
                planId: plan.id,
                status: mapped,
                seats,
                stripeSubscriptionId: subscriptionId,
              },
            });
          }
          // Optional: turn off entitlements on cancellation
          if (mapped === 'CANCELED') {
            await prisma.entitlement.updateMany({ where: { tenantId }, data: { enabled: false } });
          }
        }
      }
    }

    return new Response('ok', { status: 200 });
  } catch (e: unknown) {
    if (useSignature) {
      return new Response('invalid signature', { status: 400 });
    }
    return new Response('bad payload', { status: 400 });
  }
}
