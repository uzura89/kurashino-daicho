import { useMemo } from "react";
import { buildLedgerView, rowEntries } from "@/lib/ledgerView";
import type { LedgerRecord } from "@/lib/types";

const DOC_TITLE = "資産・契約台帳";

/** 書き出し内容（PDF/印刷）のプレビュー。カテゴリ別テーブル。値の入った項目だけを出す。 */
export default function LedgerPreview({ records }: { records: LedgerRecord[] }) {
  const sections = useMemo(() => buildLedgerView(records), [records]);

  if (sections.length === 0) return null;

  return (
    <article className="mx-auto max-w-3xl rounded-xl border border-slate-200/70 bg-white p-6 shadow-paper sm:p-10 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <h2 className="font-brand text-2xl tracking-wider text-ink">
        {DOC_TITLE}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        台帳（地図情報）— どこに何があるかの一覧。パスワード等の秘匿情報は含みません。
      </p>

      <div className="mt-6 space-y-7">
        {sections.map((section) => (
          <section key={section.type} className="break-inside-avoid">
            <h3 className="border-b border-slate-400 pb-1 font-brand text-base tracking-wider text-ink">
              {section.label}
            </h3>

            <div className="mt-2 space-y-3">
              {section.rows.map((row) => {
                const entries = rowEntries(section, row);
                if (entries.length === 0) return null;
                return (
                  <table
                    key={row.id}
                    className="w-full border-collapse border border-slate-200 text-sm break-inside-avoid"
                  >
                    <tbody>
                      {entries.map((e, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 align-top last:border-0"
                        >
                          <th className="w-1/3 whitespace-pre-wrap bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-500">
                            {e.label}
                          </th>
                          <td
                            className={`whitespace-pre-wrap px-3 py-1.5 text-slate-800 ${
                              e.small ? "text-xs leading-relaxed" : "text-sm"
                            }`}
                          >
                            {e.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })}
            </div>

            {/* カテゴリごとの自由記入欄（印刷して書き込む用） */}
            <div className="mt-3 break-inside-avoid">
              <p className="text-xs font-medium text-slate-500">メモ</p>
              <div className="mt-1 h-[72px] rounded border border-slate-200 bg-[repeating-linear-gradient(transparent,transparent_17px,#e2e8f0_18px)]" />
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-500">
        ※このプレビュー（PDF）は閲覧・共有用です。再編集には同時に書き出したCSVを正本として使ってください。
      </p>
    </article>
  );
}
