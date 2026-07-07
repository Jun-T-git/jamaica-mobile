<!-- STABILITY: frozen -->

# Architecture Decision Records (ADR)

このディレクトリは**時点凍結（frozen）**の設計判断の記録です。

## ルール

- 各 ADR は「ある時点で、なぜその選択をしたか」の記録。**一度書いたら更新しない**。
- 判断が覆ったら、既存 ADR を書き換えず**新しい ADR を追加**し、旧 ADR を「Superseded by ADR-XXXX」と参照する。
- 現在の実装がどうなっているかを知りたい場合は、ADR ではなく [../](../)（canonical 文書）を見ること。ADR は歴史であって現状ではない。

## 命名

`NNNN-kebab-title.md`（連番）。冒頭に `<!-- STABILITY: frozen -->` と記録日を書く。

## 一覧

| ADR | タイトル | 状態 |
|---|---|---|
| [0001](./0001-tap-to-connect.md) | 盤面操作は drag&drop でなく tap-to-connect | Accepted |
| [0002](./0002-zustand-unified-store.md) | 単一 Zustand ストアで 2 モードを扱う | Accepted |
| [0003](./0003-firestore-ranking.md) | Firestore による匿名ランキング | Accepted（既知の乖離あり） |

> 注: 0001–0003 は本ドキュメント整備時（2026-07-05）に、**既存のリリース済み実装から遡って**記録したもの。当時の一次資料ではなく、コードから読み取れる意図の再構成である。
