# CLAUDE.md — Modern Jamaica（アプリ憲法）

Claude Code がこのアプリのコードで作業するときの最上位ガイド。**このファイルは薄く保ち、詳細は `docs/` の canonical 文書に委ねる。**

## 第一原則: コードが正（Source of Truth）

このアプリは**リリース済み**。**実装が真実**。ドキュメントと実装が矛盾したら、**コードを正としてドキュメントを直す**（逆はしない）。
（過去の CLAUDE.md は実装と大きく乖離していた。同じ轍を踏まないための仕組みが `docs/` と `.claude/` にある。）

## これは何のアプリか

**Modern Jamaica（ジャマイカの木）** — 5 つの数字と四則演算（＋−×÷）で**式の木**を組み立て、**目標値**に到達させる数字パズルゲーム。全数字を使い切り、最後に残る単一ノード（木の根）が目標値と一致すれば正解。生成される問題は**必ず解ける**ことが保証される。

哲学と**絶対に壊してはいけない不変条件**は必読 → **[docs/PHILOSOPHY.md](./docs/PHILOSOPHY.md)**

## ドキュメントの歩き方

作業前に、対象に応じて canonical 文書（`docs/`）を読む。**canonical 文書は実装と一致した常緑。ここ CLAUDE.md や docs に具体数値・シグネチャを二重化しない**（腐る原因）。

| 目的 | 読む文書 |
|---|---|
| 何を作るべきか・壊してはいけないもの | [docs/PHILOSOPHY.md](./docs/PHILOSOPHY.md) |
| 全体構造・どこに何があるか・データフロー | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| ゲームルール・ノードモデル・判定・問題生成・スコア | [docs/GAME-CORE.md](./docs/GAME-CORE.md) |
| 色・余白・テーマ・アトミックデザイン | [docs/DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) |
| 規約・テスト・検証手順・**技術的負債** | [docs/CONVENTIONS.md](./docs/CONVENTIONS.md) |
| 過去の設計判断（凍結） | [docs/decisions/](./docs/decisions/) |
| 文書全体の考え方（安定性ティア） | [docs/README.md](./docs/README.md) |

## 技術スタック（要点）

React Native 0.80.2 + React 19 + TypeScript(strict) / Zustand / React Navigation 7 / react-native-svg（盤面エッジ）/ Firebase Firestore（ランキング）/ AsyncStorage / AdMob / react-native-sound。

**盤面操作はタップ方式**（drag&drop ではない）。**`react-native-reanimated` は不使用**（アニメは RN コア `Animated`）。詳細は [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

## 開発コマンド

```bash
npm start                 # Metro 起動
npm run ios               # iOS 実行（要 Xcode）
npm run android           # Android 実行
npm run lint              # ESLint
npm test                  # Jest
npx tsc --noEmit          # 型チェック

# iOS 初回のみ
cd ios && bundle install && bundle exec pod install && cd ..
```

**「検証済み」と言う前に**: `npx tsc --noEmit` + `npm run lint` + `npm test` を通し、UI/挙動変更はシミュレータ/実機で動かす（`/run`・`/verify` 可）。

## 作業の進め方（自律開発ワークフロー）

1. **読む**: 対象領域の canonical 文書と該当コードを読む。コードが正。
2. **不変条件を守る**: [docs/PHILOSOPHY.md](./docs/PHILOSOPHY.md) の不変条件を破らない。コア（`store/gameStore.ts`, `utils/problemGenerator.ts`, `utils/scoreCalculator.ts`）に触れる変更は `game-core-guardian` サブエージェントでレビューする。
3. **実装**: 既存パターン・トークン・config を再利用。マジックナンバーは config/constants へ。
4. **検証**: 上記コマンド。
5. **文書を追随**: 下の更新規約に従い canonical 文書を更新し、**完了前に `/sync-docs` を実行**。

## ドキュメント更新規約（コードを変えたら文書も直す）

| 変更したコード | 更新する canonical 文書 |
|---|---|
| `store/gameStore.ts`, `utils/problemGenerator.ts`, `utils/scoreCalculator.ts`, `constants/scoreConfig.ts`, `config/difficulty.ts`, `config/gameMode.ts`, `types/` | [docs/GAME-CORE.md](./docs/GAME-CORE.md) |
| `design/modernDesignSystem.ts` | [docs/DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) |
| 構成・モジュール境界・新 service/screen・依存追加 | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| 規約・テスト方針・負債 | [docs/CONVENTIONS.md](./docs/CONVENTIONS.md) |
| 本質・不変条件・デザイン/収益方針 | [docs/PHILOSOPHY.md](./docs/PHILOSOPHY.md) |
| 設計判断（不変条件を破る等） | `docs/decisions/` に**新規 ADR 追加**（既存は書き換えない） |

対応表とスクリプトの実体は `../.claude/`（`doc-manifest.json` / `check-doc-drift.mjs`）。

## 既知の技術的負債（着手時に確認）

Android AdMob 本番 ID 未設定 / Firestore ルールと auth 実装の乖離 / `config` と `GAME_CONFIG` の二重定義 / テストカバレッジ低 / `ProblemData.solutions` 未使用。詳細と背景は [docs/CONVENTIONS.md](./docs/CONVENTIONS.md)。
