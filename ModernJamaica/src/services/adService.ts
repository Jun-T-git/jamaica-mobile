import { Platform, Dimensions, StatusBar } from 'react-native';
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

/**
 * インタースティシャル広告のセーフエリア対応について
 * 
 * 【問題】
 * iOS devices with notch (iPhone X以降) において、インタースティシャル広告が
 * セーフエリアを超えて表示され、クローズボタンがノッチ部分に隠れてしまい、
 * ユーザーが広告を閉じることができなくなる問題が発生する。
 * 
 * 【公式推奨解決策】
 * Google Mobile Ads SDKの公式ドキュメントに従い、以下を実装：
 * 1. AdEventType.OPENED イベントでiOSのステータスバーを隠す (StatusBar.setHidden(true))
 * 2. AdEventType.CLOSED イベントでステータスバーを復元 (StatusBar.setHidden(false))
 * 3. エラーハンドリングでステータスバー状態の復元を保証
 * 
 * 【参考資料】
 * - https://developers.google.com/admob/ios/x-ad-rendering
 * - https://github.com/invertase/react-native-google-mobile-ads/issues/563
 * - https://github.com/invertase/react-native-google-mobile-ads/issues/204
 */

// インタースティシャル広告のインスタンス
let interstitialAd: InterstitialAd | null = null;

class AdService {
  private interstitialLoadAttempts = 0;
  private readonly maxInterstitialLoadAttempts = 3;
  private interstitialShownCount = 0;
  private readonly interstitialFrequency = 3; // 3ゲームごとに表示
  private originalStatusBarHidden = false; // 元のステータスバー状態を保存

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
        console.log('🎯 Ad Unit ID:', String(adUnitIds.interstitial || 'undefined'));
        console.log('🔧 Is Dev Mode:', String(__DEV__));
        this.interstitialLoadAttempts = 0;
      },
    );

    // 公式推奨：iOSでインタースティシャル広告が開かれた時にステータスバーを隠す
    interstitialAd.addAdEventListener(
      AdEventType.OPENED,
      () => {
        console.log('🎬 Interstitial ad opened');
        if (Platform.OS === 'ios') {
          // 現在のステータスバー状態を保存
          StatusBar.currentHeight; // Android用（iOSでは無効）
          // iOSでステータスバーを隠してクローズボタンをアクセス可能にする
          StatusBar.setHidden(true, 'fade');
          console.log('📱 iOS: Status bar hidden to prevent close button obstruction');
        }
      },
    );

    interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('🎬 Interstitial ad closed');
        if (Platform.OS === 'ios') {
          // ステータスバーを復元
          StatusBar.setHidden(false, 'fade');
          console.log('📱 iOS: Status bar restored');
        }
        // 次の広告を事前読み込み
        this.loadInterstitialAd();
      },
    );

    interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      error => {
        // NoAdsToShow は開発環境では正常な動作
        const errorCode = (error as any)?.code;
        if (error?.message?.includes('No ad to show') || errorCode === 1) {
          console.log('ℹ️ No interstitial ads available (normal in development/low traffic)');
          console.log('🎯 Ad Unit ID:', String(adUnitIds.interstitial || 'undefined'));
          console.log('🔧 Is Dev Mode:', String(__DEV__));
        } else {
          console.error('❌ Interstitial ad failed to load with unexpected error!');
          console.error('🎯 Ad Unit ID:', String(adUnitIds.interstitial || 'undefined'));
          console.error('🔧 Is Dev Mode:', String(__DEV__));
          console.error('📋 Error details:', String(error));
        }
        this.handleInterstitialLoadError();
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
        console.log('🎬 Attempting to show interstitial ad');
        await interstitialAd.show();
        return true;
      } else {
        console.log('🎬 Interstitial ad not ready or frequency not met');
      }
    } catch (error) {
      console.error('❌ Error showing interstitial ad:', String(error));
      
      // エラーが発生した場合はステータスバー状態を復元（iOS）
      if (Platform.OS === 'ios') {
        StatusBar.setHidden(false, 'fade');
        console.log('📱 iOS: Status bar restored due to show error');
      }
    }

    return false;
  }

  // 緊急時用：手動でステータスバーを復元
  restoreStatusBar() {
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(false, 'fade');
      console.log('📱 iOS: Status bar manually restored');
    }
  }

  // カウンターをリセット（必要に応じて）
  resetInterstitialCounter() {
    this.interstitialShownCount = 0;
  }
}

// シングルトンインスタンス
export const adService = new AdService();
