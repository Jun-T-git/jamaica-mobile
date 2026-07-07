<!-- STABILITY: canonical -->

# GAME-CORE — ゲームルールとコアアルゴリズムの契約

コアの「契約（振る舞いの保証）」を記す。**アルゴリズムの正確な実装はコードが正**。ここは契約と不変条件を説明し、実装ファイルを指す。ここに書かれた不変条件は [PHILOSOPHY.md](./PHILOSOPHY.md) と対になる。

## 1. データモデル（`types/index.ts`）

木のノードは単一の型 `NodeData` で表す。**「内部ノード専用の型」は存在しない**（葉も内部ノードも `NodeData`）。

- `isLeaf: true` … 最初に配られる 5 つの数字（`leaf-0` 〜 `leaf-4`）。
- `isLeaf: false` … 2 ノードを結合して生成される内部ノード（`internal-<id>`）。`operator` と `leftChildId` / `rightChildId` を持つ。
- `isUsed` … 既に結合の子として消費されたか。`true` のノードは再結合できない。
- `parentId` / `depth` / `position` … 木構造とレイアウト用。

問題は `ProblemData { numbers, target, difficulty, solutions? }`。**`solutions` は現状の生成器では設定されない（`undefined`）**。将来用の予約フィールド。

## 2. 問題生成（`utils/problemGenerator.ts`）

エントリポイント: `generateProblem(difficulty: DifficultyLevel): ProblemData`

1. 難易度設定（`config/difficulty.ts`）の `numberRange` から**ランダムな整数を 5 つ**生成。
2. `calculateTarget(numbers)` が 5 数字を**再帰的にランダムな演算で畳み込み**、最終的な単一値を `target` とする。
3. `numbers` はシャッフルして返す。

**不変条件（解の保証）**: `calculateTarget` の畳み込み過程そのものが 1 つの有効な解になっているため、**生成される問題は必ず 5 数字全部で `target` に到達できる**。この性質を壊す変更は禁止（[PHILOSOPHY.md](./PHILOSOPHY.md) 不変条件 #1）。

**演算子の制約**（`applyOperator`）:
- `−` は `Math.abs(a-b)`（負を出さない）。
- `÷` は割り切れる時のみ（`a % b === 0` か `b % a === 0`）。不可なら `+ − ×` から選び直して再試行。

> **重要**: 「加算のみ／乗算のみ／混合」といった**問題タイプは存在しない**。生成器は難易度の数値レンジだけでパラメータ化された単一のロジック。（過去のドキュメントの誤り）

`generateProblemExhaustive()` は `@deprecated` な後方互換ラッパ（`generateProblem(NORMAL)` を呼ぶだけ）。

## 3. 難易度（`config/difficulty.ts`）

| 難易度 | 数字レンジ | 初期時間 | 正解ボーナス | 色 |
|---|---|---|---|---|
| かんたん (EASY) | 1–4 | 120s | +20s | mint |
| ふつう (NORMAL) | 1–6 | 60s | +10s | neon(青) |
| むずかしい (HARD) | 1–10 | 60s | +10s | coral(橙) |

既定難易度は `DEFAULT_DIFFICULTY = NORMAL`。時間はチャレンジモードでこの難易度別値が使われる（`gameMode.ts` の 60s は無限モード等の基準）。

## 4. ノード結合と正解判定（`store/gameStore.ts connectNodes`）

UI 操作は**タップで繋ぐ**（ノード → 演算子 → ノード）。`connectNodes(firstNodeId, secondNodeId, operator)` の契約:

1. 2 ノードを取得。どちらかが `isUsed` なら結合しない（多重使用の防止）。
2. 演算子で結果を計算（`+ − × ÷`）。**除算は 0 を回避し、小数第 2 位に丸める**。
3. `internal-<id>` の新ノードを生成し、`leftChildId` / `rightChildId` を設定。元の 2 ノードを `isUsed: true`・`parentId` 設定（＝子になる）。
4. **完成チェック**: 未使用ノードが 1 つだけ（`activeNodes.length === 1`）になったら、その値 `finalValue` と `targetNumber` を比較。
5. **正解条件**: `Math.abs(finalValue - targetNumber) < 0.001`。この閾値は浮動小数点誤差の吸収用（[PHILOSOPHY.md](./PHILOSOPHY.md) 不変条件 #3）。
   - 正解: 効果音・スコア/コンボ更新（チャレンジ）または正解数加算（無限）、時間ボーナス付与、約 1.5 秒後に次問題へ。
   - **不正解（値が合わない単一ノード）専用の分岐はない**。プレイヤーは Undo でやり直す。

## 5. Undo（履歴）

`undoLastMove()` は履歴（`history[]` + `historyIndex`）を 1 手戻す。ノード配列をディープコピーして各手をスナップショット。**Redo は UI に露出していない**（内部のスライス処理は存在するが未接続）。

## 6. スコアとコンボ（`utils/scoreCalculator.ts` + `constants/scoreConfig.ts`）

チャレンジモードのみスコアを計算する。構成要素（定数は `SCORE_CONFIG` が正、ここで数値を二重化しない）:

- **基本スコア**: 使用した数字の合計 × `BASE_SCORE_MULTIPLIER`。
- **時間ボーナス**: 速く解くほど倍率が上がる（`TIME_MULTIPLIER_MIN`〜`MAX`）。
- **難易度ボーナス**: `DIFFICULTY_THRESHOLD` / `DIFFICULTY_MULTIPLIER` による加点。
- **コンボボーナス**: `ComboTracker` が `COMBO_TIME_LIMIT`（15s）以内の連続正解を追跡。`COMBO_MIN_COUNT`（3）以上で `COMBO_BONUS_RATE` 加算。
- **最終ボーナス**（リザルト画面, `calculateFinalBonus`）: 正解数の達成しきい値（5/7/10）ボーナス + `EXCELLENCE_THRESHOLD`（20000）超で優秀ボーナス。

無限モードのスコアは「正解数」。ランキング送信対象外。

## 7. モード差（`config/gameMode.ts`）

| 項目 | チャレンジ | 無限 |
|---|---|---|
| 時間 | 難易度別（下記注） | 300s 固定・ボーナスなし |
| スキップ | 2 回 | 無制限（`Infinity`） |
| スコア表示 | 計算スコア | 「N問」（正解数） |
| ランキング | 対象 | 非対象 |
| ハイスコアキー | `@jamaica_challenge_high_score` | `@jamaica_infinite_high_score` |

注: チャレンジの時間は難易度設定（§3）で上書きされる。`gameMode.ts` の 60s は基準値。

## 8. ゲーム状態遷移（`GameStatus`）

`MENU → COUNTDOWN → BUILDING → (CORRECT で次問題ループ) → TIMEUP / MANUALLY_ENDED`。定義は `types/index.ts` の `GameStatus` enum。

## 9. サウンド（`utils/SoundManager.ts`）

`soundManager` シングルトンが 6 種（button, connect, countdown, start, success, tap）をプリロード。`SoundType` enum で参照。設定でミュート可能（`settingsStore`）。

---
このファイルが説明する主なコード:
`utils/problemGenerator.ts` / `store/gameStore.ts` / `utils/scoreCalculator.ts` / `constants/scoreConfig.ts` / `config/difficulty.ts` / `config/gameMode.ts` / `types/index.ts`
