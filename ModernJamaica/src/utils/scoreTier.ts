import { SCORE_TIERS, ScoreTier } from '../config/scoreTiers';
import { DifficultyLevel } from '../types';

export interface ScoreTierProgress {
  /** 到達している最高の段位（未到達なら null） */
  current: ScoreTier | null;
  /** 次に目指す段位（最高段位に到達済みなら null） */
  next: ScoreTier | null;
  /** 次の段位までの残り点（到達済みなら 0） */
  remaining: number;
  /** 現在の段位から次の段位までの進み具合 0〜1（到達済みなら 1） */
  progress: number;
}

/**
 * スコアが基準スコア（config/scoreTiers.ts）のどこにいるかを求める
 */
export const getScoreTierProgress = (
  difficulty: DifficultyLevel,
  score: number,
): ScoreTierProgress => {
  const tiers = SCORE_TIERS[difficulty];
  let current: ScoreTier | null = null;
  let next: ScoreTier | null = null;

  for (const tier of tiers) {
    if (score >= tier.threshold) {
      current = tier;
    } else {
      next = tier;
      break;
    }
  }

  if (!next) {
    return { current, next: null, remaining: 0, progress: 1 };
  }

  const floor = current?.threshold ?? 0;
  const span = next.threshold - floor;
  const progress = span > 0 ? Math.min(1, Math.max(0, (score - floor) / span)) : 1;

  return { current, next, remaining: next.threshold - score, progress };
};
