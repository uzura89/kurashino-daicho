// レコード操作のヘルパ。フィールド列挙や入力状態の判定をここに集約する。
import type { FieldDef, FieldWidth, LedgerRecord } from './types';
import { getTypeDef } from './schema';

export interface ResolvedField {
  key: string;
  label: string;
  isCustom: boolean;
  width: FieldWidth;
  required: boolean;
  /** 選択式の場合の選択肢（なければ自由入力） */
  options?: string[];
}

/**
 * レコードが表示すべきフィールド一覧を返す。
 * 型の既定フィールド + 自由メモ型などでユーザーが足した custom フィールド。
 */
export function resolveFields(record: LedgerRecord): ResolvedField[] {
  const def = getTypeDef(record.type);
  const base: ResolvedField[] = (def?.fields ?? []).map((f: FieldDef) => ({
    key: f.key,
    label: f.label,
    isCustom: false,
    width: f.width ?? 'md',
    required: !!f.required,
    options: f.options,
  }));
  const custom: ResolvedField[] = Object.entries(record.values)
    .filter(([k]) => k.startsWith('custom:'))
    .map(([k, v]) => ({
      key: k,
      label: v.customLabel?.trim() || '（無題の項目）',
      isCustom: true,
      width: 'full' as FieldWidth,
      // 自由項目は任意（必須にしない）
      required: false,
    }));
  return [...base, ...custom];
}

/** 空のレコード（新規アイテムの雛形）を作る。 */
export function emptyRecord(type: string): LedgerRecord {
  const now = Date.now();
  return { id: newId(), type, values: {}, createdAt: now, updatedAt: now };
}

/** 全フィールドが空ならtrue（保存対象にしない／未入力スロット判定に使う）。 */
export function isRecordEmpty(record: LedgerRecord): boolean {
  return resolveFields(record).every(
    (f) => (record.values[f.key]?.value ?? '').trim() === '',
  );
}

/** 必須フィールドがすべて入力済みならtrue（任意項目は空でも可）。 */
export function isRecordComplete(record: LedgerRecord): boolean {
  return resolveFields(record)
    .filter((f) => f.required)
    .every((f) => (record.values[f.key]?.value ?? '').trim() !== '');
}

/**
 * カテゴリ（型）の入力が完了しているか。
 * 該当なし、または「入力のあるアイテムが1つ以上あり、それぞれ必須項目が埋まっている」。
 * 完全に空のアイテム（未着手スロット）は判定対象から除外する。
 */
export function isCategoryComplete(items: LedgerRecord[], notApplicable: boolean): boolean {
  if (notApplicable) return true;
  const filled = items.filter((r) => !isRecordEmpty(r));
  return filled.length > 0 && filled.every(isRecordComplete);
}

/** レコードの代表的な見出し（一覧表示用）。最初の非空フィールド値を使う。 */
export function recordHeadline(record: LedgerRecord): string {
  for (const f of resolveFields(record)) {
    const val = record.values[f.key]?.value?.trim();
    if (val) return val;
  }
  return '（未入力）';
}

export function newId(): string {
  // crypto.randomUUID はブラウザ・Node18+ で利用可。フォールバック付き。
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
