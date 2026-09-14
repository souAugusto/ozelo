import { supabase } from '@/lib/supabase';
import type { BowelType, Symptom, SymptomIntensity } from '@/types/database';

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function getTodayProteinTotal(userId: string) {
  const { data, error } = await supabase
    .from('meals')
    .select('protein_g')
    .eq('user_id', userId)
    .gte('logged_at', startOfToday());
  if (error) throw error;
  return (data ?? []).reduce((sum, meal) => sum + Number(meal.protein_g ?? 0), 0);
}

export async function getTodayHydrationTotal(userId: string) {
  const { data, error } = await supabase
    .from('hydration_logs')
    .select('amount_ml')
    .eq('user_id', userId)
    .gte('logged_at', startOfToday());
  if (error) throw error;
  return (data ?? []).reduce((sum, log) => sum + Number(log.amount_ml ?? 0), 0);
}

export async function getRecentMeals(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function addMeal(userId: string, name: string, proteinG: number) {
  const { error } = await supabase.from('meals').insert({ user_id: userId, name, protein_g: proteinG });
  if (error) throw error;
}

export async function addHydration(userId: string, amountMl: number) {
  const { error } = await supabase.from('hydration_logs').insert({ user_id: userId, amount_ml: amountMl });
  if (error) throw error;
}

export async function getRecentBowelLogs(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('bowel_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function addBowelLog(userId: string, type: BowelType, notes?: string) {
  const { error } = await supabase.from('bowel_logs').insert({ user_id: userId, type, notes });
  if (error) throw error;
}

export async function getRecentSymptomLogs(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function addSymptomLog(userId: string, symptom: Symptom, intensity: SymptomIntensity) {
  const { error } = await supabase.from('symptom_logs').insert({ user_id: userId, symptom, intensity });
  if (error) throw error;
}

export async function getLatestMedicationLog(userId: string) {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function addMedicationLog(userId: string, medication: string, dose?: string) {
  const { error } = await supabase.from('medication_logs').insert({ user_id: userId, medication, dose });
  if (error) throw error;
}

export async function getBodyMeasurements(userId: string, limit = 12) {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function addBodyMeasurement(
  userId: string,
  values: { weightKg?: number; waistCm?: number; hipCm?: number }
) {
  const { error } = await supabase.from('body_measurements').insert({
    user_id: userId,
    weight_kg: values.weightKg,
    waist_cm: values.waistCm,
    hip_cm: values.hipCm,
  });
  if (error) throw error;
}

export async function getProgressPhotos(userId: string) {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Uploads a photo blob to the private "progress-photos" bucket at <userId>/<filename>. */
export async function uploadProgressPhoto(userId: string, fileUri: string, weekNumber?: number) {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const path = `${userId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage.from('progress-photos').upload(path, blob, {
    contentType: 'image/jpeg',
  });
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from('progress_photos')
    .insert({ user_id: userId, storage_path: path, week_number: weekNumber });
  if (error) throw error;
}

export async function getProgressPhotoUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from('progress-photos')
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
