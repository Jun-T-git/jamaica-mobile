import Foundation
import StoreKit
import React

/// StoreKit 2 の端末内検証を使用。購入権利を UserDefaults から付与しない。
@objc(PurchaseModule)
class PurchaseModule: RCTEventEmitter {
  private let productID = "com.junt.modernjamaica.remove_ads"
  private var updates: Task<Void, Never>?
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! { ["purchaseEntitlementChanged"] }

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
