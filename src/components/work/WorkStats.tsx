import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { ModeSwitch } from '@/components/ModeSwitch';
import { Card, Chip, Divider, Row, Screen, Segmented, tap, Txt } from '@/components/ui';
import { addDays, todayKey } from '@/lib/dates';
import { getDailyWorkByCategory } from '@/lib/db';
import { dayRange } from '@/lib/stats';
import type { WorkCategory } from '@/lib/types';
import { formatHours, formatMinutes, goalStreak, workAverages, workByDay, WORK_CATEGORIES, WORK_META, type DayWork } from '@/lib/work';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { CategoryIcon, workColor } from './parts';

type Range = '7' | '30' | '90';

export function WorkStats() {
  const { c } = useTheme();
  const version = useAppStore((s) => s.dataVersion);
  const target = useAppStore((s) => s.workTargetMin);
  const [range, setRange] = useState<Range>('7');
  const [filter, setFilter] = useState<'all' | WorkCategory>('all');
  const [data, setData] = useState<DayWork[]>([]);

  const today = todayKey();
  const from = addDays(today, -(Number(range) - 1));
  const days = dayRange(from, today);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getDailyWorkByCategory(from, today).then((rows) => alive && setData(workByDay(dayRange(from, today), rows)));
      return () => {
        alive = false;
      };
    }, [from, today, version]),
  );

  const rows = data.length === days.length ? data : workByDay(days, []);
  const avg = workAverages(rows);
  const total = rows.reduce((s, d) => s + d.total, 0);
  const goalDays = rows.filter((d) => d.total >= target).length;
  const streak = goalStreak(rows, target);
  const totalBy = (cat: WorkCategory) => rows.reduce((s, d) => s + d.values[cat], 0);

  return (
    <Screen>
      <Txt variant="title">Stats</Txt>
      <ModeSwitch />

      <Segmented<Range>
        value={range}
        onChange={setRange}
        options={[
          { value: '7', label: '7 days' },
          { value: '30', label: '30 days' },
          { value: '90', label: '90 days' },
        ]}
      />

      <Row gap={10}>
        <Tile label="Total" value={formatMinutes(total)} />
        <Tile label="Daily avg" value={formatMinutes(avg.total)} />
        <Tile label="Goal days" value={`${goalDays}/${days.length}`} />
        <Tile label="Streak" value={`${streak}d`} />
      </Row>

      <Card style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Txt variant="h2">Hours worked</Txt>
          <Txt variant="caption">goal {formatMinutes(target)}/day</Txt>
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          {WORK_CATEGORIES.map((cat) => (
            <Chip key={cat} label={WORK_META[cat].label} selected={filter === cat} onPress={() => setFilter(cat)} />
          ))}
        </ScrollView>
        <StackedBarChart
          key={`${range}${filter}`}
          rows={rows.map((d) => ({
            date: d.date,
            values: Object.fromEntries(WORK_CATEGORIES.map((cat) => [cat, d.values[cat] / 60])),
          }))}
          series={WORK_CATEGORIES.map((cat) => ({ key: cat, label: WORK_META[cat].label, color: workColor(c, cat) }))}
          filter={filter}
          target={target / 60}
          formatAxis={formatHours}
          formatValue={(h) => formatMinutes(h * 60)}
          ticksStep={[1, 2, 4]}
          tickCount={5}
        />

        <Divider />
        <Txt variant="caption">
          By category · {avg.workedDays} of {days.length} days with work
        </Txt>
        <View style={{ gap: 10 }}>
          {WORK_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                tap();
                setFilter(filter === cat ? 'all' : cat);
              }}
            >
              <Row style={{ justifyContent: 'space-between', opacity: filter === 'all' || filter === cat ? 1 : 0.5 }}>
                <Row gap={10}>
                  <CategoryIcon category={cat} size={32} />
                  <View>
                    <Txt variant="body">{WORK_META[cat].label}</Txt>
                    <Txt variant="caption">{formatMinutes(totalBy(cat))} total</Txt>
                  </View>
                </Row>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt variant="bodyBold">{formatMinutes(avg[cat])}/day</Txt>
                  <Txt variant="caption">{total ? `${Math.round((totalBy(cat) / total) * 100)}%` : '0%'}</Txt>
                </View>
              </Row>
            </Pressable>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8, gap: 2 }}>
      <Txt variant="caption" numberOfLines={1}>
        {label}
      </Txt>
      <Txt variant="number" style={{ fontSize: 17, lineHeight: 22 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Txt>
    </View>
  );
}
