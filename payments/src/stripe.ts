import Stripe from 'stripe';

const key = process.env.STRIPE_KEY!;
export const stripe = new Stripe(key, {
  apiVersion: '2020-08-27',
});
