export enum GameMode {
  CHALLENGE = 'challenge',
  INFINITE = 'infinite',
}

export enum GameStatus {
  MENU = 'menu',
  BUILDING = 'building',
  COMPLETE = 'complete',
  CORRECT = 'correct',
  TIMEUP = 'timeup',
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

export interface ChallengeState {
  timeLeft: number;
  problemCount: number;
  skipCount: number;  // Changed from resetCount to skipCount
  isActive: boolean;
  finalScore?: number;
}

export interface InfiniteStats {
  totalProblems: number;
  correctAnswers: number;
  averageTime: number;
  longestStreak: number;
  currentStreak: number;
}

export interface GameState {
  mode: GameMode;
  targetNumber: number;
  gameStatus: GameStatus;
  currentProblem: ProblemData;
  challengeState?: ChallengeState;
  infiniteStats?: InfiniteStats;
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