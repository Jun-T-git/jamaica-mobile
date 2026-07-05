<!-- STABILITY: frozen -->

# ADR-0001: 盤面操作は drag&drop でなく tap-to-connect

- 記録日: 2026-07-05（実装から遡って記録）
- 状態: Accepted

## 背景

式の木を組み立てるには「2 つのノードを 1 つの演算子で結合する」操作を繰り返す。この操作の入力方式として drag&drop と tap 方式が候補になった。

## 決定

**タップで繋ぐ（tap-to-connect）** を採用。手順は「ノードをタップ → 演算子（＋−×÷）をタップ → もう一方のノードをタップ」の 3 タップで 1 結合。ノードは固定グリッド上に配置し、`react-native-svg` の `<Line>` で結合エッジを描画する。

## 理由

- 片手・親指だけで完結でき、モバイルで扱いやすい。
- ドラッグ中の座標追従やヒットテストの複雑さ・誤操作を避けられる。
- `react-native-gesture-handler` / `PanResponder` / `react-native-reanimated` に依存せずに実装でき、実装・保守が軽い（実際これらは盤面で不使用）。

## 影響

- 盤面は `components/organisms/GameBoard.tsx` にタップ主体で実装。選択フィードバックは RN コア `Animated` のスプリング。
- 「drag&drop + reanimated によるツリー成長アニメ」という初期構想は**不採用**。（過去のドキュメントにその記述が残っていたが実装されていない）

## 現状

実装の詳細は canonical の [../GAME-CORE.md](../GAME-CORE.md) §4 と [../DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md) を参照。
