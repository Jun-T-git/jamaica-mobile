import { SCORE_TIERS } from '../../src/config/scoreTiers';
import { DifficultyLevel } from '../../src/types';
import { getScoreTierProgress } from '../../src/utils/scoreTier';

describe('scoreTier', () => {
  test('基準スコアは難易度ごとに昇順で、ランキングのスコア上限内', () => {
    for (const tiers of Object.values(SCORE_TIERS)) {
      expect(tiers.length).toBeGreaterThan(0);
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].threshold).toBeGreaterThan(tiers[i - 1].threshold);
      }
      expect(tiers[tiers.length - 1].threshold).toBeLessThan(999999);
    }
  });

  test('未到達なら current は null で最初の段位が next', () => {
    const p = getScoreTierProgress(DifficultyLevel.NORMAL, 0);
    expect(p.current).toBeNull();
    expect(p.next?.label).toBe('ブロンズ');
    expect(p.remaining).toBe(SCORE_TIERS.normal[0].threshold);
    expect(p.progress).toBe(0);
  });

  test('途中の段位では次の段位までの残りと進捗を返す', () => {
    const [bronze, silver] = SCORE_TIERS.normal;
    const score = bronze.threshold + (silver.threshold - bronze.threshold) / 2;
    const p = getScoreTierProgress(DifficultyLevel.NORMAL, score);
    expect(p.current?.label).toBe('ブロンズ');
    expect(p.next?.label).toBe('シルバー');
    expect(p.remaining).toBe(silver.threshold - score);
    expect(p.progress).toBeCloseTo(0.5);
  });

  test('最高段位に到達すると next は null で progress は 1', () => {
    const top = SCORE_TIERS.hard[SCORE_TIERS.hard.length - 1];
    const p = getScoreTierProgress(DifficultyLevel.HARD, top.threshold);
    expect(p.current?.label).toBe(top.label);
    expect(p.next).toBeNull();
    expect(p.remaining).toBe(0);
    expect(p.progress).toBe(1);
  });
});
