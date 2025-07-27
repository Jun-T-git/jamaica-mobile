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
import { COLORS, GAME_CONFIG } from '../constants';
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

          {/* Hamburger Menu */}
          <TouchableOpacity
            style={[styles.menuButton, showMenu && styles.menuButtonActive]}
            onPress={() => {
              Vibration.vibrate(50);
              setShowMenu(!showMenu);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={showMenu ? 'close' : 'more-vert'}
              size={24}
              color={showMenu ? COLORS.PRIMARY : COLORS.TEXT.PRIMARY}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Screen Menu Overlay */}
      {showMenu && (
        <>
          <Animated.View
            style={[
              styles.fullScreenOverlay,
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
          <Animated.View
            style={[
              styles.centeredMenu,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.menuItem, styles.dangerMenuItem]}
              onPress={() => {
                Vibration.vibrate(100);
                setShowMenu(false);
                Alert.alert(
                  '🛑 チャレンジ中断',
                  'チャレンジを中断してメニューに戻りますか？',
                  [
                    {
                      text: 'キャンセル',
                      style: 'cancel',
                      onPress: () => {
                        Vibration.vibrate(30);
                      },
                    },
                    {
                      text: '中断する',
                      style: 'destructive',
                      onPress: () => {
                        Vibration.vibrate(200);
                        endChallenge();
                        navigation.goBack();
                      },
                    },
                  ],
                  { cancelable: false },
                );
              }}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemIcon}>
                <MaterialIcons
                  name="exit-to-app"
                  size={22}
                  color={COLORS.DANGER}
                />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemText, styles.dangerText]}>
                  チャレンジ中断
                </Text>
                <Text style={styles.menuItemSubtext}>スコアを保存して終了</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={() => {
                Vibration.vibrate(50);
                setShowMenu(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemIcon}>
                <MaterialIcons
                  name="close"
                  size={22}
                  color={COLORS.TEXT.SECONDARY}
                />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>閉じる</Text>
                <Text style={styles.menuItemSubtext}>チャレンジを続ける</Text>
              </View>
            </TouchableOpacity>
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
  // Menu Styles
  menuButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonActive: {
    backgroundColor: '#E3F2FD',
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
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
    width: 280,
    marginLeft: -140,
    marginTop: -120,
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 25,
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'transparent',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  dangerMenuItem: {
    backgroundColor: 'rgba(208, 2, 27, 0.02)',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 14,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '400',
  },
  dangerText: {
    color: COLORS.DANGER,
  },
  controls: {
    padding: 20,
  },
});
