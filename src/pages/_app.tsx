import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import "@/styles/globals.css";

const SITE_URL = "https://kurashinodaicho.com";
const SITE_NAME = "暮らしの台帳";
const TITLE =
  "暮らしの台帳｜銀行・保険・カード・サブスクの契約を自分や家族が分かる一覧に";
const DESCRIPTION =
  "銀行・カード・サブスク・保険など暮らしに関わる契約をひとまとめに一覧化して印刷。引っ越し・入院・もしもの時に、自分や家族がすぐ把握できます。日々の固定費・サブスクの見直しにも。エンディングノートの資産・契約パートを、安全に・最新の状態で残せます。ログイン不要・サーバー非保持、データは端末内のみ、正本は印刷した紙＋物理保管。";
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
          content="暮らしの台帳｜銀行・保険・カード・サブスクの契約一覧ツール"
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
