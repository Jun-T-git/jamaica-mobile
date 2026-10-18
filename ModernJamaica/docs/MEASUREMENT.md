# 共通計測 v1（ジャマイカの木）

`problemMeasurementService.ts` が `schema_version=1`、`action_name=solve_problem` の `action_start` / `action_result` を送る。operation は端末メモリ内のみで識別し、GA4 へ ID は送らない。開始/結果は挑戦ごと一度。結果受理時に消費するため正解演出や重複終端で再送しない。再起動で過去の結果を再生しない。SDK配送の exactly-once は保証しない。

発火条件は [GAME-CORE.md](./GAME-CORE.md) を参照。誤答は継続、時間切れはゲーム上の defeat。観測できる処理エラーはサービスの error 終端と許可リストの error_code で敗北/取消と区別する。現行のプレイ中に捕捉された処理エラー経路はなく、SDK/記録 I/O の失敗はゲーム結果と無関係なため接続していない。例外文や kill を推定送信しない。`duration_ms` はバックグラウンド除外の単調時計が未整備のため省略する。既存 `game_start` / `game_end` はゲームセッション単位で、問題単位イベントと同じ数として合算しない。

## 初回価値の適格性・永続化

`firstValueMeasurementService.ts` は `@jamaica_common_first_value_v1` に scope / reached / sent を保存する。初期化はプレイ統計の書込み前に旧履歴を取り、ゲーム盤面の生成は I/O を待たない。

- 旧初正解フラグ true または totalCorrect>0 は初正解済みの既存対象。gamesPlayed>0 / firstPlayedAt>0 / 連続プレイ記録 / lastPlayDate も既存プレイ履歴として除外する。数値の型・有限性・非負性や日付文字列の不正は破損として抑止する。
- 履歴が空・新フラグがないだけでは unknown。読取り/保存エラーや壊れた状態は抑止し、破損台帳を新規へリセットしない。
- 既存 scope は以後の証拠で new へ昇格しない。unknown から new への変更は native の verified_new 証拠だけを受ける。自身が後から作成したプレイ履歴で再分類しない。
- DEBUG と明示計測無効/スクリーンショット中に初正解を観測した場合は送信対象から消費し、抑止済みを永続化する。pending として後送せず、有効化後の次の正解へ初回を付け替えない。既に有効な本番正解を pending として観測済みなら、その先行する正解を保持する。native の同期定数 `measurementCollectionAllowed` と JS の __DEV__ を確認するため、非同期証拠の返答前の正解も抑止済みとして扱う。現在、ユーザー操作による Analytics 同意OFF設定は存在せず、将来追加時は同じ記録前ゲートへ接続する。本番の通信未確認による pending は保持できる。
- 正解検証の直後に reached を永続化する。unknown では送信せず pending とし、遅れて verified_new が届いた場合に送信できる。new scope と reached が両方揃った時だけ共通 `value_first_reached`（`activation_key=first_problem_solved` / `definition_version=1` / `first_status=new_since_measurement` / `schema_version=1`）を一度送る。
- sent を SDK 引渡し前に保存し、並行正解/再起動/アップデートで再送しない。保存後・送信前のクラッシュは欠測となり得る。exactly-once 配送は保証しない。無効中初正解の抑止済み保存が失敗した場合も、そのプロセス内は抑止を維持する。永続記録が一切成功せず終了した場合の再起動後まで完全な重複/付け替え防止は保証できず、ストレージ障害を含む実機確認が必要。

現コードの削除経路も確認済み。`clearAllStoredData` はハイスコア/設定の限定削除、ユーザーID・表示名・未送信スコアの削除は各キーのみで、新台帳を消さない。全 AsyncStorage.clear や統計リセットの製品経路はない。将来全削除を追加する場合はこの台帳を保持するか excluded を再保存し、同一installを新規へ戻さない。

旧 `first_problem_solved` は従来イベントとして維持するが、共通 activation の alias や計測開始後の新規コホートに使わない。

### 将来配信時の有効化

現行の Info.plist には `CommonMeasurementFirstBuild` を設定していないため、共通 activation は現在の配信設定では抑止される。恒久的な unknown 判定ではなく、次の導入条件で対象を有効化する。

1. 共通計測を確実に含む将来の配信ビルドの CFBundleVersion を確認する。過去の全配布ビルド履歴を監査し、全過去値を厳密な数値ドット比較で上回る未使用の導入ビルドを確定する。marketing version をまたいだ build の reset/reuse があり得るため、現在値から次番号を推定しない。以後は全 marketing version をまたいで単調増加を維持する。既配布か不明な現行ビルド番号を cutoff に使わない。
2. Info.plist の `CommonMeasurementFirstBuild` にそのビルド番号を文字列で設定する。同じ計測スコープの更新では値を維持し、定義改版だけでリセットしない。
3. 既存 `PurchaseModule.getMeasurementInstallEvidence` が、iOS 16以降で `AppTransaction.shared` の署名検証成功、本番環境、bundleID一致を要求する。現在ビルドと originalAppVersion を厳密な数値ドット比較で cutoff と比較し、両方 cutoff 以上なら verified_new、original が cutoff 未満なら verified_existing。取得時ビルドが現在ビルドより新しい不整合も unknown。それ以外は unknown。sandbox、未対応OS、欠落/不正cutoff、取得エラーは送信しない。AppTransaction.refresh は呼ばず、認証 UI を要求しない。DEBUG、および `--screenshots` / `--screenshot-mode` / `--measurement-disabled` 起動では実証拠取得をしない。Info.plist の `CommonMeasurementDisabled=true`、Firebase の明示的 collection disabled/deactivated 設定も取得前に除外する。アプリ固有の動的 opt-out を将来追加した場合も native 呼出前へ接続する。
4. 起動時にJSがこの結果を読み、旧履歴の除外を優先して scope を確定する。既に new 台帳があってもその起動で verified_new を確認するまで送信せず、許可中の本番正解は unknown 証拠でも pending として保持できる。DEBUG/無効中の初正解は抑止済みに消費し、有効化後も送信しない。証拠は固定の三状態だけで、JWS/レシート/アカウント/バージョンを Analytics に送らない。
5. 配信前に新規本番取得相当・旧版からの更新・再インストール・履歴移行・unknown/オフライン・遅延証拠・保存失敗を検証する。sandbox は新規証拠の代わりにせず、cutoff設定だけで未検証の本番配信を実施しない。

originalAppVersion は Apple アカウントの最初の取得時ビルドであり、端末へのインストール日時ではない。適格対象は署名済みの導入後取得と旧ローカル履歴なしを確認した local scope subset で、人物の初利用・端末の初インストールを保証しない。旧取得アカウントの新端末/再インストールを除外し得る。GA4 first_open の全対象や初回起動 cohort と同一ではない。

## 収益/自動イベント監査

- Firebase Analytics の first_open / session_start / user_engagement は手動複製しない。
- 現在の StoreKit 2 ブリッジは検証済み購入のみ権利を付与。JS は remove_ads_purchase_started / remove_ads_purchase_result の診断イベント、復元は remove_ads_restored。purchase / in_app_purchase を手動追加していない。保留/取消/復元を売上にしない。
- Podfile.lock の FirebaseAnalytics/Core は 11.15.0。ローカル Pods の公開 Swift interface に StoreKit 2 向け `Analytics.logTransaction(_ transaction: StoreKit.Transaction)` が存在する（`ios-arm64/FirebaseAnalytics.framework/Modules/FirebaseAnalytics.swiftmodule/arm64-apple-ios.swiftinterface`）。現行の[公式資料](https://firebase.google.com/docs/analytics/ios/measure-in-app-purchases)は SDK 12.5.0 以降を基準にしており、ローカルの旧 SDK と記載基準に差がある。RN Firebase 22.4 の JS wrapper に当該 API がないことから、Swift native bridge での使用まで不可能とは断定しない。単一の売上経路、自動収集との重複、復元抑止を未検証のため、売上送信の追加は保留する。現状の購入収益には欠落の可能性があり、SDK 更新も今回行っていない。購入売上は DebugView と Sandbox で一取引一経路を確認してから利用する。追加の売上経路/取引台帳を推測して導入しない。
- AdMob の PAID callback は既存 ad_revenue（診断イベント）を使用し、ad_impression は手動追加しない。AdMob と Firebase の既存連携/自動 ad_impression はコンソール・実機で確認する。ad_revenue と標準広告収益を合算しない。
- review_reward_earned は EARNED_REWARD callback で grant() を開始した直後の既存イベント。永続化完了を表すものではなく、実際の閲覧期限付与の集計 alias とする前に await 後の発火への移行を検証する。共通 reward_granted を重ねていない。

## GA4/集計の別工程

GA4 管理で action_name / result / schema_version をイベントスコープのカスタム定義として必要分だけ登録する。初回価値を有効化する配信では activation_key / definition_version / first_status も登録し、通常収集後の Data API metadata を確認する。collector/MetricDefinitions は action_start + action_name、action_result + action_name + result で期間全体 totalUsers を問い合わせる。日別 UU を合計しない。同義の既存イベントから共通イベントへ移行する場合は OR 条件のユーザー集合 UU とし、イベントごとの UU を足さない。操作 ID は登録しない。activation の証拠を確認できない対象は 0 到達と偽装せず、適格性未確認として区別する。導入cutoff未設定の現状は欠測を記録する。元 Sheet / Apps Script / クラウド設定は変更していない。

## 検証

Jest で開始/終端の重複、スキップ/再開始/時間切れ、正解後の継続、既存/unknown除外、新規証拠、遅延証拠、台帳破損/保存失敗/再起動の抑止を確認。`scripts/test-measurement-builds.py` は native の比較関数そのものを Swift で実行する。tsc/lint/Jest をローカル実行する。実機 DebugView では背景/復帰、連続正解、カウントダウン取消、StoreKit Sandbox の購入/復元/保留、AdMob の一表示一収益を別途確認する。

## 1.3.2 配信準備（2026-10-18）

問題単位の共通計測を配信する。初回価値の `CommonMeasurementFirstBuild` は未設定のままとし、取得証拠の実機検証と全バージョン横断のビルド番号管理を完了するまで `value_first_reached` を有効化しない。TestFlight / 本番の完了状態は App Store Connect で別途確認する。

ローカル検証: Jest 18 suites / 122 tests、TypeScript、ESLint、Swift 比較・取得分類・Release/DEBUG/スクリーンショットの収集ゲートが成功。

### 配信結果（2026-10-18）

- ソース: `77ea012d527855c3c3d37f8c0280c1f95fd6a697`。1.3.2 / build 1。
- [TestFlight CI](https://github.com/Jun-T-git/jamaica-mobile/actions/runs/39086132908) が成功。ビルド処理は `VALID`、内部配信は `IN_BETA_TESTING`。内部テスター向け配信済み。外部テスター向け配信は今回実施していない。
- [本番審査提出 CI](https://github.com/Jun-T-git/jamaica-mobile/actions/runs/39088078719) が成功。同じビルド `ce7310d0-8c65-474e-af8c-aff07d031dff` の紐付けを API で確認。版の状態は `WAITING_FOR_REVIEW`、公開方式は `AFTER_APPROVAL`。審査承認後に自動公開されるが、記録時点では一般公開前。
- iOS 26.5 / iPhone 17 Pro シミュレータで Release ビルド成功、ホーム画面の正常な起動・表示を確認。実機での計測配送や StoreKit 本番取得証拠の検証完了を示すものではない。初回価値の計測は未有効化のまま。
