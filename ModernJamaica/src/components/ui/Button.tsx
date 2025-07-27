import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
// import LinearGradient from 'react-native-linear-gradient'; // TODO: Configure after linking
import { ModernDesign, getModernShadow } from '../../design/modernDesignSystem';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: string[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  // gradient,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle = [
      styles.base,
      styles[size],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
    ];

    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primary];
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'outline':
        return [...baseStyle, styles.outline];
      case 'ghost':
        return [...baseStyle, styles.ghost];
      case 'gradient':
        return [...baseStyle, styles.gradient];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextStyle = (): TextStyle[] => {
    const baseTextStyle = [
      styles.baseText,
      styles[`${size}Text` as keyof typeof styles],
    ];

    switch (variant) {
      case 'primary':
        return [...baseTextStyle, styles.primaryText];
      case 'secondary':
        return [...baseTextStyle, styles.secondaryText];
      case 'outline':
        return [...baseTextStyle, styles.outlineText];
      case 'ghost':
        return [...baseTextStyle, styles.ghostText];
      case 'gradient':
        return [...baseTextStyle, styles.gradientText];
      default:
        return [...baseTextStyle, styles.primaryText];
    }
  };

  const renderButtonContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? ModernDesign.colors.accent.neon : ModernDesign.colors.text.inverse}
          style={styles.loader}
        />
      )}
      <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
    </>
  );

  // TODO: Implement gradient after LinearGradient setup
  // if (variant === 'gradient' && gradient) {
  //   return (
  //     <TouchableOpacity
  //       onPress={onPress}
  //       disabled={disabled || loading}
  //       activeOpacity={0.8}
  //       style={[style]}
  //     >
  //       <LinearGradient
  //         colors={gradient}
  //         start={{ x: 0, y: 0 }}
  //         end={{ x: 1, y: 0 }}
  //         style={[...getButtonStyle()]}
  //       >
  //         <ButtonContent />
  //       </LinearGradient>
  //     </TouchableOpacity>
  //   );
  // }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {renderButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ModernDesign.components.button.borderRadius,
    ...getModernShadow('base'),
  },
  
  // Sizes
  sm: {
    height: ModernDesign.components.button.height.sm,
    paddingHorizontal: ModernDesign.spacing[4],
  },
  md: {
    height: ModernDesign.components.button.height.md,
    paddingHorizontal: ModernDesign.spacing[6],
  },
  lg: {
    height: ModernDesign.components.button.height.lg,
    paddingHorizontal: ModernDesign.spacing[8],
  },

  // Variants
  primary: {
    backgroundColor: ModernDesign.colors.accent.neon,
    ...getModernShadow('glow'),
  },
  secondary: {
    backgroundColor: ModernDesign.colors.accent.purple,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ModernDesign.colors.accent.neon,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  gradient: {
    backgroundColor: ModernDesign.colors.accent.coral,
  },

  // States
  disabled: {
    opacity: 0.4,
  },
  fullWidth: {
    width: '100%',
  },

  // Text styles
  baseText: {
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    textAlign: 'center',
    fontFamily: ModernDesign.typography.fontFamily.primary,
  },
  smText: {
    fontSize: ModernDesign.components.button.fontSize.sm,
  },
  mdText: {
    fontSize: ModernDesign.components.button.fontSize.md,
  },
  lgText: {
    fontSize: ModernDesign.components.button.fontSize.lg,
  },

  // Text variants
  primaryText: {
    color: ModernDesign.colors.background.primary,
  },
  secondaryText: {
    color: ModernDesign.colors.text.primary,
  },
  outlineText: {
    color: ModernDesign.colors.accent.neon,
  },
  ghostText: {
    color: ModernDesign.colors.text.secondary,
  },
  gradientText: {
    color: ModernDesign.colors.text.primary,
  },

  loader: {
    marginRight: ModernDesign.spacing[2],
  },
});