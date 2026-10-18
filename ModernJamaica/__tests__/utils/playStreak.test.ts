import {
  advanceStreak,
  diffDays,
  getDisplayStreak,
  toLocalDateKey,
} from '../../src/utils/playStreak';

describe('playStreak', () => {
  test('toLocalDateKey はローカル日付を YYYY-MM-DD にする', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toLocalDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  test('diffDays は日付キーの差を日数で返す（月またぎ・年またぎ）', () => {
    expect(diffDays('2026-01-31', '2026-02-01')).toBe(1);
    expect(diffDays('2025-12-31', '2026-01-01')).toBe(1);
    expect(diffDays('2026-03-01', '2026-03-01')).toBe(0);
    expect(diffDays('2026-03-01', '2026-03-10')).toBe(9);
  });

  test('初めて遊んだ日は 1 日目', () => {
    expect(advanceStreak({ streakDays: 0, lastPlayDate: null }, '2026-09-23')).toEqual({
      streakDays: 1,
      lastPlayDate: '2026-09-23',
    });
  });

  test('同じ日に何度遊んでも増えない', () => {
    const state = { streakDays: 3, lastPlayDate: '2026-09-23' };
    expect(advanceStreak(state, '2026-09-23')).toBe(state);
  });

  test('翌日に遊ぶと +1、間が空くと 1 に戻る', () => {
    expect(advanceStreak({ streakDays: 3, lastPlayDate: '2026-09-22' }, '2026-09-23').streakDays).toBe(4);
    expect(advanceStreak({ streakDays: 3, lastPlayDate: '2026-09-20' }, '2026-09-23').streakDays).toBe(1);
  });

  test('表示用の連続日数は昨日までなら維持、それより前なら 0', () => {
    expect(getDisplayStreak({ streakDays: 5, lastPlayDate: '2026-09-23' }, '2026-09-23')).toBe(5);
    expect(getDisplayStreak({ streakDays: 5, lastPlayDate: '2026-09-22' }, '2026-09-23')).toBe(5);
    expect(getDisplayStreak({ streakDays: 5, lastPlayDate: '2026-09-21' }, '2026-09-23')).toBe(0);
    expect(getDisplayStreak({ streakDays: 0, lastPlayDate: null }, '2026-09-23')).toBe(0);
  });
});
