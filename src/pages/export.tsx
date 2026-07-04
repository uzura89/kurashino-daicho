import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllRecords, clearDirty, wipeAllLocalData } from "@/lib/db";
import { recordsToCsv } from "@/lib/csv";
import { downloadText, downloadBytes, stampFromDate } from "@/lib/download";
import LedgerPreview from "@/components/LedgerPreview";
import type { LedgerRecord } from "@/lib/types";

export default function ExportPage() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // CSV書き出し直後に「下書きを端末に残さない」選択を促すダイアログ（§11）
  const [askWipe, setAskWipe] = useState(false);

  const reload = () =>
    getAllRecords().then((r) => {
      setRecords(r);
      setLoaded(true);
    });

  useEffect(() => {
    reload();
  }, []);

  const stamp = () => stampFromDate(new Date());

  // PDF（印刷・共有用）と CSV（再編集用の正本）を1回の操作でまとめて書き出す。
  // CSV の保存忘れ＝下書き消失時のデータ喪失を防ぐため、ボタンは分けない。
  const exportAll = async () => {
    setBusy("export");
    setMessage(null);
    try {
      let pdfError: string | null = null;
      let pdfBytes: Uint8Array | null = null;
      try {
        // pdf-lib は重いので、書き出し時のみ遅延読み込みする
        const { generatePdf } = await import("@/lib/pdf");
        pdfBytes = await generatePdf(records, { title: "資産・契約台帳" });
      } catch (e) {
        pdfError = e instanceof Error ? e.message : String(e);
      }
      const s = stamp();
      if (pdfBytes) {
        downloadBytes(`daicho_${s}.pdf`, pdfBytes, "application/pdf");
      }
      // PDF 生成に失敗しても、正本である CSV は必ず書き出す
      downloadText(`daicho_${s}.csv`, recordsToCsv(records));
      await clearDirty();
      setMessage(
        pdfError
          ? `CSVは書き出しましたが、PDFの生成に失敗しました: ${pdfError}`
          : "PDFとCSVを書き出しました。PDFは印刷して物理保管、CSVは再編集用の正本です。",
      );
      setAskWipe(true);
    } finally {
      setBusy(null);
    }
  };

  const wipeAfterExport = async () => {
    setBusy("wipe");
    try {
      await wipeAllLocalData();
      await reload();
      setMessage(
        "ファイルを書き出し、この端末の下書きをすべて削除しました。編集を再開するには、設定の「CSVを読み戻す」で書き出したCSVを読み込んでください。",
      );
    } finally {
      setAskWipe(false);
      setBusy(null);
    }
  };

  const empty = loaded && records.length === 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="page-title">書き出し（エクスポート）</h1>
        <p className="mt-1 text-sm text-slate-600">
          台帳を1つのファイルに書き出します。書き出したファイルが
          <strong>正本</strong>になります。
          台帳には秘匿情報（パスワード等）は含まれません。
          {loaded && <>（現在 {records.length} レコード）</>}
        </p>
      </header>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {empty && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          台帳が空です。まず{" "}
          <Link href="/ledger" className="font-semibold underline">
            台帳作成
          </Link>{" "}
          で入力してください。
        </div>
      )}

      <section className="card space-y-3">
        <div>
          <h2 className="card-title">台帳を書き出す</h2>
          <p className="mt-1 text-sm text-slate-600">
            「どこに何があるか」の地図情報です。
            <strong>PDFは印刷して物理保管</strong>、
            CSVは次回の再編集用（正本）です。家族とのデジタル共有にも使えます
            （パスワード等は含まれないため）。
          </p>
        </div>
        <div>
          <button
            className="btn-primary"
            disabled={!!busy || empty}
            onClick={() => exportAll()}
          >
            {busy === "export"
              ? "書き出し中…"
              : "ファイルに書き出し（PDF＆CSV）"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            PDFとCSVの2つのファイルをダウンロードします。ブラウザが「複数ファイルのダウンロード」の許可を求めた場合は許可してください。
          </p>
        </div>
      </section>

      {!empty && (
        <section className="space-y-3">
          <div className="print:hidden">
            <h2 className="font-brand text-lg tracking-wider text-ink">
              プレビュー
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              書き出し（PDF/印刷）の内容を確認できます。値の入った項目だけを表示します。
            </p>
          </div>
          <LedgerPreview records={records} />
        </section>
      )}

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
        以前書き出したCSVから編集を再開するには{" "}
        <Link href="/settings" className="font-semibold underline">
          設定
        </Link>{" "}
        の「CSVを読み戻す」をご利用ください。
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
        書き出したら次は{" "}
        <Link href="/guide" className="font-semibold underline">
          基本情報
        </Link>{" "}
        の手順で印刷・物理保管し、保管場所と開け方を家族に伝えてください。
      </div>

      {askWipe && (
        <div
          className="fixed inset-0 z-50 !mt-0 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wipe-dialog-title"
        >
          <div className="w-full max-w-md space-y-3 rounded-lg bg-white p-5 shadow-xl">
            <h2 id="wipe-dialog-title" className="card-title">
              ファイルを書き出しました
            </h2>
            <p className="text-sm text-slate-600">
              プライバシー保護のため、下書きをブラウザに長く残さないことをおすすめします。
              いま書き出したCSVが正本なので、削除しても{" "}
              <span className="font-semibold">設定の「CSVを読み戻す」</span>
              でいつでも編集を再開できます。
            </p>
            <p className="text-sm text-slate-600">
              この端末の下書きを今すぐ削除しますか？
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAskWipe(false)}
                disabled={busy === "wipe"}
              >
                残しておく
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={wipeAfterExport}
                disabled={busy === "wipe"}
              >
                {busy === "wipe" ? "削除中…" : "下書きを削除する（推奨）"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
