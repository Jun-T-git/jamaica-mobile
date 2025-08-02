import { useState } from 'react';
import { GameMode } from '../types';
import { useGameStore } from '../store/gameStore';

/**
 * シンプルなゲームダイアログ管理フック
 * タイマー管理の複雑性を削除
 */
export const useGameDialogs = (
  gameMode: GameMode,
  navigation: any,
  _timerRef: any // もう使用しないが互換性のため残す
) => {
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const { initGame, endGame } = useGameStore();

  const handleRestart = async () => {
    setShowRestartDialog(false);
    
    try {
      // タイマーはStore内で管理されるため、ここでの処理は不要
      await initGame(gameMode);
    } catch (error) {
      console.error('Failed to restart game:', error);
      setShowRestartDialog(false);
    }
  };

  const handleExit = async () => {
    setShowExitDialog(false);
    
    try {
      // タイマーはStore内で管理されるため、ここでの処理は不要
      await endGame(true);
      navigation.navigate('ModeSelection');
    } catch (error) {
      console.error('Failed to exit game:', error);
      navigation.navigate('ModeSelection');
    }
  };

  return {
    showRestartDialog,
    setShowRestartDialog,
    showExitDialog,
    setShowExitDialog,
    handleRestart,
    handleExit,
  };
};