// Modern Puzzle Game Design System - Inspired by Tetris Effect, Monument Valley, Alto's Odyssey

export const ModernDesign = {
  // Sophisticated Color Palette - Deep, Rich, Atmospheric
  colors: {
    // Dark mode first approach - sophisticated and modern
    background: {
      primary: '#0A0E1A',      // Deep space blue
      secondary: '#131824',     // Slightly lighter dark
      tertiary: '#1C2332',     // Card backgrounds
      overlay: 'rgba(10, 14, 26, 0.95)',
    },

    // Accent colors - Vibrant but sophisticated
    accent: {
      neon: '#00F5FF',         // Electric cyan - main brand
      purple: '#8B5FBF',       // Deep purple
      coral: '#FF6B6B',        // Warm coral
      gold: '#FFD93D',         // Bright gold
      mint: '#6BCF7F',         // Fresh mint
    },

    // Semantic colors with personality
    success: '#4ECDC4',        // Teal success
    warning: '#FFB946',        // Warm orange
    error: '#FF6B6B',          // Soft red
    
    // Text hierarchy - High contrast for readability
    text: {
      primary: '#FFFFFF',      // Pure white
      secondary: '#B8C5D6',    // Light blue-gray
      tertiary: '#7A8BA0',     // Medium blue-gray
      disabled: '#4A5568',     // Dark gray
      inverse: '#0A0E1A',      // Dark on light
    },

    // UI elements
    border: {
      subtle: 'rgba(184, 197, 214, 0.1)',
      medium: 'rgba(184, 197, 214, 0.2)',
      strong: 'rgba(184, 197, 214, 0.3)',
    },

    // Glass morphism effects
    glass: {
      background: 'rgba(28, 35, 50, 0.8)',
      border: 'rgba(255, 255, 255, 0.1)',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  },

  // Sophisticated Typography
  typography: {
    fontFamily: {
      primary: 'SF Pro Display', // iOS
      primaryAndroid: 'Roboto',  // Android fallback
      mono: 'SF Mono',
    },
    
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      '2xl': 22,
      '3xl': 28,
      '4xl': 34,
      '5xl': 42,
      '6xl': 52,
      '7xl': 68,
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
      black: '900',
    },
    
    lineHeight: {
      tight: 1.1,
      snug: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
    
    letterSpacing: {
      tighter: -1.0,
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1.0,
      widest: 2.0,
    },
  },

  // Refined Spacing System
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
    40: 160,
    48: 192,
    56: 224,
    64: 256,
  },

  // Modern Border Radius
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    full: 9999,
  },

  // Sophisticated Shadow System
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
      elevation: 12,
    },
    glow: {
      shadowColor: '#00F5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 0,
    },
  },

  // Animation System
  animation: {
    duration: {
      instant: 0,
      fast: 150,
      normal: 250,
      slow: 400,
      slower: 600,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Component Specifications
  components: {
    button: {
      height: {
        sm: 36,
        md: 48,
        lg: 56,
        xl: 64,
      },
      borderRadius: 16,
      fontSize: {
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
      },
    },
    
    card: {
      padding: 24,
      borderRadius: 20,
      backdropBlur: 10,
    },
    
    gameNode: {
      size: {
        sm: 44,
        md: 56,
        lg: 72,
        xl: 88,
      },
      borderRadius: 16,
      fontSize: {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 28,
      },
    },
  },
};

// Gradient Definitions - Modern and Sophisticated
export const modernGradients = {
  // Primary brand gradients
  neonBlue: ['#00F5FF', '#0099CC'],
  purpleNight: ['#8B5FBF', '#5A4FCF'],
  coralSunset: ['#FF6B6B', '#FF8E53'],
  goldRush: ['#FFD93D', '#FF9A56'],
  mintFresh: ['#6BCF7F', '#4ECDC4'],
  
  // Atmospheric gradients
  deepSpace: ['#0A0E1A', '#131824'],
  nebula: ['#1C2332', '#2D3748'],
  aurora: ['#00F5FF', '#8B5FBF', '#FF6B6B'],
  
  // Game mode specific
  challenge: ['#FF6B6B', '#FF8E53', '#FFB946'],
  infinite: ['#00F5FF', '#8B5FBF', '#4ECDC4'],
  
  // Glass morphism
  glass: ['rgba(28, 35, 50, 0.8)', 'rgba(45, 55, 72, 0.6)'],
};

// Modern Utility Functions
export const createModernGradient = (colors: string[], direction = '135deg') => ({
  background: `linear-gradient(${direction}, ${colors.join(', ')})`,
});

export const getModernColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = ModernDesign.colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return '#FFFFFF';
  }
  
  return value;
};

export const getModernSpacing = (size: keyof typeof ModernDesign.spacing): number => {
  return ModernDesign.spacing[size];
};

export const getModernShadow = (size: keyof typeof ModernDesign.shadows) => {
  return ModernDesign.shadows[size];
};

// Game specific color themes
export const gameThemes = {
  mathematical: {
    primary: ModernDesign.colors.accent.neon,
    secondary: ModernDesign.colors.accent.purple,
    success: ModernDesign.colors.success,
    background: ModernDesign.colors.background.primary,
  },
  
  challenge: {
    primary: ModernDesign.colors.accent.coral,
    secondary: ModernDesign.colors.accent.gold,
    gradient: modernGradients.challenge,
    glow: ModernDesign.colors.accent.coral,
  },
  
  infinite: {
    primary: ModernDesign.colors.accent.neon,
    secondary: ModernDesign.colors.accent.mint,
    gradient: modernGradients.infinite,
    glow: ModernDesign.colors.accent.neon,
  },
};