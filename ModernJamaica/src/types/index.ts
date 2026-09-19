import { ScoreBreakdown } from '../constants/scoreConfig';

export enum GameMode {
  CHALLENGE = 'challenge',
  INFINITE = 'infinite',
}

export enum GameStatus {
  MENU = 'menu',
  COUNTDOWN = 'countdown',
  BUILDING = 'building',
  COMPLETE = 'complete',
  CORRECT = 'correct',
  TIMEUP = 'timeup',
  MANUALLY_ENDED = 'manually_ended',
}

export enum Operator {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '×',
  DIVIDE = '÷',
}

export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

export interface ProblemData {
  numbers: number[];
  target: number;
  solutions?: string[];
  solutionCount?: number;  // 人が見つけやすい解の数（難易度制御用）
  difficulty: DifficultyLevel;
}

// 統一されたゲーム状態
export interface UnifiedGameState {
  // 共通フィールド
  mode: GameMode;
  difficulty: DifficultyLevel;  // 難易度設定
  timeLeft: number;
  isActive: boolean;
  score: number;           // チャレンジ: 計算スコア, 無限: 正解数
  problemCount: number;    // 試行した問題数（正解 + スキップ）
  correctCount: number;    // 正解した問題数（スキップは含めない）
  skippedCount: number;    // スキップした問題数
  totalSolveTime: number;  // 正解した問題の回答時間の合計（秒）
  
  // チャレンジモード専用
  skipCount: number;       // 残りスキップ回数（無限モードでは999）
  currentCombo: number;    // 現在のコンボ数（無限モードでは0）
  lastProblemScore: number; // 直前の問題のスコア（無限モードでは0）
  lastTimeBonus: number;    // 直前の正解で得た時間ボーナス（秒。無限モードでは0）
  comboExpiresAt: number;  // この時刻（ミリ秒）までに次を正解するとコンボ継続
  maxCombo: number;        // ゲーム中の最大コンボ数
  scoreBreakdown: ScoreBreakdown; // 獲得スコアの内訳（累計）
  finalBonus: number;      // 終了時の最終ボーナス
  
  // 終了時のスコア
  finalScore?: number;
}

export interface GameState {
  // ゲーム状態
  gameState: UnifiedGameState;
  gameStatus: GameStatus;
  targetNumber: number;
  currentProblem: ProblemData;
  
  // ハイスコア管理（難易度別）
  highScores: {
    challenge: Record<DifficultyLevel, number>;
    infinite: Record<DifficultyLevel, number>;
  };
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  value: number;
  position: Position;
  isLeaf: boolean;
  operator?: Operator;
  leftChildId?: string;
  rightChildId?: string;
  parentId?: string;
  depth: number;
  isUsed: boolean;
}