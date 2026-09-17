import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { NotificationPermissionStatus } from '@/types/database';

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported() {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function updateNotificationPermissionStatus(userId: string, status: NotificationPermissionStatus) {
  await supabase.from('profiles').update({ notification_permission: status }).eq('id', userId);
}

/** Requests browser notification permission, then (if granted) subscribes
 * to Web Push and persists the subscription so the backend can reach this
 * device. Records the permission outcome on the profile either way. */
export async function requestNotificationPermissionAndSubscribe(userId: string) {
  if (!isPushSupported()) {
    throw new Error('Este navegador não suporta notificações push.');
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Chave VAPID pública não configurada.');
  }

  const permission = await Notification.requestPermission();
  await updateNotificationPermissionStatus(userId, permission === 'granted' ? 'granted' : 'denied');

  if (permission !== 'granted') {
    return permission;
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Assinatura de push inválida.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;

  return permission;
}
