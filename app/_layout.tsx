import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { StudioProvider } from '@/contexts/StudioContext';
import { SplashProvider } from '@/contexts/SplashContext';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { fetchStudioData } from '@/lib/studio-data';
import { PublishedItem } from '@/types';
import { Image } from 'expo-image';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Trajan': require('../assets/fonts/trajan-pro-regular.ttf'),
    ...FontAwesome.font,
  });
  const [dataReady, setDataReady] = useState(false);
  const [preloadedItems, setPreloadedItems] = useState<PublishedItem[]>([]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Preload data for STUDIO tab during splash
  useEffect(() => {
    const preloadData = async () => {
      try {
        console.log('[Layout] Starting data preload...');

        // 1. Fetch JSON data
        const items = await fetchStudioData();
        setPreloadedItems(items);
        console.log(`[Layout] Data preload complete. Count: ${items.length}`);

        // 2. Prefetch first image to cache (with 3 second timeout)
        if (items.length > 0) {
          const firstItem = items[0];
          const imageUrl = firstItem.image_url || firstItem.thumbnail_url;

          if (imageUrl) {
            console.log('[Layout] Attempting safe prefetch:', imageUrl);
            try {
              // 3秒でタイムアウトするPromiseを作成
              const prefetchTask = Image.prefetch([imageUrl]);
              const timeoutTask = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Prefetch timeout')), 3000)
              );

              // どちらか早い方を待つ
              await Promise.race([prefetchTask, timeoutTask]);
              console.log('[Layout] Prefetch success');
            } catch (e) {
              console.warn('[Layout] Prefetch skipped (timeout or error):', e);
              // エラーになっても dataReady は true にしてアプリを起動させる
            }
          }
        }

        setDataReady(true);
      } catch (error) {
        console.error('[Layout] Failed to preload data:', error);
        // Even if data fails, allow transition
        setDataReady(true);
      }
    };

    if (loaded) {
      preloadData();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SplashProvider>
      <StudioProvider initialItems={preloadedItems}>
        <RootLayoutNav />
        {/* Overlay splash screen on top of app */}
        <AnimatedSplashScreen dataReady={dataReady} />
      </StudioProvider>
    </SplashProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="fusion" options={{ headerShown: false }} />
          <Stack.Screen name="item" options={{ headerShown: false }} />
          <Stack.Screen name="event" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
