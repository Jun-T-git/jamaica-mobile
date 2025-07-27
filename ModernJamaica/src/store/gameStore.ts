import { create } from 'zustand';
import { Alert } from 'react-native';
import { GameState, GameMode, GameStatus, ChallengeState, InfiniteStats, NodeData } from '../types';
import { generateProblemExhaustive } from '../utils/problemGenerator';
import { GAME_CONFIG } from '../constants';
import { saveInfiniteStats, saveChallengeHighScore, loadInfiniteStats, loadChallengeHighScore } from '../utils/storage';

interface GameStore extends GameState {
  nodes: NodeData[];
  selectedNodeId: string | null;
  history: NodeData[][];
  historyIndex: number;
  challengeHighScore: number;
  
  // Actions
  initGame: (mode: GameMode) => void;
  generateNewProblem: () => void;
  connectNodes: (firstNodeId: string, secondNodeId: string, operator: string) => void;
  updateChallengeTime: (timeLeft: number) => void;
  endChallenge: (isManual?: boolean) => void;
  updateInfiniteStats: (correct: boolean, timeSpent: number) => void;
  undoLastMove: () => void;
  canUndo: () => boolean;
  skipProblem: () => void;
  loadStoredData: () => Promise<void>;
}

const initialChallengeState: ChallengeState = {
  timeLeft: GAME_CONFIG.CHALLENGE_MODE.INITIAL_TIME,
  problemCount: 0,
  skipCount: GAME_CONFIG.CHALLENGE_MODE.SKIP_LIMIT,
  isActive: false,
};

const initialInfiniteStats: InfiniteStats = {
  totalProblems: 0,
  correctAnswers: 0,
  averageTime: 0,
  longestStreak: 0,
  currentStreak: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  mode: GameMode.CHALLENGE,
  targetNumber: 0,
  gameStatus: GameStatus.MENU,
  currentProblem: {
    numbers: [],
    target: 0,
    difficulty: 'normal',
  },
  challengeState: initialChallengeState,
  infiniteStats: initialInfiniteStats,
  nodes: [],
  selectedNodeId: null,
  history: [],
  historyIndex: -1,
  challengeHighScore: 0,
  
  initGame: async (mode: GameMode) => {
    // 保存されたデータを読み込む
    if (mode === GameMode.INFINITE) {
      const savedStats = await loadInfiniteStats();
      set({
        mode,
        gameStatus: GameStatus.BUILDING,
        infiniteStats: savedStats || { ...initialInfiniteStats },
      });
    } else {
      set({
        mode,
        gameStatus: GameStatus.BUILDING,
        challengeState: { ...initialChallengeState, isActive: true },
      });
    }
    get().generateNewProblem();
  },
  
  generateNewProblem: () => {
    const problem = generateProblemExhaustive();
    const screenWidth = 350; // Approximate game board width
    const nodeSpacing = screenWidth / 6;
    const startX = nodeSpacing;
    
    const nodes: NodeData[] = problem.numbers.map((num, index) => ({
      id: `leaf-${index}`,
      value: num,
      position: {
        x: startX + (index * nodeSpacing),
        y: 250, // Bottom of game area
      },
      isLeaf: true,
      depth: 0,
      isUsed: false,
    }));
    
    set({
      currentProblem: problem,
      targetNumber: problem.target,
      nodes,
      selectedNodeId: null,
      gameStatus: GameStatus.BUILDING,
      history: [JSON.parse(JSON.stringify(nodes))], // Save initial state
      historyIndex: 0,
    });
  },
  
  
  connectNodes: (firstNodeId: string, secondNodeId: string, operator: string) => {
    const state = get();
    const firstNode = state.nodes.find(n => n.id === firstNodeId);
    const secondNode = state.nodes.find(n => n.id === secondNodeId);
    
    if (!firstNode || !secondNode || firstNode.isUsed || secondNode.isUsed) {
      return;
    }
    
    // Calculate the result
    let result: number;
    switch (operator) {
      case '+':
        result = firstNode.value + secondNode.value;
        break;
      case '-':
        result = firstNode.value - secondNode.value;
        // 負の数の処理
        if (result < 0) {
          Alert.alert('注意', '結果が負の数になります');
        }
        break;
      case '×':
        result = firstNode.value * secondNode.value;
        break;
      case '÷':
        if (secondNode.value === 0) {
          // ゼロ除算エラーを防ぐ
          Alert.alert('エラー', 'ゼロで割ることはできません');
          return;
        }
        result = firstNode.value / secondNode.value;
        // 結果が整数でない場合は小数点以下2桁に丸める
        result = Math.round(result * 100) / 100;
        break;
      default:
        return;
    }
    
    // Create new internal node
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
    
    // Update nodes
    const updatedNodes = state.nodes.map(node => {
      if (node.id === firstNodeId || node.id === secondNodeId) {
        return { ...node, isUsed: true, parentId: newNode.id };
      }
      return node;
    });
    
    updatedNodes.push(newNode);
    
    // Check if puzzle is complete
    const activeNodes = updatedNodes.filter(n => !n.isUsed);
    if (activeNodes.length === 1) {
      const finalValue = activeNodes[0].value;
      const isCorrect = Math.abs(finalValue - state.targetNumber) < 0.001;
      
      if (isCorrect) {
        set({ gameStatus: GameStatus.CORRECT });
        
        if (state.mode === GameMode.CHALLENGE && state.challengeState) {
          const newProblemCount = state.challengeState.problemCount + 1;
          const newTimeLeft = state.challengeState.timeLeft + GAME_CONFIG.CHALLENGE_MODE.BONUS_TIME;
          set({
            challengeState: {
              ...state.challengeState,
              problemCount: newProblemCount,
              timeLeft: newTimeLeft,
            },
          });
          
          // Generate new problem after a delay
          setTimeout(() => {
            get().generateNewProblem();
          }, 1500);
        }
      }
    }
    
    // Save state to history before updating
    const currentState = get();
    const newHistory = [...currentState.history.slice(0, currentState.historyIndex + 1), JSON.parse(JSON.stringify(updatedNodes))];
    
    set({
      nodes: updatedNodes,
      selectedNodeId: null,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  updateChallengeTime: (timeLeft: number) => {
    const state = get();
    if (state.challengeState) {
      if (timeLeft <= 0) {
        get().endChallenge();
      } else {
        set({
          challengeState: {
            ...state.challengeState,
            timeLeft,
          },
        });
      }
    }
  },
  
  endChallenge: async (isManual: boolean = false) => {
    const state = get();
    if (state.challengeState) {
      const finalScore = state.challengeState.problemCount;
      set({
        gameStatus: isManual ? GameStatus.MANUALLY_ENDED : GameStatus.TIMEUP,
        challengeState: {
          ...state.challengeState,
          isActive: false,
          finalScore,
        },
      });
      
      // ハイスコアを保存
      await saveChallengeHighScore(finalScore);
      const highScore = await loadChallengeHighScore();
      if (highScore !== null) {
        set({ challengeHighScore: highScore });
      }
    }
  },
  
  
  updateInfiniteStats: async (correct: boolean, timeSpent: number) => {
    const state = get();
    if (state.infiniteStats) {
      const newTotalProblems = state.infiniteStats.totalProblems + 1;
      const newCorrectAnswers = state.infiniteStats.correctAnswers + (correct ? 1 : 0);
      const newCurrentStreak = correct ? state.infiniteStats.currentStreak + 1 : 0;
      const newLongestStreak = Math.max(state.infiniteStats.longestStreak, newCurrentStreak);
      const newAverageTime = 
        (state.infiniteStats.averageTime * state.infiniteStats.totalProblems + timeSpent) / newTotalProblems;
      
      const newStats = {
        totalProblems: newTotalProblems,
        correctAnswers: newCorrectAnswers,
        averageTime: newAverageTime,
        longestStreak: newLongestStreak,
        currentStreak: newCurrentStreak,
      };
      
      set({ infiniteStats: newStats });
      
      // 統計を保存
      await saveInfiniteStats(newStats);
    }
  },

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

  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },


  skipProblem: () => {
    const state = get();
    
    // Check skip limit for challenge mode
    if (state.mode === GameMode.CHALLENGE && state.challengeState) {
      if (state.challengeState.skipCount <= 0) {
        return; // No skips remaining
      }
      
      // Decrement skip count
      set({
        challengeState: {
          ...state.challengeState,
          skipCount: state.challengeState.skipCount - 1,
        }
      });
    }
    
    get().generateNewProblem();
  },
  
  loadStoredData: async () => {
    const [savedInfiniteStats, savedHighScore] = await Promise.all([
      loadInfiniteStats(),
      loadChallengeHighScore(),
    ]);
    
    if (savedInfiniteStats) {
      set({ infiniteStats: savedInfiniteStats });
    }
    
    if (savedHighScore !== null) {
      set({ challengeHighScore: savedHighScore });
    }
  },
}));