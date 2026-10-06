jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
  NativeModules: {
    PurchaseModule: {
      getEntitlement: jest.fn(async () => false),
      getProduct: jest.fn(async () => ({ price: '¥480' })),
      purchase: jest.fn(async () => 'cancelled'),
      restore: jest.fn(async () => false),
    },
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({ addListener: jest.fn((_, callback) => {
    require('react-native').__onEntitlement = callback;
  }) })),
}));
jest.mock('../../src/services/analyticsService', () => ({ analyticsService: { logEvent: jest.fn() } }));
import { NativeModules } from 'react-native';
import { purchaseService } from '../../src/services/purchaseService';
import { useMonetizationStore } from '../../src/store/monetizationStore';
const bridge = NativeModules.PurchaseModule;

beforeAll(async () => { await purchaseService.initialize(); });
beforeEach(() => { useMonetizationStore.setState({ hasRemovedAds: false, purchaseBusy: false }); });
test('検証済み購入のみ権利を付与し、キャンセル・保留・エラーでは付与しない', async () => {
  for (const result of ['cancelled', 'pending']) {
    bridge.purchase.mockResolvedValueOnce(result);
    expect(await purchaseService.purchase()).toBe(result);
    expect(useMonetizationStore.getState().hasRemovedAds).toBe(false);
  }
  bridge.purchase.mockRejectedValueOnce(new Error('unverified'));
  await expect(purchaseService.purchase()).rejects.toThrow('unverified');
  expect(useMonetizationStore.getState().hasRemovedAds).toBe(false);
  expect(useMonetizationStore.getState().purchaseBusy).toBe(false);
  bridge.purchase.mockResolvedValueOnce('purchased');
  await purchaseService.purchase();
  expect(useMonetizationStore.getState().hasRemovedAds).toBe(true);
});
test('購入を復元でき、返金の権利更新を反映する', async () => {
  bridge.restore.mockResolvedValueOnce(true);
  expect(await purchaseService.restore()).toBe(true);
  expect(useMonetizationStore.getState().hasRemovedAds).toBe(true);
  require('react-native').__onEntitlement({ owned: false });
  expect(useMonetizationStore.getState().hasRemovedAds).toBe(false);
});
test('購入前に開始された古い権利読み込みで、新しい購入権利を取り消さない', async () => {
  let finish!: (value: boolean) => void;
  bridge.getEntitlement.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const refresh = purchaseService.refreshEntitlement();
  bridge.purchase.mockResolvedValueOnce('purchased');
  await purchaseService.purchase();
  finish(false);
  await refresh;
  expect(useMonetizationStore.getState().hasRemovedAds).toBe(true);
});

test('価格取得を多重実行せず、読み込み中と販売不可を区別する', async () => {
  let finish!: (value: null) => void;
  bridge.getProduct.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = purchaseService.loadProduct();
  const second = purchaseService.loadProduct();
  expect(first).toBe(second);
  expect(useMonetizationStore.getState().productStatus).toBe('loading');
  finish(null);
  await first;
  expect(useMonetizationStore.getState().productStatus).toBe('unavailable');
  expect(useMonetizationStore.getState().price).toBeNull();
});
test('価格取得のタイムアウト後は再試行でき、遅れて届いた古い価格を使わない', async () => {
  jest.useFakeTimers();
  let finish!: (value: { price: string }) => void;
  bridge.getProduct.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = purchaseService.loadProduct();
  jest.advanceTimersByTime(15_000);
  await first;
  expect(useMonetizationStore.getState().productStatus).toBe('error');
  bridge.getProduct.mockResolvedValueOnce({ price: '¥500' });
  await purchaseService.loadProduct();
  finish({ price: '¥100' });
  await Promise.resolve();
  expect(useMonetizationStore.getState().price).toBe('¥500');
  expect(useMonetizationStore.getState().productStatus).toBe('available');
  jest.useRealTimers();
});
