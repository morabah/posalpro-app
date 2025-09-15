
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { createRoute } from '@/lib/api/route';
import { getStripe, isStripeReady } from '@/lib/billing/stripe';
import { prisma } from '@/lib/prisma';
import { getErrorHandler } from '@/server/api/errorHandler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Body = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const POST = createRoute(
  { requireAuth: true, body: Body, apiVersion: '1' },
  async ({ body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'BillingCheckoutAPI',
      operation: 'POST',
    });

    const userWithTenant = user as typeof user & { tenantId: string };

    // Check if Stripe is configured
    if (!isStripeReady()) {
      const error = new Error('Billing service is not configured');
      (error as any).code = 'API.SERVICE_UNAVAILABLE';
      throw error;
    }

    const stripe = await getStripe();

    // Fetch tenant information
    const tenant = await prisma.tenant.findUnique({
      where: { id: userWithTenant.tenantId },
    });

    if (!tenant) {
      const error = new Error('Tenant not found');
      (error as any).code = 'DATA.NOT_FOUND';
      throw error;
    }

    // Create Stripe checkout session
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
      ...((tenant as any).stripeCustomerId ? { customer: (tenant as any).stripeCustomerId } : {}),
    });

    return errorHandler.createSuccessResponse(
      { url: session.url },
      'Checkout session created successfully'
    );
  }
);
