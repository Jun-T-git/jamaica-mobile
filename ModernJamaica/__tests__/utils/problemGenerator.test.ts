import { generateProblemExhaustive } from '../../src/utils/problemGenerator';
import { GAME_CONFIG } from '../../src/constants';

describe('problemGenerator', () => {

  describe('generateProblemExhaustive', () => {
    it('有効な問題を生成する', () => {
      const problem = generateProblemExhaustive();
      
      expect(problem.numbers).toHaveLength(GAME_CONFIG.NUMBERS.COUNT);
      expect(problem.target).toBeGreaterThan(0);
      expect(problem.solutions?.length).toBeGreaterThan(0);
    });

    it('生成される数字が範囲内である', () => {
      const problem = generateProblemExhaustive();
      problem.numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(GAME_CONFIG.NUMBERS.MIN);
        expect(num).toBeLessThanOrEqual(GAME_CONFIG.NUMBERS.MAX);
      });
    });

    it('複数回実行しても異なる問題が生成される', () => {
      const problems = [];
      for (let i = 0; i < 10; i++) {
        problems.push(generateProblemExhaustive());
      }
      
      // すべての問題が同じではないことを確認
      const uniqueTargets = new Set(problems.map(p => p.target));
      expect(uniqueTargets.size).toBeGreaterThan(1);
    });
  });
});