import AsyncStorage from '@react-native-async-storage/async-storage';
import { MONETIZATION } from '../config/monetization';
import { useMonetizationStore } from '../store/monetizationStore';

const KEY = '@jamaica_review_expires_at';
let initialization: Promise<void> | undefined;

export const reviewAccessService = {
  initialize(): Promise<void> {
    if (!initialization) {
      initialization = AsyncStorage.getItem(KEY).then(value => {
        const expiresAt = Number(value);
        if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
          useMonetizationStore.setState({ reviewExpiresAt: expiresAt });
        }
      }).catch(() => {});
    }
    return initialization;
  },
  async grant(): Promise<void> {
    await this.initialize();
    const reviewExpiresAt = Date.now() + MONETIZATION.reviewAccessMs;
    useMonetizationStore.setState({ reviewExpiresAt });
    // 保存失敗でも獲得済みの報酬を取り消さない。
    await AsyncStorage.setItem(KEY, String(reviewExpiresAt)).catch(() => {});
  },
};
