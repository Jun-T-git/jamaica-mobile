import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode } from '../types';
import { getGameModeConfig } from '../config';

export interface StoredData {
  challengeHighScore?: number;
  infiniteHighScore?: number;
  settings?: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

const STORAGE_KEYS = {
  SETTINGS: '@jamaica_settings',
} as const;

/**
 * 統合されたハイスコア保存関数
 */
export const saveHighScore = async (mode: GameMode, score: number): Promise<void> => {
  try {
    const config = getGameModeConfig(mode);
    const currentHighScore = await loadHighScore(mode);
    
    if (score > (currentHighScore || 0)) {
      await AsyncStorage.setItem(config.storage.key, score.toString());
    }
  } catch (error) {
    console.error(`Failed to save ${mode} high score:`, error);
  }
};

/**
 * 統合されたハイスコア読み込み関数
 */
export const loadHighScore = async (mode: GameMode): Promise<number | null> => {
  try {
    const config = getGameModeConfig(mode);
    const value = await AsyncStorage.getItem(config.storage.key);
    return value != null ? parseInt(value, 10) : null;
  } catch (error) {
    console.error(`Failed to load ${mode} high score:`, error);
    return null;
  }
};

// 後方互換性のための関数（段階的に削除予定）
export const saveChallengeHighScore = async (score: number): Promise<void> => {
  return saveHighScore(GameMode.CHALLENGE, score);
};

export const loadChallengeHighScore = async (): Promise<number | null> => {
  return loadHighScore(GameMode.CHALLENGE);
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

// すべてのハイスコアデータを読み込み
export const loadAllHighScores = async (): Promise<{
  challengeHighScore: number | null;
  infiniteHighScore: number | null;
}> => {
  const [challengeHighScore, infiniteHighScore] = await Promise.all([
    loadHighScore(GameMode.CHALLENGE),
    loadHighScore(GameMode.INFINITE),
  ]);

  return {
    challengeHighScore,
    infiniteHighScore,
  };
};

// すべてのデータをクリア（デバッグ用）
export const clearAllStoredData = async (): Promise<void> => {
  try {
    const keysToRemove = [
      ...Object.values(STORAGE_KEYS),
      ...Object.values(GameMode).map(mode => getGameModeConfig(mode).storage.key),
    ];
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    console.error('Failed to clear stored data:', error);
  }
};