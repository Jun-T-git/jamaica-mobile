import { SCORE_CONFIG, ProblemResult, ScoreBreakdown } from '../constants/scoreConfig';

/**
 * 連続正解コンボ管理クラス
 */
export class ComboTracker {
  private lastCorrectTime: number = 0;
  private consecutiveCount: number = 0;
  
  /**
   * 正解時のコンボ更新
   * @param timestamp 正解時刻（ミリ秒）
   * @returns 現在のコンボ数
   */
  onCorrectAnswer(timestamp: number): number {
    const timeDiff = timestamp - this.lastCorrectTime;
    
    if (this.lastCorrectTime === 0 || timeDiff <= SCORE_CONFIG.COMBO_TIME_LIMIT) {
      this.consecutiveCount++;
    } else {
      this.consecutiveCount = 1; // コンボリセット
    }
    
    this.lastCorrectTime = timestamp;
    return this.consecutiveCount;
  }
  
  /**
   * コンボリセット
   */
  reset(): void {
    this.consecutiveCount = 0;
    this.lastCorrectTime = 0;
  }
  
  /**
   * 現在のコンボ数取得
   */
  getCurrentCombo(): number {
    return this.consecutiveCount;
  }
}

/**
 * 問題ごとのスコア内訳を計算
 * @param result 問題結果
 * @param consecutiveCount 連続正解数
 */
export const calculateScoreBreakdown = (result: ProblemResult, consecutiveCount: number): ScoreBreakdown => {
  if (!result.isCorrect) return { base: 0, time: 0, target: 0, combo: 0 };
  
  // 1. 基本スコア（使用した数字の合計 × 倍率）
  const numberSum = result.numbers.reduce((sum, num) => sum + num, 0);
  const base = numberSum * SCORE_CONFIG.BASE_SCORE_MULTIPLIER;
  
  // 2. 時間ボーナス（速いほど高得点、最大3倍）
  const timeMultiplier = Math.max(
    SCORE_CONFIG.TIME_MULTIPLIER_MIN, 
    Math.min(SCORE_CONFIG.TIME_MULTIPLIER_MAX, SCORE_CONFIG.TIME_BONUS_BASE / Math.max(result.solveTime, 0.001))
  );
  const time = Math.round(base * (timeMultiplier - 1));
  
  // 3. 目標値ボーナス（目標数値が大きいほど高得点、上限あり）
  const target = Math.min(
    SCORE_CONFIG.DIFFICULTY_BONUS_MAX,
    Math.max(0, (result.target - SCORE_CONFIG.DIFFICULTY_THRESHOLD) * SCORE_CONFIG.DIFFICULTY_MULTIPLIER)
  );
  
  // 4. 連続正解ボーナス
  const comboRate = Math.min(
    SCORE_CONFIG.COMBO_BONUS_MAX_RATE,
    (consecutiveCount - SCORE_CONFIG.COMBO_MIN_COUNT + 1) * SCORE_CONFIG.COMBO_BONUS_RATE
  );
  const combo = consecutiveCount >= SCORE_CONFIG.COMBO_MIN_COUNT ? Math.round(base * comboRate) : 0;
  
  return { base, time, target, combo };
};

/**
 * 問題ごとのリアルタイムスコア計算
 * @param result 問題結果
 * @param consecutiveCount 連続正解数
 * @returns 獲得スコア
 */
export const calculateProblemScore = (result: ProblemResult, consecutiveCount: number): number => {
  const { base, time, target, combo } = calculateScoreBreakdown(result, consecutiveCount);
  return Math.round(base + time + target + combo);
};

/**
 * リザルト画面での最終ボーナス計算
 * @param totalScore 現在の総スコア
 * @param correctAnswers 正解数（スキップした問題は含めない）
 * @returns 最終ボーナス
 */
export const calculateFinalBonus = (totalScore: number, correctAnswers: number): number => {
  // 達成ボーナス
  let achievementBonus = 0;
  const bonuses = Object.values(SCORE_CONFIG.ACHIEVEMENT_BONUSES).reverse(); // 高い順にチェック
  
  for (const bonus of bonuses) {
    if (correctAnswers >= bonus.threshold) {
      achievementBonus = bonus.bonus;
      break;
    }
  }
  
  // 総合評価ボーナス（高スコア達成時）
  const excellenceBonus = totalScore >= SCORE_CONFIG.EXCELLENCE_THRESHOLD ? 
    Math.round(totalScore * SCORE_CONFIG.EXCELLENCE_RATE) : 0;
  
  return Math.round(achievementBonus + excellenceBonus);
};
