<!-- STABILITY: canonical -->

# DESIGN-SYSTEM — デザイントークンとテーマ

見た目の一貫性を担保する単一の情報源。**トークンの正確な値は `design/modernDesignSystem.ts` が正**。ここは構造と使い方を説明し、値の一覧は複製しない。

## 正典は 1 つ: `modernDesignSystem.ts`

- **正**: `src/design/modernDesignSystem.ts` — `ModernDesign`（colors/typography/spacing/borderRadius/shadows/animation/components）、`modernGradients`、`gameThemes`、各種ヘルパー。
- コンポーネントは基本的に `constants/index.ts` 経由（再エクスポート）で `ModernDesign` を参照する。
- 旧・重複ファイル designSystem.ts（かつて src/design/ 配下にあった）は**削除済み**。復活させない。デザイン値は必ず `modernDesignSystem.ts` に集約する。

## デザイン言語

温かみのあるモダンダーク（Tetris Effect / Monument Valley / Alto's Odyssey 系）。純黒を避け、青みがかった暖かい暗色を基調に、ファミリーフレンドリーで高コントラスト。詳細な意図は [PHILOSOPHY.md](./PHILOSOPHY.md) §4。

## トークンの種類（`ModernDesign`）

| カテゴリ | キー | 用途 |
|---|---|---|
| `colors.background` | primary/secondary/tertiary/overlay | 背景の階層 |
| `colors.accent` | neon / purple / coral / gold / mint | モード・難易度の色人格 |
| `colors.text` | primary/secondary/tertiary/disabled/inverse | テキスト階層（コントラスト確保済み） |
| `colors.glass` / `border` | — | グラスモーフィズム・境界線 |
| `typography` | fontFamily / fontSize / fontWeight / lineHeight / letterSpacing | 文字 |
| `spacing` | 0–64（4px 基準） | 余白 |
| `borderRadius` | none–full | 角丸 |
| `shadows` | none/sm/base/lg/xl/glow | 影・グロー |
| `animation` | duration / easing | モーション |
| `components` | button / card / gameNode | コンポーネント別寸法 |

具体値は必ずコードを参照（このドキュメントに数値を書き写さない）。

## テーマと色人格

- **`gameThemes`**（`modernDesignSystem.ts`）: `mathematical` / `challenge`（coral+gold）/ `infinite`（neon+mint）。
- **難易度テーマ**（`config/difficulty.ts` の `theme`）: かんたん=mint / ふつう=neon(青) / むずかしい=coral(橙)。
- **`modernGradients`**: モード別・雰囲気別のグラデーション定義。

## アトミックデザイン

UI は atoms → molecules → organisms の 3 層（[ARCHITECTURE.md](./ARCHITECTURE.md) のディレクトリ参照）。

- **atoms**: 最小単位（Button, Card, Typography, Icon, StatValue, Logo, SoundToggleButton）。
- **molecules**: atoms の組み合わせ（Dialog, GameStat, RankingEntry, DifficultyTabs, CountdownOverlay, SuccessOverlay, BannerAdView 等）。
- **organisms**: 複雑な機能単位（GameBoard, GameHeader, PauseMenu, RankingBoard）。

新規 UI は既存の atoms/molecules を再利用し、直接のスタイル値ではなく `ModernDesign` トークンを使う。

## アクセシビリティ

- **Dynamic Type**: `getDynamicFontSize(base, scale, maxScale=1.3)` で文字拡大に対応（レイアウト破綻を防ぐ上限付き）。`getDynamicLineHeight` も対で使う。
- テキスト階層は安全なコントラスト比を意識した値になっている（`colors.text`）。

## アニメーション

- **RN コアの `Animated`** を使用（`react-native-reanimated` は不使用）。
- 盤面のノード選択はスプリングアニメ、エッジは `react-native-svg` の `<Line>` で描画（`components/organisms/GameBoard.tsx`）。
- 汎用の duration / easing は `ModernDesign.animation`。

---
このファイルが説明する主なコード: `src/design/modernDesignSystem.ts`（+ `config/difficulty.ts` の theme）
