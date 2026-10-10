import { generateProblem, countSolutions } from '../../src/utils/problemGenerator';
import { DIFFICULTY_CONFIG } from '../../src/config/difficulty';
import { DifficultyLevel } from '../../src/types';

// 再現可能な乱数（テストを安定させる）
const createRng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/**
 * 独立ソルバ: 5つの数字から目標値に到達できるかを総当たりで検証する。
 * generateProblem の「解の保証」不変条件（PHILOSOPHY.md #1 / GAME-CORE.md §2）を、
 * 生成器自身の countSolutions に頼らずに確認するためのもの。
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
  describe('countSolutions', () => {
    it('作れる値と解の数を数え上げる', () => {
      const counts = countSolutions([4, 4, 3, 2, 1]);

      // 4 × 4 + 3 + 2 − 1 = 20
      expect(counts.get(20)).toBeGreaterThan(0);
      // 全部足した値も作れる
      expect(counts.get(14)).toBeGreaterThan(0);
    });

    it('0や負の数、小数は数えない', () => {
      const counts = countSolutions([1, 1, 2, 2, 3]);

      for (const value of counts.keys()) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
    });
  });

  describe('generateProblem', () => {
    const difficulties = Object.values(DifficultyLevel);

    it.each(difficulties)('%s: 数字と目標値が難易度の範囲内に収まる', difficulty => {
      const config = DIFFICULTY_CONFIG[difficulty];
      const rng = createRng(1);

      for (let i = 0; i < 200; i++) {
        const problem = generateProblem(difficulty, rng);

        expect(problem.numbers).toHaveLength(5);
        problem.numbers.forEach(num => {
          expect(num).toBeGreaterThanOrEqual(config.numberRange.min);
          expect(num).toBeLessThanOrEqual(config.numberRange.max);
        });
        expect(problem.target).toBeGreaterThanOrEqual(config.targetRange.min);
        expect(problem.target).toBeLessThanOrEqual(config.targetRange.max);
      }
    });

    it.each(difficulties)('%s: 必ず解ける問題だけを出題する', difficulty => {
      const rng = createRng(2);

      for (let i = 0; i < 200; i++) {
        const problem = generateProblem(difficulty, rng);
        const solutions = countSolutions(problem.numbers).get(problem.target) || 0;

        expect(solutions).toBeGreaterThan(0);
        expect(problem.solutionCount).toBe(solutions);
      }
    });

    it.each(difficulties)('%s: 独立ソルバでも解ける（解の保証）', difficulty => {
      const rng = createRng(6);

      for (let i = 0; i < 50; i++) {
        const problem = generateProblem(difficulty, rng);

        expect(isSolvable(problem.numbers, problem.target)).toBe(true);
      }
    });

    it.each(difficulties)('%s: 全部足すだけで解ける問題は出題しない', difficulty => {
      const rng = createRng(3);

      for (let i = 0; i < 200; i++) {
        const problem = generateProblem(difficulty, rng);
        const sum = problem.numbers.reduce((total, num) => total + num, 0);

        expect(problem.target).not.toBe(sum);
      }
    });

    it('難易度が上がるほど解の数が少ない問題になる', () => {
      const medianSolutionCount = (difficulty: DifficultyLevel) => {
        const rng = createRng(4);
        const counts = Array.from({ length: 300 }, () =>
          generateProblem(difficulty, rng).solutionCount || 0,
        ).sort((a, b) => a - b);
        return counts[Math.floor(counts.length / 2)];
      };

      const easy = medianSolutionCount(DifficultyLevel.EASY);
      const normal = medianSolutionCount(DifficultyLevel.NORMAL);
      const hard = medianSolutionCount(DifficultyLevel.HARD);

      expect(easy).toBeGreaterThan(normal);
      expect(normal).toBeGreaterThan(hard);
    });

    it('同じ乱数列からは同じ問題が生成される', () => {
      const first = generateProblem(DifficultyLevel.NORMAL, createRng(5));
      const second = generateProblem(DifficultyLevel.NORMAL, createRng(5));

      expect(second).toEqual(first);
    });
  });
});
