import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { ModernDesign } from '../../constants';

interface CountdownOverlayProps {
  visible: boolean;
  onComplete: () => void;
  startCount?: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  visible,
  onComplete,
  startCount = 3,
}) => {
  const [currentCount, setCurrentCount] = useState(startCount);
  type CountdownPhase = 'enter' | 'counting' | 'start' | 'exit';
  const [phase, setPhase] = useState<CountdownPhase>('enter');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const circleScaleAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    pulseAnim.setValue(1);
    glowAnim.setValue(0);
    circleScaleAnim.setValue(0);
    particleAnims.forEach(anim => {
      anim.scale.setValue(0);
      anim.opacity.setValue(0);
      anim.rotate.setValue(0);
    });
  };

  useEffect(() => {
    if (visible) {
      setCurrentCount(startCount);
      setPhase('enter');
      
      // Subtle entrance - just fade in the background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setPhase('counting');
        startCountdownSequence();
      });
    } else {
      cleanup();
    }

    return cleanup;
  }, [visible, startCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCountdownSequence = () => {
    // Show initial number immediately
    showNumberAnimation();
    
    intervalRef.current = setInterval(() => {
      setCurrentCount(prev => {
        const nextCount = prev - 1;
        if (nextCount <= 0) {
          // Show "START!" with special animation
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          setPhase('start');
          showStartAnimation();
          return 0;
        } else {
          // Show next number with elegant animation
          showNumberAnimation();
          return nextCount;
        }
      });
    }, 1000);
  };

  const showNumberAnimation = () => {
    // Visual feedback only (vibration removed for UX simplification)
    
    // Reset and animate the number
    scaleAnim.setValue(0);
    pulseAnim.setValue(1);
    glowAnim.setValue(0);
    circleScaleAnim.setValue(0);
    
    // Number entrance with bounce
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 180,
        friction: 12,
        useNativeDriver: true,
      }),
      // Subtle pulse
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Background circle animation
    Animated.sequence([
      Animated.timing(circleScaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(circleScaleAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle glow effect
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showStartAnimation = () => {
    // Visual feedback only (vibration removed for UX simplification)
    
    // Reset animations
    scaleAnim.setValue(0);
    glowAnim.setValue(0);
    
    // Particle burst animation
    particleAnims.forEach((anim, index) => {
      anim.scale.setValue(0);
      anim.opacity.setValue(0);
      anim.rotate.setValue(0);
      
      const delay = index * 50;
      const angle = (index / particleAnims.length) * 360;
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 200,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: angle,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
    
    // START text animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow effect for START
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Exit after START animation
    setTimeout(() => {
      setPhase('exit');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 800);
  };

  if (!visible) return null;

  const getCountdownColor = () => {
    if (phase === 'start') return ModernDesign.colors.accent.mint;
    // Use color based on the displayed number, not the internal count
    const displayCount = currentCount;
    if (displayCount === 1) return ModernDesign.colors.accent.coral;
    if (displayCount === 2) return ModernDesign.colors.accent.gold;
    if (displayCount === 3) return ModernDesign.colors.accent.neon;
    return ModernDesign.colors.accent.mint; // Default to mint for START
  };

  const getCountdownText = () => {
    if (phase === 'start') return 'START!';
    if (currentCount > 0) return currentCount.toString();
    return 'START!';
  };

  const displayText = getCountdownText();
  const displayColor = getCountdownColor();
  const isStartText = displayText === 'START!';

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents="none"
    >
      {/* Background circle effect */}
      <Animated.View
        style={[
          styles.backgroundCircle,
          {
            transform: [{ scale: circleScaleAnim }],
            backgroundColor: `${displayColor}15`,
          },
        ]}
      />

      {/* Particle effects for START */}
      {phase === 'start' && particleAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              opacity: anim.opacity,
              transform: [
                { scale: anim.scale },
                { rotate: anim.rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }) },
              ],
            },
          ]}
        />
      ))}

      {/* Main countdown display */}
      <Animated.View
        style={[
          styles.countdownContainer,
          isStartText && styles.startContainer,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) }
            ],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowEffect,
            isStartText && styles.startGlowEffect,
            {
              opacity: glowAnim,
              backgroundColor: `${displayColor}30`,
            },
          ]}
        />
        
        <Text style={[
          styles.countdownText, 
          isStartText && styles.startText,
          { color: displayColor }
        ]}>
          {displayText}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Much more subtle overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ModernDesign.colors.accent.mint,
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150, // Increased to prevent text wrapping
    height: 120,
    borderRadius: 60,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 170,
    height: 140,
    borderRadius: 70,
    top: -10,
    left: -10,
  },
  countdownText: {
    fontSize: 48, // Smaller, more elegant size
    fontWeight: ModernDesign.typography.fontWeight.black,
    textAlign: 'center',
    lineHeight: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  startText: {
    fontSize: 36, // Smaller font for START to prevent wrapping
    letterSpacing: 2, // Add letter spacing for better appearance
  },
  startContainer: {
    // Keep the same container size for START text
  },
  startGlowEffect: {
    // Keep the same glow effect size for START text
  },
});