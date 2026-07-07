import { Platform } from 'react-native';
import {
  AdEventType,
  BannerAdSize,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

// AdMob IDs
// __DEV__ ではテスト用ID、本番では各プラットフォームの本番IDを使う。
// Android の本番広告IDは未取得（技術的負債）。プレースホルダを渡すと
// 無効IDへのリクエストで広告枠が壊れるため、取得できるまで undefined とし、
// 呼び出し側で広告自体を出さない（BannerAdView は null、interstitial は未初期化）。
const adUnitIds = {
  banner: __DEV__
    ? TestIds.BANNER
    : Platform.select({
        ios: 'ca-app-pub-9884011718535966/5647036127', // 本番用iOSバナー広告ID
        android: undefined, // TODO: 本番Androidバナー広告ID未設定
      }),
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        ios: 'ca-app-pub-9884011718535966/7002465924', // 本番用iOSインタースティシャル広告ID
        android: undefined, // TODO: 本番Androidインタースティシャル広告ID未設定
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

  // バナー広告のサイズを取得（全デバイス共通）
  getBannerAdSize(): BannerAdSize {
    // アンカー付きアダプティブバナーは画面幅いっぱいに広がり、各デバイスに
    // 最適な高さへ自動調整される（Google 推奨）。固定サイズをデバイス幅で
    // 出し分けると横幅の隙間や高さの不揃いで表示崩れの原因になるため使わない。
    return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
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
