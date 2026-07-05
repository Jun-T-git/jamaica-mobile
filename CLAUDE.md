# CLAUDE.md — リポジトリルート

このファイルは Claude Code（および開発者）向けの最上位ガイド。**まずここを読み、作業対象に応じて各詳細ドキュメントへ辿ること。**

## 第一原則: コードが正（Source of Truth）

このプロジェクトは**リリース済み**。**実装が真実**である。ドキュメントと実装が矛盾したら、**コードを正としてドキュメントを直す**（逆はしない）。ドキュメントは実装を説明・案内するものであって、規定するものではない。

## リポジトリの構成（モノレポ）

このリポジトリ `jamaica-mobile` には 2 つの独立した成果物がある。混同しないこと。

| パス | 中身 | 種類 |
|---|---|---|
| **`ModernJamaica/`** | React Native アプリ本体「ジャマイカの木」 | アプリ（開発の主戦場） |
| **`docs/`（ルート）** | プライバシーポリシーの GitHub Pages サイト（`index.html` 等） | 静的サイト（アプリとは別物） |

> ⚠️ ルートの `docs/` は**アプリのドキュメントではない**。アプリの開発者向けドキュメントは **`ModernJamaica/docs/`** にある。

## アプリを触るなら

**`ModernJamaica/CLAUDE.md`** を読むこと。そこにアプリの憲法（哲学・アーキテクチャ・規約・開発コマンド・ドキュメント更新規約）と、詳細ドキュメント（`ModernJamaica/docs/`）への入口がある。

作業ディレクトリは基本 `ModernJamaica/`（`package.json` がある場所）:

```bash
cd ModernJamaica
npm install
npm start          # Metro
npm run ios        # iOS 実行
npm test           # テスト
npx tsc --noEmit   # 型チェック
```

## ドキュメントを腐らせない仕組み（`.claude/`）

このリポジトリには、ドキュメントを実装と一致させ続けるためのハーネスがある:

- **`.claude/doc-manifest.json`** — canonical 文書 → 対象ソースの対応表。
- **`.claude/scripts/check-doc-drift.mjs`** — 参照パスの実在と、ソースが文書より新しくないか（drift）を機械チェック。
- **`/sync-docs` スキル** — 機能変更の完了時に呼ぶと、差分から影響文書を逆引きし `doc-keeper` サブエージェントが更新する。
- **`doc-keeper` / `game-core-guardian` サブエージェント** — 文書の追随更新／コア・哲学の不変条件チェック。
- **Stop フック** — 作業終了時に drift 疑いを非ブロッキングで通知。

### 変更したら文書も直す

コードを変更したら、同じ作業の中で対応する canonical 文書を更新し、**機能完了前に `/sync-docs` を実行**すること。対応表は `ModernJamaica/docs/CONVENTIONS.md` の「ドキュメント更新規約」にある。

## 既知の技術的負債（着手時は要確認）

- Android AdMob 本番 ID 未設定 / Firestore ルールと auth 実装の乖離 / config の二重定義 / テストカバレッジ低 / `designSystem.ts` は削除済み。
- 詳細は `ModernJamaica/docs/CONVENTIONS.md`。
