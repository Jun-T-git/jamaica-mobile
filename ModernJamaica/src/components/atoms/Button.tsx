import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Typography } from './Typography';
import { ModernDesign } from '../../constants';
import { soundManager, SoundType } from '../../utils/SoundManager';

interface ButtonProps {
  icon: string;
  title: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  dynamicType?: boolean; // Dynamic Type対応
  accessibilityScale?: number; // アクセシビリティスケール
  soundType?: SoundType; // 効果音タイプ（デフォルト: BUTTON）
  playSound?: boolean; // 効果音再生制御（デフォルト: true）
}

export const Button: React.FC<ButtonProps> = ({
  icon,
  title,
  onPress,
  variant = 'default',
  disabled = false,
  style,
  dynamicType = true, // デフォルトでDynamic Type有効
  accessibilityScale = 1.0,
  soundType = SoundType.BUTTON, // デフォルトで一般的なボタン音
  playSound = true, // デフォルトで効果音有効
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const getIconColor = () => {
    if (disabled) return ModernDesign.colors.text.disabled;
    
    switch (variant) {
      case 'primary':
        return ModernDesign.colors.background.primary;
      case 'danger':
        return ModernDesign.colors.error;
      default:
        return ModernDesign.colors.text.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return ModernDesign.colors.text.disabled;
    
    switch (variant) {
      case 'primary':
        return ModernDesign.colors.background.primary;
      case 'danger':
        return ModernDesign.colors.error;
      default:
        return ModernDesign.colors.text.primary;
    }
  };

  const handlePress = () => {
    // コンポーネント内で効果音を制御
    if (playSound && !disabled) {
      soundManager.play(soundType);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Icon
        name={icon}
        size={24}
        color={getIconColor()}
        containerSize={48}
        style={styles.iconContainer}
      />
      <Typography
        variant="body1"
        style={StyleSheet.flatten([
          styles.title,
          { color: getTextColor() },
          variant === 'primary' && styles.primaryTitle,
        ])}
        dynamicType={dynamicType}
        accessibilityScale={accessibilityScale}
      >
        {title}
      </Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ModernDesign.components.button.height.medium,
    paddingHorizontal: ModernDesign.components.button.padding.medium.horizontal,
    borderRadius: ModernDesign.components.button.borderRadius,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    ...ModernDesign.shadows.sm,
  },
  default: {
    backgroundColor: ModernDesign.colors.background.secondary,
    borderColor: ModernDesign.colors.border.subtle,
  },
  primary: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
  },
  danger: {
    backgroundColor: 'rgba(252, 165, 165, 0.08)',
    borderColor: 'rgba(252, 165, 165, 0.3)',
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: ModernDesign.spacing[4],
  },
  title: {
    flex: 1,
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  primaryTitle: {
    fontWeight: ModernDesign.typography.fontWeight.bold,
  },
});