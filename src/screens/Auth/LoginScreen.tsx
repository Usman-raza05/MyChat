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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../theme';
import { LogoIcon } from '../../components/LogoIcon';
import { strings } from '../../strings';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setErrorMsg(strings.auth.invalidEmail);
    if (!password) return setErrorMsg(strings.auth.passwordMinLength);

    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg(strings.general.genericError);
      } else {
        setErrorMsg(error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top + 10, 30), paddingBottom: Math.max(insets.bottom + 10, 20) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <LogoIcon size={32} />
          <Text style={[styles.brand, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
            MyChat
          </Text>
        </View>

        <View style={styles.centerBox}>
          <Text style={[styles.h1, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
            {strings.auth.welcomeBack}
          </Text>
          <Text style={[styles.sub, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}>
            {strings.auth.welcomeSub}
          </Text>

          <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold }]}>
            {strings.auth.emailLabel}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={strings.auth.emailPlaceholder}
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
            {strings.auth.passwordLabel}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
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

          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
          >
            <Text style={[styles.forgotText, { color: theme.colors.accent, fontFamily: theme.fonts.bodySemiBold }]}>
              {strings.auth.forgotPasswordLink}
            </Text>
          </Pressable>

          {errorMsg ? (
            <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.body }]}>
              {errorMsg}
            </Text>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.goBtn,
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
              <Text style={[styles.goBtnText, { color: theme.colors.textOnAccent, fontFamily: theme.fonts.bodySemiBold }]}>
                {strings.auth.loginButton}
              </Text>
            )}
          </Pressable>

          <View style={styles.footerRow}>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text
                style={{ color: theme.colors.accent, fontFamily: theme.fonts.bodySemiBold, fontSize: 15 }}
              >
                {strings.auth.newHereLink}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginVertical: 20,
  },
  h1: {
    fontSize: 38,
    lineHeight: 42,
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
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 13.5,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
  },
  goBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  goBtnText: {
    fontSize: 17,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
});
