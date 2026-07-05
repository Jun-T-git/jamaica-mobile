import { generateProblem } from '../../src/utils/problemGenerator';
import { getDifficultyConfig } from '../../src/config/difficulty';
import { DifficultyLevel } from '../../src/types';

/**
 * 独立ソルバ: 5つの数字から目標値に到達できるかを総当たりで検証する。
 * generateProblem の「解の保証」不変条件（PHILOSOPHY.md #1 / GAME-CORE.md §2）を確認するためのもの。
 * 生成器の applyOperator セマンティクス（減算は絶対値、除算は割り切れる時のみ）の上位集合を試す。
 */
function isSolvable(numbers: number[], target: number): boolean {
  const EPSILON = 0.001;

  function reachable(nums: number[]): boolean {
    if (nums.length === 1) {
      return Math.abs(nums[0] - target) < EPSILON;
    }
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const a = nums[i];
        const b = nums[j];
        const rest = nums.filter((_, k) => k !== i && k !== j);

        const results: number[] = [a + b, Math.abs(a - b), a * b];
        if (b !== 0 && a % b === 0) results.push(a / b);
        if (a !== 0 && b % a === 0) results.push(b / a);

        for (const r of results) {
          if (reachable([r, ...rest])) return true;
        }
      }
    }
    return false;
  }

  return reachable(numbers);
}

describe('problemGenerator', () => {
  const difficulties = [
    DifficultyLevel.EASY,
    DifficultyLevel.NORMAL,
    DifficultyLevel.HARD,
  ];

  describe.each(difficulties)('generateProblem(%s)', (difficulty) => {
    it('5つの数字を生成する', () => {
      const problem = generateProblem(difficulty);
      expect(problem.numbers).toHaveLength(5);
    });

    it('生成される数字が難易度の範囲内である', () => {
      const { min, max } = getDifficultyConfig(difficulty).numberRange;
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(difficulty);
        problem.numbers.forEach((num) => {
          expect(num).toBeGreaterThanOrEqual(min);
          expect(num).toBeLessThanOrEqual(max);
        });
      }
    });

    it('目標値は有限な非負の数である', () => {
      const problem = generateProblem(difficulty);
      expect(Number.isFinite(problem.target)).toBe(true);
      expect(problem.target).toBeGreaterThanOrEqual(0);
    });

    it('5つの数字すべてで目標値に到達できる（解の保証・不変条件）', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(difficulty);
        expect(isSolvable(problem.numbers, problem.target)).toBe(true);
      }
    });

    it('difficulty フィールドが設定される', () => {
      const problem = generateProblem(difficulty);
      expect(problem.difficulty).toBe(difficulty);
    });
  });

  it('複数回実行すると異なる目標値が生成される', () => {
    const targets = new Set<number>();
    for (let i = 0; i < 20; i++) {
      targets.add(generateProblem(DifficultyLevel.NORMAL).target);
    }
    expect(targets.size).toBeGreaterThan(1);
  });
});
