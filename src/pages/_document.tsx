import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <meta
          name="description"
          content="終活・相続の資産整理やサブスクの解約準備に。資産・契約（銀行・カード・サブスク・保険・年金・不動産など）の所在を一覧化し、無料で作成・印刷できるブラウザツール。ログイン不要・サーバー非保持、データは端末内のみ、正本は印刷した紙＋物理保管。"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=BIZ+UDPMincho:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* §11: 台帳内容を捕捉するアナリティクスや third-party スクリプトは入れない */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
