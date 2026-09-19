import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';
import { SCORE_CONFIG } from '../../constants/scoreConfig';

interface ComboIndicatorProps {
  combo: number;
  expiresAt: number; // この時刻（ミリ秒）までに次を正解するとコンボ継続
}

/**
 * 連続正解コンボの表示
 * 残り時間のバーが縮み、時間切れで消える
 */
export const ComboIndicator: React.FC<ComboIndicatorProps> = ({
  combo,
  expiresAt,
}) => {
  const [progress] = useState(new Animated.Value(0));
  const [isExpired, setIsExpired] = useState(true);

  useEffect(() => {
    const remaining = expiresAt - Date.now();
    if (combo < 2 || remaining <= 0) {
      setIsExpired(true);
      return;
    }

    setIsExpired(false);
    progress.setValue(remaining / SCORE_CONFIG.COMBO_TIME_LIMIT);
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setIsExpired(true);
    });

    return () => animation.stop();
  }, [combo, expiresAt, progress]);

  if (isExpired) return null;

  const bonusPercent =
    Math.min(
      SCORE_CONFIG.COMBO_BONUS_MAX_RATE,
      Math.max(0, combo - SCORE_CONFIG.COMBO_MIN_COUNT + 1) *
        SCORE_CONFIG.COMBO_BONUS_RATE,
    ) * 100;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.row}>
        <MaterialIcons
          name="local-fire-department"
          size={16}
          color={ModernDesign.colors.accent.coral}
        />
        <Text style={styles.comboText}>{combo}コンボ</Text>
        {bonusPercent > 0 && (
          <Text style={styles.bonusText}>+{Math.round(bonusPercent)}%</Text>
        )}
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { transform: [{ scaleX: progress }] }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: ModernDesign.spacing[2],
    right: ModernDesign.spacing[3],
    alignItems: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[1],
  },
  comboText: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.coral,
  },
  bonusText: {
    fontSize: ModernDesign.typography.fontSize.xs,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.gold,
  },
  barTrack: {
    width: 72,
    height: 3,
    marginTop: ModernDesign.spacing[1],
    borderRadius: 2,
    backgroundColor: ModernDesign.colors.border.subtle,
    overflow: 'hidden',
  },
  barFill: {
    flex: 1,
    transformOrigin: 'left', // 右から左へ縮む
    borderRadius: 2,
    backgroundColor: ModernDesign.colors.accent.coral,
  },
});
