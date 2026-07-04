// IndexedDB は「揮発しうる下書き」専用（§1-6, §11）。load-bearing にしない。
// 正本はあくまでエクスポート（印刷した紙）＋ 物理保管。
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LedgerRecord } from './types';
import { setDirtyFlag } from './dirtyStore';

interface ShukatsuDB extends DBSchema {
  records: {
    key: string;
    value: LedgerRecord;
  };
  kv: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'shukatsu-draft';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ShukatsuDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB はブラウザでのみ利用できます');
  }
  if (!dbPromise) {
    dbPromise = openDB<ShukatsuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('records')) {
          db.createObjectStore('records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      },
    });
  }
  return dbPromise;
}

// --- records ---

export async function getAllRecords(): Promise<LedgerRecord[]> {
  const db = await getDB();
  const all = await db.getAll('records');
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function putRecord(record: LedgerRecord): Promise<void> {
  const db = await getDB();
  await db.put('records', record);
  await markDirty();
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('records', id);
  await markDirty();
}

export async function replaceAllRecords(records: LedgerRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('records', 'readwrite');
  await tx.store.clear();
  for (const r of records) await tx.store.put(r);
  await tx.done;
  await markDirty();
}

// --- kv（カテゴリの該当なしフラグ / dirtyフラグ）---

const KEY_DIRTY = 'dirtySince';
const KEY_CATEGORY_NA = 'categoryNotApplicable';

async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('kv', key)) as T | undefined;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('kv', value, key);
}

/** カテゴリ（型）ごとの「該当なし」フラグ。typeKey -> true。 */
export async function getCategoryNotApplicable(): Promise<Record<string, boolean>> {
  return (await kvGet<Record<string, boolean>>(KEY_CATEGORY_NA)) ?? {};
}

export async function setCategoryNotApplicable(map: Record<string, boolean>): Promise<void> {
  await kvSet(KEY_CATEGORY_NA, map);
  await markDirty();
}

// --- 下書きの「未保存（＝未エクスポート）」追跡（§11 離脱警告用）---

export async function markDirty(): Promise<void> {
  setDirtyFlag(true);
  await kvSet(KEY_DIRTY, Date.now());
}

export async function clearDirty(): Promise<void> {
  setDirtyFlag(false);
  await kvSet(KEY_DIRTY, 0);
}

export async function isDirty(): Promise<boolean> {
  const v = (await kvGet<number>(KEY_DIRTY)) ?? 0;
  return v > 0;
}

/** 起動時にインメモリ dirty ミラーを IndexedDB の値で初期化する。 */
export async function hydrateDirty(): Promise<void> {
  setDirtyFlag(await isDirty());
}

export async function wipeAll(): Promise<void> {
  const db = await getDB();
  await db.clear('records');
  await db.clear('kv');
}

// CategoryEditor の折りたたみ状態（localStorage）のキー接頭辞。ledger / settings と共有。
export const COLLAPSE_PREFIX = 'ledger.collapsed.';

/**
 * この端末の下書きデータ一式を削除する
 * （IndexedDB の全レコード・kv、localStorage の折りたたみ状態）。
 */
export async function wipeAllLocalData(): Promise<void> {
  await wipeAll();
  await clearDirty();
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(COLLAPSE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* localStorage 不可の環境では何もしない */
  }
}
