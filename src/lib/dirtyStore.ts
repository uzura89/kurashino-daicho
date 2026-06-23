// 「未エクスポートの下書きがある」状態のインメモリ・ミラー（§11 離脱警告用）。
// beforeunload は同期的に状態を知る必要があるため、IndexedDB とは別に保持する。

let dirty = false;
const subscribers = new Set<() => void>();

export function getDirtyFlag(): boolean {
  return dirty;
}

export function setDirtyFlag(value: boolean): void {
  if (dirty !== value) {
    dirty = value;
    subscribers.forEach((fn) => fn());
  }
}

export function subscribeDirty(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
