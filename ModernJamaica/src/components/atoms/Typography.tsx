import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { ModernDesign } from '../../design/modernDesignSystem';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
type TypographyColor = 'primary' | 'secondary' | 'tertiary' | 'inverse';

interface TypographyProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = 'primary',
  children,
  style,
  numberOfLines,
  textAlign = 'left',
}) => {
  const getTextStyle = (): TextStyle => {
    const variantStyle = styles[variant];
    const colorStyle = styles[`${color}Color`];
    
    return {
      ...variantStyle,
      ...colorStyle,
      textAlign,
    };
  };

  return (
    <Text
      style={[getTextStyle(), style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Typography variants
  h1: {
    fontSize: ModernDesign.typography.fontSize['7xl'],
    fontWeight: ModernDesign.typography.fontWeight.black,
    lineHeight: ModernDesign.typography.fontSize['7xl'] * ModernDesign.typography.lineHeight.tight,
    letterSpacing: ModernDesign.typography.letterSpacing.tighter,
  },
  h2: {
    fontSize: ModernDesign.typography.fontSize['6xl'],
    fontWeight: ModernDesign.typography.fontWeight.heavy,
    lineHeight: ModernDesign.typography.fontSize['6xl'] * ModernDesign.typography.lineHeight.tight,
    letterSpacing: ModernDesign.typography.letterSpacing.tight,
  },
  h3: {
    fontSize: ModernDesign.typography.fontSize['5xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    lineHeight: ModernDesign.typography.fontSize['5xl'] * ModernDesign.typography.lineHeight.tight,
  },
  h4: {
    fontSize: ModernDesign.typography.fontSize['4xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    lineHeight: ModernDesign.typography.fontSize['4xl'] * ModernDesign.typography.lineHeight.snug,
  },
  h5: {
    fontSize: ModernDesign.typography.fontSize['3xl'],
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    lineHeight: ModernDesign.typography.fontSize['3xl'] * ModernDesign.typography.lineHeight.normal,
  },
  h6: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    lineHeight: ModernDesign.typography.fontSize['2xl'] * ModernDesign.typography.lineHeight.normal,
  },
  body1: {
    fontSize: ModernDesign.typography.fontSize.base,
    fontWeight: ModernDesign.typography.fontWeight.normal,
    lineHeight: ModernDesign.typography.fontSize.base * ModernDesign.typography.lineHeight.normal,
  },
  body2: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.normal,
    lineHeight: ModernDesign.typography.fontSize.sm * ModernDesign.typography.lineHeight.normal,
  },
  caption: {
    fontSize: ModernDesign.typography.fontSize.xs,
    fontWeight: ModernDesign.typography.fontWeight.normal,
    lineHeight: ModernDesign.typography.fontSize.xs * ModernDesign.typography.lineHeight.normal,
  },
  overline: {
    fontSize: ModernDesign.typography.fontSize.xs,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    letterSpacing: ModernDesign.typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },

  // Color variants
  primaryColor: {
    color: ModernDesign.colors.text.primary,
  },
  secondaryColor: {
    color: ModernDesign.colors.text.secondary,
  },
  tertiaryColor: {
    color: ModernDesign.colors.text.tertiary,
  },
  inverseColor: {
    color: ModernDesign.colors.text.inverse,
  },
});