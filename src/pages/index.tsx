import Link from "next/link";

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
      <section className="card">
        <h1 className="text-xl font-bold text-slate-800">資産・契約台帳メーカー</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          自分の<strong>資産・契約台帳</strong>
          （銀行・カード・サブスク・保険・年金・不動産・アカウントなどの一覧）を作って
          <strong>印刷する</strong>ための小さなツールです。終活・相続の資産整理や、
          サブスクの解約準備にも使えます。
          もしもの時に、家族が「どこに何があるか」をすぐ把握できるようにしておくことが目的です。
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>
            <strong>データはこの端末のブラウザ内だけ</strong>
            に保存され、サーバーや外部APIには送られません。ログイン不要。
          </li>
          <li>
            <strong>正本は「印刷した紙」</strong>
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

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
        詳しい仕様・データの扱い・免責事項は{" "}
        <Link href="/manual" className="font-semibold underline">
          説明書
        </Link>
        、認知症・相続・サブスク解約など台帳の外で知っておきたいことは{" "}
        <Link href="/guide" className="font-semibold underline">
          ガイド
        </Link>{" "}
        にまとめています。
      </div>
    </div>
  );
}
