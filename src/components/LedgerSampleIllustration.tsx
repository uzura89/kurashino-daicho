/**
 * トップページ用のイラスト。OGP画像と同じ意匠（明朝・濃紺インク・紙のシート）で、
 * 台帳に実際どんな内容を書くのかが分かる「記入例」を横長の1枚のシートとして見せる。
 */

const ink = "#222d42";
const body = "#333d52";
const muted = "#8592a5";
const paperEdge = "#d3dbe4";
const paperBack = "#eaeef3";
const lineLight = "#e7ecf2";
const lineMid = "#cdd7e1";
const mincho = '"BIZ UDPMincho", serif';

type Entry = { main: string; sub: string };

const COLUMNS: { title: string; entries: Entry[] }[] = [
  {
    title: "銀行口座",
    entries: [
      { main: "〇〇銀行　△△支店（普通）", sub: "通帳・印鑑は自宅の引き出し" },
      { main: "□□銀行　◇◇支店（普通）", sub: "ネット用・カードのみ" },
    ],
  },
  {
    title: "サブスク・定期課金",
    entries: [
      { main: "動画配信サービス　月額1,490円", sub: "カード払い・解約はアプリから" },
      { main: "音楽ストリーミング　月額980円", sub: "カード払い" },
    ],
  },
  {
    title: "保険",
    entries: [
      { main: "医療保険（〇〇生命）", sub: "受取人: 配偶者" },
      { main: "火災保険（△△損保）", sub: "証券は自宅の金庫に保管" },
    ],
  },
];

export default function LedgerSampleIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 880 300"
      role="img"
      aria-label="台帳の記入例。銀行口座は銀行名・支店・保管場所、サブスクはサービス名と月額、保険は契約内容と証券の保管場所を一覧にする。"
      className={className}
    >
      <defs>
        <filter id="lsi-shadow" x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="11"
            floodColor={ink}
            floodOpacity="0.13"
          />
        </filter>
      </defs>

      {/* 背面の紙（少し傾けて重なりを出す） */}
      <rect
        x="52"
        y="28"
        width="784"
        height="248"
        rx="10"
        fill={paperBack}
        transform="rotate(-0.9 444 152)"
      />
      {/* 台帳シート本体 */}
      <rect
        x="44"
        y="20"
        width="792"
        height="256"
        rx="10"
        fill="#fff"
        stroke={paperEdge}
        filter="url(#lsi-shadow)"
      />

      {/* シート見出し */}
      <text
        x="76"
        y="64"
        fontSize="22"
        fill={ink}
        fontFamily={mincho}
        letterSpacing="4"
      >
        資産・契約台帳
      </text>
      <text
        x="804"
        y="62"
        textAnchor="end"
        fontSize="11"
        fill={muted}
        fontFamily={mincho}
        letterSpacing="1"
      >
        — どこに何があるかの一覧 —
      </text>
      <line x1="74" y1="78" x2="806" y2="78" stroke={ink} strokeWidth="1.2" />

      {/* カテゴリ3列 */}
      {COLUMNS.map((col, ci) => {
        const x = 76 + ci * 260;
        return (
          <g key={col.title}>
            <text
              x={x}
              y="114"
              fontSize="15"
              fill={ink}
              fontFamily={mincho}
              letterSpacing="2"
            >
              {col.title}
            </text>
            <line
              x1={x}
              y1="124"
              x2={x + 224}
              y2="124"
              stroke={lineMid}
              strokeWidth="1"
            />
            {col.entries.map((e, ei) => {
              const y = 154 + ei * 62;
              return (
                <g key={e.main}>
                  <text x={x} y={y} fontSize="13" fill={body}>
                    {e.main}
                  </text>
                  <text x={x} y={y + 19} fontSize="11.5" fill={muted}>
                    {e.sub}
                  </text>
                  {ei < col.entries.length - 1 && (
                    <line
                      x1={x}
                      y1={y + 34}
                      x2={x + 224}
                      y2={y + 34}
                      stroke={lineLight}
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}
            {/* 列の区切り線 */}
            {ci < COLUMNS.length - 1 && (
              <line
                x1={x + 242}
                y1="100"
                x2={x + 242}
                y2="248"
                stroke={lineLight}
                strokeWidth="1"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
