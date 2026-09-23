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
│   ├── molecules/       # Dialog, GameStat, RankingEntry, DifficultyTabs, CountdownOverlay, SuccessOverlay, ComboIndicator, BannerAdView, PlayerStatsStrip（自己記録）, ScoreTierBar（基準スコア）等
│   ├── organisms/       # GameBoard, GameHeader, PauseMenu, RankingBoard, TutorialModal（初回起動時の遊び方）
│   └── ErrorBoundary.tsx
├── screens/             # 画面（8 つ）
├── store/               # Zustand ストア（gameStore, settingsStore, statsStore）
├── utils/               # コアロジック（problemGenerator, scoreCalculator, timeBonus, playStreak, scoreTier, reviewPolicy, SoundManager, gameUtils, storage）
├── services/            # 外部連携（rankingService, userService, adService, analyticsService, playerStatsService, reviewService）
├── config/              # モード/難易度/ダイアログ/基準スコア/外部リンク設定（gameMode, difficulty, dialogs, scoreTiers, links, ranking, index）
├── constants/           # scoreConfig ほか（一部 legacy → CONVENTIONS.md の技術的負債参照）
├── design/              # デザインシステム（modernDesignSystem が正）
├── hooks/               # 画面ロジックのカスタムフック
├── types/               # 型定義（index, ranking）
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

- ルート定義とパラメータ型は `App.tsx` の `RootStackParamList` が正。
- `DifficultySelection` で `initGame(mode, difficulty)` を呼んでからゲーム画面へ遷移。
- `ChallengeMode` / `InfiniteMode` はどちらも `<GameBoard>` を描画し、`hooks/useSimpleGameScreen` で状態を駆動する。

## 状態管理（Zustand）

- **`store/gameStore.ts`** — 単一の統合ストアがチャレンジ／無限の両モードを扱う（`UnifiedGameState`）。タイマー・スコア・コンボ・問題生成・ノード結合・Undo 履歴・ハイスコア（モード×難易度）・ランキング送信を集約。単一ストアで 2 モードを扱う判断は [decisions/0002-zustand-unified-store.md](./decisions/0002-zustand-unified-store.md)。
- **`store/settingsStore.ts`** — サウンド ON/OFF、振動、表示名（ニックネーム）。AsyncStorage 永続化と、表示名の Firebase 同期。
- **`store/statsStore.ts`** — プレイヤー自身の記録（ゲーム数・累計正解数・連続プレイ日数）。`gameStore` の `initGame` / `endGame` から更新され、メニュー（`PlayerStatsStrip`）とリザルトに表示する。連続日数の計算は `utils/playStreak.ts`、永続化は `services/playerStatsService.ts`。**他のプレイヤーの人数に依存しない「自分との勝負」の材料**で、ユーザーが少ない段階でも寂しく見えない再訪の理由として置いている（人数が見える機能は参加者が増えてから）。
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
| 広告 | `services/adService.ts` | 起動時の初期化（**ATT の許可依頼 → コンテンツを PG 以下に制限 → SDK 初期化**。バナーは `ready` を待ってから読み込む）／リクエストに文脈 keywords を付与／インタースティシャル（数ゲームに 1 回・リザルト離脱時・回数は永続化）／バナー | AdMob（+ `react-native-tracking-transparency`） |
| 計測 | `services/analyticsService.ts` | 画面表示・ゲーム開始/終了（累計ゲーム数・初ゲームかどうか・連続日数を付与）・正解/スキップ・**生まれて初めての正解**（`first_problem_solved`）・チュートリアル・設定変更・外部リンク・レビュー依頼のイベント送信（失敗は握りつぶす）。初回起動→チュートリアル→初ゲーム→初正解のファネルが追える | Firebase Analytics（広告 ID 連携なし） |
| 自己記録 | `services/playerStatsService.ts` | ゲーム数・累計正解数・連続プレイ日数の永続化と「初正解済み」フラグ。失敗は空の記録として扱う | AsyncStorage |
| レビュー依頼 | `services/reviewService.ts` | 新記録の直後・数ゲーム以上遊んだ人・前回から間隔を空けて、OS のレビュー依頼を出す（条件は `utils/reviewPolicy.ts`。実際に出すかは OS が決める） | 自前の最小ネイティブモジュール `ios/ModernJamaica/StoreReviewModule.m`（`SKStoreReviewController`。`NativeModules.StoreReview`） |
| 触覚 | `services/hapticService.ts` | 選択・結合・正解・不正解の振動 | react-native-haptic-feedback |
| サウンド | `utils/SoundManager.ts` | 効果音のプリロード・再生（`Ambient` カテゴリ） | react-native-sound |

- Firestore のセキュリティルールは `firestore.rules`（リポジトリ内。ルートの `firebase.json` から参照され `firebase deploy --only firestore:rules` でデプロイ）。本人（匿名認証 UID）だけが自分のドキュメントを書き込める。経緯は [decisions/0004-ranking-v2-anonymous-auth.md](./decisions/0004-ranking-v2-anonymous-auth.md)。
- **ランキングの集計期間**（`config/ranking.ts`）: 参加者が `MIN_PARTICIPANTS` 人に達するまでは、その難易度のランキングを「集計期間」として順位・人数を公開しない（`RankingBoard` は集計中の案内、リザルトは「エントリーしました」を出す）。ランキング V2 は空から始まるため、「1位 / 1人」のような過疎に見える表示を避ける。スコアの送信は集計期間中も通常どおり行う。
- 外部サービス（ランキング・認証・計測・広告・レビュー依頼）の失敗や遅延で**ゲーム進行を止めない**。スコア送信はリザルト画面への遷移の後ろで行う。
- **基準スコア**（`config/scoreTiers.ts` / `utils/scoreTier.ts`）: チャレンジの難易度ごとに固定のランク（ブロンズ/シルバー/ゴールド）のしきい値を置き、リザルトの `ScoreTierBar` が「次のランクまであと何点」を出す。他のプレイヤーがいなくても目標が分かるための固定の目安で、値はスコア計算式のシミュレーションから決めている（式や時間設定を変えたら見直す）。
- **外部リンク**（`config/links.ts`）: 設定画面の「お問い合わせ・ご要望」（Google フォーム）と「プライバシーポリシー」。App Store 掲載の `support_url` / `privacy_url`（`fastlane/metadata/ja/`）と同じ URL を指す。

## 永続化キー

- ハイスコア: `@jamaica_challenge_high_score` / `@jamaica_infinite_high_score`（`config/gameMode.ts`）
- ユーザー ID: `@user_id`（`services/userService.ts`）
- 設定: サウンド・振動・表示名（`store/settingsStore.ts`）
- 自己記録: `@jamaica_player_stats` / 初正解フラグ `@jamaica_first_solve_logged`（`services/playerStatsService.ts`）
- レビュー依頼の前回時刻: `@jamaica_review_last_prompted_at`（`services/reviewService.ts`）

## ビルド構成

- iOS: `ios/`（CocoaPods、Firebase 設定 plist は Dev/Prod 2 種）
- Android: `android/`
- Firebase: `firebase.json` / `.firebaserc` / `firestore.rules`

---
関連: [GAME-CORE.md](./GAME-CORE.md)・[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)・[CONVENTIONS.md](./CONVENTIONS.md)
