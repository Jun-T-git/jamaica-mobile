import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { analyticsService } from './analyticsService';
import { shouldRequestReview } from '../utils/reviewPolicy';

const LAST_REVIEW_PROMPT_KEY = '@jamaica_review_last_prompted_at';

// ios/ModernJamaica/StoreReviewModule.m（SKStoreReviewController の薄いラッパ）。iOS 以外や未リンク時は undefined
const StoreReview: { requestReview: () => void } | undefined =
  Platform.OS === 'ios' ? NativeModules.StoreReview : undefined;

/**
 * App Store のレビュー依頼（SKStoreReviewController）
 * 出すかどうかの判断は utils/reviewPolicy.ts。実際に表示するかは OS が決める
 * （年 3 回まで・表示しないこともある）ので、こちらは「依頼した」ことだけ記録する
 */
class ReviewService {
  async maybeRequestReview(params: {
    isNewHighScore: boolean;
    gamesPlayed: number;
  }): Promise<boolean> {
    try {
      const saved = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
      const lastPromptedAt = saved ? Number(saved) : null;
      const now = Date.now();

      if (!StoreReview || !shouldRequestReview({ ...params, lastPromptedAt, now })) {
        return false;
      }

      await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, String(now));
      analyticsService.logEvent('review_prompt', {
        games_played: params.gamesPlayed,
      });
      StoreReview.requestReview();
      return true;
    } catch (error) {
      // レビュー依頼の失敗でゲームを止めない
      console.warn('Failed to request review:', error);
      return false;
    }
  }
}

export const reviewService = new ReviewService();
