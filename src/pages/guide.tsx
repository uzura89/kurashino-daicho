import Link from "next/link";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-medium text-slate-800">{name}</h3>
      <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
        {children}
      </p>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-800">
          基本情報（知っておきたいこと）
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          台帳作成の範囲を少し超えますが、備えとして知っておきたいことをまとめました。
          <strong>
            一般的な参考情報であり、専門家の助言に代わるものではありません。
          </strong>
          実際の手続きは、公的機関や専門家でご確認ください。
        </p>
      </header>
      <Card title="① なぜ台帳が必要か">
        <p>
          台帳は<strong>「どこに何があるか」を示す暮らしの地図</strong>
          です。引っ越し・入院・固定費の見直しなど、自分で契約を確認したい時に役立ちます。
        </p>
        <p>
          <strong>もしもの時には家族のため</strong>の地図になります。
          台帳がないと、次のような負担が生じがちです。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            口座・保険・証券が<strong>どこにあるか分からず</strong>
            、問い合わせに時間がかかる。
          </li>
          <li>
            ネット銀行・ネット証券・暗号資産・サブスクは
            <strong>通帳も郵便物も届かない</strong>ため、
            存在に気づかれず放置される。
          </li>
          <li>
            解約されない<strong>サブスクや会費の課金が延々と続く</strong>。
          </li>
          <li>
            借入・連帯保証などの<strong>負債が分からず</strong>
            、気づかず相続してしまう。
          </li>
          <li>
            相続放棄（原則3か月）・相続税申告（10か月）などの
            <strong>期限</strong>に間に合わない。
          </li>
        </ul>
        <p>
          元気なうちに作っておけば、家族の手続き負担と取りこぼしを減らせます。
        </p>
      </Card>
      <Card title="② 台帳がカバーしない「秘匿情報」（最重要の鍵）">
        <p>
          次のような秘匿情報そのものは、台帳に直接書かないようにします。
          印刷して保管したり、家族に見せたりする場面でも、台帳を安全に扱いやすくするためです。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>スマホ（iPhone等）のロック解除パスコード</li>
          <li>パソコンのログインパスワード</li>
          <li>主要なメールアカウントのパスワード</li>
        </ul>
        <p>
          これらを共有しておきたい場合は、別紙や封筒に書き、金庫・貸金庫など安全な場所に保管します。
          台帳には<strong>その「在りか」だけ</strong>を記しておくと、台帳と秘匿情報を分けて残せます。
        </p>
        <p className="text-xs text-slate-500">
          パスコードやパスワードを変更したときは、保管した控えの更新も忘れずに行ってください。
        </p>
      </Card>
      <Card title="③ エンディングノート・遺言との違い">
        <p>
          「エンディングノート」「遺言」とは役割が異なります。 目的に応じて
          <strong>使い分け・併用</strong>します。
        </p>
        <Term name="この台帳（資産の地図）">
          「どこに何があるか」を一覧化したメモ。法的効力はありませんが、
          家族が資産を把握する出発点になります。秘匿情報は含めません。
        </Term>
        <Term name="エンディングノート">
          医療・介護、葬儀、家族へのメッセージなど
          <strong>想いや要望</strong>を残すもの。法的効力はありません。
          台帳は「事実」、エンディングノートは「気持ち」と考えると整理しやすいです。
        </Term>
        <Term name="遺言（遺言書）">
          誰に何を遺すかを定める、<strong>法的効力を持つ</strong>
          文書。形式不備で無効になることがあるため、専門家への相談が安心です。
        </Term>
      </Card>
      <Card title="④ 認知症に備える（判断能力が低下する前に）">
        <p>
          判断能力が低下すると、家族でも本人名義の資産を動かせないことがあります。
          元気なうちに選択肢を検討しておくと安心です。
        </p>
        <Term name="家族信託（民事信託）">
          財産管理を家族に託す契約。認知症後も、不動産や預金の管理を続けやすくなります。
          持ち家・収益不動産・事業資産がある場合に有効です。
        </Term>
        <Term name="任意後見">
          将来支援してくれる人と、公正証書で契約しておく制度。
          判断能力が低下した後、家庭裁判所の手続きを経て効力が生じます。
        </Term>
        <Term name="銀行の代理人届け（代理人カード等）">
          金融機関に代理人を登録する仕組み。手軽ですが範囲は限定的なので、取引銀行で確認します。
        </Term>
        <p className="text-xs text-slate-500">
          適切な方法は資産構成・家族関係で変わります。専門家や銀行に相談してください。
        </p>
      </Card>
      <Card title="⑤ 亡くなった後のサブスク・契約の解約">
        <p>
          亡くなった後の解約は、
          <strong>
            家族が本人のアカウントにログインできず難しいことが多い
          </strong>
          です。台帳の「サービス名・課金経路・在りか」を手がかりに進めます。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            まず<strong>何に課金されているか</strong>
            を、カード明細・口座引落しから洗い出します（
            <Link href="/import" className="underline">
              明細取込
            </Link>
            で確認できます）。App Store / Google Play / カード直接 /
            携帯キャリア決済なども確認します。
          </li>
          <li>
            <strong>正規の引き継ぎ設定がある場合</strong>（Apple
            の「故人アカウント管理連絡先」など）は、その権限で解約・整理できます。
            <strong>
              パスワードを知っていても、本人になり代わるログインは推奨されません。
            </strong>
            権限が確認できないときは、窓口対応に進みます。
          </li>
          <li>
            <strong>権限がない・ログインできない場合</strong>
            は、各サービスの窓口に 「契約者が亡くなった」と連絡し、
            <strong>所定の書類で</strong>解約・返金を申請します。
            必要書類や所要日数はサービスごとに異なります。
          </li>
          <li>
            <strong>止まらない場合の最終手段</strong>
            として、カード会社・銀行に停止を相談します。 ただし
            <strong>口座凍結や他の支払いへの影響</strong>
            があるため、必要な支払いの付け替え後が安全です。
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          カードを止めても契約は残る場合があります。可能なら正式な解約も進めてください。
        </p>
      </Card>
      <Card title="⑥ アカウントを生前に整理・引き継ぐ（各サービスの公式機能）">
        <p>
          主要サービスには、
          <strong>引き継ぐ人や死後の扱いを指定できる公式機能</strong>
          があります。元気なうちに設定しておくと、データの未整理や課金継続を防ぎやすくなります。
        </p>
        <Term name="Apple（デジタル遺産プログラム）">
          「故人アカウント管理連絡先」を登録すると、指定した人がアクセスキーと死亡証明書で
          iCloud
          データにアクセスできます。設定場所も台帳に控えておくと安心です。
        </Term>
        <Term name="Google（アカウント無効化管理ツール）">
          一定期間ログインがない場合に、指定した家族へデータ共有したり、アカウントを削除したりできます。
        </Term>
        <Term name="Facebook・Instagram（Meta）">
          Facebook は追悼アカウント管理人や死亡後の削除を設定できます。
          Instagram も家族から追悼アカウント化・削除を申請できます。
        </Term>
        <Term name="X（旧Twitter）・LINE など">
          管理人を指定できない場合は、家族が所定の手続きで
          <strong>アカウント削除を申請する</strong>形が中心です。
        </Term>
        <p className="text-xs text-slate-500">
          仕様は変わることがあります。各サービスのヘルプで最新情報を確認してください。
          台帳に<strong>利用サービス</strong>
          を記しておくと、家族が手続きにたどり着けます。
        </p>
      </Card>
      <Card title="⑦ 亡くなった後に用意することが多い書類">
        <p>手続き先によって異なりますが、一般的によく求められる書類です。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>死亡診断書 / 死亡届</strong>
            （コピーを複数用意すると便利）
          </li>
          <li>
            <strong>戸籍謄本</strong>
            （被相続人の出生から死亡までの連続したもの／相続人の戸籍）
          </li>
          <li>
            <strong>法定相続情報一覧図</strong>
            （法務局で取得。提出が一枚で済み便利）
          </li>
          <li>
            <strong>遺言書</strong>
            （ある場合。自筆証書は検認が必要なことがあります）
          </li>
          <li>
            <strong>相続人の本人確認書類・印鑑証明書</strong>
            、遺産分割協議書（必要に応じて）
          </li>
          <li>
            金融機関・保険会社の<strong>所定の請求書類</strong>
            （各社の窓口で案内されます）
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          相続放棄には原則3か月の期限があります。債務が多い可能性がある場合は早めに専門家へ。
        </p>
      </Card>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        ここに書かれているのは一般的な参考情報です。最新情報は公的機関や専門家でご確認ください。免責事項は{" "}
        <Link href="/manual" className="font-semibold underline">
          説明書
        </Link>{" "}
        を参照してください。
      </div>
    </div>
  );
}
