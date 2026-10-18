import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode, DifficultyLevel } from '../types';
import { getGameModeConfig } from '../config';
import { DEFAULT_DIFFICULTY } from '../config/difficulty';

/**
 * 難易度別のストレージキーを取得
 */
const getScoreKey = (mode: GameMode, difficulty: DifficultyLevel): string => {
  // チャレンジモードはスコア計算式を見直したため、旧スコアと比較しないようキーを分ける
  // （旧式の高すぎるスコアが残ると新記録が出せず、ランキングにも送信されなくなる）
  const version = mode === GameMode.CHALLENGE ? '_v2' : '';
  return `@jamaica_${mode}_${difficulty}_high_score${version}`;
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
  
  // チャレンジの旧スコアは計算式が違うため移行しない（_v2 キーに混入させない）
  if (mode === GameMode.CHALLENGE) return null;

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
  
  await Promise.all(modes.flatMap(mode =>
    difficulties.map(async difficulty => {
      const score = await loadHighScoreWithDifficulty(mode, difficulty);
      result[mode][difficulty] = score || 0;
    }),
  ));
  
  return result;
};
