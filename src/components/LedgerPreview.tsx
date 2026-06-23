import { useMemo } from "react";
import { RECORD_TYPES, getTypeDef } from "@/lib/schema";
import { resolveFields } from "@/lib/record";
import type { LedgerRecord } from "@/lib/types";

const DOC_TITLE = "資産・契約台帳";

interface RenderField {
  label: string;
  value: string;
}

interface RenderRecord {
  id: string;
  headline: string;
  fields: RenderField[];
}

interface RenderSection {
  type: string;
  label: string;
  records: RenderRecord[];
}

/** PDF出力（lib/pdf.ts）と同じロジックで、値のあるフィールドだけを型ごとにまとめる。 */
function buildSections(records: LedgerRecord[]): RenderSection[] {
  const typeOrder = RECORD_TYPES.map((t) => t.type);
  const sorted = [...records].sort(
    (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type),
  );

  const sections: RenderSection[] = [];
  let current: RenderSection | null = null;

  for (const rec of sorted) {
    const fields = resolveFields(rec)
      .filter((f) => (rec.values[f.key]?.value?.trim() ?? "") !== "")
      .map((f) => ({
        label: f.label,
        value: rec.values[f.key]?.value?.trim() ?? "",
      }));
    if (fields.length === 0) continue;

    if (!current || current.type !== rec.type) {
      current = {
        type: rec.type,
        label: getTypeDef(rec.type)?.label ?? rec.type,
        records: [],
      };
      sections.push(current);
    }
    current.records.push({
      id: rec.id,
      headline: fields[0].value || "（未入力）",
      fields,
    });
  }
  return sections;
}

/** 書き出し内容（PDF/印刷）のプレビューを表示する。値の入った項目だけを出す。 */
export default function LedgerPreview({ records }: { records: LedgerRecord[] }) {
  const sections = useMemo(() => buildSections(records), [records]);

  if (sections.length === 0) return null;

  return (
    <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <h2 className="font-brand text-2xl font-bold text-slate-900">
        {DOC_TITLE}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        台帳（地図情報）— どこに何があるかの一覧。パスワード等の秘匿情報は含みません。
      </p>

      <div className="mt-6 space-y-8">
        {sections.map((section) => (
          <section key={section.type}>
            <h3 className="border-b border-slate-300 pb-1 text-base font-bold text-slate-800">
              {section.label}
            </h3>
            <div className="mt-3 space-y-5">
              {section.records.map((rec) => (
                <div key={rec.id} className="break-inside-avoid">
                  <p className="font-semibold text-slate-900">
                    ■ {rec.headline}
                  </p>
                  <dl className="mt-1 space-y-1.5 pl-4">
                    {rec.fields.map((f, i) => (
                      <div key={i}>
                        <dt className="text-xs text-slate-500">{f.label}</dt>
                        <dd className="whitespace-pre-wrap text-sm text-slate-800">
                          {f.value || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
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
