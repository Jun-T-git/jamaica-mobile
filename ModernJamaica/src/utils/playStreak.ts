/**
 * 連続プレイ日数（ストリーク）の純ロジック
 * 「その日に 1 ゲーム以上始めた」を 1 日と数える。日付は端末のローカル日付
 */

/** ローカル日付を YYYY-MM-DD にする */
export const toLocalDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** 日付キー同士の差（日数）。dateKey は YYYY-MM-DD */
export const diffDays = (fromKey: string, toKey: string): number => {
  const from = Date.UTC(
    Number(fromKey.slice(0, 4)),
    Number(fromKey.slice(5, 7)) - 1,
    Number(fromKey.slice(8, 10)),
  );
  const to = Date.UTC(
    Number(toKey.slice(0, 4)),
    Number(toKey.slice(5, 7)) - 1,
    Number(toKey.slice(8, 10)),
  );
  return Math.round((to - from) / 86400000);
};

export interface StreakState {
  /** 現在の連続日数（0 = まだ遊んでいない） */
  streakDays: number;
  /** 最後に遊んだ日（YYYY-MM-DD）。未プレイなら null */
  lastPlayDate: string | null;
}

/**
 * 今日遊んだときのストリークを返す
 * - 同じ日: 変わらない
 * - 昨日の続き: +1
 * - それ以外（間が空いた／初回）: 1 から
 */
export const advanceStreak = (prev: StreakState, todayKey: string): StreakState => {
  if (prev.lastPlayDate === todayKey) return prev;

  const continues =
    prev.lastPlayDate !== null && diffDays(prev.lastPlayDate, todayKey) === 1;

  return {
    streakDays: continues ? prev.streakDays + 1 : 1,
    lastPlayDate: todayKey,
  };
};

/**
 * 表示用のストリーク。昨日までで途切れていれば 0 として扱う
 * （記録は残すが「連続 5 日」と誇示しない）
 */
export const getDisplayStreak = (state: StreakState, todayKey: string): number => {
  if (state.lastPlayDate === null) return 0;
  const gap = diffDays(state.lastPlayDate, todayKey);
  return gap <= 1 ? state.streakDays : 0;
};
