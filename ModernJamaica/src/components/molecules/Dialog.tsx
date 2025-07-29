import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Typography } from '../atoms/Typography';
import { ModernDesign } from '../../constants';

interface DialogButton {
  icon: string;
  title: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

interface DialogProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  buttons?: DialogButton[];
  children?: React.ReactNode;
  width?: number;
  style?: ViewStyle;
  closeOnOverlayPress?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor,
  buttons,
  children,
  width = 320,
  style,
  closeOnOverlayPress = false,
}) => {
  if (!visible) return null;

  const cardStyle = [
    styles.card,
    { width },
    style,
  ];

  const hasStructuredContent = title || message || icon || buttons;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={closeOnOverlayPress && onClose ? onClose : undefined}
        activeOpacity={1}
      />
      <View style={cardStyle}>
        {hasStructuredContent ? (
          <>
            {/* Structured Header */}
            {(title || message || icon) && (
              <View style={styles.header}>
                {icon && (
                  <View style={styles.iconContainer}>
                    <Icon
                      name={icon}
                      size={32}
                      color={iconColor || ModernDesign.colors.accent.neon}
                    />
                  </View>
                )}
                {title && (
                  <Typography
                    variant="h4"
                    style={styles.title}
                  >
                    {title}
                  </Typography>
                )}
                {message && (
                  <Typography
                    variant="body1"
                    color="secondary"
                    textAlign="center"
                    style={styles.message}
                  >
                    {message}
                  </Typography>
                )}
              </View>
            )}

            {/* Structured Buttons */}
            {buttons && buttons.length > 0 && (
              <View style={styles.actions}>
                {buttons.map((button, index) => (
                  <Button
                    key={index}
                    icon={button.icon}
                    title={button.title}
                    onPress={() => {
                      button.onPress();
                      onClose?.();
                    }}
                    variant={button.variant}
                    disabled={button.disabled}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          /* Custom Content */
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 27, 35, 0.85)',
  },
  card: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['2xl'],
    ...ModernDesign.shadows.lg,
    zIndex: 1000,
    paddingVertical: ModernDesign.spacing[8],
    paddingHorizontal: ModernDesign.spacing[6],
    maxWidth: '90%',
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[8],
  },
  iconContainer: {
    marginBottom: ModernDesign.spacing[3],
    opacity: 0.9,
  },
  title: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
    textAlign: 'center',
  },
  message: {
    fontSize: ModernDesign.typography.fontSize.base,
    lineHeight: ModernDesign.typography.fontSize.base * 1.5,
    marginTop: ModernDesign.spacing[4],
  },
  actions: {
    gap: ModernDesign.spacing[4],
  },
});