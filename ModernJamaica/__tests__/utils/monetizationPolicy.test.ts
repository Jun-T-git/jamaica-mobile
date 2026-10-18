import { canReview, shouldShowInterstitial } from '../../src/utils/monetizationPolicy';
import { MONETIZATION } from '../../src/config/monetization';

const eligible = {
  now: 1_000_000, startedAt: 0, lastShownAt: 0, games: 3,
  hasRemovedAds: false, entitlementChecked: true, reviewExpiresAt: 0,
};
test('1時間の境界で失効し、購入者は期限によらず閲覧できる', () => {
  expect(canReview(false, 1000, 999)).toBe(true);
  expect(canReview(false, 1000, 1000)).toBe(false);
  expect(canReview(false, NaN, 0)).toBe(false);
  expect(canReview(true, 0, 1000)).toBe(true);
});
test('ゲーム数・起動猶予・全画面広告の間隔をすべて満たした場合のみ表示', () => {
  expect(shouldShowInterstitial(eligible)).toBe(true);
  expect(shouldShowInterstitial({ ...eligible, games: 2 })).toBe(false);
  expect(shouldShowInterstitial({ ...eligible, startedAt: eligible.now - MONETIZATION.startupGraceMs + 1 })).toBe(false);
  expect(shouldShowInterstitial({ ...eligible, lastShownAt: eligible.now - MONETIZATION.interstitialCooldownMs + 1 })).toBe(false);
});
test('購入済み・購入確認前・リワード有効中は強制広告を出さない', () => {
  expect(shouldShowInterstitial({ ...eligible, hasRemovedAds: true })).toBe(false);
  expect(shouldShowInterstitial({ ...eligible, entitlementChecked: false })).toBe(false);
  expect(shouldShowInterstitial({ ...eligible, reviewExpiresAt: eligible.now + 1 })).toBe(false);
});
