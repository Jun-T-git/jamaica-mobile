import React, { ReactNode, useEffect } from 'react';
import { StatusBar, StatusBarStyle, Platform } from 'react-native';

interface StatusBarManagerProps {
  children: ReactNode;
  
  // StatusBarの責務のみ - プラットフォーム固有の制御
  barStyle?: StatusBarStyle;
  hidden?: boolean;
  backgroundColor?: string; // Android用
}

/**
 * StatusBar専用管理コンポーネント
 * 
 * 責務: アプリ全体のStatusBar統一管理
 * - プラットフォーム固有の設定（iOS/Android差分）
 * - StatusBarの表示・非表示制御
 * - カラーテーマの統一
 * 
 * 管理しないもの:
 * - レイアウト（SafeAreaLayoutの責務）
 * - 広告表示（AdProviderの責務）
 * - 画面固有の設定（各画面で必要に応じてオーバーライド）
 * 
 * コンポーネントで管理する理由:
 * - プラットフォーム固有の処理が複雑
 * - アプリ全体で一貫した設定が必要
 * - 画面個別で設定すると重複・不整合が発生
 */
export const StatusBarManager: React.FC<StatusBarManagerProps> = ({
  children,
  barStyle = 'light-content', // Jamaica Mobile標準
  hidden = false,
  backgroundColor = 'transparent',
}) => {
  useEffect(() => {
    // iOS/Android共通の設定
    StatusBar.setBarStyle(barStyle, true);
    StatusBar.setHidden(hidden, 'fade');
    
    // Android固有の設定
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(backgroundColor, true);
      StatusBar.setTranslucent(true);
    }
  }, [barStyle, hidden, backgroundColor]);
  
  // StatusBarManagerはUIを持たない - 純粋な制御コンポーネント
  return <>{children}</>;
};

export default StatusBarManager;