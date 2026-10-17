import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../theme';
import { Icon } from '../../components/Icon';
import { strings } from '../../strings';

interface EditProfileScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [about, setAbout] = useState(profile?.about || strings.profile.defaultAbout);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    const cleanName = displayName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (cleanName.length < 2) return setErrorMsg('Name must be at least 2 characters.');
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return setErrorMsg(strings.auth.usernameFormatError);
    }

    setLoading(true);
    setErrorMsg('');

    if (cleanUsername !== profile?.username) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (data && data.id !== user?.id) {
        setLoading(false);
        return setErrorMsg(strings.auth.usernameTakenError);
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: cleanName,
        username: cleanUsername,
        about: about.trim(),
      })
      .eq('id', user?.id);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      await refreshProfile();
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.line }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Icon name="back" size={24} color={theme.colors.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
          {strings.profile.editTitle}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold }]}>
          {strings.auth.displayNameLabel}
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Alex Smith"
          placeholderTextColor={theme.colors.muted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              color: theme.colors.ink,
              fontFamily: theme.fonts.body,
              borderRadius: theme.radius,
            },
          ]}
        />

        <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold, marginTop: 16 }]}>
          {strings.auth.usernameLabel}
        </Text>
        <TextInput
          value={username}
          onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={20}
          autoCapitalize="none"
          placeholder="alex_99"
          placeholderTextColor={theme.colors.muted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              color: theme.colors.ink,
              fontFamily: theme.fonts.body,
              borderRadius: theme.radius,
            },
          ]}
        />

        <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold, marginTop: 16 }]}>
          {strings.profile.aboutLabel}
        </Text>
        <TextInput
          value={about}
          onChangeText={setAbout}
          maxLength={100}
          multiline
          placeholder="Write something about yourself…"
          placeholderTextColor={theme.colors.muted}
          style={[
            styles.input,
            styles.aboutInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              color: theme.colors.ink,
              fontFamily: theme.fonts.body,
              borderRadius: theme.radius,
            },
          ]}
        />

        {errorMsg ? (
          <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.body }]}>{errorMsg}</Text>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius,
              opacity: pressed || loading ? 0.8 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textOnAccent} />
          ) : (
            <Text style={[styles.saveBtnText, { color: theme.colors.textOnAccent, fontFamily: theme.fonts.bodySemiBold }]}>
              {strings.profile.saveChangesButton}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
  },
  body: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  aboutInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
  },
  saveBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    fontSize: 16,
  },
});
