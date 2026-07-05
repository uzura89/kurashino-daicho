import type { FieldWidth, LedgerRecord } from '@/lib/types';
import { getTypeDef } from '@/lib/schema';
import { resolveFields, newId } from '@/lib/record';

// 高さのある複数行入力にしたいフィールド（メモ・本文など）
const MULTILINE = /memo|body|note|holdings|subscription|method|location|legacy|beneficiary/;

// PCレイアウト（12カラムグリッド）での相対幅 → col-span クラス。
// モバイルは grid-cols-1 のため、いずれも自動で全幅になる。
const SPAN_CLASS: Record<FieldWidth, string> = {
  xs: 'sm:col-span-2',
  sm: 'sm:col-span-3',
  md: 'sm:col-span-4',
  lg: 'sm:col-span-6',
  full: 'col-span-full',
};


/**
 * カテゴリ内の1アイテム（1レコード）のエディタ。
 * フィールドは2カラムのグリッドで横に並べ、高さを節約する。
 */
export default function RecordEditor({
  record,
  index,
  onChange,
  onDelete,
  disabled = false,
}: {
  record: LedgerRecord;
  index: number;
  onChange: (updated: LedgerRecord) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const def = getTypeDef(record.type);
  const fields = resolveFields(record);

  const patchValue = (key: string, patch: Partial<LedgerRecord['values'][string]>) => {
    const prev = record.values[key] ?? { value: '' };
    onChange({
      ...record,
      values: { ...record.values, [key]: { ...prev, ...patch } },
      updatedAt: Date.now(),
    });
  };

  const addCustomField = () => {
    const key = 'custom:' + newId();
    onChange({
      ...record,
      values: {
        ...record.values,
        [key]: { value: '', customLabel: '' },
      },
      updatedAt: Date.now(),
    });
  };

  const removeField = (key: string) => {
    const next = { ...record.values };
    delete next[key];
    onChange({ ...record, values: next, updatedAt: Date.now() });
  };

  return (
    <div className={`rounded-md border border-slate-200 p-3 ${disabled ? 'opacity-50' : ''}`}>
      {!def?.singleEntry && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">アイテム {index + 1}</span>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
            onClick={onDelete}
            disabled={disabled}
          >
            削除
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-12">
        {fields.map((f) => {
          const fv = record.values[f.key] ?? { value: '' };
          const multiline = MULTILINE.test(f.key) || f.isCustom;
          const spanClass = multiline ? SPAN_CLASS.full : SPAN_CLASS[f.width];
          return (
            <div key={f.key} className={spanClass}>
              <div className="mb-1 flex items-center justify-between gap-2">
                {f.isCustom ? (
                  <input
                    className="input max-w-[60%] text-xs font-medium"
                    placeholder="項目名（例: 貸金庫の場所）"
                    value={fv.customLabel ?? ''}
                    disabled={disabled}
                    onChange={(e) => patchValue(f.key, { customLabel: e.target.value })}
                  />
                ) : (
                  <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-slate-700">
                    <span className="truncate">{f.label}</span>
                    {f.required && <span className="text-red-500">*</span>}
                  </span>
                )}
                {f.isCustom && (
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
                    onClick={() => removeField(f.key)}
                    disabled={disabled}
                  >
                    ×
                  </button>
                )}
              </div>
              {f.options ? (
                <select
                  className="input"
                  value={fv.value}
                  disabled={disabled}
                  onChange={(e) => patchValue(f.key, { value: e.target.value })}
                >
                  <option value="">選択してください</option>
                  {/* 既存の値が選択肢に無い場合（旧データ等）も表示できるよう補う */}
                  {fv.value && !f.options.includes(fv.value) && (
                    <option value={fv.value}>{fv.value}</option>
                  )}
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : multiline ? (
                <textarea
                  className="input min-h-[2.5rem]"
                  rows={2}
                  value={fv.value}
                  disabled={disabled}
                  placeholder={f.handwrite ? '印刷後に手書きでも記入できます' : undefined}
                  onChange={(e) => patchValue(f.key, { value: e.target.value })}
                />
              ) : (
                <input
                  className="input"
                  value={fv.value}
                  disabled={disabled}
                  placeholder={f.handwrite ? '印刷後に手書きでも記入できます' : undefined}
                  onChange={(e) => patchValue(f.key, { value: e.target.value })}
                />
              )}
            </div>
          );
        })}
      </div>

      {def?.allowCustomFields && (
        <button
          type="button"
          className="btn-secondary mt-2 text-xs"
          onClick={addCustomField}
          disabled={disabled}
        >
          ＋ 項目を追加
        </button>
      )}
    </div>
  );
}
