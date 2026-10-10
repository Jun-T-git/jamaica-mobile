import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerStats } from '../types';

const PLAYER_STATS_KEY = '@jamaica_player_stats';
const FIRST_SOLVE_KEY = '@jamaica_first_solve_logged';

export const EMPTY_PLAYER_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalCorrect: 0,
  streakDays: 0,
  bestStreakDays: 0,
  lastPlayDate: null,
  firstPlayedAt: null,
};

/**
 * プレイヤーの自己記録の永続化（AsyncStorage）
 * 読み書きの失敗はゲーム進行に影響させない（空の記録として扱う）
 */
class PlayerStatsService {
  async load(): Promise<PlayerStats> {
    try {
      const json = await AsyncStorage.getItem(PLAYER_STATS_KEY);
      if (!json) return { ...EMPTY_PLAYER_STATS };
      return { ...EMPTY_PLAYER_STATS, ...JSON.parse(json) };
    } catch (error) {
      console.warn('Failed to load player stats:', error);
      return { ...EMPTY_PLAYER_STATS };
    }
  }

  async save(stats: PlayerStats): Promise<void> {
    try {
      await AsyncStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save player stats:', error);
    }
  }

  /**
   * 「初めて正解した」を一度だけ true で返す（計測のファネル用）
   */
  async markFirstSolve(): Promise<boolean> {
    try {
      const logged = await AsyncStorage.getItem(FIRST_SOLVE_KEY);
      if (logged === 'true') return false;
      await AsyncStorage.setItem(FIRST_SOLVE_KEY, 'true');
      return true;
    } catch (error) {
      console.warn('Failed to mark first solve:', error);
      return false;
    }
  }
}

export const playerStatsService = new PlayerStatsService();
