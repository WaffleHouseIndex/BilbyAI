import Stripe from 'stripe';

let cachedStripe = null;

function getStripeSecret() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === '...') {
    throw new Error('STRIPE_SECRET_KEY must be set');
  }
  return key;
}

export function getStripeClient() {
  if (cachedStripe) return cachedStripe;
  const apiVersion = process.env.STRIPE_API_VERSION || '2024-09-30.acacia';
  cachedStripe = new Stripe(getStripeSecret(), {
    apiVersion,
  });
  return cachedStripe;
}

export function computeAppBaseUrl() {
  const configured = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export function getCheckoutSuccessUrl() {
  return process.env.STRIPE_SUCCESS_URL || `${computeAppBaseUrl()}/login?status=checkout-success`;
}

export function getCheckoutCancelUrl() {
  return process.env.STRIPE_CANCEL_URL || `${computeAppBaseUrl()}?status=checkout-cancelled`;
}
