<!-- STABILITY: canonical -->

# CONVENTIONS — 開発規約・検証・技術的負債

コードを書く／変更する際の規約と、変更を検証する手順、既知の負債。

## コーディング規約

- **TypeScript strict**（`tsconfig.json`）。`any` は原則避ける。型は `src/types/` に集約（`index.ts` 一般型 / `ranking.ts` ランキング型）。
- **関数コンポーネント + hooks**。クラスは `ErrorBoundary` のみ。
- **アトミックデザイン**でコンポーネントを配置（[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)）。
- **スタイルはトークン経由**。色・余白・角丸などのリテラルを直書きせず `ModernDesign`（`constants/index.ts` 経由）を使う。
- **純ロジックは `utils/` に、副作用は `services/` に**。UI から直接 Firebase / AsyncStorage を触らない。
- **Lint / Format**: ESLint（`@react-native/eslint-config`）+ Prettier。`npm run lint` を通す。

## 状態管理（Zustand）

- 状態は `store/gameStore.ts`（ゲーム）、`store/settingsStore.ts`（設定）、`store/statsStore.ts`（自己記録）、`store/monetizationStore.ts`（購入・閲覧権利）に集約。
- **prop drilling を避け、コンポーネントで Zustand フックを直接使う**。
- 新しいゲーム状態フィールド／アクションは既存ストアの型定義に追加し、[GAME-CORE.md](./GAME-CORE.md) / [ARCHITECTURE.md](./ARCHITECTURE.md) の該当箇所を追随更新（下の「ドキュメント更新規約」）。

## 設定の置き場所

- モード差 → `config/gameMode.ts`、難易度差 → `config/difficulty.ts`、ダイアログ文言 → `config/dialogs.ts`、広告頻度・閲覧期限 → `config/monetization.ts`、スコア定数 → `constants/scoreConfig.ts`。
- **マジックナンバーを散らさない**。調整可能な値は上記 config/constants に定数として置く。

## 国際化（i18n）

- **UI テキストは日本語が正**（[PHILOSOPHY.md](./PHILOSOPHY.md) 不変条件 #5）。
- ユーザーに見える文字列をコードに直書きする場合も日本語で統一。難易度ラベル等は `label.ja` を使用（`en` は将来拡張用の予約）。
- 主要用語: チャレンジモード / 無限に遊ぶ / 目標 / スキップ / やり直す / かんたん・ふつう・むずかしい。

## テスト

購入・広告のテストでは、成功だけでなく取消・保留・表示失敗・遅延コールバック・購入権利読み込みの競合を検証する。StoreKit/AdMob のモック成功は実ストア購入の検証に数えない（`docs/MONETIZATION.md` 参照）。

- **Jest**（`preset: react-native`、`jest.config.js`）。
- `__tests__/` に純ロジック・コンポーネント等のテストを置く。対象と最新の実行結果はコードと実行ログを正とし、ネイティブの購入・広告 SDK は別途実機で確認する（[MONETIZATION.md](./MONETIZATION.md)）。
- 純ロジック（`utils/`）は React 非依存でテストしやすい。新規のコアロジックには最低限のユニットテストを付けること。
- 実行: `npm test` / `npm test -- --coverage`。

## 開発・検証コマンド

```bash
npm start                 # Metro 起動
npm run ios               # iOS 実行（要 Xcode / CocoaPods）
npm run android           # Android 実行
npm run lint              # ESLint
npm test                  # Jest
npx tsc --noEmit          # 型チェック（CI 相当のゲート）
```

**変更を「検証済み」と言う前に最低限**: `npm test` が green であること、UI/挙動を変えた場合はシミュレータ/実機で実際に動かして確認する（`/run`・`/verify` も利用可）。

> `npx tsc --noEmit` と `npm run lint` は現在 green（lint は既存の warning が 1 件。下記「既知の技術的負債」#6/#7 は解消済み）。自分の変更で新たなエラーや warning を増やさないこと。

### iOS 初回セットアップ

```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

## ドキュメント更新規約（重要）

**コードが正**（[README.md](./README.md)）。実装を変えたら対応する canonical 文書を同じ変更内で更新する。機能完了前に **`/sync-docs`** を実行。

| 変更したコード | 更新する canonical 文書 |
|---|---|
| `store/gameStore.ts`, `utils/problemGenerator.ts`, `utils/scoreCalculator.ts`, `constants/scoreConfig.ts`, `config/difficulty.ts`, `config/gameMode.ts`, `types/` | [GAME-CORE.md](./GAME-CORE.md) |
| `design/modernDesignSystem.ts` | [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) |
| ディレクトリ構成・モジュール境界・新 service/screen・依存追加 | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| コード規約・テスト方針・技術的負債の解消 | このファイル |
| ゲームの本質・不変条件・デザイン/収益方針 | [PHILOSOPHY.md](./PHILOSOPHY.md) |
| 設計上の分岐判断（不変条件を破る等） | `decisions/` に**新規 ADR を追加**（既存は書き換えない） |

canonical 文書は**薄く保つ**。関数シグネチャや具体数値を散文で二重化せず、コードを指す。

## 既知の技術的負債（別タスク）

これらは今回のスコープ外だが、実装に存在する事実として記録する。触れる際に是正を検討。

0. **広告の ATT 対応はリリース時に App Store Connect の手動更新が要る**: `services/adService.ts` は起動時に ATT を求め IDFA を広告に使う（[decisions/0007](./decisions/0007-att-and-ad-targeting.md)）。App Store Connect のアプリのプライバシーは申告済み（デバイス ID → サードパーティ広告 → トラッキングあり）。提出時の IDFA 質問は `fastlane/Fastfile` の release レーンが「はい（広告配信）」で送る。**`PrivacyInfo.xcprivacy` の `NSPrivacyTracking` は false のまま**にすること（true にするとトラッキングドメインの列挙が必須になり、無いと審査提出時に ITMS-91064「バイナリが無効」になる。2026-09-23 に 1.2.0 で発生）。トラッキングの申告は App Store Connect のアプリのプライバシーで行う。ゲーム系広告ネットワークのメディエーションは未導入。
1. **Android AdMob 本番 ID 未取得**: `services/adService.ts` の Android 広告 ID（インタースティシャル/リワード）は本番 ID が未取得のため `undefined`（無効なプレースホルダ ID を渡すと広告枠が壊れるため）。この間 Android 本番では広告を出さない（対象 ID が未設定で、全画面広告を利用できない）。iOS インタースティシャルは設定済み。リワード ID の状態は `config/monetization.ts` を参照。バナーは全プラットフォームで廃止済み。**本アプリは iOS のみをリリース対象とする方針のため、この負債は実質的に問題にならない**（Android を配信する場合のみ本番 ID の取得と `Platform.select` の `android` への設定が必要）。
2. ~~Firestore ルールと実装の乖離~~ **解消**: Firebase 匿名認証を導入し、ランキングは認証 UID をドキュメント ID とする `userScoresV2` に移行（[decisions/0004-ranking-v2-anonymous-auth.md](./decisions/0004-ranking-v2-anonymous-auth.md)）。**運用上の前提**: Firebase コンソールで Anonymous 認証が有効であること、`firestore.rules` がデプロイ済みであること（`firebase deploy --only firestore:rules`）。未対応だとスコア送信だけが失敗する（ゲーム進行には影響しない。失敗分は端末に控えて次回再送）。
3. **設定の重複**: `config/gameMode.ts` と `constants/index.ts` の `GAME_CONFIG` に同種の値（チャレンジ 60s / スキップ 2 等）が二重定義。`GAME_CONFIG` は主にテスト参照で、`TARGET.MIN/MAX` は現行生成器で未使用。config/ 系に一本化するのが望ましい。
4. **ネイティブ連携は自動テストだけでは保証できない**: StoreKit・AdMob の実際の購入/広告 UI、復元、返金、通信障害は [MONETIZATION.md](./MONETIZATION.md) の手動検証を実施する。
5. **`ProblemData.solutions` 未使用**: 型にあるが生成器は設定しない（将来用予約）。
6. ~~既存の型エラー~~ **解消**: `tsc --noEmit` は green。
7. ~~既存の lint エラー~~ **解消**: `npm run lint` はエラー 0。
8. **旧ランキングデータ**: Firestore の `userScores`（V1）は旧スコア計算式・非認証 ID のデータで、読み取り専用のまま残している。不要になったら削除する。
9. **買い切り商品の運用設定と実機検証が必要**: `config/monetization.ts` のリワード iOS 本番 ID は作成・設定済み。App Store Connect は未ログインで、本番の StoreKit 商品は未登録。商品登録・価格設定・審査と Sandbox/実機検証は [MONETIZATION.md](./MONETIZATION.md) を参照。Android 購入ブリッジは未実装（配信対象外）。
10. **不正解音は合成音**: `ios/wrong.wav` はスクリプトで合成した仮の音。他の効果音と質感を揃えた音源への差し替えが望ましい。

---
このファイルが説明する主なコード: `tsconfig.json` / `jest.config.js` / `.eslintrc.js` / `config/*` / `services/adService.ts` / `firestore.rules`
