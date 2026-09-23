/**
 * レビュー依頼を出してよいかの純ロジック（services/reviewService.ts が使う）
 *
 * 方針: 気分が良い瞬間（新記録）にだけ、慣れてきた人（数ゲーム以上）へ、間隔を空けて頼む。
 * 少ないユーザーでも低評価が混ざりにくい条件に絞る
 */
export const REVIEW_POLICY = {
  /** これ以上ゲームを遊んだ人にだけ頼む */
  MIN_GAMES_PLAYED: 3,
  /** 前回の依頼からこの日数は空ける（Apple 側でも年 3 回までに制限される） */
  MIN_INTERVAL_DAYS: 60,
} as const;

export interface ReviewPolicyInput {
  isNewHighScore: boolean;
  gamesPlayed: number;
  /** 前回依頼した時刻（ミリ秒）。未依頼なら null */
  lastPromptedAt: number | null;
  now: number;
}

export const shouldRequestReview = ({
  isNewHighScore,
  gamesPlayed,
  lastPromptedAt,
  now,
}: ReviewPolicyInput): boolean => {
  if (!isNewHighScore) return false;
  if (gamesPlayed < REVIEW_POLICY.MIN_GAMES_PLAYED) return false;
  if (lastPromptedAt !== null) {
    const elapsedDays = (now - lastPromptedAt) / 86400000;
    if (elapsedDays < REVIEW_POLICY.MIN_INTERVAL_DAYS) return false;
  }
  return true;
};
