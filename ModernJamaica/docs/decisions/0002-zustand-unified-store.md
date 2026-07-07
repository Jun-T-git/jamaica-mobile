<!-- STABILITY: frozen -->

# ADR-0002: 単一 Zustand ストアで 2 モードを扱う

- 記録日: 2026-07-05（実装から遡って記録）
- 状態: Accepted

## 背景

チャレンジモードと無限モードは、盤面・問題生成・ノード結合・判定・タイマー・ハイスコアといった大部分の状態と振る舞いを共有する。一方で、スコアの意味（計算スコア vs 正解数）・時間・スキップ上限・ランキング可否などモード固有の差もある。

## 決定

状態管理に **Zustand** を採用し（Redux 不使用）、**単一の統合ストア `store/gameStore.ts`** に `UnifiedGameState` として両モードを同居させる。モード固有の差は `config/gameMode.ts` / `config/difficulty.ts` の設定で分岐する。設定（サウンド・表示名）は別ストア `store/settingsStore.ts` に分離。

## 理由

- 共有ロジックの重複を避けられる（結合・判定・Undo・タイマーは 1 箇所）。
- モード差を「コード分岐」ではなく「設定データ」に寄せることで、モード追加・調整が設定変更で済む。
- Zustand は軽量で、prop drilling なしにコンポーネントから直接フックできる。

## 影響 / トレードオフ

- `gameStore` が大きくなりがち（多責務）。将来的にスライス分割の余地。
- 一部の設定値が `config/` と legacy `constants/index.ts GAME_CONFIG` に二重定義される負債が残った（[../CONVENTIONS.md](../CONVENTIONS.md) 技術的負債 #3）。

## 現状

構造は [../ARCHITECTURE.md](../ARCHITECTURE.md)、振る舞いの契約は [../GAME-CORE.md](../GAME-CORE.md) を参照。
