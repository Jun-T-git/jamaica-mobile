import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode, DifficultyLevel } from '../types';
import { getGameModeConfig } from '../config';
import { DEFAULT_DIFFICULTY } from '../config/difficulty';

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
 * 難易度別のストレージキーを取得
 */
const getScoreKey = (mode: GameMode, difficulty: DifficultyLevel): string => {
  return `@jamaica_${mode}_${difficulty}_high_score`;
};

/**
 * 難易度別ハイスコア保存
 */
export const saveHighScoreWithDifficulty = async (
  mode: GameMode,
  difficulty: DifficultyLevel,
  score: number
): Promise<void> => {
  try {
    const key = getScoreKey(mode, difficulty);
    const currentHighScore = await loadHighScoreWithDifficulty(mode, difficulty);
    
    if (score > (currentHighScore || 0)) {
      await AsyncStorage.setItem(key, score.toString());
    }
  } catch (error) {
    console.error(`Failed to save ${mode} ${difficulty} high score:`, error);
  }
};

/**
 * 統合されたハイスコア保存関数（後方互換性）
 */
export const saveHighScore = async (mode: GameMode, score: number): Promise<void> => {
  return saveHighScoreWithDifficulty(mode, DEFAULT_DIFFICULTY, score);
};

/**
 * 難易度別ハイスコア読み込み
 */
export const loadHighScoreWithDifficulty = async (
  mode: GameMode,
  difficulty: DifficultyLevel
): Promise<number | null> => {
  try {
    const key = getScoreKey(mode, difficulty);
    const value = await AsyncStorage.getItem(key);
    return value != null ? parseInt(value, 10) : null;
  } catch (error) {
    console.error(`Failed to load ${mode} ${difficulty} high score:`, error);
    return null;
  }
};

/**
 * 統合されたハイスコア読み込み関数（後方互換性）
 */
export const loadHighScore = async (mode: GameMode): Promise<number | null> => {
  // 既存データの移行を考慮
  const normalScore = await loadHighScoreWithDifficulty(mode, DEFAULT_DIFFICULTY);
  if (normalScore !== null) return normalScore;
  
  // 旧形式のキーからも読み込みを試みる
  try {
    const config = getGameModeConfig(mode);
    const value = await AsyncStorage.getItem(config.storage.key);
    if (value != null) {
      const score = parseInt(value, 10);
      // 旧データを新形式に移行
      await saveHighScoreWithDifficulty(mode, DEFAULT_DIFFICULTY, score);
      return score;
    }
  } catch (error) {
    console.error(`Failed to migrate ${mode} high score:`, error);
  }
  
  return null;
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

// 難易度別の全ハイスコアを読み込み
export const loadAllHighScoresWithDifficulty = async (): Promise<{
  challenge: Record<DifficultyLevel, number>;
  infinite: Record<DifficultyLevel, number>;
}> => {
  const difficulties = Object.values(DifficultyLevel);
  const modes = [GameMode.CHALLENGE, GameMode.INFINITE];
  
  const result = {
    challenge: {} as Record<DifficultyLevel, number>,
    infinite: {} as Record<DifficultyLevel, number>,
  };
  
  for (const mode of modes) {
    for (const difficulty of difficulties) {
      const score = await loadHighScoreWithDifficulty(mode, difficulty);
      result[mode][difficulty] = score || 0;
    }
  }
  
  return result;
};

// すべてのハイスコアデータを読み込み（後方互換性）
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
      // 旧形式のキー
      ...Object.values(GameMode).map(mode => getGameModeConfig(mode).storage.key),
      // 新形式のキー
      ...Object.values(GameMode).flatMap(mode =>
        Object.values(DifficultyLevel).map(difficulty => getScoreKey(mode, difficulty))
      ),
    ];
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    console.error('Failed to clear stored data:', error);
  }
};