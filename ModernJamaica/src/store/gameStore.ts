import { create } from 'zustand';
import { GameState, GameMode, GameStatus, UnifiedGameState, NodeData, DifficultyLevel } from '../types';
import { generateProblem } from '../utils/problemGenerator';
import { getGameModeConfig } from '../config';
import { getDifficultyConfig, DEFAULT_DIFFICULTY } from '../config/difficulty';
import { saveHighScoreWithDifficulty, loadAllHighScoresWithDifficulty } from '../utils/storage';
import { ComboTracker, calculateScoreBreakdown, calculateFinalBonus } from '../utils/scoreCalculator';
import { calculateTimeBonus } from '../utils/timeBonus';
import { ProblemResult, EMPTY_SCORE_BREAKDOWN, SCORE_CONFIG } from '../constants/scoreConfig';
import { analyticsService } from '../services/analyticsService';
import { hapticService } from '../services/hapticService';
import { soundManager, SoundType } from '../utils/SoundManager';
import { rankingService } from '../services/rankingService';
import { playerStatsService } from '../services/playerStatsService';
import { ScoreSubmission } from '../types/ranking';
import { useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';

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
  wrongAnswerCount: number; // 不正解のたびに増える（UIの揺れアニメーションのトリガー）
  
  // ランキング関連
  isSubmittingScore: boolean;
  rankingSubmissionResult: boolean | null;
  
  // シンプルなアクション
  initGame: (mode: GameMode, difficulty?: DifficultyLevel) => Promise<void>;
  startCountdown: () => void;
  completeCountdown: () => void;
  generateNewProblem: () => void;
  connectNodes: (firstNodeId: string, secondNodeId: string, operator: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  skipProblem: () => void;
  endGame: (isManual?: boolean, displayName?: string) => Promise<void>;
  
  // ユーティリティ
  setNavigationCallback: (callback: (params: any) => void) => void;
  undoLastMove: () => void;
  canUndo: () => boolean;
  loadStoredData: () => Promise<void>;
  
  // ランキング関連
  submitScoreToRanking: (displayName: string) => Promise<boolean>;
  
  // 内部メソッド
  startTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
}

// 初期ゲーム状態を作成
const createInitialGameState = (mode: GameMode, difficulty: DifficultyLevel = DEFAULT_DIFFICULTY): UnifiedGameState => {
  const modeConfig = getGameModeConfig(mode);
  const difficultyConfig = getDifficultyConfig(difficulty);
  
  // チャレンジモードの場合は難易度に応じた時間設定を使用
  const timeLeft = mode === GameMode.CHALLENGE 
    ? difficultyConfig.time.initial 
    : modeConfig.time.initial;
  
  return {
    mode,
    difficulty,
    timeLeft,
    isActive: false,
    score: 0,
    problemCount: 0,
    correctCount: 0,
    skippedCount: 0,
    totalSolveTime: 0,
    skipCount: mode === GameMode.CHALLENGE ? modeConfig.gameplay.skipLimit : 999,
    currentCombo: 0,
    lastProblemScore: 0,
    lastTimeBonus: 0,
    comboExpiresAt: 0,
    maxCombo: 0,
    scoreBreakdown: { ...EMPTY_SCORE_BREAKDOWN },
    finalBonus: 0,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  // 初期状態
  gameState: createInitialGameState(GameMode.CHALLENGE, DEFAULT_DIFFICULTY),
  gameStatus: GameStatus.MENU,
  targetNumber: 0,
  currentProblem: {
    numbers: [],
    target: 0,
    difficulty: DEFAULT_DIFFICULTY,
  },
  highScores: {
    challenge: {
      [DifficultyLevel.EASY]: 0,
      [DifficultyLevel.NORMAL]: 0,
      [DifficultyLevel.HARD]: 0,
    },
    infinite: {
      [DifficultyLevel.EASY]: 0,
      [DifficultyLevel.NORMAL]: 0,
      [DifficultyLevel.HARD]: 0,
    },
  },
  nodes: [],
  selectedNodeId: null,
  history: [],
  historyIndex: -1,
  comboTracker: new ComboTracker(),
  problemStartTime: Date.now(),
  navigationCallback: null,
  timerInterval: null,
  wrongAnswerCount: 0,
  
  // ランキング関連の初期状態
  isSubmittingScore: false,
  rankingSubmissionResult: null,
  
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
  initGame: async (mode: GameMode, difficulty: DifficultyLevel = DEFAULT_DIFFICULTY) => {
    // 難易度別のハイスコアを読み込み
    const savedHighScores = await loadAllHighScoresWithDifficulty();
    
    // コンボトラッカーをリセット
    if (mode === GameMode.CHALLENGE) {
      get().comboTracker.reset();
    }
    
    set({
      gameState: createInitialGameState(mode, difficulty),
      gameStatus: GameStatus.COUNTDOWN,
      highScores: savedHighScores,
      rankingSubmissionResult: null,
    });
    
    // コア（問題生成）は自己記録や計測の I/O を待たない
    get().generateNewProblem();
    
    // 自己記録（ゲーム数・連続プレイ日数）を進め、初めてのゲームかどうかを計測のファネルに使う。
    // 失敗しても記録と計測が欠けるだけでゲームは進む
    useStatsStore
      .getState()
      .recordGameStart()
      .then(stats => {
        analyticsService.logEvent('game_start', {
          mode,
          difficulty,
          games_played: stats.gamesPlayed,
          is_first_game: stats.gamesPlayed === 1,
          streak_days: stats.streakDays,
        });
      })
      .catch(() => {
        analyticsService.logEvent('game_start', { mode, difficulty });
      });
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
    const state = get();
    const difficulty = state.gameState.difficulty;
    const problem = generateProblem(difficulty);
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
        // 丸めずに保持する（(1÷3)×3 が 0.99 にならないように）。表示側で丸める
        result = firstNode.value / secondNode.value;
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
    hapticService.connect();
    
    // パズル完成チェック
    const activeNodes = updatedNodes.filter(n => !n.isUsed);
    if (activeNodes.length === 1) {
      const finalValue = activeNodes[0].value;
      const isCorrect = Math.abs(finalValue - state.targetNumber) < 0.001;
      
      if (isCorrect) {
        set({ gameStatus: GameStatus.CORRECT });
        
        // 問題正解効果音
        soundManager.play(SoundType.CORRECT);
        hapticService.success();
        
        // スコア更新
        const { gameState: game } = state;
        const difficultyConfig = getDifficultyConfig(game.difficulty);
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
          const breakdown = calculateScoreBreakdown(problemResult, currentCombo);
          const problemScore = breakdown.base + breakdown.time + breakdown.target + breakdown.combo;
          
          // 時間ボーナスは正解のたびに減り、下限で下げ止まる
          const timeBonus = calculateTimeBonus(difficultyConfig.time, game.correctCount);
          
          set({
            gameState: {
              ...game,
              score: game.score + problemScore,
              problemCount: game.problemCount + 1,
              correctCount: game.correctCount + 1,
              totalSolveTime: game.totalSolveTime + solveTime,
              timeLeft: game.timeLeft + timeBonus,
              currentCombo,
              comboExpiresAt: Date.now() + SCORE_CONFIG.COMBO_TIME_LIMIT,
              maxCombo: Math.max(game.maxCombo, currentCombo),
              lastProblemScore: problemScore,
              lastTimeBonus: timeBonus,
              scoreBreakdown: {
                base: game.scoreBreakdown.base + breakdown.base,
                time: game.scoreBreakdown.time + breakdown.time,
                target: game.scoreBreakdown.target + breakdown.target,
                combo: game.scoreBreakdown.combo + breakdown.combo,
              },
            },
          });
        } else {
          // 無限モードの正解数更新
          set({
            gameState: {
              ...game,
              score: game.score + 1,
              problemCount: game.problemCount + 1,
              correctCount: game.correctCount + 1,
              totalSolveTime: game.totalSolveTime + solveTime,
            },
          });
        }
        
        analyticsService.logEvent('problem_solved', {
          mode: game.mode,
          difficulty: game.difficulty,
          solve_time: Math.round(solveTime),
        });
        // 生まれて初めての正解は一度だけ別イベントに（初回起動→初正解のファネル）
        playerStatsService.markFirstSolve().then(isFirst => {
          if (isFirst) {
            analyticsService.logEvent('first_problem_solved', {
              mode: game.mode,
              difficulty: game.difficulty,
              solve_time: Math.round(solveTime),
            });
          }
        });
        
        // 次の問題を生成（待っている間にリスタートや終了が行われた場合は何もしない）
        setTimeout(() => {
          if (get().gameStatus === GameStatus.CORRECT) {
            get().generateNewProblem();
          }
        }, 1500);
      } else {
        // 不正解: 音・振動・揺れで知らせる（戻すボタンでやり直せる）
        soundManager.play(SoundType.WRONG);
        hapticService.error();
        set({ wrongAnswerCount: state.wrongAnswerCount + 1 });
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
        skippedCount: game.skippedCount + 1,
      }
    });
    
    analyticsService.logEvent('problem_skipped', {
      mode: game.mode,
      difficulty: game.difficulty,
    });
    
    get().generateNewProblem();
  },
  
  // ランキングにスコアを提出
  submitScoreToRanking: async (displayName: string) => {
    const state = get();
    const { gameState: game } = state;
    
    try {
      set({ isSubmittingScore: true, rankingSubmissionResult: null });
      
      const submission: ScoreSubmission = {
        mode: game.mode,
        difficulty: game.difficulty,
        score: game.finalScore ?? game.score,
        problemCount: game.correctCount,
        timestamp: Date.now(),
        displayName: displayName.trim(),
      };
      
      const success = await rankingService.submitScore(submission);
      
      set({ 
        isSubmittingScore: false, 
        rankingSubmissionResult: success 
      });
      
      return success;
    } catch (error) {
      console.error('Failed to submit score to ranking:', error);
      set({ 
        isSubmittingScore: false, 
        rankingSubmissionResult: false 
      });
      return false;
    }
  },

  // ゲーム終了処理
  endGame: async (isManual: boolean = false, displayName?: string) => {
    const state = get();
    const { gameState: game } = state;
    
    // タイマー停止
    get().stopTimer();
    
    const previousHighScore = state.highScores[game.mode][game.difficulty];
    
    // チャレンジモードは最終ボーナスを追加（スキップした問題は正解数に含めない）
    const finalBonus = game.mode === GameMode.CHALLENGE
      ? calculateFinalBonus(game.score, game.correctCount)
      : 0;
    const finalScore = game.score + finalBonus;
    
    // ハイスコア判定
    const isNewHighScore = finalScore > previousHighScore;
    
    // ランキング対象はチャレンジモードのみ
    const nameToUse = displayName && displayName.trim().length > 0
      ? displayName
      : useSettingsStore.getState().displayName;
    const canSubmit = game.mode === GameMode.CHALLENGE
      && !!nameToUse && nameToUse.trim().length > 0;
    
    // 状態を更新
    // リザルト画面が「送信完了を待ってから順位を取得」できるよう、送信中フラグは遷移前に立てる
    set({
      gameStatus: isManual ? GameStatus.MANUALLY_ENDED : GameStatus.TIMEUP,
      gameState: {
        ...game,
        isActive: false,
        finalScore,
        finalBonus,
      },
      isSubmittingScore: canSubmit && isNewHighScore,
    });
    
    // ハイスコア保存
    if (isNewHighScore) {
      await saveHighScoreWithDifficulty(game.mode, game.difficulty, finalScore);
      set({
        highScores: {
          ...state.highScores,
          [game.mode]: {
            ...state.highScores[game.mode],
            [game.difficulty]: finalScore,
          },
        },
      });
    }
    
    // 累計正解数を自己記録に足す（失敗してもゲーム進行に影響させない）
    useStatsStore.getState().recordGameEnd(game.correctCount).catch(() => {});
    
    analyticsService.logEvent('game_end', {
      mode: game.mode,
      difficulty: game.difficulty,
      score: finalScore,
      correct_count: game.correctCount,
      skipped_count: game.skippedCount,
      max_combo: game.maxCombo,
      is_new_high_score: isNewHighScore,
      is_manual: isManual,
      games_played: useStatsStore.getState().stats.gamesPlayed,
    });
    
    // リザルト画面への遷移
    // （インタースティシャル広告はスコアを見る瞬間を遮らないよう、リザルト画面を離れる時に表示する）
    const navigationCallback = state.navigationCallback;
    if (navigationCallback && !isManual) {
      setTimeout(() => {
        navigationCallback({
          finalScore,
          isNewHighScore,
          previousHighScore,
          mode: game.mode === GameMode.CHALLENGE ? 'challenge' : 'infinite',
          difficulty: game.difficulty,
        });
      }, 100);
    }
    
    // ランキングへの送信は待たない（タイムアップ時のリザルト遷移も、手動終了時のメニュー遷移も
    // 通信の完了を待たせない）。どちらも内部で例外を処理するため投げっぱなしでよい
    if (canSubmit) {
      if (isNewHighScore) {
        get().submitScoreToRanking(nameToUse);
      } else {
        // 過去に通信エラーなどで送信できなかった自己ベストがあれば再送する
        rankingService.retryUnsentScore(game.difficulty, nameToUse.trim());
      }
    }
  },
  
  // ナビゲーションコールバック設定
  setNavigationCallback: (callback: (params: any) => void) => {
    set({ navigationCallback: callback });
  },
  
  // 最後の操作を取り消し
  undoLastMove: () => {
    const state = get();
    if (!state.canUndo()) return;

    const previousNodes = state.history[state.historyIndex - 1];
    set({
      nodes: JSON.parse(JSON.stringify(previousNodes)),
      selectedNodeId: null,
      historyIndex: state.historyIndex - 1,
    });
  },
  
  // 取り消し可能かチェック
  // 組み立て中のみ。正解演出中に戻せると、同じ問題でスコアと時間ボーナスを何度でも取り直せてしまう
  canUndo: () => {
    const state = get();
    return state.gameStatus === GameStatus.BUILDING && state.historyIndex > 0;
  },
  
  // 保存されたデータを読み込み
  loadStoredData: async () => {
    const highScores = await loadAllHighScoresWithDifficulty();
    set({ highScores });
  },
}));