import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
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
import { COLORS, ModernDesign } from '../constants';
import { useSimpleGameScreen } from '../hooks/useSimpleGameScreen';
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
  // シンプルなゲーム画面フック
  const {
    gameState,
    gameStatus,
    showMenu,
    headerStats,
    gameInfo,
    successAnim,
    dialogs,
    handlers,
  } = useSimpleGameScreen(GameMode.CHALLENGE, navigation);

  if (!gameState) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Countdown Overlay */}
      <CountdownOverlay
        visible={gameStatus === GameStatus.COUNTDOWN}
        onComplete={handlers.onCountdownComplete}
      />

      <GameHeader
        stats={headerStats}
        showMenu={showMenu}
        onMenuPress={handlers.onMenuToggle}
        menuDisabled={gameStatus !== GameStatus.BUILDING}
      />

      <PauseMenu
        visible={showMenu}
        onClose={handlers.onMenuClose}
        onResume={() => {
          Vibration.vibrate(50);
          handlers.onMenuClose();
        }}
        onRestart={() => {
          Vibration.vibrate(75);
          handlers.onMenuClose();
          dialogs.setShowRestartDialog(true);
        }}
        onHome={() => {
          Vibration.vibrate(100);
          handlers.onMenuClose();
          dialogs.setShowExitDialog(true);
        }}
        gameMode={GameMode.CHALLENGE}
      />

      <GameBoard
        gameInfo={gameInfo}
        disabled={gameStatus === GameStatus.COUNTDOWN}
      />

      {/* Success Feedback Overlay */}
      <SuccessOverlay
        visible={gameStatus === GameStatus.CORRECT}
        animationValue={successAnim}
      />

      {/* Restart Confirmation Dialog */}
      <Dialog
        visible={dialogs.showRestartDialog}
        title={dialogs.config.restart.title}
        message={dialogs.config.restart.message}
        icon="refresh"
        iconColor={ModernDesign.colors.accent.neon}
        buttons={[
          {
            icon: 'refresh',
            title: dialogs.config.restart.confirmText,
            variant: 'danger',
            onPress: dialogs.handleRestart,
          },
          {
            icon: 'close',
            title: 'キャンセル',
            onPress: () => dialogs.setShowRestartDialog(false),
          },
        ]}
        onClose={() => dialogs.setShowRestartDialog(false)}
      />

      {/* Exit Confirmation Dialog */}
      <Dialog
        visible={dialogs.showExitDialog}
        title={dialogs.config.exit.title}
        message={dialogs.config.exit.message}
        icon="home"
        iconColor={ModernDesign.colors.accent.neon}
        buttons={[
          {
            icon: 'home',
            title: dialogs.config.exit.confirmText,
            variant: 'danger',
            onPress: dialogs.handleExit,
          },
          {
            icon: 'close',
            title: 'キャンセル',
            onPress: () => dialogs.setShowExitDialog(false),
          },
        ]}
        onClose={() => dialogs.setShowExitDialog(false)}
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
