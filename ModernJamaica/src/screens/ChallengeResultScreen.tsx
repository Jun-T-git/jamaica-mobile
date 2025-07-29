import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Vibration,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, ModernDesign } from '../constants';
import { BannerAdView } from '../components/molecules/BannerAdView';
import { useGameStore } from '../store/gameStore';
import { GameMode } from '../types';
import { Button } from '../components/atoms/Button';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  ModeSelection: undefined;
  ChallengeMode: undefined;
  InfiniteMode: undefined;
  ChallengeResult: {
    finalScore: number;
    isNewHighScore: boolean;
    previousHighScore: number;
    mode?: 'challenge' | 'infinite';
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
  const { finalScore, isNewHighScore, previousHighScore, mode = 'challenge' } = route.params;
  const { initGame } = useGameStore();
  
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
          Vibration.vibrate([0, 100, 200, 100, 200, 100]);
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
  }, [finalScore, isNewHighScore]);

  const handleRetry = async () => {
    console.log('Retry button pressed, mode:', mode);
    Vibration.vibrate(50);
    
    try {
      // ゲーム状態をリセットしてから新しいゲームを開始
      const gameMode = mode === 'infinite' ? GameMode.INFINITE : GameMode.CHALLENGE;
      console.log('Initializing game with mode:', gameMode);
      await initGame(gameMode);
      
      // 初期化完了を待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // replaceを使用して戻るボタンでリザルト画面に戻らないようにする
      const screenName = mode === 'infinite' ? 'InfiniteMode' : 'ChallengeMode';
      console.log('Navigating to screen:', screenName);
      navigation.replace(screenName);
      console.log('Navigation completed');
    } catch (error) {
      console.error('Error in handleRetry:', error);
    }
  };

  const handleBackToMenu = () => {
    Vibration.vibrate(50);
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
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
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
            name={isNewHighScore ? "star" : "timer-off"}
            size={64}
            color={isNewHighScore ? ModernDesign.colors.accent.gold : ModernDesign.colors.accent.neon}
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
          <Text style={styles.scoreLabel}>スコア</Text>
          <Animated.View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{displayedScore.toLocaleString()}</Text>
            <Text style={styles.scoreUnit}>点</Text>
          </Animated.View>
          
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
              <MaterialIcons name="trending-up" size={20} color={ModernDesign.colors.accent.gold} />
              <Text style={styles.newRecordText}>新記録！</Text>
            </Animated.View>
          ) : previousHighScore > 0 ? (
            <View style={styles.previousScoreContainer}>
              <Text style={styles.previousScoreLabel}>ハイスコア</Text>
              <Text style={styles.previousScoreValue}>{previousHighScore.toLocaleString()}点</Text>
            </View>
          ) : null}
        </View>

        {/* Performance Stats */}
        <View style={styles.statsSection}>
          {finalScore > 0 && (
            <View style={styles.statItem}>
              <MaterialIcons name="flash-on" size={24} color={ModernDesign.colors.accent.neon} />
              <Text style={styles.statLabel}>平均時間</Text>
              <Text style={styles.statValue}>
                {Math.round(60 / Math.max(finalScore, 1))}秒/問
              </Text>
            </View>
          )}
          
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={24} color={ModernDesign.colors.accent.gold} />
            <Text style={styles.statLabel}>難易度</Text>
            <Text style={styles.statValue}>
              {finalScore >= 8 ? '上級' : finalScore >= 5 ? '中級' : '初級'}
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
    paddingBottom: 120, // 広告スペースを確保
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
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['3xl'],
    borderWidth: 2,
    borderColor: ModernDesign.colors.accent.neon,
    padding: ModernDesign.spacing[8],
    alignItems: 'center',
    ...ModernDesign.shadows.xl,
  },
  headerIconContainer: {
    width: 100,
    height: 100,
    borderRadius: ModernDesign.borderRadius.full,
    backgroundColor: ModernDesign.colors.glass.background,
    borderWidth: 1,
    borderColor: ModernDesign.colors.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[6],
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
    marginBottom: ModernDesign.spacing[8],
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[8],
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
    marginBottom: ModernDesign.spacing[8],
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