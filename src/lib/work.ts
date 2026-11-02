import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { WorkCategory } from './types';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const DEFAULT_WORK_TARGET_MIN = 8 * 60;

export const WORK_CATEGORIES: WorkCategory[] = ['academics', 'research', 'personal'];

export const WORK_META: Record<WorkCategory, { label: string; hint: string; icon: IconName; iconActive: IconName }> = {
  academics: { label: 'Academics', hint: 'Classes, coursework, exams', icon: 'book-outline', iconActive: 'book' },
  research: { label: 'Research', hint: 'Papers, experiments, analysis', icon: 'flask-outline', iconActive: 'flask' },
  personal: { label: 'Personal Projects', hint: 'Side projects and self-learning', icon: 'rocket-outline', iconActive: 'rocket' },
};

/** A session's display name: its title, or the category name for untitled (older) sessions. */
export function sessionTitle(s: { title?: string; category: WorkCategory }): string {
  return s.title?.trim() || WORK_META[s.category].label;
}

/** Shortcuts on the log screen, in minutes. */
export const QUICK_DURATIONS = [30, 60, 90, 120, 180, 240];

/** "2h 15m", "45m", "3h". */
export function formatMinutes(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

/** "7.5" style hours for chart axes. */
export function formatHours(hours: number): string {
  return `${Math.round(hours * 10) / 10}h`;
}

export interface DayWork {
  date: string;
  total: number;
  values: Record<WorkCategory, number>;
}

/** Minutes per day split by category; days with nothing logged are all zeros. */
export function workByDay(days: string[], rows: { date: string; category: WorkCategory; minutes: number }[]): DayWork[] {
  const byDate = new Map<string, DayWork>(
    days.map((date) => [date, { date, total: 0, values: { academics: 0, research: 0, personal: 0 } }]),
  );
  for (const r of rows) {
    const day = byDate.get(r.date);
    if (!day || !(r.category in day.values)) continue;
    day.values[r.category] += r.minutes;
    day.total += r.minutes;
  }
  return days.map((d) => byDate.get(d)!);
}

/** Average minutes per day (overall and per category) over days with any work logged. */
export function workAverages(days: DayWork[]): { workedDays: number; total: number } & Record<WorkCategory, number> {
  const worked = days.filter((d) => d.total > 0);
  const avg = (pick: (d: DayWork) => number) =>
    worked.length ? Math.round(worked.reduce((s, d) => s + pick(d), 0) / worked.length) : 0;
  return {
    workedDays: worked.length,
    total: avg((d) => d.total),
    academics: avg((d) => d.values.academics),
    research: avg((d) => d.values.research),
    personal: avg((d) => d.values.personal),
  };
}

/** Consecutive days, ending today (or yesterday if today isn't done yet), that reached the goal. */
export function goalStreak(days: DayWork[], targetMin: number): number {
  let i = days.length - 1;
  if (i >= 0 && days[i].total < targetMin) i--; // today still in progress
  let streak = 0;
  for (; i >= 0 && days[i].total >= targetMin; i--) streak++;
  return streak;
}
