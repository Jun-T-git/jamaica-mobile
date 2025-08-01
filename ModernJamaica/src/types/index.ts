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

export interface ProblemData {
  numbers: number[];
  target: number;
  solutions?: string[];
  difficulty: 'easy' | 'normal' | 'hard';
}

// 統一されたゲーム状態
export interface UnifiedGameState {
  // 共通フィールド
  mode: GameMode;
  timeLeft: number;
  isActive: boolean;
  score: number;           // チャレンジ: 計算スコア, 無限: 正解数
  problemCount: number;    // 試行した問題数
  
  // チャレンジモード専用
  skipCount: number;       // 残りスキップ回数（無限モードでは999）
  currentCombo: number;    // 現在のコンボ数（無限モードでは0）
  lastProblemScore: number; // 直前の問題のスコア（無限モードでは0）
  
  // 終了時のスコア
  finalScore?: number;
}

export interface GameState {
  // ゲーム状態
  gameState: UnifiedGameState;
  gameStatus: GameStatus;
  targetNumber: number;
  currentProblem: ProblemData;
  
  // ハイスコア管理
  highScores: {
    challenge: number;
    infinite: number;
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