import type { AppProps } from 'next/app';
import Head from 'next/head';
import Layout from '@/components/Layout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>資産・契約台帳メーカー｜終活・相続の資産整理とサブスク解約リストを無料作成・印刷</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
