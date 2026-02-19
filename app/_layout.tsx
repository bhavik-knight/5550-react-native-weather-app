import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

async function initializeDatabase(db: SQLiteDatabase) {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        city_name TEXT NOT NULL UNIQUE
      );
    `);
    // Warm up the database
    await db.getFirstAsync('SELECT 1');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SQLiteProvider
      databaseName="weather_v15.db"
      onInit={initializeDatabase}
    >
      <RootLayoutNav />
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [isDbReady, setIsDbReady] = React.useState(false);
  const db = useSQLiteContext();

  useEffect(() => {
    const verify = async () => {
      try {
        // Force synchronization with native side
        await db.execAsync("SELECT 1;");
        setIsDbReady(true);
      } catch (e) {
        console.warn("DB not ready, retrying verify...", e);
        setTimeout(verify, 200);
      }
    };
    verify();
  }, [db]);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="weather-detail" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
