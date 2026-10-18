import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { cleanupOldPhotosDaily } from '@/lib/photoCleanup';
import { useAppStore } from '@/store/useAppStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch((e) => {
      console.error('Failed to load data', e);
      useAppStore.setState({ hydrated: true });
    });
  }, [hydrate]);

  // Once a day (first launch, or first return to the app that day), delete photos older than a week.
  useEffect(() => {
    if (!hydrated) return;
    const run = () =>
      cleanupOldPhotosDaily()
        .then((deleted) => deleted > 0 && useAppStore.getState().bumpData())
        .catch((e) => console.warn('Photo cleanup failed', e));
    run();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && run());
    return () => sub.remove();
  }, [hydrated]);

  const ready = (fontsLoaded || !!fontError) && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppStack() {
  const { c, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerTitleStyle: { fontFamily: fonts.bold, color: c.text },
          contentStyle: { backgroundColor: c.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="capture" options={{ title: 'Log a meal', presentation: 'modal' }} />
        <Stack.Screen name="handoff" options={{ title: 'Ask a chat app' }} />
        <Stack.Screen name="review" options={{ title: 'Review' }} />
        <Stack.Screen name="meal/[id]" options={{ title: 'Meal' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile & goal' }} />
      </Stack>
    </>
  );
}
