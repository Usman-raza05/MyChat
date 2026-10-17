import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme';
import { LogoIcon } from '../../components/LogoIcon';
import { strings } from '../../strings';

export const OnboardingScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setAvailable(null);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      setChecking(false);
      setAvailable(!data || data.id === user?.id);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, user?.id]);

  const handleSave = async () => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return setErrorMsg(strings.auth.usernameFormatError);
    }
    if (available === false) {
      return setErrorMsg(strings.auth.usernameTakenError);
    }
    if (cleanName.length < 2) {
      return setErrorMsg('Display name must be at least 2 characters.');
    }

    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({
        username: cleanUsername,
        display_name: cleanName,
      })
      .eq('id', user?.id);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      await refreshProfile();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 10, 30), paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        <View style={styles.brandRow}>
          <LogoIcon size={32} />
          <Text style={[styles.brand, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
            MyChat
          </Text>
        </View>

        <View style={styles.centerBox}>
          <Text style={[styles.h1, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
            Set up profile
          </Text>
          <Text style={[styles.sub, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}>
            Choose a unique username and display name for your profile.
          </Text>

          <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold }]}>
            {strings.auth.usernameLabel}
          </Text>
          <View style={styles.inputWrap}>
            <Text style={[styles.prefix, { color: theme.colors.muted, fontFamily: theme.fonts.heading }]}>@</Text>
            <TextInput
              value={username}
              onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={20}
              autoCapitalize="none"
              placeholder="alex_99"
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.usernameInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.line,
                  color: theme.colors.ink,
                  fontFamily: theme.fonts.bodySemiBold,
                  borderRadius: theme.radius,
                },
              ]}
            />
          </View>
          {checking && (
            <Text style={{ color: theme.colors.muted, fontSize: 13, marginTop: 4, fontFamily: theme.fonts.body }}>
              Checking availability…
            </Text>
          )}
          {!checking && available === true && (
            <Text style={{ color: theme.colors.live, fontSize: 13, marginTop: 4, fontFamily: theme.fonts.body }}>
              ✓ Username is available!
            </Text>
          )}
          {!checking && available === false && (
            <Text style={{ color: theme.colors.danger, fontSize: 13, marginTop: 4, fontFamily: theme.fonts.body }}>
              ✕ Username unavailable
            </Text>
          )}

          <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold, marginTop: 18 }]}>
            {strings.auth.displayNameLabel}
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={30}
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

          {errorMsg ? (
            <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.body }]}>
              {errorMsg}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={loading || available === false}
            style={({ pressed }) => [
              styles.goBtn,
              {
                backgroundColor: theme.colors.accent,
                borderRadius: theme.radius,
                opacity: pressed || loading || available === false ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textOnAccent} />
            ) : (
              <Text style={[styles.goBtnText, { color: theme.colors.textOnAccent, fontFamily: theme.fonts.bodySemiBold }]}>
                Complete Setup →
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    fontSize: 22,
    letterSpacing: -0.2,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
  },
  h1: {
    fontSize: 38,
    letterSpacing: -1,
  },
  sub: {
    fontSize: 16,
    marginTop: 6,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    fontSize: 20,
    marginRight: 6,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
  },
  goBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  goBtnText: {
    fontSize: 17,
  },
});
