import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatListScreen } from '../screens/Main/ChatListScreen';
import { ProfileScreen } from '../screens/Main/ProfileScreen';
import { Icon } from '../components/Icon';
import { useTheme } from '../theme';
import { strings } from '../strings';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.line,
          height: 56 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatListScreen as any}
        options={{
          tabBarLabel: strings.chatList.title,
          tabBarIcon: ({ color, focused }) => (
            <Icon name="chats" size={22} color={color} active={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen as any}
        options={{
          tabBarLabel: strings.profile.title,
          tabBarIcon: ({ color, focused }) => (
            <Icon name="profile" size={22} color={color} active={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
