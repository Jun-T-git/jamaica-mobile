<!-- STABILITY: frozen -->

# ADR-0007: ATT で IDFA の利用を求め、広告コンテンツ制限を PG に緩める

- 記録日: 2026-09-23
- 状態: Accepted（[0005](./0005-anonymous-analytics.md) の「IDFA と連携しない」は計測についての決定で、引き続き有効）

## 背景

表示される広告がスマホゲームと無関係な汎用広告ばかりだった。原因は 2 つ。

1. **IDFA を使っていなかった**（ATT 未実装）。他のゲームでゲーム広告が多いのは、IDFA に紐付いた「ゲームをよく遊ぶ人」向けのパーソナライズ広告が主で、IDFA が無いと AdMob はアプリの文脈だけで広告を選ぶ。
2. **広告コンテンツを G（全年齢）に制限していた**。スマホゲームの広告は軽い戦闘やファンタジー描写で PG/T 判定のものが多く、G では大半が除外される。

## 決定

- **ATT（App Tracking Transparency）を実装し、起動時に許可を求める。** 許可された場合のみ IDFA が広告 SDK に渡り、パーソナライズ広告が配信される。拒否されても広告は出す（非パーソナライズ）。実装は `react-native-tracking-transparency`。ATT の回答を待ってから SDK を初期化し、バナーもそれを待つ（先に読むと IDFA 無しのリクエストになる）。
- **コンテンツ制限を G から PG に緩める。** 家族向け（App Store 4+）の方針は保ちつつ、ゲーム広告が選ばれる余地を作る。T まで緩めるとガチャや戦闘描写の強い広告が入りうるため採らない。
- 広告リクエストに文脈 keywords（ゲーム・パズル・脳トレ）を付ける。効果は小さいが害はない。
- 計測（Firebase Analytics）は引き続き IDFA と連携しない（Podfile の `$RNFirebaseAnalyticsWithoutAdIdSupport`）。ATT の許可は広告配信だけに使う。

## 影響（リリース時の作業）

- プライバシーマニフェスト（`PrivacyInfo.xcprivacy`）: `NSPrivacyTracking = true`、デバイス ID をサードパーティ広告目的・トラッキングありで収集、と宣言した。
- プライバシーポリシー（ルート `docs/index.html`）に ATT と IDFA の扱いを追記した。
- **App Store Connect 側は手動で更新が必要**: アプリのプライバシー（データ収集）に「デバイス ID → サードパーティ広告 → トラッキングに使用: はい」を追加。提出時の「広告識別子（IDFA）」の質問は **「はい（広告を配信する）」** に変える（これまでは「いいえ」）。
- ATT の許可率は一般に 2〜4 割。許可しない人の広告は従来どおり文脈ベースなので、ゲーム広告が増える効果は許可した人に限られる。さらに増やすにはゲーム系ネットワークのメディエーション（Unity Ads など）が次の手。
- AdMob 管理画面のアプリのカテゴリ（ゲーム › パズル）とブロック設定は別途確認すること。

## 現状

実装は `services/adService.ts`（`initialize`, `AD_REQUEST_OPTIONS`）/ `components/molecules/BannerAdView.tsx` / `ios/ModernJamaica/Info.plist`（`NSUserTrackingUsageDescription`）/ `ios/ModernJamaica/PrivacyInfo.xcprivacy`。canonical は [../ARCHITECTURE.md](../ARCHITECTURE.md) と [../PHILOSOPHY.md](../PHILOSOPHY.md) §6。
