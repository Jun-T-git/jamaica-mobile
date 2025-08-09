import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../../services/adService';
import { ModernDesign } from '../../constants';

interface BannerAdViewProps {
  style?: any;
  onHeightChange?: (height: number) => void; // 高さ変更コールバック
}

export const BannerAdView: React.FC<BannerAdViewProps> = ({ style, onHeightChange }) => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [adHeight, setAdHeight] = useState(50); // 最小保証値50dpで初期化
  
  const adUnitId = adService.getBannerAdUnitId();
  
  // 初期化ログ（デバッグ用）
  useEffect(() => {
    try {
      console.log('🔧 ===== BANNER AD INIT =====');
      console.log('🎯 Ad Unit ID:', String(adUnitId || 'undefined'));
      console.log('🔧 Is Dev Mode:', String(__DEV__));
      console.log('📱 Platform:', String(Platform.OS));
      console.log('🎭 Using TestIds:', __DEV__ ? 'YES' : 'NO');
      console.log('============================');
    } catch (loggingError) {
      console.error('🔥 Init logging error:', String(loggingError));
    }
  }, [adUnitId]);
  
  if (!adUnitId) {
    console.log('⚠️ No Ad Unit ID found - showing placeholder');
    // 広告IDがない場合は空のViewを返してレイアウト崩れを防ぐ
    return (
      <View style={styles.container}>
        <View style={{ height: 50, width: '100%' }} />
      </View>
    );
  }

  // Adaptiveバナーに統一（ベストプラクティス）
  // 最小50dp、最大画面の15%を自動で調整
  const getBannerSize = (): BannerAdSize => {
    return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
  };

  // 初期推定高さ（Adaptiveバナーの最小保証値）
  const getEstimatedHeight = (): number => {
    return 50; // Googleの仕様で最小50dp保証
  };

  const handleAdLoaded = useCallback((dimensions: { width: number; height: number }) => {
    try {
      console.log('🎉 ========= BANNER AD SUCCESS =========');
      console.log('✅ Adaptive banner ad loaded successfully!');
      console.log('📏 Dimensions:', String(dimensions?.width || 0) + 'x' + String(dimensions?.height || 0));
      console.log('🎯 Ad Unit ID:', String(adUnitId || 'undefined'));
      console.log('🔧 Is Dev Mode:', String(__DEV__));
      console.log('📱 Platform:', String(Platform.OS));
      console.log('⚡ Status: AD WILL BE VISIBLE');
      console.log('=====================================');
    } catch (loggingError) {
      console.error('🔥 Ad loaded logging error:', String(loggingError));
    }
    
    setIsAdLoaded(true);
    setAdHeight(dimensions?.height || 50);
    
    // 親コンポーネントに高さ変更を通知
    if (onHeightChange && dimensions?.height) {
      onHeightChange(dimensions.height);
    }
  }, [adUnitId, onHeightChange]);

  const handleAdFailedToLoad = useCallback((error: any) => {
    try {
      const errorCode = (error as any)?.code;
      
      // NoAdsToShow は開発環境では正常な動作
      if (error?.message?.includes('No ad to show') || errorCode === 1) {
        console.log('📍 ======== BANNER AD NO FILL ========');
        console.log('ℹ️ No ads available (normal in development/low traffic)');
        console.log('🎯 Ad Unit ID:', String(adUnitId || 'undefined'));
        console.log('🔧 Is Dev Mode:', String(__DEV__));
        console.log('📱 Platform:', String(Platform.OS));
        console.log('✅ Status: NORMAL - Layout preserved');
        console.log('💡 This is EXPECTED in development');
        console.log('=====================================');
      } else {
        console.log('🚨 ======== BANNER AD ERROR ========');
        console.error('❌ Banner ad failed to load with unexpected error!');
        console.error('🎯 Ad Unit ID:', String(adUnitId || 'undefined'));
        console.error('🔧 Is Dev Mode:', String(__DEV__));
        console.error('📱 Platform:', String(Platform.OS));
        
        // エラーオブジェクトを安全に出力
        console.error('📋 Error details:');
        if (error && typeof error === 'object') {
          console.error('  - Message:', String(error.message || 'No message'));
          console.error('  - Code:', String(error.code || 'No code'));
          console.error('  - Domain:', String(error.domain || 'No domain'));
        } else {
          console.error('  - Raw error:', String(error));
        }
        console.error('⚠️ Status: NEEDS INVESTIGATION');
        console.error('===================================');
      }
    } catch (loggingError) {
      // ログ出力でエラーが発生した場合の fallback
      console.error('🔥 Logging error occurred:', String(loggingError));
    }
    
    setIsAdLoaded(false);
    // エラー時も最小高さを維持してレイアウト崩れを防ぐ
    setAdHeight(50);
  }, [adUnitId]);

  // 常に最下部固定のスタイル
  const getContainerStyle = () => {
    return {
      ...styles.container,
      height: adHeight,
      minHeight: 50,
    };
  };

  return (
    <View 
      style={[
        getContainerStyle(),
        style, // カスタムスタイルで上書き可能
      ]}
    >
      <BannerAd
        unitId={String(adUnitId)}
        size={getBannerSize()}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ModernDesign.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: ModernDesign.colors.border.subtle,
    zIndex: 1000, // 他の要素の上に表示
  },
});