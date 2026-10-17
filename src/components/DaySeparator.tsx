import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface DaySeparatorProps {
  label: string;
}

export const DaySeparator: React.FC<DaySeparatorProps> = ({ label }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.line,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: theme.colors.muted,
              fontFamily: theme.fonts.bodySemiBold,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
});
