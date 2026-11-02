import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { progressColors } from '@/lib/color';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './ui';

/**
 * Ring that fills toward a target, shifting red → green on the way.
 * With `overflow`, going past the target draws a red second lap (for limits like calories).
 */
export function ProgressRing({
  value,
  target,
  size = 168,
  overflow = false,
  children,
}: {
  value: number;
  target: number;
  size?: number;
  overflow?: boolean;
  children: ReactNode;
}) {
  const { c, isDark } = useTheme();
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ratio = value / Math.max(1, target);
  const main = Math.min(1, ratio);
  const extra = overflow && ratio > 1 ? Math.min(1, ratio - 1) : 0;
  const ring = progressColors(main, isDark);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={ring.track} strokeWidth={stroke} fill="none" />
        {main > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ring.fill}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ * main} ${circ}`}
          />
        )}
        {extra > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={c.danger}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ * extra} ${circ}`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

/** Calories left today; red → green as you approach the target, red lap when over. */
export function CalorieRing({ consumed, target, size = 168 }: { consumed: number; target: number; size?: number }) {
  const left = Math.round(target - consumed);
  return (
    <ProgressRing value={consumed} target={target} size={size} overflow>
      <Txt variant="display" style={{ fontSize: 32 }}>
        {Math.abs(left).toLocaleString()}
      </Txt>
      <Txt variant="caption">{left >= 0 ? 'kcal left' : 'kcal over'}</Txt>
    </ProgressRing>
  );
}
