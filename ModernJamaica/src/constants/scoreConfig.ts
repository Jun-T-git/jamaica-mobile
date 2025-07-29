/**
 * チャレンジモード スコア計算設定
 * 後から簡単に調整できるように定数として分離
 */

export const SCORE_CONFIG = {
  // 基本スコア設定
  BASE_SCORE_MULTIPLIER: 100,      // 数字の合計 × この値
  
  // 時間ボーナス設定
  TIME_BONUS_BASE: 30,             // 基準時間（秒）
  TIME_MULTIPLIER_MIN: 1.0,        // 最小倍率
  TIME_MULTIPLIER_MAX: 3.0,        // 最大倍率
  
  // 難易度ボーナス設定
  DIFFICULTY_THRESHOLD: 20,        // 難易度計算の基準値
  DIFFICULTY_MULTIPLIER: 10,       // 難易度ボーナス倍率
  
  // 連続正解コンボ設定
  COMBO_TIME_LIMIT: 15000,         // コンボ継続制限時間（ミリ秒）
  COMBO_MIN_COUNT: 3,              // コンボボーナス開始回数
  COMBO_BONUS_RATE: 0.2,           // コンボボーナス倍率
  
  // 最終ボーナス設定（リザルト画面）
  ACHIEVEMENT_BONUSES: {
    LEVEL_1: { threshold: 5, bonus: 1000 },
    LEVEL_2: { threshold: 7, bonus: 2000 },
    LEVEL_3: { threshold: 10, bonus: 5000 },
  },
  
  // 総合評価ボーナス設定
  EXCELLENCE_THRESHOLD: 20000,     // 高スコアボーナス開始点
  EXCELLENCE_RATE: 0.1,            // 高スコアボーナス倍率
} as const;

export interface ProblemResult {
  numbers: number[];               // 使用した5つの数字
  target: number;                 // 目標数値
  solveTime: number;              // 解答時間（秒）
  isCorrect: boolean;             // 正解フラグ
  timestamp: number;              // 正解時刻
}