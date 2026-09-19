import { DifficultyLevel } from '../types';

export interface DifficultyConfig {
  numberRange: {
    min: number;
    max: number;
  };
  targetRange: {
    min: number;      // 目標値の下限
    max: number;      // 目標値の上限
  };
  /**
   * 解の数による難易度制御
   * その手札で作れる目標値を「解の数が少ない順」に並べ、
   * minPercentile〜maxPercentile の帯から目標値を選ぶ（解が多いほど易しい）
   */
  solutionBand: {
    minPercentile: number;
    maxPercentile: number;
    minCount: number; // これ未満の解しかない目標値は出題しない
  };
  time: {
    initial: number;  // 初期時間（秒）
    bonus: number;    // 正解ボーナス（秒）
  };
  label: {
    ja: string;       // 日本語表示名
    en: string;       // 英語表示名（将来の拡張用）
  };
  theme: {
    primary: string;  // メインカラー
    secondary: string; // サブカラー
    gradient: string[]; // グラデーション
  };
}

/**
 * 難易度別設定
 * 各難易度の数字範囲、時間設定、UI表示を定義
 */
export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.EASY]: {
    numberRange: { 
      min: 1, 
      max: 4 
    },
    targetRange: { min: 10, max: 30 },
    solutionBand: { minPercentile: 0.5, maxPercentile: 1.0, minCount: 60 },
    time: { 
      initial: 120,  // 2分
      bonus: 20      // +20秒
    },
    label: {
      ja: 'かんたん',
      en: 'Easy'
    },
    theme: {
      primary: '#6EE7B7',      // ModernDesign.colors.accent.mint
      secondary: '#34D399',
      gradient: ['#6EE7B7', '#34D399', '#10B981']
    }
  },
  
  [DifficultyLevel.NORMAL]: {
    numberRange: { 
      min: 1, 
      max: 6 
    },
    targetRange: { min: 11, max: 66 },  // 本家ジャマイカと同じ範囲
    solutionBand: { minPercentile: 0.25, maxPercentile: 0.75, minCount: 20 },
    time: { 
      initial: 90,   // 1分30秒
      bonus: 15      // +15秒
    },
    label: {
      ja: 'ふつう',
      en: 'Normal'
    },
    theme: {
      primary: '#60A5FA',      // ModernDesign.colors.accent.neon
      secondary: '#3B82F6',
      gradient: ['#60A5FA', '#3B82F6', '#2563EB']
    }
  },
  
  [DifficultyLevel.HARD]: {
    numberRange: { 
      min: 1, 
      max: 10 
    },
    targetRange: { min: 20, max: 99 },
    solutionBand: { minPercentile: 0.1, maxPercentile: 0.5, minCount: 8 },
    time: { 
      initial: 90,   // 1分30秒
      bonus: 20      // +20秒
    },
    label: {
      ja: 'むずかしい',
      en: 'Hard'
    },
    theme: {
      primary: '#FB923C',      // ModernDesign.colors.accent.coral
      secondary: '#F97316',
      gradient: ['#FB923C', '#F97316', '#EA580C']
    }
  }
};

/**
 * 指定された難易度の設定を取得
 */
export const getDifficultyConfig = (difficulty: DifficultyLevel): DifficultyConfig => {
  return DIFFICULTY_CONFIG[difficulty];
};

/**
 * デフォルトの難易度
 */
export const DEFAULT_DIFFICULTY = DifficultyLevel.NORMAL;