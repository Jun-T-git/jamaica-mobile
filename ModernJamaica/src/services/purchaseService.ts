import { AppState, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { useMonetizationStore } from '../store/monetizationStore';
import { analyticsService } from './analyticsService';
import { MONETIZATION } from '../config/monetization';
import { PurchaseSource } from '../types/purchase';

interface PurchaseBridge {
  getEntitlement(): Promise<boolean>;
  getProduct(): Promise<{ price: string } | null>;
  purchase(): Promise<'purchased' | 'cancelled' | 'pending'>;
  restore(): Promise<boolean>;
}

const bridge: PurchaseBridge | undefined = NativeModules.PurchaseModule;
let initialization: Promise<void> | undefined;
let revision = 0;
let productRequest: Promise<void> | undefined;
const updateOwnership = (owned: boolean) => {
  revision++;
  useMonetizationStore.setState({ hasRemovedAds: owned, entitlementChecked: true, ...(owned ? { pendingPurchase: false } : {}) });
};

export const purchaseService = {
  supported: Platform.OS === 'ios' && !!bridge,
  initialize(): Promise<void> {
    if (!initialization) {
      initialization = (async () => {
        if (!this.supported) {
          // Android は配信対象外。iOS のブリッジ障害時は購入者に広告を出さない。
          if (Platform.OS !== 'ios') updateOwnership(false);
          return;
        }
        new NativeEventEmitter(NativeModules.PurchaseModule).addListener(
          'purchaseEntitlementChanged', ({ owned }: { owned: boolean }) => updateOwnership(owned),
        );
        AppState.addEventListener('change', state => {
          if (state === 'active') this.refreshEntitlement().catch(() => {});
        });
        await this.refreshEntitlement().catch(() => {});
        this.loadProduct();
      })();
    }
    return initialization;
  },
  async refreshEntitlement(): Promise<void> {
    if (!bridge) return;
    const startedRevision = revision;
    const owned = await bridge.getEntitlement();
    if (revision === startedRevision) updateOwnership(owned);
  },
  loadProduct(): Promise<void> {
    if (productRequest) return productRequest;
    if (!this.supported || !bridge) {
      useMonetizationStore.setState({ price: null, productStatus: 'unavailable' });
      return Promise.resolve();
    }
    const store = bridge;
    useMonetizationStore.setState({ productStatus: 'loading' });
    productRequest = (async () => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const product = await Promise.race([
          store.getProduct(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error('product_timeout')), MONETIZATION.productRequestTimeoutMs);
          }),
        ]);
        useMonetizationStore.setState({
          price: product?.price || null,
          productStatus: product?.price ? 'available' : 'unavailable',
        });
      } catch {
        useMonetizationStore.setState({ price: null, productStatus: 'error' });
      } finally {
        clearTimeout(timeout);
      }
    })().finally(() => { productRequest = undefined; });
    return productRequest;
  },
  async purchase(source: PurchaseSource = 'settings'): Promise<'purchased' | 'cancelled' | 'pending'> {
    if (!bridge || useMonetizationStore.getState().purchaseBusy) throw new Error('購入できません。');
    useMonetizationStore.setState({ purchaseBusy: true, purchaseOperation: 'purchase' });
    analyticsService.logEvent('remove_ads_purchase_started', { source });
    try {
      const result = await bridge.purchase();
      if (result === 'purchased') updateOwnership(true);
      if (result === 'pending') useMonetizationStore.setState({ pendingPurchase: true });
      analyticsService.logEvent('remove_ads_purchase_result', { result, source });
      return result;
    } catch (error) {
      analyticsService.logEvent('remove_ads_purchase_result', { result: 'error', source });
      throw error;
    } finally {
      useMonetizationStore.setState({ purchaseBusy: false, purchaseOperation: null });
    }
  },
  async restore(source: PurchaseSource = 'settings'): Promise<boolean> {
    if (!bridge || useMonetizationStore.getState().purchaseBusy) throw new Error('復元できません。');
    useMonetizationStore.setState({ purchaseBusy: true, purchaseOperation: 'restore' });
    try {
      const owned = await bridge.restore();
      updateOwnership(owned);
      analyticsService.logEvent('remove_ads_restored', { owned, source });
      return owned;
    } finally {
      useMonetizationStore.setState({ purchaseBusy: false, purchaseOperation: null });
    }
  },
};
