import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, View } from 'react-native';
import { CalorieChart, mealColor, type CalorieFilter } from '@/components/charts/CalorieChart';
import { WeightChart } from '@/components/charts/WeightChart';
import { ModeSwitch } from '@/components/ModeSwitch';
import { WorkStats } from '@/components/work/WorkStats';
import { Button, Card, Chip, Divider, Input, Row, Screen, Segmented, success, tap, Txt } from '@/components/ui';
import { addDays, formatDayLabel, todayKey } from '@/lib/dates';
import { deleteWeight, getDailyKcalBySlot, getLatestWeight, getWeights, saveWeight } from '@/lib/db';
import { targetsFor } from '@/lib/nutrition';
import {
  calorieAverages,
  caloriesByDay,
  dayRange,
  MEAL_GROUP_LABEL,
  MEAL_GROUPS,
  weightByDay,
  weightChange,
  type DayCalories,
} from '@/lib/stats';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';

type Range = '7' | '30' | '90';

export default function Stats() {
  const mode = useAppStore((s) => s.mode);
  return mode === 'work' ? <WorkStats /> : <FoodStats />;
}

function FoodStats() {
  const { c } = useTheme();
  const profile = useAppStore((s) => s.profile)!;
  const setProfile = useAppStore((s) => s.setProfile);
  const version = useAppStore((s) => s.dataVersion);
  const bumpData = useAppStore((s) => s.bumpData);
  const target = targetsFor(profile).kcal;

  const [range, setRange] = useState<Range>('30');
  const [filter, setFilter] = useState<CalorieFilter>('all');
  const [calories, setCalories] = useState<DayCalories[]>([]);
  const [weights, setWeights] = useState<(number | null)[]>([]);

  const today = todayKey();
  const from = addDays(today, -(Number(range) - 1));
  const days = dayRange(from, today);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const range = dayRange(from, today);
      Promise.all([getDailyKcalBySlot(from, today), getWeights(from, today)]).then(([kcalRows, weightRows]) => {
        if (!alive) return;
        setCalories(caloriesByDay(range, kcalRows));
        setWeights(weightByDay(range, weightRows));
      });
      return () => {
        alive = false;
      };
    }, [from, today, version]),
  );

  const change = weightChange(weights);
  const avg = calorieAverages(calories);

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

      <Card style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Txt variant="h2">Weight</Txt>
          {change ? (
            <Txt variant="caption">
              {change.last} kg
              {change.delta !== 0 ? ` · ${change.delta > 0 ? '+' : '−'}${Math.abs(change.delta)} kg in ${range} days` : ''}
            </Txt>
          ) : null}
        </Row>
        <WeightLogger
          onSaved={async (date, kg) => {
            // Keep the profile (and so the calorie target) on the most recent weigh-in.
            const latest = await getLatestWeight();
            if (kg != null && latest?.date === date && latest.kg !== profile.weightKg) {
              await setProfile({ ...profile, weightKg: latest.kg });
            }
            bumpData();
          }}
          version={version}
        />
        <WeightChart key={`w${range}`} days={days} values={weights.length === days.length ? weights : days.map(() => null)} />
      </Card>

      <Card style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Txt variant="h2">Calories</Txt>
          <Txt variant="caption">
            avg {(filter === 'all' ? avg.total : avg[filter]).toLocaleString()} kcal/day
          </Txt>
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          {MEAL_GROUPS.map((g) => (
            <Chip key={g} label={MEAL_GROUP_LABEL[g]} selected={filter === g} onPress={() => setFilter(g)} />
          ))}
        </ScrollView>
        <CalorieChart
          key={`c${range}${filter}`}
          data={calories.length === days.length ? calories : days.map((date) => ({ date, breakfast: 0, lunch: 0, dinner: 0, snacks: 0, total: 0 }))}
          filter={filter}
          target={target}
        />

        <Divider />
        <Txt variant="caption">
          Daily average · {avg.loggedDays} of {days.length} days logged
        </Txt>
        <View style={{ gap: 8 }}>
          {MEAL_GROUPS.map((g) => (
            <Pressable
              key={g}
              onPress={() => {
                tap();
                setFilter(filter === g ? 'all' : g);
              }}
            >
              <Row style={{ justifyContent: 'space-between', opacity: filter === 'all' || filter === g ? 1 : 0.5 }}>
                <Row gap={8}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: mealColor(c, g) }} />
                  <Txt variant="body">{MEAL_GROUP_LABEL[g]}</Txt>
                </Row>
                <Txt variant="body">
                  {avg[g].toLocaleString()} kcal
                  <Txt variant="caption"> {avg.total ? ` ${Math.round((avg[g] / avg.total) * 100)}%` : ''}</Txt>
                </Txt>
              </Row>
            </Pressable>
          ))}
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="bodyBold">Total</Txt>
            <Txt variant="bodyBold">
              {avg.total.toLocaleString()} <Txt variant="caption">/ {target.toLocaleString()} kcal</Txt>
            </Txt>
          </Row>
        </View>
      </Card>
    </Screen>
  );
}

/** Log, change or remove the weight for one day (today by default, earlier days via the arrows). */
function WeightLogger({ onSaved, version }: { onSaved: (date: string, kg: number | null) => Promise<void>; version: number }) {
  const { c } = useTheme();
  const today = todayKey();
  const [date, setDate] = useState(today);
  const [saved, setSaved] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getWeights(date, date).then((rows) => {
      if (!alive) return;
      const kg = rows[0]?.kg ?? null;
      setSaved(kg);
      setText(kg != null ? String(kg) : '');
    });
    return () => {
      alive = false;
    };
  }, [date, version]);

  const save = async () => {
    const kg = Math.round(parseFloat(text.replace(',', '.')) * 10) / 10;
    if (!(kg >= 20 && kg <= 400)) {
      Alert.alert('Check the weight', 'Enter your weight in kg, between 20 and 400.');
      return;
    }
    setBusy(true);
    try {
      await saveWeight({ date, kg });
      Keyboard.dismiss();
      success();
      await onSaved(date, kg);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await deleteWeight(date);
    await onSaved(date, null);
  };

  return (
    <View style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable hitSlop={12} onPress={() => setDate(addDays(date, -1))}>
          <Ionicons name="chevron-back" size={20} color={c.textSoft} />
        </Pressable>
        <Txt variant="bodyBold">{formatDayLabel(date)}</Txt>
        <Pressable hitSlop={12} disabled={date >= today} onPress={() => setDate(addDays(date, 1))}>
          <Ionicons name="chevron-forward" size={20} color={date >= today ? c.border : c.textSoft} />
        </Pressable>
      </Row>
      <Row>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Weight in kg"
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={save}
          style={{ flex: 1 }}
        />
        <Button small title={saved != null ? 'Update' : 'Save'} onPress={save} loading={busy} disabled={!text.trim()} />
      </Row>
      {saved != null ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="caption">Logged {saved} kg</Txt>
          <Pressable hitSlop={8} onPress={remove}>
            <Txt variant="caption" color={c.danger}>
              Remove
            </Txt>
          </Pressable>
        </Row>
      ) : (
        <Txt variant="caption" faint>
          Skipped days are fine. They show as gaps in the chart.
        </Txt>
      )}
    </View>
  );
}
