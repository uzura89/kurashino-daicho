import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useSyncExternalStore } from "react";
import { FaGithub } from "react-icons/fa";
import { getDirtyFlag, subscribeDirty } from "@/lib/dirtyStore";
import { hydrateDirty } from "@/lib/db";

const NAV = [
  { href: "/", label: "①はじめに" },
  { href: "/import", label: "②明細取込" },
  { href: "/ledger", label: "③台帳作成" },
  { href: "/export", label: "④書き出し" },
  { href: "/manual", label: "説明書" },
  { href: "/guide", label: "基本情報" },
  { href: "/settings", label: "設定" },
];

function useDirty(): boolean {
  return useSyncExternalStore(
    subscribeDirty,
    () => getDirtyFlag(),
    () => false,
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dirty = useDirty();

  // 起動時に dirty 状態を IndexedDB から復元
  useEffect(() => {
    hydrateDirty().catch(() => {});
  }, []);

  // §11: 未エクスポートの下書きがあるまま離脱しようとしたら警告
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (getDirtyFlag()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="flex items-baseline gap-2 text-ink">
              <span className="font-brand text-lg tracking-widest">
                暮らしの台帳
              </span>
              <span className="hidden font-brand text-xs text-slate-400 sm:inline">
                暮らしの契約を、ひとつの台帳に
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                ログイン不要・データは端末内のみ
              </span>
              <a
                href="https://github.com/uzura89/kurashino-daicho"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub リポジトリ（ソースコード）"
                title="ソースコード（GitHub）"
                className="text-slate-400 hover:text-ink"
              >
                <FaGithub className="h-5 w-5" />
              </a>
            </div>
          </div>
          {/* モバイル/タブレット: 従来どおり上部の横並びナビ */}
          <nav className="-mb-px flex flex-wrap gap-x-1 gap-y-1 pb-2 text-sm lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-2.5 py-1 ${
                  isActive(item.href)
                    ? "bg-slate-100 font-bold text-ink"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* §1-6 / §11: 正本は「印刷した紙＋物理保管」を常に明示 */}
      <div className="border-b border-amber-200 bg-amber-50 print:hidden">
        <div className="mx-auto max-w-6xl px-4 py-1.5 text-xs text-amber-800">
          <strong>ブラウザの履歴・データを消すと内容も消えます。</strong>
          確実に残すには<strong>CSVに書き出して保存</strong>を。
          {dirty && (
            <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 font-semibold text-amber-900">
              未書き出しの変更があります
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
        {/* PC: メインペイン左のサイドバーナビ（記事詳細ページは記事側で目次を出すため非表示） */}
        {router.pathname !== "/articles/[slug]" && (
          <aside className="hidden w-44 shrink-0 lg:block print:hidden">
            <nav className="sticky top-6 flex flex-col gap-1 text-base">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-2 ${
                    isActive(item.href)
                      ? // 左の3pxボーダー分を padding で相殺して非アクティブと文字位置を揃える
                        "rounded-sm border-l-[3px] border-[#434343] bg-white pl-[9px] pr-3 font-bold text-ink"
                      : "rounded-md px-3 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
