import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Vibration } from 'react-native';
import { Dialog } from '../components/molecules/Dialog';
import { SuccessOverlay } from '../components/molecules/SuccessOverlay';
import { GameBoard } from '../components/organisms/GameBoard';
import { GameHeader } from '../components/organisms/GameHeader';
import { PauseMenu } from '../components/organisms/PauseMenu';
import { COLORS, ModernDesign } from '../constants';
import { useGameStore } from '../store/gameStore';
import { GameMode, GameStatus } from '../types';

import { StackNavigationProp } from '@react-navigation/stack';

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

interface InfiniteModeScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
}

export const InfiniteModeScreen: React.FC<InfiniteModeScreenProps> = ({
  navigation,
}) => {
  const {
    targetNumber,
    gameStatus,
    infiniteStats,
    currentProblem,
    generateNewProblem,
    updateInfiniteStats,
    updateInfiniteTime,
    endInfiniteMode,
    resetInfiniteStats,
  } = useGameStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [successAnim] = useState(new Animated.Value(0));
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentProblem]);

  // Timer effect for infinite mode
  useEffect(() => {
    if (infiniteStats?.isActive) {
      timerRef.current = setInterval(() => {
        if (infiniteStats.timeLeft > 0) {
          updateInfiniteTime(infiniteStats.timeLeft - 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [infiniteStats?.isActive, infiniteStats?.timeLeft, updateInfiniteTime]);

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

  // Track if we've processed correct answer for current problem
  const correctProcessedRef = useRef(false);

  // Handle correct answer
  useEffect(() => {
    if (gameStatus === GameStatus.CORRECT && !correctProcessedRef.current) {
      correctProcessedRef.current = true;

      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      updateInfiniteStats(true, timeSpent);

      // 成功アニメーションと触覚フィードバック
      Vibration.vibrate([0, 50, 100, 50]);

      // 成功アニメーション
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        generateNewProblem();
        correctProcessedRef.current = false;
      });
    }
  }, [gameStatus, updateInfiniteStats, generateNewProblem, successAnim]);

  // Reset flag when problem changes
  useEffect(() => {
    if (gameStatus !== GameStatus.CORRECT) {
      correctProcessedRef.current = false;
    }
  }, [gameStatus]);

  // Handle time up - use ref to prevent multiple navigations
  const timeupHandledRef = useRef(false);

  useEffect(() => {
    if (
      gameStatus === GameStatus.TIMEUP &&
      infiniteStats &&
      !timeupHandledRef.current
    ) {
      timeupHandledRef.current = true;

      const finalScore = infiniteStats.correctAnswers;
      const isNewHighScore = finalScore > infiniteStats.highScore;
      const previousHighScore = infiniteStats.highScore;

      // Navigate to result screen instead of showing alert
      navigation.replace('ChallengeResult', {
        finalScore,
        isNewHighScore,
        previousHighScore,
        mode: 'infinite',
      });
    }
  }, [gameStatus, infiniteStats, navigation]);

  // Reset handled flag when game status changes away from TIMEUP
  useEffect(() => {
    if (gameStatus !== GameStatus.TIMEUP) {
      timeupHandledRef.current = false;
    }
  }, [gameStatus]);

  // Format time safely to prevent NaN
  const formatTime = (seconds: number | undefined): string => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!infiniteStats) return null;

  return (
    <SafeAreaView style={styles.container}>
      <GameHeader
        stats={[
          {
            label: '正解数',
            value: infiniteStats.correctAnswers,
            variant: 'default',
            labelColor: COLORS.TEXT.SECONDARY,
            valueColor: COLORS.TEXT.PRIMARY,
          },
          {
            label: '残り時間',
            value: formatTime(infiniteStats.timeLeft),
            variant: 'timer',
            labelColor: COLORS.TEXT.SECONDARY,
            valueColor:
              (infiniteStats.timeLeft || 0) <= 30
                ? COLORS.DANGER
                : COLORS.TEXT.PRIMARY,
          },
        ]}
        showMenu={showMenu}
        onMenuPress={() => setShowMenu(!showMenu)}
      />

      <PauseMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onResume={() => {
          Vibration.vibrate(50);
          setShowMenu(false);
        }}
        onRestart={() => {
          Vibration.vibrate(75);
          setShowMenu(false);
          setShowRestartDialog(true);
        }}
        onHome={() => {
          Vibration.vibrate(100);
          setShowMenu(false);
          setShowExitDialog(true);
        }}
        gameMode={GameMode.INFINITE}
      />

      <GameBoard
        gameInfo={{
          target: targetNumber,
          instruction: '最初の数字をタップしてください',
        }}
      />

      {/* Success Feedback Overlay */}
      <SuccessOverlay
        visible={gameStatus === GameStatus.CORRECT}
        animationValue={successAnim}
      />

      {/* Restart Confirmation Dialog */}
      <Dialog
        visible={showRestartDialog}
        title="最初からやり直し"
        message="練習を最初からやり直しますか？現在の記録はリセットされます"
        icon="refresh"
        iconColor={ModernDesign.colors.accent.neon}
        buttons={[
          {
            icon: 'refresh',
            title: 'やり直す',
            variant: 'danger',
            onPress: async () => {
              setShowRestartDialog(false);
              await resetInfiniteStats();
              generateNewProblem();
            },
          },
          {
            icon: 'close',
            title: 'キャンセル',
            onPress: () => setShowRestartDialog(false),
          },
        ]}
        onClose={() => setShowRestartDialog(false)}
      />

      {/* Exit Confirmation Dialog */}
      <Dialog
        visible={showExitDialog}
        title="練習中断"
        message="練習を中断してメインメニューに戻りますか？現在の記録は失われます"
        icon="home"
        iconColor={ModernDesign.colors.accent.neon}
        buttons={[
          {
            icon: 'home',
            title: '終了する',
            variant: 'danger',
            onPress: async () => {
              setShowExitDialog(false);
              await resetInfiniteStats();
              navigation.goBack();
            },
          },
          {
            icon: 'close',
            title: 'キャンセル',
            onPress: () => setShowExitDialog(false),
          },
        ]}
        onClose={() => setShowExitDialog(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
    borderRadius: ModernDesign.borderRadius['2xl'],
    ...ModernDesign.shadows.lg,
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernDesign.spacing[6],
    paddingVertical: ModernDesign.spacing[5],
    backgroundColor: 'transparent',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  dangerMenuItem: {
    backgroundColor: 'rgba(252, 165, 165, 0.08)',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: ModernDesign.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernDesign.spacing[4],
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: ModernDesign.typography.fontSize.lg,
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
    marginBottom: ModernDesign.spacing[1],
  },
  menuItemSubtext: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.normal,
  },
  dangerText: {
    color: ModernDesign.colors.error,
  },
});
