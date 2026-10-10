import { trigger, HapticFeedbackTypes } from 'react-native-haptic-feedback';

const HAPTIC_OPTIONS = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

/**
 * 触覚フィードバック（ユーザー設定でオン・オフ可能）
 */
class HapticService {
  private isEnabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  getEnabled() {
    return this.isEnabled;
  }

  // ノードや演算子の選択
  selection() {
    this.play(HapticFeedbackTypes.selection);
  }

  // ノード結合
  connect() {
    this.play(HapticFeedbackTypes.impactLight);
  }

  // 正解
  success() {
    this.play(HapticFeedbackTypes.notificationSuccess);
  }

  // 不正解
  error() {
    this.play(HapticFeedbackTypes.notificationError);
  }

  private play(type: HapticFeedbackTypes) {
    if (!this.isEnabled) return;

    try {
      trigger(type, HAPTIC_OPTIONS);
    } catch (error) {
      console.warn(`Failed to play haptic ${type}:`, error);
    }
  }
}

export const hapticService = new HapticService();
