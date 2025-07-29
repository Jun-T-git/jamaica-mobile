// Modern Puzzle Game Design System - Inspired by Tetris Effect, Monument Valley, Alto's Odyssey

export const ModernDesign = {
  // Family-Friendly Dark Theme - Warm, Inviting, Accessible
  colors: {
    // Dark backgrounds with warmth and depth
    background: {
      primary: '#1A1B23',      // Warm dark blue-gray
      secondary: '#242530',     // Slightly lighter warm dark
      tertiary: '#2D2E3F',     // Card backgrounds with warmth
      overlay: 'rgba(26, 27, 35, 0.95)',
    },

    // Warm, friendly accent colors that pop on dark
    accent: {
      neon: '#60A5FA',         // Soft bright blue - friendly
      purple: '#C084FC',       // Warm purple
      coral: '#FB923C',        // Gentle orange
      gold: '#FDE047',         // Warm yellow
      mint: '#6EE7B7',         // Soft mint green
    },

    // Warm semantic colors for dark theme
    success: '#6EE7B7',        // Soft mint green
    warning: '#FCD34D',        // Warm golden yellow
    error: '#FCA5A5',          // Soft coral red
    
    // Text hierarchy - High contrast but warm
    text: {
      primary: '#F9FAFB',      // Warm white
      secondary: '#D1D5DB',    // Light warm gray
      tertiary: '#9CA3AF',     // Medium warm gray
      disabled: '#6B7280',     // Darker gray
      inverse: '#1A1B23',      // Dark on light
    },

    // UI elements - Subtle and warm
    border: {
      subtle: 'rgba(209, 213, 219, 0.1)',
      medium: 'rgba(209, 213, 219, 0.15)',
      strong: 'rgba(209, 213, 219, 0.2)',
    },

    // Warm glass morphism effects
    glass: {
      background: 'rgba(45, 46, 63, 0.8)',
      border: 'rgba(96, 165, 250, 0.15)',
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
      light: '300' as const,
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
      black: '900' as const,
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
      shadowColor: '#60A5FA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
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
    // Button System - 統一されたボタンの仕様
    button: {
      // 標準の境界線半径
      borderRadius: 16,
      
      // サイズごとの高さ（既存と新しい定義を統合）
      height: {
        sm: 36,
        small: 40,
        md: 48,
        medium: 56,
        lg: 56,
        large: 64,
        xl: 64,
      },
      
      // フォントサイズ
      fontSize: {
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
      },
      
      // サイズごとのパディング
      padding: {
        small: {
          vertical: 8,
          horizontal: 16,
        },
        medium: {
          vertical: 16,
          horizontal: 24,
        },
        large: {
          vertical: 20,
          horizontal: 32,
        },
      },
      
      // アイコンボタンの統一サイズ
      iconButton: {
        size: 44,
        borderRadius: 22,
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

// Gradient Definitions - Warm Dark Theme with Friendly Colors
export const modernGradients = {
  // Primary brand gradients - warmer and softer
  neonBlue: ['#60A5FA', '#3B82F6'],
  purpleNight: ['#C084FC', '#A855F7'],
  coralSunset: ['#FB923C', '#F97316'],
  goldRush: ['#FDE047', '#FCD34D'],
  mintFresh: ['#6EE7B7', '#34D399'],
  
  // Warm atmospheric gradients
  deepSpace: ['#1A1B23', '#242530'],
  nebula: ['#2D2E3F', '#374151'],
  aurora: ['#60A5FA', '#C084FC', '#FB923C'],
  
  // Game mode specific - warm and inviting
  challenge: ['#FB923C', '#FDE047', '#6EE7B7'],
  infinite: ['#60A5FA', '#C084FC', '#6EE7B7'],
  
  // Dark glass morphism
  glass: ['rgba(45, 46, 63, 0.9)', 'rgba(36, 37, 48, 0.8)'],
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

// Game specific color themes - Bright and Engaging
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