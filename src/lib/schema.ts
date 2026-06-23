// §5 型定義（スターターセット）。
// 公開/非公開の区分は廃止。秘匿情報（パスワード・PIN・ログインID・口座番号・各種番号など）は
// 台帳の対象から外し、地図情報（どこに何があるか）だけを持つ。鍵は別途共有する。
import type { FieldWidth, RecordTypeDef } from './types';

const f = (key: string, label: string, width?: FieldWidth) => ({ key, label, width });
// 必須項目（赤い * 表示・入力完了判定の対象）
const fr = (key: string, label: string, width?: FieldWidth) => ({ key, label, width, required: true });

export const RECORD_TYPES: RecordTypeDef[] = [
  {
    type: 'bank_account',
    label: '銀行口座',
    fields: [
      fr('bank_name', '銀行名', 'md'),
      fr('branch', '支店名', 'sm'),
      fr('account_kind', '口座種別', 'xs'),
      f('memo', 'メモ（代理人届の有無 等）', 'full'),
    ],
  },
  {
    type: 'credit_card',
    label: 'クレジットカード',
    fields: [
      fr('issuer', 'カード会社', 'md'),
      fr('last4', '下4桁', 'xs'),
      f('debit_account', '引落し口座', 'md'),
      f('memo', 'メモ（解約前に引落しを付け替える 等）', 'full'),
    ],
  },
  {
    type: 'subscription',
    label: 'サブスク',
    fields: [
      fr('service_name', 'サービス名', 'md'),
      f('price', '料金（月額/年額）', 'sm'),
      fr('billing_route', '課金経路（App Store / Google Play / カード / キャリア）', 'md'),
      f('linked_card', '紐づくカード/口座', 'sm'),
      fr('cancel_method', '解約方法・URL', 'full'),
    ],
  },
  {
    type: 'securities_account',
    label: '証券口座',
    fields: [
      fr('broker', '証券会社名', 'md'),
      f('holdings', '保有概要', 'full'),
      f('memo', 'メモ', 'full'),
    ],
  },
  {
    type: 'insurance',
    label: '保険',
    fields: [
      fr('insurer', '保険会社名', 'md'),
      fr('kind', '種別（生命/医療/がん 等）', 'sm'),
      f('beneficiary', '受取人', 'sm'),
      fr('policy_location', '証券の在処', 'md'),
      f('memo', 'メモ（請求期限の注意 等）', 'full'),
    ],
  },
  {
    type: 'pension',
    label: '年金',
    fields: [
      fr('kind', '種別（国民/厚生 等）', 'sm'),
      fr('receiving_account', '受取口座', 'md'),
      f('memo', 'メモ', 'full'),
    ],
  },
  {
    type: 'real_estate',
    label: '不動産',
    fields: [
      fr('location', '所在地', 'full'),
      f('kind', '種別（土地/建物）', 'sm'),
      fr('owner', '名義', 'sm'),
      f('loan', 'ローンの有無', 'sm'),
      f('memo', '登記・メモ（相続登記の期限 等）', 'full'),
    ],
  },
  {
    type: 'device_account',
    label: '端末・アカウント',
    fields: [
      fr('kind', '種別（iPhone / Mac / Android / Googleアカウント 等）', 'md'),
      fr('account_email', 'Apple ID / Googleアカウント（メール）', 'lg'),
      f('legacy_contact', 'Legacy Contact / 無効化管理ツールの設定有無', 'full'),
    ],
  },
  {
    type: 'contact',
    label: '連絡先・専門家',
    fields: [
      f('category', '区分（司法書士 / 税理士 / 保険担当 等）', 'sm'),
      fr('name', '氏名・事務所', 'md'),
      fr('contact', '連絡先', 'md'),
      f('memo', 'メモ', 'full'),
    ],
  },
  {
    type: 'free_note',
    label: '自由メモ',
    // §5 末尾: 任意フィールドを追加できる自由メモ型。
    allowCustomFields: true,
    fields: [
      fr('title', 'タイトル', 'md'),
      f('body', '内容', 'full'),
    ],
  },
];

export const RECORD_TYPE_MAP: Record<string, RecordTypeDef> = Object.fromEntries(
  RECORD_TYPES.map((t) => [t.type, t]),
);

export function getTypeDef(type: string): RecordTypeDef | undefined {
  return RECORD_TYPE_MAP[type];
}
