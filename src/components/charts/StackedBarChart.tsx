import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Row, Txt } from '@/components/ui';
import { niceTicks } from '@/lib/stats';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { CHART_H, PAD, roundedTopBar, shortDate, useDayPicker, xLabels } from './common';

export interface Series {
  key: string;
  label: string;
  color: string;
}

export interface StackRow {
  date: string;
  values: Record<string, number>;
}

const GAP = 2;

/**
 * Daily bars: stacked by series when `filter` is "all" (with an optional target line), or one series alone.
 * Tap a day to see its breakdown above the plot.
 */
export function StackedBarChart({
  rows,
  series,
  filter,
  target,
  formatAxis,
  formatValue,
  ticksStep,
  tickCount = 4,
}: {
  rows: StackRow[];
  series: Series[];
  filter: 'all' | string;
  target?: number;
  formatAxis: (v: number) => string;
  formatValue: (v: number) => string;
  /** Allowed tick steps (before scaling by powers of ten), e.g. [1, 2, 4] for hours. */
  ticksStep?: number[];
  tickCount?: number;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const { selected, onPress } = useDayPicker(rows.length, plotW);

  const shown = filter === 'all' ? series : series.filter((s) => s.key === filter);
  const total = (r: StackRow) => shown.reduce((sum, s) => sum + (r.values[s.key] ?? 0), 0);
  const showTarget = filter === 'all' && target != null;
  const peak = Math.max(1e-6, ...rows.map(total), showTarget ? target : 0);
  const ticks = niceTicks(0, peak, tickCount, ticksStep);
  const top = ticks[ticks.length - 1];
  const slot = plotW / Math.max(1, rows.length);
  const barW = Math.min(24, Math.max(2, slot - GAP));
  const xCenter = (i: number) => PAD.left + (i + 0.5) * slot;
  const y = (v: number) => PAD.top + (1 - v / top) * plotH;
  const base = y(0);

  const sel = selected != null ? rows[selected] : null;
  const only = filter === 'all' ? null : series.find((s) => s.key === filter);

  return (
    <View style={{ gap: 6 }}>
      <View style={{ minHeight: 34 }}>
        {sel ? (
          <>
            <Txt variant="caption" style={{ color: c.text }}>
              {shortDate(sel.date)} · {formatValue(total(sel))}
              {only ? ` · ${only.label}` : ''}
            </Txt>
            {filter === 'all' && total(sel) > 0 ? (
              <Txt variant="caption">
                {series
                  .filter((s) => (sel.values[s.key] ?? 0) > 0)
                  .map((s) => `${s.label} ${formatValue(sel.values[s.key])}`)
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
                {formatAxis(t)}
              </SvgText>
            ))}
            {xLabels(rows.map((d) => d.date)).map(({ index, label }) => (
              <SvgText
                key={`x${index}`}
                x={xCenter(index)}
                y={CHART_H - 6}
                fontSize={10}
                fontFamily={fonts.medium}
                fill={c.textFaint}
                textAnchor={rows.length <= 7 ? 'middle' : index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle'}
              >
                {label}
              </SvgText>
            ))}

            {rows.map((r, i) => {
              const segments = shown.filter((s) => (r.values[s.key] ?? 0) > 0);
              let cursor = base;
              return (
                <G key={r.date} opacity={selected == null || selected === i ? 1 : 0.35}>
                  {segments.map((s, k) => {
                    const h = base - y(r.values[s.key]);
                    // A 2px surface gap separates stacked segments.
                    const gap = k === 0 ? 0 : GAP;
                    const drawn = Math.max(0, h - gap);
                    const yTop = cursor - gap - drawn;
                    cursor = yTop;
                    if (drawn <= 0) return null;
                    const x0 = xCenter(i) - barW / 2;
                    return k === segments.length - 1 ? (
                      <Path key={s.key} d={roundedTopBar(x0, yTop, barW, drawn, 4)} fill={s.color} />
                    ) : (
                      <Path key={s.key} d={`M${x0},${yTop} h${barW} v${drawn} h${-barW} Z`} fill={s.color} />
                    );
                  })}
                </G>
              );
            })}

            {showTarget ? (
              <Line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} stroke={c.textSoft} strokeWidth={1} />
            ) : null}
          </Svg>
        ) : (
          <View style={{ height: CHART_H }} />
        )}
      </Pressable>

      {filter === 'all' ? (
        <Row gap={14} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {series.map((s) => (
            <Row key={s.key} gap={5}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
              <Txt variant="caption">{s.label}</Txt>
            </Row>
          ))}
          {/* The target is labelled here rather than on the plot, where a tall bar could cover it. */}
          {showTarget ? (
            <Row gap={5}>
              <View style={{ width: 14, height: 1.5, backgroundColor: c.textSoft }} />
              <Txt variant="caption">Target {formatAxis(target)}</Txt>
            </Row>
          ) : null}
        </Row>
      ) : null}
    </View>
  );
}
