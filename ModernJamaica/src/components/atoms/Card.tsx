import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ModernDesign, getModernShadow, getModernSpacing } from '../../design/modernDesignSystem';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof ModernDesign.spacing;
  shadow?: keyof typeof ModernDesign.shadows;
  borderRadius?: keyof typeof ModernDesign.borderRadius;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 6,
  shadow = 'base',
  borderRadius = 'xl',
  glass = false,
}) => {
  return (
    <View
      style={[
        glass ? styles.glassCard : styles.card,
        {
          padding: getModernSpacing(padding),
          borderRadius: ModernDesign.borderRadius[borderRadius],
          ...getModernShadow(shadow),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
  },
  glassCard: {
    backgroundColor: ModernDesign.colors.glass.background,
    borderWidth: 1,
    borderColor: ModernDesign.colors.glass.border,
    backdropFilter: 'blur(10px)',
  },
});