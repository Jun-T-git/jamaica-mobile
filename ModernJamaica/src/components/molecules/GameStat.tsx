import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { StatValue } from '../atoms/StatValue';
import { Icon } from '../atoms/Icon';
import { ModernDesign } from '../../constants';

interface GameStatProps {
  label: string;
  value: string | number;
  icon?: string;
  variant?: 'default' | 'timer' | 'streak' | 'compact';
  iconColor?: string;
  iconBackgroundColor?: string;
  labelColor?: string;
  valueColor?: string;
  style?: ViewStyle;
}

export const GameStat: React.FC<GameStatProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  iconColor,
  iconBackgroundColor,
  labelColor,
  valueColor,
  style,
}) => {
  const containerStyle = [
    styles.container,
    styles[variant],
    style,
  ];

  const getStatVariant = () => {
    switch (variant) {
      case 'timer': return 'timer';
      case 'compact': return 'compact';
      case 'streak': return 'large';
      default: return 'default';
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact': return 16;
      case 'timer': return 20;
      case 'streak': return 24;
      default: return 18;
    }
  };

  const getIconContainerSize = () => {
    switch (variant) {
      case 'compact': return 'small';
      case 'timer': return 'medium'; 
      case 'streak': return 'large';
      default: return 'medium';
    }
  };

  return (
    <View style={containerStyle}>
      {icon && variant === 'compact' ? (
        // compactの場合は元のシンプルなアイコン表示
        <Icon
          name={icon}
          size={getIconSize()}
          color={iconColor || ModernDesign.colors.accent.neon}
          style={styles.compactIcon}
        />
      ) : icon ? (
        // その他の場合は円形背景付き
        <Icon
          name={icon}
          size={getIconSize()}
          color={iconColor || ModernDesign.colors.accent.neon}
          variant="circular"
          containerSize={getIconContainerSize()}
          backgroundColor={iconBackgroundColor || 'rgba(96, 165, 250, 0.15)'}
          style={styles.icon}
        />
      ) : null}
      <StatValue
        label={label}
        value={value}
        variant={getStatVariant()}
        labelColor={labelColor}
        valueColor={valueColor}
        style={styles.statValue}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Base styles
  container: {
    alignItems: 'center',
    gap: ModernDesign.spacing[2],
  },
  icon: {
    marginBottom: ModernDesign.spacing[1],
  },
  compactIcon: {
    // compact用のシンプルアイコンスタイル
  },
  statValue: {},

  // Variants
  default: {
    gap: ModernDesign.spacing[2],
  },
  
  timer: {
    gap: ModernDesign.spacing[2],
    minHeight: 32, // タイマー表示用の最小高さを確保
  },
  
  streak: {
    gap: ModernDesign.spacing[3],
  },
  
  compact: {
    flexDirection: 'row',
    gap: ModernDesign.spacing[2],
    alignItems: 'center',
  },
});