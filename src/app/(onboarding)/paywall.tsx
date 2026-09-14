import { IconCircle, IconCircleCheckFilled } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Colors, Gradient, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { SubscriptionPlan } from '@/types/database';

export default function PaywallStep() {
  const { answers, update } = useOnboarding();
  const selectedPlan = answers.selectedPlan;
  const selectPlan = (plan: SubscriptionPlan) => update('selectedPlan', plan);

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
        <PrimaryButton
          label="Começar agora"
          onPress={() => router.push('/(onboarding)/create-account')}
        />
        <Text style={styles.disclaimer}>Cancele quando quiser · sem compromisso</Text>
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
});
