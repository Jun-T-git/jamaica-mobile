import {
  getAnalytics,
  logEvent,
  logScreenView,
} from '@react-native-firebase/analytics';

type EventParams = Record<string, string | number | boolean>;

/**
 * Firebase Analytics の薄いラッパー
 * 計測の失敗でゲームを止めないよう、例外は全て握りつぶす
 */
class AnalyticsService {
  logEvent(name: string, params: EventParams = {}) {
    try {
      logEvent(getAnalytics(), name, params).catch(() => {});
    } catch (error) {
      console.warn(`Failed to log analytics event ${name}:`, error);
    }
  }

  logScreen(screenName: string) {
    try {
      logScreenView(getAnalytics(), {
        screen_name: screenName,
        screen_class: screenName,
      }).catch(() => {});
    } catch (error) {
      console.warn(`Failed to log screen view ${screenName}:`, error);
    }
  }
}

export const analyticsService = new AnalyticsService();
