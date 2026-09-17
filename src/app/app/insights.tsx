import { IconDroplet, IconFileDownload, IconScale, IconSparkles, IconStethoscope } from '@tabler/icons-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthProvider';
import { showAlert } from '@/lib/alert';
import { buildReportHtml } from '@/lib/buildReportHtml';
import { exportReportAsPdf } from '@/lib/exportReport';
import { buildInsights, type InsightsBundle } from '@/lib/insights';
import { Colors, IconSize, Spacing, Typography } from '@/constants/theme';

export default function InsightsScreen() {
  const { session, profile } = useAuth();
  const [insights, setInsights] = useState<InsightsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const reload = useCallback(() => {
    if (!session) return;
    setLoading(true);
    buildInsights(session.user.id, profile)
      .then(setInsights)
      .finally(() => setLoading(false));
  }, [session, profile]);

  useFocusEffect(reload);

  async function handleExport() {
    if (!session) return;
    setExporting(true);
    try {
      const data = insights ?? (await buildInsights(session.user.id, profile));
      const html = buildReportHtml(profile, data);
      await exportReportAsPdf(html);
    } catch (error) {
      showAlert('Não foi possível exportar', (error as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Resumo" />
      <ScrollView contentContainerStyle={styles.content}>
        <GradientCard>
          <View style={styles.summaryHeader}>
            <IconSparkles size={IconSize.md} color="#FFFFFF" strokeWidth={1.75} />
            <Text style={styles.summaryLabel}>Resumo da semana</Text>
          </View>
          <Text style={styles.summaryText}>
            {loading ? 'Calculando...' : insights?.weeklySummary}
          </Text>
        </GradientCard>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconStethoscope size={IconSize.md} color={Colors.accentCoral} strokeWidth={1.75} />
            <Text style={Typography.label}>Sintomas x medicação</Text>
          </View>
          {loading ? (
            <Text style={styles.muted}>Calculando...</Text>
          ) : insights && insights.symptomTimingInsights.length > 0 ? (
            insights.symptomTimingInsights.map((text, i) => (
              <Text key={i} style={styles.insightText}>
                • {text}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>Ainda não há dados suficientes pra identificar um padrão.</Text>
          )}
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconDroplet size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
            <Text style={Typography.label}>Hidratação x sintomas</Text>
          </View>
          <Text style={insights?.hydrationSymptomInsight ? styles.insightText : styles.muted}>
            {loading ? 'Calculando...' : insights?.hydrationSymptomInsight ?? 'Ainda não há dados suficientes pra essa correlação.'}
          </Text>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconScale size={IconSize.md} color={Colors.accentAmber} strokeWidth={1.75} />
            <Text style={Typography.label}>Progresso x adesão</Text>
          </View>
          <Text style={insights?.adherenceProgressInsight ? styles.insightText : styles.muted}>
            {loading
              ? 'Calculando...'
              : insights?.adherenceProgressInsight ?? 'Registre mais medidas ao longo do tempo pra ver essa correlação.'}
          </Text>
        </Card>

        <PrimaryButton
          label="Exportar relatório em PDF"
          loading={exporting}
          onPress={handleExport}
        />
        <View style={styles.exportNote}>
          <IconFileDownload size={IconSize.sm} color={Colors.textMuted} strokeWidth={1.75} />
          <Text style={styles.exportNoteText}>Útil para levar à sua consulta médica.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  insightText: {
    ...Typography.body,
  },
  muted: {
    ...Typography.bodySecondary,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  exportNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
  },
  exportNoteText: {
    ...Typography.caption,
  },
});
