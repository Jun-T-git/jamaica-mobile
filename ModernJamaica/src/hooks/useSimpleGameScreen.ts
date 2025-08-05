import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useGameMenu } from './useGameMenu';
import { useSuccessAnimation } from './useSuccessAnimation';
import { useGameDialogs } from './useGameDialogs';
import { GameMode, GameStatus } from '../types';
import { getGameModeConfig, getDialogConfig, getTimeWarningColor } from '../config';
import { getDifficultyConfig } from '../config/difficulty';
import { formatTime } from '../utils/gameUtils';
import { COLORS } from '../constants';
import type { StackNavigationProp } from '@react-navigation/stack';

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

/**
 * シンプルなゲーム画面フック
 * 複雑な抽象化を削除し、直接的にStoreを使用
 */
export const useSimpleGameScreen = (
  mode: GameMode,
  navigation: StackNavigationProp<RootStackParamList>
) => {
  const config = getGameModeConfig(mode);
  const dialogConfig = getDialogConfig(mode);
  
  const {
    gameState,
    gameStatus,
    targetNumber,
    highScores,
    completeCountdown,
    pauseGame,
    resumeGame,
    skipProblem,
    endGame,
    setNavigationCallback,
  } = useGameStore();

  // UI管理
  const { showMenu, closeMenu, toggleMenu } = useGameMenu(gameStatus);
  
  // 成功アニメーション（無限モードは自動で次の問題生成）
  const successAnim = useSuccessAnimation(
    gameStatus,
    mode === GameMode.CHALLENGE ? 200 : 500,
    // 無限モードでは自動で次の問題を生成しない（Store内で処理）
  );

  // ダイアログ管理
  const dialogHandlers = useGameDialogs(mode, navigation, null);

  // メニュー表示/非表示でゲームを一時停止/再開
  useEffect(() => {
    if (showMenu) {
      pauseGame();
    } else if (gameStatus === GameStatus.BUILDING) {
      resumeGame();
    }
  }, [showMenu, gameStatus, pauseGame, resumeGame]);

  // ナビゲーションコールバック設定
  useEffect(() => {
    const navigateToResult = (params: any) => {
      navigation.replace('ChallengeResult', params);
    };
    
    setNavigationCallback(navigateToResult);
    
    return () => {
      setNavigationCallback(() => {});
    };
  }, [navigation, setNavigationCallback]);

  // 難易度設定を取得
  const difficultyConfig = getDifficultyConfig(gameState.difficulty);
  
  // ヘッダー統計情報
  const headerStats = [
    {
      label: config.display.headerLabel,
      value: config.display.scoreFormatter(gameState.score),
      variant: 'default' as const,
      labelColor: COLORS.TEXT.SECONDARY,
      valueColor: COLORS.TEXT.PRIMARY,
    },
    {
      label: '残り時間',
      value: gameStatus === GameStatus.COUNTDOWN 
        ? '--:--' 
        : formatTime(gameState.timeLeft),
      variant: 'timer' as const,
      labelColor: COLORS.TEXT.SECONDARY,
      valueColor: gameStatus === GameStatus.COUNTDOWN 
        ? COLORS.TEXT.DISABLED 
        : getTimeWarningColor(
            gameState.timeLeft, 
            mode, 
            COLORS.TEXT.PRIMARY, 
            COLORS.DANGER
          ),
    },
    {
      label: '難易度',
      value: difficultyConfig.label.ja,
      variant: 'compact' as const,
      labelColor: COLORS.TEXT.SECONDARY,
      valueColor: difficultyConfig.theme.primary,
    },
  ];

  // ゲーム情報
  const gameInfo = {
    target: targetNumber,
    instruction: gameStatus === GameStatus.COUNTDOWN 
      ? 'ゲーム開始まで待機中...' 
      : '最初の数字をタップしてください',
  };

  return {
    // 状態
    gameState,
    gameStatus,
    showMenu,
    headerStats,
    gameInfo,
    successAnim,
    highScore: highScores[mode][gameState.difficulty],
    
    // ダイアログ
    dialogs: {
      config: dialogConfig,
      ...dialogHandlers,
    },
    
    // ハンドラー
    handlers: {
      onCountdownComplete: completeCountdown,
      onMenuToggle: toggleMenu,
      onMenuClose: closeMenu,
      onSkip: skipProblem,
      onEndGame: (isManual?: boolean) => endGame(isManual),
    },
  };
};