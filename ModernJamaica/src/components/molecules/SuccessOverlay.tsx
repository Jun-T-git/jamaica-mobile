import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Typography } from '../atoms/Typography';
import { ModernDesign } from '../../constants';

interface SuccessOverlayProps {
  visible: boolean;
  animationValue: Animated.Value;
  message?: string;
  score?: number;   // この問題で獲得したスコア（チャレンジモード）
  combo?: number;   // 現在のコンボ数
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  visible,
  animationValue,
  message = '正解！',
  score,
  combo = 0,
}) => {
  if (!visible) return null;

  const scaleAnimation = animationValue.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.5, 1.05, 1],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: animationValue,
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        <MaterialIcons 
          name="check-circle" 
          size={48} 
          color={ModernDesign.colors.success} 
        />
        
        <Typography
          variant="h4"
          style={styles.messageText}
          textAlign="center"
        >
          {message}
        </Typography>

        {score !== undefined && score > 0 && (
          <Typography variant="h4" style={styles.scoreText} textAlign="center">
            +{score.toLocaleString()}点
          </Typography>
        )}

        {combo >= 2 && (
          <Typography variant="body2" style={styles.comboText} textAlign="center">
            {combo}コンボ！
          </Typography>
        )}
      </Animated.View>
    </Animated.View>
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
    zIndex: 2000,
  },
  content: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius.xl,
    borderWidth: 1,
    borderColor: ModernDesign.colors.success,
    paddingVertical: ModernDesign.spacing[6],
    paddingHorizontal: ModernDesign.spacing[8],
    alignItems: 'center',
    minWidth: 160,
    ...ModernDesign.shadows.lg,
  },
  messageText: {
    color: ModernDesign.colors.success,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    marginTop: ModernDesign.spacing[3],
  },
  scoreText: {
    color: ModernDesign.colors.accent.gold,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    marginTop: ModernDesign.spacing[2],
  },
  comboText: {
    color: ModernDesign.colors.accent.coral,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    marginTop: ModernDesign.spacing[1],
  },
});