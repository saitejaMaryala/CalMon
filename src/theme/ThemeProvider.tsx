import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { dark, light, workAccent, type Palette } from './tokens';

interface Theme {
  c: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({ c: light, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useAppStore((s) => s.themePref);
  const system = useColorScheme();
  const mode = useAppStore((s) => s.mode);
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  const base = isDark ? dark : light;
  const c = useMemo(
    () => (mode === 'work' ? { ...base, ...(isDark ? workAccent.dark : workAccent.light) } : base),
    [base, isDark, mode],
  );
  return <ThemeContext.Provider value={{ c, isDark }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
