# 固定コメントに答えを置く追加5本

2026-11-01制作。通常のnativeゲーム画面を新規収録し、全5数字を使った4演算から誤答の完成木まで見せる `comment-answer` / `commentResult: wrong`。採用例は `../2026-11-01-comment-answer-v2/`。数字や目標の編集・ヒント・答えの表示は行っていない。

|公開希望日時（JST）|目標|元の数字順|動画の誤答|ID|
|---|---:|---|---:|---|
|11/2 12:00|44|4, 6, 3, 1, 1|43|make-44-00fc72e0|
|11/3 12:00|17|1, 1, 6, 5, 1|18|make-17-b2187dbc|
|11/4 12:00|23|5, 6, 2, 6, 2|24|make-23-435688ae|
|11/5 12:00|48|2, 3, 5, 1, 4|56|make-48-8dba5bcc|
|11/6 12:00|37|1, 2, 6, 5, 1|38|make-37-ba02597f|

上表は依頼された日程。実際の保存日時・動画ID・公開状態・答えコメント投稿・固定確認は [publication-proof/posts.json](publication-proof/posts.json) を正本とする。制作完了や原稿保存だけで、予約・公開・コメント固定の完了を表さない。このファイルやQA内の生成時点の `published` 値は公開状態の管理に使わない。

## 構成と素材

全5本は1080×1920・30fps・17.2秒。2秒の問題提示→未操作手札1秒→4演算と誤答の完成→「答えは固定コメントへ」2秒→App Store検索2秒。実際に選ばれた演算子のフレームを各0.7秒保持して、短い操作も追えるようにした。17版は独立QAで2演算目の選択保持を9.8秒から9.8333秒へ修正し、最終版のhashをmanifestに固定した。

通常ゲームのnative目標カードと連続した木・操作盤を保持。深さ3の誤答木は最終結果cutとコメント保持で既存の全画面cropへ切り替え、根・全5葉・枝・誤答バナー・演算子を欠かさない。コメント保持は直前の最終nativeフレームと同じcrop/位置。字幕y575はnative目標カード下と誤答根の間。時間切れや正解例・正解式・成功表示は動画に入れない。

原本 `sources/*.mov` と30fps素材 `build/*-cfr.mp4`、MP4/画像はGit外。再編集可能な設定は `problems/`、実収録と確認した時刻・元数字・算術・crop根拠は `sources/*-evidence.json`。問題の予約・重複台帳は製品共通の `../problem-history.json` が正本で、この制作担当は変更していない。同じ目標23でも以前の元数字とは異なる問題。

## 固定コメント原稿

各 `exports/<ID>/comment-answer/fixed-comment.txt` に、読みやすい全角記号・必要最小限の括弧で正解式を保存。その後に空行と「他の解き方を見つけた方はコメントで教えてください！」を置いた。数式の評価と元5数字の各1回使用、表示式の数字多重集合を検証済み。実際に投稿・固定した状態は投稿記録で別に確認する。

## 再現と確認

製品repoルートから：

```sh
python3 ModernJamaica/appstore/social/2026-10-31-duo/renderer/render.py --manifest ModernJamaica/appstore/social/2026-11-02-comment-week/batch-plan.json --check
python3 ModernJamaica/appstore/social/2026-10-31-duo/renderer/render.py --manifest ModernJamaica/appstore/social/2026-11-02-comment-week/batch-plan.json --output-root ModernJamaica/appstore/social/2026-11-02-comment-week/exports
```

書出し直すとrenderer既定の固定コメント数式が生成されるため、原稿は各evidenceの `fixedCommentText` で指定表示へ復元する。MP4を変更した場合はmanifest/hash/QAを更新し、入稿済み動画と混同しない。現時点の5MP4は最終書出しを停止し、[delivery-manifest.json](delivery-manifest.json) のhashで固定している。

算術・録画/正規化素材hash・時刻・全デコード・フレーム数・音量を確認。編集担当の抽出確認と独立QAの確認範囲は各 `exports/<ID>/comment-answer/qa/validation.json` および [independent-qa.json](independent-qa.json) に保存する。抽出確認・全デコードは、通し再生や音声試聴とは区別する。編集担当/独立QA担当による通し再生・主観的音声試聴は未実施。投稿画面の確認は投稿担当の記録を参照。
