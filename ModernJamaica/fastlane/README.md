fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Release ビルドを作成し TestFlight へアップロードする

使い方: bundle exec fastlane ios beta version:1.1.4 changelog:"広告設定の修正"



必要な環境変数（CI では GitHub Secrets から注入）:

  ASC_KEY_ID    … App Store Connect API キーの Key ID

  ASC_ISSUER_ID … 同 Issuer ID（チーム共通）

  ASC_KEY_PATH  … ダウンロードした AuthKey_*.p8 のパス

### ios metadata

```sh
[bundle exec] fastlane ios metadata
```

App Store の掲載文(タイトル/サブタイトル/説明/キーワード/宣伝文/URL/What's New)とスクリーンショットを反映する（バイナリは送らない）

使い方: bundle exec fastlane ios metadata version:1.1.4



反映するのは fastlane/metadata/ja/*.txt と fastlane/screenshots/ja/*.png。

App Review の連絡先は fastlane/metadata/review_information/*.txt（公開リポジトリのため CI が Secrets から生成。

ローカルでは .gitignore 済みのこのフォルダに手で置く）。審査提出にはこの連絡先が必須。

掲載文はリポジトリが正（fastlane/metadata/ja）。実行すると App Store Connect の現行値を上書きするので、

変更内容を確認してから流すこと。審査提出はしない。

必要な環境変数は beta レーンと同じ（ASC_KEY_ID / ASC_ISSUER_ID / ASC_KEY_PATH）。

### ios release

```sh
[bundle exec] fastlane ios release
```

本番リリース: 最新ビルドを紐付けて審査提出する（メタデータ/スクショは触らない）

使い方: bundle exec fastlane ios release version:1.1.4 [build:5]



- build を省略すると該当バージョンの最新の処理済みビルドを紐付ける。同じバージョンに複数のビルドが

  あるときは build で番号を固定する（処理待ちの新ビルドではなく古いビルドが選ばれるのを防ぐ）

- What's New とスクショは事前に `metadata` レーンで反映しておくこと。ここでは再アップロードしない

  （deliver 再アップロードによるスクショ重複を避けるため、掃除と提出を分離）

- 輸出コンプライアンス: 非該当（暗号化なし。Info.plist の ITSAppUsesNonExemptEncryption=false と整合）

- 広告識別子(IDFA): 使用する（広告配信のため。ATT で許可を求め、iOS の制限設定を尊重する。ADR-0007）

- 審査承認後は自動で公開（automatic_release）

必要な環境変数は beta レーンと同じ（ASC_KEY_ID / ASC_ISSUER_ID / ASC_KEY_PATH）。

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

## リリース記録 — 2026-10-27 21:58 JST

- **1.3.3 (1)**: 木の段間隔を均等化し、木の高さ上限と上下の余白を調整。重なり防止の最小間隔を上限より優先する。提出元のローカル変更は未コミット。
- 検証: TypeScript・lint 成功、19 suites / 132 tests 成功。シミュレーターで木の全段表示を確認。ローカル Xcode Release の archive・export・upload 成功。
- Archive: `/Users/junteraoka/Library/Developer/Xcode/Archives/2026-10-27/ModernJamaica 1.3.3 (1).xcarchive`。IPA: `build/ModernJamaica-1.3.3-1.ipa`（ModernJamaica 配下）。
- Build ID: `361f8d44-0258-4a5e-9b80-afcc9226a04b`。処理状態 `VALID`、既存の内部グループへ自動配信され `IN_BETA_TESTING`。外部配信は未実施。
- 日本語リリースノートを更新し、既存スクリーンショット 6 枚を継承。初回の審査提出は年齢区分の必須 `socialMedia` 未設定で失敗したため、ソーシャル機能がない実装に合わせてドラフトの `socialMedia` / `socialMediaAgeRestricted` を `false` に設定し、`fastlane ios release` の再実行で提出成功。
- Version ID: `aecd6cc7-a69b-4f8d-a2b5-e33d181ac575`。Review Submission ID: `d663c267-ec0f-47b9-802f-a9ee1c65a3ec`。提出時刻は `2026-10-27T12:58:39Z`。API で同じビルドの紐付け、`WAITING_FOR_REVIEW`、承認後の自動公開 `AFTER_APPROVAL` を確認。
