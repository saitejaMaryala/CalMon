import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DateTimeChips } from '@/components/WhenPicker';
import { WHEEL_ROW, WHEEL_VISIBLE, WheelPicker } from '@/components/WheelPicker';
import { CategoryIcon, workColor } from '@/components/work/parts';
import { Button, Card, Chip, Input, Row, Screen, success, tap, Txt } from '@/components/ui';
import { atTime, dayKey, newId, todayKey } from '@/lib/dates';
import { deleteWorkSession, getWorkSession, saveWorkSession } from '@/lib/db';
import type { WorkCategory, WorkSession } from '@/lib/types';
import { formatMinutes, QUICK_DURATIONS, WORK_CATEGORIES, WORK_META } from '@/lib/work';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

const HOURS = Array.from({ length: 13 }, (_, i) => i); // 0–12, wraps around
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 00–59, wraps around
const pad2 = (v: number) => String(v).padStart(2, '0');

export default function LogWork() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ id?: string; date?: string; category?: string }>();
  const bumpData = useAppStore((s) => s.bumpData);

  const [existing, setExisting] = useState<WorkSession | null>(null);
  const [category, setCategory] = useState<WorkCategory>(() =>
    WORK_CATEGORIES.includes(params.category as WorkCategory) ? (params.category as WorkCategory) : 'academics',
  );
  const [minutes, setMinutes] = useState(60);
  const [when, setWhen] = useState<Date>(() => {
    const day = params.date ?? todayKey();
    // Back-filling another day defaults to the evening; today defaults to now.
    return day === todayKey() ? new Date() : atTime(day, 18, 0);
  });
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    getWorkSession(params.id).then((s) => {
      if (!s) return;
      setExisting(s);
      setCategory(s.category);
      setTitle(s.title);
      setMinutes(s.minutes);
      setWhen(new Date(s.loggedAt));
      setNote(s.note);
    });
  }, [params.id]);

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const setHours = (h: number) => setMinutes(h * 60 + mins);
  const setMins = (m: number) => setMinutes(hours * 60 + m);

  const save = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await saveWorkSession({
        id: existing?.id ?? newId(),
        date: dayKey(when),
        category,
        title: title.trim(),
        minutes,
        loggedAt: when.toISOString(),
        note: note.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      bumpData();
      success();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete this session?', `${title.trim() || WORK_META[category].label} · ${formatMinutes(minutes)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkSession(existing!.id);
          bumpData();
          router.back();
        },
      },
    ]);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: existing ? 'Edit session' : 'Log work' }} />

      <View style={{ gap: 8 }}>
        <Txt variant="h2">Title</Txt>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Linear algebra homework"
          returnKeyType="done"
          maxLength={80}
          style={{ fontFamily: fonts.bold, fontSize: 16 }}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="h2">Category</Txt>
        {WORK_CATEGORIES.map((cat) => {
          const active = cat === category;
          const color = workColor(c, cat);
          return (
            <Pressable
              key={cat}
              onPress={() => {
                tap();
                setCategory(cat);
              }}
              style={[
                styles.category,
                { backgroundColor: c.card, borderColor: active ? color : c.border, borderWidth: active ? 2 : 1 },
              ]}
            >
              <CategoryIcon category={cat} size={44} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyBold">{WORK_META[cat].label}</Txt>
                <Txt variant="caption">{WORK_META[cat].hint}</Txt>
              </View>
              <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={active ? color : c.border} />
            </Pressable>
          );
        })}
      </View>

      <Card style={{ gap: 14 }}>
        <Txt variant="h2">How long?</Txt>
        <View style={{ height: WHEEL_ROW * WHEEL_VISIBLE, justifyContent: 'center' }}>
          {/* Selection band behind the middle row of both wheels. */}
          <View
            pointerEvents="none"
            style={[styles.band, { top: WHEEL_ROW * ((WHEEL_VISIBLE - 1) / 2), height: WHEEL_ROW, backgroundColor: c.primarySoft }]}
          />
          <Row style={{ justifyContent: 'center', gap: 6 }}>
            <WheelPicker values={HOURS} value={hours} onChange={setHours} width={56} align="right" />
            <Txt style={[styles.unit, { color: c.textSoft }]}>h</Txt>
            <View style={{ width: 28 }} />
            <WheelPicker values={MINUTES} value={mins} onChange={setMins} format={pad2} width={60} align="right" />
            <Txt style={[styles.unit, { color: c.textSoft }]}>min</Txt>
          </Row>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {QUICK_DURATIONS.map((q) => (
            <Chip key={q} label={formatMinutes(q)} selected={minutes === q} onPress={() => setMinutes(q)} />
          ))}
        </ScrollView>
      </Card>

      <DateTimeChips when={when} onWhen={setWhen} />

      <Input value={note} onChangeText={setNote} placeholder="Description (optional), e.g. finished chapter 3" multiline />

      <Button
        title={minutes === 0 ? 'Pick how long you worked' : existing ? 'Save changes' : `Log ${formatMinutes(minutes)}`}
        onPress={save}
        disabled={minutes === 0}
        loading={saving}
        icon={<Ionicons name="checkmark" size={20} color={c.onAccent} />}
      />
      {existing ? <Button title="Delete session" kind="danger" onPress={remove} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  category: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md },
  band: { position: 'absolute', left: 0, right: 0, borderRadius: 12 },
  // Nudged down so the unit shares a baseline with the big wheel digits.
  unit: { fontFamily: fonts.heading, fontSize: 18, includeFontPadding: false, marginTop: 7 },
});
