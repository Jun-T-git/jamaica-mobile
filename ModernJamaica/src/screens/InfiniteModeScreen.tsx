import React, { useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, Vibration } from 'react-native';
import { Dialog } from '../components/molecules/Dialog';
import { SuccessOverlay } from '../components/molecules/SuccessOverlay';
import { CountdownOverlay } from '../components/molecules/CountdownOverlay';
import { GameBoard } from '../components/organisms/GameBoard';
import { GameHeader } from '../components/organisms/GameHeader';
import { PauseMenu } from '../components/organisms/PauseMenu';
import { COLORS, ModernDesign } from '../constants';
import { useGameStore } from '../store/gameStore';
import { GameMode, GameStatus } from '../types';
import { formatTime } from '../utils/gameUtils';
import { useGameTimer } from '../hooks/useGameTimer';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { useGameDialogs } from '../hooks/useGameDialogs';
import { useGameMenu } from '../hooks/useGameMenu';

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
    completeCountdown,
  } = useGameStore();

  const startTimeRef = useRef<number>(Date.now());

  // Use custom hook for menu management
  const { showMenu, closeMenu, toggleMenu } = useGameMenu(gameStatus);

  // Use custom hook for timer management
  const timerRef = useGameTimer(
    infiniteStats?.isActive || false,
    infiniteStats?.timeLeft || 0,
    updateInfiniteTime,
    showMenu,
    gameStatus
  );

  // Use custom hook for success animation
  const successAnim = useSuccessAnimation(gameStatus, 500, () => {
    generateNewProblem();
  });

  // Use custom hook for dialog management
  const {
    showRestartDialog,
    setShowRestartDialog,
    showExitDialog,
    setShowExitDialog,
    handleRestart,
    handleExit,
  } = useGameDialogs(GameMode.INFINITE, navigation, timerRef);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentProblem]);


  // Track if we've processed correct answer for current problem
  const correctProcessedRef = useRef(false);

  // Handle correct answer - track stats when user gets correct answer
  useEffect(() => {
    if (gameStatus === GameStatus.CORRECT && !correctProcessedRef.current) {
      correctProcessedRef.current = true;
      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      updateInfiniteStats(true, timeSpent);
    }
  }, [gameStatus, updateInfiniteStats]);

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


  const handleCountdownComplete = () => {
    completeCountdown();
  };

  if (!infiniteStats) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Countdown Overlay */}
      <CountdownOverlay
        visible={gameStatus === GameStatus.COUNTDOWN}
        onComplete={handleCountdownComplete}
      />

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
            value: gameStatus === GameStatus.COUNTDOWN ? '--:--' : formatTime(infiniteStats.timeLeft),
            variant: 'timer',
            labelColor: COLORS.TEXT.SECONDARY,
            valueColor: gameStatus === GameStatus.COUNTDOWN 
              ? COLORS.TEXT.DISABLED
              : (infiniteStats.timeLeft || 0) <= 30
                ? COLORS.DANGER
                : COLORS.TEXT.PRIMARY,
          },
        ]}
        showMenu={showMenu}
        onMenuPress={toggleMenu}
        menuDisabled={gameStatus !== GameStatus.BUILDING}
      />

      <PauseMenu
        visible={showMenu}
        onClose={closeMenu}
        onResume={() => {
          Vibration.vibrate(50);
          closeMenu();
        }}
        onRestart={() => {
          Vibration.vibrate(75);
          closeMenu();
          setShowRestartDialog(true);
        }}
        onHome={() => {
          Vibration.vibrate(100);
          closeMenu();
          setShowExitDialog(true);
        }}
        gameMode={GameMode.INFINITE}
      />

      <GameBoard
        gameInfo={{
          target: targetNumber,
          instruction: gameStatus === GameStatus.COUNTDOWN 
            ? 'ゲーム開始まで待機中...' 
            : '最初の数字をタップしてください',
        }}
        disabled={gameStatus === GameStatus.COUNTDOWN}
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
            onPress: handleRestart,
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
            onPress: handleExit,
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
});
