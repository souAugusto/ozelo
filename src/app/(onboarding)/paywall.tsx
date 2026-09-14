import { IconCircle, IconCircleCheckFilled } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthProvider';
import { useOnboarding } from '@/context/OnboardingContext';
import { showAlert } from '@/lib/alert';
import { redeemPromoCode, startCheckout } from '@/lib/stripe';
import { Colors, Gradient, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { SubscriptionPlan } from '@/types/database';

export default function PaywallStep() {
  const { session, refreshProfile } = useAuth();
  const { answers, update } = useOnboarding();
  const selectedPlan = answers.selectedPlan;
  const selectPlan = (plan: SubscriptionPlan) => update('selectedPlan', plan);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [showPromoField, setShowPromoField] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  async function handleStart() {
    // A session already exists when someone lands here after confirming
    // their e-mail (or via the tabs guard) — skip account creation and
    // go straight to Stripe instead of showing the signup form again.
    if (!session) {
      router.push('/(onboarding)/create-account');
      return;
    }
    setStartingCheckout(true);
    try {
      await startCheckout(selectedPlan);
    } catch (error) {
      showAlert('Não foi possível iniciar o pagamento', (error as Error).message);
    } finally {
      setStartingCheckout(false);
    }
  }

  async function handleApplyPromo() {
    if (!session) {
      router.push('/(onboarding)/create-account');
      return;
    }
    setApplyingPromo(true);
    try {
      const days = await redeemPromoCode(promoCode);
      await refreshProfile();
      showAlert('Código aplicado!', `Você ganhou ${days} dias de acesso grátis.`);
      router.replace('/');
    } catch (error) {
      showAlert('Não foi possível aplicar o código', (error as Error).message);
    } finally {
      setApplyingPromo(false);
    }
  }

  return (
    <OnboardingScreen>
      <View style={styles.header}>
        <Text style={Typography.title}>Seu plano está pronto</Text>
      </View>

      <Pressable onPress={() => selectPlan('annual')}>
        <LinearGradient
          colors={Gradient.colors}
          start={Gradient.start}
          end={Gradient.end}
          style={styles.annualCard}
        >
          <Badge label="Economize 30%" style={styles.badge} />
          <View style={styles.planRow}>
            <View style={styles.planTextWrap}>
              <Text style={styles.planTitle}>Plano anual</Text>
              <Text style={styles.planPrice}>R$ 7,90/mês</Text>
              <Text style={styles.planNote}>Cobrado uma vez por ano</Text>
            </View>
            <IconCircleCheckFilled
              size={IconSize.lg + 6}
              color={selectedPlan === 'annual' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
            />
          </View>
        </LinearGradient>
      </Pressable>

      <Pressable onPress={() => selectPlan('monthly')}>
        <Card style={styles.monthlyCard}>
          <View style={styles.planRow}>
            <View style={styles.planTextWrap}>
              <Text style={styles.monthlyTitle}>Plano mensal</Text>
              <Text style={styles.monthlyPrice}>R$ 11,29/mês</Text>
            </View>
            {selectedPlan === 'monthly' ? (
              <IconCircleCheckFilled size={IconSize.lg + 6} color={Colors.accentMint} />
            ) : (
              <IconCircle size={IconSize.lg + 6} color={Colors.textSecondary} strokeWidth={1.5} />
            )}
          </View>
        </Card>
      </Pressable>

      <View style={styles.footer}>
        <PrimaryButton label="Começar agora" loading={startingCheckout} onPress={handleStart} />
        <Text style={styles.disclaimer}>Cancele quando quiser · sem compromisso</Text>

        {showPromoField ? (
          <View style={styles.promoRow}>
            <View style={styles.promoInputWrap}>
              <Input
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder="Código promocional"
                autoCapitalize="characters"
              />
            </View>
            <SecondaryButton
              label="Aplicar"
              loading={applyingPromo}
              disabled={!promoCode.trim()}
              onPress={handleApplyPromo}
            />
          </View>
        ) : (
          <Pressable onPress={() => setShowPromoField(true)}>
            <Text style={styles.promoLink}>Tenho um código promocional</Text>
          </Pressable>
        )}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  annualCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  monthlyCard: {
    backgroundColor: Colors.card,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTextWrap: {
    gap: 2,
  },
  planTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  planPrice: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  planNote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  monthlyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  monthlyPrice: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    gap: Spacing.sm,
    marginTop: 'auto',
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: 'center',
  },
  promoLink: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  promoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  promoInputWrap: {
    flex: 1,
  },
});
