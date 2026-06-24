import Link from "next/link";
import { RECORD_TYPES } from "@/lib/schema";

function FlowStep({
  n,
  title,
  href,
  cta,
  children,
}: {
  n: number;
  title: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {children}
        </p>
        <Link
          href={href}
          className="mt-2 inline-block text-sm font-semibold text-slate-700 underline"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="font-brand text-2xl font-bold tracking-wide text-slate-800">
        銀行、保険、カード、サブスク。
        <br />
        自分だけが把握している契約を一覧化して印刷。
      </h1>
      <p className="-mt-2 text-sm leading-relaxed text-slate-600">
        引っ越しにも、入院にも、もしもの時にも。暮らしの契約を、家族が分かる形に。
      </p>
      <section className="card">
        <p className="mt-1 font-brand text-lg text-slate-800 font-bold">
          暮らしの台帳とは
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          自分や家族の<strong>契約・資産</strong>
          （銀行・カード・サブスク・保険・年金・不動産・アカウントなど）を一覧にまとめ、
          <strong>印刷して残しておく</strong>ための小さなツールです。
          引っ越しや入院、もしもの時など、自分以外の誰かが手続きする場面でも、
          家族が必要な情報をすぐ確認できます。日々の固定費やサブスクの見直しにも役立ちます。
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>
            <strong>データはこの端末のブラウザ内だけ</strong>
            に保存され、サーバーや外部APIには送られません。ログイン不要。 ただし
            <strong>ブラウザの履歴・データを消すと内容も消えます</strong>。
            確実に残すには<strong>CSVに書き出して保存</strong>してください。
          </li>
          <li>
            <strong>正本は「印刷した紙（PDF）」</strong>
            です。アプリの保存は下書きにすぎません。書き出して印刷・保管して完成です。
          </li>
          <li>
            パスワード等の<strong>秘匿情報は台帳に保存しません</strong>
            。台帳は「地図」として「どこに何があるか」を示すことが目的です。
          </li>
        </ul>
      </section>

      <section className="card space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">
          使い方（3ステップ）
        </h2>

        <FlowStep
          n={1}
          title="明細取込（任意・スキップ可）"
          href="/import"
          cta="明細取込を開く"
        >
          カード明細のCSVを取り込み、定期課金（サブスク）の候補を抽出します。台帳づくりを楽にするための
          下準備で、<strong>使わなくても構いません</strong>。
        </FlowStep>

        <FlowStep n={2} title="台帳作成" href="/ledger" cta="台帳を作成する">
          各カテゴリの必須項目を入力します。当てはまらないカテゴリは「該当なし」を選べばOKです。
          入力は自動で下書き保存されます。
        </FlowStep>

        <FlowStep
          n={3}
          title="書き出し（印刷して保管）"
          href="/export"
          cta="書き出しへ"
        >
          台帳をPDF/CSVに書き出します。
          <strong>PDFを印刷して金庫や封筒に物理保管</strong>すれば完成です。
          CSVは次回の再編集用に保管します。
        </FlowStep>

        <div className="pt-1">
          <Link
            href="/import"
            className="btn-primary inline-flex w-full justify-center sm:w-auto"
          >
            明細取込から始める →
          </Link>
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            台帳に含まれる項目の一覧
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            次の{RECORD_TYPES.length}
            カテゴリの「どこに何があるか」を一覧化できます。
          </p>
        </div>
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {RECORD_TYPES.map((t) => (
            <li key={t.type} className="flex gap-2">
              <span aria-hidden className="mt-1 text-slate-400">
                ▪
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{t.label}</p>
                <p className="text-xs leading-relaxed text-slate-500">
                  {t.fields.map((f) => f.label).join("・")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
        詳しい仕様・データの扱い・免責事項は{" "}
        <Link href="/manual" className="font-semibold underline">
          説明書
        </Link>
        、相続・サブスク解約など台帳の外で知っておきたいことは{" "}
        <Link href="/guide" className="font-semibold underline">
          ガイド
        </Link>{" "}
        にまとめています。
      </div>
    </div>
  );
}
