import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, {
  AdEventType, InterstitialAd, MaxAdContentRating,
  RequestOptions, RewardedAd, RewardedAdEventType, TestIds,
} from 'react-native-google-mobile-ads';
import { requestTrackingPermission } from 'react-native-tracking-transparency';
import { MONETIZATION } from '../config/monetization';
import { useMonetizationStore } from '../store/monetizationStore';
import { canReview, shouldShowInterstitial } from '../utils/monetizationPolicy';
import { analyticsService } from './analyticsService';
import { purchaseService } from './purchaseService';
import { reviewAccessService } from './reviewAccessService';

const adUnitIds = {
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : Platform.select({ ios: 'ca-app-pub-9884011718535966/7002465924', android: undefined }),
  rewarded: __DEV__ ? TestIds.REWARDED : Platform.select({ ios: MONETIZATION.rewardedIosAdUnitId, android: undefined }),
};
export const AD_REQUEST_OPTIONS: RequestOptions = {
  keywords: ['game', 'puzzle', 'math', 'brain training', 'ゲーム', 'パズル', '脳トレ'],
};
const COUNTER_KEY = '@jamaica_games_since_interstitial';
const LAST_SHOWN_KEY = '@jamaica_last_fullscreen_ad_at';

export class AdService {
  private interstitial: InterstitialAd | null = null;
  private startedAt = Date.now();
  private lastShownAt = 0;
  private games = 0;
  private policyLoaded = false;
  private lastRecordedSession = -1;
  private fullscreenBusy = false;
  private sdkReady = false;
  private initialization?: Promise<void>;
  private persistence = Promise.resolve();

  initialize(): Promise<void> {
    if (!this.initialization) this.initialization = this.initializeOnce();
    return this.initialization;
  }

  private async initializeOnce(): Promise<void> {
    try {
      await Promise.all([purchaseService.initialize(), reviewAccessService.initialize(), this.loadPolicy()]);
      if (Platform.OS === 'ios' && !useMonetizationStore.getState().hasRemovedAds) await requestTrackingPermission();
      await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG });
      await mobileAds().initialize();
      this.sdkReady = true;
      if (adUnitIds.interstitial) {
        this.interstitial = InterstitialAd.createForAdRequest(adUnitIds.interstitial, AD_REQUEST_OPTIONS);
        this.interstitial.addAdEventListener(AdEventType.PAID, payload => this.trackRevenue('interstitial', payload, 'result_menu'));
        this.interstitial.addAdEventListener(AdEventType.OPENED, () => {
          this.games = 0;
          this.lastShownAt = Date.now();
          this.persistPolicy();
          analyticsService.logEvent('ad_shown', { format: 'interstitial', placement: 'result_menu' });
        });
        this.loadInterstitial();
      }
    } catch (error) {
      console.warn('広告を初期化できませんでした', error);
    }
  }

  private async loadPolicy() {
    try {
      const values = await AsyncStorage.multiGet([COUNTER_KEY, LAST_SHOWN_KEY]);
      const games = Number(values[0][1]);
      const shownAt = Number(values[1][1]);
      this.games += Number.isFinite(games) ? Math.max(0, games) : 0;
      this.lastShownAt = Number.isFinite(shownAt) ? Math.max(0, shownAt) : 0;
    } catch { /* 永続化の失敗ではゲームを止めない */ }
    this.policyLoaded = true;
    this.persistPolicy();
  }

  private persistPolicy() {
    if (!this.policyLoaded) return;
    const entries: [string, string][] = [[COUNTER_KEY, String(this.games)], [LAST_SHOWN_KEY, String(this.lastShownAt)]];
    this.persistence = this.persistence.then(() => AsyncStorage.multiSet(entries)).catch(() => {});
  }

  recordCompletedGame(session: number) {
    if (this.lastRecordedSession === session) return;
    this.lastRecordedSession = session;
    this.games++;
    this.persistPolicy();
  }

  private loadInterstitial() {
    if (useMonetizationStore.getState().hasRemovedAds) return;
    try { this.interstitial?.load(); } catch { /* 次のメニュー遷移で再試行 */ }
  }

  isRewardConfigured(): boolean { return !!adUnitIds.rewarded; }

  trackRevenue(format: string, payload: unknown, placement = 'result_review') {
    // SDK 15 の PAID コールバック型は undefined だが、ネイティブは PaidEvent を送る。
    if (!payload || typeof payload !== 'object') return;
    const event = payload as { value?: number; currency?: string; precision?: number };
    if (typeof event.value !== 'number' || !event.currency) return;
    analyticsService.logEvent('ad_revenue', {
      format, placement, value: event.value, currency: event.currency,
      precision: event.precision ?? 0,
    });
  }

  async showInterstitialOnMenu(): Promise<boolean> {
    const state = useMonetizationStore.getState();
    if (this.fullscreenBusy || state.purchaseBusy || state.rewardBusy || AppState.currentState !== 'active'
      || !shouldShowInterstitial({ ...state, now: Date.now(), startedAt: this.startedAt,
        lastShownAt: this.lastShownAt, games: this.games })) return false;
    const ad = this.interstitial;
    if (!ad?.loaded) { this.loadInterstitial(); return false; }
    this.fullscreenBusy = true;
    try {
      return await new Promise<boolean>(resolve => {
        let opened = false;
        let settled = false;
        const unsubscribers: (() => void)[] = [];
        const finish = (shown: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          unsubscribers.forEach(unsubscribe => unsubscribe());
          resolve(shown);
        };
        const timeout = setTimeout(() => finish(false), MONETIZATION.adLoadTimeoutMs);
        unsubscribers.push(ad.addAdEventListener(AdEventType.OPENED, () => { opened = true; clearTimeout(timeout); }));
        unsubscribers.push(ad.addAdEventListener(AdEventType.CLOSED, () => finish(opened)));
        unsubscribers.push(ad.addAdEventListener(AdEventType.ERROR, () => finish(false)));
        ad.show().catch(() => finish(false));
      });
    } catch {
      return false;
    } finally {
      this.fullscreenBusy = false;
      this.loadInterstitial();
    }
  }

  async showRewardForReview(): Promise<'earned' | 'cancelled' | 'unavailable'> {
    const state = useMonetizationStore.getState();
    if (canReview(state.hasRemovedAds, state.reviewExpiresAt, Date.now())) return 'earned';
    if (!this.sdkReady || !adUnitIds.rewarded || this.fullscreenBusy || state.purchaseBusy
      || state.rewardBusy || AppState.currentState !== 'active') return 'unavailable';
    this.fullscreenBusy = true;
    useMonetizationStore.setState({ rewardBusy: true });
    analyticsService.logEvent('review_reward_requested');
    try {
      const ad = RewardedAd.createForAdRequest(adUnitIds.rewarded, AD_REQUEST_OPTIONS);
      return await new Promise<'earned' | 'cancelled' | 'unavailable'>(resolve => {
        let earned = false;
        let settled = false;
        let grant = Promise.resolve();
        const unsubscribers: (() => void)[] = [];
        const finish = (result: 'earned' | 'cancelled' | 'unavailable') => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          unsubscribers.forEach(unsubscribe => unsubscribe());
          grant.finally(() => resolve(result));
        };
        const timeout = setTimeout(() => finish('unavailable'), MONETIZATION.adLoadTimeoutMs);
        unsubscribers.push(ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          if (AppState.currentState !== 'active') { finish('unavailable'); return; }
          ad.show().catch(() => finish('unavailable'));
        }));
        unsubscribers.push(ad.addAdEventListener(AdEventType.OPENED, () => {
          clearTimeout(timeout);
          this.lastShownAt = Date.now();
          this.persistPolicy();
          analyticsService.logEvent('ad_shown', { format: 'rewarded', placement: 'result_review' });
        }));
        unsubscribers.push(ad.addAdEventListener(AdEventType.PAID, payload => this.trackRevenue('rewarded', payload)));
        unsubscribers.push(ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          if (earned) return;
          earned = true;
          grant = reviewAccessService.grant();
          analyticsService.logEvent('review_reward_earned');
        }));
        unsubscribers.push(ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? 'earned' : 'cancelled')));
        unsubscribers.push(ad.addAdEventListener(AdEventType.ERROR, () => finish(earned ? 'earned' : 'unavailable')));
        try { ad.load(); } catch { finish('unavailable'); }
      });
    } catch {
      return 'unavailable';
    } finally {
      this.fullscreenBusy = false;
      useMonetizationStore.setState({ rewardBusy: false });
    }
  }
}

export const adService = new AdService();
