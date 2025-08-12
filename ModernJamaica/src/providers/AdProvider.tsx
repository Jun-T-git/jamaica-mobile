import React, { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

// Context for Dependency Injection
interface AdContextValue {
  bannerHeight: number;
  showBanner: boolean;
  bannerError: boolean;
}

const AdContext = createContext<AdContextValue | null>(null);

interface AdProviderProps {
  children: ReactNode;
  
  // 広告の責務のみ - ビジネスロジック
  enabled?: boolean;
  position?: 'top' | 'bottom';
  onError?: () => void;
  
  // Dependency Injection: BannerAdViewの依存を外部から注入
  renderBanner?: (props: {
    style: ViewStyle;
    onHeightChange: (height: number) => void;
  }) => ReactNode;
}

/**
 * 広告管理Provider（横断的関心事）
 * 
 * 責務: アプリ全体の広告表示管理
 * - AdMob SDKとの連携
 * - 広告エラー時のフォールバック
 * - 広告高さの動的計算と通知
 * - 広告表示スペースの確保
 * 
 * 管理しないもの:
 * - SafeArea（SafeAreaLayoutの責務）
 * - StatusBar（StatusBarManagerの責務）
 * - 画面固有のコンテンツ（各画面の責務）
 * 
 * コンポーネントで管理する理由:
 * - AdMob SDKとの連携が複雑
 * - 広告エラー処理が必要
 * - 全画面で一貫した広告表示が必要
 * - 広告高さの動的変更に対応が必要
 * 
 * Contextを使用する理由:
 * - 子コンポーネントが広告状態を参照できる
 * - プロップドリリングを回避
 * - 依存関係の注入による疎結合
 */
export const AdProvider: React.FC<AdProviderProps> = ({
  children,
  enabled = true,
  position = 'bottom', // Jamaica Mobile標準
  onError,
  renderBanner, // 依存注入されたBannerコンポーネント
}) => {
  const [bannerHeight, setBannerHeight] = useState(50); // AdMob最小保証値
  const [bannerError, setBannerError] = useState(false);
  const [showBanner, setShowBanner] = useState(enabled);
  
  // 広告高さ変更ハンドラー（AdMobからのコールバック）
  const handleBannerHeightChange = useCallback((height: number) => {
    setBannerHeight(height);
    setBannerError(false);
  }, []);
  
  // 広告エラーハンドラー（グレースフルデグラデーション）
  const handleBannerError = useCallback(() => {
    setBannerError(true);
    setShowBanner(false);
    onError?.(); // 画面側にエラーを通知（必要に応じて）
  }, [onError]);
  
  // Context値の提供（依存関係注入）
  const contextValue: AdContextValue = {
    bannerHeight: showBanner ? bannerHeight : 0,
    showBanner: showBanner && !bannerError,
    bannerError,
  };
  
  return (
    <AdContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}
        
        {/* 広告表示：エラー時は非表示、依存注入による柔軟性 */}
        {showBanner && !bannerError && renderBanner && 
          renderBanner({
            style: [
              styles.banner,
              position === 'bottom' ? styles.bannerBottom : styles.bannerTop,
            ],
            onHeightChange: handleBannerHeightChange,
          })
        }
      </View>
    </AdContext.Provider>
  );
};

// Custom Hook for Dependency Injection
export const useAdContext = (): AdContextValue => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAdContext must be used within AdProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000, // 他の要素より前面に表示
  },
  bannerTop: {
    top: 0,
  },
  bannerBottom: {
    bottom: 0,
  },
});

export default AdProvider;