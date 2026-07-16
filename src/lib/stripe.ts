import "server-only";
import Stripe from "stripe";

/**
 * Server-side Stripe client. Configure STRIPE_SECRET_KEY in the deployment
 * environment (test key sk_test_… first, swap to sk_live_… when going live).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
