# fastlane — TestFlight リリース自動化

iOS ビルドを TestFlight へ配信する。**iOS のみリリース対象**（Android は配信しない）。

## レーン

### `ios beta`
Release ビルドを作成し TestFlight（内部テスター）へアップロードする。

- バージョン（marketing version）は引数で指定。
- ビルド番号は「同バージョン train の最新 +1」で自動採番（単調増加）。
- 署名は App Store Connect API キーによる**クラウド配布署名**（証明書をリポジトリに置かない）。

```bash
bundle exec fastlane ios beta version:1.1.4 changelog:"広告設定の修正"
```

必要な環境変数:

| 変数 | 内容 |
|---|---|
| `ASC_KEY_ID` | App Store Connect API キーの Key ID |
| `ASC_ISSUER_ID` | 同 Issuer ID（チーム共通） |
| `ASC_KEY_PATH` | ダウンロードした `AuthKey_*.p8` のパス |

> API キーは **Admin ロール**であること。App Manager 以下だとクラウド配布証明書の作成が 403 で失敗する。

## CI（GitHub Actions）

ワークフロー: `.github/workflows/ios-testflight.yml`（手動トリガー `workflow_dispatch`）。

```bash
gh workflow run ios-testflight.yml -f version=1.1.4 -f changelog="広告設定の修正"
```

### 必要な GitHub Secrets

リポジトリの Settings → Secrets and variables → Actions に登録:

| Secret | 内容 | 例 |
|---|---|---|
| `APP_STORE_CONNECT_KEY_ID` | Key ID | `5YYWZS47QX` |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID | `72df938e-…` |
| `APP_STORE_CONNECT_KEY_BASE64` | `.p8` を base64 化した文字列 | `base64 -i AuthKey_XXXX.p8 \| pbcopy` |

`gh` で登録する例:

```bash
gh secret set APP_STORE_CONNECT_KEY_ID --body "5YYWZS47QX"
gh secret set APP_STORE_CONNECT_ISSUER_ID --body "72df938e-43ed-4ea6-ad00-60250d211c17"
gh secret set APP_STORE_CONNECT_KEY_BASE64 < <(base64 -i ~/.appstoreconnect/private_keys/AuthKey_5YYWZS47QX.p8)
```

## 補足

- **Export Compliance**: 暗号化を輸出対象として使っていない場合、`ios/ModernJamaica/Info.plist` に
  `ITSAppUsesNonExemptEncryption=false` を追加しておくと、アップロード後の「Missing Compliance」で
  止まらず内部テスターへ自動配信される。追加は輸出コンプライアンス上の申告なので、内容を確認のうえ行うこと。
- **外部テスター**へ配信する場合は Fastfile の `distribute_external: true` にする（初回は Beta App Review が必要）。
- ローカルの非常に新しい Xcode では `fmt` のコンパイルが失敗することがあるが、CI ランナーは安定版 Xcode のため発生しない。
