// §5 台帳データモデル（確定）
// 公開/非公開の区分は廃止。秘匿情報（パスワード等）はそもそも台帳に保存しない方針。
// 台帳は「どこに何があるか」を示す地図であり、鍵（秘匿情報）は別途共有する。

/** PCレイアウトでの入力欄の相対幅（12カラムグリッド上の目安）。 */
export type FieldWidth = 'xs' | 'sm' | 'md' | 'lg' | 'full';

export interface FieldDef {
  /** 安定キー（保存・エクスポートで使う識別子。日本語ラベルとは別） */
  key: string;
  /** 画面・エクスポートに出す日本語ラベル */
  label: string;
  /** PCレイアウトでの入力欄の相対幅。未指定は 'md'。 */
  width?: FieldWidth;
  /** 必須項目か（赤い * 表示。入力完了判定はこれが入っているかで見る）。未指定は任意。 */
  required?: boolean;
  /** 指定すると自由入力ではなく選択式（プルダウン）になる。 */
  options?: string[];
  /** 印刷後の手書き記入を想定する項目。空欄でもPDF・プレビューに記入欄として出す。 */
  handwrite?: boolean;
}

export interface RecordTypeDef {
  /** 型キー（bank_account 等） */
  type: string;
  /** 日本語表示名 */
  label: string;
  /** この型が持つフィールド集合 */
  fields: FieldDef[];
  /** カテゴリ上部に出す補足・記入例（任意） */
  description?: string;
  /** 自由メモ型のように任意フィールド追加を許すか */
  allowCustomFields?: boolean;
  /** アイテムを複数持たず、1件の自由記載だけにするか（重要書類など） */
  singleEntry?: boolean;
}

export interface FieldValue {
  value: string;
  /** 自由メモ型などでユーザーが付けたラベル（既定フィールドにはない） */
  customLabel?: string;
}

export interface LedgerRecord {
  id: string;
  type: string;
  /** fieldKey -> 値。自由フィールドは "custom:<uuid>" をキーにする */
  values: Record<string, FieldValue>;
  createdAt: number;
  updatedAt: number;
}
