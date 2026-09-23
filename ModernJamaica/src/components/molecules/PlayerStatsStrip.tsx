import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Typography } from '../atoms/Typography';
import { ModernDesign } from '../../constants';

interface PlayerStatsStripProps {
  streakDays: number;
  totalCorrect: number;
  gamesPlayed: number;
  style?: ViewStyle;
}

interface StatItemProps {
  icon: string;
  color: string;
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, color, label, value }) => (
  <View style={styles.item}>
    <MaterialIcons name={icon} size={18} color={color} />
    <View>
      <Typography variant="caption" style={styles.label}>
        {label}
      </Typography>
      <Typography variant="body2" style={styles.value}>
        {value}
      </Typography>
    </View>
  </View>
);

/**
 * メニューに出す自己記録（連続プレイ日数・累計正解数・ゲーム数）
 * 他のプレイヤーに依存しない「自分の記録」だけを見せる。まだ遊んでいなければ何も出さない
 */
export const PlayerStatsStrip: React.FC<PlayerStatsStripProps> = ({
  streakDays,
  totalCorrect,
  gamesPlayed,
  style,
}) => {
  if (gamesPlayed <= 0) return null;

  return (
    <View style={[styles.container, style]}>
      <StatItem
        icon="local-fire-department"
        color={ModernDesign.colors.accent.coral}
        label="連続プレイ"
        value={streakDays > 0 ? `${streakDays}日目` : '今日から'}
      />
      <View style={styles.divider} />
      <StatItem
        icon="check-circle"
        color={ModernDesign.colors.accent.mint}
        label="累計正解"
        value={`${totalCorrect.toLocaleString()}問`}
      />
      <View style={styles.divider} />
      <StatItem
        icon="sports-esports"
        color={ModernDesign.colors.accent.neon}
        label="プレイ回数"
        value={`${gamesPlayed.toLocaleString()}回`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ModernDesign.spacing[3],
    paddingHorizontal: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.xl,
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    backgroundColor: ModernDesign.colors.background.secondary,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[2],
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: ModernDesign.colors.border.subtle,
    marginHorizontal: ModernDesign.spacing[2],
  },
  label: {
    color: ModernDesign.colors.text.tertiary,
    fontSize: ModernDesign.typography.fontSize.xs,
  },
  value: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
  },
});
