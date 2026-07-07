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

- 状態は `store/gameStore.ts`（ゲーム）と `store/settingsStore.ts`（設定）に集約。
- **prop drilling を避け、コンポーネントで Zustand フックを直接使う**。
- 新しいゲーム状態フィールド／アクションは既存ストアの型定義に追加し、[GAME-CORE.md](./GAME-CORE.md) / [ARCHITECTURE.md](./ARCHITECTURE.md) の該当箇所を追随更新（下の「ドキュメント更新規約」）。

## 設定の置き場所

- モード差 → `config/gameMode.ts`、難易度差 → `config/difficulty.ts`、ダイアログ文言 → `config/dialogs.ts`、スコア定数 → `constants/scoreConfig.ts`。
- **マジックナンバーを散らさない**。調整可能な値は上記 config/constants に定数として置く。

## 国際化（i18n）

- **UI テキストは日本語が正**（[PHILOSOPHY.md](./PHILOSOPHY.md) 不変条件 #5）。
- ユーザーに見える文字列をコードに直書きする場合も日本語で統一。難易度ラベル等は `label.ja` を使用（`en` は将来拡張用の予約）。
- 主要用語: チャレンジモード / 無限に遊ぶ / 目標 / スキップ / やり直す / かんたん・ふつう・むずかしい。

## テスト

- **Jest**（`preset: react-native`、`jest.config.js`）。
- 現状のテストは `__tests__/utils/problemGenerator.test.ts` のみ。**カバレッジは低い**（下記負債）。
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

**変更を「検証済み」と言う前に最低限**: `npm test` が green であること（16 tests）、UI/挙動を変えた場合はシミュレータ/実機で実際に動かして確認する（`/run`・`/verify` も利用可）。

> ⚠️ **ベースラインの注意**: 現状 `npx tsc --noEmit` と `npm run lint` は**既存エラーで red**（下記「既知の技術的負債」#6/#7）。したがって合否は「全て green」ではなく **「自分の変更で新たなエラーを増やしていないこと」** で判断する。触れたファイルにエラーが出たら是正する。ベースラインの是正は歓迎だが別タスク。

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

1. **Android AdMob 本番 ID 未取得**: `services/adService.ts` の Android 広告 ID（バナー/インタースティシャル）は本番 ID が未取得のため `undefined`（無効なプレースホルダ ID を渡すと広告枠が壊れるため）。この間 Android 本番では広告を出さない（`getBannerAdUnitId()` が `undefined` を返し BannerAdView は null、interstitial は未初期化）。iOS は設定済み。**本アプリは iOS のみをリリース対象とする方針のため、この負債は実質的に問題にならない**（Android を配信する場合のみ本番 ID の取得と `Platform.select` の `android` への設定が必要）。
2. **Firestore ルールと実装の乖離**: `firestore.rules` は `request.auth != null && request.auth.uid == userId`（Firebase Auth 前提）だが、`@react-native-firebase/auth` は**未導入**で `userService` は AsyncStorage の匿名 ID を使う。実際の書き込み経路とルールが整合していない可能性。詳細は [decisions/0003-firestore-ranking.md](./decisions/0003-firestore-ranking.md)。
3. **設定の重複**: `config/gameMode.ts` と `constants/index.ts` の `GAME_CONFIG` に同種の値（チャレンジ 60s / スキップ 2 等）が二重定義。`GAME_CONFIG` は主にテスト参照で、`TARGET.MIN/MAX` は現行生成器で未使用。config/ 系に一本化するのが望ましい。
4. **テストカバレッジが低い**: `scoreCalculator` / `gameStore`（connectNodes・判定・タイマー）/ services / stores / 画面が未テスト。
5. **`ProblemData.solutions` 未使用**: 型にあるが生成器は設定しない（将来用予約）。
6. **既存の型エラー（`tsc --noEmit` が red）**: `screens/SettingsScreen.tsx` に 3 件。特に `SoundType.SUCCESS` を参照しているが `SoundType` に `SUCCESS` は存在しない（実在は `CONNECT` / `CORRECT` などで、success.mp3 は `CORRECT` に割当。`utils/SoundManager.ts`）。他に style 配列と Typography の `ellipsizeMode` prop の型不整合。
7. **既存の lint エラー（`npm run lint` が red・8 件）**: 未使用変数/インポート（`components/molecules/RankingEntry.tsx`, `components/organisms/RankingBoard.tsx`, `screens/ModeSelectionScreen.tsx`）。`RankingBoard.tsx` は Pull-to-Refresh 関連（`ScrollView`/`RefreshControl`/`handleRefresh`/`isRefreshing`）が未使用のまま残っており、実装途中の可能性。

---
このファイルが説明する主なコード: `tsconfig.json` / `jest.config.js` / `.eslintrc.js` / `config/*` / `services/adService.ts` / `firestore.rules`
