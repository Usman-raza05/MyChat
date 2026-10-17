import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../components/Icon';
import { useTheme } from '../../theme';

const ALL_ICONS: IconName[] = [
  'back',
  'chevron-right',
  'close',
  'more-vertical',
  'search',
  'plus',
  'new-chat',
  'settings',
  'logout',
  'send',
  'attach',
  'camera',
  'mic',
  'emoji',
  'reply',
  'copy',
  'trash',
  'edit',
  'info',
  'bell',
  'clock',
  'check',
  'checks',
  'checks-read',
  'alert-circle',
  'refresh',
  'user',
  'mail',
  'lock',
  'eye',
  'eye-off',
  'camera-plus',
  'at-sign',
  'wifi-off',
  'chats',
  'profile',
];

export const IconGalleryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.line }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Icon name="back" size={24} color={theme.colors.ink} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
          Icon Gallery
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {ALL_ICONS.map((iconName) => (
          <View
            key={iconName}
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.line },
            ]}
          >
            <Icon name={iconName} size={28} color={theme.colors.ink} />
            <Text
              numberOfLines={1}
              style={[styles.iconText, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}
            >
              {iconName}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  title: {
    fontSize: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  card: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconText: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});
