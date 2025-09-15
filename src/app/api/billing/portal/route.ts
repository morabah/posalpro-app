
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { createRoute } from '@/lib/api/route';
import { getStripe, isStripeReady } from '@/lib/billing/stripe';
import { prisma } from '@/lib/db/prisma';

export const POST = createRoute({ requireAuth: true, apiVersion: '1' }, async ({ user }) => {
  if (!isStripeReady()) return new Response('Billing not configured', { status: 501 });
  const stripe = await getStripe();
  // Look up Stripe customer from the current tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: (user as any).tenantId } });
  if (!tenant?.stripeCustomerId) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'missing_stripe_customer',
        message: 'No Stripe customer mapped for this tenant. Start a checkout first.',
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
  });
  return new Response(JSON.stringify({ url: portal.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
