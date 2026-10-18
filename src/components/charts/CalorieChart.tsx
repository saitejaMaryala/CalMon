import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Row, Txt } from '@/components/ui';
import { MEAL_GROUP_LABEL, MEAL_GROUPS, niceTicks, type DayCalories, type MealGroup } from '@/lib/stats';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';
import { fonts } from '@/theme/tokens';
import { CHART_H, compactKcal, PAD, roundedTopBar, shortDate, useDayPicker, xLabels } from './common';

export type CalorieFilter = 'all' | MealGroup;

const GAP = 2;

export function mealColor(c: Palette, g: MealGroup): string {
  return { breakfast: c.mealBreakfast, lunch: c.mealLunch, dinner: c.mealDinner, snacks: c.mealSnacks }[g];
}

/** Daily calories: stacked by meal for "all", or a single meal's bars. */
export function CalorieChart({ data, filter, target }: { data: DayCalories[]; filter: CalorieFilter; target: number }) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const { selected, onPress } = useDayPicker(data.length, plotW);

  const groups = filter === 'all' ? MEAL_GROUPS : [filter];
  const valueOf = (d: DayCalories) => (filter === 'all' ? d.total : d[filter]);
  const peak = Math.max(1, ...data.map(valueOf), filter === 'all' ? target : 0);
  const ticks = niceTicks(0, peak, 4);
  const top = ticks[ticks.length - 1];
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(24, Math.max(2, slot - GAP));
  const xCenter = (i: number) => PAD.left + (i + 0.5) * slot;
  const y = (v: number) => PAD.top + (1 - v / top) * plotH;
  const base = y(0);

  const sel = selected != null ? data[selected] : null;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ minHeight: 34 }}>
        {sel ? (
          <>
            <Txt variant="caption" style={{ color: c.text }}>
              {shortDate(sel.date)} · {Math.round(valueOf(sel)).toLocaleString()} kcal
              {filter !== 'all' ? ` at ${MEAL_GROUP_LABEL[filter].toLowerCase()}` : ''}
            </Txt>
            {filter === 'all' && sel.total > 0 ? (
              <Txt variant="caption">
                {MEAL_GROUPS.filter((g) => sel[g] > 0)
                  .map((g) => `${MEAL_GROUP_LABEL[g]} ${Math.round(sel[g])}`)
                  .join(' · ')}
              </Txt>
            ) : null}
          </>
        ) : (
          <Txt variant="caption">Tap a day on the chart to see details</Txt>
        )}
      </View>

      <Pressable onLayout={(e) => setWidth(e.nativeEvent.layout.width)} onPress={onPress}>
        {width > 0 ? (
          <Svg width={width} height={CHART_H}>
            {ticks.map((t) => (
              <Line key={t} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? c.border : c.grid} strokeWidth={1} />
            ))}
            {ticks.map((t) => (
              <SvgText key={`l${t}`} x={PAD.left - 6} y={y(t) + 3.5} fontSize={10} fontFamily={fonts.medium} fill={c.textFaint} textAnchor="end">
                {compactKcal(t)}
              </SvgText>
            ))}
            {xLabels(data.map((d) => d.date)).map(({ index, label }) => (
              <SvgText
                key={`x${index}`}
                x={xCenter(index)}
                y={CHART_H - 6}
                fontSize={10}
                fontFamily={fonts.medium}
                fill={c.textFaint}
                textAnchor={data.length <= 7 ? 'middle' : index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
              >
                {label}
              </SvgText>
            ))}

            {data.map((d, i) => {
              const segments = groups.filter((g) => d[g] > 0);
              let cursor = base;
              return (
                <G key={d.date} opacity={selected == null || selected === i ? 1 : 0.35}>
                  {segments.map((g, k) => {
                    const h = base - y(d[g]);
                    // A 2px surface gap separates stacked segments.
                    const gap = k === 0 ? 0 : GAP;
                    const drawn = Math.max(0, h - gap);
                    const yTop = cursor - gap - drawn;
                    cursor = yTop;
                    if (drawn <= 0) return null;
                    const isTop = k === segments.length - 1;
                    const x0 = xCenter(i) - barW / 2;
                    return isTop ? (
                      <Path key={g} d={roundedTopBar(x0, yTop, barW, drawn, 4)} fill={mealColor(c, g)} />
                    ) : (
                      <Path key={g} d={`M${x0},${yTop} h${barW} v${drawn} h${-barW} Z`} fill={mealColor(c, g)} />
                    );
                  })}
                </G>
              );
            })}

            {filter === 'all' ? (
              <G>
                <Line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} stroke={c.textSoft} strokeWidth={1} />
                <SvgText x={width - PAD.right} y={y(target) - 4} fontSize={10} fontFamily={fonts.medium} fill={c.textSoft} textAnchor="end">
                  {`Target ${compactKcal(target)}`}
                </SvgText>
              </G>
            ) : null}
          </Svg>
        ) : (
          <View style={{ height: CHART_H }} />
        )}
      </Pressable>

      {filter === 'all' ? (
        <Row gap={14} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {MEAL_GROUPS.map((g) => (
            <Row key={g} gap={5}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: mealColor(c, g) }} />
              <Txt variant="caption">{MEAL_GROUP_LABEL[g]}</Txt>
            </Row>
          ))}
        </Row>
      ) : null}
    </View>
  );
}
