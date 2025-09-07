let _stripe: any | null = null;

export async function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured');
  try {
    const { default: Stripe } = await import('stripe');
    _stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
    return _stripe;
  } catch (e) {
    throw new Error('Stripe SDK not installed');
  }
}

export function isStripeReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
