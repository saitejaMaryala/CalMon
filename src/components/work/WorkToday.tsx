import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ProgressRing } from '@/components/CalorieRing';
import { Mascot, moodFor } from '@/components/Mascot';
import { ModeSwitch } from '@/components/ModeSwitch';
import { Button, Card, Chip, Row, Screen, tap, Txt } from '@/components/ui';
import { addDays, formatDayLabel, todayKey } from '@/lib/dates';
import { greetingFor } from '@/lib/mealSlot';
import type { WorkCategory } from '@/lib/types';
import { formatMinutes, WORK_CATEGORIES, WORK_META } from '@/lib/work';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { CategoryBreakdown, useDayWork, WorkSessionCard } from './parts';

export function WorkToday() {
  const { c } = useTheme();
  const profile = useAppStore((s) => s.profile)!;
  const date = useAppStore((s) => s.selectedDate);
  const setDate = useAppStore((s) => s.setSelectedDate);
  const target = useAppStore((s) => s.workTargetMin);
  const sessions = useDayWork(date);
  /** Category the Sessions list is filtered to; null shows all. */
  const [filter, setFilter] = useState<WorkCategory | null>(null);
  const toggle = (cat: WorkCategory) => setFilter((f) => (f === cat ? null : cat));

  const today = todayKey();
  const isToday = date === today;
  const total = sessions.reduce((s, w) => s + w.minutes, 0);
  const byCat = Object.fromEntries(
    WORK_CATEGORIES.map((cat) => [cat, sessions.filter((s) => s.category === cat).reduce((a, s) => a + s.minutes, 0)]),
  ) as Record<WorkCategory, number>;
  const left = target - total;
  const shown = filter ? sessions.filter((s) => s.category === filter) : sessions;
  const count = (cat: WorkCategory) => sessions.filter((s) => s.category === cat).length;

  // While the list is filtered, new sessions start in that category.
  const log = () => router.push({ pathname: '/work/log', params: { date, ...(filter ? { category: filter } : {}) } });

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption">{greetingFor(new Date())}</Txt>
          <Txt variant="title">{profile.name || 'Today'}</Txt>
        </View>
        <Mascot size={56} mood={total >= target ? 'yum' : moodFor(total, target)} />
      </Row>

      <ModeSwitch />

      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            tap();
            setDate(addDays(date, -1));
          }}
        >
          <Ionicons name="chevron-back" size={22} color={c.textSoft} />
        </Pressable>
        <Row>
          <Txt variant="h2">{formatDayLabel(date)}</Txt>
          {!isToday ? <Chip label="Back to today" onPress={() => setDate(today)} /> : null}
        </Row>
        {isToday ? (
          <View style={{ width: 22 }} />
        ) : (
          <Pressable
            hitSlop={12}
            onPress={() => {
              tap();
              setDate(addDays(date, 1));
            }}
          >
            <Ionicons name="chevron-forward" size={22} color={c.textSoft} />
          </Pressable>
        )}
      </Row>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <ProgressRing value={total} target={target} size={150}>
          <Txt variant="display" style={{ fontSize: 28, lineHeight: 34 }}>
            {formatMinutes(total)}
          </Txt>
          <Txt variant="caption">of {formatMinutes(target)}</Txt>
        </ProgressRing>
        <View style={{ flex: 1, gap: 12 }}>
          <View>
            <Txt variant="caption">{left > 0 ? 'To go' : 'Goal reached'}</Txt>
            <Txt variant="number">{left > 0 ? formatMinutes(left) : `+${formatMinutes(-left)}`}</Txt>
          </View>
          <CategoryBreakdown minutes={byCat} targetMin={target} selected={filter} onSelect={toggle} />
        </View>
      </Card>

      <Button title="Log work" icon={<Ionicons name="add-circle" size={20} color={c.onAccent} />} onPress={log} />

      <View style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt variant="h2">{filter ? WORK_META[filter].label : 'Sessions'}</Txt>
            {filter ? (
              <Txt variant="caption">
                {count(filter)} {count(filter) === 1 ? 'session' : 'sessions'} · {formatMinutes(byCat[filter])}
              </Txt>
            ) : null}
          </View>
          {sessions.length ? <Button small kind="soft" title="+ Add" onPress={log} /> : null}
        </Row>
        {sessions.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Chip label={`All ${sessions.length}`} selected={!filter} onPress={() => setFilter(null)} />
            {WORK_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={`${cat === 'personal' ? 'Personal' : WORK_META[cat].label} ${count(cat)}`}
                selected={filter === cat}
                onPress={() => toggle(cat)}
              />
            ))}
          </ScrollView>
        ) : null}
        {sessions.length > 0 && shown.length === 0 && filter ? (
          <Card style={{ alignItems: 'center', gap: 6 }}>
            <Txt variant="body" soft style={{ textAlign: 'center' }}>
              No {WORK_META[filter].label.toLowerCase()} sessions {isToday ? 'today' : 'on this day'}.
            </Txt>
            <Button small kind="soft" title="Show all sessions" onPress={() => setFilter(null)} />
          </Card>
        ) : null}
        {sessions.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: 8 }}>
            <Mascot size={56} mood="sleepy" />
            <Txt variant="body" soft style={{ textAlign: 'center' }}>
              No work logged {isToday ? 'yet today' : 'on this day'}. Log a session when you finish one.
            </Txt>
          </Card>
        ) : (
          shown.map((s) => (
            <WorkSessionCard key={s.id} session={s} onPress={() => router.push({ pathname: '/work/[id]', params: { id: s.id } })} />
          ))
        )}
      </View>
    </Screen>
  );
}
