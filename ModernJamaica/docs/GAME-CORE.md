<!-- STABILITY: canonical -->

# GAME-CORE — ゲームルールとコアアルゴリズムの契約

コアの「契約（振る舞いの保証）」を記す。**アルゴリズムの正確な実装はコードが正**。ここは契約と不変条件を説明し、実装ファイルを指す。ここに書かれた不変条件は [PHILOSOPHY.md](./PHILOSOPHY.md) と対になる。

## 1. データモデル（`types/index.ts`）

木のノードは単一の型 `NodeData` で表す。**「内部ノード専用の型」は存在しない**（葉も内部ノードも `NodeData`）。

- `isLeaf: true` … 最初に配られる 5 つの数字（`leaf-0` 〜 `leaf-4`）。
- `isLeaf: false` … 2 ノードを結合して生成される内部ノード（`internal-<id>`）。`operator` と `leftChildId` / `rightChildId` を持つ。
- `isUsed` … 既に結合の子として消費されたか。`true` のノードは再結合できない。
- `parentId` / `depth` / `position` … 木構造とレイアウト用。

問題は `ProblemData { numbers, target, difficulty, solutions?, solutionCount? }`。`solutionCount` は生成器が数えた「人が見つけやすい解の数」（難易度制御の根拠）。**`solutions` は現状の生成器では設定されない（`undefined`）**。将来用の予約フィールド。

## 2. 問題生成（`utils/problemGenerator.ts`）

エントリポイント: `generateProblem(difficulty, rng?)`。`rng` を渡すと同じ乱数列から同じ問題を再現できる（既定は `Math.random`）。

1. 難易度設定（`config/difficulty.ts`）の `numberRange` から**ランダムな整数を 5 つ**（手札）生成。
2. `countSolutions(numbers)` が、5 数字を全部使って作れる値と**その解の数**を総当たりで数え上げる。
3. 作れる値のうち、難易度の `targetRange` に収まり、かつ**「全部足すだけ」の値ではない**ものを目標値の候補とする。
4. 候補を解の数で並べ、難易度の `solutionBand`（パーセンタイル帯と最小解数）に入るものからランダムに `target` を選ぶ。**解が多いほど易しい**。条件に合う候補がなければ手札を引き直す。

**不変条件（解の保証）**: `target` は必ず `countSolutions` が**実際に到達できた値**の中から選ぶため、**生成される問題は必ず 5 数字全部で `target` に到達できる**。引き直しの上限に達した場合の保険（最も解が多い候補／固定問題）も到達可能な問題だけを返す。この性質を壊す変更は禁止（[PHILOSOPHY.md](./PHILOSOPHY.md) 不変条件 #1）。独立ソルバによる検証が `__tests__/utils/problemGenerator.test.ts` にある。

**数え上げの制約**（`countSolutions`）: 人が見つけやすい解だけを数えるため、途中結果は**正の整数**に限る。
- `−` は大きい方から小さい方を引く（同値同士の 0 は数えない）。
- `÷` は割り切れる時のみ。`÷1` は `×1` と同じ結果なので数えない。

これは**出題の基準**であり、プレイヤーの操作を縛るものではない（盤面では負の数や小数を経由する解も正解になる）。

> **重要**: 「加算のみ／乗算のみ／混合」といった**問題タイプは存在しない**。生成器は難易度設定（数字レンジ・目標値レンジ・解の数の帯）だけでパラメータ化された単一のロジック。（過去のドキュメントの誤り）

## 3. 難易度（`config/difficulty.ts`）

| 難易度 | 数字レンジ | 目標値レンジ | 出題する解の数の帯 | 色 |
|---|---|---|---|---|
| かんたん (EASY) | 1–4 | 小さめ | 解が多い側 | mint |
| ふつう (NORMAL) | 1–6 | 本家ジャマイカと同じ | 中間 | neon(青) |
| むずかしい (HARD) | 1–10 | 大きめ | 解が少ない側（下限あり） | coral(橙) |

具体値（`targetRange` / `solutionBand` / 初期時間 / 正解ボーナスとその逓減）は `config/difficulty.ts` が正。ここに数値を二重化しない。

既定難易度は `DEFAULT_DIFFICULTY = NORMAL`。時間はチャレンジモードでこの難易度別値が使われる（`gameMode.ts` のチャレンジの時間は使われない基準値）。

**時間ボーナスの逓減（`utils/timeBonus.ts`）**: チャレンジの正解ボーナスは固定ではない。`calculateTimeBonus` が**正解のたびに `bonusDecayStep` 秒ずつ減らし、`bonusMin` で下げ止まる**。下限は人が 1 問を解ける時間（5 数字の結合に 12 タップ必要）よりずっと短いので、どれだけ速く解いても残り時間はやがて尽き、**上級者でも 1 ゲーム約 3 分**で終わる。固定ボーナスを無制限に足すと、平均解答時間がボーナスより短いプレイヤーは残り時間が増え続けてゲームが終わらないため（[decisions/0006](./decisions/0006-time-bonus-decay.md)）。数値を変えるときは `__tests__/utils/timeBonus.test.ts` が上級者のセッション長を難易度ごとに検証する。得たボーナスは `gameState.lastTimeBonus` に入り、正解オーバーレイに「+N秒」と表示される。`formatTime` は残り時間を切り上げて表示するので、将来ボーナスを小数にしても表示は崩れない。

## 4. ノード結合と正解判定（`store/gameStore.ts connectNodes`）

UI 操作は**タップで繋ぐ**（ノード → 演算子 → ノード）。`connectNodes(firstNodeId, secondNodeId, operator)` の契約:

1. 2 ノードを取得。どちらかが `isUsed` なら結合しない（多重使用の防止）。
2. 演算子で結果を計算（`+ − × ÷`）。**除算は 0 を回避し、結果は丸めずに保持する**（`(1÷3)×3` を正解にするため。丸めるのは盤面の表示だけ）。
3. `internal-<id>` の新ノードを生成し、`leftChildId` / `rightChildId` を設定。元の 2 ノードを `isUsed: true`・`parentId` 設定（＝子になる）。
4. **完成チェック**: 未使用ノードが 1 つだけ（`activeNodes.length === 1`）になったら、その値 `finalValue` と `targetNumber` を比較。
5. **正解条件**: `Math.abs(finalValue - targetNumber) < 0.001`。この閾値は浮動小数点誤差の吸収用（[PHILOSOPHY.md](./PHILOSOPHY.md) 不変条件 #3）。
   - 正解: 効果音・振動・スコア/コンボ更新と時間ボーナス付与（チャレンジ。§3 のとおり逓減する）または正解数加算（無限）、約 1.5 秒後に次問題へ（待機中にリスタート等で状態が変わっていたら生成しない）。
   - 不正解（値が合わない単一ノード）: 不正解音・振動を鳴らし、`wrongAnswerCount` を増やす。盤面（`GameBoard`）はこれを見て揺れ・メッセージを出す。状態は巻き戻さず、プレイヤーは Undo でやり直す。

**Undo は組み立て中（`BUILDING`）のみ**（`canUndo` / `undoLastMove`）。正解演出中に戻せると、同じ問題でスコアと時間ボーナスを何度でも取り直せてしまうため。

**正解数とスキップ**: `problemCount` は試行数（正解 + スキップ）、`correctCount` は正解数。**スキップは正解に数えない**（最終ボーナス・ランキングの問題数・リザルトの統計は `correctCount` を使う）。

## 5. Undo（履歴）

`undoLastMove()` は履歴（`history[]` + `historyIndex`）を 1 手戻す。ノード配列をディープコピーして各手をスナップショット。**Redo は UI に露出していない**（内部のスライス処理は存在するが未接続）。

## 6. スコアとコンボ（`utils/scoreCalculator.ts` + `constants/scoreConfig.ts`）

チャレンジモードのみスコアを計算する。構成要素（定数は `SCORE_CONFIG` が正、ここで数値を二重化しない）:

- **基本スコア**: 使用した数字の合計 × `BASE_SCORE_MULTIPLIER`。
- **時間ボーナス**: 速く解くほど倍率が上がる（`TIME_MULTIPLIER_MIN`〜`MAX`）。
- **目標値ボーナス**: `DIFFICULTY_THRESHOLD` / `DIFFICULTY_MULTIPLIER` による加点。**`DIFFICULTY_BONUS_MAX` で頭打ち**（目標値の運でスコアが決まらないようにする）。
- **コンボボーナス**: `ComboTracker` が `COMBO_TIME_LIMIT`（15s）以内の連続正解を追跡。`COMBO_MIN_COUNT`（3）以上で `COMBO_BONUS_RATE` 加算、**`COMBO_BONUS_MAX_RATE` で頭打ち**（長時間プレイでスコアが際限なく伸び、ランキングのスコア上限を超えるのを防ぐ）。
- **最終ボーナス**（ゲーム終了時, `calculateFinalBonus`）: **正解数**（スキップを除く）の達成しきい値ボーナス + `EXCELLENCE_THRESHOLD` 超で優秀ボーナス。

1 問ごとの内訳は `calculateScoreBreakdown` が返し、ストアが `scoreBreakdown` に累計する。プレイ中は獲得点とコンボ（`ComboIndicator`・正解オーバーレイ）、リザルト画面は内訳・最大コンボ・平均回答時間（`totalSolveTime / correctCount`）を表示する。

無限モードのスコアは「正解数」。ランキング送信対象外。

## 7. モード差（`config/gameMode.ts`）

| 項目 | チャレンジ | 無限 |
|---|---|---|
| 時間 | 難易度別・正解ボーナスは逓減する＝上級者でも約 3 分（下記注） | 300s 固定・ボーナスなし |
| スキップ | 2 回 | 無制限（`Infinity`） |
| スコア表示 | 計算スコア | 「N問」（正解数） |
| ランキング | 対象 | 非対象 |
| ハイスコアキー（難易度別, `utils/storage.ts`） | `@jamaica_challenge_<難易度>_high_score_v2` | `@jamaica_infinite_<難易度>_high_score` |

注: チャレンジの時間は難易度設定（§3）で上書きされる。

チャレンジのハイスコアキーが `_v2` なのは、スコア計算式の見直し（目標値ボーナスの上限など）で旧スコアと比較できなくなったため（[decisions/0004](./decisions/0004-ranking-v2-anonymous-auth.md)）。

## 8. ゲーム状態遷移（`GameStatus`）

`MENU → COUNTDOWN → BUILDING → (CORRECT で次問題ループ) → TIMEUP / MANUALLY_ENDED`。定義は `types/index.ts` の `GameStatus` enum。

## 9. サウンドと触覚（`utils/SoundManager.ts` / `services/hapticService.ts`）

`soundManager` シングルトンが効果音（button, connect, countdown, start, success, tap, wrong）をプリロード。`SoundType` enum で参照。設定でミュート可能（`settingsStore`）。オーディオカテゴリは **`Ambient`**（マナーモードに従い、再生中の音楽を止めない）。

触覚フィードバックは `services/hapticService.ts`（選択・結合・正解・不正解）。設定でオフにできる。

---
このファイルが説明する主なコード:
`utils/problemGenerator.ts` / `store/gameStore.ts` / `utils/scoreCalculator.ts` / `constants/scoreConfig.ts` / `config/difficulty.ts` / `config/gameMode.ts` / `types/index.ts`
