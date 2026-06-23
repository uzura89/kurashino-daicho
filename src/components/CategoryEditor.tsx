import RecordEditor from './RecordEditor';
import type { LedgerRecord, RecordTypeDef } from '@/lib/types';
import { isCategoryComplete, isRecordEmpty } from '@/lib/record';

/**
 * 1カテゴリ（型）のフォーム。
 * - 複数アイテム（レコード）を縦に並べ、「アイテムを追加」で増やせる
 * - 「該当なし」トグルでフォーム全体を無効化（このカテゴリは入力不要扱い）
 * - 最小化（開閉）状態は親が制御する（全展開／全最小化に対応するため）
 */
export default function CategoryEditor({
  def,
  items,
  notApplicable,
  collapsed,
  onChangeItem,
  onAddItem,
  onRemoveItem,
  onToggleNotApplicable,
  onToggleCollapse,
}: {
  def: RecordTypeDef;
  items: LedgerRecord[];
  notApplicable: boolean;
  collapsed: boolean;
  onChangeItem: (updated: LedgerRecord) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onToggleNotApplicable: () => void;
  onToggleCollapse: () => void;
}) {
  // 入力完了 = 該当なし or（入力のあるアイテムが必須項目を満たしている）
  const complete = isCategoryComplete(items, notApplicable);
  // 入力済みアイテム数（空のスロットは数えない）
  const filledCount = items.filter((r) => !isRecordEmpty(r)).length;
  const summary = notApplicable ? '該当なし' : `${filledCount}件`;

  return (
    <section className="space-y-2">
      {/* カテゴリの見出し行はカードの外（上）に置き、カードの区別をつけやすくする */}
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex min-w-0 items-center gap-2 text-left"
          aria-expanded={!collapsed}
          title={collapsed ? '開く' : '最小化'}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-sm font-bold leading-none text-slate-600">
            {collapsed ? '+' : '−'}
          </span>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            {def.label}
            {!complete && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                未入力
              </span>
            )}
            {complete && !notApplicable && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                入力済み
              </span>
            )}
          </h3>
          <span className="shrink-0 text-xs text-slate-400">{summary}</span>
        </button>
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={notApplicable}
            onChange={onToggleNotApplicable}
            className="accent-slate-700"
          />
          該当なし
        </label>
      </div>

      {!collapsed && (
        <div className="card space-y-2">
          {def.description && (
            <p className="text-xs leading-relaxed text-slate-500">{def.description}</p>
          )}
          <div className="space-y-2">
            {items.map((rec, i) => (
              <RecordEditor
                key={rec.id}
                record={rec}
                index={i}
                onChange={onChangeItem}
                onDelete={() => onRemoveItem(rec.id)}
                disabled={notApplicable}
              />
            ))}
          </div>

          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={onAddItem}
            disabled={notApplicable}
          >
            ＋ アイテムを追加
          </button>
        </div>
      )}
    </section>
  );
}
