import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, {
  AdEventType,
  BannerAdSize,
  InterstitialAd,
  MaxAdContentRating,
  RequestOptions,
  TestIds,
} from 'react-native-google-mobile-ads';
import { requestTrackingPermission } from 'react-native-tracking-transparency';

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

// 広告リクエストに付ける文脈ヒント。IDFA が無い場合の広告選択はアプリの文脈だけが頼りなので、
// 「パズルゲーム」であることを伝えてゲーム系の広告が選ばれやすくする
export const AD_REQUEST_OPTIONS: RequestOptions = {
  keywords: ['game', 'puzzle', 'math', 'brain training', 'ゲーム', 'パズル', '脳トレ'],
};

// 前回の広告表示からのゲーム数（アプリを再起動しても引き継ぐ）
const GAMES_SINCE_INTERSTITIAL_KEY = '@jamaica_games_since_interstitial';

// インタースティシャル広告のインスタンス
let interstitialAd: InterstitialAd | null = null;

class AdService {
  private interstitialLoadAttempts = 0;
  private readonly maxInterstitialLoadAttempts = 3;
  private readonly interstitialFrequency = 3; // 3ゲームごとに表示
  private onInterstitialClosed: (() => void) | null = null;
  private resolveReady!: () => void;
  // SDK の初期化完了。バナーはこれを待ってから読み込む（ATT の回答前にリクエストしない）
  readonly ready = new Promise<void>(resolve => {
    this.resolveReady = resolve;
  });

  /**
   * 広告 SDK を初期化する（起動時に 1 回）
   * 1. ATT（トラッキング許可）を先に求める。許可されると IDFA が付き、パーソナライズ広告
   *    （ゲームをよく遊ぶ人にはゲーム広告、など）が配信される。拒否されても広告は出る
   * 2. 配信される広告コンテンツを PG 以下に制限する（家族向けアプリのため。
   *    G だとスマホゲームの広告の大半が除外され、無関係な汎用広告ばかりになる）
   * 3. SDK を初期化し、インタースティシャルの事前読み込みを始める
   * 失敗してもゲーム進行には影響させない
   */
  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        const status = await requestTrackingPermission();
        console.log(`📡 Tracking permission: ${status}`);
      }
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
      });
      await mobileAds().initialize();
      console.log('AdMob SDK initialized');
      this.initializeInterstitialAd();
    } catch (error) {
      console.error('AdMob SDK initialization error:', error);
    } finally {
      this.resolveReady();
    }
  }

  private initializeInterstitialAd() {
    if (!adUnitIds.interstitial) return;

    interstitialAd = InterstitialAd.createForAdRequest(adUnitIds.interstitial, AD_REQUEST_OPTIONS);

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
        this.onInterstitialClosed?.();
        this.onInterstitialClosed = null;
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

  /**
   * ゲーム終了を記録し、表示タイミングならインタースティシャル広告を表示する
   * 広告が閉じられるまで待つので、呼び出し側は await してから画面遷移すること
   *
   * ゲーム数はAsyncStorageに保存する（1回の起動で1〜2ゲームしか遊ばない
   * ユーザーにも、通算3ゲームごとに表示されるようにするため）
   */
  async showInterstitialAfterGame(): Promise<boolean> {
    const gamesSinceLastAd = (await this.loadGamesSinceInterstitial()) + 1;

    if (gamesSinceLastAd < this.interstitialFrequency || !interstitialAd?.loaded) {
      // 広告の準備ができていない場合はカウントを持ち越し、次のゲーム後に表示する
      await this.saveGamesSinceInterstitial(gamesSinceLastAd);
      return false;
    }

    const ad = interstitialAd;
    try {
      await new Promise<void>((resolve, reject) => {
        this.onInterstitialClosed = resolve;
        ad.show().catch(reject);
      });
      await this.saveGamesSinceInterstitial(0);
      return true;
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      this.onInterstitialClosed = null;
      await this.saveGamesSinceInterstitial(gamesSinceLastAd);
      return false;
    }
  }

  private async loadGamesSinceInterstitial(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(GAMES_SINCE_INTERSTITIAL_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch (error) {
      return 0;
    }
  }

  private async saveGamesSinceInterstitial(count: number): Promise<void> {
    try {
      await AsyncStorage.setItem(GAMES_SINCE_INTERSTITIAL_KEY, count.toString());
    } catch (error) {
      console.warn('Failed to save interstitial counter:', error);
    }
  }
}

// シングルトンインスタンス
export const adService = new AdService();
