import { GameMode } from '../types';

export interface DialogContent {
  title: string;
  message: string;
  confirmText: string;
}

export interface DialogConfig {
  restart: DialogContent;
  exit: DialogContent;
}

/**
 * モードごとのダイアログテキスト設定
 */
export const DIALOG_CONFIG: Record<GameMode, DialogConfig> = {
  [GameMode.CHALLENGE]: {
    restart: {
      title: 'チャレンジをリスタート',
      message: '新しいチャレンジを開始しますか？\n\n現在の進行状況が失われます',
      confirmText: 'リスタート',
    },
    exit: {
      title: 'チャレンジ終了',
      message: 'チャレンジを終了してメインメニューに戻りますか？\n\n達成したスコアが保存されます',
      confirmText: '終了する',
    },
  },
  [GameMode.INFINITE]: {
    restart: {
      title: '最初からやり直し',
      message: '練習を最初からやり直しますか？\n\n現在の記録はリセットされます',
      confirmText: 'やり直す',
    },
    exit: {
      title: '練習終了',
      message: '練習を終了してメインメニューに戻りますか？\n\n達成した記録が保存されます',
      confirmText: '終了する',
    },
  },
} as const;

/**
 * 指定されたモードのダイアログ設定を取得
 */
export const getDialogConfig = (mode: GameMode): DialogConfig => {
  return DIALOG_CONFIG[mode];
};