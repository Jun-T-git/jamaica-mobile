import { DifficultyLevel } from '../types';

/**
 * チャレンジモードの「基準スコア」（難易度別・固定）
 *
 * 他のプレイヤーの人数に依存せず、自分のスコアがどの程度かの目安を示すためのライン。
 * 値はスコア計算式（utils/scoreCalculator.ts, utils/timeBonus.ts）で 1 ゲームを
 * シミュレーションした中央値から決めている（平均解答時間の目安は各行のコメント）。
 * スコア計算式や時間設定を変えたら、この値も見直すこと。
 */
export interface ScoreTier {
  /** 段位名（UI 表示） */
  label: string;
  /** このスコア以上で到達 */
  threshold: number;
}

export const SCORE_TIERS: Record<DifficultyLevel, readonly ScoreTier[]> = {
  [DifficultyLevel.EASY]: [
    { label: 'ブロンズ', threshold: 10000 }, // 1問 約25秒・5問前後
    { label: 'シルバー', threshold: 35000 }, // 1問 約15秒・10問前後
    { label: 'ゴールド', threshold: 80000 }, // 1問 約10秒・15問前後
  ],
  [DifficultyLevel.NORMAL]: [
    { label: 'ブロンズ', threshold: 12000 }, // 1問 約25秒・5問前後
    { label: 'シルバー', threshold: 45000 }, // 1問 約15秒・10問前後
    { label: 'ゴールド', threshold: 120000 }, // 1問 約10秒・15問前後
  ],
  [DifficultyLevel.HARD]: [
    { label: 'ブロンズ', threshold: 10000 }, // 1問 約30秒・3問前後
    { label: 'シルバー', threshold: 35000 }, // 1問 約20秒・6問前後
    { label: 'ゴールド', threshold: 75000 }, // 1問 約14秒・10問前後
  ],
};
