import { create } from 'zustand';
import { GameState, GameMode, GameStatus, UnifiedGameState, NodeData } from '../types';
import { generateProblemExhaustive } from '../utils/problemGenerator';
import { getGameModeConfig } from '../config';
import { saveHighScore, loadHighScore } from '../utils/storage';
import { adService } from '../services/adService';
import { ComboTracker, calculateProblemScore, calculateFinalBonus } from '../utils/scoreCalculator';
import { ProblemResult } from '../constants/scoreConfig';
import { soundManager, SoundType } from '../utils/SoundManager';

interface GameStore extends GameState {
  // UI関連の状態
  nodes: NodeData[];
  selectedNodeId: string | null;
  history: NodeData[][];
  historyIndex: number;
  
  // 内部管理
  comboTracker: ComboTracker;
  problemStartTime: number;
  navigationCallback: ((params: any) => void) | null;
  timerInterval: NodeJS.Timeout | null;
  
  // シンプルなアクション
  initGame: (mode: GameMode) => Promise<void>;
  startCountdown: () => void;
  completeCountdown: () => void;
  generateNewProblem: () => void;
  connectNodes: (firstNodeId: string, secondNodeId: string, operator: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  skipProblem: () => void;
  endGame: (isManual?: boolean) => Promise<void>;
  
  // ユーティリティ
  setNavigationCallback: (callback: (params: any) => void) => void;
  undoLastMove: () => void;
  canUndo: () => boolean;
  loadStoredData: () => Promise<void>;
  
  // 内部メソッド
  startTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
}

// 初期ゲーム状態を作成
const createInitialGameState = (mode: GameMode): UnifiedGameState => {
  const config = getGameModeConfig(mode);
  return {
    mode,
    timeLeft: config.time.initial,
    isActive: false,
    score: 0,
    problemCount: 0,
    skipCount: mode === GameMode.CHALLENGE ? config.gameplay.skipLimit : 999,
    currentCombo: 0,
    lastProblemScore: 0,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  // 初期状態
  gameState: createInitialGameState(GameMode.CHALLENGE),
  gameStatus: GameStatus.MENU,
  targetNumber: 0,
  currentProblem: {
    numbers: [],
    target: 0,
    difficulty: 'normal',
  },
  highScores: {
    challenge: 0,
    infinite: 0,
  },
  nodes: [],
  selectedNodeId: null,
  history: [],
  historyIndex: -1,
  comboTracker: new ComboTracker(),
  problemStartTime: Date.now(),
  navigationCallback: null,
  timerInterval: null,
  
  // タイマー管理（内部メソッド）
  startTimer: () => {
    const state = get();
    if (state.timerInterval) return; // 既に動作中
    
    const interval = setInterval(() => get().tick(), 1000);
    set({ timerInterval: interval });
  },
  
  stopTimer: () => {
    const state = get();
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      set({ timerInterval: null });
    }
  },
  
  tick: () => {
    const state = get();
    const { gameState: game } = state;
    
    if (!game.isActive || state.gameStatus !== GameStatus.BUILDING) return;
    
    if (game.timeLeft <= 1) {
      // タイムアップ
      set({
        gameState: { ...game, timeLeft: 0, isActive: false },
        gameStatus: GameStatus.TIMEUP,
      });
      get().stopTimer();
      get().endGame(false);
    } else {
      // 時間を減らす
      const newTimeLeft = game.timeLeft - 1;
      
      // 残り時間が5秒以下になったら毎秒countdown.mp3を再生
      if (newTimeLeft <= 5 && newTimeLeft > 0) {
        soundManager.play(SoundType.COUNTDOWN);
      }
      
      set({
        gameState: { ...game, timeLeft: newTimeLeft }
      });
    }
  },
  
  // ゲーム初期化
  initGame: async (mode: GameMode) => {
    const savedHighScores = {
      challenge: await loadHighScore(GameMode.CHALLENGE) || 0,
      infinite: await loadHighScore(GameMode.INFINITE) || 0,
    };
    
    // コンボトラッカーをリセット
    if (mode === GameMode.CHALLENGE) {
      get().comboTracker.reset();
    }
    
    set({
      gameState: createInitialGameState(mode),
      gameStatus: GameStatus.COUNTDOWN,
      highScores: savedHighScores,
    });
    
    get().generateNewProblem();
  },
  
  // カウントダウン開始
  startCountdown: () => {
    set({ gameStatus: GameStatus.COUNTDOWN });
  },
  
  // カウントダウン完了
  completeCountdown: () => {
    const state = get();
    set({
      gameStatus: GameStatus.BUILDING,
      gameState: { ...state.gameState, isActive: true },
      problemStartTime: Date.now(),
    });
    get().startTimer();
  },
  
  // 新しい問題を生成
  generateNewProblem: () => {
    const problem = generateProblemExhaustive();
    const screenWidth = 350;
    const nodeSpacing = screenWidth / 6;
    const startX = nodeSpacing;
    
    const nodes: NodeData[] = problem.numbers.map((num, index) => ({
      id: `leaf-${index}`,
      value: num,
      position: {
        x: startX + (index * nodeSpacing),
        y: 250,
      },
      isLeaf: true,
      depth: 0,
      isUsed: false,
    }));
    
    const state = get();
    set({
      currentProblem: problem,
      targetNumber: problem.target,
      nodes,
      selectedNodeId: null,
      gameStatus: state.gameStatus === GameStatus.COUNTDOWN ? GameStatus.COUNTDOWN : GameStatus.BUILDING,
      history: [JSON.parse(JSON.stringify(nodes))],
      historyIndex: 0,
      problemStartTime: Date.now(),
    });
  },
  
  // ノード接続処理
  connectNodes: (firstNodeId: string, secondNodeId: string, operator: string) => {
    const state = get();
    const firstNode = state.nodes.find(n => n.id === firstNodeId);
    const secondNode = state.nodes.find(n => n.id === secondNodeId);
    
    if (!firstNode || !secondNode || firstNode.isUsed || secondNode.isUsed) {
      return;
    }
    
    // 計算結果
    let result: number;
    switch (operator) {
      case '+':
        result = firstNode.value + secondNode.value;
        break;
      case '-':
        result = firstNode.value - secondNode.value;
        break;
      case '×':
        result = firstNode.value * secondNode.value;
        break;
      case '÷':
        if (secondNode.value === 0) return;
        result = Math.round((firstNode.value / secondNode.value) * 100) / 100;
        break;
      default:
        return;
    }
    
    // 新しいノードを作成
    const newNode: NodeData = {
      id: `internal-${Date.now()}`,
      value: result,
      position: {
        x: (firstNode.position.x + secondNode.position.x) / 2,
        y: Math.min(firstNode.position.y, secondNode.position.y) - 80,
      },
      isLeaf: false,
      operator: operator as any,
      leftChildId: firstNodeId,
      rightChildId: secondNodeId,
      depth: Math.max(firstNode.depth, secondNode.depth) + 1,
      isUsed: false,
    };
    
    // ノードを更新
    const updatedNodes = state.nodes.map(node => {
      if (node.id === firstNodeId || node.id === secondNodeId) {
        return { ...node, isUsed: true, parentId: newNode.id };
      }
      return node;
    });
    
    updatedNodes.push(newNode);
    
    // ノード結合効果音
    soundManager.play(SoundType.CONNECT);
    
    // パズル完成チェック
    const activeNodes = updatedNodes.filter(n => !n.isUsed);
    if (activeNodes.length === 1) {
      const finalValue = activeNodes[0].value;
      const isCorrect = Math.abs(finalValue - state.targetNumber) < 0.001;
      
      if (isCorrect) {
        set({ gameStatus: GameStatus.CORRECT });
        
        // 問題正解効果音
        soundManager.play(SoundType.CORRECT);
        
        // スコア更新
        const { gameState: game } = state;
        const config = getGameModeConfig(game.mode);
        const solveTime = (Date.now() - state.problemStartTime) / 1000;
        
        if (game.mode === GameMode.CHALLENGE) {
          // チャレンジモードのスコア計算
          const problemResult: ProblemResult = {
            numbers: state.currentProblem.numbers,
            target: state.currentProblem.target,
            solveTime,
            isCorrect: true,
            timestamp: Date.now(),
          };
          
          const currentCombo = state.comboTracker.onCorrectAnswer(Date.now());
          const problemScore = calculateProblemScore(problemResult, currentCombo);
          
          set({
            gameState: {
              ...game,
              score: game.score + problemScore,
              problemCount: game.problemCount + 1,
              timeLeft: game.timeLeft + config.time.bonus,
              currentCombo,
              lastProblemScore: problemScore,
            },
          });
        } else {
          // 無限モードの正解数更新
          set({
            gameState: {
              ...game,
              score: game.score + 1,
              problemCount: game.problemCount + 1,
            },
          });
        }
        
        // 次の問題を生成
        setTimeout(() => {
          get().generateNewProblem();
        }, 1500);
      }
    }
    
    // 履歴を保存
    const currentState = get();
    const newHistory = [...currentState.history.slice(0, currentState.historyIndex + 1), JSON.parse(JSON.stringify(updatedNodes))];
    
    set({
      nodes: updatedNodes,
      selectedNodeId: null,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  // ゲーム一時停止
  pauseGame: () => {
    const state = get();
    if (state.gameState.isActive) {
      set({
        gameState: { ...state.gameState, isActive: false }
      });
      get().stopTimer();
    }
  },
  
  // ゲーム再開
  resumeGame: () => {
    const state = get();
    if (!state.gameState.isActive && state.gameStatus === GameStatus.BUILDING) {
      set({
        gameState: { ...state.gameState, isActive: true }
      });
      get().startTimer();
    }
  },
  
  // 問題をスキップ
  skipProblem: () => {
    const state = get();
    const { gameState: game } = state;
    
    // スキップ可能かチェック
    if (game.skipCount <= 0) return;
    
    set({
      gameState: {
        ...game,
        skipCount: game.skipCount - 1,
        problemCount: game.problemCount + 1,
      }
    });
    
    get().generateNewProblem();
  },
  
  // ゲーム終了処理
  endGame: async (isManual: boolean = false) => {
    const state = get();
    const { gameState: game } = state;
    const config = getGameModeConfig(game.mode);
    
    // タイマー停止
    get().stopTimer();
    
    let finalScore = game.score;
    let isNewHighScore = false;
    let previousHighScore = state.highScores[game.mode];
    
    if (game.mode === GameMode.CHALLENGE) {
      // 最終ボーナスを追加
      const finalBonus = calculateFinalBonus(game.score, game.problemCount);
      finalScore = game.score + finalBonus;
    }
    
    // ハイスコア判定
    isNewHighScore = finalScore > previousHighScore;
    
    // 状態を更新
    set({
      gameStatus: isManual ? GameStatus.MANUALLY_ENDED : GameStatus.TIMEUP,
      gameState: {
        ...game,
        isActive: false,
        finalScore,
      },
    });
    
    // ハイスコア保存
    if (isNewHighScore) {
      await saveHighScore(game.mode, finalScore);
      set({
        highScores: {
          ...state.highScores,
          [game.mode]: finalScore,
        },
      });
    }
    
    // 広告表示（手動終了以外）
    if (config.ad.enabled && !isManual) {
      await adService.showInterstitialAd();
    }
    
    // リザルト画面への遷移
    const navigationCallback = state.navigationCallback;
    if (navigationCallback && !isManual) {
      setTimeout(() => {
        navigationCallback({
          finalScore,
          isNewHighScore,
          previousHighScore,
          mode: game.mode === GameMode.CHALLENGE ? 'challenge' : 'infinite',
        });
      }, 100);
    }
  },
  
  // ナビゲーションコールバック設定
  setNavigationCallback: (callback: (params: any) => void) => {
    set({ navigationCallback: callback });
  },
  
  // 最後の操作を取り消し
  undoLastMove: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const previousNodes = state.history[state.historyIndex - 1];
      set({
        nodes: JSON.parse(JSON.stringify(previousNodes)),
        selectedNodeId: null,
        historyIndex: state.historyIndex - 1,
        gameStatus: GameStatus.BUILDING,
      });
    }
  },
  
  // 取り消し可能かチェック
  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },
  
  // 保存されたデータを読み込み
  loadStoredData: async () => {
    const [challengeHighScore, infiniteHighScore] = await Promise.all([
      loadHighScore(GameMode.CHALLENGE),
      loadHighScore(GameMode.INFINITE),
    ]);
    
    set({
      highScores: {
        challenge: challengeHighScore || 0,
        infinite: infiniteHighScore || 0,
      },
    });
  },
}));