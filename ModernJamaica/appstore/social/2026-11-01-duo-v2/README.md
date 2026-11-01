# YouTube Shorts 改善版2本

制作日：2026-11-01 JST。利用者の改善依頼により、10/31の23正解版と65失敗版を再編集。原版と元素材は維持し、別の問題・新規予約として数えない。未投稿・未予約。

| 動画 | 旧版→改善版 | 完成MP4 |
| --- | --- | --- |
| 23 正解版 | 17.8→15.7秒 | `exports/make-23/reveal/make-23-reveal.mp4` |
| 65 失敗版 | 19.1→16.5秒 | `exports/make-65/fail/make-65-fail.mp4` |

冒頭は目標値をnativeカードに一本化し、「5つ全部を1回ずつ」と5数字を強調。操作開始は1.6秒。実際の操作・演算子の保持・正解表示・完成木2.1秒・失敗のnative3→2→1→0を維持。失敗版は66成立後に「あと1 どこを直す？」を追加し、正しい式は公開素材に出さない。

末尾の検索案内は各1.8秒。アイコン中心の画面を実際の木を残す構成へ変更し、正式名称を含む検索文を明示。終盤だけnative目標カードと連続した木領域を別の高さへ配置し、根・枝・全5葉と色を保持。操作ボタンを省き、失敗のエラーバナー上辺も残さない。

## 再生成

ローカル原本、30fps素材、音源、アイコン、フォント、Python依存は `../2026-10-31-duo/README.md` と同じ。configはその素材を相対参照し、元のハッシュ・演算木・時間切れ確認範囲を検査する。MP4・確認画像・中間ファイルはGit外。原本のない別端末で再生成可能とはしない。

```sh
python3 ModernJamaica/appstore/social/2026-10-31-duo/renderer/render.py --manifest ModernJamaica/appstore/social/2026-11-01-duo-v2/batch-plan.json --check
python3 ModernJamaica/appstore/social/2026-10-31-duo/renderer/render.py --manifest ModernJamaica/appstore/social/2026-11-01-duo-v2/batch-plan.json --output-root ModernJamaica/appstore/social/2026-11-01-duo-v2/exports
```

`presentation.version: 2` は改善配置を選ぶ。旧configの配置は変えない。変更したrendererには冒頭の時刻不一致、未確認の失敗映像、早すぎる失敗字幕、CTAへの字幕混入を防ぐ6件のテストを追加した。再編集を履歴へ同期しても、既知の問題数は13のまま。

## 検証と限界

最終ファイルのハッシュ・フレーム数・音量・確認範囲は `delivery-manifest.json`、各 `qa/validation.json` と `qa-review.md` を参照。主担当と独立担当が最終MP4の抽出画像で冒頭・各演算・結果・実際の時間切れ・検索案内と360px相当の重なりを確認。全フレームのデコード・解像度・音量の機械検査と、人の連続視聴・主観的な音声試聴は区別する。後者とYouTube投稿プレビューのUI重なりは未確認。

視聴・インストール増加は未測定。今回は構成・表示の改善で、比較実験や公開は行っていない。公開時に入稿プレビューと観測条件を確認する。未公開の再編集Taskなので定期監視・追加サービスは不要。アプリ本体のコード変更・build・本番リリースは行っていない。

復旧は改善版フォルダーを使用対象から外して原版へ戻す。共有rendererはpresentation未指定の従来動作を保持する。利用者のアプリ開発変更は対象外。
