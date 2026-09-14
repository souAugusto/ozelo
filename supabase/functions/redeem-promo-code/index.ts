// Redeems a promo code: grants `duration_days` of access by writing a
// "trialing" subscription row directly, skipping Stripe entirely. One
// redemption per user, enforced by the unique(user_id) constraint on
// promo_redemptions.
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Informe um código' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const normalizedCode = code.trim().toUpperCase();

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: existingRedemption } = await admin
      .from('promo_redemptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingRedemption) {
      return new Response(JSON.stringify({ error: 'Você já usou um código promocional nessa conta' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: promo, error: promoError } = await admin
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (promoError || !promo || !promo.active) {
      return new Response(JSON.stringify({ error: 'Código inválido' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Esse código expirou' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (promo.max_redemptions !== null && promo.redemption_count >= promo.max_redemptions) {
      return new Response(JSON.stringify({ error: 'Esse código já atingiu o limite de usos' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const periodEnd = new Date(Date.now() + promo.duration_days * 24 * 60 * 60 * 1000).toISOString();

    const { error: upsertError } = await admin.from('subscriptions').upsert(
      {
        user_id: user.id,
        status: 'trialing',
        current_period_end: periodEnd,
        cancel_at_period_end: true,
      },
      { onConflict: 'user_id' }
    );
    if (upsertError) throw upsertError;

    await admin.from('promo_redemptions').insert({ user_id: user.id, code: normalizedCode });
    await admin
      .from('promo_codes')
      .update({ redemption_count: promo.redemption_count + 1 })
      .eq('code', normalizedCode);

    return new Response(JSON.stringify({ success: true, daysGranted: promo.duration_days }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
