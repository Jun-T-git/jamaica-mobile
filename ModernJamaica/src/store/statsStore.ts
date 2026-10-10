import { create } from 'zustand';
import { PlayerStats } from '../types';
import {
  EMPTY_PLAYER_STATS,
  playerStatsService,
} from '../services/playerStatsService';
import {
  advanceStreak,
  getDisplayStreak,
  toLocalDateKey,
} from '../utils/playStreak';

interface StatsStore {
  stats: PlayerStats;
  isLoaded: boolean;
  loadStats: () => Promise<void>;
  /** ゲーム開始時: ゲーム数と連続プレイ日数を進める。更新後の記録を返す */
  recordGameStart: () => Promise<PlayerStats>;
  /** ゲーム終了時: 累計正解数を足す */
  recordGameEnd: (correctCount: number) => Promise<PlayerStats>;
  /** 表示用の連続日数（昨日までで途切れていれば 0） */
  getDisplayStreakDays: () => number;
}

/**
 * プレイヤー自身の記録（累計・連続日数）
 * 他のプレイヤーの人数に依存しない「自分との勝負」の材料。gameStore から更新される
 */
export const useStatsStore = create<StatsStore>((set, get) => ({
  stats: { ...EMPTY_PLAYER_STATS },
  isLoaded: false,

  loadStats: async () => {
    const stats = await playerStatsService.load();
    set({ stats, isLoaded: true });
  },

  recordGameStart: async () => {
    const prev = get().isLoaded ? get().stats : await playerStatsService.load();
    const now = Date.now();
    const streak = advanceStreak(
      { streakDays: prev.streakDays, lastPlayDate: prev.lastPlayDate },
      toLocalDateKey(new Date(now)),
    );
    const stats: PlayerStats = {
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      streakDays: streak.streakDays,
      bestStreakDays: Math.max(prev.bestStreakDays, streak.streakDays),
      lastPlayDate: streak.lastPlayDate,
      firstPlayedAt: prev.firstPlayedAt ?? now,
    };
    set({ stats, isLoaded: true });
    await playerStatsService.save(stats);
    return stats;
  },

  recordGameEnd: async (correctCount: number) => {
    const prev = get().isLoaded ? get().stats : await playerStatsService.load();
    const stats: PlayerStats = {
      ...prev,
      totalCorrect: prev.totalCorrect + Math.max(0, correctCount),
    };
    set({ stats, isLoaded: true });
    await playerStatsService.save(stats);
    return stats;
  },

  getDisplayStreakDays: () => {
    const { stats } = get();
    return getDisplayStreak(
      { streakDays: stats.streakDays, lastPlayDate: stats.lastPlayDate },
      toLocalDateKey(new Date()),
    );
  },
}));
