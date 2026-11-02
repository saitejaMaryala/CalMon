import { MEAL_GROUP_LABEL, MEAL_GROUPS, type DayCalories, type MealGroup } from '@/lib/stats';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';
import { compactKcal } from './common';
import { StackedBarChart } from './StackedBarChart';

export type CalorieFilter = 'all' | MealGroup;

export function mealColor(c: Palette, g: MealGroup): string {
  return { breakfast: c.mealBreakfast, lunch: c.mealLunch, dinner: c.mealDinner, snacks: c.mealSnacks }[g];
}

/** Daily calories: stacked by meal for "all", or a single meal's bars. */
export function CalorieChart({ data, filter, target }: { data: DayCalories[]; filter: CalorieFilter; target: number }) {
  const { c } = useTheme();
  return (
    <StackedBarChart
      rows={data.map((d) => ({ date: d.date, values: { breakfast: d.breakfast, lunch: d.lunch, dinner: d.dinner, snacks: d.snacks } }))}
      series={MEAL_GROUPS.map((g) => ({ key: g, label: MEAL_GROUP_LABEL[g], color: mealColor(c, g) }))}
      filter={filter}
      target={target}
      formatAxis={compactKcal}
      formatValue={(v) => `${Math.round(v).toLocaleString()} kcal`}
    />
  );
}
