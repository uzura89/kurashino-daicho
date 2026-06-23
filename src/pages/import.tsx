import { useMemo, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { readTextFileSmart } from "@/lib/download";
import {
  groupTransactions,
  parseAmount,
  parseDate,
  type SubscriptionCandidate,
  type Transaction,
} from "@/lib/subscription";
import { putRecord } from "@/lib/db";
import { newId } from "@/lib/record";
import type { LedgerRecord } from "@/lib/types";

type ColMap = {
  date: number;
  amount: number;
  desc: number;
  hasHeader: boolean;
};

// §6-4 主要数社のプリセット（列の並びの目安。最後は手マッピングで吸収）
const PRESETS: { label: string; map: ColMap }[] = [
  {
    label: "三井住友カード風（日付, 摘要, 金額）",
    map: { date: 0, desc: 1, amount: 2, hasHeader: true },
  },
  {
    label: "汎用（日付, 金額, 摘要）",
    map: { date: 0, amount: 1, desc: 2, hasHeader: true },
  },
  {
    label: "楽天カード風（利用日, 利用先, …, 金額）",
    map: { date: 0, desc: 1, amount: 4, hasHeader: true },
  },
];

// 読み込んだ明細の「中身」から列（日付・金額・摘要）とヘッダー有無を推定する。
// プリセットに頼らず、各列を走査して以下の特徴量を測り、特徴に最も合う列を選ぶ:
//   - fillRate : ほぼ毎行埋まっているか（充足率）
//   - dateRate : 値が日付として読める割合
//   - amtRate / moneyFrac : 数値か / そのうち金額らしい（100以上）割合
//   - textRate : 日付でも数値でもないテキストの割合
//   - distinctRatio : 値のばらつき（エントロピー）。固定文言の列は低い
//   - avgLen : テキストの平均長
function guessColMap(rows: string[][]): ColMap {
  const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (colCount === 0) return { date: 0, desc: 1, amount: 2, hasHeader: true };

  // ヘッダー行の影響を避けるため、本体（2行目以降）で統計を取る
  const body = rows.length > 2 ? rows.slice(1) : rows;
  const total = Math.max(1, body.length);

  const stats = [];
  for (let i = 0; i < colCount; i++) {
    let dateOk = 0;
    let amtOk = 0;
    let money = 0;
    let nonEmpty = 0;
    let textLen = 0;
    let textCnt = 0;
    const distinct = new Set<string>();
    for (const r of body) {
      const cell = (r[i] ?? "").trim();
      if (!cell) continue;
      nonEmpty++;
      distinct.add(cell);
      const isDate = !!parseDate(cell);
      const amt = parseAmount(cell);
      if (isDate) dateOk++;
      if (amt != null) {
        amtOk++;
        if (Math.abs(amt) >= 100) money++;
      } else if (!isDate) {
        textCnt++;
        textLen += cell.length;
      }
    }
    stats.push({
      i,
      fillRate: nonEmpty / total,
      dateRate: nonEmpty ? dateOk / nonEmpty : 0,
      amtRate: nonEmpty ? amtOk / nonEmpty : 0,
      moneyFrac: nonEmpty ? money / nonEmpty : 0,
      textRate: nonEmpty ? textCnt / nonEmpty : 0,
      distinctRatio: nonEmpty ? distinct.size / nonEmpty : 0,
      avgLen: textCnt ? textLen / textCnt : 0,
    });
  }

  // 日付列: 値の大半が日付として読める列（小さい index 優先）
  let dateCol = 0;
  let bestDate = -1;
  for (const s of stats)
    if (s.dateRate > bestDate) {
      bestDate = s.dateRate;
      dateCol = s.i;
    }

  // 金額列: 数値で「金額らしい（100以上が多い）」列。手数料(ほぼ0)や回数(小さい固定値)は除外される。
  // 利用金額/支払総額のように複数の金額列があるときは、より手前（実取引額のことが多い）を選ぶ。
  const moneyCols = stats.filter(
    (s) => s.i !== dateCol && s.amtRate >= 0.6 && s.moneyFrac >= 0.5,
  );
  let amountCol: number;
  if (moneyCols.length > 0) {
    amountCol = moneyCols.reduce((a, b) => (a.i <= b.i ? a : b)).i;
  } else {
    // フォールバック: 数値として読める割合が最大の列
    let best = -1;
    amountCol = -1;
    for (const s of stats)
      if (s.i !== dateCol && s.amtRate > best) {
        best = s.amtRate;
        amountCol = s.i;
      }
    if (amountCol < 0) amountCol = Math.min(colCount - 1, 2);
  }

  // 摘要列: 「ほぼ毎行ある（fillRate）」「テキスト（textRate）」「ばらつきがある（distinctRatio）」列。
  //   固定文言（利用者=本人 等）は distinctRatio が低く、まれにしか入らない注記列は fillRate が低いので落ちる。
  //   fillRate を二乗で効かせ、たまにしか埋まらない長文の注記列に負けないようにする。
  let descCol = -1;
  let bestDesc = -1;
  for (const s of stats) {
    if (s.i === dateCol || s.i === amountCol) continue;
    const score =
      s.fillRate *
      s.fillRate *
      s.textRate *
      s.distinctRatio *
      Math.min(s.avgLen, 20);
    if (score > bestDesc) {
      bestDesc = score;
      descCol = s.i;
    }
  }
  if (descCol < 0)
    descCol = [0, 1, 2].find((i) => i !== dateCol && i !== amountCol) ?? 1;

  // ヘッダー有無: 先頭行の日付列が日付として読めなければヘッダー（または見出し行）とみなす
  const firstDateCell = (rows[0]?.[dateCol] ?? "").trim();
  const hasHeader = rows.length > 1 ? !parseDate(firstDateCell) : false;

  return { date: dateCol, amount: amountCol, desc: descCol, hasHeader };
}

const cadenceLabel = (c: SubscriptionCandidate["cadence"]) =>
  c === "monthly" ? "毎月" : c === "yearly" ? "毎年" : "不定期";

const formatDate = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

type LoadedFile = { name: string; rows: string[][] };

export default function ImportPage() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [colMap, setColMap] = useState<ColMap>({
    date: 0,
    desc: 1,
    amount: 2,
    hasHeader: true,
  });
  const [candidates, setCandidates] = useState<SubscriptionCandidate[] | null>(
    null,
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [hideSingles, setHideSingles] = useState(false);
  const [linkedCard, setLinkedCard] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(0);

  // 表示・列マッピング用に全ファイルの行を結合したもの
  const rows = useMemo(() => files.flatMap((f) => f.rows), [files]);

  const onFiles = async (selectedFiles: File[]) => {
    setError(null);
    setCandidates(null);
    setAdded(0);
    try {
      const loaded = await Promise.all(
        selectedFiles.map(async (file) => {
          const text = await readTextFileSmart(file);
          const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
          const data = (parsed.data as string[][]).filter((r) =>
            r.some((c) => c && c.trim()),
          );
          return { name: file.name, rows: data } satisfies LoadedFile;
        }),
      );
      // 既に読み込んだファイルに追記（12ヶ月分などを分けて選べるように）
      const next = [...files, ...loaded];
      setFiles(next);
      // 列（日付・金額・摘要）とヘッダー有無を自動推定（手動で調整も可）
      setColMap(guessColMap(next.flatMap((f) => f.rows)));
    } catch (e) {
      setError(
        "読み込みに失敗しました: " +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setCandidates(null);
    setAdded(0);
    setError(null);
  };

  const columnCount = useMemo(
    () => rows.reduce((max, r) => Math.max(max, r.length), 0),
    [rows],
  );

  const sampleRows = useMemo(() => rows.slice(0, 6), [rows]);

  const runGrouping = () => {
    setError(null);
    // ヘッダーはファイルごとに除外する（複数ファイルのヘッダー行が明細に混ざらないように）
    const dataRows = files.flatMap((f) =>
      colMap.hasHeader ? f.rows.slice(1) : f.rows,
    );
    const txs: Transaction[] = [];
    for (const r of dataRows) {
      const date = parseDate(r[colMap.date] ?? "");
      const amount = parseAmount(r[colMap.amount] ?? "");
      const desc = (r[colMap.desc] ?? "").trim();
      if (!date || amount == null || !desc) continue;
      txs.push({ date, amount, description: desc });
    }
    if (txs.length === 0) {
      setError(
        "指定した列から有効な明細を読み取れませんでした。列マッピングを見直してください。",
      );
      setCandidates([]);
      return;
    }
    const groups = groupTransactions(txs);
    setCandidates(groups);
    // 既定では「定期課金らしい」グループだけにチェックを付ける（最終判断はユーザー）
    const sel: Record<string, boolean> = {};
    groups.forEach((c) => (sel[c.key] = c.likelySubscription));
    setSelected(sel);
  };

  const visibleCandidates = useMemo(
    () => (candidates ?? []).filter((c) => !hideSingles || c.occurrences >= 2),
    [candidates, hideSingles],
  );

  const selectedCount = useMemo(
    () => (candidates ?? []).filter((c) => selected[c.key]).length,
    [candidates, selected],
  );

  const setAllSelected = (value: boolean) => {
    const sel: Record<string, boolean> = {};
    for (const c of visibleCandidates) sel[c.key] = value;
    setSelected((prev) => ({ ...prev, ...sel }));
  };

  const importSelected = async () => {
    if (!candidates) return;
    const chosen = candidates.filter((c) => selected[c.key]);
    for (const c of chosen) {
      const now = Date.now();
      const amountText =
        c.amountMin === c.amountMax
          ? `${c.amountMin.toLocaleString()}円`
          : `${c.amountMin.toLocaleString()}〜${c.amountMax.toLocaleString()}円`;
      // 周期が判別できたものだけ括弧で補足（不定期は付けない）
      const priceText =
        c.cadence === "irregular"
          ? `約${amountText}`
          : `約${amountText}（${cadenceLabel(c.cadence)}）`;
      const rec: LedgerRecord = {
        id: newId(),
        type: "subscription",
        values: {
          service_name: { value: c.displayName },
          price: { value: priceText },
          billing_route: { value: "カード" },
          linked_card: { value: linkedCard.trim() },
          cancel_method: { value: "" },
        },
        createdAt: now,
        updatedAt: now,
      };
      await putRecord(rec);
    }
    setAdded(chosen.length);
  };

  const colOptions = Array.from({ length: columnCount }, (_, i) => i);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-800">
          カード明細からサブスク（定期課金）を取り込む
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          明細を店舗・サービス別にまとめます。どれをサブスクとして取り込むかは一覧から目視で選べます。
          解析は<strong>すべてこのブラウザ内</strong>
          で行います。明細データは外部に送信されません（LLM・外部APIも不使用）。
          文字コードは UTF-8 / Shift_JIS を自動判定します。
        </p>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          このステップは<strong>任意（スキップ可）</strong>
          です。台帳づくりを楽にするための下準備なので、使わずに{" "}
          <Link href="/ledger" className="font-semibold underline">
            台帳作成
          </Link>{" "}
          へ直接進んでも構いません。
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="card space-y-3">
        <p className="label">1. カード明細CSVをアップロード</p>
        <p className="text-xs text-slate-500">
          複数ファイルをまとめて選択できます（1ヶ月ずつの明細などを12ファイル一度に取り込めます）。追加でファイルを選ぶと前のファイルに加算されます。
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={(e) => {
            const fs = Array.from(e.target.files ?? []);
            if (fs.length) onFiles(fs);
            // 同じファイルを選び直したり追加で選べるように値をリセット
            e.target.value = "";
          }}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              {files.length} ファイル・合計 {rows.length} 行を読み込みました
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-500">
              {files.map((f, i) => (
                <li key={i}>
                  {f.name}（{f.rows.length} 行）
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={clearFiles}
            >
              すべてクリア
            </button>
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section className="card space-y-4">
          <p className="label">2. 列マッピング</p>
          <p className="text-xs text-slate-500">
            読み込んだ内容から<strong>日付・金額・摘要の列を自動推定</strong>
            しました。プレビューを確認し、違っていればプリセットや下の選択で調整してください。
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center">
              プリセット:
            </span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setColMap(p.map)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {colOptions.map((i) => (
                    <th
                      key={i}
                      className="border-b border-slate-200 px-2 py-1 text-left font-medium"
                    >
                      列{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((r, ri) => (
                  <tr
                    key={ri}
                    className={
                      colMap.hasHeader && ri === 0
                        ? "bg-amber-50 text-slate-400"
                        : ""
                    }
                  >
                    {colOptions.map((i) => (
                      <td
                        key={i}
                        className="border-b border-slate-100 px-2 py-1 whitespace-nowrap"
                      >
                        {r[i] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={colMap.hasHeader}
              onChange={(e) =>
                setColMap({ ...colMap, hasHeader: e.target.checked })
              }
              className="accent-slate-700"
            />
            1行目はヘッダー（集計から除外）
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["date", "日付の列"],
                ["amount", "金額の列"],
                ["desc", "摘要（店名）の列"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <span className="label">{label}</span>
                <select
                  className="input"
                  value={colMap[key]}
                  onChange={(e) =>
                    setColMap({ ...colMap, [key]: Number(e.target.value) })
                  }
                >
                  {colOptions.map((i) => (
                    <option key={i} value={i}>
                      列{i}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button type="button" className="btn-primary" onClick={runGrouping}>
            店舗・サービス別にまとめる
          </button>
        </section>
      )}

      {candidates && (
        <section className="card space-y-3">
          <p className="label">
            3. サブスクを選んで取り込む（{candidates.length} グループ）
          </p>
          {candidates.length === 0 ? (
            <p className="text-sm text-slate-500">
              有効な明細を読み取れませんでした。列マッピングを見直してください。
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                明細を店舗・サービス別にまとめました。
                <span className="font-medium text-slate-600">
                  「毎月」「毎年」など定期課金らしいものは自動でチェック済み
                </span>
                です。実際に取り込むサブスクを目視で確認し、チェックを調整してください。
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">
                  {selectedCount} 件を選択中
                </span>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setAllSelected(true)}
                >
                  表示中をすべて選択
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setAllSelected(false)}
                >
                  選択を解除
                </button>
                <label className="ml-auto flex items-center gap-1.5 text-slate-500">
                  <input
                    type="checkbox"
                    checked={hideSingles}
                    onChange={(e) => setHideSingles(e.target.checked)}
                    className="accent-slate-700"
                  />
                  1回だけの明細を隠す
                </label>
              </div>

              <ul className="divide-y divide-slate-100">
                {visibleCandidates.map((c) => {
                  const amountText =
                    c.amountMin === c.amountMax
                      ? `${c.amountMin.toLocaleString()}円`
                      : `${c.amountMin.toLocaleString()}〜${c.amountMax.toLocaleString()}円`;
                  return (
                    <li key={c.key} className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[c.key]}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            [c.key]: e.target.checked,
                          })
                        }
                        className="accent-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-800">
                            {c.displayName}
                          </span>
                          {c.likelySubscription && (
                            <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              {cadenceLabel(c.cadence)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.occurrences}回・{amountText}
                          {c.dates.length > 0 &&
                            `・最終 ${formatDate(c.dates[c.dates.length - 1])}`}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <label className="block">
                  <span className="label">紐づくカード・口座</span>
                  <input
                    className="input"
                    placeholder="例: 楽天カード（下4桁1234） / ◯◯銀行 普通"
                    value={linkedCard}
                    onChange={(e) => setLinkedCard(e.target.value)}
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  この明細の引落し元です。取り込む各サブスクの「紐づくカード/口座」に反映されます。
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={importSelected}
              >
                選んだ {selectedCount} 件を台帳に追加（サブスク）
              </button>
            </>
          )}
        </section>
      )}

      {added > 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {added} 件をサブスクとして台帳に追加しました。{" "}
          <Link href="/ledger" className="font-semibold underline">
            台帳で確認・編集する
          </Link>
        </div>
      )}

      <p className="text-xs text-slate-400">
        明細データはブラウザ外に出ません。処理後はメモリ上のみで保持し、取り込んだサブスクだけが下書きに残ります。
      </p>
    </div>
  );
}
