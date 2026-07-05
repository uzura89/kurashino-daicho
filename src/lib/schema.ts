// §5 型定義（スターターセット）。
// 公開/非公開の区分は廃止。秘匿情報（パスワード・PIN・ログインID・口座番号・各種番号など）は
// 台帳の対象から外し、地図情報（どこに何があるか）だけを持つ。鍵は別途共有する。
import type { FieldWidth, RecordTypeDef } from "./types";

const f = (
  key: string,
  label: string,
  width?: FieldWidth,
  options?: string[],
) => ({ key, label, width, options });
// 必須項目（赤い * 表示・入力完了判定の対象）
const fr = (
  key: string,
  label: string,
  width?: FieldWidth,
  options?: string[],
) => ({ key, label, width, options, required: true });
// 手書き想定項目（任意入力。空欄でもPDF・プレビューに記入欄として出し、印刷後に手書きできる）
const fh = (key: string, label: string, width?: FieldWidth) => ({
  key,
  label,
  width,
  handwrite: true,
});

export const RECORD_TYPES: RecordTypeDef[] = [
  {
    type: "bank_account",
    label: "銀行口座",
    fields: [
      fr("bank_name", "銀行名", "md"),
      fr("branch", "支店名", "sm"),
      fr("account_kind", "口座種別", "sm", ["普通", "当座", "貯蓄", "その他"]),
      f("storage", "通帳・キャッシュカードの保管場所", "md"),
      f("memo", "メモ（代理人届の有無 等）", "full"),
    ],
  },
  {
    type: "credit_card",
    label: "クレジットカード",
    fields: [
      fr("issuer", "カード会社", "md"),
      fr("last4", "下4桁", "xs"),
      f("debit_account", "引落し口座", "md"),
      f("memo", "メモ", "full"),
    ],
  },
  {
    type: "securities_account",
    label: "資産運用・年金",
    description:
      "証券口座（NISA等）・iDeCo・企業年金など、運用・積立している資産をまとめて記録します。",
    fields: [
      fr("broker", "金融機関・運営機関名", "md"),
      f("kind", "種別", "sm", [
        "証券口座（NISA等）",
        "iDeCo",
        "企業年金・確定拠出年金",
        "その他",
      ]),
      f("holdings", "保有概要", "full"),
      f("memo", "メモ（年金の受取口座 等）", "full"),
    ],
  },
  {
    type: "insurance",
    label: "保険",
    fields: [
      fr("insurer", "保険会社名", "md"),
      fr("kind", "種別", "sm", [
        "生命",
        "医療",
        "がん",
        "介護",
        "個人年金",
        "損害",
        "その他",
      ]),
      f("beneficiary", "受取人", "sm"),
      fr("policy_location", "保険証券の保管場所", "md"),
      f("memo", "メモ（請求期限の注意 等）", "full"),
    ],
  },
  {
    type: "real_estate",
    label: "住まい",
    description:
      "持ち家・賃貸どちらも、住まいに関する契約をまとめます。引っ越しや、家族が代わりに手続きする場面で必要になります。所在地や名義は空欄のまま印刷し、手書きで記入することもできます。",
    fields: [
      fr("kind", "区分", "sm", [
        "持ち家（一戸建て）",
        "持ち家（マンション）",
        "賃貸",
        "その他",
      ]),
      fh("location", "所在地", "full"),
      fh("owner", "名義・契約者", "sm"),
      f("manager", "管理会社・大家・管理組合", "md"),
      f("renewal", "契約期間・更新時期（賃貸 等）", "sm"),
      f(
        "memo",
        "メモ（住宅ローン・保証会社・火災保険・権利証や登記の場所 等）",
        "full",
      ),
    ],
  },
  {
    type: "loan_debt",
    label: "借入・負債",
    description:
      "ローン・借金・連帯保証など「マイナスの財産」も、家族が把握できるよう記録します。把握している範囲で残しておくと、万一のときの相続放棄（原則3か月）の判断材料にもなります。",
    fields: [
      fr("lender", "借入先（金融機関・相手）", "md"),
      fr("kind", "種別", "sm", [
        "住宅ローン",
        "自動車ローン",
        "カードローン・キャッシング",
        "奨学金",
        "事業融資",
        "個人間の借入",
        "連帯保証",
        "その他",
      ]),
      f("balance", "残高の目安", "sm"),
      f("memo", "メモ（担保・保証した相手・連絡先 等）", "full"),
    ],
  },
  {
    type: "utility",
    label: "公共料金・ライフライン",
    description:
      "電気・ガス・水道・通信・携帯など、毎月の支払いが発生するライフラインを記録します。引っ越しや入院のとき、家族が「どこに何を払っているか」をすぐ把握できます。お客様番号などの番号そのものは書かず、契約先と支払経路だけを残します。",
    fields: [
      fr("kind", "種別", "sm", [
        "電気",
        "ガス",
        "水道",
        "インターネット・固定電話",
        "携帯・スマホ",
        "NHK",
        "その他",
      ]),
      fr("provider", "事業者・サービス名", "md"),
      fr("payment", "支払方法", "sm", [
        "口座振替",
        "クレジットカード",
        "コンビニ・払込票",
        "その他",
      ]),
      f("linked", "紐づく口座・カード", "sm"),
      f("memo", "メモ（お客様番号の控えの場所・連絡先 等）", "full"),
    ],
  },
  {
    type: "subscription",
    label: "サブスク・定期課金",
    description:
      "カード明細のCSVから「明細取込」でまとめて追加できます（手入力も可）。",
    fields: [
      fr("service_name", "サービス名", "md"),
      f("price", "料金（月額/年額）", "sm"),
      fr("billing_route", "課金経路", "md", [
        "App Store",
        "Google Play",
        "クレジットカード",
        "キャリア決済",
        "口座振替",
        "その他",
      ]),
      f("linked_card", "紐づくカード/口座", "sm"),
      fr("cancel_method", "解約方法・URL", "full"),
    ],
  },
  {
    type: "device_account",
    label: "端末・アカウント",
    description:
      "スマホ・PCなどの端末と、主要なアカウントを記録します。家族が中のデータや手続きにたどり着けるよう「どこにあるか」「どうすれば開けるか」を残します。パスコードや暗証そのものは書かず、その共有先（封筒・別紙 等）の所在を記録します。",
    fields: [
      fr("kind", "種別", "md", [
        "iPhone",
        "iPad",
        "Mac",
        "Windows PC",
        "Android",
        "Apple ID",
        "Googleアカウント",
        "その他",
      ]),
      f("account_email", "Apple ID / Googleアカウント（メール）", "lg"),
      f("device_location", "端末の保管場所", "md"),
      f("unlock_access", "家族が開ける手段の所在（パスコードの共有先）", "md"),
      f("carrier", "契約キャリア・購入元", "sm"),
      f("memo", "メモ", "full"),
    ],
  },
  {
    type: "digital_money",
    label: "暗号資産・電子マネー",
    description:
      "暗号資産・電子マネー・ポイント・マイルなどを記録します。少額でも家族が見落としやすいため、どこに・どれくらいあるかを残します。パスワードや秘密鍵そのものは書かず、引き継ぎ方法（別紙 等）の所在を記録します。",
    fields: [
      fr("kind", "種別", "sm", [
        "暗号資産",
        "電子マネー",
        "ポイント・マイル",
        "その他",
      ]),
      fr("service", "サービス・取引所・発行元", "md"),
      f("balance", "残高・数量の目安", "sm"),
      f("linked", "紐づくカード・口座・アプリ", "sm"),
      f("memo", "メモ（引き継ぎ方法の所在 等）", "full"),
    ],
  },
  {
    type: "digital_asset",
    label: "ドメイン・デジタル資産",
    description:
      "ブログ・Webサイト・Webサービス・YouTube等の配信チャンネル・ドメインなど、自分が運営しているデジタル資産を記録します。収益や継続課金が発生するものは、家族が引き継ぎ・解約・閉鎖できるよう所在を残します。パスワードそのものは書かず、引き継ぎ方法（別紙 等）の所在を記録します。",
    fields: [
      fr("kind", "種別", "sm", [
        "ブログ・Webサイト",
        "Webサービス・アプリ",
        "動画・配信チャンネル（YouTube 等）",
        "その他",
      ]),
      fr("service", "名称・URL", "md"),
      f("account", "アカウント・ID（メール 等）", "md"),
      f("memo", "メモ（収益・引き継ぎ・解約方法の所在 等）", "full"),
    ],
  },
  {
    type: "medical_care",
    label: "医療・健康",
    description:
      "かかりつけ医・常用している薬・診察券などの保管場所を記録します。入院など、家族が代わりに対応する場面で役立ちます。診察券番号などの番号そのものは書かず「どこにあるか」を残します。",
    fields: [
      fr("clinic", "かかりつけ医・病院", "md"),
      f("conditions", "持病・アレルギー・服用中の薬", "full"),
      fr("card_location", "診察券・お薬手帳・保険証の保管場所", "md"),
      f("memo", "メモ（介護の窓口・事前指示書の場所 等）", "full"),
    ],
  },
  {
    type: "contact",
    label: "連絡先・専門家",
    description:
      "家族が頼れる専門家・担当者を記録します。氏名や連絡先は空欄のまま印刷し、手書きで記入することもできます。",
    fields: [
      fr("category", "区分", "md", [
        "司法書士",
        "税理士",
        "弁護士",
        "行政書士",
        "FP",
        "保険担当",
        "証券担当",
        "銀行担当",
        "その他",
      ]),
      fh("name", "氏名・事務所", "md"),
      fh("contact", "連絡先", "md"),
      f("memo", "メモ", "full"),
    ],
  },
  {
    type: "important_docs",
    label: "重要書類・貴重品",
    description:
      "パスポート・マイナンバーカード・実印・印鑑登録カード・各種保証書・年金手帳など、手続きに必要な書類や貴重品の「保管場所」を1つの欄にまとめて記録します。貸金庫を契約している場合は、その銀行・場所と鍵/カードの所在も残します。番号や暗証そのものは書かず、在りかだけを残します（遺言書・エンディングノートがあればその場所も。鍵や暗証は別途共有）。",
    singleEntry: true,
    fields: [
      fr(
        "body",
        "書類・貴重品と保管場所（パスポート・実印・保証書・権利証・遺言書・貸金庫 等）",
        "full",
      ),
    ],
  },
  {
    type: "free_note",
    label: "自由メモ",
    description:
      "他のカテゴリに当てはまらない資産・契約・引き継ぎ事項を記録します。例: 会員権（ゴルフ・リゾート等）／定期的な支払い（駐車場・習い事 等）／ペットの引き継ぎ など。",
    // §5 末尾: 任意フィールドを追加できる自由メモ型。
    allowCustomFields: true,
    fields: [fr("title", "タイトル", "md"), f("body", "内容", "full")],
  },
];

export const RECORD_TYPE_MAP: Record<string, RecordTypeDef> =
  Object.fromEntries(RECORD_TYPES.map((t) => [t.type, t]));

export function getTypeDef(type: string): RecordTypeDef | undefined {
  return RECORD_TYPE_MAP[type];
}
