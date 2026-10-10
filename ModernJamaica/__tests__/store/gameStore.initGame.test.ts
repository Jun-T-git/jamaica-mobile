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
    setCurrentTime = jest.fn();
    setVolume = jest.fn();
    release = jest.fn();
  }
  return Sound;
});
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn(), HapticFeedbackTypes: {
  impactLight: 'impactLight', notificationSuccess: 'notificationSuccess', notificationError: 'notificationError',
} }));

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

describe('このプレイの復習問題', () => {
  beforeEach(async () => {
    useGameStore.getState().stopTimer();
    await useGameStore.getState().initGame(GameMode.CHALLENGE, DifficultyLevel.NORMAL);
    useGameStore.setState({ gameStatus: GameStatus.BUILDING });
  });
  test('スキップした元の問題と終了時の問題を保持し、再プレイでリセットする', async () => {
    const first = useGameStore.getState().currentProblem;
    useGameStore.getState().skipProblem();
    const last = useGameStore.getState().currentProblem;
    await useGameStore.getState().endGame();
    await useGameStore.getState().endGame();
    expect(useGameStore.getState().reviewProblems).toEqual([
      { problem: first, result: 'skipped' }, { problem: last, result: 'unfinished' },
    ]);
    const session = useGameStore.getState().gameSessionId;
    await useGameStore.getState().initGame(GameMode.INFINITE);
    expect(useGameStore.getState().reviewProblems).toEqual([]);
    expect(useGameStore.getState().gameSessionId).toBe(session + 1);
  });
  test('正解した問題を記録し、演出中の終了で重複させない', async () => {
    jest.useFakeTimers();
    const state = useGameStore.getState();
    const problem = { ...state.currentProblem, numbers: [1, 2, 3, 4, 5], target: 15 };
    const nodes = state.nodes.map((node, i) => ({ ...node, value: i + 1 }));
    useGameStore.setState({ currentProblem: problem, targetNumber: 15, nodes });
    const clock = jest.spyOn(Date, 'now');
    let time = 10000;
    clock.mockImplementation(() => ++time);
    let combinedId = nodes[0].id;
    for (const next of nodes.slice(1)) {
      useGameStore.getState().connectNodes(combinedId, next.id, '+');
      combinedId = useGameStore.getState().nodes.find(node => node.id.startsWith('internal-') && !node.isUsed)!.id;
    }
    clock.mockRestore();
    expect(useGameStore.getState().reviewProblems).toEqual([{ problem, result: 'correct' }]);
    await useGameStore.getState().endGame(true);
    expect(useGameStore.getState().reviewProblems).toEqual([{ problem, result: 'correct' }]);
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  test('正解演出中にスキップしても未解答として追加しない', async () => {
    useGameStore.setState({ gameStatus: GameStatus.CORRECT });
    useGameStore.getState().skipProblem();
    await useGameStore.getState().endGame(true);
    expect(useGameStore.getState().reviewProblems).toEqual([]);
  });
});
