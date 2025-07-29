import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Vibration,
} from 'react-native';
import { GameBoard } from '../components/organisms/GameBoard';
import { PauseMenu } from '../components/organisms/PauseMenu';
import { GameHeader } from '../components/organisms/GameHeader';
import { SuccessOverlay } from '../components/molecules/SuccessOverlay';
import { Dialog } from '../components/molecules/Dialog';
import { COLORS, GAME_CONFIG, ModernDesign } from '../constants';
import { adService } from '../services/adService';
import { useGameStore } from '../store/gameStore';
import { GameMode, GameStatus } from '../types';

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
    endChallenge,
  } = useGameStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [successAnim] = useState(new Animated.Value(0));
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

  // Track if we've processed correct answer for current problem
  const correctProcessedRef = useRef(false);
  
  // Handle correct answer with feedback
  useEffect(() => {
    if (gameStatus === GameStatus.CORRECT && !correctProcessedRef.current) {
      correctProcessedRef.current = true;
      
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
          delay: 200, // チャレンジモードは自動で次の問題に移るので短めに
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [gameStatus, successAnim]);
  
  // Reset flag when problem changes
  useEffect(() => {
    if (gameStatus !== GameStatus.CORRECT) {
      correctProcessedRef.current = false;
    }
  }, [gameStatus]);

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
            value: formatTime(challengeState.timeLeft),
            variant: 'timer',
            labelColor: COLORS.TEXT.SECONDARY,
            valueColor: getTimeColor(),
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
        gameMode={GameMode.CHALLENGE}
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
            onPress: () => {
              setShowRestartDialog(false);
              // TODO: Implement restart logic
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
            onPress: () => {
              setShowExitDialog(false);
              endChallenge(true);
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
  controls: {
    padding: 20,
  },
});
