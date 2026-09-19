import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Typography } from '../atoms/Typography';
import { RankingEntry } from '../molecules/RankingEntry';
import { RankingEntry as RankingEntryType, UserRankInfo } from '../../types/ranking';
import { GameMode, DifficultyLevel } from '../../types';
import { rankingService } from '../../services/rankingService';
import { ModernDesign } from '../../design/modernDesignSystem';

interface RankingBoardProps {
  mode: GameMode;
  selectedDifficulty?: DifficultyLevel;
}

export const RankingBoard: React.FC<RankingBoardProps> = ({
  mode,
  selectedDifficulty = DifficultyLevel.NORMAL,
}) => {
  const [rankings, setRankings] = useState<RankingEntryType[]>([]);
  const [userRank, setUserRank] = useState<UserRankInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankingData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      const [rankingData, userRankData] = await Promise.all([
        rankingService.getRanking({
          mode,
          difficulty: selectedDifficulty,
          limit: 10,
        }),
        rankingService.getUserRank(mode, selectedDifficulty),
      ]);

      setRankings(rankingData);
      setUserRank(userRankData);
    } catch (err) {
      console.error('Failed to load ranking data:', err);
      setError('ランキングの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRankingData();
  }, [selectedDifficulty, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Typography variant="body1" style={styles.emptyText}>
        まだランキングがありません
      </Typography>
      <Typography variant="caption" style={styles.emptySubtext}>
        最初のプレイヤーになりましょう！
      </Typography>
    </View>
  );


  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Typography variant="body1" style={styles.errorText}>
        {error}
      </Typography>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadRankingData()}>
        <Typography variant="body2" style={styles.retryText}>
          再試行
        </Typography>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <View style={styles.container}>
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={ModernDesign.colors.accent.neon} 
          />
          <Typography variant="body2" style={styles.loadingText}>
            読み込み中...
          </Typography>
        </View>
      ) : (
        <>
          {rankings.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.rankingsContainer}>
              {rankings.map((entry) => (
                <RankingEntry
                  key={`${entry.userId}-${entry.rank}`}
                  entry={entry}
                  mode={mode === GameMode.CHALLENGE ? 'challenge' : 'infinite'}
                />
              ))}
            </View>
          )}

          {/* 自分の順位（トップ10圏外でも分かるように表示） */}
          <View style={styles.userRankContainer}>
            <Typography variant="body2" style={styles.userRankLabel}>
              あなたの順位
            </Typography>
            {userRank?.rank ? (
              <Typography variant="body1" style={styles.userRankValue}>
                {userRank.rank.toLocaleString()}位
                <Typography variant="caption" style={styles.userRankTotal}>
                  {' '}/ {userRank.totalUsers.toLocaleString()}人
                </Typography>
              </Typography>
            ) : (
              <Typography variant="caption" style={styles.userRankTotal}>
                チャレンジモードで記録を出すと表示されます
              </Typography>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  userRankContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ModernDesign.spacing[3],
    paddingVertical: ModernDesign.spacing[3],
    paddingHorizontal: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.lg,
    borderWidth: 1,
    borderColor: ModernDesign.colors.accent.neon,
    backgroundColor: ModernDesign.colors.background.secondary,
  },
  userRankLabel: {
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  userRankValue: {
    color: ModernDesign.colors.accent.neon,
    fontWeight: ModernDesign.typography.fontWeight.bold,
  },
  userRankTotal: {
    color: ModernDesign.colors.text.tertiary,
  },
  container: {
    // minHeightを削除して自然なサイズに
  },
  rankingsContainer: {
    paddingTop: ModernDesign.spacing[1],
    paddingHorizontal: 0, // RankingScreenのsectionContainerでマージンを制御
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: ModernDesign.colors.text.secondary,
    marginTop: ModernDesign.spacing[4],
    fontSize: ModernDesign.typography.fontSize.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ModernDesign.spacing[16],
  },
  emptyText: {
    color: ModernDesign.colors.text.primary,
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: ModernDesign.spacing[2],
  },
  emptySubtext: {
    color: ModernDesign.colors.text.secondary,
    fontSize: ModernDesign.typography.fontSize.base,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    color: ModernDesign.colors.error,
    fontSize: ModernDesign.typography.fontSize.base,
    textAlign: 'center',
    marginBottom: ModernDesign.spacing[4],
  },
  retryButton: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius.lg,
    paddingHorizontal: ModernDesign.spacing[6],
    paddingVertical: ModernDesign.spacing[3],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
  },
  retryText: {
    color: ModernDesign.colors.text.primary,
    fontSize: ModernDesign.typography.fontSize.base,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
  },
});