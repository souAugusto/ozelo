// Runs every 15 minutes (via pg_cron + pg_net, see migration 0007) and sends
// Web Push reminders: medication application time, an evening hydration
// nudge if today's goal isn't met yet, and a diary nudge if no meal was
// logged today. Triggered by Postgres, not a Supabase user — protected by a
// shared secret header instead of a JWT.
//
// MVP simplification: all users are assumed to be in America/Sao_Paulo
// (UTC-3, no DST since 2019) since Ozelo doesn't collect a timezone yet.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const CRON_SECRET = Deno.env.get('CRON_SECRET')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const BRT_OFFSET_HOURS = 3; // America/Sao_Paulo is UTC-3 year-round since 2019.
const WINDOW_MINUTES = 15;

function nowInBrt() {
  return new Date(Date.now() - BRT_OFFSET_HOURS * 60 * 60 * 1000);
}

function brtDayBoundsUtc(brtNow: Date) {
  // UTC getters: brtNow is Date.now() shifted by -3h, so its wall-clock value
  // is only meaningful read as UTC. Local getters would additionally apply
  // whatever timezone the runtime happens to be in.
  const y = brtNow.getUTCFullYear();
  const m = brtNow.getUTCMonth();
  const d = brtNow.getUTCDate();
  const startUtc = new Date(Date.UTC(y, m, d, BRT_OFFSET_HOURS, 0, 0, 0));
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

function minutesOfDay(hhmmss: string) {
  const [h, m] = hhmmss.split(':').map(Number);
  return h * 60 + m;
}

function withinWindow(targetMinutes: number, nowMinutes: number) {
  return targetMinutes >= nowMinutes && targetMinutes < nowMinutes + WINDOW_MINUTES;
}

type ReminderType = 'medication' | 'hydration' | 'diary';

const NOTIFICATION_COPY: Record<ReminderType, { title: string; body: string; url: string }> = {
  medication: {
    title: 'Hora da sua aplicação',
    body: 'Não esqueça de registrar a aplicação de hoje no Ozelo.',
    url: '/app',
  },
  hydration: {
    title: 'Bora beber água?',
    body: 'Você ainda não bateu sua meta de hidratação hoje.',
    url: '/app',
  },
  diary: {
    title: 'Como foi sua alimentação hoje?',
    body: 'Registre o que você comeu hoje no diário alimentar.',
    url: '/app/(tabs)/nutrition',
  },
};

async function sendToUser(userId: string, type: ReminderType) {
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify(NOTIFICATION_COPY[type]);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('push send failed', userId, type, error);
        }
      }
    })
  );
}

/** Inserts the dedup row first; only proceeds to send if this is the first
 * time today this (user, type) pair fires. */
async function tryClaimAndSend(userId: string, type: ReminderType, todayDate: string) {
  const { error } = await admin
    .from('reminder_sends')
    .insert({ user_id: userId, reminder_type: type, sent_date: todayDate });
  if (error) return; // unique violation = already sent today (or a real error either way, skip)
  await sendToUser(userId, type);
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const brtNow = nowInBrt();
  const nowMinutes = brtNow.getUTCHours() * 60 + brtNow.getUTCMinutes();
  const todayDate = brtNow.toISOString().slice(0, 10);
  const { startUtc, endUtc } = brtDayBoundsUtc(brtNow);

  const { data: profiles, error } = await admin
    .from('profiles')
    .select(
      'id, next_medication_at, water_goal_ml, water_reminder_enabled, water_reminder_check_time, diary_reminder_enabled, diary_reminder_time, notification_permission'
    )
    .eq('notification_permission', 'granted');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const nowMs = Date.now();
  let sent = 0;

  for (const profile of profiles ?? []) {
    const tasks: Promise<void>[] = [];

    // Medication is scheduled as an absolute timestamp (set when the user
    // saves their recurrence, and recomputed after each logged dose) rather
    // than a daily time-of-day, so this is a direct instant comparison —
    // no BRT arithmetic needed for this one.
    if (profile.next_medication_at) {
      const dueAt = new Date(profile.next_medication_at).getTime();
      if (dueAt >= nowMs && dueAt < nowMs + WINDOW_MINUTES * 60 * 1000) {
        tasks.push(tryClaimAndSend(profile.id, 'medication', todayDate).then(() => void sent++));
      }
    }

    if (
      profile.water_reminder_enabled &&
      profile.water_reminder_check_time &&
      withinWindow(minutesOfDay(profile.water_reminder_check_time), nowMinutes)
    ) {
      tasks.push(
        (async () => {
          const { data: hydration } = await admin
            .from('hydration_logs')
            .select('amount_ml')
            .eq('user_id', profile.id)
            .gte('logged_at', startUtc.toISOString())
            .lt('logged_at', endUtc.toISOString());
          const total = (hydration ?? []).reduce((sum, row) => sum + Number(row.amount_ml ?? 0), 0);
          if (total < (profile.water_goal_ml ?? 2000)) {
            await tryClaimAndSend(profile.id, 'hydration', todayDate);
            sent++;
          }
        })()
      );
    }

    if (
      profile.diary_reminder_enabled &&
      profile.diary_reminder_time &&
      withinWindow(minutesOfDay(profile.diary_reminder_time), nowMinutes)
    ) {
      tasks.push(
        (async () => {
          const { count } = await admin
            .from('meals')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .gte('logged_at', startUtc.toISOString())
            .lt('logged_at', endUtc.toISOString());
          if (!count) {
            await tryClaimAndSend(profile.id, 'diary', todayDate);
            sent++;
          }
        })()
      );
    }

    await Promise.all(tasks);
  }

  return new Response(JSON.stringify({ checked: profiles?.length ?? 0, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
