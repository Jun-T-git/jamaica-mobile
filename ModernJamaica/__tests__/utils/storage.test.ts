import AsyncStorage from '@react-native-async-storage/async-storage';
import { DifficultyLevel, GameMode } from '../../src/types';
import {
  loadAllHighScoresWithDifficulty,
  loadHighScore,
  saveHighScoreWithDifficulty,
} from '../../src/utils/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('旧ルールのチャレンジ記録を現在のベストへ取り込まない', async () => {
  await AsyncStorage.setItem('@jamaica_challenge_high_score', '999999');
  for (const difficulty of Object.values(DifficultyLevel)) {
    await AsyncStorage.setItem(`@jamaica_challenge_${difficulty}_high_score`, '999999');
  }

  expect((await loadAllHighScoresWithDifficulty()).challenge).toEqual({
    easy: 0, normal: 0, hard: 0,
  });
  expect(await loadHighScore(GameMode.CHALLENGE)).toBeNull();

  await saveHighScoreWithDifficulty(GameMode.CHALLENGE, DifficultyLevel.NORMAL, 1200);
  expect((await loadAllHighScoresWithDifficulty()).challenge.normal).toBe(1200);
  // アプリの再起動後も現在の記録を読み、旧記録は保存したまま参照しない。
  expect(await loadHighScore(GameMode.CHALLENGE)).toBe(1200);
  expect(await AsyncStorage.getItem('@jamaica_challenge_normal_high_score')).toBe('999999');
});

test('現行ルールのチャレンジ記録と練習の記録は保持する', async () => {
  await AsyncStorage.setItem('@jamaica_challenge_normal_high_score_v2', '2400');
  await AsyncStorage.setItem('@jamaica_infinite_normal_high_score', '12');
  await saveHighScoreWithDifficulty(GameMode.CHALLENGE, DifficultyLevel.NORMAL, 1200);
  const scores = await loadAllHighScoresWithDifficulty();
  expect(scores.challenge.normal).toBe(2400);
  expect(scores.infinite.normal).toBe(12);
});
