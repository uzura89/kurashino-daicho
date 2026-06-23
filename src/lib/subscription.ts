// §6 サブスク取り込み: カード明細の定期課金をブラウザ内で検出する。
// LLM・外部API・サーバーは一切使わない。構造化データの集計で完結する。

export interface Transaction {
  date: Date;
  amount: number;
  description: string;
}

export type Cadence = 'monthly' | 'yearly' | 'irregular';

export interface SubscriptionCandidate {
  /** 正規化した摘要キー */
  key: string;
  /** 代表表示名（最頻出の元摘要） */
  displayName: string;
  occurrences: number;
  /** 代表額（中央値） */
  averageAmount: number;
  /** 金額の最小・最大（変動の有無を目視判断するため） */
  amountMin: number;
  amountMax: number;
  amounts: number[];
  dates: Date[];
  /** 周期の目安（フィルタではなく並び順・おすすめチェックのヒント） */
  cadence: Cadence;
  /** 定期課金らしいか（おすすめチェック・並び順のヒント。最終判断はユーザー） */
  likelySubscription: boolean;
}

/**
 * 摘要を正規化してキー化する（§6-5）。
 * 全角→半角の空白圧縮、トリム、末尾の連番・日付・参照番号を除去。
 * 楽天等の「利用国XX」サフィックスや、毎月変動する取引参照コードも除去して
 * 同一サービスがまとまるようにする。
 */
export function normalizeDescription(raw: string): string {
  let s = raw ?? '';
  // 全角スペースを半角に、連続空白を1つに
  s = s.replace(/　/g, ' ').replace(/\s+/g, ' ').trim();
  // 楽天カード等の「利用国XX」サフィックスを除去（例: "ADOBE利用国IE" → "ADOBE"）
  s = s.replace(/利用国[A-Z]{2}\s*$/u, '').trim();
  // 末尾に付きがちな日付・連番・参照番号を除去
  s = s.replace(/[\s\-/#*]*\d[\d\-/.]{3,}\s*$/u, '');
  // 末尾の単独連番（例: "NETFLIX 1234567"）を除去
  s = s.replace(/\s+\d{4,}\s*$/u, '');
  // 内部に紛れる取引参照コード（英字と数字が混在する4文字以上のトークン）を除去
  // 例: "SPOTIFY P37035C229" → "SPOTIFY"（毎月コードが変わるため）
  s = s.replace(/\s+(?=\S*\d)(?=\S*[A-Za-z])[A-Za-z0-9*]{4,}(?=\s|$)/gu, ' ');
  s = s.replace(/\s+/g, ' ');
  // 記号で終わる場合のトリム
  s = s.replace(/[\s\-/#*.,]+$/u, '').trim();
  return s.toUpperCase();
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

const MONTH_DAYS = 30.44;
const YEAR_DAYS = 365.25;

/**
 * 金額がほぼ同額か（§6-6b）。
 * 代表額（中央値）に対し ±5% か ±100円 に収まるものが6割以上あれば一致とみなす。
 * 初月の異常値やプラン変更などの外れ値が混ざっても、本体の周期額を拾えるようにする。
 */
function amountsConsistent(amounts: number[]): boolean {
  const med = median(amounts);
  if (med === 0) return false;
  const within = amounts.filter((a) => {
    const diff = Math.abs(a - med);
    return diff <= 100 || diff / med <= 0.05;
  }).length;
  return within >= Math.ceil(amounts.length * 0.6);
}

/** 全額がほぼ同額か（外れ値を許さない厳しめの一致判定） */
function amountsTight(amounts: number[]): boolean {
  const med = median(amounts);
  if (med === 0) return false;
  return amounts.every((a) => {
    const diff = Math.abs(a - med);
    return diff <= 100 || diff / med <= 0.05;
  });
}

/**
 * 出現間隔から cadence を判定（§6-6c）。
 * 間隔を「月数（または年数）の整数倍」に正規化し、抜けた月・請求日のズレ・
 * 二重請求などの外れ値があっても、6割以上が規則的なら月次/年次とみなす。
 *
 * 通常は「最短間隔が約1ヶ月」であることを月次の条件とするが、金額がほぼ一定の場合
 * （tightAmount=true）はこの条件を外し、YouTube Premium のように2回だけ・数ヶ月空けて
 * 記録された定期課金（間隔が月の整数倍）も月次候補として拾えるようにする。
 */
function detectCadence(sortedDates: Date[], tightAmount = false): Cadence {
  if (sortedDates.length < 2) return 'irregular';
  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    gaps.push(daysBetween(sortedDates[i - 1], sortedDates[i]));
  }
  const enoughRegular = (count: number) => count >= Math.ceil(gaps.length * 0.6);

  // 月次: 各間隔が約1〜6ヶ月の整数倍に近く、かつ最短間隔が約1ヶ月であること
  const monthMultiples = gaps.map((g) => g / MONTH_DAYS);
  const regularMonthly = monthMultiples.filter((m) => {
    const r = Math.round(m);
    return r >= 1 && r <= 6 && Math.abs(m - r) <= 0.3;
  });
  const hasOneMonthGap = monthMultiples.some((m) => Math.abs(m - 1) <= 0.3);
  if (enoughRegular(regularMonthly.length) && (hasOneMonthGap || tightAmount)) return 'monthly';

  // 年次: 各間隔が約1〜3年の整数倍に近いこと
  const yearMultiples = gaps.map((g) => g / YEAR_DAYS);
  const regularYearly = yearMultiples.filter((y) => {
    const r = Math.round(y);
    return r >= 1 && r <= 3 && Math.abs(y - r) <= 0.2;
  });
  if (enoughRegular(regularYearly.length)) return 'yearly';

  return 'irregular';
}

/**
 * 同一正規化キーで定期課金「らしい」かを判定する（フィルタではなくヒント）。
 * 2回以上・周期が規則的で、金額がほぼ一定 or 3回以上規則出現するもの。
 */
function isLikelySubscription(sortedDates: Date[], amounts: number[]): boolean {
  if (sortedDates.length < 2) return false;
  const cadence = detectCadence(sortedDates, amountsTight(amounts));
  if (cadence === 'irregular') return false;
  return amountsConsistent(amounts) || sortedDates.length >= 3;
}

/**
 * 明細を店舗・サービス別にグルーピングする（§6-6）。
 *
 * 自動で定期課金を絞り込むのではなく、正規化キーで「まとめる」ことだけを担当する。
 * 周期・金額一致は `cadence` / `likelySubscription` というヒントとして付与し、
 * 実際にどれをサブスクとして取り込むかはユーザーが目視でチェックして決める。
 *
 * 同じファイルを重複取込した場合などに備え、(日付・キー・金額) が完全一致する明細は
 * 1件に集約する。
 */
export function groupTransactions(transactions: Transaction[]): SubscriptionCandidate[] {
  const groups = new Map<string, Transaction[]>();
  const seen = new Set<string>();
  for (const tx of transactions) {
    const key = normalizeDescription(tx.description);
    if (!key) continue;
    // 完全重複（同一日付・キー・金額）は除外
    const dedupKey = `${key}|${tx.date.getTime()}|${tx.amount}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const candidates: SubscriptionCandidate[] = [];
  for (const [key, txs] of groups) {
    const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime());
    const amounts = sorted.map((t) => t.amount);
    const dates = sorted.map((t) => t.date);

    // 代表表示名 = 最頻出の元摘要
    const freq = new Map<string, number>();
    for (const t of sorted) freq.set(t.description, (freq.get(t.description) ?? 0) + 1);
    const displayName = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0].trim();

    candidates.push({
      key,
      displayName,
      occurrences: sorted.length,
      averageAmount: Math.round(median(amounts)),
      amountMin: Math.min(...amounts),
      amountMax: Math.max(...amounts),
      amounts,
      dates,
      cadence: sorted.length >= 2 ? detectCadence(dates, amountsTight(amounts)) : 'irregular',
      likelySubscription: isLikelySubscription(dates, amounts),
    });
  }

  // サブスクらしいもの → 出現回数の多い順 → 最終利用日の新しい順
  const lastDate = (c: SubscriptionCandidate) => c.dates[c.dates.length - 1]?.getTime() ?? 0;
  return candidates.sort(
    (a, b) =>
      Number(b.likelySubscription) - Number(a.likelySubscription) ||
      b.occurrences - a.occurrences ||
      lastDate(b) - lastDate(a),
  );
}

/** "1,234円" や "¥1,234" や "-1234" を数値化 */
export function parseAmount(raw: string): number | null {
  if (raw == null) return null;
  const cleaned = String(raw)
    .replace(/[¥￥,，円\s]/g, '')
    .replace(/[−–—]/g, '-')
    .trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return Math.abs(n); // 出金額として絶対値で扱う
}

/** 多様な日付表記をパース（YYYY/MM/DD, YYYY-MM-DD, YYYY年MM月DD日, YYYYMMDD 等） */
export function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  let m = s.match(/(\d{4})[年/.\-](\d{1,2})[月/.\-](\d{1,2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
