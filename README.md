# 記事リポジトリ

`articles/` が原稿の唯一の正本です。`main` への push で、Zenn は公式GitHub連携により同期され、Qiita はGitHub Actionsで同期されます。

Qiitaへ投稿する本文の末尾には、対応するZenn記事へのリンクが自動で追加されます。

## 配置

- `articles/<slug>.md` — Zenn記事。ファイル名は英小文字・数字・`-`・`_`で12〜50文字にします。
- `images/<slug>/...` — 共通画像。Zennでは本文から `/images/<slug>/...` と参照します。
- `qiita/public/` — 自動生成物。直接編集しません。
- `qiita-article-ids.json` — Qiitaで既に公開済みの記事ID。既存記事を取り込むときだけ記録します。

## 執筆・公開

記事には次のFront Matterを置きます。`published: false` の間はZennでは下書き、Qiitaでは投稿対象外です。公開するときだけ `true` に変更してpushします。

```yaml
---
title: "記事タイトル"
emoji: "📝"
type: "tech"
topics: ["topic1", "topic2"]
published: false
---
```

画像は `/images/<slug>/image.png` のように絶対パスで参照します。Qiita用には自動的にGitHub上の画像URLへ変換されるため、リポジトリをPublicにしてください。

## 初回だけ必要な設定

1. GitHubリポジトリの `Settings → Secrets and variables → Actions` に、Qiitaで発行した書き込み権限付きトークンを `QIITA_TOKEN` として登録します。
2. Zennダッシュボードの「GitHubからのデプロイ」で、このリポジトリと `main` ブランチを連携します。
3. `npm run sync:qiita` を実行して生成物を作り、初回コミット・pushを行います。

Qiitaの記事IDは投稿後に自動で `qiita/public/` へ記録されます。以後、原稿を更新してpushすれば同じ記事が更新されます。
