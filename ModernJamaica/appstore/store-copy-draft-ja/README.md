# ストア掲載文ドラフト（参照用・未使用）

このフォルダは App Store の掲載文（タイトル/サブタイトル/説明/キーワード/宣伝文/各URL）の**ドラフト**。

**現在の運用では使っていない。** 既存の App Store Connect の掲載文をそのまま使う方針のため、
`fastlane deliver`（`ios metadata` レーン）が反映するのは **What's New（`fastlane/metadata/ja/release_notes.txt`）とスクリーンショットのみ**。

掲載文を作り直したくなったら、ここの内容を `fastlane/metadata/ja/` に置けば deliver の反映対象になる
（文字数上限: サブタイトル30 / 宣伝文170 / キーワード100 / 説明4000）。
