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
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../theme';
import { strings } from '../../strings';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setErrorMsg(strings.auth.invalidEmail);

    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      Alert.alert(
        strings.auth.resetLinkSentTitle,
        strings.auth.resetLinkSentSub,
        [{ text: strings.general.done, onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 10, 20), paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Text style={{ color: theme.colors.ink, fontSize: 26, fontFamily: theme.fonts.heading }}>‹ Back</Text>
        </Pressable>

        <View style={styles.centerBox}>
          <Text style={[styles.h1, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
            {strings.auth.resetTitle}
          </Text>
          <Text style={[styles.sub, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}>
            {strings.auth.resetSub}
          </Text>

          <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.bodySemiBold }]}>
            {strings.auth.emailLabel}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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

          {errorMsg ? (
            <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.body }]}>
              {errorMsg}
            </Text>
          ) : null}

          <Pressable
            onPress={handleReset}
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
                {strings.auth.sendResetLinkButton}
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
  backBtn: {
    alignSelf: 'flex-start',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
  },
  h1: {
    fontSize: 34,
    letterSpacing: -0.8,
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
});
