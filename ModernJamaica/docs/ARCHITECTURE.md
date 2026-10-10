<!-- STABILITY: canonical -->

# ARCHITECTURE — 構造とデータフロー

アプリの物理構造・レイヤ境界・データの流れ。**正確な実装詳細はコードに委ね、ここは地図に徹する**（ファイルを指すが、内部ロジックは複製しない）。

## 技術スタック

- **React Native 0.80.2** + **React 19.1.0** + **TypeScript**（`strict: true`）
- **Zustand** … 状態管理（Redux 不使用）
- **React Navigation 7.x**（stack navigator）
- **react-native-svg** … ゲーム盤面のノード間エッジ描画
- **react-native-firebase**（app + firestore）… ランキング
- **@react-native-async-storage/async-storage** … ローカル永続化（ハイスコア・設定・ユーザー ID）
- **react-native-google-mobile-ads** … 広告（AdMob）。**react-native-tracking-transparency** … iOS の ATT（トラッキング許可）ダイアログ
- **react-native-sound** … 効果音

> gesture-handler / linear-gradient / vector-icons も依存にあるが、盤面操作は**タップベース**であり drag/pan gesture は使っていない。`react-native-reanimated` は**不使用・未依存**。

## ディレクトリ構成（`src/`）

```
src/
├── components/          # UI（アトミックデザイン）— DESIGN-SYSTEM.md 参照
│   ├── atoms/           # Button, Card, Typography, Icon, Logo, StatValue, SoundToggleButton
│   ├── molecules/       # Dialog, GameStat, RankingEntry, DifficultyTabs, CountdownOverlay, SuccessOverlay, ComboIndicator, ScoreTierBar（基準スコア）等
│   ├── organisms/       # GameBoard, GameHeader, PauseMenu, RankingBoard, TutorialModal（初回起動時の遊び方）
│   └── ErrorBoundary.tsx
├── screens/             # 画面（購入モーダルを含む）
├── store/               # Zustand ストア（gameStore, settingsStore, statsStore, monetizationStore）
├── utils/               # コアロジック（problemGenerator, scoreCalculator, timeBonus, playStreak, scoreTier, reviewPolicy, monetizationPolicy, solutionExample, SoundManager, gameUtils, storage）
├── services/            # 外部連携（rankingService, userService, adService, analyticsService, playerStatsService, reviewService, purchaseService, reviewAccessService）
├── config/              # モード/難易度/ダイアログ/基準スコア/外部リンク設定（gameMode, difficulty, dialogs, scoreTiers, links, ranking, monetization, index）
├── constants/           # scoreConfig ほか（一部 legacy → CONVENTIONS.md の技術的負債参照）
├── design/              # デザインシステム（modernDesignSystem が正）
├── hooks/               # 画面ロジックのカスタムフック
├── types/               # 型定義（index, ranking, purchase）
└── assets/              # 画像
```

## レイヤと依存方向

```
screens ─┬─> hooks ──> store (Zustand) ──> utils (純ロジック)
         │                 │
         ├─> components    └──> services ──> Firebase / AsyncStorage / AdMob
         └─> config / constants / design (設定・トークン)
```

- **screens** は `hooks/` と `store/` を通じて状態を読み書きし、`components/` を組み立てる。prop drilling は避け、Zustand フックを直接使う。
- **store** がアプリ状態の中枢。`utils/` の純粋関数（問題生成・スコア計算）と `services/`（永続化・ランキング）を呼ぶ。
- **utils** は原則 React 非依存の純ロジック。テストしやすい層。
- **services** は副作用（ネットワーク・ストレージ・広告）を閉じ込めるシングルトン。

## 画面とナビゲーション

Stack navigator（全画面 `headerShown: false`）。定義は `App.tsx`。

```
Splash → ModeSelection → DifficultySelection → (ChallengeMode | InfiniteMode) → ChallengeResult
                       ├─> Ranking
                       └─> Settings
```

- `ModeSelection`・`Settings`・`ChallengeResult` から共通の `Purchase` モーダルへ遷移し、閉じると呼び出し元へ戻る。入口の識別は `types/purchase.ts` の `PurchaseSource`。
- ルート定義とパラメータ型は `App.tsx` の `RootStackParamList` が正。
- `DifficultySelection` で `initGame(mode, difficulty)` を呼んでからゲーム画面へ遷移。
- `ChallengeMode` / `InfiniteMode` はどちらも `<GameBoard>` を描画し、`hooks/useSimpleGameScreen` で状態を駆動する。
- 盤面の表示領域への収まりとスクロールの方針は [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) を参照。

## 状態管理（Zustand）

- **`store/gameStore.ts`** — 単一の統合ストアがチャレンジ／無限の両モードを扱う（`UnifiedGameState`）。タイマー・スコア・コンボ・問題生成・ノード結合・Undo 履歴・ハイスコア（モード×難易度）・ランキング送信を集約。単一ストアで 2 モードを扱う判断は [decisions/0002-zustand-unified-store.md](./decisions/0002-zustand-unified-store.md)。
- **`store/settingsStore.ts`** — サウンド ON/OFF、振動、表示名（ニックネーム）。AsyncStorage 永続化と、表示名の Firebase 同期。
- **`store/statsStore.ts`** — プレイ回数などの内部記録。`gameStore` の `initGame` / `endGame` から更新され、レビュー表示条件や分析に使用する。ホームとリザルトには累計・連続プレイ日数を表示しない。連続日数の計算は `utils/playStreak.ts`、永続化は `services/playerStatsService.ts`。
- **`store/monetizationStore.ts`** — 検証済み購入権利・商品価格・解答例の閲覧期限・購入/動画処理中の状態。購入権利をローカルの自己申告フラグから復元しない。
- アクションと状態フィールドの一覧はコード（`gameStore.ts` の型定義部）を正とする。ここで列挙しない。

## コアゲームロジック

盤面・問題・判定・スコアの詳細は [GAME-CORE.md](./GAME-CORE.md) に集約。主なファイル:
- `utils/problemGenerator.ts` … 解ける問題の生成
- `store/gameStore.ts connectNodes` … ノード結合と正解判定
- `utils/scoreCalculator.ts` … スコア・コンボ計算
- `utils/timeBonus.ts` … チャレンジの時間ボーナス（正解のたびに逓減）
- `components/organisms/GameBoard.tsx` … 盤面 UI（タップで結合、SVG でエッジ描画）

## 外部サービス

| サービス | ファイル | 役割 | バックエンド |
|---|---|---|---|
| ランキング | `services/rankingService.ts` | スコア送信（新記録時のみ・**チャレンジ専用**・失敗分は次回再送）／取得／順位（件数の集計クエリ） | Firestore `userScoresV2` コレクション |
| ユーザー | `services/userService.ts` | 匿名認証（UID がランキングのドキュメント ID）・表示名管理・バリデーション | Firebase Auth（匿名）／AsyncStorage |
| 広告 | `services/adService.ts` | 購入・閲覧期限の確認、ATT と SDK 初期化、メニュー離脱時の頻度制限付き全画面広告、任意のリワード広告、配置別の広告収益イベント | AdMob（+ `react-native-tracking-transparency`） |
| 買い切り購入 | `services/purchaseService.ts` | 商品情報取得の重複防止/タイムアウト・購入/復元と入口別計測・復帰時の権利再確認 | `ios/ModernJamaica/PurchaseModule.swift` / StoreKit 2 |
| 解答例の閲覧期限 | `services/reviewAccessService.ts` | 報酬獲得時の期限付与と再起動後の復元 | AsyncStorage |
| 計測 | `services/analyticsService.ts` | 画面表示・ゲーム開始/終了（累計ゲーム数・初ゲームかどうか・連続日数を付与）・正解/スキップ・**生まれて初めての正解**（`first_problem_solved`）・チュートリアル・設定変更・外部リンク・レビュー依頼のイベント送信（失敗は握りつぶす）。初回起動→チュートリアル→初ゲーム→初正解のファネルが追える | Firebase Analytics（広告 ID 連携なし） |
| 自己記録 | `services/playerStatsService.ts` | ゲーム数・累計正解数・連続プレイ日数の永続化と「初正解済み」フラグ。失敗は空の記録として扱う | AsyncStorage |
| レビュー依頼 | `services/reviewService.ts` | 新記録の直後・数ゲーム以上遊んだ人・前回から間隔を空けて、OS のレビュー依頼を出す（条件は `utils/reviewPolicy.ts`。実際に出すかは OS が決める） | 自前の最小ネイティブモジュール `ios/ModernJamaica/StoreReviewModule.m`（`SKStoreReviewController`。`NativeModules.StoreReview`） |
| 触覚 | `services/hapticService.ts` | 選択・結合・正解・不正解の振動 | react-native-haptic-feedback |
| サウンド | `utils/SoundManager.ts` | 効果音のプリロード・再生（`Ambient` カテゴリ） | react-native-sound |

- Firestore のセキュリティルールは `firestore.rules`（リポジトリ内。ルートの `firebase.json` から参照され `firebase deploy --only firestore:rules` でデプロイ）。本人（匿名認証 UID）だけが自分のドキュメントを書き込める。経緯は [decisions/0004-ranking-v2-anonymous-auth.md](./decisions/0004-ranking-v2-anonymous-auth.md)。
- **ランキングの集計期間**（`config/ranking.ts`）: 参加者が `MIN_PARTICIPANTS` 人に達するまでは、その難易度のランキングを「集計期間」として順位・人数を公開しない（`RankingBoard` は集計中の案内、リザルトはエントリー済み・集計中の案内を出す）。ランキング V2 は空から始まるため、「1位 / 1人」のような過疎に見える表示を避ける。スコアの送信は集計期間中も通常どおり行う。
- 外部サービス（ランキング・認証・計測・広告・購入・レビュー依頼）の失敗や遅延で**ゲーム進行を止めない**。スコア送信はリザルト画面への遷移の後ろで行う。
- **基準スコア**（`config/scoreTiers.ts` / `utils/scoreTier.ts`）: チャレンジの難易度ごとに固定のランク（ブロンズ/シルバー/ゴールド）のしきい値を置き、リザルトの記録領域が「次のランクまであと何点」を出す。他のプレイヤーがいなくても目標が分かるための固定の目安で、値はスコア計算式のシミュレーションから決めている（式や時間設定を変えたら見直す）。
- **外部リンク**（`config/links.ts`）: 設定画面の「お問い合わせ・ご要望」（Google フォーム）と「プライバシーポリシー」（[Firebase Hosting](https://modern-jamaica.web.app/)）。提出用の App Store 掲載メタデータの `support_url` / `privacy_url`（`fastlane/metadata/ja/`）と同じ URL を指す。

## マネタイズと復習

- `screens/ChallengeResultScreen.tsx` は上側にスコアと操作不要の「今回の記録」、下側に「解答例を見る・復習する」カードと再プレイ/ホームへ戻る操作を配置する。再プレイを単一の主要ボタンとし、正解がある場合のみ詳しい数値を読み取り領域に常時表示する。

- リザルトの `components/molecules/ProblemReviewCard.tsx` がそのプレイの全問題を無料で一覧表示し、解けなかった問題を開く操作で購入/リワード権利を確認する。正解した問題は無料で開ける。詳細の `components/molecules/ReviewGame.tsx` は本番ストアから独立した練習履歴を持ち、`utils/reviewPractice.ts` で結合・判定、`components/molecules/PracticeTree.tsx` で操作可能な盤面を描く。
- 開いた問題では `utils/solutionExample.ts` の計算手順を `components/molecules/SolutionTree.tsx` でヒント/答えとして段階表示する。閲覧中も練習履歴を保持する。`design/treeBoardLayout.ts` は練習/ヒントの座標、`design/treeNodeVisuals.ts` は本番盤面とも共有する通常ノード表示と演算子色を担当する。復習は本番の出題・採点・制限時間・ランキングに影響しない。
- `screens/PurchaseScreen.tsx` が特典・価格・状態別 UI と購入・復元を提供する。設定の `components/molecules/PurchaseCard.tsx` は共通画面への小さな入口に限定する。ネイティブは検証済みトランザクション、現在の権利、取消状態を確認し、権利更新を JS に通知する。
- 広告の表示条件は `utils/monetizationPolicy.ts`、調整値と作成・設定済みの iOS リワード本番 ID は `config/monetization.ts`。購入権利の初回確認前はインタースティシャルを表示しない。バナーのコンポーネント・広告 ID・API は削除済み。
- 提供範囲、リリース設定、実機確認、収益検証は [MONETIZATION.md](./MONETIZATION.md)。

## 永続化キー

- ハイスコア: `@jamaica_challenge_high_score` / `@jamaica_infinite_high_score`（`config/gameMode.ts`）
- ユーザー ID: `@user_id`（`services/userService.ts`）
- 設定: サウンド・振動・表示名（`store/settingsStore.ts`）
- 自己記録: `@jamaica_player_stats` / 初正解フラグ `@jamaica_first_solve_logged`（`services/playerStatsService.ts`）
- レビュー依頼の前回時刻: `@jamaica_review_last_prompted_at`（`services/reviewService.ts`）

- 解答例の期限: `services/reviewAccessService.ts`。問題一覧はメモリ上のみで次のゲーム開始時に置き換える。
- 全画面広告の頻度: `services/adService.ts`。ゲーム回数と最終表示時刻を保存する。

## ビルド構成

- iOS: `ios/`（CocoaPods、Firebase 設定 plist は Dev/Prod 2 種）
- Android: `android/`
- Firebase: `firebase.json` / `.firebaserc` / `firestore.rules`

---
関連: [GAME-CORE.md](./GAME-CORE.md)・[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)・[CONVENTIONS.md](./CONVENTIONS.md)
