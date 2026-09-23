import { REVIEW_POLICY, shouldRequestReview } from '../../src/utils/reviewPolicy';

const DAY = 86400000;
const now = Date.UTC(2026, 8, 23);

describe('reviewPolicy', () => {
  test('新記録でなければ頼まない', () => {
    expect(
      shouldRequestReview({ isNewHighScore: false, gamesPlayed: 10, lastPromptedAt: null, now }),
    ).toBe(false);
  });

  test('遊んだ回数が少ないうちは頼まない', () => {
    expect(
      shouldRequestReview({
        isNewHighScore: true,
        gamesPlayed: REVIEW_POLICY.MIN_GAMES_PLAYED - 1,
        lastPromptedAt: null,
        now,
      }),
    ).toBe(false);
    expect(
      shouldRequestReview({
        isNewHighScore: true,
        gamesPlayed: REVIEW_POLICY.MIN_GAMES_PLAYED,
        lastPromptedAt: null,
        now,
      }),
    ).toBe(true);
  });

  test('前回の依頼から間隔が空くまでは頼まない', () => {
    const recent = now - (REVIEW_POLICY.MIN_INTERVAL_DAYS - 1) * DAY;
    const old = now - (REVIEW_POLICY.MIN_INTERVAL_DAYS + 1) * DAY;
    expect(
      shouldRequestReview({ isNewHighScore: true, gamesPlayed: 10, lastPromptedAt: recent, now }),
    ).toBe(false);
    expect(
      shouldRequestReview({ isNewHighScore: true, gamesPlayed: 10, lastPromptedAt: old, now }),
    ).toBe(true);
  });
});
