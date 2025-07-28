import { Platform } from 'react-native';
import {
  AdEventType,
  BannerAdSize,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

// AdMob IDs - テスト用IDを使用（本番用IDは後で置き換える）
const adUnitIds = {
  banner: __DEV__
    ? TestIds.BANNER
    : Platform.select({
        ios: 'ca-app-pub-9884011718535966/5647036127', // 本番用iOS広告ID
        android: 'ca-app-pub-XXXXX/XXXXX', // 本番用Android広告ID
      }),
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        ios: 'ca-app-pub-9884011718535966/7002465924', // 本番用iOS広告ID
        android: 'ca-app-pub-XXXXX/XXXXX', // 本番用Android広告ID
      }),
};

// インタースティシャル広告のインスタンス
let interstitialAd: InterstitialAd | null = null;

class AdService {
  private interstitialLoadAttempts = 0;
  private readonly maxInterstitialLoadAttempts = 3;
  private interstitialShownCount = 0;
  private readonly interstitialFrequency = 3; // 3ゲームごとに表示

  constructor() {
    this.initializeInterstitialAd();
  }

  private initializeInterstitialAd() {
    if (!adUnitIds.interstitial) return;

    interstitialAd = InterstitialAd.createForAdRequest(adUnitIds.interstitial);

    // イベントリスナーの設定
    interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('✅ Interstitial ad loaded successfully!');
        console.log(`🎯 Ad Unit ID: ${adUnitIds.interstitial}`);
        console.log(`🔧 Is Dev Mode: ${__DEV__}`);
        this.interstitialLoadAttempts = 0;
      },
    );

    interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      error => {
        console.error('❌ Interstitial ad failed to load!');
        console.error(`🎯 Ad Unit ID: ${adUnitIds.interstitial}`);
        console.error(`🔧 Is Dev Mode: ${__DEV__}`);
        console.error('📋 Error details:', error);
        this.handleInterstitialLoadError();
      },
    );

    interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('Interstitial ad closed');
        // 次の広告を事前読み込み
        this.loadInterstitialAd();
      },
    );

    // 初回読み込み
    this.loadInterstitialAd();
  }

  private loadInterstitialAd() {
    if (!interstitialAd) return;

    interstitialAd.load();
  }

  private handleInterstitialLoadError() {
    this.interstitialLoadAttempts++;

    if (this.interstitialLoadAttempts < this.maxInterstitialLoadAttempts) {
      // リトライ
      setTimeout(() => {
        this.loadInterstitialAd();
      }, 2000 * this.interstitialLoadAttempts); // 指数バックオフ
    }
  }

  // バナー広告のユニットIDを取得
  getBannerAdUnitId(): string | undefined {
    return adUnitIds.banner;
  }

  // バナー広告のサイズを取得（モバイルゲーム最適化）
  getBannerAdSize(): BannerAdSize {
    // アダプティブバナーは各デバイスに最適化される
    return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
  }

  // デバイス別の最適なバナーサイズを取得
  getOptimalBannerSize(): BannerAdSize {
    const { Platform, Dimensions } = require('react-native');
    const { width } = Dimensions.get('window');

    // iPhoneの場合
    if (Platform.OS === 'ios') {
      if (width <= 320) {
        return BannerAdSize.BANNER; // 320x50
      } else if (width <= 728) {
        return BannerAdSize.LARGE_BANNER; // 320x100
      } else {
        return BannerAdSize.LEADERBOARD; // 728x90
      }
    }

    // Androidの場合
    if (width <= 320) {
      return BannerAdSize.BANNER; // 320x50
    } else {
      return BannerAdSize.ANCHORED_ADAPTIVE_BANNER; // 自動調整
    }
  }

  // インタースティシャル広告を表示すべきかチェック
  shouldShowInterstitial(): boolean {
    this.interstitialShownCount++;
    return this.interstitialShownCount % this.interstitialFrequency === 0;
  }

  // インタースティシャル広告を表示
  async showInterstitialAd(): Promise<boolean> {
    if (!interstitialAd) {
      console.log('Interstitial ad not initialized');
      return false;
    }

    try {
      const isLoaded = await interstitialAd.loaded;

      if (isLoaded && this.shouldShowInterstitial()) {
        await interstitialAd.show();
        return true;
      }
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
    }

    return false;
  }

  // カウンターをリセット（必要に応じて）
  resetInterstitialCounter() {
    this.interstitialShownCount = 0;
  }
}

// シングルトンインスタンス
export const adService = new AdService();
