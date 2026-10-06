import { MONETIZATION } from '../config/monetization';

export function canReview(hasRemovedAds: boolean, expiresAt: number, now: number): boolean {
  return hasRemovedAds || (Number.isFinite(expiresAt) && expiresAt > now);
}

export function shouldShowInterstitial(input: {
  now: number;
  startedAt: number;
  lastShownAt: number;
  games: number;
  hasRemovedAds: boolean;
  entitlementChecked: boolean;
  reviewExpiresAt: number;
}): boolean {
  return input.entitlementChecked && !canReview(input.hasRemovedAds, input.reviewExpiresAt, input.now)
    && input.games >= MONETIZATION.interstitialGameInterval
    && input.now - input.startedAt >= MONETIZATION.startupGraceMs
    && input.now - input.lastShownAt >= MONETIZATION.interstitialCooldownMs;
}
