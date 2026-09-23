/**
 * initGame の契約: 問題生成は自己記録や計測の I/O に依存せず、開始直後に盤面（5 つの葉）ができる
 */
jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: () => ({}),
  logEvent: jest.fn(() => Promise.resolve()),
  logScreenView: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  getCountFromServer: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({ currentUser: null }),
  signInAnonymously: jest.fn(() => Promise.resolve({ user: { uid: 'test' } })),
  onAuthStateChanged: jest.fn(),
}));
jest.mock('react-native-sound', () => {
  class Sound {
    static setCategory = jest.fn();
    static MAIN_BUNDLE = '';
    constructor(_a: unknown, _b: unknown, cb?: (e: unknown) => void) {
      cb?.(null);
    }
    play = jest.fn();
    setVolume = jest.fn();
    release = jest.fn();
  }
  return Sound;
});
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }));

import { useGameStore } from '../../src/store/gameStore';
import { useStatsStore } from '../../src/store/statsStore';
import { DifficultyLevel, GameMode, GameStatus } from '../../src/types';

describe('gameStore.initGame', () => {
  test('開始直後に 5 つの葉と目標値ができ、カウントダウン状態になる', async () => {
    await useGameStore.getState().initGame(GameMode.CHALLENGE, DifficultyLevel.NORMAL);
    const state = useGameStore.getState();
    expect(state.gameStatus).toBe(GameStatus.COUNTDOWN);
    expect(state.nodes.filter(n => n.isLeaf)).toHaveLength(5);
    expect(state.targetNumber).toBeGreaterThan(0);
  });

  test('自己記録のゲーム数が進む（もう一度も 1 ゲームとして数える）', async () => {
    const before = useStatsStore.getState().stats.gamesPlayed;
    await useGameStore.getState().initGame(GameMode.INFINITE, DifficultyLevel.EASY);
    // recordGameStart は投げっぱなしなので少し待つ
    await new Promise(r => setTimeout(r, 20));
    expect(useStatsStore.getState().stats.gamesPlayed).toBe(before + 1);
    expect(useStatsStore.getState().stats.streakDays).toBe(1);
  });
});
