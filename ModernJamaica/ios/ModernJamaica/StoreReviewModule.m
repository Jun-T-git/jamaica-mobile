#import <React/RCTBridgeModule.h>
#import <StoreKit/StoreKit.h>
#import <UIKit/UIKit.h>

/**
 * App Store のレビュー依頼（SKStoreReviewController）を JS から呼ぶための最小モジュール。
 * 外部ライブラリ（Swift 混在）が静的フレームワーク構成でビルドできなかったため自前で持つ。
 * 実際にダイアログを出すかどうかは OS が決める（年 3 回まで）。
 * JS 側: NativeModules.StoreReview.requestReview()（services/reviewService.ts）
 */
@interface StoreReviewModule : NSObject <RCTBridgeModule>
@end

@implementation StoreReviewModule

RCT_EXPORT_MODULE(StoreReview);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(requestReview)
{
  UIWindowScene *scene = nil;
  for (UIScene *candidate in UIApplication.sharedApplication.connectedScenes) {
    if (candidate.activationState == UISceneActivationStateForegroundActive &&
        [candidate isKindOfClass:[UIWindowScene class]]) {
      scene = (UIWindowScene *)candidate;
      break;
    }
  }
  if (scene != nil) {
    [SKStoreReviewController requestReviewInScene:scene];
  }
}

@end
