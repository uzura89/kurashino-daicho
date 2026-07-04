import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getAllRecords,
  wipeAllLocalData,
  getCategoryNotApplicable,
  replaceAllRecords,
} from "@/lib/db";
import { csvToRecords } from "@/lib/csv";
import { readTextFileSmart } from "@/lib/download";
import { RECORD_TYPES } from "@/lib/schema";
import { isCategoryComplete } from "@/lib/record";
import type { LedgerRecord } from "@/lib/types";

type Stats = { records: number; resolved: number; total: number };

export default function SettingsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    try {
      const [recs, na] = await Promise.all([
        getAllRecords(),
        getCategoryNotApplicable(),
      ]);
      const byType: Record<string, LedgerRecord[]> = {};
      for (const r of recs) (byType[r.type] ??= []).push(r);
      const total = RECORD_TYPES.length;
      const resolved = RECORD_TYPES.filter((t) =>
        isCategoryComplete(byType[t.type] ?? [], !!na[t.type]),
      ).length;
      setStats({ records: recs.length, resolved, total });
    } catch {
      setStats({ records: 0, resolved: 0, total: RECORD_TYPES.length });
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const clearAll = async () => {
    if (
      !confirm(
        "この端末に保存された下書き（台帳の全レコード・「該当なし」設定・表示状態）をすべて削除します。\n\n書き出したCSV/印刷物には影響しませんが、未書き出しの内容は復元できません。よろしいですか？",
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await wipeAllLocalData();
      await reload();
      setMessage("下書きデータをすべて削除しました。");
    } finally {
      setBusy(false);
    }
  };

  const onReimport = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await readTextFileSmart(file);
      const parsed = csvToRecords(text);
      if (parsed.length === 0) {
        setMessage(
          "このCSVから台帳レコードを復元できませんでした。このアプリで書き出したCSVを指定してください。",
        );
        return;
      }
      if (
        !confirm(
          `現在の下書き（${stats?.records ?? 0}件）を、読み込んだ ${parsed.length} 件で置き換えます。よろしいですか？`,
        )
      ) {
        return;
      }
      await replaceAllRecords(parsed);
      await reload();
      setMessage(`${parsed.length} 件のレコードを読み戻しました。`);
    } catch (e) {
      setMessage(
        "読み込みに失敗しました: " +
          (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const pct =
    stats && stats.total > 0
      ? Math.round((stats.resolved / stats.total) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="page-title">設定</h1>
        <p className="mt-1 text-sm text-slate-600">
          この端末に保存された下書きデータの管理を行います。データはこの端末のブラウザ内（IndexedDB）にのみ保存されています。
        </p>
      </header>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <section className="card space-y-3">
        <h2 className="card-title">データの状況</h2>
        <div>
          <div className="mb-1 flex items-baseline justify-between text-sm text-slate-600">
            <span>入力の進捗（カテゴリ）</span>
            <span className="font-semibold text-slate-800">
              {stats ? `${stats.resolved} / ${stats.total}` : "—"}
              <span className="ml-1 text-xs font-normal text-slate-500">
                （{pct}%）
              </span>
            </span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            各カテゴリが「入力済み」または「該当なし」になると完了です。現在の下書き:{" "}
            {stats ? `${stats.records} レコード` : "—"}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          削除する前に、必要なら{" "}
          <Link href="/export" className="font-semibold underline">
            書き出し
          </Link>{" "}
          でCSV/PDFをバックアップしてください（CSVは再編集の正本になります）。
        </p>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="card-title">CSVを読み戻す（再編集用）</h2>
          <p className="mt-1 text-sm text-slate-600">
            このアプリで書き出した<strong>CSV</strong>
            を読み込み、編集を再開できます。
            再編集の正本はCSVです（PDFは閲覧・共有用）。読み込むと現在の下書きは置き換わります。
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onReimport(f);
          }}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />
      </section>

      <section className="card space-y-2 border-red-200">
        <h2 className="font-semibold text-red-700">下書きデータの全削除</h2>
        <p className="text-sm text-slate-600">
          この端末の下書き（台帳の全レコード・「該当なし」設定・表示状態）をすべて削除します。
          <strong>書き出したCSV/印刷物には影響しません</strong>
          が、未書き出しの内容は元に戻せません。
        </p>
        <button
          type="button"
          className="btn-danger"
          onClick={clearAll}
          disabled={busy}
        >
          {busy ? "削除中…" : "下書きデータをすべて削除"}
        </button>
      </section>

      <p className="text-xs text-slate-400">
        ※
        ブラウザのデータ消去・端末の故障・買い替えでも下書きは失われます。正本は「書き出して印刷した紙＋物理保管」です。
      </p>
    </div>
  );
}
