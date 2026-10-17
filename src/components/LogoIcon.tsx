import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Rect, Path, G } from 'react-native-svg';
import { useTheme } from '../theme';

interface LogoIconProps {
  size?: number;
  style?: ViewStyle;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ size = 28, style }) => {
  const theme = useTheme();
  const greenColor = theme.colors.accent;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Left Solid Speech Bubble */}
        <Path
          d="M 22 24 C 22 17, 27 12, 34 12 L 62 12 C 69 12, 74 17, 74 24 L 74 46 C 74 53, 69 58, 62 58 L 44 58 L 32 68 L 32 58 L 34 58 C 27 58, 22 53, 22 46 Z"
          fill={greenColor}
        />
        {/* Right Outlined Speech Bubble */}
        <Path
          d="M 42 38 C 42 31, 47 26, 54 26 L 80 26 C 87 26, 92 31, 92 38 L 92 60 C 92 67, 87 72, 80 72 L 72 72 L 72 84 L 60 72 L 54 72 C 47 72, 42 67, 42 60 Z"
          stroke={greenColor}
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};
