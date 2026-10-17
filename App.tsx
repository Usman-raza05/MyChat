import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setupNotificationOpenedListener } from './src/lib/notifications';
import { migrateStorageKeys } from './src/utils/storageMigration';

export const navigationRef = createNavigationContainerRef();

export default function App() {
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    console.log('[boot] App mounted');
    migrateStorageKeys().catch((e) => console.warn('[boot] Storage migration error:', e));
    try {
      setupNotificationOpenedListener(navigationRef);
    } catch (e) {
      console.error('[boot] Error setting up notification listener:', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
