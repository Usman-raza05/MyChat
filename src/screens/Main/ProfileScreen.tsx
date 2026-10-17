import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { strings } from '../../strings';
import { supabase } from '../../lib/supabase';

interface ProfileScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, profile, signOut } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [showPreviews, setShowPreviews] = React.useState(profile?.show_preview ?? true);

  React.useEffect(() => {
    if (profile?.show_preview !== undefined) {
      setShowPreviews(profile.show_preview);
    }
  }, [profile?.show_preview]);

  const handleTogglePreviews = async (val: boolean) => {
    setShowPreviews(val);
    if (user?.id) {
      await supabase.from('profiles').update({ show_preview: val }).eq('id', user.id);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      strings.general.logoutDialogTitle,
      strings.general.logoutDialogSub,
      [
        { text: strings.general.cancel, style: 'cancel' },
        { text: strings.auth.logoutButton, style: 'destructive', onPress: () => signOut() },
      ],
      { cancelable: true }
    );
  };

  const displayName = profile?.display_name || 'User';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.line,
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
          {strings.profile.title}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardBox}>
          <View style={styles.avatarCenter}>
            <Avatar name={displayName} avatarUrl={profile?.avatar_url} size={90} />
            <Text style={[styles.nameText, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>{displayName}</Text>
            {profile?.username ? (
              <Text style={[styles.usernameText, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold }]}>
                @{profile.username}
              </Text>
            ) : null}
          </View>

          <View style={[styles.infoSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.line, borderRadius: theme.radius }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold }]}>
                {strings.auth.emailLabel}
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.ink, fontFamily: theme.fonts.body }]}>{user?.email}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.line }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold }]}>
                {strings.profile.aboutLabel}
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.ink, fontFamily: theme.fonts.body }]}>
                {profile?.about || strings.profile.defaultAbout}
              </Text>
            </View>
          </View>

          <View style={[styles.infoSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.line, borderRadius: theme.radius }]}>
            <Text style={[styles.infoLabel, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold, marginBottom: 12 }]}>
              {strings.profile.notificationsTitle}
            </Text>
            <View style={styles.switchRow}>
              <Text style={[styles.infoValue, { color: theme.colors.ink, fontFamily: theme.fonts.body }]}>
                {strings.profile.notificationsTitle}
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.line }]} />
            <View style={styles.switchRow}>
              <Text style={[styles.infoValue, { color: theme.colors.ink, fontFamily: theme.fonts.body }]}>
                {strings.profile.showMessagePreviews}
              </Text>
              <Switch
                value={showPreviews}
                onValueChange={handleTogglePreviews}
                trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
              />
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.colors.accent,
                borderRadius: theme.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.textOnAccent, fontFamily: theme.fonts.bodySemiBold }]}>
              {strings.profile.editTitle}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.logoutBtn,
              {
                borderColor: theme.colors.danger,
                borderRadius: theme.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.danger, fontFamily: theme.fonts.bodySemiBold }]}>
              {strings.auth.logoutButton}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </View>
      );
};

      const styles = StyleSheet.create({
        container: {
        flex: 1,
  },
      headerBar: {
        paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
  },
      title: {
        fontSize: 26,
      letterSpacing: -0.5,
  },
      cardBox: {
        padding: 20,
  },
      avatarCenter: {
        alignItems: 'center',
      marginVertical: 16,
  },
      nameText: {
        fontSize: 24,
      marginTop: 12,
  },
      usernameText: {
        fontSize: 15,
      marginTop: 2,
  },
      infoSection: {
        borderWidth: 1,
      padding: 16,
      marginVertical: 16,
  },
      infoRow: {
        marginVertical: 4,
  },
      switchRow: {
        flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 4,
  },
      infoLabel: {
        fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
  },
      infoValue: {
        fontSize: 16,
  },
      divider: {
        height: 1,
      marginVertical: 12,
  },
      actionBtn: {
        height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
  },
      logoutBtn: {
        borderWidth: 1.5,
      backgroundColor: 'transparent',
  },
      actionBtnText: {
        fontSize: 16,
  },
});
