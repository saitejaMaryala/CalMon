import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Txt } from '@/components/ui';
import { niceTicks, weightRuns } from '@/lib/stats';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { CHART_H, PAD, shortDate, useDayPicker, xLabels } from './common';

/** Daily weight as a line; days without an entry leave a gap instead of being interpolated. */
export function WeightChart({ days, values }: { days: string[]; values: (number | null)[] }) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const { selected, onPress } = useDayPicker(days.length, plotW);

  const logged = values.filter((v): v is number => v != null);
  if (logged.length === 0) {
    return (
      <View style={{ height: 110, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: c.bgSoft }}>
        <Txt variant="caption">No weight logged in this period yet.</Txt>
      </View>
    );
  }

  const ticks = niceTicks(Math.min(...logged) - 0.5, Math.max(...logged) + 0.5, 4);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const slot = plotW / days.length;
  const x = (i: number) => PAD.left + (i + 0.5) * slot;
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * plotH;

  const runs = weightRuns(values);
  const lastIndex = values.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0).pop()!;
  // Dots on every entry for a week; for longer ranges only the latest and isolated days.
  const showDot = (i: number) =>
    days.length <= 7 || i === lastIndex || i === selected || runs.some(([a, b]) => a === b && a === i);

  const sel = selected != null ? { day: days[selected], kg: values[selected] } : null;
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

  return (
    <View style={{ gap: 6 }}>
      <Txt variant="caption" style={{ minHeight: 17 }}>
        {sel
          ? `${shortDate(sel.day)} · ${sel.kg != null ? `${fmt(sel.kg)} kg` : 'no entry'}`
          : 'Tap a day on the chart to see details'}
      </Txt>
      <Pressable onLayout={(e) => setWidth(e.nativeEvent.layout.width)} onPress={onPress}>
        {width > 0 ? (
          <Svg width={width} height={CHART_H}>
            {ticks.map((t) => (
              <Line key={t} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={c.grid} strokeWidth={1} />
            ))}
            {ticks.map((t) => (
              <SvgText key={`l${t}`} x={PAD.left - 6} y={y(t) + 3.5} fontSize={10} fontFamily={fonts.medium} fill={c.textFaint} textAnchor="end">
                {fmt(t)}
              </SvgText>
            ))}
            {xLabels(days).map(({ index, label }) => (
              <SvgText
                key={`x${index}`}
                x={x(index)}
                y={CHART_H - 6}
                fontSize={10}
                fontFamily={fonts.medium}
                fill={c.textFaint}
                textAnchor={days.length <= 7 ? 'middle' : index === 0 ? 'start' : index === days.length - 1 ? 'end' : 'middle'}
              >
                {label}
              </SvgText>
            ))}
            {selected != null ? (
              <Line x1={x(selected)} x2={x(selected)} y1={PAD.top} y2={PAD.top + plotH} stroke={c.border} strokeWidth={1} />
            ) : null}
            {runs
              .filter(([a, b]) => b > a)
              .map(([a, b]) => (
                <Path
                  key={`r${a}`}
                  d={values
                    .slice(a, b + 1)
                    .map((v, k) => `${k === 0 ? 'M' : 'L'}${x(a + k)},${y(v!)}`)
                    .join(' ')}
                  stroke={c.primary}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            {values.map((v, i) =>
              v != null && showDot(i) ? (
                <Circle key={`d${i}`} cx={x(i)} cy={y(v)} r={i === selected ? 5.5 : 4} fill={c.primary} stroke={c.card} strokeWidth={2} />
              ) : null,
            )}
            {selected == null ? (
              <SvgText x={x(lastIndex) + 8} y={y(values[lastIndex]!) + 4} fontSize={11} fontFamily={fonts.bold} fill={c.text}>
                {fmt(values[lastIndex]!)}
              </SvgText>
            ) : null}
          </Svg>
        ) : (
          <View style={{ height: CHART_H }} />
        )}
      </Pressable>
    </View>
  );
}
