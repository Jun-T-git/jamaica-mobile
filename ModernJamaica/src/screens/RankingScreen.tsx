import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Typography } from '../components/atoms/Typography';
import { BannerAdView } from '../components/molecules/BannerAdView';
import { DifficultyTabs } from '../components/molecules/DifficultyTabs';
import { RankingBoard } from '../components/organisms/RankingBoard';
import { ModernDesign } from '../constants';
import { rankingService } from '../services/rankingService';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { DifficultyLevel, GameMode } from '../types';
import { ChallengeScore } from '../types/ranking';
import { soundManager, SoundType } from '../utils/SoundManager';

interface RankingScreenProps {
  navigation: any;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({ navigation }) => {
  // チャレンジモードのみ対応
  const [selectedMode] = useState<GameMode>(GameMode.CHALLENGE);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(
    DifficultyLevel.NORMAL,
  );
  const [bestScoreRecord, setBestScoreRecord] = useState<ChallengeScore | null>(
    null,
  );
  const { loadDisplayName } = useSettingsStore();
  const { highScores, loadStoredData } = useGameStore();

  useEffect(() => {
    // 画面表示時にユーザー表示名とハイスコアを読み込み
    loadDisplayName();
    loadStoredData();
  }, [loadDisplayName, loadStoredData]);

  // 難易度変更時にFirebaseからベストスコア記録を取得
  useEffect(() => {
    const loadBestScoreRecord = async () => {
      try {
        const record = await rankingService.getUserBestScore(
          selectedMode,
          selectedDifficulty,
        );
        setBestScoreRecord(record);
      } catch (error) {
        console.error('Failed to load best score record:', error);
        setBestScoreRecord(null);
      }
    };

    loadBestScoreRecord();
  }, [selectedMode, selectedDifficulty]);

  const handleBack = () => {
    soundManager.play(SoundType.BUTTON);
    navigation.goBack();
  };

  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
  };

  const currentBestScore = highScores[selectedMode]?.[selectedDifficulty] || 0;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const renderBestScore = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons
          name="star"
          size={20}
          color={ModernDesign.colors.accent.neon}
          style={styles.sectionIcon}
        />
        <Typography variant="body2" style={styles.sectionTitle}>
          あなたのベストスコア
        </Typography>
      </View>
      <View style={styles.bestScoreCard}>
        {currentBestScore > 0 ? (
          <>
            <Typography variant="h3" style={styles.bestScoreValue}>
              {currentBestScore.toLocaleString()}
              <Typography variant="body2" style={styles.bestScoreUnit}>点</Typography>
            </Typography>
            {bestScoreRecord && bestScoreRecord.score > 0 && (
              <View style={styles.bestScoreDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color={ModernDesign.colors.success}
                    style={styles.detailIcon}
                  />
                  <Typography variant="caption" style={styles.detailText}>
                    {bestScoreRecord.problemCount}問正解
                  </Typography>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons
                    name="today"
                    size={16}
                    color={ModernDesign.colors.accent.neon}
                    style={styles.detailIcon}
                  />
                  <Typography variant="caption" style={styles.detailText}>
                    {formatDate(bestScoreRecord.timestamp)}
                  </Typography>
                </View>
              </View>
            )}
          </>
        ) : (
          <Typography variant="body2" style={styles.noScoreText}>
            まだスコアがありません
          </Typography>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ModernDesign.colors.background.primary}
      />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={ModernDesign.colors.text.primary}
          />
        </TouchableOpacity>
        <Typography variant="body1" style={styles.modeTitle}>
          スコア
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 難易度タブ */}
        <View style={styles.tabsContainer}>
          <DifficultyTabs
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            mode={
              selectedMode === GameMode.CHALLENGE ? 'challenge' : 'infinite'
            }
          />
        </View>

        {/* ベストスコア表示 */}
        {renderBestScore()}

        {/* ランキングセクション */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="leaderboard"
              size={20}
              color={ModernDesign.colors.accent.neon}
              style={styles.sectionIcon}
            />
            <Typography variant="body2" style={styles.sectionTitle}>
              みんなのスコア
            </Typography>
          </View>
          <RankingBoard
            mode={selectedMode}
            selectedDifficulty={selectedDifficulty}
          />
        </View>
      </ScrollView>

      {/* バナー広告 */}
      <BannerAdView style={styles.bannerAd} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 60,
    backgroundColor: ModernDesign.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: ModernDesign.colors.background.secondary,
  },
  headerSpacer: {
    width: 44,
  },
  modeTitle: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ModernDesign.spacing[20], // 広告分のスペースを確保
  },
  tabsContainer: {
    marginTop: ModernDesign.spacing[2],
    marginBottom: ModernDesign.spacing[4],
  },
  sectionContainer: {
    marginHorizontal: ModernDesign.spacing[4],
    marginBottom: ModernDesign.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[2],
  },
  sectionIcon: {
    marginRight: ModernDesign.spacing[2],
  },
  sectionTitle: {
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  bestScoreCard: {
    backgroundColor: ModernDesign.colors.background.secondary,
    paddingHorizontal: ModernDesign.spacing[4],
    paddingVertical: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.xl,
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.sm,
  },
  bestScoreValue: {
    color: ModernDesign.colors.accent.neon,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: ModernDesign.spacing[2],
  },
  bestScoreUnit: {
    color: ModernDesign.colors.text.secondary,
    fontSize: ModernDesign.typography.fontSize.base,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    marginLeft: ModernDesign.spacing[1],
  },
  bestScoreDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ModernDesign.spacing[4],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: {
    marginRight: ModernDesign.spacing[1],
  },
  detailText: {
    color: ModernDesign.colors.text.tertiary,
    fontSize: ModernDesign.typography.fontSize.xs,
  },
  noScoreText: {
    color: ModernDesign.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bannerAd: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
