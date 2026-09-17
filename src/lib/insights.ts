import { dateKey } from '@/lib/calendarData';
import { supabase } from '@/lib/supabase';
import type { BodyMeasurement, Profile, Symptom } from '@/types/database';

const SYMPTOM_LABEL: Record<Symptom, string> = {
  nausea: 'Náusea',
  reflux: 'Refluxo',
  headache: 'Dor de cabeça',
  dizziness: 'Tontura',
  fatigue: 'Fadiga',
  difficulty_eating: 'Dificuldade pra comer o suficiente',
};

const LOOKBACK_DAYS = 56; // 8 weeks

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export type InsightsBundle = {
  weeklySummary: string;
  symptomTimingInsights: string[];
  hydrationSymptomInsight: string | null;
  adherenceProgressInsight: string | null;
  periodLabel: string;
  raw: {
    medicationCount: number;
    symptomCount: number;
    bowelCount: number;
    measurements: BodyMeasurement[];
  };
};

export async function buildInsights(userId: string, profile: Profile | null): Promise<InsightsBundle> {
  const waterGoal = profile?.water_goal_ml ?? 2000;
  const proteinGoal = profile?.protein_goal_g ?? 90;
  const sinceIso = daysAgoIso(LOOKBACK_DAYS);
  const weekAgoIso = daysAgoIso(7);

  const [medication, symptoms, bowel, hydration, meals, measurements] = await Promise.all([
    supabase.from('medication_logs').select('*').eq('user_id', userId).gte('applied_at', sinceIso),
    supabase.from('symptom_logs').select('*').eq('user_id', userId).gte('logged_at', sinceIso),
    supabase.from('bowel_logs').select('*').eq('user_id', userId).gte('logged_at', sinceIso),
    supabase.from('hydration_logs').select('*').eq('user_id', userId).gte('logged_at', sinceIso),
    supabase.from('meals').select('*').eq('user_id', userId).gte('logged_at', sinceIso),
    supabase.from('body_measurements').select('*').eq('user_id', userId).order('measured_at', { ascending: true }),
  ]);
  for (const res of [medication, symptoms, bowel, hydration, meals, measurements]) {
    if (res.error) throw res.error;
  }

  const medicationLogs = medication.data ?? [];
  const symptomLogs = symptoms.data ?? [];
  const bowelLogs = bowel.data ?? [];
  const hydrationLogs = hydration.data ?? [];
  const mealLogs = meals.data ?? [];
  const allMeasurements = measurements.data ?? [];

  // --- Weekly summary (last 7 days) ---------------------------------------
  const weekMedication = medicationLogs.filter((l) => l.applied_at >= weekAgoIso).length;
  const weekSymptoms = symptomLogs.filter((l) => l.logged_at >= weekAgoIso);
  const weekBowel = bowelLogs.filter((l) => l.logged_at >= weekAgoIso).length;
  const hydrationByDay = sumByDay(hydrationLogs.filter((l) => l.logged_at >= weekAgoIso), 'logged_at', 'amount_ml');
  const daysWithHydrationGoal = Object.values(hydrationByDay).filter((total) => total >= waterGoal).length;

  const topSymptom = mostFrequent(weekSymptoms.map((s) => s.symptom));
  const weeklySummary = [
    `Nos últimos 7 dias: ${weekMedication} ${weekMedication === 1 ? 'aplicação registrada' : 'aplicações registradas'}, `,
    `${daysWithHydrationGoal} ${daysWithHydrationGoal === 1 ? 'dia' : 'dias'} com meta de hidratação batida, `,
    `${weekSymptoms.length} ${weekSymptoms.length === 1 ? 'sintoma registrado' : 'sintomas registrados'}`,
    topSymptom ? ` (principalmente ${SYMPTOM_LABEL[topSymptom as Symptom] ?? topSymptom})` : '',
    `, e controle intestinal registrado em ${weekBowel} ${weekBowel === 1 ? 'dia' : 'dias'}.`,
  ].join('');

  // --- Symptom timing vs medication -----------------------------------
  const symptomTimingInsights = buildSymptomTimingInsights(medicationLogs, symptomLogs);

  // --- Hydration vs symptoms --------------------------------------------
  const hydrationSymptomInsight = buildHydrationSymptomInsight(hydrationLogs, symptomLogs, waterGoal);

  // --- Adherence vs weight progress --------------------------------------
  const adherenceProgressInsight = buildAdherenceInsight(mealLogs, allMeasurements, proteinGoal);

  return {
    weeklySummary,
    symptomTimingInsights,
    hydrationSymptomInsight,
    adherenceProgressInsight,
    periodLabel: `Últimas ${Math.round(LOOKBACK_DAYS / 7)} semanas`,
    raw: {
      medicationCount: medicationLogs.length,
      symptomCount: symptomLogs.length,
      bowelCount: bowelLogs.length,
      measurements: allMeasurements,
    },
  };
}

function sumByDay<T extends Record<string, unknown>>(rows: T[], dateField: keyof T, valueField: keyof T) {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const key = dateKey(row[dateField] as string);
    map[key] = (map[key] ?? 0) + Number(row[valueField] ?? 0);
  }
  return map;
}

function mostFrequent<T extends string>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function buildSymptomTimingInsights(
  medicationLogs: { applied_at: string }[],
  symptomLogs: { symptom: Symptom; logged_at: string }[]
): string[] {
  if (medicationLogs.length === 0 || symptomLogs.length === 0) return [];

  const sortedDoses = [...medicationLogs].map((l) => new Date(l.applied_at).getTime()).sort((a, b) => a - b);

  const byType = new Map<Symptom, number[]>();
  for (const log of symptomLogs) {
    const logTime = new Date(log.logged_at).getTime();
    // Most recent dose at or before this symptom.
    let lastDose: number | null = null;
    for (const doseTime of sortedDoses) {
      if (doseTime <= logTime) lastDose = doseTime;
      else break;
    }
    if (lastDose === null) continue;
    const daysSince = Math.floor((logTime - lastDose) / (1000 * 60 * 60 * 24));
    if (!byType.has(log.symptom)) byType.set(log.symptom, []);
    byType.get(log.symptom)!.push(daysSince);
  }

  const insights: string[] = [];
  for (const [symptom, daysList] of byType) {
    if (daysList.length < 2) continue;
    const within2Days = daysList.filter((d) => d <= 2).length;
    const ratio = within2Days / daysList.length;
    if (ratio >= 0.6) {
      insights.push(
        `Você relatou ${SYMPTOM_LABEL[symptom]} nos 2 dias seguintes à aplicação em ${within2Days} de ${daysList.length} registros, no período analisado.`
      );
    }
  }
  return insights;
}

function buildHydrationSymptomInsight(
  hydrationLogs: { logged_at: string; amount_ml: number }[],
  symptomLogs: { logged_at: string }[],
  waterGoal: number
): string | null {
  const hydrationByDay = sumByDay(hydrationLogs, 'logged_at', 'amount_ml');
  const symptomDays = new Set(symptomLogs.map((s) => dateKey(s.logged_at)));

  if (symptomDays.size < 2) return null;

  let symptomDaysBelowGoal = 0;
  let symptomDaysWithData = 0;
  for (const day of symptomDays) {
    if (hydrationByDay[day] === undefined) continue;
    symptomDaysWithData += 1;
    if (hydrationByDay[day] < waterGoal) symptomDaysBelowGoal += 1;
  }

  const nonSymptomDays = Object.keys(hydrationByDay).filter((day) => !symptomDays.has(day));
  const nonSymptomBelowGoal = nonSymptomDays.filter((day) => hydrationByDay[day] < waterGoal).length;

  if (symptomDaysWithData < 2 || nonSymptomDays.length < 2) return null;

  const symptomRate = symptomDaysBelowGoal / symptomDaysWithData;
  const nonSymptomRate = nonSymptomBelowGoal / nonSymptomDays.length;

  if (symptomRate - nonSymptomRate >= 0.2) {
    return `Em ${Math.round(symptomRate * 100)}% dos dias com sintomas registrados, a meta de hidratação não foi batida — contra ${Math.round(nonSymptomRate * 100)}% nos demais dias.`;
  }
  return null;
}

function buildAdherenceInsight(
  meals: { protein_g: number; logged_at: string }[],
  measurements: BodyMeasurement[],
  proteinGoal: number
): string | null {
  const weighed = measurements.filter((m) => m.weight_kg !== null);
  if (weighed.length < 3) return null;

  const proteinByDay = sumByDay(meals, 'logged_at', 'protein_g');

  // Bucket measurements into "weeks" using the gap between consecutive readings.
  const weeks: { start: string; end: string; weightDelta: number }[] = [];
  for (let i = 1; i < weighed.length; i++) {
    const prev = weighed[i - 1];
    const curr = weighed[i];
    weeks.push({
      start: prev.measured_at,
      end: curr.measured_at,
      weightDelta: Number(curr.weight_kg) - Number(prev.weight_kg),
    });
  }

  function adherenceRate(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    let metDays = 0;
    const cursor = new Date(start);
    while (cursor < end) {
      const key = dateKey(cursor.toISOString());
      if ((proteinByDay[key] ?? 0) >= proteinGoal) metDays += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return metDays / totalDays;
  }

  const withAdherence = weeks.map((w) => ({ ...w, adherence: adherenceRate(w.start, w.end) }));
  const highAdherence = withAdherence.filter((w) => w.adherence >= 0.7);
  const lowAdherence = withAdherence.filter((w) => w.adherence < 0.7);

  if (highAdherence.length < 1 || lowAdherence.length < 1) return null;

  const avg = (arr: typeof withAdherence) => arr.reduce((sum, w) => sum + w.weightDelta, 0) / arr.length;
  const highAvg = avg(highAdherence);
  const lowAvg = avg(lowAdherence);

  if (highAvg < lowAvg - 0.1) {
    return `Nos períodos com adesão à meta de proteína acima de 70%, a variação média de peso foi de ${highAvg.toFixed(1)}kg, contra ${lowAvg.toFixed(1)}kg nos períodos de menor adesão.`;
  }
  return null;
}
