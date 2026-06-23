import Link from 'next/link';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function ManualPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-800">説明書</h1>
        <p className="mt-1 text-sm text-slate-600">
          「はじめに」で触れていない、仕様・データの扱い・セキュリティ・免責事項の詳細です。
        </p>
      </header>

      <Section title="このアプリの仕組み（下書きと正本）">
        <p>
          入力内容はこの端末の<strong>ブラウザ内（IndexedDB）に下書き</strong>として保存されます。
          これは「足場」であって正本ではありません。
        </p>
        <p>
          <strong>正本は書き出して印刷した紙</strong>です。書き出し（PDF）を印刷し、物理保管して初めて
          「もしもの備え」として機能します。このアプリが将来使えなくなっても、印刷した紙は壊れません。
        </p>
        <p>
          画面上部に「未書き出しの変更があります」と出ているときは、まだ書き出していない下書きがある状態です。
        </p>
      </Section>

      <Section title="データの扱い・セキュリティ">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>サーバー・外部APIへの送信は一切ありません。</strong>ログインもアカウント登録も不要です。
          </li>
          <li>
            <strong>明細取込の解析もすべてブラウザ内</strong>で完結します。アップロードしたCSVが外部に送られることはありません（LLM・外部APIも不使用）。文字コードは UTF-8 / Shift_JIS を自動判定します。
          </li>
          <li>
            <strong>パスワード・口座番号・PIN等の秘匿情報は台帳に保存しません</strong>（入力欄を設けていません）。台帳は「どこに何があるか」の地図情報に限定しています。鍵にあたる秘匿情報は別途、紙などで物理管理してください。
          </li>
          <li>
            データは端末内のため、<strong>ブラウザのデータ消去・端末の故障・買い替えで消える</strong>可能性があります。だからこそ、書き出して印刷した紙を正本とします。
          </li>
          <li>
            共有端末・他人の端末では使わないでください。下書きがその端末に残ります。
          </li>
        </ul>
      </Section>

      <Section title="書き出しと再編集（CSV）">
        <p>
          書き出しでは<strong>PDF（印刷・閲覧用）</strong>と<strong>CSV（再編集用の正本）</strong>を出力できます。
        </p>
        <p>
          次回更新するときは、前回の<strong>CSVを「書き出し」画面で読み戻す</strong>と、入力を再開できます。
          読み戻すと現在の下書きは置き換わります。PDFは閲覧・共有用で、再編集には使いません。
        </p>
        <p>
          <Link href="/export" className="font-semibold underline">
            書き出し画面へ
          </Link>
        </p>
      </Section>

      <Section title="このアプリのスコープ">
        <p>
          このアプリができるのは<strong>「個人が自分の資産・契約台帳を作り、印刷する」</strong>ことだけです。
          相続手続きの代行、資産運用や法務・税務の助言、家族間の共有・通知などは行いません。
        </p>
        <p>
          認知症・相続・サブスク解約など、台帳の外で知っておくとよいことは{' '}
          <Link href="/guide" className="font-semibold underline">
            ガイド
          </Link>{' '}
          にまとめています（参考情報であり、専門家の助言に代わるものではありません）。
        </p>
      </Section>

      <Section title="免責事項">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            本アプリは情報整理を補助するツールであり、<strong>法務・税務・金融に関する助言を提供するものではありません</strong>。重要な判断は司法書士・税理士・弁護士・金融機関等の専門家にご相談ください。
          </li>
          <li>
            本アプリの利用、データの消失・漏洩、書き出した内容の正確性などに起因するいかなる損害についても、<strong>作者は責任を負いません</strong>。自己責任でご利用ください。
          </li>
          <li>
            掲載する手続き・制度の情報は変更される場合があります。<strong>最新かつ正確な情報は公的機関・専門家でご確認ください。</strong>
          </li>
          <li>
            秘匿情報の管理・共有はご自身の責任で行ってください。台帳や秘匿情報を渡す相手は慎重に選んでください。
          </li>
        </ul>
      </Section>
    </div>
  );
}
