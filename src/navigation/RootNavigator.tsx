import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { useTheme } from '../theme';

import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { ChatScreen } from '../screens/Main/ChatScreen';
import { NewChatScreen } from '../screens/Main/NewChatScreen';
import { EditProfileScreen } from '../screens/Main/EditProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const theme = useTheme();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.brand, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
          <Text style={{ color: theme.colors.accent }}>● </Text>MyChat
        </Text>
        <ActivityIndicator color={theme.colors.accent} size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!user ? (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : !profile?.username ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Chat" component={ChatScreen as any} />
          <Stack.Screen name="NewChat" component={NewChatScreen as any} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen as any} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 36,
    letterSpacing: -1,
  },
});
