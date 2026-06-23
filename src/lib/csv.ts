// §7 エクスポート / §9 再編集用CSV（正本）。
// 形式は「型・フィールド名・値」の正規化行。record_id を持たせて再インポートで復元可能にする。
// 公開/非公開の区分は廃止（台帳には秘匿情報を保存しない方針）。
import Papa from "papaparse";
import type { LedgerRecord } from "./types";
import { getTypeDef } from "./schema";
import { resolveFields } from "./record";

const HEADER = [
  "record_id",
  "type",
  "type_label",
  "field_key",
  "field_label",
  "value",
  "is_custom",
] as const;

/** 1セルをCSVエスケープ（カンマ・引用符・改行を含む場合は引用） */
function escapeCell(s: string): string {
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** 台帳をCSV文字列にする。空フィールドは出さない。 */
export function recordsToCsv(records: LedgerRecord[]): string {
  const lines: string[] = [HEADER.join(",")];
  for (const rec of records) {
    const typeDef = getTypeDef(rec.type);
    for (const field of resolveFields(rec)) {
      const value = rec.values[field.key]?.value ?? "";
      if (value.trim() === "") continue;
      const row = [
        rec.id,
        rec.type,
        typeDef?.label ?? rec.type,
        field.key,
        field.label,
        value,
        field.isCustom ? "true" : "false",
      ];
      lines.push(row.map((c) => escapeCell(String(c))).join(","));
    }
  }
  // BOM 付きにして Excel での文字化けを防ぐ
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * §9 再編集: 自前エクスポートした完全版CSVを読み戻してレコード配列に復元する。
 * record_id でグループ化し、フィールド値・customLabel を復元する。
 * 旧フォーマット（visibility 列つき）も読めるよう、未知の列は無視する。
 */
export function csvToRecords(csvText: string): LedgerRecord[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const byId = new Map<string, LedgerRecord>();
  const now = Date.now();

  for (const row of parsed.data) {
    const id = (row.record_id || "").trim();
    const type = (row.type || "").trim();
    const fieldKey = (row.field_key || "").trim();
    if (!id || !type || !fieldKey) continue;

    let rec = byId.get(id);
    if (!rec) {
      rec = { id, type, values: {}, createdAt: now, updatedAt: now };
      byId.set(id, rec);
    }

    const isCustom =
      (row.is_custom || "").trim() === "true" || fieldKey.startsWith("custom:");

    rec.values[fieldKey] = {
      value: row.value ?? "",
      ...(isCustom && row.field_label ? { customLabel: row.field_label } : {}),
    };
  }

  return Array.from(byId.values());
}

/** 任意の2次元配列をCSV化（プリセット書き出し等に使う汎用ヘルパ） */
export function arrayToCsv(rows: string[][]): string {
  return (
    "﻿" +
    rows
      .map((r) => r.map((c) => escapeCell(String(c ?? ""))).join(","))
      .join("\r\n") +
    "\r\n"
  );
}
