import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useSyncExternalStore } from "react";
import { getDirtyFlag, subscribeDirty } from "@/lib/dirtyStore";
import { hydrateDirty } from "@/lib/db";

const NAV = [
  { href: "/", label: "はじめに" },
  { href: "/import", label: "明細取込" },
  { href: "/ledger", label: "台帳作成" },
  { href: "/export", label: "書き出し" },
  { href: "/manual", label: "説明書" },
  { href: "/guide", label: "ガイド" },
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="text-base font-bold text-slate-800">
              資産・契約台帳メーカー
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
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-4xl px-4 py-1.5 text-xs text-amber-800">
          このアプリの保存は<strong>下書き</strong>です。正本は
          <strong>「書き出して印刷した紙」＋「物理保管（金庫等）」</strong>。
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
