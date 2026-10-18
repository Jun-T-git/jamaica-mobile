jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (values: { ios: string }) => values.ios },
  AppState: { currentState: 'active' },
}));
jest.mock('../../src/services/purchaseService', () => ({ purchaseService: { initialize: jest.fn(async () => {}) } }));
jest.mock('../../src/services/analyticsService', () => ({ analyticsService: { logEvent: jest.fn() } }));
jest.mock('react-native-tracking-transparency', () => ({ requestTrackingPermission: jest.fn(async () => 'denied') }));
jest.mock('react-native-google-mobile-ads', () => {
  const ads: unknown[] = [];
  class Ad {
    loaded = false;
    callbacks = new Map<string, Set<(data?: unknown) => void>>();
    load = jest.fn();
    show = jest.fn(async () => {});
    addAdEventListener(type: string, callback: (data?: unknown) => void) {
      if (!this.callbacks.has(type)) this.callbacks.set(type, new Set());
      this.callbacks.get(type)!.add(callback);
      return () => this.callbacks.get(type)!.delete(callback);
    }
    emit(type: string) { this.callbacks.get(type)?.forEach(cb => cb()); }
    static createForAdRequest() { const ad = new Ad(); ads.push(ad); return ad; }
  }
  return {
    __esModule: true,
    default: () => ({ initialize: async () => {}, setRequestConfiguration: async () => {} }),
    InterstitialAd: Ad, RewardedAd: Ad, __ads: ads,
    AdEventType: { LOADED: 'loaded', OPENED: 'opened', CLOSED: 'closed', ERROR: 'error', PAID: 'paid' },
    RewardedAdEventType: { LOADED: 'reward_loaded', EARNED_REWARD: 'earned' },
    TestIds: { INTERSTITIAL: 'interstitial', REWARDED: 'rewarded' },
    MaxAdContentRating: { PG: 'PG' },
  };
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdService } from '../../src/services/adService';
import { useMonetizationStore } from '../../src/store/monetizationStore';
import { MONETIZATION } from '../../src/config/monetization';
const ads = require('react-native-google-mobile-ads').__ads as {
  loaded: boolean; emit(type: string): void; show: jest.Mock;
}[];
let service: AdService;
beforeEach(async () => {
  jest.useFakeTimers().setSystemTime(1_000_000);
  await AsyncStorage.clear();
  ads.length = 0;
  useMonetizationStore.setState({ hasRemovedAds: false, entitlementChecked: true, reviewExpiresAt: 0, rewardBusy: false, purchaseBusy: false });
  service = new AdService();
  await service.initialize();
});
afterEach(() => jest.useRealTimers());
test('閉じただけでは解放せず、視聴完了で1時間解放する', async () => {
  const cancelled = service.showRewardForReview();
  ads[1].emit('reward_loaded'); ads[1].emit('opened'); ads[1].emit('closed');
  expect(await cancelled).toBe('cancelled');
  expect(useMonetizationStore.getState().reviewExpiresAt).toBe(0);
  const earned = service.showRewardForReview();
  ads[2].emit('reward_loaded'); ads[2].emit('opened'); ads[2].emit('earned'); ads[2].emit('closed');
  expect(await earned).toBe('earned');
  expect(useMonetizationStore.getState().reviewExpiresAt).toBe(Date.now() + MONETIZATION.reviewAccessMs);
  expect(await AsyncStorage.getItem('@jamaica_review_expires_at')).toBe(String(Date.now() + MONETIZATION.reviewAccessMs));
});
test('読込タイムアウト後の遅延コールバックでは広告を表示せず、再試行できる', async () => {
  const result = service.showRewardForReview();
  jest.advanceTimersByTime(MONETIZATION.adLoadTimeoutMs);
  expect(await result).toBe('unavailable');
  ads[1].emit('reward_loaded'); ads[1].emit('earned');
  expect(ads[1].show).not.toHaveBeenCalled();
  expect(useMonetizationStore.getState().reviewExpiresAt).toBe(0);
  expect(useMonetizationStore.getState().rewardBusy).toBe(false);
});
test('購入者は動画広告なしで解答例を開ける', async () => {
  useMonetizationStore.setState({ hasRemovedAds: true });
  expect(await service.showRewardForReview()).toBe('earned');
  expect(ads).toHaveLength(1);
});
test('リザルトを再表示してもゲーム数を重複計上せず、表示失敗で進行を止めない', async () => {
  jest.advanceTimersByTime(MONETIZATION.startupGraceMs);
  ads[0].loaded = true;
  service.recordCompletedGame(1); service.recordCompletedGame(1); service.recordCompletedGame(2);
  expect(await service.showInterstitialOnMenu()).toBe(false);
  service.recordCompletedGame(3);
  const showing = service.showInterstitialOnMenu();
  ads[0].emit('error');
  expect(await showing).toBe(false);
  expect(ads[0].show).toHaveBeenCalledTimes(1);
});
