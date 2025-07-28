import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../../services/adService';
import { ModernDesign } from '../../constants';

const { width: screenWidth } = Dimensions.get('window');

interface BannerAdViewProps {
  style?: any;
}

export const BannerAdView: React.FC<BannerAdViewProps> = ({ style }) => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [adHeight, setAdHeight] = useState(0);
  
  const adUnitId = adService.getBannerAdUnitId();
  
  if (!adUnitId) {
    return null;
  }

  // モバイルゲームに最適化されたバナーサイズを選択
  const getBannerSize = (): BannerAdSize => {
    // 小さな画面（iPhone SE等）
    if (screenWidth <= 375) {
      return BannerAdSize.BANNER; // 320x50 - コンパクト
    }
    
    // 標準的な画面サイズ
    if (screenWidth <= 414) {
      return BannerAdSize.LARGE_BANNER; // 320x100 - より見やすい
    }
    
    // 大きな画面（iPad等）
    if (screenWidth >= 768) {
      return BannerAdSize.LEADERBOARD; // 728x90 - タブレット最適化
    }
    
    // デフォルトはスマートバナー
    return BannerAdSize.SMART_BANNER;
  };

  // 広告サイズに基づく推定高さ
  const getEstimatedHeight = (): number => {
    const bannerSize = getBannerSize();
    
    if (bannerSize === BannerAdSize.BANNER) return 50;
    if (bannerSize === BannerAdSize.LARGE_BANNER) return 100;
    if (bannerSize === BannerAdSize.LEADERBOARD) return 90;
    
    // スマートバナーのデフォルト高さ
    return Platform.OS === 'ios' ? 50 : 50;
  };

  const handleAdLoaded = (dimensions: { width: number; height: number }) => {
    console.log('✅ Banner ad loaded successfully!');
    console.log(`📏 Dimensions: ${dimensions.width}x${dimensions.height}`);
    console.log(`📱 Screen width: ${screenWidth}px`);
    console.log(`🎯 Ad Unit ID: ${adUnitId}`);
    console.log(`🔧 Is Dev Mode: ${__DEV__}`);
    setIsAdLoaded(true);
    setAdHeight(dimensions.height);
  };

  const handleAdFailedToLoad = (error: any) => {
    console.error('❌ Banner ad failed to load!');
    console.error('📱 Screen width:', screenWidth);
    console.error('🎯 Ad Unit ID:', adUnitId);
    console.error('🔧 Is Dev Mode:', __DEV__);
    console.error('📋 Error details:', error);
    setIsAdLoaded(false);
    setAdHeight(0);
  };

  return (
    <View 
      style={[
        styles.container, 
        style,
        { 
          height: isAdLoaded ? adHeight : getEstimatedHeight(),
          minHeight: isAdLoaded ? adHeight : getEstimatedHeight()
        }
      ]}
    >
      <BannerAd
        unitId={adUnitId}
        size={getBannerSize()}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ModernDesign.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // Safe Areaを考慮した下部マージン
    paddingBottom: Platform.OS === 'ios' ? 0 : 0,
    borderTopWidth: 1,
    borderTopColor: ModernDesign.colors.border.subtle,
  },
});