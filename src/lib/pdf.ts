// §7 PDF生成（ブラウザ内、pdf-lib）。
// 日本語フォント（Noto Sans JP）を同梱して埋め込む。標準フォントは日本語不可。
import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { LedgerRecord } from './types';
import { RECORD_TYPES, getTypeDef } from './schema';
import { resolveFields } from './record';

const FONT_URL = '/fonts/NotoSansJP-Regular.ttf';
const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const COLOR_INK = rgb(0.12, 0.16, 0.2);
const COLOR_MUTED = rgb(0.45, 0.5, 0.55);
const COLOR_RULE = rgb(0.85, 0.87, 0.89);

let cachedFontBytes: ArrayBuffer | null = null;

async function loadFontBytes(): Promise<ArrayBuffer> {
  if (cachedFontBytes) return cachedFontBytes;
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error('日本語フォントの読み込みに失敗しました');
  cachedFontBytes = await res.arrayBuffer();
  return cachedFontBytes;
}

/** 文字単位の折り返し（日本語対応）。半角スペースは優先的に改行位置にする。 */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split('\n')) {
    let current = '';
    for (const ch of rawLine) {
      const test = current + ch;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current !== '') {
        lines.push(current);
        current = ch === ' ' ? '' : ch;
      } else {
        current = test;
      }
    }
    lines.push(current);
  }
  return lines;
}

interface Cursor {
  page: PDFPage;
  y: number;
}

export interface PdfOptions {
  /** 文書タイトル */
  title: string;
}

export async function generatePdf(
  records: LedgerRecord[],
  opts: PdfOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  // フォントは CFF アウトラインの OpenType（Noto Sans JP）。pdf-lib の subset 埋め込みは
  // CFF/CJK で日本語グリフが欠落する不具合があるため、サブセットせず全体を埋め込む。
  const font = await doc.embedFont(await loadFontBytes(), { subset: false });

  const contentWidth = A4.width - MARGIN * 2;
  let cur: Cursor = { page: doc.addPage([A4.width, A4.height]), y: A4.height - MARGIN };

  const newPage = () => {
    cur = { page: doc.addPage([A4.width, A4.height]), y: A4.height - MARGIN };
  };
  const ensure = (needed: number) => {
    if (cur.y - needed < MARGIN) newPage();
  };
  const drawLines = (
    text: string,
    size: number,
    color = COLOR_INK,
    indent = 0,
    gap = 4,
  ) => {
    const lines = wrapText(text, font, size, contentWidth - indent);
    for (const line of lines) {
      ensure(size + gap);
      cur.page.drawText(line, {
        x: MARGIN + indent,
        y: cur.y - size,
        size,
        font,
        color,
      });
      cur.y -= size + gap;
    }
  };

  // --- 表紙的なヘッダ ---
  drawLines(opts.title, 18, COLOR_INK, 0, 8);
  drawLines(
    '台帳（地図情報）— どこに何があるかの一覧。パスワード等の秘匿情報は含みません。',
    10,
    COLOR_MUTED,
    0,
    14,
  );

  // --- 型ごとにセクション ---
  const typeOrder = RECORD_TYPES.map((t) => t.type);
  const sorted = [...records].sort(
    (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type),
  );

  let printedAny = false;
  let lastType = '';
  for (const rec of sorted) {
    // このレコードで出力対象になるフィールド（値のあるもの）を先に集める
    const fields = resolveFields(rec).filter(
      (f) => (rec.values[f.key]?.value?.trim() ?? '') !== '',
    );
    if (fields.length === 0) continue;
    printedAny = true;

    // 型見出し
    if (rec.type !== lastType) {
      ensure(40);
      cur.y -= 10;
      drawLines(getTypeDef(rec.type)?.label ?? rec.type, 14, COLOR_INK, 0, 6);
      // 区切り線
      ensure(8);
      cur.page.drawLine({
        start: { x: MARGIN, y: cur.y },
        end: { x: MARGIN + contentWidth, y: cur.y },
        thickness: 0.5,
        color: COLOR_RULE,
      });
      cur.y -= 8;
      lastType = rec.type;
    }

    // レコード見出し（最初のフィールド値）
    const headline = rec.values[fields[0].key]?.value?.trim() || '（未入力）';
    drawLines('■ ' + headline, 11.5, COLOR_INK, 0, 4);

    for (const f of fields) {
      const val = rec.values[f.key]?.value?.trim() ?? '';
      drawLines(f.label, 9, COLOR_MUTED, 12, 2);
      drawLines(val || '—', 10.5, COLOR_INK, 12, 6);
    }
    cur.y -= 6;
  }

  if (!printedAny) {
    drawLines('（出力対象のレコードがありません）', 11, COLOR_MUTED, 0, 6);
  }

  // フッタ的注記
  ensure(30);
  cur.y -= 10;
  drawLines(
    '※このPDFは閲覧・共有用です。再編集には同時に書き出したCSVを正本として使ってください（§9）。',
    8.5,
    COLOR_MUTED,
    0,
    4,
  );

  return doc.save();
}
