import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function isStandaloneNow() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return true;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own flag for "launched from home screen"
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export type DeviceOs = 'ios' | 'android' | 'other';

export function detectOs(): DeviceOs {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

/** Reactive standalone-mode check — re-evaluates if the display mode changes
 * (e.g. right after the user installs the app while it's still open). */
export function useStandalone() {
  const [standalone, setStandalone] = useState(isStandaloneNow());

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = () => setStandalone(isStandaloneNow());
    mql.addEventListener?.('change', handler);
    window.addEventListener('appinstalled', handler);
    return () => {
      mql.removeEventListener?.('change', handler);
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  return standalone;
}
