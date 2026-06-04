// PC ダッシュボード チャート部品（SVG・クラフトトーン）。元 charts.jsx を TS 移植。

const niceY = (max: number): number => {
  const p = Math.pow(10, String(Math.round(max)).length - 1);
  return Math.max(p, Math.ceil(max / p) * p);
};

interface AreaProps {
  labels: string[];
  cur: number[];
  prev?: number[];
  unit?: string;
  W?: number;
  H?: number;
}

/** 売上推移：面＋折れ線（prev があれば前期を破線で重ねる）。 */
export function AreaChart({ labels, cur, prev = [], unit = '円', W = 820, H = 300 }: AreaProps) {
  const padL = 64, padR = 14, padT = 16, padB = 34;
  const yMax = niceY(Math.max(1, ...cur, ...prev) * 1.12);
  const x = (i: number) => padL + (W - padL - padR) * (labels.length > 1 ? i / (labels.length - 1) : 0);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  const line = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line(cur)} L${x(cur.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brown)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--brown)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = yMax * (1 - i / ticks);
        const yy = padT + (H - padT - padB) * (i / ticks);
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === ticks ? '0' : '3 4'} vectorEffect="non-scaling-stroke" />
            <text x={padL - 10} y={yy + 4} textAnchor="end" fontSize="11" fill="var(--ink-mute)" fontFamily="var(--gothic)">
              {Math.round(v).toLocaleString()}
            </text>
          </g>
        );
      })}
      {prev.length > 0 && (
        <path d={line(prev)} fill="none" stroke="var(--ink-mute)" strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      )}
      <path d={area} fill="url(#areaFill)" />
      <path d={line(cur)} fill="none" stroke="var(--brown)" strokeWidth="2.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      {cur.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="var(--card-2)" stroke="var(--brown)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--ink-mute)" fontFamily="var(--gothic)">
          {l}
        </text>
      ))}
      <text x={W - padR} y={11} textAnchor="end" fontSize="11" fill="var(--ink-mute)" fontFamily="var(--gothic)">
        ({unit})
      </text>
    </svg>
  );
}

interface ColumnProps {
  labels: string[];
  data: number[];
  peak: number;
  W?: number;
  H?: number;
}

/** 時間帯別：縦棒（ピーク強調）。 */
export function ColumnChart({ labels, data, peak, W = 820, H = 240 }: ColumnProps) {
  const padL = 44, padR = 14, padT = 14, padB = 30;
  const yMax = niceY(Math.max(1, ...data) * 1.1);
  const bw = (W - padL - padR) / data.length;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 1, 2, 3].map((i) => {
        const yy = padT + (H - padT - padB) * (i / 3);
        return <line key={i} x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="var(--line)" strokeDasharray={i === 3 ? '0' : '3 4'} vectorEffect="non-scaling-stroke" />;
      })}
      {data.map((v, i) => {
        const bx = padL + bw * i + bw * 0.18;
        const w = bw * 0.64;
        const yy = y(v);
        const on = i === peak;
        return (
          <g key={i}>
            <rect x={bx} y={yy} width={w} height={H - padB - yy} rx="3" fill={on ? 'var(--accent)' : 'var(--brown-2)'} opacity={on ? 1 : 0.5} />
            <text x={bx + w / 2} y={H - 10} textAnchor="middle" fontSize="10.5" fill="var(--ink-mute)" fontFamily="var(--gothic)">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface DonutProps {
  data: { value: number; pct: number; color: string }[];
  size?: number;
  thick?: number;
  center?: [string, string];
}

/** ドーナツ（カテゴリ / 性別）。 */
export function Donut({ data, size = 200, thick = 30, center }: DonutProps) {
  const r = (size - thick) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={thick} />
      {data.map((d, i) => {
        const len = circ * (d.pct / 100);
        const off = circ * (acc / 100);
        acc += d.pct;
        return (
          <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={d.color} strokeWidth={thick} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-off} transform={`rotate(-90 ${c} ${c})`} strokeLinecap="butt" />
        );
      })}
      {center && (
        <>
          <text x={c} y={c - 2} textAnchor="middle" fontSize="13" fill="var(--ink-mute)" fontFamily="var(--gothic)" fontWeight="700">
            {center[0]}
          </text>
          <text x={c} y={c + 22} textAnchor="middle" fontSize="26" fill="var(--ink)" fontFamily="var(--mincho)" fontWeight="800">
            {center[1]}
          </text>
        </>
      )}
    </svg>
  );
}

interface HBarsRow {
  label: string;
  value: number;
  pct: number;
  color?: string;
}

/** 横棒（年代別 / カテゴリ内訳）。 */
export function HBars({ rows }: { rows: HBarsRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.pct));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 54, fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', textAlign: 'right', flexShrink: 0 }}>{r.label}</div>
          <div style={{ flex: 1, height: 18, background: 'var(--paper-2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(r.pct / max) * 100}%`, height: '100%', borderRadius: 4, background: r.color || 'var(--brown-2)' }} />
          </div>
          <div style={{ width: 56, fontSize: 12.5, textAlign: 'right', flexShrink: 0 }}>
            <span className="price" style={{ fontSize: 13 }}>{r.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 商品別ランキング表。 */
export function RankTable({ rows }: { rows: { name: string; qty: number; amt: number; pct: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.amt));
  return (
    <div>
      <div style={{ display: 'flex', fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.1em', padding: '0 0 10px' }}>
        <span style={{ width: 30 }}>#</span>
        <span style={{ flex: 1 }}>商品名</span>
        <span style={{ width: 70, textAlign: 'right' }}>数量</span>
        <span style={{ width: 110, textAlign: 'right' }}>売上</span>
        <span style={{ width: 64, textAlign: 'right' }}>構成比</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderTop: '1px dashed var(--line-2)' }}>
          <span style={{ width: 30, fontFamily: 'var(--mincho)', fontWeight: 800, fontSize: 15, color: i === 0 ? 'var(--accent)' : 'var(--ink-mute)' }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name}</div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--paper-2)', marginTop: 5, width: '72%' }}>
              <div style={{ width: `${(r.amt / max) * 100}%`, height: '100%', borderRadius: 3, background: i === 0 ? 'var(--accent)' : 'var(--brown-2)', opacity: i === 0 ? 1 : 0.55 }} />
            </div>
          </div>
          <span style={{ width: 70, textAlign: 'right', fontSize: 13, color: 'var(--ink-soft)' }}>{r.qty}</span>
          <span style={{ width: 110, textAlign: 'right' }} className="price">
            <span className="yen">¥</span>
            {r.amt.toLocaleString()}
          </span>
          <span style={{ width: 64, textAlign: 'right', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.pct}%</span>
        </div>
      ))}
    </div>
  );
}
