import { useEffect, useState } from 'react';
import { api } from '@shared/api';
import type { ProfitDTO, ProfitRow } from '@shared/types';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

const selectStyle: React.CSSProperties = {
  background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10,
  padding: '8px 12px', fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', cursor: 'pointer',
};

const COLS = '60px 1fr 1fr 1fr 1fr 1fr';

/** 金額表示。マイナスは朱色＋「−」。 */
function Money({ v, bold }: { v: number; bold?: boolean }) {
  const neg = v < 0;
  return (
    <span className="price" style={{ color: neg ? 'var(--accent)' : 'var(--ink)', fontWeight: bold ? 800 : 700 }}>
      {neg ? '−' : ''}<span className="yen">¥</span>{yen(Math.abs(v))}
    </span>
  );
}

/** 年間サマリーカード。 */
function SummaryCard({ label, value, margin, strong }: { label: string; value: number; margin?: number | null; strong?: boolean }) {
  return (
    <div className="ticket" style={{ padding: '16px 20px', background: strong ? 'var(--card-2)' : 'var(--card)' }}>
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="stat-num" style={{ fontSize: 26, color: value < 0 ? 'var(--accent)' : 'var(--ink)' }}>
          {value < 0 ? '−' : ''}¥{yen(Math.abs(value))}
        </span>
        {margin != null && <span style={{ fontSize: 12.5, color: 'var(--ink-mute)', fontWeight: 700 }}>{margin}%</span>}
      </div>
    </div>
  );
}

export function ProfitView() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState<'table' | 'graph'>('table');
  const [data, setData] = useState<ProfitDTO | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.analytics.profit(year).then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [year]);

  const years = data?.available_years ?? [year];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 年間サマリー：粗利益・営業利益を強調 */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <SummaryCard label={`売上（${data.year}年）`} value={data.total_sales} />
          <SummaryCard label="粗利益（売上 − 原価）" value={data.total_gross} margin={data.gross_margin} strong />
          <SummaryCard label="営業利益（粗利益 − 経費）" value={data.total_operating} margin={data.operating_margin} strong />
        </div>
      )}

      <Panel
        title="損益（月別）"
        sub="粗利益 = 売上 − 原価 ／ 営業利益 = 粗利益 − 経費"
        right={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 9, overflow: 'hidden' }}>
              {(['table', 'graph'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className="btn" style={{ padding: '7px 16px', borderRadius: 0, fontSize: 12.5, cursor: 'pointer', background: view === v ? 'var(--bar)' : 'transparent', color: view === v ? 'var(--bar-ink)' : 'var(--ink-soft)' }}>
                  {v === 'table' ? '表' : 'グラフ'}
                </button>
              ))}
            </div>
            <select style={selectStyle} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
          </div>
        }
      >
        {error && <div style={{ color: 'var(--accent)', fontSize: 13, padding: 8 }}>{error}</div>}
        {!data ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
        ) : view === 'graph' ? (
          <ProfitChart rows={data.rows} />
        ) : (
          <div style={{ minWidth: 720 }}>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.08em', padding: '0 12px 10px' }}>
              <span>月</span>
              <span style={{ textAlign: 'right' }}>売上</span>
              <span style={{ textAlign: 'right' }}>原価</span>
              <span style={{ textAlign: 'right', color: 'var(--brown)' }}>粗利益</span>
              <span style={{ textAlign: 'right' }}>経費</span>
              <span style={{ textAlign: 'right', color: 'var(--brown)' }}>営業利益</span>
            </div>
            {data.rows.map((r) => {
              const empty = r.sales === 0 && r.cost === 0 && r.expense === 0;
              return (
                <div key={r.month} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '10px 12px', borderTop: '1px dashed var(--line-2)', opacity: empty ? 0.5 : 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.label}</span>
                  <span style={{ textAlign: 'right' }}><Money v={r.sales} /></span>
                  <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(r.cost)}</span>
                  <span style={{ textAlign: 'right' }}><Money v={r.gross} /></span>
                  <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(r.expense)}</span>
                  <span style={{ textAlign: 'right' }}><Money v={r.operating} bold /></span>
                </div>
              );
            })}
            {/* 年間合計 */}
            <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '14px 12px 4px', borderTop: '2px solid var(--line-2)', marginTop: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>年間</span>
              <span style={{ textAlign: 'right' }}><Money v={data.total_sales} bold /></span>
              <span style={{ textAlign: 'right' }} className="price" ><span className="yen">¥</span>{yen(data.total_cost)}</span>
              <span style={{ textAlign: 'right' }}><Money v={data.total_gross} bold /></span>
              <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(data.total_expense)}</span>
              <span style={{ textAlign: 'right' }}><Money v={data.total_operating} bold /></span>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

/** 月次の 売上 / 粗利益 / 営業利益 を折れ線で表示（マイナス対応・0基準線つき）。 */
function ProfitChart({ rows }: { rows: ProfitRow[] }) {
  const W = 860, H = 320, padL = 70, padR = 16, padT = 18, padB = 34;
  const series = [
    { key: 'sales' as const, label: '売上', color: 'var(--brown)' },
    { key: 'gross' as const, label: '粗利益', color: 'var(--gold)' },
    { key: 'operating' as const, label: '営業利益', color: 'var(--accent)' },
  ];
  const vals = rows.flatMap((r) => [r.sales, r.gross, r.operating]);
  const rawMax = Math.max(0, ...vals);
  const rawMin = Math.min(0, ...vals);
  const span = rawMax - rawMin || 1;
  const yMax = rawMax + span * 0.08;
  const yMin = rawMin - (rawMin < 0 ? span * 0.08 : 0);

  const x = (i: number) => padL + (W - padL - padR) * (rows.length > 1 ? i / (rows.length - 1) : 0);
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - yMin) / (yMax - yMin));
  const line = (key: 'sales' | 'gross' | 'operating') => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(r[key]).toFixed(1)}`).join(' ');

  const ticks = [yMax, yMax - (yMax - yMin) / 2, yMin];

  return (
    <div>
      {/* 凡例 */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 8 }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>
            <span style={{ width: 18, height: 3, background: s.color, borderRadius: 2 }} />{s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray={Math.abs(v) < 1 ? '0' : '3 4'} vectorEffect="non-scaling-stroke" />
            <text x={padL - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-mute)" fontFamily="var(--gothic)">{Math.round(v).toLocaleString()}</text>
          </g>
        ))}
        {series.map((s) => (
          <path key={s.key} d={line(s.key)} fill="none" stroke={s.color} strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) => rows.map((r, i) => (
          <circle key={`${s.key}-${i}`} cx={x(i)} cy={y(r[s.key])} r="3" fill="var(--card-2)" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )))}
        {rows.map((r, i) => (
          <text key={i} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--ink-mute)" fontFamily="var(--gothic)">{r.label}</text>
        ))}
        <text x={padL - 10} y={padT - 4} textAnchor="end" fontSize="10" fill="var(--ink-mute)">(円)</text>
      </svg>
    </div>
  );
}
