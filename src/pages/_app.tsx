import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import "@/styles/globals.css";

const SITE_URL = "https://moshimo-daicho-maker.vercel.app";
const SITE_NAME = "もしも台帳メーカー";
const TITLE =
  "もしも台帳メーカー｜個人の資産とサブスクを一覧化するツール。終活・相続に。";
const DESCRIPTION =
  "終活・相続の資産整理やサブスクの解約準備に。資産・契約（銀行・カード・サブスク・保険・年金・不動産など）の所在を一覧化し、無料で作成・印刷できるブラウザツール。ログイン不要・サーバー非保持、データは端末内のみ、正本は印刷した紙＋物理保管。";
const OG_IMAGE = `${SITE_URL}/ogp.png`;

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // trailingSlash: true で書き出されるので末尾スラッシュに正規化
  const path = router.asPath.split(/[?#]/)[0];
  const canonical =
    SITE_URL + (path === "/" ? "/" : path.replace(/\/+$/, "") + "/");

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#1f2933" />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="もしも台帳メーカー｜資産・サブスク契約の一覧化ツール"
        />
        <meta property="og:locale" content="ja_JP" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
