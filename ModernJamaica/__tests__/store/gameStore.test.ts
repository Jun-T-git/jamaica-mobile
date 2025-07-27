import { useGameStore } from '../../src/store/gameStore';
import { GameMode, GameStatus } from '../../src/types';

// React Native をモック
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Vibration: {
    vibrate: jest.fn(),
  },
}));

describe('GameStore', () => {
  beforeEach(() => {
    // ストアの状態をリセット
    useGameStore.setState({
      mode: GameMode.CHALLENGE,
      gameStatus: GameStatus.MENU,
      nodes: [],
      history: [],
      historyIndex: -1,
      challengeHighScore: 0,
    });
  });

  describe('initGame', () => {
    it('チャレンジモードで初期化できる', async () => {
      const store = useGameStore.getState();
      await store.initGame(GameMode.CHALLENGE);
      
      const state = useGameStore.getState();
      expect(state.mode).toBe(GameMode.CHALLENGE);
      expect(state.gameStatus).toBe(GameStatus.BUILDING);
      expect(state.challengeState).toBeDefined();
      expect(state.challengeState?.isActive).toBe(true);
    });

    it('無限モードで初期化できる', async () => {
      const store = useGameStore.getState();
      await store.initGame(GameMode.INFINITE);
      
      const state = useGameStore.getState();
      expect(state.mode).toBe(GameMode.INFINITE);
      expect(state.gameStatus).toBe(GameStatus.BUILDING);
      expect(state.infiniteStats).toBeDefined();
    });
  });

  describe('generateNewProblem', () => {
    it('新しい問題を生成できる', () => {
      const store = useGameStore.getState();
      store.generateNewProblem();
      
      const state = useGameStore.getState();
      expect(state.currentProblem.numbers).toHaveLength(5);
      expect(state.targetNumber).toBeGreaterThan(0);
      expect(state.nodes).toHaveLength(5);
    });
  });

  describe('connectNodes', () => {
    it('ノードを正しく接続できる（加算）', () => {
      const store = useGameStore.getState();
      store.generateNewProblem();
      
      const state = useGameStore.getState();
      const firstNodeId = state.nodes[0].id;
      const secondNodeId = state.nodes[1].id;
      const initialNodesCount = state.nodes.length;

      store.connectNodes(firstNodeId, secondNodeId, '+');
      
      const newState = useGameStore.getState();
      // 新しいノードが追加される
      expect(newState.nodes.length).toBe(initialNodesCount + 1);
      
      // 元のノードが使用済みになる
      const firstNode = newState.nodes.find(n => n.id === firstNodeId);
      const secondNode = newState.nodes.find(n => n.id === secondNodeId);
      expect(firstNode?.isUsed).toBe(true);
      expect(secondNode?.isUsed).toBe(true);
    });

    it('ゼロ除算を防ぐ', () => {
      // テスト用のノードを設定
      useGameStore.setState({
        nodes: [
          { id: 'node1', value: 10, isLeaf: true, depth: 0, position: { x: 0, y: 0 }, isUsed: false },
          { id: 'node2', value: 0, isLeaf: true, depth: 0, position: { x: 100, y: 0 }, isUsed: false },
        ],
      });

      const store = useGameStore.getState();
      const initialNodesCount = store.nodes.length;

      store.connectNodes('node1', 'node2', '÷');
      
      const newState = useGameStore.getState();
      // ノード数が変わらない（操作が実行されない）
      expect(newState.nodes.length).toBe(initialNodesCount);
    });
  });

  describe('undoLastMove', () => {
    it('最後の操作を取り消せる', () => {
      const store = useGameStore.getState();
      store.generateNewProblem();
      
      const state = useGameStore.getState();
      const firstNodeId = state.nodes[0].id;
      const secondNodeId = state.nodes[1].id;
      const initialNodesLength = state.nodes.length;

      store.connectNodes(firstNodeId, secondNodeId, '+');
      
      expect(store.canUndo()).toBe(true);
      
      store.undoLastMove();
      
      const finalState = useGameStore.getState();
      // 元の状態に戻る
      expect(finalState.nodes.length).toBe(initialNodesLength);
      expect(finalState.nodes[0].isUsed).toBe(false);
      expect(finalState.nodes[1].isUsed).toBe(false);
    });
  });

  describe('skipProblem', () => {
    it('チャレンジモードでスキップ回数が減る', async () => {
      const store = useGameStore.getState();
      await store.initGame(GameMode.CHALLENGE);
      
      const state = useGameStore.getState();
      const initialSkipCount = state.challengeState?.skipCount || 0;

      store.skipProblem();
      
      const newState = useGameStore.getState();
      expect(newState.challengeState?.skipCount).toBe(initialSkipCount - 1);
    });

    it('スキップ回数が0の時はスキップできない', async () => {
      const store = useGameStore.getState();
      await store.initGame(GameMode.CHALLENGE);
      
      // スキップ回数を0にする
      useGameStore.setState({
        challengeState: {
          ...useGameStore.getState().challengeState!,
          skipCount: 0,
        },
      });

      const currentProblem = useGameStore.getState().currentProblem;

      store.skipProblem();
      
      const newState = useGameStore.getState();
      // 問題が変わらない
      expect(newState.currentProblem).toBe(currentProblem);
    });
  });
});