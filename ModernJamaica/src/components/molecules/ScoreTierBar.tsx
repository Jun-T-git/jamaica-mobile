import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';
import { DifficultyLevel } from '../../types';
import { getScoreTierProgress } from '../../utils/scoreTier';

interface ScoreTierBarProps {
  difficulty: DifficultyLevel;
  score: number;
  style?: ViewStyle;
}

/**
 * 基準スコア（config/scoreTiers.ts）に対する今回のスコアの位置
 * 他のプレイヤーがいなくても「次はここを目指す」が分かるようにする
 */
export const ScoreTierBar: React.FC<ScoreTierBarProps> = ({
  difficulty,
  score,
  style,
}) => {
  const { current, next, remaining, progress } = getScoreTierProgress(
    difficulty,
    score,
  );

  const currentLabel = current ? current.label : 'ランクなし';
  const message = next
    ? `${next.label}まで あと${remaining.toLocaleString()}点`
    : '最高ランク到達！';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialIcons
            name="military-tech"
            size={18}
            color={ModernDesign.colors.accent.gold}
          />
          <Text style={styles.title}>基準スコア</Text>
        </View>
        <Text style={[styles.tierLabel, current && styles.tierLabelReached]}>
          {currentLabel}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: ModernDesign.spacing[3],
    paddingHorizontal: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.background.secondary,
    gap: ModernDesign.spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[1],
  },
  title: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.secondary,
  },
  tierLabel: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.tertiary,
  },
  tierLabelReached: {
    color: ModernDesign.colors.accent.gold,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: ModernDesign.colors.background.tertiary,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: ModernDesign.colors.accent.gold,
  },
  message: {
    fontSize: ModernDesign.typography.fontSize.xs,
    color: ModernDesign.colors.text.secondary,
  },
});
