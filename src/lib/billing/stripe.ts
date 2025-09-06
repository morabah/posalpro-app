let _stripe: any | null = null;

export function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    _stripe = new Stripe(key, { apiVersion: '2024-04-10' });
    return _stripe;
  } catch (e) {
    throw new Error('Stripe SDK not installed');
  }
}

export function isStripeReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

