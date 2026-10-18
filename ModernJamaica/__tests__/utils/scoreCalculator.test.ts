import {
  calculateScoreBreakdown,
  calculateProblemScore,
  calculateFinalBonus,
} from '../../src/utils/scoreCalculator';
import { SCORE_CONFIG, ProblemResult } from '../../src/constants/scoreConfig';

const createResult = (overrides: Partial<ProblemResult> = {}): ProblemResult => ({
  numbers: [1, 2, 3, 4, 5],
  target: 20,
  solveTime: 30,
  isCorrect: true,
  timestamp: 0,
  ...overrides,
});

describe('scoreCalculator', () => {
  describe('calculateScoreBreakdown', () => {
    it('基本スコアは数字の合計 × 倍率', () => {
      const breakdown = calculateScoreBreakdown(createResult(), 1);

      expect(breakdown).toEqual({ base: 1500, time: 0, target: 0, combo: 0 });
    });

    it('速く解くほど時間ボーナスが増え、最大3倍で頭打ちになる', () => {
      const fast = calculateScoreBreakdown(createResult({ solveTime: 15 }), 1);
      const fastest = calculateScoreBreakdown(createResult({ solveTime: 1 }), 1);

      expect(fast.time).toBe(1500);
      expect(fastest.time).toBe(3000);
    });

    it('目標値ボーナスには上限がある', () => {
      const normal = calculateScoreBreakdown(createResult({ target: 66 }), 1);
      const huge = calculateScoreBreakdown(createResult({ target: 64800 }), 1);

      expect(normal.target).toBe(460);
      expect(huge.target).toBe(SCORE_CONFIG.DIFFICULTY_BONUS_MAX);
    });

    it('コンボボーナスは3連続正解から付く', () => {
      expect(calculateScoreBreakdown(createResult(), 2).combo).toBe(0);
      expect(calculateScoreBreakdown(createResult(), 3).combo).toBe(300);
      expect(calculateScoreBreakdown(createResult(), 4).combo).toBe(600);
    });

    it('コンボボーナスには上限がある', () => {
      const capped = 1500 * SCORE_CONFIG.COMBO_BONUS_MAX_RATE;

      expect(calculateScoreBreakdown(createResult(), 12).combo).toBe(capped);
      expect(calculateScoreBreakdown(createResult(), 100).combo).toBe(capped);
    });

    it('不正解は0点', () => {
      expect(calculateProblemScore(createResult({ isCorrect: false }), 5)).toBe(0);
    });

    it('獲得スコアは内訳の合計と一致する', () => {
      const result = createResult({ solveTime: 12, target: 45 });
      const { base, time, target, combo } = calculateScoreBreakdown(result, 4);

      expect(calculateProblemScore(result, 4)).toBe(base + time + target + combo);
    });
  });

  describe('calculateFinalBonus', () => {
    it('正解数に応じた達成ボーナスが付く', () => {
      expect(calculateFinalBonus(1000, 4)).toBe(0);
      expect(calculateFinalBonus(1000, 5)).toBe(1000);
      expect(calculateFinalBonus(1000, 7)).toBe(2000);
      expect(calculateFinalBonus(1000, 10)).toBe(5000);
    });

    it('高スコア時は総合評価ボーナスが加算される', () => {
      expect(calculateFinalBonus(20000, 0)).toBe(2000);
    });
  });
});
