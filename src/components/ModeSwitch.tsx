import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import type { AppMode } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { tap, Txt } from './ui';

const OPTIONS: { mode: AppMode; label: string; icon: 'restaurant' | 'briefcase' }[] = [
  { mode: 'food', label: 'Food', icon: 'restaurant' },
  { mode: 'work', label: 'Work', icon: 'briefcase' },
];

/** Food / Work toggle; switching changes what Today, History and Stats track. */
export function ModeSwitch() {
  const { c } = useTheme();
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(mode === 'work' ? 1 : 0));

  useEffect(() => {
    Animated.timing(x, {
      toValue: mode === 'work' ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, x]);

  const half = (width - 8) / 2;

  return (
    <View
      style={[styles.track, { backgroundColor: c.bgSoft, borderColor: c.border }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {width > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            { width: half, backgroundColor: c.primary, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, half] }) }] },
          ]}
        />
      ) : null}
      {OPTIONS.map((o) => {
        const active = o.mode === mode;
        return (
          <Pressable
            key={o.mode}
            style={styles.option}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              tap();
              setMode(o.mode);
            }}
          >
            <Ionicons name={active ? o.icon : (`${o.icon}-outline` as const)} size={16} color={active ? c.onAccent : c.textSoft} />
            <Txt variant="caption" color={active ? c.onAccent : c.textSoft} style={{ fontFamily: fonts.bold, fontSize: 13 }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 999, padding: 4, borderWidth: 1 },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 999 },
  option: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
});
