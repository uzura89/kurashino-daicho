// §7 書き出し（PDF/プレビュー）共通のビューモデル。
// カテゴリ別テーブル: 短い項目を「列」、full 項目・自由項目を行下の「ブロック」にする。
// 値が全件空の列は出さない（ブランク削減）。ただし handwrite 項目は空でも記入欄として残す
// （印刷後に手書きする運用のため）。PDF(lib/pdf.ts)とプレビュー(LedgerPreview)で共有する。
import type { FieldWidth, LedgerRecord } from "./types";
import { RECORD_TYPES, getTypeDef } from "./schema";
import { resolveFields } from "./record";

export interface ViewColumn {
  key: string;
  label: string;
  width: FieldWidth;
  /** 空欄でも印刷に記入欄として出す手書き想定の列 */
  handwrite?: boolean;
}

export interface ViewBlock {
  label: string;
  value: string;
  /** 空欄でも印刷に記入欄として出す手書き想定の項目 */
  handwrite?: boolean;
}

export interface ViewRow {
  id: string;
  /** columns と同じ並びの値（空は ""） */
  cells: string[];
  /** full 項目・自由項目のうち値のあるもの */
  blocks: ViewBlock[];
}

export interface ViewSection {
  type: string;
  label: string;
  /** 短い項目の列（空列は除外済み） */
  columns: ViewColumn[];
  rows: ViewRow[];
}

export interface RowEntry {
  label: string;
  value: string;
  /** 長文（自由記載）の値か。表示時に小さめの文字にする。 */
  small: boolean;
  /** 値が空の手書き記入欄。印刷・表示時に書き込みスペースを確保する。 */
  blank?: boolean;
}

/** 1アイテムの「ラベル・値」ペア列（空セルは除く・列＋ブロック）。 */
export function rowEntries(section: ViewSection, row: ViewRow): RowEntry[] {
  const entries: RowEntry[] = [];
  section.columns.forEach((c, i) => {
    const v = row.cells[i];
    if (v) entries.push({ label: c.label, value: v, small: isLong(v) });
    else if (c.handwrite)
      entries.push({ label: c.label, value: "", small: false, blank: true });
  });
  // ブロック（full 項目・自由項目）は長文扱いで小さめに。空の手書き欄は記入スペースにする。
  for (const b of row.blocks)
    entries.push(
      b.value
        ? { label: b.label, value: b.value, small: true }
        : { label: b.label, value: "", small: false, blank: true },
    );
  return entries;
}

/** 長文判定（折り返し・改行を含む値は小さめ表示にする）。 */
function isLong(v: string): boolean {
  return v.length > 32 || v.includes("\n");
}

/** ブロック行のラベルから末尾の入力ヒント「（… 等）」を落として簡潔にする。 */
function cleanBlockLabel(label: string): string {
  return label.replace(/（[^（）]*）\s*$/, "").trim() || label;
}

function hasAnyValue(rec: LedgerRecord): boolean {
  return resolveFields(rec).some(
    (f) => (rec.values[f.key]?.value?.trim() ?? "") !== "",
  );
}

/** 台帳を型ごとのテーブルセクションに変換する。 */
export function buildLedgerView(records: LedgerRecord[]): ViewSection[] {
  const typeOrder = RECORD_TYPES.map((t) => t.type);
  const byType = new Map<string, LedgerRecord[]>();
  for (const rec of records) {
    if (!hasAnyValue(rec)) continue;
    const list = byType.get(rec.type);
    if (list) list.push(rec);
    else byType.set(rec.type, [rec]);
  }

  const types = [...byType.keys()].sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b),
  );

  const sections: ViewSection[] = [];
  for (const type of types) {
    const recs = byType.get(type)!;
    const def = getTypeDef(type);
    const defFields = def?.fields ?? [];

    // 短い項目を列候補に。値が1件でもある列だけ残す（全件空の列は出さない）。
    // ただし手書き想定の列は空でも記入欄として残す。
    const columns: ViewColumn[] = defFields
      .filter((f) => (f.width ?? "md") !== "full")
      .filter(
        (f) =>
          f.handwrite ||
          recs.some((r) => (r.values[f.key]?.value?.trim() ?? "") !== ""),
      )
      .map((f) => ({
        key: f.key,
        label: f.label,
        width: (f.width ?? "md") as FieldWidth,
        handwrite: f.handwrite,
      }));
    const colKeys = new Set(columns.map((c) => c.key));

    const rows: ViewRow[] = recs.map((rec) => {
      const cells = columns.map(
        (c) => rec.values[c.key]?.value?.trim() ?? "",
      );
      // full 項目・自由項目（列に出していないもの）で値のあるものをブロックに
      const blocks: ViewBlock[] = resolveFields(rec)
        .filter((f) => !colKeys.has(f.key))
        .filter((f) => f.width === "full" || f.isCustom)
        .map((f) => ({
          label: cleanBlockLabel(f.label),
          value: rec.values[f.key]?.value?.trim() ?? "",
          handwrite: f.handwrite,
        }))
        .filter((b) => b.value !== "" || b.handwrite);
      return { id: rec.id, cells, blocks };
    });

    sections.push({ type, label: def?.label ?? type, columns, rows });
  }
  return sections;
}
