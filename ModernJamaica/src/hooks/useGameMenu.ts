import { useState, useEffect } from 'react';
import { GameStatus } from '../types';

/**
 * Custom hook for managing game menu state
 * Handles menu visibility with game status awareness
 */
export const useGameMenu = (gameStatus: GameStatus) => {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu automatically when game status changes to countdown
  useEffect(() => {
    if (gameStatus === GameStatus.COUNTDOWN && showMenu) {
      setShowMenu(false);
    }
  }, [gameStatus, showMenu]);

  // Menu can only be toggled during BUILDING state
  const toggleMenu = () => {
    if (gameStatus === GameStatus.BUILDING) {
      setShowMenu(!showMenu);
    }
  };

  // Close menu safely
  const closeMenu = () => {
    setShowMenu(false);
  };

  return {
    showMenu,
    setShowMenu,
    toggleMenu,
    closeMenu,
  };
};