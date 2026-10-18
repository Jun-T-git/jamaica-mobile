import Foundation
import StoreKit
import React

// BEGIN MEASUREMENT BUILD COMPARATOR
// Strict numeric dot components; never compare lexicographically or accept marketing suffixes.
func compareMeasurementBuilds(_ lhs: String, _ rhs: String) -> Int? {
  func components(_ value: String) -> [String]? {
    let parts = value.split(separator: ".", omittingEmptySubsequences: false)
    guard !parts.isEmpty, parts.allSatisfy({ !$0.isEmpty && $0.utf8.allSatisfy({ $0 >= 48 && $0 <= 57 }) }) else { return nil }
    return parts.map { part in
      let trimmed = part.drop(while: { $0 == "0" })
      return trimmed.isEmpty ? "0" : String(trimmed)
    }
  }
  guard let left = components(lhs), let right = components(rhs) else { return nil }
  for index in 0..<max(left.count, right.count) {
    let a = index < left.count ? left[index] : "0"
    let b = index < right.count ? right[index] : "0"
    if a.count != b.count { return a.count < b.count ? -1 : 1 }
    if a != b { return a < b ? -1 : 1 }
  }
  return 0
}
func classifyMeasurementInstall(original: String, current: String, cutoff: String, isProduction: Bool, bundleMatches: Bool) -> String {
  guard isProduction, bundleMatches,
        let currentVsCutoff = compareMeasurementBuilds(current, cutoff), currentVsCutoff >= 0,
        let originalVsCurrent = compareMeasurementBuilds(original, current), originalVsCurrent <= 0,
        let originalVsCutoff = compareMeasurementBuilds(original, cutoff) else { return "unknown" }
  return originalVsCutoff >= 0 ? "verified_new" : "verified_existing"
}
func isMeasurementCollectionAllowed() -> Bool {
  #if DEBUG
  return false
  #else
  let info = Bundle.main.infoDictionary ?? [:]
  return !((info["CommonMeasurementDisabled"] as? Bool) == true
    || (info["FIREBASE_ANALYTICS_COLLECTION_DEACTIVATED"] as? Bool) == true
    || (info["FIREBASE_ANALYTICS_COLLECTION_ENABLED"] as? Bool) == false
    || (info["FirebaseDataCollectionDefaultEnabled"] as? Bool) == false
    || ProcessInfo.processInfo.arguments.contains(where: { ["--screenshots", "--screenshot-mode", "--measurement-disabled"].contains($0) }))
  #endif
}
// END MEASUREMENT BUILD COMPARATOR

/// StoreKit 2 の端末内検証を使用。購入権利を UserDefaults から付与しない。
@objc(PurchaseModule)
class PurchaseModule: RCTEventEmitter {
  private let productID = "com.junt.modernjamaica.remove_ads"
  private var updates: Task<Void, Never>?
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! { ["purchaseEntitlementChanged"] }
  // Synchronous setting gate: JS must discard disabled/debug observations before writing pending value.
  override func constantsToExport() -> [AnyHashable: Any]! {
    ["measurementCollectionAllowed": isMeasurementCollectionAllowed()]
  }

  override func startObserving() {
    hasListeners = true
    guard updates == nil else { return }
    updates = Task { [weak self] in
      for await result in Transaction.updates {
        guard let self else { return }
        guard case .verified(let transaction) = result,
              transaction.productID == self.productID else { continue }
        let owned = await self.isOwned()
        await MainActor.run {
          if self.hasListeners {
            self.sendEvent(withName: "purchaseEntitlementChanged", body: ["owned": owned])
          }
        }
        await transaction.finish()
      }
    }
  }

  override func stopObserving() { hasListeners = false }
  override func invalidate() {
    updates?.cancel()
    updates = nil
    super.invalidate()
  }

  private func isOwned() async -> Bool {
    for await result in Transaction.currentEntitlements {
      if case .verified(let transaction) = result,
         transaction.productID == productID,
         transaction.revocationDate == nil {
        return true
      }
    }
    return false
  }

  /// No refresh/authentication UI. A release must explicitly configure its first measurement build.
  @objc(getMeasurementInstallEvidence:rejecter:)
  func getMeasurementInstallEvidence(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard isMeasurementCollectionAllowed() else { resolve("unknown"); return }
    guard #available(iOS 16.0, *),
          let cutoff = Bundle.main.object(forInfoDictionaryKey: "CommonMeasurementFirstBuild") as? String,
          let current = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String,
          let currentComparison = compareMeasurementBuilds(current, cutoff), currentComparison >= 0 else {
      resolve("unknown")
      return
    }
    Task {
      do {
        guard case .verified(let transaction) = try await AppTransaction.shared else {
          resolve("unknown")
          return
        }
        resolve(classifyMeasurementInstall(
          original: transaction.originalAppVersion, current: current, cutoff: cutoff,
          isProduction: transaction.environment == .production,
          bundleMatches: transaction.bundleID == Bundle.main.bundleIdentifier
        ))
      } catch { resolve("unknown") }
    }
  }

  @objc(getEntitlement:rejecter:)
  func getEntitlement(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { resolve(await isOwned()) }
  }

  @objc(getProduct:rejecter:)
  func getProduct(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        guard let product = try await Product.products(for: [productID]).first,
              product.type == .nonConsumable else { resolve(nil); return }
        resolve(["price": product.displayPrice])
      } catch { reject("store_unavailable", "商品情報を取得できませんでした。", error) }
    }
  }

  @objc(purchase:rejecter:)
  func purchase(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      do {
        guard let product = try await Product.products(for: [productID]).first,
              product.type == .nonConsumable else {
          reject("product_unavailable", "現在この商品は購入できません。", nil)
          return
        }
        switch try await product.purchase() {
        case .success(let verification):
          guard case .verified(let transaction) = verification,
                transaction.productID == productID,
                transaction.revocationDate == nil else {
            reject("unverified", "購入を確認できませんでした。購入を復元してください。", nil)
            return
          }
          // 永続的な権利は StoreKit に保存され、次回起動でも currentEntitlements で復元される。
          await transaction.finish()
          resolve("purchased")
        case .userCancelled: resolve("cancelled")
        case .pending: resolve("pending")
        @unknown default: resolve("pending")
        }
      } catch { reject("purchase_failed", "購入を完了できませんでした。", error) }
    }
  }

  @objc(restore:rejecter:)
  func restore(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      do {
        try await AppStore.sync()
        resolve(await isOwned())
      } catch { reject("restore_failed", "購入を復元できませんでした。", error) }
    }
  }
}
