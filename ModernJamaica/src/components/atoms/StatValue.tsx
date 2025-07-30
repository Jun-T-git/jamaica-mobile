import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Typography } from './Typography';
import { ModernDesign } from '../../constants';

interface StatValueProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'timer' | 'large' | 'compact';
  labelColor?: string;
  valueColor?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
}

export const StatValue: React.FC<StatValueProps> = ({
  label,
  value,
  variant = 'default',
  labelColor,
  valueColor,
  style,
  labelStyle,
  valueStyle,
}) => {
  const containerStyle = [
    styles.container,
    styles[variant],
    style,
  ];

  const combinedLabelStyle = StyleSheet.flatten([
    styles.label,
    styles[`${variant}Label`],
    labelColor && { color: labelColor },
    labelStyle,
  ]);

  const combinedValueStyle = StyleSheet.flatten([
    styles.value,
    styles[`${variant}Value`],
    valueColor && { color: valueColor },
    valueStyle,
  ]);

  return (
    <View style={containerStyle}>
      <Typography
        variant="caption"
        style={combinedLabelStyle}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        style={combinedValueStyle}
      >
        {value}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base styles
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 13, // Maintain original exact size from InfiniteModeScreen  
    color: ModernDesign.colors.text.secondary,
    fontWeight: '500', // Maintain original exact weight
    marginBottom: 6, // Maintain original exact margin
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 20, // Maintain original exact size from screens
    fontWeight: 'bold', // Maintain original exact weight
    color: ModernDesign.colors.text.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Variants
  default: {},
  
  timer: {},
  
  large: {},
  
  compact: {
    gap: ModernDesign.spacing[1],
  },

  // Variant-specific label styles
  defaultLabel: {},
  
  timerLabel: {
    fontSize: ModernDesign.typography.fontSize.xs,
  },
  
  largeLabel: {
    fontSize: ModernDesign.typography.fontSize.base,
  },
  
  compactLabel: {
    fontSize: ModernDesign.typography.fontSize.xs,
    marginBottom: 0,
  },

  // Variant-specific value styles
  defaultValue: {
    fontSize: 20, // Maintain original exact size from InfiniteModeScreen
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  timerValue: {
    fontSize: 22, // サイズを少し小さくして重なりを防ぐ
    fontFamily: 'SF Mono',
    lineHeight: 26, // 行の高さを設定してテキストクリップを防ぐ
    // colorは外部から渡される色を優先するため削除
  },
  
  largeValue: {
    fontSize: ModernDesign.typography.fontSize['3xl'],
    color: ModernDesign.colors.accent.neon,
  },
  
  compactValue: {
    fontSize: ModernDesign.typography.fontSize.lg,
  },
});