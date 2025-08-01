import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { GameStatus } from '../types';

/**
 * Custom hook for managing success animation
 * Handles success feedback when user gets correct answer
 */
export const useSuccessAnimation = (
  gameStatus: GameStatus,
  delay: number = 200,
  onComplete?: () => void
) => {
  const [successAnim] = useState(new Animated.Value(0));
  const correctProcessedRef = useRef(false);

  useEffect(() => {
    if (gameStatus === GameStatus.CORRECT && !correctProcessedRef.current) {
      correctProcessedRef.current = true;
      
      // Visual feedback only (vibration removed for UX simplification)
      
      // Success animation sequence
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          delay,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }
  }, [gameStatus, successAnim, delay, onComplete]);
  
  // Reset flag when status changes away from CORRECT
  useEffect(() => {
    if (gameStatus !== GameStatus.CORRECT) {
      correctProcessedRef.current = false;
    }
  }, [gameStatus]);
  
  return successAnim;
};