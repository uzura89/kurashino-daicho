// ブラウザでのファイル保存・読込ユーティリティ。

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 解放は少し遅延させる
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(filename: string, text: string, mime = 'text/csv'): void {
  downloadBlob(filename, new Blob([text], { type: `${mime};charset=utf-8` }));
}

export function downloadBytes(filename: string, bytes: Uint8Array, mime: string): void {
  downloadBlob(filename, new Blob([bytes as BlobPart], { type: mime }));
}

/**
 * §6-2 文字コード対応: UTF-8 で読めなければ Shift_JIS にフォールバック。
 * 日本のカード会社CSVは Shift_JIS が残る。
 */
export async function readTextFileSmart(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  // まず UTF-8（不正バイトで例外を出す fatal モード）
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    // Shift_JIS にフォールバック
    try {
      return new TextDecoder('shift_jis').decode(buf);
    } catch {
      // 最後の手段: 寛容な UTF-8
      return new TextDecoder('utf-8').decode(buf);
    }
  }
}

/** 日付文字列（ファイル名用 YYYYMMDD）。引数で受け取り、副作用を持たせない。 */
export function stampFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
