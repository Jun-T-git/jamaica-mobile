import { create } from 'zustand';
import { ProductStatus, PurchaseOperation } from '../types/purchase';

// 購入権利は StoreKit の検証済みトランザクションからのみ設定する。
// AsyncStorage のフラグを購入の証明として使わない。
export const useMonetizationStore = create<{
  hasRemovedAds: boolean;
  entitlementChecked: boolean;
  reviewExpiresAt: number;
  price: string | null;
  productStatus: ProductStatus;
  purchaseOperation: PurchaseOperation;
  pendingPurchase: boolean;
  purchaseBusy: boolean;
  rewardBusy: boolean;
}>(() => ({
  hasRemovedAds: false,
  entitlementChecked: false,
  reviewExpiresAt: 0,
  price: null,
  productStatus: 'idle',
  purchaseOperation: null,
  pendingPurchase: false,
  purchaseBusy: false,
  rewardBusy: false,
}));
