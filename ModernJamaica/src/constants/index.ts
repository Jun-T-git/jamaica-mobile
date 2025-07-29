import { ModernDesign, gameThemes } from '../design/modernDesignSystem';

export const GAME_CONFIG = {
  CHALLENGE_MODE: {
    INITIAL_TIME: 60, // seconds
    BONUS_TIME: 10, // seconds added per correct answer
    SKIP_LIMIT: 2, // number of skips allowed
    WARNING_TIME: 10, // seconds before warning
  },
  INFINITE_MODE: {
    INITIAL_TIME: 300, // 5 minutes (300 seconds)
    WARNING_TIME: 30, // seconds before warning
  },
  NUMBERS: {
    MIN: 1,
    MAX: 6,
    COUNT: 5,
  },
  TARGET: {
    MIN: 10,
    MAX: 60,
  },
};

// Modern Sophisticated Color System
export const COLORS = {
  // Core colors
  PRIMARY: ModernDesign.colors.accent.neon,
  SECONDARY: ModernDesign.colors.accent.purple,
  SUCCESS: ModernDesign.colors.success,
  DANGER: ModernDesign.colors.error,
  WARNING: ModernDesign.colors.warning,
  
  // Background layers
  BACKGROUND: ModernDesign.colors.background.primary,
  SURFACE: ModernDesign.colors.background.secondary,
  CARD: ModernDesign.colors.background.tertiary,
  
  // Text hierarchy
  TEXT: {
    PRIMARY: ModernDesign.colors.text.primary,
    SECONDARY: ModernDesign.colors.text.secondary,
    LIGHT: ModernDesign.colors.text.tertiary,
    INVERSE: ModernDesign.colors.text.inverse,
    DISABLED: ModernDesign.colors.text.disabled,
  },
  
  // Borders and dividers
  BORDER: {
    LIGHT: ModernDesign.colors.border.subtle,
    MEDIUM: ModernDesign.colors.border.medium,
    STRONG: ModernDesign.colors.border.strong,
  },
  
  // Glass morphism
  GLASS: {
    BACKGROUND: ModernDesign.colors.glass.background,
    BORDER: ModernDesign.colors.glass.border,
    SHADOW: ModernDesign.colors.glass.shadow,
  },
  
  // Game mode themes
  CHALLENGE_MODE: {
    PRIMARY: gameThemes.challenge.primary,
    SECONDARY: gameThemes.challenge.secondary,
    GRADIENT: gameThemes.challenge.gradient,
    GLOW: gameThemes.challenge.glow,
  },
  
  INFINITE_MODE: {
    PRIMARY: gameThemes.infinite.primary,
    SECONDARY: gameThemes.infinite.secondary,
    GRADIENT: gameThemes.infinite.gradient,
    GLOW: gameThemes.infinite.glow,
  },
};

// Export modern design system
export { ModernDesign };

