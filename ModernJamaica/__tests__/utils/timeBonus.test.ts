import { calculateTimeBonus } from '../../src/utils/timeBonus';
import { DIFFICULTY_CONFIG, DifficultyConfig } from '../../src/config/difficulty';
import { DifficultyLevel } from '../../src/types';

const time: DifficultyConfig['time'] = {
  initial: 90,
  bonus: 13,
  bonusDecayStep: 2,
  bonusMin: 1.5,
};

describe('timeBonus', () => {
  describe('calculateTimeBonus', () => {
    it('最初は設定どおりのボーナス', () => {
      expect(calculateTimeBonus(time, 0)).toBe(13);
    });

    it('正解のたびに減る', () => {
      expect(calculateTimeBonus(time, 1)).toBe(11);
      expect(calculateTimeBonus(time, 5)).toBe(3);
    });

    it('下限で下げ止まる', () => {
      expect(calculateTimeBonus(time, 6)).toBe(1.5);
      expect(calculateTimeBonus(time, 1000)).toBe(1.5);
    });
  });

  describe('難易度設定', () => {
    // 上級者でも 1 ゲームが約 3 分で終わることの保証。
    // 各難易度で上級者の速さで解き続けるプレイヤーをシミュレートする
    const EXPERT_SOLVE_TIME: Record<DifficultyLevel, number> = {
      [DifficultyLevel.EASY]: 5,
      [DifficultyLevel.NORMAL]: 6,
      [DifficultyLevel.HARD]: 10,
    };
    // ゲーム内の秒数（正解演出中はタイマーが止まるので、実時間はこれより少し長い）
    const MAX_SESSION_SECONDS = 3.5 * 60;
    // 5 つの数字を 4 回結合するには 12 タップ必要。これより速くは解けない
    const PHYSICAL_LIMIT_SOLVE_TIME = 3;

    it.each(Object.values(DifficultyLevel))('%s: 上級者でも約3分で終わる', (difficulty) => {
      const config = DIFFICULTY_CONFIG[difficulty].time;
      const solveTime = EXPERT_SOLVE_TIME[difficulty];
      let timeLeft = config.initial;
      let elapsed = 0;
      let correctCount = 0;

      while (timeLeft >= solveTime && elapsed <= MAX_SESSION_SECONDS) {
        elapsed += solveTime;
        timeLeft = timeLeft - solveTime + calculateTimeBonus(config, correctCount);
        correctCount++;
      }

      expect(elapsed + timeLeft).toBeLessThanOrEqual(MAX_SESSION_SECONDS);
    });

    it.each(Object.values(DifficultyLevel))('%s: 下限は人が解ける速さより十分短い（必ず終わる）', (difficulty) => {
      const config = DIFFICULTY_CONFIG[difficulty].time;

      expect(config.bonusDecayStep).toBeGreaterThan(0);
      expect(config.bonusMin).toBeLessThanOrEqual(PHYSICAL_LIMIT_SOLVE_TIME / 2);
    });
  });
});
