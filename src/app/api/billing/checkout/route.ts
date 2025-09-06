import { createRoute } from '@/lib/api/route';
import { isStripeReady, getStripe } from '@/lib/billing/stripe';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { User } from '@/lib/auth';

const Body = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const POST = createRoute(
  { requireAuth: true, body: Body, apiVersion: '1' },
  async ({ body, user }) => {
    const userWithTenant = user as typeof user & { tenantId: string };
    if (!isStripeReady()) {
      return new Response('Billing not configured', { status: 501 });
    }
    const stripe = getStripe();
    const tenant = await prisma.tenant.findUnique({ where: { id: userWithTenant.tenantId } });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: body!.priceId, quantity: 1 }],
      success_url:
        body!.successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/success`,
      cancel_url:
        body!.cancelUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/cancel`,
      client_reference_id: `${userWithTenant.tenantId}`,
      metadata: { tenantId: userWithTenant.tenantId, userId: user.id },
      ...(tenant?.stripeCustomerId ? { customer: tenant.stripeCustomerId } : {}),
    });
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
);
