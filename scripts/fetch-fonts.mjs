// BIZ UDPMincho (400/700) を Google Fonts からダウンロードしてセルフホスト用に変換する。
// - public/fonts/bizudpmincho/*.woff2 に保存
// - src/styles/fonts.css を生成（unicode-range サブセット構造は維持）
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const APP = new URL("..", import.meta.url).pathname;
const FONT_DIR = path.join(APP, "public", "fonts", "bizudpmincho");
const CSS_OUT = path.join(APP, "src", "styles", "fonts.css");
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=BIZ+UDPMincho:wght@400;700&display=swap";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

fs.mkdirSync(FONT_DIR, { recursive: true });

const css = await (await fetch(CSS_URL, { headers: { "user-agent": UA } })).text();

// @font-face ブロックごとに weight と URL を取り、ローカル名に書き換える
const blocks = css.match(/@font-face\s*{[^}]*}/g);
if (!blocks || blocks.length < 2) throw new Error("unexpected css: " + css.slice(0, 200));

const downloads = [];
const seen = new Set();
let outCss = `/* BIZ UDPMincho ${blocks.length} subsets — self-hosted copy of Google Fonts css2 output.\n   再生成: node scripts/fetch-fonts.mjs */\n`;

for (const block of blocks) {
  const weight = block.match(/font-weight:\s*(\d+)/)[1];
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
  const m = url.match(/\.(\d+)\.woff2$/);
  // 連番なしのサブセット（latin 等）は URL の md5 先頭8桁で区別する
  const idx = m ? m[1] : crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
  const local = `bizudpmincho-${weight}.${idx}.woff2`;
  if (!seen.has(local)) {
    seen.add(local);
    downloads.push({ url, local });
  }
  outCss += block.replace(url, `/fonts/bizudpmincho/${local}`) + "\n";
}

console.log(`css blocks: ${blocks.length}, files to download: ${downloads.length}`);

// 8並列でダウンロード
let done = 0;
async function worker(queue) {
  for (;;) {
    const job = queue.pop();
    if (!job) return;
    const res = await fetch(job.url, { headers: { "user-agent": UA } });
    if (!res.ok) throw new Error(`${res.status} ${job.url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(FONT_DIR, job.local), buf);
    done++;
    if (done % 50 === 0) console.log(`${done}/${downloads.length}`);
  }
}
const queue = [...downloads];
await Promise.all(Array.from({ length: 8 }, () => worker(queue)));
console.log(`downloaded ${done} files`);

fs.writeFileSync(CSS_OUT, outCss);
console.log("wrote", CSS_OUT);
