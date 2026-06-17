import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n'; // initialise i18next before any screen renders
import { SavedSchoolsProvider } from '@/components/useSavedSchools';
import { AuthProvider } from '@/lib/auth';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const { colors: c, dark } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
        <SavedSchoolsProvider>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: c.surface },
              headerTintColor: c.text,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: c.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="school/[id]" options={{ title: '' }} />
            <Stack.Screen
              name="school/review/[id]"
              options={{ presentation: 'modal', title: '' }}
            />
            <Stack.Screen
              name="auth"
              options={{ presentation: 'modal', title: '' }}
            />
            <Stack.Screen name="legal/privacy" options={{ title: '' }} />
            <Stack.Screen name="legal/terms" options={{ title: '' }} />
          </Stack>
        </SavedSchoolsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
