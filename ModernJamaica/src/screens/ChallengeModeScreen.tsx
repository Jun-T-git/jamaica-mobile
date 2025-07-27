import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UltraSimpleBoard } from '../components/UltraSimpleBoard';
import { COLORS, GAME_CONFIG, ModernDesign } from '../constants';
import { useGameStore } from '../store/gameStore';
import { GameStatus } from '../types';

type RootStackParamList = {
  ModeSelection: undefined;
  Challenge: undefined;
  Infinite: undefined;
};

interface ChallengeModeScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const ChallengeModeScreen: React.FC<ChallengeModeScreenProps> = ({
  navigation,
}) => {
  const {
    targetNumber,
    gameStatus,
    challengeState,
    challengeHighScore,
    updateChallengeTime,
    endChallenge,
  } = useGameStore();

  const [showMenu, setShowMenu] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (challengeState?.isActive) {
      timerRef.current = setInterval(() => {
        if (challengeState.timeLeft > 0) {
          updateChallengeTime(challengeState.timeLeft - 1);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [challengeState?.isActive, challengeState?.timeLeft, updateChallengeTime]);

  // Menu animation effects
  useEffect(() => {
    if (showMenu) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showMenu, fadeAnim, scaleAnim]);

  useEffect(() => {
    if (
      gameStatus === GameStatus.TIMEUP &&
      challengeState?.finalScore !== undefined
    ) {
      const isNewHighScore = challengeState.finalScore > challengeHighScore;
      Alert.alert(
        'タイムアップ！',
        `お疲れ様でした！\n正解数: ${challengeState.finalScore}問${
          isNewHighScore ? '\n\n🎉 新記録達成！' : 
          challengeHighScore > 0 ? `\nハイスコア: ${challengeHighScore}問` : ''
        }`,
        [
          {
            text: 'メニューに戻る',
            onPress: () => navigation.navigate('ModeSelection'),
          },
        ],
      );
    }
  }, [gameStatus, challengeState?.finalScore, challengeHighScore, navigation]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (!challengeState) return COLORS.TEXT.PRIMARY;
    if (challengeState.timeLeft <= GAME_CONFIG.CHALLENGE_MODE.WARNING_TIME) {
      return COLORS.DANGER;
    }
    return COLORS.TEXT.PRIMARY;
  };

  if (!challengeState) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>問題数</Text>
            <Text style={styles.statValue}>{challengeState.problemCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>残り時間</Text>
            <Text
              style={[
                styles.statValue,
                styles.timer,
                { color: getTimeColor() },
              ]}
            >
              {formatTime(challengeState.timeLeft)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>スキップ</Text>
            <View style={styles.resetRow}>
              <MaterialIcons
                name="skip-next"
                size={16}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.statValue}>{challengeState.skipCount}回</Text>
            </View>
          </View>

          {/* Game Menu */}
          <TouchableOpacity
            style={[styles.gameMenuButton, showMenu && styles.gameMenuButtonActive]}
            onPress={() => {
              Vibration.vibrate(50);
              setShowMenu(!showMenu);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.menuIconContainer}>
              <MaterialIcons
                name={showMenu ? 'close' : 'settings'}
                size={20}
                color={ModernDesign.colors.text.primary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Professional Puzzle Game Pause Overlay */}
      {showMenu && (
        <>
          {/* Enhanced Backdrop with Blur Effect */}
          <Animated.View
            style={[
              styles.pauseBackdrop,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
          </Animated.View>
          
          {/* Central Pause Menu Card */}
          <Animated.View
            style={[
              styles.pauseMenuCard,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Pause Icon Header */}
            <View style={styles.pauseHeader}>
              <View style={styles.pauseIconContainer}>
                <MaterialIcons
                  name="pause-circle-filled"
                  size={48}
                  color={ModernDesign.colors.accent.neon}
                />
              </View>
              <Text style={styles.pauseTitle}>ゲーム一時停止</Text>
            </View>

            {/* Action Buttons Grid */}
            <View style={styles.pauseActions}>
              {/* Resume - Primary Action */}
              <TouchableOpacity
                style={[styles.pauseButton, styles.resumeButton]}
                onPress={() => {
                  Vibration.vibrate(50);
                  setShowMenu(false);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pauseButtonIcon}>
                  <MaterialIcons
                    name="play-arrow"
                    size={32}
                    color={ModernDesign.colors.background.primary}
                  />
                </View>
                <Text style={styles.resumeButtonText}>続ける</Text>
              </TouchableOpacity>

              {/* Restart */}
              <TouchableOpacity
                style={[styles.pauseButton, styles.secondaryButton]}
                onPress={() => {
                  Vibration.vibrate(75);
                  setShowMenu(false);
                  Alert.alert(
                    'チャレンジをリスタート',
                    '新しいチャレンジを開始しますか？\n\n⚠️ 現在の進行状況が失われます',
                    [
                      {
                        text: 'キャンセル',
                        style: 'cancel',
                        onPress: () => Vibration.vibrate(30),
                      },
                      {
                        text: 'リスタート',
                        style: 'destructive',
                        onPress: () => {
                          Vibration.vibrate(100);
                          // Add restart logic here
                          setShowMenu(false);
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pauseButtonIcon}>
                  <MaterialIcons
                    name="refresh"
                    size={28}
                    color={ModernDesign.colors.text.primary}
                  />
                </View>
                <Text style={styles.secondaryButtonText}>リスタート</Text>
              </TouchableOpacity>

              {/* Quit Game */}
              <TouchableOpacity
                style={[styles.pauseButton, styles.quitButton]}
                onPress={() => {
                  Vibration.vibrate(100);
                  setShowMenu(false);
                  Alert.alert(
                    'チャレンジ終了',
                    'チャレンジを終了してメインメニューに戻りますか？\n\n✨ 達成したスコアが保存されます',
                    [
                      {
                        text: 'キャンセル',
                        style: 'cancel',
                        onPress: () => Vibration.vibrate(30),
                      },
                      {
                        text: '終了する',
                        style: 'destructive',
                        onPress: () => {
                          Vibration.vibrate(200);
                          endChallenge(true); // 手動終了を示すフラグ
                          navigation.goBack();
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pauseButtonIcon}>
                  <MaterialIcons
                    name="home"
                    size={28}
                    color={ModernDesign.colors.error}
                  />
                </View>
                <Text style={styles.quitButtonText}>終了</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}

      <UltraSimpleBoard
        gameInfo={{
          target: targetNumber,
          instruction: '最初の数字をタップしてください',
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.CARD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timer: {
    fontSize: 26,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Game Menu Styles
  gameMenuButton: {
    borderRadius: ModernDesign.borderRadius.full,
    backgroundColor: ModernDesign.colors.glass.background,
    borderWidth: 1,
    borderColor: ModernDesign.colors.glass.border,
    ...ModernDesign.shadows.base,
  },
  gameMenuButtonActive: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
    transform: [{ scale: 0.95 }],
    ...ModernDesign.shadows.glow,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  centeredMenu: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 300,
    marginLeft: -150,
    marginTop: -140,
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['3xl'],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.xl,
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernDesign.spacing[6],
    paddingVertical: ModernDesign.spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: ModernDesign.colors.border.subtle,
    backgroundColor: 'transparent',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  dangerMenuItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernDesign.spacing[4],
  },
  // Professional Puzzle Game Pause Menu
  pauseBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    zIndex: 999,
  },
  pauseMenuCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 320,
    marginLeft: -160,
    marginTop: -140,
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['3xl'],
    borderWidth: 2,
    borderColor: ModernDesign.colors.accent.neon,
    ...ModernDesign.shadows.xl,
    zIndex: 1000,
    paddingVertical: ModernDesign.spacing[8],
    paddingHorizontal: ModernDesign.spacing[6],
  },
  pauseHeader: {
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[8],
  },
  pauseIconContainer: {
    marginBottom: ModernDesign.spacing[3],
    opacity: 0.9,
  },
  pauseTitle: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  pauseActions: {
    gap: ModernDesign.spacing[4],
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ModernDesign.spacing[4],
    paddingHorizontal: ModernDesign.spacing[6],
    borderRadius: ModernDesign.borderRadius.xl,
    borderWidth: 2,
    ...ModernDesign.shadows.base,
  },
  resumeButton: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
    ...ModernDesign.shadows.glow,
  },
  secondaryButton: {
    backgroundColor: ModernDesign.colors.background.secondary,
    borderColor: ModernDesign.colors.border.medium,
  },
  quitButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: ModernDesign.colors.error,
  },
  pauseButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernDesign.spacing[4],
  },
  resumeButtonText: {
    flex: 1,
    fontSize: ModernDesign.typography.fontSize.xl,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.background.primary,
    textAlign: 'center',
  },
  secondaryButtonText: {
    flex: 1,
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.text.primary,
    textAlign: 'center',
  },
  quitButtonText: {
    flex: 1,
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.error,
    textAlign: 'center',
  },
  controls: {
    padding: 20,
  },
});
