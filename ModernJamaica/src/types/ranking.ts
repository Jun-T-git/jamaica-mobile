import { GameMode, DifficultyLevel } from './index';

// 設計書に基づくスコアデータ構造
export interface ChallengeScore {
  score: number;           // finalScore（現在の計算式）
  timestamp: number;       // 記録日時
  problemCount: number;    // 総問題数
  rawScore?: number;       // 基本スコア（設計書互換用）
}

// ユーザースコアドキュメント（Firestore）- チャレンジモード専用
export interface UserScoreDocument {
  userId: string;          // ユニークユーザーID
  displayName: string;     // 表示名
  createdAt: number;       // 初回登録日時
  lastUpdated: number;     // 最終更新日時
  challengeScores: {
    easy: ChallengeScore;
    normal: ChallengeScore;
    hard: ChallengeScore;
  };
}

// ランキング表示用データ構造
export interface RankingEntry {
  rank: number;            // 順位
  userId: string;          // ユーザーID
  displayName: string;     // 表示名
  score: number;           // スコア
  problemCount: number;    // 問題数
  timestamp: number;       // 記録日時
  isCurrentUser?: boolean; // 現在のユーザーかどうか
}

// ランキング取得用パラメータ
export interface RankingQuery {
  mode: GameMode;
  difficulty: DifficultyLevel;
  limit?: number;          // 取得件数（デフォルト10）
}

// スコア提出用データ
export interface ScoreSubmission {
  mode: GameMode;
  difficulty: DifficultyLevel;
  score: number;
  problemCount: number;
  timestamp: number;
  displayName: string;
}

// ランキング統計情報
export interface RankingStats {
  totalUsers: number;      // 総参加ユーザー数
  lastUpdate: number;      // 最終更新時刻
}

// ユーザーランク情報
export interface UserRankInfo {
  rank: number | null;     // 順位（null = ランク外）
  totalUsers: number;      // 総ユーザー数
  percentile?: number;     // パーセンタイル
}

// ランキング画面用の状態
export interface RankingState {
  rankings: {
    [gameMode in GameMode]: {
      [difficultyLevel in DifficultyLevel]: RankingEntry[];
    };
  };
  userRanks: {
    [gameMode in GameMode]: {
      [difficultyLevel in DifficultyLevel]: UserRankInfo;
    };
  };
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}