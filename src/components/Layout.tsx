import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useSyncExternalStore } from "react";
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
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="flex items-baseline gap-2 text-slate-800">
              <span className="font-brand text-lg font-bold tracking-wide">
                暮らしの台帳
              </span>
              <span className="hidden font-brand text-xs text-slate-400 sm:inline">
                暮らしの契約を、ひとつの台帳に
              </span>
            </Link>
            <span className="text-xs text-slate-400">
              ログイン不要・データは端末内のみ
            </span>
          </div>
          <nav className="-mb-px flex flex-wrap gap-x-1 gap-y-1 pb-2 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-2.5 py-1 ${
                  isActive(item.href)
                    ? "bg-slate-800 text-white"
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
        <div className="mx-auto max-w-4xl px-4 py-1.5 text-xs text-amber-800">
          このアプリの保存は<strong>下書き</strong>です。
          <strong>ブラウザの履歴・データを消すと内容も消えます。</strong>
          確実に残すには<strong>CSVに書き出して保存</strong>を。
          {dirty && (
            <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 font-semibold text-amber-900">
              未書き出しの変更があります
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
