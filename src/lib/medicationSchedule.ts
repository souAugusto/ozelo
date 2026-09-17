import type { MedicationFrequencyType } from '@/types/database';

// MVP simplification (matches supabase/functions/send-reminders): all users
// are assumed to be in America/Sao_Paulo (UTC-3, no DST since 2019), since
// Ozelo doesn't collect a timezone yet. Computing this with an explicit
// offset — instead of the device's actual local time — keeps the client and
// the scheduled sender in agreement regardless of what timezone a device
// happens to be set to.
const BRT_OFFSET_HOURS = 3;

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export { WEEKDAY_LABELS };

function toBrtWallClock(instant: Date) {
  return new Date(instant.getTime() - BRT_OFFSET_HOURS * 60 * 60 * 1000);
}

/** Builds the real UTC instant for a given BRT wall-clock date + time. */
function brtWallClockToInstant(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, day, hour + BRT_OFFSET_HOURS, minute, 0, 0));
}

export type MedicationScheduleInput = {
  frequencyType: MedicationFrequencyType;
  time: string; // "HH:MM"
  weekday?: number | null; // 0=Sunday..6=Saturday, for 'weekly'
  intervalDays?: number | null; // for 'interval_days'
  /** The instant to compute from. Omit for "starting now" (used when the
   * schedule is first created/edited); pass the logged applied_at when
   * recomputing right after the user marks a dose as applied. */
  anchor?: Date;
};

/** Computes the next absolute datetime the medication is due, given a
 * recurrence rule. Used both when saving the schedule and after logging an
 * application (in which case `anchor` is that log's applied_at). */
export function computeNextMedicationAt({
  frequencyType,
  time,
  weekday,
  intervalDays,
  anchor,
}: MedicationScheduleInput): Date {
  const [hh, mm] = time.split(':').map(Number);
  const anchorInstant = anchor ?? new Date();
  const anchorBrt = toBrtWallClock(anchorInstant);
  const y = anchorBrt.getFullYear();
  const m = anchorBrt.getMonth();
  const d = anchorBrt.getDate();

  if (frequencyType === 'interval_days') {
    const days = intervalDays && intervalDays > 0 ? intervalDays : 7;
    if (anchor) {
      // Anchored to a logged dose: the next one is exactly `days` later.
      return brtWallClockToInstant(y, m, d + days, hh, mm);
    }
    // No prior dose yet — start from the next occurrence of this time.
    let candidate = brtWallClockToInstant(y, m, d, hh, mm);
    if (candidate.getTime() <= anchorInstant.getTime()) {
      candidate = brtWallClockToInstant(y, m, d + 1, hh, mm);
    }
    return candidate;
  }

  // weekly
  const targetWeekday = weekday ?? 1; // default Monday
  const currentWeekday = anchorBrt.getDay();
  const dayDiff = (targetWeekday - currentWeekday + 7) % 7;
  let candidate = brtWallClockToInstant(y, m, d + dayDiff, hh, mm);
  if (candidate.getTime() <= anchorInstant.getTime()) {
    candidate = brtWallClockToInstant(y, m, d + dayDiff + 7, hh, mm);
  }
  return candidate;
}

/** "Hoje · 08:00", "Amanhã · 08:00", or "Seg, 22/09 · 08:00" — matches how
 * BRT day boundaries are computed everywhere else in the app. */
export function formatNextMedication(iso: string | null): string {
  if (!iso) return 'Sem horário definido';
  const target = new Date(iso);
  const targetBrt = toBrtWallClock(target);
  const nowBrt = toBrtWallClock(new Date());

  const dayMs = 24 * 60 * 60 * 1000;
  const targetDay = Date.UTC(targetBrt.getFullYear(), targetBrt.getMonth(), targetBrt.getDate());
  const todayDay = Date.UTC(nowBrt.getFullYear(), nowBrt.getMonth(), nowBrt.getDate());
  const diffDays = Math.round((targetDay - todayDay) / dayMs);

  const time = `${String(targetBrt.getHours()).padStart(2, '0')}:${String(targetBrt.getMinutes()).padStart(2, '0')}`;

  if (diffDays === 0) return `Hoje · ${time}`;
  if (diffDays === 1) return `Amanhã · ${time}`;
  const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][targetBrt.getDay()];
  const dateLabel = `${String(targetBrt.getDate()).padStart(2, '0')}/${String(targetBrt.getMonth() + 1).padStart(2, '0')}`;
  return `${weekdayShort}, ${dateLabel} · ${time}`;
}
