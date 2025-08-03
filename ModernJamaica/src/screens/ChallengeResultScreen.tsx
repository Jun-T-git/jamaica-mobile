import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../components/atoms/Button';
import { BannerAdView } from '../components/molecules/BannerAdView';
import { getDifficultyConfig } from '../config/difficulty';
import { getGameModeConfig } from '../config/gameMode';
import { COLORS, ModernDesign } from '../constants';
import { useGameStore } from '../store/gameStore';
import { DifficultyLevel, GameMode } from '../types';

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
  const { initGame, gameState } = useGameStore();

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
    setTimeout(() => {
      Animated.timing(scoreCountAnim, {
        toValue: finalScore,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Animate score counter
      const scoreInterval = setInterval(() => {
        scoreCountAnim.addListener(({ value }) => {
          setDisplayedScore(Math.floor(value));
        });
      }, 16);

      setTimeout(() => {
        clearInterval(scoreInterval);
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
      }, 1500);
    }, 800);
  }, [
    finalScore,
    isNewHighScore,
    fadeAnim,
    slideAnim,
    scaleAnim,
    scoreCountAnim,
    celebrationAnim,
  ]);

  const handleRetry = async () => {
    console.log('Retry button pressed, mode:', mode);

    try {
      // ゲーム状態をリセットしてから新しいゲームを開始
      const targetGameMode =
        mode === 'infinite' ? GameMode.INFINITE : GameMode.CHALLENGE;
      console.log('Initializing game with mode:', targetGameMode);
      await initGame(targetGameMode, currentDifficulty);

      // 初期化完了を待つ
      await new Promise(resolve => setTimeout(resolve, 100));

      // replaceを使用して戻るボタンでリザルト画面に戻らないようにする
      const screenName = mode === 'infinite' ? 'InfiniteMode' : 'ChallengeMode';
      console.log('Navigating to screen:', screenName);
      if (screenName === 'ChallengeMode') {
        navigation.replace('ChallengeMode', { difficulty: currentDifficulty });
      } else {
        navigation.replace('InfiniteMode', { difficulty: currentDifficulty });
      }
      console.log('Navigation completed');
    } catch (error) {
      console.error('Error in handleRetry:', error);
    }
  };

  const handleBackToMenu = () => {
    // replaceを使用して戻るボタンでリザルト画面に戻らないようにする
    navigation.replace('ModeSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient Effect */}
      <View style={styles.backgroundGradient} />

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

        <Text style={styles.subtitle}>
          {isNewHighScore ? '素晴らしい結果です！' : 'お疲れ様でした！'}
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

        {/* Performance Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <MaterialIcons
              name="timer"
              size={24}
              color={ModernDesign.colors.accent.neon}
            />
            <Text style={styles.statLabel}>平均回答時間</Text>
            <Text style={styles.statValue}>
              {gameState?.problemCount && gameState.problemCount > 0
                ? `${(60 / gameState.problemCount).toFixed(1)}秒`
                : '---'}
            </Text>
          </View>

          <View style={styles.statItem}>
            <MaterialIcons
              name="done"
              size={24}
              color={ModernDesign.colors.accent.gold}
            />
            <Text style={styles.statLabel}>正解した問題数</Text>
            <Text style={styles.statValue}>
              {gameState?.problemCount || 0}問
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <Button
            icon="replay"
            title="もう一度"
            onPress={() => {
              console.log('Button onPress triggered');
              handleRetry();
            }}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120, // 広告スペースを縮小
    paddingHorizontal: ModernDesign.spacing[4], // 左右のマージンを追加
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
  subtitle: {
    fontSize: ModernDesign.typography.fontSize.lg,
    color: ModernDesign.colors.text.secondary,
    textAlign: 'center',
    marginBottom: ModernDesign.spacing[4], // マージンをさらに縮小
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
    marginBottom: ModernDesign.spacing[4],
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
    marginTop: ModernDesign.spacing[2],
    marginBottom: ModernDesign.spacing[3], // 新記録バッジとの間隔を広げる
    borderWidth: 1,
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
