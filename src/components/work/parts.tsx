import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { tap, Txt } from '@/components/ui';
import { formatTime } from '@/lib/dates';
import { getWorkForDate } from '@/lib/db';
import type { WorkCategory, WorkSession } from '@/lib/types';
import { formatMinutes, sessionTitle, WORK_CATEGORIES, WORK_META } from '@/lib/work';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

export function workColor(c: Palette, cat: WorkCategory): string {
  return { academics: c.workAcademics, research: c.workResearch, personal: c.workPersonal }[cat];
}

/** Category icon in a soft tinted circle. */
export function CategoryIcon({ category, size = 40 }: { category: WorkCategory; size?: number }) {
  const { c } = useTheme();
  const color = workColor(c, category);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}22` }}>
      <Ionicons name={WORK_META[category].iconActive} size={size * 0.48} color={color} />
    </View>
  );
}

/** Work sessions for a day, reloaded on focus and after any write. */
export function useDayWork(date: string) {
  const version = useAppStore((s) => s.dataVersion);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getWorkForDate(date).then((s) => alive && setSessions(s));
      return () => {
        alive = false;
      };
    }, [date, version]),
  );
  return sessions;
}

export function WorkSessionCard({ session, onPress }: { session: WorkSession; onPress: () => void }) {
  const { c } = useTheme();
  const meta = WORK_META[session.category];
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.card, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 }]}
    >
      <CategoryIcon category={session.category} size={44} />
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="bodyBold" numberOfLines={1}>
          {sessionTitle(session)}
        </Txt>
        <Txt variant="caption">
          {session.title.trim() ? `${meta.label} · ` : ''}at {formatTime(new Date(session.loggedAt))}
        </Txt>
        {session.note ? (
          <Txt variant="quote" numberOfLines={2} style={{ fontSize: 14, lineHeight: 20, marginTop: 2 }}>
            {session.note}
          </Txt>
        ) : null}
      </View>
      <Txt variant="number" style={{ fontSize: 18 }}>
        {formatMinutes(session.minutes)}
      </Txt>
    </Pressable>
  );
}

/**
 * Time per category for a day, as thin bars against the daily goal.
 * With `onSelect`, each row is a filter toggle; the others dim while one is selected.
 */
export function CategoryBreakdown({
  minutes,
  targetMin,
  selected,
  onSelect,
}: {
  minutes: Record<WorkCategory, number>;
  targetMin: number;
  selected?: WorkCategory | null;
  onSelect?: (cat: WorkCategory) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8, flex: 1 }}>
      {WORK_CATEGORIES.map((cat) => {
        const color = workColor(c, cat);
        const v = minutes[cat];
        const active = selected === cat;
        return (
          <Pressable
            key={cat}
            disabled={!onSelect}
            onPress={() => {
              tap();
              onSelect?.(cat);
            }}
            hitSlop={4}
            style={{
              gap: 4,
              paddingVertical: 4,
              paddingHorizontal: 6,
              marginHorizontal: -6,
              borderRadius: 8,
              backgroundColor: active ? `${color}1F` : 'transparent',
              opacity: selected && !active ? 0.45 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name={WORK_META[cat].iconActive} size={12} color={color} />
                <Txt variant="caption" style={{ color: c.text }} numberOfLines={1}>
                  {cat === 'personal' ? 'Personal' : WORK_META[cat].label}
                </Txt>
              </View>
              <Txt variant="caption">{formatMinutes(v)}</Txt>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.bgSoft, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (v / Math.max(1, targetMin)) * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingRight: 16,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
