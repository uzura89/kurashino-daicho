import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CategoryEditor from "@/components/CategoryEditor";
import { RECORD_TYPES } from "@/lib/schema";
import { emptyRecord, isCategoryComplete, isRecordEmpty } from "@/lib/record";
import {
  getAllRecords,
  putRecord,
  deleteRecord,
  getCategoryNotApplicable,
  setCategoryNotApplicable,
  COLLAPSE_PREFIX,
} from "@/lib/db";
import type { LedgerRecord } from "@/lib/types";

type ItemsByType = Record<string, LedgerRecord[]>;

export default function LedgerPage() {
  const [itemsByType, setItemsByType] = useState<ItemsByType>({});
  const [na, setNa] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [recs, naMap] = await Promise.all([
        getAllRecords(),
        getCategoryNotApplicable(),
      ]);
      const byType: ItemsByType = {};
      for (const t of RECORD_TYPES) byType[t.type] = [];
      for (const r of recs) (byType[r.type] ??= []).push(r);
      // 該当なし以外で空のカテゴリには、入力用の空アイテムを1つ用意する
      for (const t of RECORD_TYPES) {
        if (!naMap[t.type] && byType[t.type].length === 0) {
          byType[t.type] = [emptyRecord(t.type)];
        }
      }
      setItemsByType(byType);
      setNa(naMap);
      setLoaded(true);
    })();
  }, []);

  // 折りたたみ状態を localStorage から復元（マウント後＝クライアントで読む）
  useEffect(() => {
    const map: Record<string, boolean> = {};
    try {
      for (const t of RECORD_TYPES) {
        map[t.type] = localStorage.getItem(COLLAPSE_PREFIX + t.type) === "1";
      }
    } catch {
      /* localStorage 不可なら全展開のまま */
    }
    setCollapsed(map);
  }, []);

  const persistCollapse = (type: string, value: boolean) => {
    try {
      localStorage.setItem(COLLAPSE_PREFIX + type, value ? "1" : "0");
    } catch {
      /* 保存できなくても表示は切り替える */
    }
  };

  const toggleCollapse = (type: string) => {
    setCollapsed((prev) => {
      const next = !prev[type];
      persistCollapse(type, next);
      return { ...prev, [type]: next };
    });
  };

  const setAllCollapsed = (value: boolean) => {
    const map: Record<string, boolean> = {};
    for (const t of RECORD_TYPES) {
      map[t.type] = value;
      persistCollapse(t.type, value);
    }
    setCollapsed(map);
  };

  const changeItem = async (updated: LedgerRecord) => {
    setItemsByType((prev) => ({
      ...prev,
      [updated.type]: (prev[updated.type] ?? []).map((r) =>
        r.id === updated.id ? updated : r,
      ),
    }));
    // 空アイテムは保存しない（書き出しを汚さない）。空になったら下書きから削除。
    if (isRecordEmpty(updated)) {
      await deleteRecord(updated.id);
    } else {
      await putRecord({ ...updated, updatedAt: Date.now() });
    }
    setSavedAt(Date.now());
  };

  const addItem = (type: string) => {
    setItemsByType((prev) => ({
      ...prev,
      [type]: [...(prev[type] ?? []), emptyRecord(type)],
    }));
  };

  const removeItem = async (type: string, id: string) => {
    setItemsByType((prev) => {
      let list = (prev[type] ?? []).filter((r) => r.id !== id);
      // 入力欄が無くなったら空アイテムを1つ残す（該当なしのときは不要）
      if (list.length === 0 && !na[type]) list = [emptyRecord(type)];
      return { ...prev, [type]: list };
    });
    await deleteRecord(id);
    setSavedAt(Date.now());
  };

  const toggleNotApplicable = async (type: string) => {
    const next = !na[type];
    const nextNa = { ...na, [type]: next };
    setNa(nextNa);
    await setCategoryNotApplicable(nextNa);

    const items = itemsByType[type] ?? [];
    if (next) {
      // 該当なしON: 保存済みのレコードは下書きから外す（書き出しに出さない）。
      // メモリ上には残すので、OFFに戻せば復元できる。
      for (const r of items) if (!isRecordEmpty(r)) await deleteRecord(r.id);
    } else {
      // 該当なしOFF: 空なら入力欄を1つ用意し、入力済みは保存し直す。
      if (items.length === 0) {
        setItemsByType((prev) => ({ ...prev, [type]: [emptyRecord(type)] }));
      } else {
        for (const r of items) if (!isRecordEmpty(r)) await putRecord(r);
      }
    }
    setSavedAt(Date.now());
  };

  const incompleteTypes = useMemo(
    () =>
      RECORD_TYPES.filter(
        (t) => !isCategoryComplete(itemsByType[t.type] ?? [], !!na[t.type]),
      ),
    [itemsByType, na],
  );

  const totalItems = useMemo(
    () =>
      RECORD_TYPES.reduce(
        (n, t) =>
          n +
          (na[t.type]
            ? 0
            : (itemsByType[t.type] ?? []).filter((r) => !isRecordEmpty(r))
                .length),
        0,
      ),
    [itemsByType, na],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">台帳作成</h1>
          <p className="mt-1 text-sm text-slate-600">
            各カテゴリの<span className="text-red-500">*</span>
            （必須）を入力するか「該当なし」を選んでください。
            必須以外の項目は空欄でも構いません。
            入力は自動的に下書き保存されます。
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          {savedAt ? "下書きに保存しました" : "　"}
          <div className="mt-1">
            <Link href="/export" className="btn-secondary">
              書き出しに進む →
            </Link>
          </div>
        </div>
      </header>

      {loaded && incompleteTypes.length > 0 && (
        <div className="sticky top-2 z-10 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">
            未入力のカテゴリがあります（{incompleteTypes.length} 件）
          </p>
          <p className="mt-1 text-xs">
            各カテゴリの必須項目（<span className="text-red-500">*</span>
            ）を入力するか、「該当なし」を選択してください：{" "}
            {incompleteTypes.map((t) => t.label).join("、")}
          </p>
        </div>
      )}

      {loaded && incompleteTypes.length === 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          すべてのカテゴリが入力済み、または「該当なし」になっています。{" "}
          <Link href="/export" className="font-semibold underline">
            書き出しへ
          </Link>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setAllCollapsed(false)}
        >
          すべて展開
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setAllCollapsed(true)}
        >
          すべて最小化
        </button>
      </div>

      <div className="space-y-4">
        {RECORD_TYPES.map((def) => (
          <CategoryEditor
            key={def.type}
            def={def}
            items={itemsByType[def.type] ?? []}
            notApplicable={!!na[def.type]}
            collapsed={!!collapsed[def.type]}
            onChangeItem={changeItem}
            onAddItem={() => addItem(def.type)}
            onRemoveItem={(id) => removeItem(def.type, id)}
            onToggleNotApplicable={() => toggleNotApplicable(def.type)}
            onToggleCollapse={() => toggleCollapse(def.type)}
          />
        ))}
      </div>
    </div>
  );
}
