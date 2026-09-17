import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/** Captures Chrome/Android's beforeinstallprompt event so a custom button
 * can trigger the real install flow instead of only showing instructions. */
export function useInstallPromptEvent() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function handle(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handle);
    return () => window.removeEventListener('beforeinstallprompt', handle);
  }, []);

  async function promptInstall() {
    if (!deferredEvent) return null;
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    setDeferredEvent(null);
    return choice.outcome;
  }

  return { canPromptInstall: !!deferredEvent, promptInstall };
}
