import { ModernDesign } from './modernDesignSystem';

/** ゲーム盤面と復習画面で共通の、通常状態の計算ノード。 */
export const treeNodeVisuals = {
  frame: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  fill: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderColor: ModernDesign.colors.border.subtle,
  },
  text: {
    textAlign: 'center' as const,
    fontSize: ModernDesign.typography.fontSize.xl,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
  },
};

export const treeOperatorColor = (operator?: string): string => {
  switch (operator) {
    case '+':
    case '＋': return ModernDesign.colors.accent.mint;
    case '-':
    case '−': return ModernDesign.colors.accent.coral;
    case '×': return ModernDesign.colors.accent.gold;
    case '÷': return ModernDesign.colors.accent.purple;
    default: return ModernDesign.colors.border.medium;
  }
};
