import { addDays } from './dates';
import type { Slot, WeightEntry } from './types';

/** Meal groups shown on the Stats tab; late-night snacks count as snacks, like on the Today grid. */
export type MealGroup = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export const MEAL_GROUPS: MealGroup[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const MEAL_GROUP_LABEL: Record<MealGroup, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export function groupForSlot(slot: Slot): MealGroup {
  return slot === 'snack' || slot === 'latenight' ? 'snacks' : slot;
}

/** Every day key from `from` to `to`, inclusive. */
export function dayRange(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

export interface DayCalories extends Record<MealGroup, number> {
  date: string;
  total: number;
}

/** Calories per day split by meal group; days without meals are all zeros. */
export function caloriesByDay(days: string[], rows: { date: string; slot: Slot; kcal: number }[]): DayCalories[] {
  const byDate = new Map<string, DayCalories>(
    days.map((date) => [date, { date, breakfast: 0, lunch: 0, dinner: 0, snacks: 0, total: 0 }]),
  );
  for (const r of rows) {
    const day = byDate.get(r.date);
    if (!day) continue;
    day[groupForSlot(r.slot)] += r.kcal;
    day.total += r.kcal;
  }
  return days.map((d) => byDate.get(d)!);
}

/** Weight per day in `days`, null where nothing was logged (drawn as a gap). */
export function weightByDay(days: string[], entries: WeightEntry[]): (number | null)[] {
  const map = new Map(entries.map((e) => [e.date, e.kg]));
  return days.map((d) => map.get(d) ?? null);
}

/** Runs of consecutive logged days, as [startIndex, endIndex] pairs (inclusive). */
export function weightRuns(values: (number | null)[]): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  values.forEach((v, i) => {
    if (v != null && start < 0) start = i;
    if (v == null && start >= 0) {
      runs.push([start, i - 1]);
      start = -1;
    }
  });
  if (start >= 0) runs.push([start, values.length - 1]);
  return runs;
}

/** Average kcal per day for each group and in total, over days with anything logged. */
export function calorieAverages(days: DayCalories[]): { loggedDays: number; total: number } & Record<MealGroup, number> {
  const logged = days.filter((d) => d.total > 0);
  const avg = (pick: (d: DayCalories) => number) =>
    logged.length ? Math.round(logged.reduce((s, d) => s + pick(d), 0) / logged.length) : 0;
  return {
    loggedDays: logged.length,
    total: avg((d) => d.total),
    breakfast: avg((d) => d.breakfast),
    lunch: avg((d) => d.lunch),
    dinner: avg((d) => d.dinner),
    snacks: avg((d) => d.snacks),
  };
}

/** First and last logged weight in the range and the change between them. */
export function weightChange(values: (number | null)[]): { first: number; last: number; delta: number } | null {
  const logged = values.filter((v): v is number => v != null);
  if (logged.length === 0) return null;
  const first = logged[0];
  const last = logged[logged.length - 1];
  return { first, last, delta: Math.round((last - first) * 10) / 10 };
}

/**
 * Evenly spaced "nice" axis ticks covering [min, max]. Steps are `steps` × 10^n
 * (default 1, 2, 2.5, 5); pass e.g. [1, 2, 4, 6] for hour axes.
 */
export function niceTicks(min: number, max: number, count = 4, steps = [1, 2, 2.5, 5]): number[] {
  if (max <= min) max = min + 1;
  const rough = (max - min) / Math.max(1, count - 1);
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [...steps, 10].map((m) => m * pow).find((s) => s >= rough)!;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 1e6; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return ticks;
}
