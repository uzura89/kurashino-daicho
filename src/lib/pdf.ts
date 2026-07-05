// §7 PDF生成（ブラウザ内、pdf-lib）。
// 日本語フォント（Noto Sans JP）を同梱して埋め込む。標準フォントは日本語不可。
// レイアウトはカテゴリ別テーブル: 短い項目を列、full/自由項目を行下のブロックにする。
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { LedgerRecord } from "./types";
import { buildLedgerView, rowEntries, type RowEntry } from "./ledgerView";

const FONT_URL = "/fonts/NotoSansJP-Regular.ttf";
const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const COLOR_INK = rgb(0.12, 0.16, 0.2);
const COLOR_MUTED = rgb(0.45, 0.5, 0.55);
const COLOR_RULE = rgb(0.85, 0.87, 0.89);
const COLOR_LBLBG = rgb(0.96, 0.97, 0.98);

const CARD_LABELW = 120; // ラベル列の幅

const CELL_SIZE = 9.5; // 値・ラベルの文字サイズ
const CELL_LH = CELL_SIZE + 3; // 行高
const SM_SIZE = 8; // 長文（自由記載）の値の文字サイズ
const SM_LH = SM_SIZE + 2.5;

const MEMO_LINES = 4; // カテゴリ末尾の自由記入欄の罫線本数
const MEMO_LH = 18; // 記入欄の行間（手書き用に広め）
const BLANK_ROWH = 24; // 空欄の手書き記入欄（handwrite項目）の行高

let cachedFontBytes: ArrayBuffer | null = null;

async function loadFontBytes(): Promise<ArrayBuffer> {
  if (cachedFontBytes) return cachedFontBytes;
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error("日本語フォントの読み込みに失敗しました");
  cachedFontBytes = await res.arrayBuffer();
  return cachedFontBytes;
}

/** 文字単位の折り返し（日本語対応）。半角スペースは優先的に改行位置にする。 */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    let current = "";
    for (const ch of rawLine) {
      const test = current + ch;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current !== "") {
        lines.push(current);
        current = ch === " " ? "" : ch;
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
  let cur: Cursor = {
    page: doc.addPage([A4.width, A4.height]),
    y: A4.height - MARGIN,
  };

  const newPage = () => {
    cur = { page: doc.addPage([A4.width, A4.height]), y: A4.height - MARGIN };
  };
  const ensure = (needed: number) => {
    if (cur.y - needed < MARGIN) newPage();
  };
  // 流し込みテキスト（タイトル・注記・ブロック行）。必要なら改ページする。
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
    "台帳（地図情報）— どこに何があるかの一覧。パスワード等の秘匿情報は含みません。",
    10,
    COLOR_MUTED,
    0,
    14,
  );

  const sections = buildLedgerView(records);

  // 1アイテムを縦2列（ラベル／値）の表として描く。長文の値は小さめの文字で。
  const drawCardItem = (entries: RowEntry[]) => {
    if (entries.length === 0) return;
    const valW = contentWidth - CARD_LABELW;
    const wrapped = entries.map((e) => {
      const vs = e.small ? SM_SIZE : CELL_SIZE;
      const vlh = e.small ? SM_LH : CELL_LH;
      return {
        kl: wrapText(e.label, font, CELL_SIZE, CARD_LABELW - 8),
        vl: wrapText(e.value, font, vs, valW - 8),
        vs,
        vlh,
        blank: !!e.blank,
      };
    });
    // 空の手書き記入欄は、書き込めるだけの高さを確保する
    const rowH = wrapped.map((w) =>
      Math.max(
        w.kl.length * CELL_LH,
        w.vl.length * w.vlh,
        w.blank ? BLANK_ROWH : 0,
      ) + 4,
    );
    const tableH = rowH.reduce((a, b) => a + b, 0);
    ensure(tableH + 10);

    const top = cur.y;
    let yy = cur.y;
    wrapped.forEach((w, idx) => {
      const h = rowH[idx];
      cur.page.drawRectangle({
        x: MARGIN,
        y: yy - h,
        width: CARD_LABELW,
        height: h,
        color: COLOR_LBLBG,
      });
      w.kl.forEach((l, li) =>
        cur.page.drawText(l, {
          x: MARGIN + 6,
          y: yy - CELL_SIZE - 3 - li * CELL_LH,
          size: CELL_SIZE,
          font,
          color: COLOR_MUTED,
        }),
      );
      w.vl.forEach((l, li) =>
        cur.page.drawText(l, {
          x: MARGIN + CARD_LABELW + 6,
          y: yy - w.vs - 3 - li * w.vlh,
          size: w.vs,
          font,
          color: COLOR_INK,
        }),
      );
      yy -= h;
      cur.page.drawLine({
        start: { x: MARGIN, y: yy },
        end: { x: MARGIN + contentWidth, y: yy },
        thickness: 0.3,
        color: COLOR_RULE,
      });
    });
    cur.page.drawRectangle({
      x: MARGIN,
      y: yy,
      width: contentWidth,
      height: top - yy,
      borderColor: COLOR_RULE,
      borderWidth: 0.6,
    });
    cur.page.drawLine({
      start: { x: MARGIN + CARD_LABELW, y: top },
      end: { x: MARGIN + CARD_LABELW, y: yy },
      thickness: 0.3,
      color: COLOR_RULE,
    });
    cur.y = yy - 8;
  };

  // カテゴリ末尾の自由記入欄（手書き用の空白＋罫線）。印刷して書き込む前提。
  const drawMemo = () => {
    const boxH = MEMO_LINES * MEMO_LH;
    ensure(boxH + CELL_SIZE + 12);
    cur.y -= 4;
    cur.page.drawText("メモ", {
      x: MARGIN,
      y: cur.y - CELL_SIZE,
      size: CELL_SIZE,
      font,
      color: COLOR_MUTED,
    });
    cur.y -= CELL_SIZE + 4;
    const top = cur.y;
    for (let i = 1; i <= MEMO_LINES; i++) {
      const ly = top - i * MEMO_LH;
      cur.page.drawLine({
        start: { x: MARGIN + 8, y: ly },
        end: { x: MARGIN + contentWidth - 8, y: ly },
        thickness: 0.3,
        color: COLOR_RULE,
      });
    }
    cur.page.drawRectangle({
      x: MARGIN,
      y: top - boxH,
      width: contentWidth,
      height: boxH,
      borderColor: COLOR_RULE,
      borderWidth: 0.6,
    });
    cur.y = top - boxH - 8;
  };

  let printedAny = false;
  for (const section of sections) {
    if (section.rows.length === 0) continue;
    printedAny = true;

    // セクション見出し（次のヘッダ/行と離れないよう確保）
    ensure(46);
    cur.y -= 10;
    drawLines(section.label, 13, COLOR_INK, 0, 6);
    cur.page.drawLine({
      start: { x: MARGIN, y: cur.y + 2 },
      end: { x: MARGIN + contentWidth, y: cur.y + 2 },
      thickness: 0.8,
      color: COLOR_RULE,
    });
    cur.y -= 2;

    // 全カテゴリ統一: 1アイテム=縦2列（ラベル／値）の表
    for (const row of section.rows) {
      drawCardItem(rowEntries(section, row));
    }

    // カテゴリごとの自由記入欄
    drawMemo();
  }

  if (!printedAny) {
    drawLines("（出力対象のレコードがありません）", 11, COLOR_MUTED, 0, 6);
  }

  // フッタ的注記
  ensure(30);
  cur.y -= 10;
  drawLines(
    "※このPDFは閲覧・共有用です。再編集には同時に書き出したCSVを正本として使ってください。",
    8.5,
    COLOR_MUTED,
    0,
    4,
  );

  return doc.save();
}
