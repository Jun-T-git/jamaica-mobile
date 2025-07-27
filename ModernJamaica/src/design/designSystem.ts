// Professional Design System for Modern Jamaica

export const DesignSystem = {
  // Primary Color Palette - Modern, sophisticated gradient scheme
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#F0F9FF',
      100: '#E0F2FE', 
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9', // Main brand color
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
    },
    
    // Secondary Accent Colors  
    secondary: {
      50: '#FEF7FF',
      100: '#FCEAFF',
      200: '#F8D4FF',
      300: '#F3B4FF',
      400: '#EC84FF',
      500: '#E254FF', // Vibrant purple
      600: '#C831E6',
      700: '#A71BC7',
      800: '#8B1BA3',
      900: '#721C7E',
    },

    // Success & Error States
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E', // Main success
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },

    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444', // Main error
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },

    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Main warning
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },

    // Neutral Gray Scale
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // Special UI Colors
    background: {
      primary: '#FFFFFF',
      secondary: '#FAFBFC',
      tertiary: '#F7F9FB',
    },

    surface: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      elevated: '#FFFFFF',
    },

    text: {
      primary: '#1F2937',
      secondary: '#6B7280', 
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },

    border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
      strong: '#9CA3AF',
    },
  },

  // Typography System
  typography: {
    fontFamily: {
      primary: 'System', // iOS: SF Pro, Android: Roboto
      mono: 'Menlo',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
    
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },

  // Spacing System (8px base grid)
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
  },

  // Border Radius System
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  // Shadow System
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 15,
    },
  },

  // Animation Timing
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  // Component Specific Tokens
  components: {
    button: {
      height: {
        sm: 32,
        md: 44,
        lg: 56,
      },
      padding: {
        sm: { horizontal: 12, vertical: 8 },
        md: { horizontal: 20, vertical: 12 },
        lg: { horizontal: 24, vertical: 16 },
      },
    },
    
    card: {
      padding: 20,
      borderRadius: 16,
    },
    
    modal: {
      borderRadius: 24,
      padding: 24,
    },
  },
};

// Gradient Definitions
export const gradients = {
  primary: ['#0EA5E9', '#0284C7'],
  secondary: ['#E254FF', '#C831E6'],
  success: ['#22C55E', '#16A34A'],
  sunset: ['#F59E0B', '#EF4444'],
  ocean: ['#0EA5E9', '#06B6D4'],
  purple: ['#8B5CF6', '#A855F7'],
  warm: ['#F59E0B', '#F97316'],
};

// Helper functions
export const createGradient = (colors: string[], direction = '45deg') => ({
  background: `linear-gradient(${direction}, ${colors.join(', ')})`,
});

export const getColor = (path: string, colors = DesignSystem.colors): string => {
  return path.split('.').reduce((obj, key) => obj[key], colors as any) || '#000000';
};

export const getSpacing = (size: keyof typeof DesignSystem.spacing): number => {
  return DesignSystem.spacing[size];
};

export const getShadow = (size: keyof typeof DesignSystem.shadows) => {
  return DesignSystem.shadows[size];
};