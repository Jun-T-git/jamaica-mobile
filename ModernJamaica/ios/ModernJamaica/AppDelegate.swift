import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Firebase初期化 - 環境別設定ファイル選択
    #if DEBUG
    let configFileName = "GoogleService-Info-Dev"
    #else
    let configFileName = "GoogleService-Info-Prod"
    #endif
    
    print("🔥 Firebase設定ファイル: \(configFileName)")
    
    if let path = Bundle.main.path(forResource: configFileName, ofType: "plist") {
      print("✅ 設定ファイルが見つかりました: \(path)")
      if let options = FirebaseOptions(contentsOfFile: path) {
        print("✅ FirebaseOptions作成成功")
        FirebaseApp.configure(options: options)
      } else {
        print("❌ FirebaseOptions作成失敗")
        FirebaseApp.configure()
      }
    } else {
      print("❌ 設定ファイルが見つかりません: \(configFileName).plist")
      print("📁 Bundle内のリソース一覧:")
      if let resourcePath = Bundle.main.resourcePath {
        let files = try? FileManager.default.contentsOfDirectory(atPath: resourcePath)
        print(files?.filter { $0.contains("GoogleService") } ?? ["なし"])
      }
      // フォールバック: 標準のconfigure()を試行
      FirebaseApp.configure()
    }
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "ModernJamaica",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
