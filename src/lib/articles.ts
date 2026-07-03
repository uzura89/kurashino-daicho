// ブログ記事（content/articles/*.md）の読み込み。
// fs を使うため getStaticProps / getStaticPaths からのみ呼ぶこと。
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  publishedAt: string;
};

export type ArticleHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type Article = ArticleMeta & {
  /** marked で変換済みの本文HTML（h2/h3 に id 付与済み） */
  html: string;
  /** 目次用の見出し一覧（本文の出現順） */
  headings: ArticleHeading[];
};

export function getArticleSlugs(): string[] {
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function parseArticle(slug: string) {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const meta: ArticleMeta = {
    slug,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    publishedAt: String(data.publishedAt ?? ""),
  };
  return { meta, content };
}

/**
 * marked の出力 <h2>/<h3> に id を付与し、目次用の見出し一覧を抽出する。
 * id は見出しテキストそのまま（日本語可・重複時は連番付き）で、アンカーにも使う。
 */
function addHeadingIds(html: string): {
  html: string;
  headings: ArticleHeading[];
} {
  const headings: ArticleHeading[] = [];
  const used = new Map<string, number>();
  const result = html.replace(
    /<h([23])>([\s\S]*?)<\/h\1>/g,
    (_, levelStr: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const base = text.replace(/\s+/g, "-") || "section";
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;
      const level = Number(levelStr) as 2 | 3;
      headings.push({ id, text, level });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    },
  );
  return { html: result, headings };
}

export function getArticle(slug: string): Article {
  const { meta, content } = parseArticle(slug);
  const rawHtml = marked.parse(content, { async: false }) as string;
  const { html, headings } = addHeadingIds(rawHtml);
  return { ...meta, html, headings };
}

export function getAllArticleMeta(): ArticleMeta[] {
  return getArticleSlugs()
    .map((slug) => parseArticle(slug).meta)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
