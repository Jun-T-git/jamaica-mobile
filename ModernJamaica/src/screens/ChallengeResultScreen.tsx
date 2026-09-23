import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../components/atoms/Button';
import { BannerAdView } from '../components/molecules/BannerAdView';
import { ScoreTierBar } from '../components/molecules/ScoreTierBar';
import { getDifficultyConfig } from '../config/difficulty';
import { getGameModeConfig } from '../config/gameMode';
import { RANKING_CONFIG } from '../config/ranking';
import { COLORS, ModernDesign } from '../constants';
import { adService } from '../services/adService';
import { rankingService } from '../services/rankingService';
import { reviewService } from '../services/reviewService';
import { useGameStore } from '../store/gameStore';
import { useStatsStore } from '../store/statsStore';
import { DifficultyLevel, GameMode } from '../types';
import { UserRankInfo } from '../types/ranking';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  ModeSelection: undefined;
  ChallengeMode: { difficulty: DifficultyLevel };
  InfiniteMode: { difficulty: DifficultyLevel };
  ChallengeResult: {
    finalScore: number;
    isNewHighScore: boolean;
    previousHighScore: number;
    mode?: 'challenge' | 'infinite';
    difficulty?: DifficultyLevel;
  };
};

interface ChallengeResultScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'ChallengeResult'>;
}

export const ChallengeResultScreen: React.FC<ChallengeResultScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    finalScore,
    isNewHighScore,
    previousHighScore,
    mode = 'challenge',
    difficulty,
  } = route.params;
  const { initGame, gameState, isSubmittingScore } = useGameStore();
  const { stats, getDisplayStreakDays } = useStatsStore();
  const streakDays = getDisplayStreakDays();

  // ゲームモード設定を取得
  const gameMode = mode === 'infinite' ? GameMode.INFINITE : GameMode.CHALLENGE;
  const config = getGameModeConfig(gameMode);

  // 難易度設定を取得（gameStateからか、route paramsから）
  const currentDifficulty = difficulty || gameState.difficulty;
  const difficultyConfig = getDifficultyConfig(currentDifficulty);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [scoreCountAnim] = useState(new Animated.Value(0));
  const [celebrationAnim] = useState(new Animated.Value(0));

  // Animated score counter
  const [displayedScore, setDisplayedScore] = useState(0);

  // ランキング順位（チャレンジモードのみ）
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // 新記録の余韻の後にレビューを頼む（出すかどうかの条件は utils/reviewPolicy.ts）。
  // 画面を離れたら取りやめる
  useEffect(() => {
    if (!isNewHighScore) return;
    const timer = setTimeout(() => {
      reviewService.maybeRequestReview({
        isNewHighScore,
        gamesPlayed: stats.gamesPlayed,
      });
    }, 3500);
    return () => clearTimeout(timer);
  }, [isNewHighScore, stats.gamesPlayed]);

  // スコア送信の完了を待ってから自分の順位を取得する
  useEffect(() => {
    if (gameMode !== GameMode.CHALLENGE || isSubmittingScore) return;

    let isCancelled = false;
    rankingService.getUserRank(gameMode, currentDifficulty).then(info => {
      if (!isCancelled) setRankInfo(info);
    });

    return () => {
      isCancelled = true;
    };
  }, [gameMode, currentDifficulty, isSubmittingScore]);

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Score counting animation
    const listenerId = scoreCountAnim.addListener(({ value }) => {
      setDisplayedScore(Math.floor(value));
    });

    const startTimer = setTimeout(() => {
      Animated.timing(scoreCountAnim, {
        toValue: finalScore,
        duration: 1500,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        setDisplayedScore(finalScore);

        // Celebration animation if new high score
        if (isNewHighScore) {
          Animated.sequence([
            Animated.timing(celebrationAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(celebrationAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(celebrationAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    }, 800);

    return () => {
      clearTimeout(startTimer);
      scoreCountAnim.removeListener(listenerId);
    };
  }, [
    finalScore,
    isNewHighScore,
    fadeAnim,
    slideAnim,
    scaleAnim,
    scoreCountAnim,
    celebrationAnim,
  ]);

  // インタースティシャル広告はリザルトを見終わって画面を離れるタイミングで表示する
  // （タイムアップ直後のスコアを見たい瞬間を遮らない）
  const showAdBeforeLeaving = async () => {
    if (config.ad.enabled) {
      await adService.showInterstitialAfterGame();
    }
  };

  const handleRetry = async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      await showAdBeforeLeaving();
      await initGame(gameMode, currentDifficulty);

      // replaceを使用して戻るボタンでリザルト画面に戻らないようにする
      if (gameMode === GameMode.CHALLENGE) {
        navigation.replace('ChallengeMode', { difficulty: currentDifficulty });
      } else {
        navigation.replace('InfiniteMode', { difficulty: currentDifficulty });
      }
    } catch (error) {
      console.error('Error in handleRetry:', error);
      setIsLeaving(false);
    }
  };

  const handleBackToMenu = async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    await showAdBeforeLeaving();
    // replaceを使用して戻るボタンでリザルト画面に戻らないようにする
    navigation.replace('ModeSelection');
  };

  const correctCount = gameState?.correctCount || 0;
  const averageSolveTime =
    correctCount > 0 ? gameState.totalSolveTime / correctCount : null;

  // スコア内訳（0点の項目は表示しない）
  const breakdownRows =
    gameMode === GameMode.CHALLENGE && gameState
      ? [
          { label: '基本スコア', value: gameState.scoreBreakdown.base },
          { label: 'スピードボーナス', value: gameState.scoreBreakdown.time },
          { label: '目標値ボーナス', value: gameState.scoreBreakdown.target },
          { label: 'コンボボーナス', value: gameState.scoreBreakdown.combo },
          { label: '達成ボーナス', value: gameState.finalBonus },
        ].filter(row => row.value > 0)
      : [];

  // 参加者が集まるまでは集計期間として順位を公開しない（「1位 / 1人」のような表示を避ける）
  const isRankingTallying =
    !!rankInfo?.rank && rankInfo.totalUsers < RANKING_CONFIG.MIN_PARTICIPANTS;

  // 上位◯%（1位でも0%にならないよう切り上げ）
  const topPercent =
    rankInfo?.rank && !isRankingTallying
      ? Math.max(1, Math.ceil((rankInfo.rank / rankInfo.totalUsers) * 100))
      : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient Effect */}
      <View style={styles.backgroundGradient} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Result Card */}
      <Animated.View
        style={[
          styles.resultCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Header Icon */}
        <Animated.View
          style={[
            styles.headerIconContainer,
            {
              transform: [
                {
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialIcons
            name={isNewHighScore ? 'star' : 'timer-off'}
            size={40}
            color={
              isNewHighScore
                ? ModernDesign.colors.accent.gold
                : ModernDesign.colors.accent.neon
            }
          />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>
          {isNewHighScore ? '新記録達成！' : 'タイムアップ！'}
        </Text>

        {/* Score Display */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>{config.display.headerLabel}</Text>
          <Animated.View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>
              {mode === 'infinite'
                ? displayedScore
                : displayedScore.toLocaleString()}
            </Text>
            <Text style={styles.scoreUnit}>
              {mode === 'infinite' ? '問' : '点'}
            </Text>
          </Animated.View>

          <View style={styles.badgeRow}>
          {/* Difficulty Badge */}
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor: difficultyConfig.theme.primary + '20',
                borderColor: difficultyConfig.theme.primary + '40',
              },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: difficultyConfig.theme.primary },
              ]}
            >
              {difficultyConfig.label.ja}
            </Text>
          </View>

          {/* High Score Information */}
          {isNewHighScore ? (
            <Animated.View
              style={[
                styles.newRecordBadge,
                {
                  opacity: celebrationAnim,
                  transform: [
                    {
                      scale: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <MaterialIcons
                name="trending-up"
                size={20}
                color={ModernDesign.colors.accent.gold}
              />
              <Text style={styles.newRecordText}>新記録！</Text>
            </Animated.View>
          ) : previousHighScore > 0 ? (
            <View style={styles.previousScoreContainer}>
              <Text style={styles.previousScoreLabel}>ハイスコア</Text>
              <Text style={styles.previousScoreValue}>
                {mode === 'infinite'
                  ? `${previousHighScore}問`
                  : `${previousHighScore.toLocaleString()}点`}
              </Text>
            </View>
          ) : null}
          </View>
        </View>

        {/* Ranking */}
        {rankInfo?.rank && (
          <View style={styles.rankSection}>
            <MaterialIcons
              name="leaderboard"
              size={20}
              color={ModernDesign.colors.accent.gold}
            />
            {isRankingTallying ? (
              <Text style={styles.rankText}>
                ランキングにエントリーしました
                <Text style={styles.rankSubText}>（集計期間中）</Text>
              </Text>
            ) : (
              <Text style={styles.rankText}>
                全国 {rankInfo.rank.toLocaleString()}位
                <Text style={styles.rankSubText}>
                  {' '}/ {rankInfo.totalUsers.toLocaleString()}人
                  {topPercent !== null && `（上位${topPercent}%）`}
                </Text>
              </Text>
            )}
          </View>
        )}

        {/* 基準スコア（チャレンジのみ。他のプレイヤーがいなくても目標が分かる） */}
        {gameMode === GameMode.CHALLENGE && (
          <ScoreTierBar
            difficulty={currentDifficulty}
            score={finalScore}
            style={styles.tierBar}
          />
        )}

        {/* 自己記録 */}
        {stats.gamesPlayed > 0 && (
          <View style={styles.selfRecordRow}>
            <MaterialIcons
              name="local-fire-department"
              size={16}
              color={ModernDesign.colors.accent.coral}
            />
            <Text style={styles.selfRecordText}>
              {streakDays > 0 ? `連続プレイ ${streakDays}日目` : '今日から再開'}
              {'  ・  '}累計 {stats.totalCorrect.toLocaleString()}問正解
            </Text>
          </View>
        )}

        {/* Score Breakdown */}
        {breakdownRows.length > 0 && (
          <View style={styles.breakdownSection}>
            {breakdownRows.map(row => (
              <View key={row.label} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{row.label}</Text>
                <Text style={styles.breakdownValue}>
                  +{row.value.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Performance Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <MaterialIcons
              name="done"
              size={24}
              color={ModernDesign.colors.accent.gold}
            />
            <Text style={styles.statLabel}>正解数</Text>
            <Text style={styles.statValue}>{correctCount}問</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialIcons
              name="timer"
              size={24}
              color={ModernDesign.colors.accent.neon}
            />
            <Text style={styles.statLabel}>平均回答時間</Text>
            <Text style={styles.statValue}>
              {averageSolveTime !== null
                ? `${averageSolveTime.toFixed(1)}秒`
                : '---'}
            </Text>
          </View>

          {gameMode === GameMode.CHALLENGE && (
            <View style={styles.statItem}>
              <MaterialIcons
                name="local-fire-department"
                size={24}
                color={ModernDesign.colors.accent.coral}
              />
              <Text style={styles.statLabel}>最大コンボ</Text>
              <Text style={styles.statValue}>{gameState?.maxCombo || 0}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <Button
            icon="replay"
            title="もう一度"
            onPress={handleRetry}
            variant="primary"
          />

          <Button
            icon="home"
            title="メニュー"
            onPress={handleBackToMenu}
            variant="default"
          />
        </View>
      </Animated.View>
      </ScrollView>

      {/* New High Score Confetti Effect */}
      {isNewHighScore && (
        <Animated.View
          style={[
            styles.confettiContainer,
            {
              opacity: celebrationAnim,
            },
          ]}
          pointerEvents="none"
        >
          {[...Array(12)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  left: (width / 12) * index,
                  backgroundColor: [
                    ModernDesign.colors.accent.neon,
                    ModernDesign.colors.accent.gold,
                    ModernDesign.colors.accent.coral,
                    ModernDesign.colors.accent.mint,
                  ][index % 4],
                  transform: [
                    {
                      translateY: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, 200],
                      }),
                    },
                    {
                      rotate: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* バナー広告 */}
      <BannerAdView style={styles.bannerAd} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: ModernDesign.spacing[4],
    paddingBottom: 84, // 広告スペース（アダプティブバナーの高さ + 余白）
    paddingHorizontal: ModernDesign.spacing[4],
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ModernDesign.colors.background.primary,
    opacity: 0.95,
  },
  resultCard: {
    width: '100%',
    maxWidth: 340, // 最大幅をさらに縮小
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['3xl'],
    borderWidth: 2,
    borderColor: ModernDesign.colors.accent.neon,
    padding: ModernDesign.spacing[5], // パディングをさらに縮小
    alignItems: 'center',
    ...ModernDesign.shadows.xl,
  },
  headerIconContainer: {
    width: 56, // サイズをさらに縮小
    height: 56, // サイズをさらに縮小
    borderRadius: ModernDesign.borderRadius.full,
    backgroundColor: ModernDesign.colors.glass.background,
    borderWidth: 1,
    borderColor: ModernDesign.colors.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[3], // マージンを縮小
    ...ModernDesign.shadows.base,
  },
  title: {
    fontSize: ModernDesign.typography.fontSize['3xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
    textAlign: 'center',
    marginBottom: ModernDesign.spacing[2],
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[4], // マージンをさらに縮小
  },
  scoreLabel: {
    fontSize: ModernDesign.typography.fontSize.base,
    color: ModernDesign.colors.text.secondary,
    marginBottom: ModernDesign.spacing[2],
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: ModernDesign.spacing[2],
  },
  scoreValue: {
    fontSize: ModernDesign.typography.fontSize['6xl'],
    fontWeight: ModernDesign.typography.fontWeight.black,
    color: ModernDesign.colors.accent.neon,
    lineHeight: ModernDesign.typography.fontSize['6xl'] * 1.1,
  },
  scoreUnit: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
    marginLeft: ModernDesign.spacing[2],
  },
  newRecordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    borderWidth: 1,
    borderColor: ModernDesign.colors.accent.gold,
    borderRadius: ModernDesign.borderRadius.full,
    paddingHorizontal: ModernDesign.spacing[4],
    paddingVertical: ModernDesign.spacing[2],
    gap: ModernDesign.spacing[2],
  },
  newRecordText: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.gold,
  },
  previousScoreContainer: {
    alignItems: 'center',
  },
  previousScoreLabel: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.tertiary,
  },
  previousScoreValue: {
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.text.secondary,
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[2],
    marginBottom: ModernDesign.spacing[4],
  },
  rankText: {
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.gold,
  },
  rankSubText: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    color: ModernDesign.colors.text.secondary,
  },
  tierBar: {
    marginBottom: ModernDesign.spacing[3],
  },
  selfRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[1],
    marginBottom: ModernDesign.spacing[4],
  },
  selfRecordText: {
    fontSize: ModernDesign.typography.fontSize.xs,
    color: ModernDesign.colors.text.secondary,
  },
  breakdownSection: {
    width: '100%',
    paddingVertical: ModernDesign.spacing[2],
    paddingHorizontal: ModernDesign.spacing[4],
    marginBottom: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.background.secondary,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  breakdownLabel: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.secondary,
  },
  breakdownValue: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.text.primary,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: ModernDesign.spacing[6], // マージンを縮小
    paddingHorizontal: ModernDesign.spacing[4],
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.secondary,
    marginTop: ModernDesign.spacing[1],
    marginBottom: ModernDesign.spacing[1],
  },
  statValue: {
    fontSize: ModernDesign.typography.fontSize.base,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.text.primary,
  },
  buttonSection: {
    width: '100%',
    gap: ModernDesign.spacing[4],
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ModernDesign.borderRadius.full,
    paddingHorizontal: ModernDesign.spacing[3],
    paddingVertical: ModernDesign.spacing[1],
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ModernDesign.spacing[3],
  },
  difficultyText: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerAd: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
