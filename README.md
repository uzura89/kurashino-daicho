# 資産・契約台帳メーカー

自分の**資産・契約台帳**（銀行・カード・サブスク・保険・年金・不動産・アカウントなどの所在一覧）を
作って**印刷する**ための、**ログイン不要・サーバー非保持の静的ブラウザツール**。
すべてブラウザ内で完結します。終活・相続の資産整理や、サブスクの解約準備に使えます。

**公開サイト: https://kurashinodaicho.com**

> 使い方・スコープはアプリ内の `/manual` と `/guide` に記載。

## ハードルール

- バックエンドにユーザーデータを保存しない（サーバーDB・永続ストレージなし）
- 認証機能を持たない（ログイン・セッション・トークンなし）
- 外部APIにユーザーデータを送らない（LLM不使用。明細解析もすべてブラウザ内）
- 秘匿情報（パスワード等）は台帳のスキーマに持たない
- 正本はアプリの外（印刷した紙 ＋ 物理保管）。IndexedDB は揮発しうる下書き

## 計測・外部通信について

- 公開サイトではアクセス解析に [Vercel Analytics](https://vercel.com/docs/analytics) を使用しています。収集されるのはページビュー等の匿名の利用統計のみで、台帳の内容・取り込んだ明細・入力データが送信されることはありません（これらはブラウザの IndexedDB から外に出ません）
- 利用状況の把握のため、PDF書き出し（`export_pdf`）と CSV書き出し（`export_csv`）の実行回数をカスタムイベントとして計測しています。送信されるのはイベント名とレコード件数のみで、台帳の中身は含まれません
- Web フォント（Google Fonts の BIZ UDPMincho）を CDN から読み込みます
- 上記以外に外部への通信はありません。セルフホストする場合は `src/pages/_app.tsx` の `<Analytics />` を外せば Vercel Analytics も無効になります

## 技術スタック

- Next.js（Pages Router）+ TypeScript / 静的エクスポート（`output: 'export'`）
- Tailwind CSS
- IndexedDB（`idb`、下書き専用）
- PDF生成: `pdf-lib`（Noto Sans JP 同梱・埋め込み） / CSVパース: `papaparse`

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 静的エクスポート → out/
```

`npm run build` で `out/` に静的サイトが生成されます。Vercel 等にそのままデプロイできます。

## ライセンス

[MIT License](./LICENSE)
