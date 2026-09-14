// Stripe webhook: keeps public.subscriptions in sync with the real
// subscription status so the app can gate access (active/past_due/canceled).
// Configure this function's URL as the endpoint in the Stripe Dashboard and
// set STRIPE_WEBHOOK_SECRET to the signing secret it gives you.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import type Stripe from 'npm:stripe@17';

import { stripe } from '../_shared/stripe.ts';

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function planFromPriceId(priceId: string | undefined) {
  if (priceId === Deno.env.get('STRIPE_PRICE_ANNUAL')) return 'annual';
  if (priceId === Deno.env.get('STRIPE_PRICE_MONTHLY')) return 'monthly';
  return null;
}

async function upsertFromSubscription(subscription: Stripe.Subscription, userId?: string | null) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  let resolvedUserId = userId ?? subscription.metadata?.supabase_user_id ?? null;

  if (!resolvedUserId) {
    const { data: existing } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    resolvedUserId = existing?.user_id ?? null;
  }

  if (!resolvedUserId) {
    console.error('Could not resolve a Supabase user for Stripe customer', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;

  await admin.from('subscriptions').upsert(
    {
      user_id: resolvedUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan: planFromPriceId(priceId),
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: 'user_id' }
  );
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed', error);
    return new Response(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertFromSubscription(subscription, session.client_reference_id);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertFromSubscription(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscriptionId =
            typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertFromSubscription(subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Error handling Stripe webhook event', event.type, error);
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
