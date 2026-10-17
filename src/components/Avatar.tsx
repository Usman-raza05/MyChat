import React from 'react';
import { View, Text, Image, StyleSheet, useColorScheme } from 'react-native';
import { useTheme } from '../theme';
import { generateAvatarColors } from '../utils/dateUtils';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 46,
  isOnline = false,
}) => {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';

  const cleanName = (name || 'User').trim();
  const nameParts = cleanName.split(' ');
  const initial =
    nameParts.length > 1
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
      : cleanName.charAt(0).toUpperCase();

  const { bg: avatarBg, text: avatarTextColor } = generateAvatarColors(cleanName, isDark);
  const borderRadius = size / 2;
  const fontSize = size * 0.38;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius,
              backgroundColor: avatarBg,
            },
          ]}
        >
          <Text
            style={[
              styles.initial,
              {
                color: avatarTextColor,
                fontSize,
                fontFamily: theme.fonts.bodySemiBold,
              },
            ]}
          >
            {initial}
          </Text>
        </View>
      )}

      {isOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              width: Math.max(10, size * 0.26),
              height: Math.max(10, size * 0.26),
              borderRadius: size * 0.13,
              backgroundColor: theme.colors.live,
              borderColor: theme.colors.surface,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    letterSpacing: -0.2,
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
  },
});
