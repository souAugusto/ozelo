import { IconDownload, IconShare2, IconX } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Colors, Gradient, IconSize, Radius, Spacing, Typography } from '@/constants/theme';

const DISMISS_KEY = 'ozelo:install-prompt-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone() {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own flag for "launched from home screen"
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Custom "Add to Home Screen" banner instead of relying on the browser's own
 * prompt: Android/Chrome gets a real install trigger via beforeinstallprompt,
 * iOS Safari (which never fires that event) gets instructions instead, since
 * there is no programmatic install API there.
 */
export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === 'true') return;
    } catch {
      // localStorage unavailable (private mode) — just don't persist dismissal
    }

    setDismissed(false);

    if (isIos()) {
      setShowIosInstructions(true);
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
  }

  async function handleInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
    dismiss();
  }

  if (Platform.OS !== 'web' || dismissed || (!deferredEvent && !showIosInstructions)) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <LinearGradient colors={Gradient.colors} start={Gradient.start} end={Gradient.end} style={styles.card}>
        <View style={styles.iconWrap}>
          {showIosInstructions ? (
            <IconShare2 size={IconSize.lg} color="#FFFFFF" strokeWidth={1.75} />
          ) : (
            <IconDownload size={IconSize.lg} color="#FFFFFF" strokeWidth={1.75} />
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Instale o Ozelo</Text>
          <Text style={styles.message}>
            {showIosInstructions
              ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'
              : 'Adicione à tela inicial para abrir em tela cheia, como um app.'}
          </Text>
        </View>
        {!showIosInstructions && (
          <Pressable style={styles.installButton} onPress={handleInstall}>
            <Text style={styles.installLabel}>Adicionar</Text>
          </Pressable>
        )}
        <Pressable onPress={dismiss} hitSlop={8} style={styles.closeButton}>
          <IconX size={IconSize.md} color="#FFFFFF" strokeWidth={1.75} />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    maxWidth: 480,
    width: '100%',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  message: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  installButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  installLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  closeButton: {
    padding: 2,
  },
});
