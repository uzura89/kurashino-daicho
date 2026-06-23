import Link from 'next/link';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-medium text-slate-800">{name}</h3>
      <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-800">ガイド（知っておきたいこと）</h1>
        <p className="mt-1 text-sm text-slate-600">
          このアプリのスコープ（台帳を作って印刷する）からは外れますが、もしもの備えとして
          知っておくとよいことをまとめました。
          <strong>一般的な参考情報であり、専門家の助言に代わるものではありません。</strong>
          実際の手続き・制度は変わることがあるため、公的機関や専門家でご確認ください。
        </p>
      </header>

      <Card title="① できた台帳を印刷して物理保管する">
        <p>
          <Link href="/export" className="underline">
            書き出し
          </Link>
          でPDFを出力し、印刷します。複数ページになる場合はホチキス止め・封筒でひとまとめにします。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>家庭用金庫</strong>（耐火タイプが望ましい）</li>
          <li><strong>鍵付きの引き出し＋封筒</strong>（手軽。鍵の管理に注意）</li>
          <li><strong>銀行の貸金庫</strong>（最も堅牢。相続時は正式な手続きで開く）</li>
        </ul>
        <p>
          パスワード・口座番号・端末パスコード等の<strong>秘匿情報は台帳に載せず、別の封筒にまとめて
          同じ保管先</strong>へ。印刷後はPCに平文ファイル（PDF/CSV）を残さないのが安全です（再編集用CSVは
          印刷物と一緒／USB等で同じ保管先に）。
        </p>
      </Card>

      <Card title="② もしもの時の引き継ぎ（開け方の共有）">
        <p>
          自動の時間差開示のような仕組みは使いません。代わりに、
          <strong>保管場所と開け方（金庫の番号・鍵のありか・貸金庫の契約 等）を平時に家族へ伝えておき</strong>、
          いざという時に家族が物理的に取り出します。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>受け取る家族を決める（複数人で分散するとより安心）。</li>
          <li>場所と開け方<strong>だけ</strong>を共有し、中身そのもの（秘匿情報）はメッセージに流さない。</li>
          <li>開けられる人はその場で全部見られます。渡す相手は慎重に。必要なら「場所を知る人」と「鍵/番号を知る人」を分ける。</li>
          <li>一度、家族と取り出して読めるか・情報が足りているかを確認しておく。</li>
        </ul>
      </Card>

      <Card title="③ 認知症に備える（判断能力が低下する前に）">
        <p>
          認知症などで判断能力が低下すると、本人名義の口座が事実上凍結され、家族でも資産を動かせなくなる
          ことがあります。元気なうちに次のような選択肢を検討しておくと安心です。
        </p>
        <Term name="家族信託（民事信託）">
          財産の管理を信頼できる家族に託す契約。認知症後も託された家族が不動産の管理・処分や預金の管理を
          続けられます。持ち家・収益不動産・事業資産がある場合に特に有効。司法書士・弁護士へ相談します。
        </Term>
        <Term name="任意後見">
          判断能力があるうちに、将来支援してくれる人（任意後見人）と公正証書で契約しておく制度。
          判断能力が低下したら家庭裁判所が監督人を選任して効力が生じます。
        </Term>
        <Term name="銀行の代理人届け（代理人カード等）">
          金融機関に「代理人」をあらかじめ登録しておく仕組み。手続きや適用範囲は金融機関ごとに異なるため、
          取引のある銀行で確認します。手軽ですが、できることの範囲は限定的です。
        </Term>
        <p className="text-xs text-slate-500">
          どれが適切かは資産構成・家族関係で変わります。司法書士・弁護士・銀行の窓口に相談してください。
        </p>
      </Card>

      <Card title="④ 亡くなった後のサブスク・契約の解約">
        <p>
          放置すると課金が続くサブスクや会費は、早めに止めるのが大切です。台帳の
          「サービス名・課金経路・解約方法/URL」をもとに、次の順で確認します。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>課金経路で窓口が変わります。</strong>App Store（Apple）/ Google Play / クレジットカード直接 /
            携帯キャリア決済 など、どこから引き落とされているかを確認。
          </li>
          <li>
            App Store・Google Play 経由は、各アカウントのサブスクリプション管理から解約します（端末・アカウント情報が必要）。
          </li>
          <li>
            カード直接決済は、各サービスの解約ページから手続き。解約が難しいものは、最終手段としてカード会社・銀行に
            引き落とし停止やカード解約を相談します。
          </li>
          <li>
            未請求・継続中の契約がないか、カード明細・口座引落しを数か月分さかのぼって確認します（
            <Link href="/import" className="underline">明細取込</Link>
            で洗い出すと楽です）。
          </li>
        </ul>
      </Card>

      <Card title="⑤ 亡くなった後に用意することが多い書類">
        <p>手続き先によって必要書類は異なりますが、一般的によく求められるものです。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>死亡診断書 / 死亡届</strong>（コピーを複数用意しておくと各種手続きで使い回せます）</li>
          <li><strong>戸籍謄本</strong>（被相続人の出生から死亡までの連続したもの／相続人の戸籍）</li>
          <li><strong>法定相続情報一覧図</strong>（法務局で取得。各機関への提出が一枚で済み便利）</li>
          <li><strong>遺言書</strong>（ある場合。自筆証書は家庭裁判所の検認が必要なことがあります）</li>
          <li><strong>相続人の本人確認書類・印鑑証明書</strong>、遺産分割協議書（必要に応じて）</li>
          <li>金融機関・保険会社の<strong>所定の請求書類</strong>（各社の窓口で案内されます）</li>
        </ul>
        <p className="text-xs text-slate-500">
          相続放棄には期限（自分のために相続の開始を知った時から原則3か月）など重要な期日があります。
          債務（ローン等）が多い可能性がある場合は早めに専門家へ相談してください。
        </p>
      </Card>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        ここに書かれているのは一般的な参考情報です。最新の制度・要件・期限は、公的機関（市区町村・法務局・年金事務所 等）や
        司法書士・税理士・弁護士などの専門家で必ずご確認ください。免責事項は{' '}
        <Link href="/manual" className="font-semibold underline">
          説明書
        </Link>{' '}
        を参照してください。
      </div>
    </div>
  );
}
