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

export interface ChallengeState {
  timeLeft: number;
  problemCount: number;
  skipCount: number;  // Changed from resetCount to skipCount
  isActive: boolean;
  finalScore?: number;
  currentScore: number;
  currentCombo: number;
  lastProblemScore: number;
  totalTime: number;  // Total time spent on solved problems
  solvedProblems: number;  // Number of problems correctly solved
}

export interface InfiniteStats {
  totalProblems: number;
  correctAnswers: number;
  averageTime: number;
  longestStreak: number;
  currentStreak: number;
  timeLeft: number;
  highScore: number;
  isActive: boolean;
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