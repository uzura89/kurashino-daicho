import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getAllRecords, replaceAllRecords, clearDirty } from '@/lib/db';
import { recordsToCsv, csvToRecords } from '@/lib/csv';
import { downloadText, downloadBytes, readTextFileSmart, stampFromDate } from '@/lib/download';
import type { LedgerRecord } from '@/lib/types';

export default function ExportPage() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () =>
    getAllRecords().then((r) => {
      setRecords(r);
      setLoaded(true);
    });

  useEffect(() => {
    reload();
  }, []);

  const stamp = () => stampFromDate(new Date());

  const exportCsv = async () => {
    setBusy('csv');
    try {
      const csv = recordsToCsv(records);
      downloadText(`shukatsu_${stamp()}.csv`, csv);
      await clearDirty();
      setMessage('CSVを書き出しました。再編集用の正本です。印刷物と一緒に物理保管してください。');
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = async () => {
    setBusy('pdf');
    setMessage(null);
    try {
      // pdf-lib は重いので、PDF書き出し時のみ遅延読み込みする
      const { generatePdf } = await import('@/lib/pdf');
      const bytes = await generatePdf(records, { title: '資産・契約台帳' });
      downloadBytes(`shukatsu_${stamp()}.pdf`, bytes, 'application/pdf');
      await clearDirty();
      setMessage('PDFを書き出しました。');
    } catch (e) {
      setMessage('PDF生成に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(null);
    }
  };

  const onReimport = async (file: File) => {
    setBusy('reimport');
    setMessage(null);
    try {
      const text = await readTextFileSmart(file);
      const parsed = csvToRecords(text);
      if (parsed.length === 0) {
        setMessage('このCSVから台帳レコードを復元できませんでした。このアプリで書き出したCSVを指定してください。');
        return;
      }
      if (
        !confirm(
          `現在の下書き（${records.length}件）を、読み込んだ ${parsed.length} 件で置き換えます。よろしいですか？`,
        )
      ) {
        return;
      }
      await replaceAllRecords(parsed);
      await reload();
      setMessage(`${parsed.length} 件のレコードを読み戻しました。`);
    } catch (e) {
      setMessage('読み込みに失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const empty = loaded && records.length === 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-800">書き出し（エクスポート）</h1>
        <p className="mt-1 text-sm text-slate-600">
          台帳を1つのファイルに書き出します。書き出したファイルが<strong>正本</strong>になります。
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
          台帳が空です。まず{' '}
          <Link href="/ledger" className="font-semibold underline">
            台帳作成
          </Link>{' '}
          で入力してください。
        </div>
      )}

      <section className="card space-y-3">
        <div>
          <h2 className="font-semibold text-slate-800">台帳を書き出す</h2>
          <p className="mt-1 text-sm text-slate-600">
            「どこに何があるか」の地図情報です。<strong>PDFは印刷して物理保管</strong>、
            CSVは次回の再編集用（正本）です。家族とのデジタル共有にも使えます
            （パスワード等は含まれないため）。
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={!!busy || empty} onClick={() => exportPdf()}>
            {busy === 'pdf' ? '生成中…' : 'PDF'}
          </button>
          <button className="btn-secondary" disabled={!!busy || empty} onClick={() => exportCsv()}>
            {busy === 'csv' ? '書き出し中…' : 'CSV'}
          </button>
        </div>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-semibold text-slate-800">CSVを読み戻す（再編集用・§9）</h2>
          <p className="mt-1 text-sm text-slate-600">
            このアプリで書き出した<strong>CSV</strong>を読み込み、編集を再開できます。
            再編集の正本はCSVです（PDFは閲覧・共有用）。読み込むと現在の下書きは置き換わります。
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          disabled={!!busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onReimport(f);
          }}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />
      </section>

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
        書き出したら次は{' '}
        <Link href="/guide" className="font-semibold underline">
          ガイド
        </Link>{' '}
        の手順で印刷・物理保管し、保管場所と開け方を家族に伝えてください。
      </div>
    </div>
  );
}
