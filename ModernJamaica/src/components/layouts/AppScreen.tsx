import React, { ReactNode, useMemo } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Edge } from 'react-native-safe-area-context';
import { SafeAreaLayout } from './SafeAreaLayout';
import { StatusBarManager } from '../system/StatusBarManager';
import { AdProvider, useAdContext } from '../../providers/AdProvider';
import { BannerAdView } from '../molecules/BannerAdView';
import { ModernDesign } from '../../constants';

// 内部コンポーネント：広告対応コンテンツ
const AdAwareContent: React.FC<{
  children: ReactNode;
  contentStyle?: ViewStyle; // 画面固有のスタイルを受け取る
}> = ({ children, contentStyle }) => {
  const { bannerHeight } = useAdContext();
  
  // コンポーネント管理：技術的制約（広告SDK連携）
  const technicalConstraints = useMemo((): ViewStyle => ({
    flex: 1, // 基本レイアウト構造
    paddingBottom: bannerHeight > 0 ? bannerHeight + 10 : 0, // 広告余白
  }), [bannerHeight]);
  
  return (
    <View style={[technicalConstraints, contentStyle]}>
      {children}
    </View>
  );
};

interface AppScreenProps {
  children: ReactNode;
  
  // コンポーネント管理：技術的制約
  safeAreaEdges?: Edge[]; // SafeAreaLayoutへ委譲
  statusBarStyle?: 'light-content' | 'dark-content'; // StatusBarManagerへ委譲
  adEnabled?: boolean; // AdProviderへ委譲
  backgroundColor?: string; // SafeAreaLayoutへ委譲
  
  // 画面管理：デザイン・ビジネス要件
  contentContainerStyle?: ViewStyle; // 画面固有のコンテンツスタイル
  containerStyle?: ViewStyle; // SafeAreaLayoutのカスタマイズ
  
  testID?: string;
}

/**
 * Jamaica Mobile専用統合スクリーンレイアウト
 * 
 * 責務: 各専門コンポーネントの合成によるレイアウト構築
 * - SafeAreaLayout + StatusBarManager + AdProviderの統合
 * - Jamaica Mobileの標準レイアウトパターンの提供
 * - プロパティの適切な委譲
 * 
 * 管理しないもの:
 * - SafeArea計算（SafeAreaLayoutに委譲）
 * - StatusBar制御（StatusBarManagerに委譲）  
 * - 広告表示・エラー処理（AdProviderに委譲）
 * - 画面固有のビジネスロジック（各画面の責務）
 * 
 * コンポーネントで管理する理由:
 * - 3つの独立したコンポーネントの統合が必要
 * - Jamaica Mobileの標準パターンを1箇所で定義
 * - 各画面での重複コードを削減
 * 
 * 設計パターン:
 * - 合成によるコンポーネント結合（継承ではない）
 * - 各責務が独立（SafeArea, StatusBar, Ad）
 * - 依存関係逆転（AdContextによる注入）
 * - 制御の逆転（親から設定を注入）
 */
export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  safeAreaEdges = ['top', 'bottom'], // Jamaica Mobile標準
  statusBarStyle = 'light-content', // Jamaica Mobile標準
  adEnabled = true, // Jamaica Mobile標準（5/8画面で使用）
  backgroundColor,
  contentContainerStyle,
  containerStyle,
  testID,
}) => {
  // BannerAdViewを依存注入として提供
  const renderBanner = ({ style, onHeightChange }: { style: any; onHeightChange: (height: number) => void }) => (
    <BannerAdView style={style} onHeightChange={onHeightChange} />
  );

  return (
    <StatusBarManager barStyle={statusBarStyle}>
      <AdProvider 
        enabled={adEnabled}
        renderBanner={renderBanner}
      >
        <SafeAreaLayout
          edges={safeAreaEdges}
          backgroundColor={backgroundColor}
          style={containerStyle}
          testID={testID}
        >
          <AdAwareContent contentStyle={contentContainerStyle}>
            {children}
          </AdAwareContent>
        </SafeAreaLayout>
      </AdProvider>
    </StatusBarManager>
  );
};

// 基本スタイル定義をAppScreenに統合（循環インポートを回避）
export const AppScreenStyles = StyleSheet.create({
  // 基本レイアウト構造（全画面共通）
  screenContainer: {
    flex: 1,
  },
  
  // 標準的なコンテンツコンテナー
  contentContainer: {
    flex: 1,
  },
  
  // 中央配置レイアウト（多くの画面で使用）
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // ヘッダー付きレイアウト（メニュー画面で使用）
  headerLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  // 標準的なパディング
  standardPadding: {
    paddingHorizontal: ModernDesign.spacing[4],
  },
  
  // 基本的なヘッダースタイル
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ModernDesign.spacing[4],
  },
  
  // 基本的なフッタースタイル
  footerContainer: {
    paddingHorizontal: ModernDesign.spacing[4],
    paddingVertical: ModernDesign.spacing[3],
  },
});

export default AppScreen;