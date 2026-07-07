---
name: sync-docs
description: 実装の変更に合わせて canonical ドキュメント(ModernJamaica/docs/ と CLAUDE.md)を追随更新する。コードを変更した後・機能を完了する前に使う。差分から影響を受ける常緑文書を doc-manifest.json で逆引きし、doc-keeper サブエージェントに更新させ、check-doc-drift.mjs で整合を検証する。「ドキュメントを同期」「docs を更新」「drift をチェック」等で起動。
---

# sync-docs — ドキュメント整合スキル

コードの変更に対して、canonical ドキュメントを実装に追随させるためのワークフロー。**第一原則: コードが正**。ドキュメントを実装に合わせて直す（逆はしない）。

## 前提

- リポジトリルート（`jamaica-mobile/`）から作業する。
- 対応表は `.claude/doc-manifest.json`。検証は `.claude/scripts/check-doc-drift.mjs`。
- canonical 文書の一覧・方針は `ModernJamaica/docs/README.md`。

## 手順

### 1. 変更範囲を特定
```bash
git status --porcelain
git diff --stat
```
未コミットの変更・直近のコミットで、どのソースが変わったかを把握する。

### 2. 影響する canonical 文書を逆引き
`.claude/doc-manifest.json` を読み、変更されたソースを `covers` に含む文書を列挙する。あわせて機械チェックを実行:
```bash
node .claude/scripts/check-doc-drift.mjs
```
- `[drift]` … その文書は担当ソースより古い → 要更新。
- `[bad-ref]` / `[bad-link]` … 文書中の参照/リンク切れ → 要修正。
- `[covers-missing]` … ファイル削除/移動 → 該当文書（多くは ARCHITECTURE）と manifest を要更新。

### 3. doc-keeper サブエージェントに更新を委任
影響文書ごとに、担当ソースの現状と文書を突き合わせて最小差分で更新する。**Task ツールで `doc-keeper` サブエージェントを起動**し、対象文書パスと変更概要（git diff）を渡す。複数文書は並行起動してよい。

doc-keeper への指示テンプレート:
> 次の canonical 文書を、担当ソースの現在の実装に合わせて更新して。コードが正。揮発性の詳細（正確なシグネチャ・数値）は散文に写さずコードを指す方針を守る。対象文書: `<path>` / 担当ソース: `<covers>` / 変更概要: `<git diff 要約>`

### 4. コアに触れた場合は不変条件レビュー
差分が `store/gameStore.ts` / `utils/problemGenerator.ts` / `utils/scoreCalculator.ts` / `types/` などコア・哲学に関わるなら、**`game-core-guardian` サブエージェント**を起動し、[PHILOSOPHY.md](../../../ModernJamaica/docs/PHILOSOPHY.md) の不変条件を破っていないか検証する。違反があればユーザーに報告（勝手にコードを直さない）。

### 5. 検証（ゲート）
```bash
node .claude/scripts/check-doc-drift.mjs --strict
```
ERROR/WARN が残っていれば 2〜4 に戻る。ただし [covers-missing] や時刻スキュー由来の誤検出と判断できる場合は、その旨を報告して先へ進む。

### 6. 報告
更新した文書・理由・残課題（あれば技術的負債として `CONVENTIONS.md` に追記）を簡潔にまとめて報告する。新しい設計判断をしたなら `ModernJamaica/docs/decisions/` に **frozen ADR を追加**（既存は書き換えない）。

## やらないこと
- ドキュメントに合わせてコードを変更しない（コードが正）。
- frozen 文書（`decisions/`）を書き換えない。
- canonical 文書に関数シグネチャ・具体数値を丸写しして厚くしない。
