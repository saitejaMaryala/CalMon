import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, LogBox, type NativeScrollEvent, type NativeSyntheticEvent, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { tap } from './ui';

// The wheel is a fixed-height list that scrolls on its own inside the page's ScrollView, so its
// virtualization still works; React Native's generic "nested VirtualizedList" warning doesn't apply.
LogBox.ignoreLogs(['VirtualizedLists should never be nested inside plain ScrollViews']);

export const WHEEL_ROW = 44;
/** Rows visible at once; the middle one is the selection. */
export const WHEEL_VISIBLE = 5;
const SIDE = (WHEEL_VISIBLE - 1) / 2;
/** How many times the values repeat, so the wheel feels endless in both directions. */
const REPEAT = 200;

/**
 * Endless scrolling wheel over `values` (e.g. 0–12 or 0–59) that wraps around.
 * Fading and scaling of the rows runs on the native driver; `onChange` fires once the wheel settles.
 */
export function WheelPicker({
  values,
  value,
  onChange,
  format = String,
  width = 76,
  align = 'center',
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  width?: number;
  /** 'right' tucks the numbers against a unit label placed to the right of the wheel. */
  align?: 'center' | 'right';
}) {
  const { c } = useTheme();
  const n = values.length;
  const listRef = useRef<FlatList<number>>(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  const data = useMemo(() => Array.from({ length: n * REPEAT }, (_, i) => values[i % n]), [values, n]);

  const middleIndexFor = useCallback((v: number) => Math.floor(REPEAT / 2) * n + Math.max(0, values.indexOf(v)), [values, n]);
  const [initialIndex] = useState(() => middleIndexFor(value));
  /** Row currently under the selection band, and the value it last reported. */
  const current = useRef({ index: initialIndex, value });

  // Follow outside changes (quick-pick chips, loading an existing session) by spinning to the nearest copy.
  useEffect(() => {
    if (value === current.current.value) return;
    const from = current.current.index;
    const delta = (((values.indexOf(value) - (from % n)) % n) + n) % n;
    const target = from + (delta > n / 2 ? delta - n : delta);
    current.current = { index: target, value };
    listRef.current?.scrollToOffset({ offset: target * WHEEL_ROW, animated: true });
  }, [value, values, n]);

  const indexAt = (y: number) => Math.max(0, Math.min(data.length - 1, Math.round(y / WHEEL_ROW)));

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = indexAt(y);
    const v = data[index];
    // Android's snapping can stop a few pixels off inside a nested scroll; glide onto the row.
    if (Math.abs(y - index * WHEEL_ROW) > 0.5) {
      listRef.current?.scrollToOffset({ offset: index * WHEEL_ROW, animated: true });
    }
    // Drifted far from the middle: jump to the same value near the middle so the wheel never runs out.
    if (index < n * 10 || index > n * (REPEAT - 10)) {
      const mid = middleIndexFor(v);
      listRef.current?.scrollToOffset({ offset: mid * WHEEL_ROW, animated: false });
      current.current = { index: mid, value: v };
    } else {
      current.current = { index, value: v };
    }
    if (v !== value) onChange(v);
  };

  // Light haptic tick each time a new row crosses the band while scrolling.
  const [onScroll] = useState(() => {
    let lastTick = initialIndex;
    return Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const i = Math.round(e.nativeEvent.contentOffset.y / WHEEL_ROW);
        if (i !== lastTick) {
          lastTick = i;
          tap();
        }
      },
    });
  });

  return (
    <View style={{ width, height: WHEEL_ROW * WHEEL_VISIBLE }}>
      <Animated.FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: WHEEL_ROW, offset: WHEEL_ROW * i, index: i })}
        initialScrollIndex={initialIndex}
        contentContainerStyle={{ paddingVertical: WHEEL_ROW * SIDE }}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW}
        decelerationRate="fast"
        nestedScrollEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={(e) => {
          // A slow drag can stop without momentum; settle right away in that case.
          if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) settle(e);
        }}
        initialNumToRender={WHEEL_VISIBLE + 4}
        maxToRenderPerBatch={12}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item, index }) => {
          const center = index * WHEEL_ROW;
          const range = [center - 2 * WHEEL_ROW, center - WHEEL_ROW, center, center + WHEEL_ROW, center + 2 * WHEEL_ROW];
          return (
            <View style={{ height: WHEEL_ROW, alignItems: align === 'right' ? 'flex-end' : 'center', justifyContent: 'center' }}>
              <Animated.Text
                style={{
                  fontFamily: fonts.heavy,
                  fontSize: 30,
                  lineHeight: 36,
                  // Android pads text for accents by default, which pushes digits below the row's center.
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                  color: c.text,
                  letterSpacing: -0.5,
                  transformOrigin: align === 'right' ? 'right' : 'center',
                  opacity: scrollY.interpolate({ inputRange: range, outputRange: [0.15, 0.4, 1, 0.4, 0.15], extrapolate: 'clamp' }),
                  transform: [
                    { scale: scrollY.interpolate({ inputRange: range, outputRange: [0.62, 0.78, 1, 0.78, 0.62], extrapolate: 'clamp' }) },
                  ],
                }}
              >
                {format(item)}
              </Animated.Text>
            </View>
          );
        }}
      />
    </View>
  );
}
