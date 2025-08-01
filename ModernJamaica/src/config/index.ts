/**
 * Configuration module exports
 * 設定駆動アーキテクチャの中心となる設定をエクスポート
 */

export * from './gameMode';
export * from './dialogs';

// 設定の統合オブジェクト（将来の拡張用）
export const CONFIG = {
  // 必要に応じて他の設定も統合
} as const;