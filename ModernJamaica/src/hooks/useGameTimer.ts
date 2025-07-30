import { useEffect, useRef } from 'react';
import { GameStatus } from '../types';

/**
 * Custom hook for managing game timer
 * Handles timer start/stop based on game state, menu visibility, and countdown status
 */
export const useGameTimer = (
  isActive: boolean,
  timeLeft: number,
  updateTime: (time: number) => void,
  showMenu: boolean,
  gameStatus: GameStatus
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start timer only when:
    // 1. Game is active
    // 2. Menu is not shown (not paused)
    // 3. Game status is BUILDING (not COUNTDOWN, CORRECT, etc.)
    if (isActive && !showMenu && gameStatus === GameStatus.BUILDING) {
      timerRef.current = setInterval(() => {
        if (timeLeft > 0) {
          updateTime(timeLeft - 1);
        }
      }, 1000);
    } else {
      // Clear timer when paused, inactive, or not building
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft, updateTime, showMenu, gameStatus]);

  return timerRef;
};