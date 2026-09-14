import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { SubscriptionPlan } from '@/types/database';

async function openCheckoutUrl(url: string) {
  if (Platform.OS === 'web') {
    window.location.assign(url);
    return;
  }
  await WebBrowser.openAuthSessionAsync(url, 'ozelo://paywall-success');
}

/** Starts a Stripe Checkout session for the chosen plan and opens it. */
export async function startCheckout(plan: SubscriptionPlan) {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    'create-checkout-session',
    { body: { plan } }
  );

  if (error) throw error;
  if (!data?.url) throw new Error(data?.error ?? 'Stripe did not return a checkout URL');

  await openCheckoutUrl(data.url);
}

/** Redeems a promo code, granting access without going through Stripe. */
export async function redeemPromoCode(code: string) {
  const { data, error } = await supabase.functions.invoke<{
    success?: boolean;
    daysGranted?: number;
    error?: string;
  }>('redeem-promo-code', { body: { code } });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Não foi possível aplicar o código');
  return data.daysGranted!;
}

/** Opens the Stripe customer portal so the user can manage or cancel their plan. */
export async function openBillingPortal() {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    'create-portal-session',
    { body: {} }
  );

  if (error) throw error;
  if (!data?.url) throw new Error(data?.error ?? 'Stripe did not return a portal URL');

  await openCheckoutUrl(data.url);
}
