import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  variant?: 'default' | 'circular' | 'square';
  containerSize?: number | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = ModernDesign.colors.text.primary,
  variant = 'default',
  containerSize,
  backgroundColor,
  style,
}) => {
  // Convert string sizes to numbers
  const getContainerSize = (containerSizeValue: number | string): number => {
    if (typeof containerSizeValue === 'number') return containerSizeValue;
    
    switch (containerSizeValue) {
      case 'small': return 32;
      case 'medium': return 48;
      case 'large': return 64;
      default: return 48;
    }
  };

  const actualContainerSize = containerSize ? getContainerSize(containerSize) : undefined;

  if (actualContainerSize || backgroundColor || variant !== 'default') {
    const containerStyle: ViewStyle = StyleSheet.flatten([
      styles.container,
      variant === 'circular' && styles.circular,
      variant === 'square' && styles.square,
      actualContainerSize && {
        width: actualContainerSize,
        height: actualContainerSize,
      },
      backgroundColor && { backgroundColor },
      style,
    ].filter(Boolean)) as ViewStyle;

    return (
      <View style={containerStyle}>
        <MaterialIcons name={name} size={size} color={color} />
      </View>
    );
  }

  return <MaterialIcons name={name} size={size} color={color} style={style} />;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ModernDesign.borderRadius.md,
  },
  circular: {
    borderRadius: ModernDesign.borderRadius.full,
  },
  square: {
    borderRadius: 0,
  },
});