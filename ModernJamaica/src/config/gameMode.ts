import { GameMode } from '../types';

export interface TimeConfig {
  initial: number;    // 初期時間（秒）
  bonus: number;      // 正解時のボーナス時間（秒）
  warning: number;    // 警告表示の閾値（秒）
}

export interface GameplayConfig {
  skipLimit: number;  // スキップ回数制限（Infinityで無制限）
}

export interface DisplayConfig {
  headerLabel: string;              // ヘッダーに表示するラベル
  scoreFormatter: (score: number) => string;  // スコア表示形式
}

export interface StorageConfig {
  key: string;        // LocalStorage保存キー
}

export interface AdConfig {
  enabled: boolean;   // 広告表示の有効/無効
  timing: 'immediate' | 'delayed';  // 広告表示タイミング
}

export interface GameModeConfig {
  time: TimeConfig;
  gameplay: GameplayConfig;
  display: DisplayConfig;
  storage: StorageConfig;
  ad: AdConfig;
}

/**
 * ゲームモードごとの設定
 * すべてのモード固有の動作はここで制御
 */
export const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  [GameMode.CHALLENGE]: {
    time: {
      initial: 60,      // 1分
      bonus: 10,        // +10秒
      warning: 10,      // 10秒で警告
    },
    gameplay: {
      skipLimit: 2,     // 2回まで
    },
    display: {
      headerLabel: 'スコア',
      scoreFormatter: (score: number) => score.toLocaleString(),
    },
    storage: {
      key: '@jamaica_challenge_high_score',
    },
    ad: {
      enabled: true,
      timing: 'immediate',
    },
  },
  [GameMode.INFINITE]: {
    time: {
      initial: 300,     // 5分
      bonus: 0,         // ボーナスなし
      warning: 30,      // 30秒で警告
    },
    gameplay: {
      skipLimit: Infinity, // 無制限
    },
    display: {
      headerLabel: '正解数',
      scoreFormatter: (score: number) => `${score}問`,
    },
    storage: {
      key: '@jamaica_infinite_high_score',
    },
    ad: {
      enabled: true,
      timing: 'immediate',
    },
  },
} as const;

/**
 * 指定されたモードの設定を取得
 */
export const getGameModeConfig = (mode: GameMode): GameModeConfig => {
  return GAME_MODE_CONFIG[mode];
};

/**
 * 時間に応じた警告色を取得
 */
export const getTimeWarningColor = (
  timeLeft: number, 
  mode: GameMode, 
  normalColor: string, 
  warningColor: string
): string => {
  const config = getGameModeConfig(mode);
  return timeLeft <= config.time.warning ? warningColor : normalColor;
};