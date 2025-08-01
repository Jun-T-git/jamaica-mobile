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
  dynamicType?: boolean; // Dynamic Type対応を有効にするか
  accessibilityScale?: number; // アクセシビリティスケール
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
  dynamicType = true, // デフォルトでDynamic Type有効
  accessibilityScale = 1.0,
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
        dynamicType={dynamicType}
        accessibilityScale={accessibilityScale}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        style={combinedValueStyle}
        dynamicType={dynamicType}
        accessibilityScale={accessibilityScale}
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
    fontSize: ModernDesign.typography.fontSize.sm, // Use design system sm (14pt)
    color: ModernDesign.colors.text.secondary,
    fontWeight: '500', // Maintain original exact weight
    marginBottom: 6, // Maintain original exact margin
    letterSpacing: 0.3,
  },
  value: {
    fontSize: ModernDesign.typography.fontSize.xl, // Use design system xl (19pt, close to original 20pt)
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
    fontSize: ModernDesign.typography.fontSize.xl, // Use design system xl (19pt)
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  timerValue: {
    fontSize: ModernDesign.typography.fontSize['2xl'], // Use design system 2xl (22pt)
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