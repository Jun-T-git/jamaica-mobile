import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../design/modernDesignSystem';
import { RankingEntry as RankingEntryType } from '../../types/ranking';

interface RankingEntryProps {
  entry: RankingEntryType;
  mode: 'challenge' | 'infinite'; // チャレンジモードのみ対応だが互換性のため残す
}

export const RankingEntry: React.FC<RankingEntryProps> = ({ entry, mode }) => {
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return ModernDesign.colors.accent.gold;
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return ModernDesign.colors.text.primary;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return 'looks-one';
      case 2:
        return 'looks-two';
      case 3:
        return 'looks-3';
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        entry.isCurrentUser && styles.currentUserContainer,
      ]}
    >
      <View
        style={[
          styles.rankContainer,
          entry.rank === 1 && styles.goldRankContainer,
          entry.rank === 2 && styles.silverRankContainer,
          entry.rank === 3 && styles.bronzeRankContainer,
        ]}
      >
        {entry.rank <= 3 ? (
          <MaterialIcons
            name="emoji-events"
            size={24}
            color={getRankColor(entry.rank)}
          />
        ) : (
          <View style={styles.rankNumberContainer}>
            <Text style={styles.rankNumber}>{entry.rank}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text
          style={[
            styles.nameText,
            entry.isCurrentUser && styles.currentUserText,
          ]}
          numberOfLines={1}
        >
          {entry.displayName}
        </Text>

        <Text
          style={[
            styles.scoreText,
            entry.isCurrentUser && styles.currentUserScoreText,
          ]}
        >
          {entry.score.toLocaleString()}
          <Text
            style={[
              styles.scoreUnit,
              entry.isCurrentUser && styles.currentUserScoreUnit,
            ]}
          >
            {' '}
            点
          </Text>
        </Text>
      </View>

      {entry.isCurrentUser && (
        <View style={styles.currentUserBadge}>
          <MaterialIcons
            name="person"
            size={12}
            color={ModernDesign.colors.background.primary}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius.xl,
    padding: ModernDesign.spacing[4],
    marginBottom: ModernDesign.spacing[2],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.sm,
  },
  currentUserContainer: {
    backgroundColor: ModernDesign.colors.accent.neon + '08',
    borderLeftWidth: 4,
    borderLeftColor: ModernDesign.colors.accent.neon,
  },
  rankContainer: {
    width: 48,
    height: 48,
    backgroundColor: ModernDesign.colors.background.secondary,
    borderRadius: ModernDesign.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernDesign.spacing[3],
  },
  rankNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNumber: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    fontSize: ModernDesign.typography.fontSize.xl,
    lineHeight: ModernDesign.typography.fontSize.xl,
  },
  infoContainer: {
    flex: 1,
  },
  goldRankContainer: {
    backgroundColor: ModernDesign.colors.accent.gold + '20',
  },
  silverRankContainer: {
    backgroundColor: '#C0C0C020',
  },
  bronzeRankContainer: {
    backgroundColor: '#CD7F3220',
  },
  nameText: {
    fontSize: ModernDesign.typography.fontSize.base,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.text.primary,
    marginBottom: ModernDesign.spacing[1],
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
  },
  currentUserText: {
    color: ModernDesign.colors.accent.neon,
  },
  scoreText: {
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.neon,
    letterSpacing: ModernDesign.typography.letterSpacing.tight,
  },
  scoreUnit: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    color: ModernDesign.colors.text.secondary,
    marginLeft: 2,
  },
  dateText: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.tertiary,
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  currentUserScoreText: {
    color: ModernDesign.colors.accent.neon,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
  },
  currentUserScoreUnit: {
    color: ModernDesign.colors.accent.neon,
  },
  currentUserBadge: {
    width: 24,
    height: 24,
    backgroundColor: ModernDesign.colors.accent.neon,
    borderRadius: ModernDesign.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ModernDesign.spacing[2],
  },
});
