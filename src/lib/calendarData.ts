import { supabase } from '@/lib/supabase';
import type { BowelLog, Meal, MedicationLog, SymptomLog } from '@/types/database';

export type DayIndicators = {
  medicationApplied: boolean;
  hydrationGoalMet: boolean;
  symptomLogged: boolean;
  bowelLogged: boolean;
};

export type DayRecords = {
  medicationLogs: MedicationLog[];
  meals: Meal[];
  hydrationMl: number;
  symptomLogs: SymptomLog[];
  bowelLogs: BowelLog[];
};

/** Local YYYY-MM-DD key — deliberately uses the device's local time, not UTC,
 * so a log made at 11pm still counts for "today" from the user's perspective. */
export function dateKey(iso: string) {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/** Fetches every record type for a given month and groups it by local day,
 * so the calendar can render indicator dots and a per-day summary sheet. */
export async function getMonthCalendarData(
  userId: string,
  year: number,
  month: number,
  waterGoalMl: number
) {
  const { startIso, endIso } = monthRange(year, month);

  const [medication, meals, hydration, symptoms, bowel] = await Promise.all([
    supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('applied_at', startIso)
      .lt('applied_at', endIso),
    supabase.from('meals').select('*').eq('user_id', userId).gte('logged_at', startIso).lt('logged_at', endIso),
    supabase
      .from('hydration_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startIso)
      .lt('logged_at', endIso),
    supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startIso)
      .lt('logged_at', endIso),
    supabase.from('bowel_logs').select('*').eq('user_id', userId).gte('logged_at', startIso).lt('logged_at', endIso),
  ]);

  if (medication.error) throw medication.error;
  if (meals.error) throw meals.error;
  if (hydration.error) throw hydration.error;
  if (symptoms.error) throw symptoms.error;
  if (bowel.error) throw bowel.error;

  const recordsByDate: Record<string, DayRecords> = {};

  function dayFor(key: string): DayRecords {
    if (!recordsByDate[key]) {
      recordsByDate[key] = { medicationLogs: [], meals: [], hydrationMl: 0, symptomLogs: [], bowelLogs: [] };
    }
    return recordsByDate[key];
  }

  (medication.data ?? []).forEach((log) => dayFor(dateKey(log.applied_at)).medicationLogs.push(log));
  (meals.data ?? []).forEach((meal) => dayFor(dateKey(meal.logged_at)).meals.push(meal));
  (hydration.data ?? []).forEach((log) => {
    dayFor(dateKey(log.logged_at)).hydrationMl += Number(log.amount_ml ?? 0);
  });
  (symptoms.data ?? []).forEach((log) => dayFor(dateKey(log.logged_at)).symptomLogs.push(log));
  (bowel.data ?? []).forEach((log) => dayFor(dateKey(log.logged_at)).bowelLogs.push(log));

  const indicatorsByDate: Record<string, DayIndicators> = {};
  for (const [key, day] of Object.entries(recordsByDate)) {
    indicatorsByDate[key] = {
      medicationApplied: day.medicationLogs.length > 0,
      hydrationGoalMet: day.hydrationMl >= waterGoalMl,
      symptomLogged: day.symptomLogs.length > 0,
      bowelLogged: day.bowelLogs.length > 0,
    };
  }

  return { indicatorsByDate, recordsByDate };
}

/** Consecutive days (ending today or yesterday) with both the hydration and
 * protein goals met — a simple streak counter for the calendar header. */
export async function getWellnessStreak(
  userId: string,
  waterGoalMl: number,
  proteinGoalG: number,
  lookbackDays = 60
) {
  const start = new Date();
  start.setDate(start.getDate() - lookbackDays);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const [{ data: hydrationRows, error: hydrationError }, { data: mealRows, error: mealError }] = await Promise.all([
    supabase.from('hydration_logs').select('amount_ml, logged_at').eq('user_id', userId).gte('logged_at', startIso),
    supabase.from('meals').select('protein_g, logged_at').eq('user_id', userId).gte('logged_at', startIso),
  ]);
  if (hydrationError) throw hydrationError;
  if (mealError) throw mealError;

  const hydrationByDay = new Map<string, number>();
  (hydrationRows ?? []).forEach((row) => {
    const key = dateKey(row.logged_at);
    hydrationByDay.set(key, (hydrationByDay.get(key) ?? 0) + Number(row.amount_ml ?? 0));
  });
  const proteinByDay = new Map<string, number>();
  (mealRows ?? []).forEach((row) => {
    const key = dateKey(row.logged_at);
    proteinByDay.set(key, (proteinByDay.get(key) ?? 0) + Number(row.protein_g ?? 0));
  });

  const todayKey = dateKey(new Date().toISOString());
  const cursor = new Date();
  // If today isn't complete yet, start counting from yesterday instead so an
  // in-progress day doesn't break a streak that's otherwise intact.
  const todayMet = (hydrationByDay.get(todayKey) ?? 0) >= waterGoalMl && (proteinByDay.get(todayKey) ?? 0) >= proteinGoalG;
  if (!todayMet) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  for (let i = 0; i < lookbackDays; i++) {
    const key = dateKey(cursor.toISOString());
    const met = (hydrationByDay.get(key) ?? 0) >= waterGoalMl && (proteinByDay.get(key) ?? 0) >= proteinGoalG;
    if (!met) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
