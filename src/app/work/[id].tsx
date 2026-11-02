import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { View } from 'react-native';
import { Mascot } from '@/components/Mascot';
import { CategoryIcon, workColor } from '@/components/work/parts';
import { Button, Card, Divider, Row, Screen, Txt } from '@/components/ui';
import { dayKey, formatDayLabel, formatTime, parseDayKey } from '@/lib/dates';
import { getWorkSession } from '@/lib/db';
import type { WorkSession } from '@/lib/types';
import { formatMinutes, sessionTitle, WORK_META } from '@/lib/work';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Read-only view of one work session; editing happens on the log screen. */
export default function WorkSessionDetail() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const version = useAppStore((s) => s.dataVersion);
  const target = useAppStore((s) => s.workTargetMin);
  const [session, setSession] = useState<WorkSession | null | undefined>(undefined);
  const seen = useRef(false);

  useFocusEffect(
    useCallback(() => {
      getWorkSession(id).then((s) => {
        // Deleted from the edit screen: nothing left to show here, so go back to the list.
        if (!s && seen.current) {
          router.back();
          return;
        }
        if (s) seen.current = true;
        setSession(s);
      });
    }, [id, version]),
  );

  if (session === undefined) return <Screen edges={[]}>{null}</Screen>;
  if (session === null) {
    return (
      <Screen edges={[]} contentStyle={{ alignItems: 'center' }}>
        <Mascot mood="dizzy" />
        <Txt variant="body">This session no longer exists.</Txt>
      </Screen>
    );
  }

  const meta = WORK_META[session.category];
  const color = workColor(c, session.category);
  const end = new Date(session.loggedAt);
  const start = new Date(end.getTime() - session.minutes * 60_000);
  const share = Math.round((session.minutes / Math.max(1, target)) * 100);
  const fullDate = parseDayKey(session.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const edited = session.updatedAt !== session.createdAt;
  const createdLabel = formatDayLabel(dayKey(new Date(session.createdAt)));
  const loggedDay = createdLabel === 'Today' || createdLabel === 'Yesterday' ? createdLabel.toLowerCase() : `on ${createdLabel}`;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Session' }} />

      <Card style={{ gap: 14 }}>
        <Txt variant="title">{sessionTitle(session)}</Txt>
        <Row gap={10}>
          <CategoryIcon category={session.category} size={36} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyBold">{meta.label}</Txt>
            <Txt variant="caption">{meta.hint}</Txt>
          </View>
        </Row>
        <View>
          <Txt variant="display">{formatMinutes(session.minutes)}</Txt>
          <Txt variant="caption">
            {share}% of your {formatMinutes(target)} daily goal
          </Txt>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: c.bgSoft, overflow: 'hidden' }}>
          <View style={{ width: `${Math.min(100, share)}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
        </View>
      </Card>

      <Card style={{ gap: 4 }}>
        <InfoRow icon="calendar-outline" label="Day" value={formatDayLabel(session.date)} detail={fullDate} />
        <Divider />
        <InfoRow icon="time-outline" label="Time" value={`${formatTime(start)} – ${formatTime(end)}`} detail={`Finished at ${formatTime(end)}`} />
        <Divider />
        <InfoRow icon="hourglass-outline" label="Duration" value={formatMinutes(session.minutes)} />
      </Card>

      <View style={{ borderLeftWidth: 3, borderLeftColor: color, paddingLeft: 14, paddingVertical: 2, gap: 2 }}>
        <Txt variant="caption" faint>
          Description
        </Txt>
        {session.note ? (
          <Txt variant="quote">{session.note}</Txt>
        ) : (
          <Txt variant="quote" faint>
            No description added
          </Txt>
        )}
      </View>

      <Txt variant="caption" faint style={{ textAlign: 'center' }}>
        Logged {loggedDay} at {formatTime(new Date(session.createdAt))}
        {edited ? ` · edited ${formatTime(new Date(session.updatedAt))}` : ''}
      </Txt>

      <Button
        title="Edit session"
        icon={<Ionicons name="create-outline" size={18} color={c.onAccent} />}
        onPress={() => router.push({ pathname: '/work/log', params: { id: session.id } })}
      />
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  detail?: string;
}) {
  const { c } = useTheme();
  return (
    <Row gap={12} style={{ paddingVertical: 6 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgSoft }}>
        <Ionicons name={icon} size={18} color={c.textSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="caption">{label}</Txt>
        {detail ? <Txt variant="caption" faint>{detail}</Txt> : null}
      </View>
      <Txt variant="bodyBold">{value}</Txt>
    </Row>
  );
}
