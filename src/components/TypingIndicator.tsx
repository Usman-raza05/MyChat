import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { strings } from '../strings';

interface TypingIndicatorProps {
  username?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.accent,
            fontFamily: theme.fonts.bodySemiBold,
          },
        ]}
      >
        {username ? `${username} is ${strings.chatScreen.typing}` : strings.chatScreen.typing}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12.5,
  },
});
