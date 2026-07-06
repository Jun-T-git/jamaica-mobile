import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd } from 'react-native-google-mobile-ads';
import { adService } from '../../services/adService';
import { ModernDesign } from '../../constants';

interface BannerAdViewProps {
  style?: any;
}

export const BannerAdView: React.FC<BannerAdViewProps> = ({ style }) => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [adHeight, setAdHeight] = useState(0);
  // 画面下部のホームインジケータ／角丸ぶんのセーフエリア。バナーは各画面で
  // position:absolute; bottom:0 で貼られ、これは端末の物理的な最下部に吸着する
  // （親のセーフエリアを無視する）。この inset ぶんを下パディングとして確保し、
  // 広告本体をインジケータ帯の上へ押し上げて隠れないようにする。
  const insets = useSafeAreaInsets();

  const adUnitId = adService.getBannerAdUnitId();

  if (!adUnitId) {
    return null;
  }

  const handleAdLoaded = (dimensions: { width: number; height: number }) => {
    console.log('✅ Banner ad loaded successfully!');
    console.log(`📏 Dimensions: ${dimensions.width}x${dimensions.height}`);
    console.log(`🎯 Ad Unit ID: ${adUnitId}`);
    console.log(`🔧 Is Dev Mode: ${__DEV__}`);
    setIsAdLoaded(true);
    setAdHeight(dimensions.height);
  };

  const handleAdFailedToLoad = (error: any) => {
    console.error('❌ Banner ad failed to load!');
    console.error('🎯 Ad Unit ID:', adUnitId);
    console.error('🔧 Is Dev Mode:', __DEV__);
    console.error('📋 Error details:', error);
    setIsAdLoaded(false);
    setAdHeight(0);
  };

  // 広告が実際に読み込まれるまではコンテナを完全に折りたたむ。
  // 高さや枠線を先取りで確保すると、読み込み失敗時に「枠線付きの空箱」が
  // 残ったり、実サイズとの差で表示がガタつく（表示崩れ）原因になる。
  return (
    <View
      style={[
        styles.container,
        isAdLoaded && styles.containerLoaded,
        style,
        {
          height: isAdLoaded ? adHeight + insets.bottom : 0,
          paddingBottom: isAdLoaded ? insets.bottom : 0,
        },
      ]}
    >
      <BannerAd
        unitId={adUnitId}
        // アンカー付きアダプティブバナー: 画面幅いっぱいに広がり高さは自動最適化。
        size={adService.getBannerAdSize()}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  // 背景色・上部ボーダーは広告が表示されているときだけ適用する。
  containerLoaded: {
    backgroundColor: ModernDesign.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: ModernDesign.colors.border.subtle,
  },
});
