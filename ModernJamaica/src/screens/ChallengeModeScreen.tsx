import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Vibration,
} from 'react-native';
import { GameBoard } from '../components/organisms/GameBoard';
import { PauseMenu } from '../components/organisms/PauseMenu';
import { GameHeader } from '../components/organisms/GameHeader';
import { SuccessOverlay } from '../components/molecules/SuccessOverlay';
import { Dialog } from '../components/molecules/Dialog';
import { CountdownOverlay } from '../components/molecules/CountdownOverlay';
import { COLORS, GAME_CONFIG, ModernDesign } from '../constants';
import { adService } from '../services/adService';
import { useGameStore } from '../store/gameStore';
import { GameMode, GameStatus } from '../types';
import { formatTime, getTimeColor } from '../utils/gameUtils';
import { useGameTimer } from '../hooks/useGameTimer';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { useGameDialogs } from '../hooks/useGameDialogs';
import { useGameMenu } from '../hooks/useGameMenu';

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

interface ChallengeModeScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
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
    completeCountdown,
  } = useGameStore();

  // Use custom hook for menu management
  const { showMenu, closeMenu, toggleMenu } = useGameMenu(gameStatus);
  
  // Use custom hook for timer management
  const timerRef = useGameTimer(
    challengeState?.isActive || false,
    challengeState?.timeLeft || 0,
    updateChallengeTime,
    showMenu,
    gameStatus
  );

  // Use custom hook for success animation
  const successAnim = useSuccessAnimation(gameStatus, 200);

  // Use custom hook for dialog management
  const {
    showRestartDialog,
    setShowRestartDialog,
    showExitDialog,
    setShowExitDialog,
    handleRestart,
    handleExit,
  } = useGameDialogs(GameMode.CHALLENGE, navigation, timerRef);


  // Handle time up - use ref to prevent multiple navigations
  const timeupHandledRef = useRef(false);
  
  useEffect(() => {
    if (
      gameStatus === GameStatus.TIMEUP &&
      challengeState?.finalScore !== undefined &&
      !timeupHandledRef.current
    ) {
      timeupHandledRef.current = true;
      const isNewHighScore = challengeState.finalScore > challengeHighScore;

      // インタースティシャル広告を表示してからリザルト画面へ
      const showResultScreen = async () => {
        const adShown = await adService.showInterstitialAd();

        // 広告表示後、または広告がない場合はすぐにリザルト画面へ
        setTimeout(
          () => {
            navigation.replace('ChallengeResult', {
              finalScore: challengeState.finalScore!,
              isNewHighScore,
              previousHighScore: challengeHighScore,
              mode: 'challenge',
            });
          },
          adShown ? 100 : 0,
        ); // 広告表示後は少し待機
      };

      showResultScreen();
    }
  }, [gameStatus, challengeState?.finalScore, challengeHighScore, navigation]);
  
  // Reset handled flag when game status changes away from TIMEUP
  useEffect(() => {
    if (gameStatus !== GameStatus.TIMEUP) {
      timeupHandledRef.current = false;
    }
  }, [gameStatus]);



  if (!challengeState) return null;

  const handleCountdownComplete = () => {
    completeCountdown();
  };

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
            label: 'スコア',
            value: challengeState.currentScore.toLocaleString(),
            variant: 'default',
            labelColor: COLORS.TEXT.SECONDARY,
            valueColor: COLORS.TEXT.PRIMARY,
          },
          {
            label: '残り時間',
            value: gameStatus === GameStatus.COUNTDOWN ? '--:--' : formatTime(challengeState.timeLeft),
            variant: 'timer',
            labelColor: COLORS.TEXT.SECONDARY,
            valueColor: gameStatus === GameStatus.COUNTDOWN 
              ? COLORS.TEXT.DISABLED 
              : getTimeColor(challengeState.timeLeft, GAME_CONFIG.CHALLENGE_MODE.WARNING_TIME, COLORS.TEXT.PRIMARY, COLORS.DANGER),
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
        gameMode={GameMode.CHALLENGE}
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
        title="チャレンジをリスタート"
        message="新しいチャレンジを開始しますか？

現在の進行状況が失われます"
        icon="refresh"
        iconColor={ModernDesign.colors.accent.neon}
        buttons={[
          {
            icon: 'refresh',
            title: 'リスタート',
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
        title="チャレンジ終了"
        message="チャレンジを終了してメインメニューに戻りますか？

達成したスコアが保存されます"
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
