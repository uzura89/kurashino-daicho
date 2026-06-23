import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* SEO/OGP メタは _app.tsx に集約（ページ毎の canonical/og:url のため） */}
        <link rel="icon" href="/favicons/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicons/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/favicons/favicon-192x192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicons/apple-touch-icon.png"
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
