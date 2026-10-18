import { useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { tap } from '@/components/ui';
import { parseDayKey } from '@/lib/dates';

export const CHART_H = 190;
// Right padding leaves room for the end-of-line weight label.
export const PAD = { left: 40, right: 36, top: 14, bottom: 24 };

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function shortDate(key: string): string {
  return parseDayKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** X-axis labels: every weekday for a week, otherwise four evenly spaced dates ending today. */
export function xLabels(days: string[]): { index: number; label: string }[] {
  const n = days.length;
  if (n <= 7) return days.map((d, i) => ({ index: i, label: WEEKDAYS[parseDayKey(d).getDay()] }));
  const idx = [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1];
  return idx.map((i) => ({ index: i, label: shortDate(days[i]) }));
}

export function compactKcal(v: number): string {
  return v >= 1000 ? `${Math.round(v / 100) / 10}K` : String(Math.round(v));
}

/** Path for a bar with rounded top corners and a square base. */
export function roundedTopBar(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/**
 * Tap a day on the plot to select it; tap it again to clear. Tap (not drag) so a swipe
 * that starts on the chart still scrolls the page.
 */
export function useDayPicker(count: number, plotWidth: number) {
  const [selected, setSelected] = useState<number | null>(null);
  const onPress = (e: GestureResponderEvent) => {
    if (count === 0 || plotWidth <= 0) return;
    const i = Math.max(0, Math.min(count - 1, Math.floor(((e.nativeEvent.locationX - PAD.left) / plotWidth) * count)));
    tap();
    setSelected((prev) => (prev === i ? null : i));
  };
  return { selected, onPress };
}
