import AsyncStorage from '@react-native-async-storage/async-storage';
import { InfiniteStats } from '../types';

const STORAGE_KEYS = {
  INFINITE_STATS: '@jamaica_infinite_stats',
  CHALLENGE_HIGH_SCORE: '@jamaica_challenge_high_score',
  SETTINGS: '@jamaica_settings',
};

export interface StoredData {
  infiniteStats?: InfiniteStats;
  challengeHighScore?: number;
  settings?: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

// 無限モードの統計を保存
export const saveInfiniteStats = async (stats: InfiniteStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INFINITE_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save infinite stats:', error);
  }
};

// 無限モードの統計を読み込み
export const loadInfiniteStats = async (): Promise<InfiniteStats | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.INFINITE_STATS);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Failed to load infinite stats:', error);
    return null;
  }
};

// チャレンジモードのハイスコアを保存
export const saveChallengeHighScore = async (score: number): Promise<void> => {
  try {
    const currentHighScore = await loadChallengeHighScore();
    if (score > (currentHighScore || 0)) {
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_HIGH_SCORE, score.toString());
    }
  } catch (error) {
    console.error('Failed to save challenge high score:', error);
  }
};

// チャレンジモードのハイスコアを読み込み
export const loadChallengeHighScore = async (): Promise<number | null> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_HIGH_SCORE);
    return value != null ? parseInt(value, 10) : null;
  } catch (error) {
    console.error('Failed to load challenge high score:', error);
    return null;
  }
};

// 設定を保存
export const saveSettings = async (settings: StoredData['settings']): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// 設定を読み込み
export const loadSettings = async (): Promise<StoredData['settings'] | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
};

// すべてのデータを読み込み
export const loadAllStoredData = async (): Promise<StoredData> => {
  const [infiniteStats, challengeHighScore, settings] = await Promise.all([
    loadInfiniteStats(),
    loadChallengeHighScore(),
    loadSettings(),
  ]);

  return {
    infiniteStats: infiniteStats || undefined,
    challengeHighScore: challengeHighScore || undefined,
    settings: settings || undefined,
  };
};

// すべてのデータをクリア（デバッグ用）
export const clearAllStoredData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear stored data:', error);
  }
};