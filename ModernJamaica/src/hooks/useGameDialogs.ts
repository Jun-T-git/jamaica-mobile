import React, { useState } from 'react';
import { GameMode } from '../types';
import { useGameStore } from '../store/gameStore';

/**
 * Custom hook for managing game dialog states
 * Handles restart and exit confirmation dialogs
 */
export const useGameDialogs = (
  gameMode: GameMode,
  navigation: any,
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const { initGame, endChallenge, resetInfiniteStats } = useGameStore();

  const handleRestart = async () => {
    setShowRestartDialog(false);
    
    try {
      // Clear timer and reset reference properly
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Reinitialize the game with countdown
      await initGame(gameMode);
    } catch (error) {
      console.error('Failed to restart game:', error);
      // Reset dialog state if restart fails
      setShowRestartDialog(false);
    }
  };

  const handleExit = async () => {
    setShowExitDialog(false);
    
    try {
      // Clear timer before exiting
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (gameMode === GameMode.CHALLENGE) {
        endChallenge(true);
      } else {
        await resetInfiniteStats();
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to exit game:', error);
      // Force navigation back even if cleanup fails
      navigation.goBack();
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