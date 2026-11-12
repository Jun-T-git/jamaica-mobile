<!-- STABILITY: canonical -->

# ARCHITECTURE — 構造とデータフロー

アプリの物理構造・レイヤ境界・データの流れ。**正確な実装詳細はコードに委ね、ここは地図に徹する**（ファイルを指すが、内部ロジックは複製しない）。

## 技術スタック

- **React Native 0.80.2** + **React 19.1.0** + **TypeScript**（`strict: true`）
- **Zustand** … 状態管理（Redux 不使用）
- **React Navigation 7.x**（stack navigator）
- **react-native-svg** … ゲーム盤面のノード間エッジ描画
- **react-native-firebase**（app + firestore）… ランキング
- **@react-native-async-storage/async-storage** … ローカル永続化（ハイスコア・設定・自己記録など）
- **react-native-google-mobile-ads** … 広告（AdMob）。**react-native-tracking-transparency** … iOS の ATT（トラッキング許可）ダイアログ
- **react-native-sound** … 効果音

> gesture-handler / linear-gradient / vector-icons も依存にあるが、盤面操作は**タップベース**であり drag/pan gesture は使っていない。`react-native-reanimated` は**不使用・未依存**。

## 開発ツールの依存と公開範囲

React Native CLI と iOS / Android の CLI は `package.json` と `package-lock.json` で版を固定する。更新時は対応する CLI 群の整合と既知の脆弱性を確認する。Metro の動作確認を手元の端末内で行う場合は `npm start -- --host 127.0.0.1` を使う。実機からの接続が必要な場合は接続元を限定し、開発サーバを公開ネットワークへ露出しない。

CLI の開発用 HTTP は `compression` で応答を圧縮し、CLI・Metro の開発接続と React DevTools はそれぞれの依存する `ws` を使う。同名パッケージでも複数の版が共存するため、監査・ロック更新では各呼び出し元の解決先を確認する。これらのロック更新は native SDK・ゲーム処理の変更や本番配信を伴わず、開発サーバの到達範囲と配信 bundle への影響は分けて確認する。

CLI の `fast-xml-parser` はローカルの Android Manifest・Xcode workspace / scheme の読み取りに使う。エディタ起動は開発サーバの `POST /open-stack-frame` → `@react-native-community/cli-tools` の `launchEditor` → `launch-editor` と進み、リクエストの `file`・`lineNumber` がエディタの起動引数へ渡る。`shell-quote` もこの起動処理の依存に含まれる。この経路は Node の開発環境が対象で、`launch-editor` のロック単独更新はゲーム処理・native SDK を変更しない。監査結果は `devDependencies` の区分だけで配信アプリへの影響を決めず、実際の呼び出し元・入力・使用 API を確認する。ロックファイルの互換更新でも開発コマンドの確認を行い、残る advisory を解消済みと扱わない。React Navigation の runtime 側に残る `query-string` / `decode-uri-component` の指摘は、この CLI 更新では解消しない。linking を変更する際は入力経路と到達性を再評価する。

CLI の `@react-native-community/cli-server-api` は、開発用 HTTP の `POST /open-stack-frame` と `POST /open-url` の入力を `body-parser` の JSON middleware で読み取る。圧縮本文の展開は既定で有効なため、本文読み取りの安全性はこの Node 側の依存更新で確認する。`qs` は `body-parser` の URL エンコード入力用の依存であり、この JSON 経路は `qs.parse` / `qs.stringify` を使わない。親依存との整合を保って更新し、配信アプリへの影響は別途 bundle・native SDK と照合する。

ESLint のファイル列挙は CLI 引数の glob を、設定の override 判定は `files` / `excludedFiles` を `minimatch` に渡す。`glob` も検索パターンと除外パターンを `minimatch` へ渡し、`test-exclude` は Istanbul の設定・既定値に由来する `include` / `exclude` で計測対象を選ぶ。これらのパターンの波括弧展開は `brace-expansion` に委ねられる。ここで確認した経路はローカルの Node 開発・lint・カバレッジ処理であり、利用者のゲーム入力を処理する経路ではない。各呼び出し元の解決先は `package-lock.json` を正とし、互換範囲内の更新だけで別系統の `minimatch` に残る advisory や、メジャー更新を要する展開数増幅の指摘まで解消したとは扱わない。

Jest は `testMatch` の glob を `jest-util` 経由で `picomatch` に渡してテストファイルを選ぶ。Metro の `metro-file-map` も、監視対象ファイルの絞り込みに `micromatch` 経由で `picomatch` を使う。いずれも開発ツールの設定や既定値から glob を受け取る Node 側の経路で、アプリ実行時の入力処理とは分けて確認する。解決版は `package-lock.json` を参照する。

YAML 設定の読み取りは、ESLint と nyc の `js-yaml.load`、root の `cosmiconfig` の `load`、Metro 配下の `cosmiconfig` の `safeLoad` を通る。現行の ESLint・Metro 設定は JavaScript であり、確認した経路は Node のローカル設定読み取りで、ゲーム入力や native SDK の変更ではない。`js-yaml` の解決版は `package-lock.json` を正とし、互換範囲の更新でも深さ・merge 数の上限や underscore を含む数値解釈の変更があるため設定の回帰を確認する。別パッケージの `yaml` は CLI doctor の `info` で `stringify` に使われ、この経路に parse の追加はなく、今回の更新対象でもないため残る指摘を解消済みと扱わない。

Firebase の推移依存は `@react-native-firebase/app` → `firebase` を入口に、Firestore の Node 版 `@firebase/firestore` → `@grpc/proto-loader` → `protobufjs` と、Realtime Database の Node 版 `@firebase/database` → `faye-websocket` → `websocket-driver` を含む。前者は組込みの JSON descriptor を `fromJSON` で読み込み、`@grpc/grpc-js` のクライアント経路で Firestore に接続する。後者は WebSocket の Client を使う。アプリのランキングは `services/rankingService.ts` から React Native Firebase の native API を使うため、これらの Node 側ロック更新と、実際の iOS bundle・native SDK の配信影響は分けて確認する。依存ツリーに存在することだけで配信版の到達性や修正適用を断定しない。

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
├── constants/           # scoreConfig とデザイントークンの参照窓口
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
- UI は selector で必要な状態・アクションだけを購読する。複数フィールドの選択には `useShallow` を使い、盤面はメモ化と安定した props でタイマー更新による不要な再描画を抑える（`hooks/useSimpleGameScreen.ts` / `components/organisms/GameBoard.tsx`）。
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
| ユーザー | `services/userService.ts` | 匿名認証（UID がランキングのドキュメント ID）・初期表示名生成・バリデーション | Firebase Auth（匿名） |
| 広告 | `services/adService.ts` | 購入・閲覧期限の確認、ATT と SDK 初期化、メニュー離脱時の頻度制限付き全画面広告、任意のリワード広告、配置別の広告収益イベント | AdMob（+ `react-native-tracking-transparency`） |
| 買い切り購入 | `services/purchaseService.ts` | 商品情報取得の重複防止/タイムアウト・購入/復元と入口別計測・復帰時の権利再確認 | `ios/ModernJamaica/PurchaseModule.swift` / StoreKit 2 |
| 解答例の閲覧期限 | `services/reviewAccessService.ts` | 報酬獲得時の期限付与と再起動後の復元 | AsyncStorage |
| 計測 | `services/analyticsService.ts` | 画面表示・ゲーム開始/終了（累計ゲーム数・初ゲームかどうか・連続日数を付与）・正解/スキップ・旧初正解フラグによるイベント（`first_problem_solved`。計測開始後の新規とは判定できない）・チュートリアル・設定変更・外部リンク・レビュー依頼のイベント送信（失敗は握りつぶす）。共通計測は [MEASUREMENT.md](./MEASUREMENT.md) を参照 | Firebase Analytics（広告 ID 連携なし） |
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

- ハイスコア: モード×難易度別のキーを `utils/storage.ts` で管理し、全難易度を並列に読み込む。キーとスコア版の契約は [GAME-CORE.md](./GAME-CORE.md)。旧形式の読み込みは `loadHighScore` に残すが、計算式が異なる旧チャレンジスコアは移行しない。
- ランキングの識別子: Firebase 匿名認証 UID。旧ローカル ID の `@user_id` は現在使わないが、既存データは削除しない。
- 設定: サウンド・振動・表示名（`store/settingsStore.ts`）
- 自己記録: `@jamaica_player_stats` / 初正解フラグ `@jamaica_first_solve_logged`（`services/playerStatsService.ts`）
- レビュー依頼の前回時刻: `@jamaica_review_last_prompted_at`（`services/reviewService.ts`）

- 解答例の期限: `services/reviewAccessService.ts`。問題一覧はメモリ上のみで次のゲーム開始時に置き換える。
- 全画面広告の頻度: `services/adService.ts`。ゲーム回数と最終表示時刻を保存する。

## ビルド構成

- iOS: `ios/`（CocoaPods）。効果音と Dev/Prod の Firebase 設定 plist は `ios/` 直下の資源を Xcode から参照する。
- Android: `android/`
- Firebase: `firebase.json` / `.firebaserc` / `firestore.rules`

---
関連: [GAME-CORE.md](./GAME-CORE.md)・[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)・[CONVENTIONS.md](./CONVENTIONS.md)

- 共通の問題単位計測は `services/problemMeasurementService.ts`。端末メモリ内の挑戦を開始・終端ごとに一度だけ送信し、ゲーム進行や永続状態の変更を待たせない。

- 初回価値は `services/firstValueMeasurementService.ts` が旧履歴を移行し、native の検証済み取得版の証拠と初正解・送信済みを永続管理する。App 起動で証拠を取得し、gameStore は初正解を通知する。既存/unknownの除外と将来の導入cutoff設定は [MEASUREMENT.md](./MEASUREMENT.md)。
