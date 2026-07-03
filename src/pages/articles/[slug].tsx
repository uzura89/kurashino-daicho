import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import type { PageSeo } from "@/pages/_app";
import {
  getArticle,
  getArticleSlugs,
  type Article,
  type ArticleHeading,
} from "@/lib/articles";

type Props = {
  article: Article;
  seo: PageSeo;
};

/** 全記事共通のCTAブロック（記事末尾に固定で表示） */
function ArticleCta() {
  return (
    <section className="card space-y-3">
      <h2 className="card-title">
        資産・契約情報の洗い出しは「暮らしの台帳」が便利です
      </h2>
      <p className="text-sm leading-relaxed text-slate-600">
        <strong>暮らしの台帳</strong>
        は、銀行・カード・サブスク・保険・年金・不動産・デジタルアカウントなど、
        暮らしに関わる契約や資産の「どこに何があるか」を一覧にまとめ、印刷して残せる無料ツールです。
      </p>
      <ul className="space-y-1 text-sm leading-relaxed text-slate-600">
        <li>
          ✅ <strong>ログイン不要・無料</strong> — すぐに使い始められます
        </li>
        <li>
          🔒 <strong>データは端末内のみに保存</strong> —
          サーバーや外部に送信されません
        </li>
        <li>
          🖨️ <strong>PDF／CSVに書き出して印刷</strong> —
          もしもの時、家族がすぐ把握できます
        </li>
        <li>
          📥 <strong>カード明細のCSV取込</strong> —
          サブスク（定期課金）を自動で抽出
        </li>
      </ul>
      <p className="text-sm leading-relaxed text-slate-600">
        引っ越し・入院・もしもの時に、自分や家族が困らないための「暮らしの地図」を、簡単フローで作成しましょう。
      </p>
      <p>
        <Link href="/" className="btn-primary">
          暮らしの台帳を作成する（ログイン不要）
        </Link>
      </p>
    </section>
  );
}

/** 表示中のセクションをスクロール位置から求める */
function useActiveHeading(headings: ArticleHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      // 画面上部から少し下がった位置を「読んでいる場所」とみなす
      const readingLine = window.scrollY + 120;
      let current: string | null = null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= readingLine) current = h.id;
        else break;
      }
      setActiveId(current ?? headings[0]?.id ?? null);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  return activeId;
}

/** PC用: 記事の見出し目次（スクロールに追従し、表示中のセクションをハイライト） */
function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  const activeId = useActiveHeading(headings);

  return (
    <aside className="hidden w-56 shrink-0 lg:block print:hidden">
      <nav
        aria-label="目次"
        className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
      >
        <p className="mb-2 text-xs font-medium tracking-wider text-slate-400">
          目次
        </p>
        <ul className="space-y-0.5 border-l border-slate-200 text-[13px] leading-snug">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block border-l-2 py-1.5 pr-2 transition-colors ${
                  h.level === 3 ? "pl-6" : "pl-3"
                } ${
                  activeId === h.id
                    ? "-ml-px border-ink bg-white font-bold text-ink"
                    : "-ml-px border-transparent text-slate-500 hover:text-ink"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default function ArticlePage({ article }: Props) {
  return (
    <div className="flex gap-8">
      <ArticleToc headings={article.headings} />
      <div className="min-w-0 max-w-3xl flex-1 space-y-5">
        <nav
          aria-label="パンくずリスト"
          className="flex items-center gap-1.5 text-xs text-slate-500"
        >
          <Link
            href="/"
            aria-label="ホーム"
            title="ホーム"
            className="text-slate-400 hover:text-ink"
          >
            <FaHome className="h-3.5 w-3.5" />
          </Link>
          <span aria-hidden="true">›</span>
          <Link href="/articles" className="underline hover:text-ink">
            記事一覧
          </Link>
          <span aria-hidden="true">›</span>
          <span className="min-w-0 truncate">{article.title}</span>
        </nav>
        <header>
          <h1 className="font-brand text-3xl font-bold leading-relaxed tracking-wider text-ink">
            {article.title}
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            公開日: {article.publishedAt}
          </p>
        </header>
        <article className="card">
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </article>
        <ArticleCta />
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          この記事は一般的な参考情報です。法律・税務・相続などの個別のご判断は、専門家や公的機関にご相談ください。
        </div>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getArticleSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const article = getArticle(String(params?.slug));
  return {
    props: {
      article,
      seo: {
        title: article.title,
        description: article.description,
        ogType: "article",
      },
    },
  };
};
