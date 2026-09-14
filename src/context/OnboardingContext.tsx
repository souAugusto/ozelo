import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import type { Medication, SubscriptionPlan } from '@/types/database';

export type OnboardingAnswers = {
  medication: Medication | null;
  symptoms: string[];
  bowelFrequency: string | null;
  currentWeight: string;
  goalWeight: string;
  selectedPlan: SubscriptionPlan;
};

const initialAnswers: OnboardingAnswers = {
  medication: null,
  symptoms: [],
  bowelFrequency: null,
  currentWeight: '',
  goalWeight: '',
  selectedPlan: 'annual',
};

type OnboardingContextValue = {
  answers: OnboardingAnswers;
  update: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  toggleSymptom: (symptom: string) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/** Holds the funnel answers in memory while the user moves through onboarding,
 * before an account exists to persist them to Supabase. */
export function OnboardingProvider({ children }: PropsWithChildren) {
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      answers,
      update: (key, value) => setAnswers((prev) => ({ ...prev, [key]: value })),
      toggleSymptom: (symptom) =>
        setAnswers((prev) => ({
          ...prev,
          symptoms: prev.symptoms.includes(symptom)
            ? prev.symptoms.filter((s) => s !== symptom)
            : [...prev.symptoms, symptom],
        })),
      reset: () => setAnswers(initialAnswers),
    }),
    [answers]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
