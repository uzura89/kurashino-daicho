import type { GetStaticProps } from "next";
import Link from "next/link";
import type { PageSeo } from "@/pages/_app";
import { getAllArticleMeta, type ArticleMeta } from "@/lib/articles";

type Props = {
  articles: ArticleMeta[];
  seo: PageSeo;
};

export default function ArticlesIndexPage({ articles }: Props) {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="page-title">記事一覧</h1>
        <p className="mt-1 text-sm text-slate-600">
          終活・財産目録・サブスク管理・デジタル遺品など、暮らしの情報整理に役立つ記事をまとめています。
        </p>
      </header>
      <div className="space-y-3">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/articles/${a.slug}/`}
            className="card block transition-colors hover:border-slate-300"
          >
            <h2 className="font-brand text-lg tracking-wider text-ink underline decoration-slate-300 underline-offset-4">
              {a.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {a.description}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              公開日: {a.publishedAt}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: {
    articles: getAllArticleMeta(),
    seo: {
      title: "記事一覧",
      description:
        "終活の始め方・財産目録の作り方・エンディングノート・サブスクの洗い出し・デジタル遺品の整理など、暮らしの情報整理に役立つ記事の一覧です。",
    },
  },
});
