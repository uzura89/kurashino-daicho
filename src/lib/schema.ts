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

export const RECORD_TYPES: RecordTypeDef[] = [
  {
    type: "bank_account",
    label: "銀行口座",
    fields: [
      fr("bank_name", "銀行名", "md"),
      fr("branch", "支店名", "sm"),
      fr("account_kind", "口座種別", "sm", ["普通", "当座", "貯蓄", "その他"]),
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
    type: "loan_debt",
    label: "借入・負債",
    description:
      "ローン・借金・連帯保証など「マイナスの財産」を記録します。相続放棄（原則3か月）を判断する材料になるため、把握している範囲で残しておきます。",
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
    type: "subscription",
    label: "サブスク",
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
    type: "securities_account",
    label: "証券口座",
    fields: [
      fr("broker", "証券会社名", "md"),
      f("holdings", "保有概要", "full"),
      f("memo", "メモ", "full"),
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
    type: "pension",
    label: "年金",
    fields: [
      fr("kind", "種別", "sm", [
        "国民年金",
        "厚生年金",
        "共済年金",
        "企業年金",
        "iDeCo",
        "その他",
      ]),
      fr("receiving_account", "受取口座", "md"),
      f("memo", "メモ", "full"),
    ],
  },
  {
    type: "real_estate",
    label: "不動産",
    fields: [
      fr("location", "所在地", "full"),
      f("kind", "種別", "sm", [
        "土地",
        "建物",
        "マンション（区分所有）",
        "その他",
      ]),
      fr("owner", "名義", "sm"),
      f("loan", "ローンの有無", "sm", ["なし", "あり"]),
      f("memo", "登記・メモ（相続登記の期限 等）", "full"),
    ],
  },
  {
    type: "device_account",
    label: "端末・アカウント",
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
      fr("account_email", "Apple ID / Googleアカウント（メール）", "lg"),
      f("legacy_contact", "メモ", "full"),
    ],
  },
  {
    type: "contact",
    label: "連絡先・専門家",
    fields: [
      f("category", "区分", "md", [
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
      fr("name", "氏名・事務所", "md"),
      fr("contact", "連絡先", "md"),
      f("memo", "メモ", "full"),
    ],
  },
  {
    type: "free_note",
    label: "自由メモ",
    description:
      "他のカテゴリに当てはまらない資産・契約・引き継ぎ事項を記録します。例: 暗号資産（取引所アカウント）／電子マネー・ポイント・マイルの残高／貸金庫／会員権（ゴルフ・リゾート等）／定期的な支払い（駐車場・習い事 等）／ドメイン・ブログ等のデジタル資産 など。",
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
