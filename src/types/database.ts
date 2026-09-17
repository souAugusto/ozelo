/**
 * Hand-written mirror of supabase/migrations/0001_init.sql.
 * Once the project is linked, regenerate with:
 *   supabase gen types typescript --linked > src/types/database.ts
 *
 * Note: every row shape below is declared with `type`, not `interface`. The
 * Supabase client's generic Database constraint checks each table against a
 * structural `Record<string, unknown>` shape, and TypeScript only infers the
 * implicit index signature that check relies on for closed `type` aliases —
 * an `interface` here makes every table resolve to `never`.
 */
export type Medication = 'ozempic' | 'mounjaro' | 'wegovy' | 'other';
export type SubscriptionPlan = 'monthly' | 'annual';
export type SubscriptionStatus = 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
export type Symptom = 'nausea' | 'reflux' | 'headache' | 'dizziness' | 'fatigue' | 'difficulty_eating';
export type SymptomIntensity = 'mild' | 'moderate' | 'severe';
export type BowelType = 'normal' | 'loose' | 'hard' | 'discomfort';
export type Units = 'metric' | 'imperial';

export type Profile = {
  id: string;
  full_name: string | null;
  medication: Medication | null;
  medication_dose: string | null;
  reminder_time: string | null;
  current_weight_kg: number | null;
  goal_weight_kg: number | null;
  height_cm: number | null;
  protein_goal_g: number;
  water_goal_ml: number;
  units: Units;
  sensitive_data_private: boolean;
  treatment_started_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicationLog = {
  id: string;
  user_id: string;
  medication: string;
  dose: string | null;
  applied_at: string;
  notes: string | null;
  created_at: string;
};

export type Meal = {
  id: string;
  user_id: string;
  name: string;
  protein_g: number;
  logged_at: string;
  created_at: string;
  updated_at: string;
};

export type HydrationLog = {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
};

export type SymptomLog = {
  id: string;
  user_id: string;
  symptom: Symptom;
  intensity: SymptomIntensity;
  logged_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BowelLog = {
  id: string;
  user_id: string;
  type: BowelType;
  logged_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BodyMeasurement = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  measured_at: string;
  created_at: string;
};

export type ProgressPhoto = {
  id: string;
  user_id: string;
  storage_path: string;
  week_number: number | null;
  taken_at: string;
  created_at: string;
};

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string }>;
      subscriptions: Table<Subscription, Partial<Subscription>>;
      medication_logs: Table<MedicationLog, Partial<MedicationLog> & { user_id: string; medication: string }>;
      meals: Table<Meal, Partial<Meal> & { user_id: string; name: string }>;
      hydration_logs: Table<HydrationLog, Partial<HydrationLog> & { user_id: string; amount_ml: number }>;
      symptom_logs: Table<
        SymptomLog,
        Partial<SymptomLog> & { user_id: string; symptom: Symptom; intensity: SymptomIntensity }
      >;
      bowel_logs: Table<BowelLog, Partial<BowelLog> & { user_id: string; type: BowelType }>;
      body_measurements: Table<BodyMeasurement, Partial<BodyMeasurement> & { user_id: string }>;
      progress_photos: Table<ProgressPhoto, Partial<ProgressPhoto> & { user_id: string; storage_path: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
