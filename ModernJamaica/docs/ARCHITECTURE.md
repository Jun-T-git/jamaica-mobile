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
- **react-native-google-mobile-ads** … 広告（AdMob）
- **react-native-sound** … 効果音

> gesture-handler / linear-gradient / vector-icons も依存にあるが、盤面操作は**タップベース**であり drag/pan gesture は使っていない。`react-native-reanimated` は**不使用・未依存**。

## ディレクトリ構成（`src/`）

```
src/
├── components/          # UI（アトミックデザイン）— DESIGN-SYSTEM.md 参照
│   ├── atoms/           # Button, Card, Typography, Icon, Logo, StatValue, SoundToggleButton
│   ├── molecules/       # Dialog, GameStat, RankingEntry, DifficultyTabs, CountdownOverlay, SuccessOverlay, BannerAdView 等
│   ├── organisms/       # GameBoard, GameHeader, PauseMenu, RankingBoard
│   └── ErrorBoundary.tsx
├── screens/             # 画面（8 つ）
├── store/               # Zustand ストア（gameStore, settingsStore）
├── utils/               # コアロジック（problemGenerator, scoreCalculator, SoundManager, gameUtils, storage）
├── services/            # 外部連携（rankingService, userService, adService）
├── config/              # モード/難易度/ダイアログ設定（gameMode, difficulty, dialogs, index）
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
- **`store/settingsStore.ts`** — サウンド ON/OFF、表示名（ニックネーム）。AsyncStorage 永続化と、表示名の Firebase 同期。
- アクションと状態フィールドの一覧はコード（`gameStore.ts` の型定義部）を正とする。ここで列挙しない。

## コアゲームロジック

盤面・問題・判定・スコアの詳細は [GAME-CORE.md](./GAME-CORE.md) に集約。主なファイル:
- `utils/problemGenerator.ts` … 解ける問題の生成
- `store/gameStore.ts connectNodes` … ノード結合と正解判定
- `utils/scoreCalculator.ts` … スコア・コンボ計算
- `components/organisms/GameBoard.tsx` … 盤面 UI（タップで結合、SVG でエッジ描画）

## 外部サービス

| サービス | ファイル | 役割 | バックエンド |
|---|---|---|---|
| ランキング | `services/rankingService.ts` | スコア送信（新記録時のみ・**チャレンジ専用**）／取得／順位 | Firestore `userScores` コレクション |
| ユーザー | `services/userService.ts` | 匿名 ID 生成・表示名管理・バリデーション | AsyncStorage |
| 広告 | `services/adService.ts` | インタースティシャル（数ゲームに 1 回）／バナー | AdMob |
| サウンド | `utils/SoundManager.ts` | 6 種の効果音のプリロード・再生 | react-native-sound |

- Firestore のセキュリティルールは `firestore.rules`（リポジトリ内）。**ルールと実装の既知の乖離**（auth 前提だが auth SDK 未導入）は [CONVENTIONS.md](./CONVENTIONS.md) の技術的負債と [decisions/0003-firestore-ranking.md](./decisions/0003-firestore-ranking.md) を参照。

## 永続化キー

- ハイスコア: `@jamaica_challenge_high_score` / `@jamaica_infinite_high_score`（`config/gameMode.ts`）
- ユーザー ID: `@user_id`（`services/userService.ts`）
- 設定: サウンド・表示名（`store/settingsStore.ts`）

## ビルド構成

- iOS: `ios/`（CocoaPods、Firebase 設定 plist は Dev/Prod 2 種）
- Android: `android/`
- Firebase: `firebase.json` / `.firebaserc` / `firestore.rules`

---
関連: [GAME-CORE.md](./GAME-CORE.md)・[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)・[CONVENTIONS.md](./CONVENTIONS.md)
