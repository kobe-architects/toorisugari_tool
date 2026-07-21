import { useEffect, useState } from 'react';
import { api } from '@shared/api';
import type { ProfitAnalysisDTO, ProfitRow } from '@shared/types';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

const selectStyle: React.CSSProperties = {
  background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10,
  padding: '8px 12px', fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', cursor: 'pointer',
};

function Money({ v, bold }: { v: number; bold?: boolean }) {
  const neg = v < 0;
  return (
    <span className="price" style={{ color: neg ? 'var(--accent)' : 'var(--ink)', fontWeight: bold ? 800 : 700 }}>
      {neg ? '−' : ''}<span className="yen">¥</span>{yen(Math.abs(v))}
    </span>
  );
}

/** 損益分析：カテゴリ別・商品別の粗利、経費内訳、月次利益率の推移。 */
export function ProfitAnalysisView() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<ProfitAnalysisDTO | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.analytics.profitAnalysis(year).then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [year]);

  const years = data?.available_years ?? [year];

  if (error) return <div className="ticket" style={{ padding: 20, color: 'var(--accent)' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 年選択 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <select style={selectStyle} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>カテゴリ別・商品別の原価は販売時の自動計上分（茶葉・物販）</span>
      </div>

      {!data ? (
        <div className="ticket" style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
      ) : (
        <>
          {/* 年間サマリー */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <div className="ticket" style={{ padding: '16px 20px' }}>
              <div className="eyebrow" style={{ fontSize: 10 }}>売上（{data.year}年）</div>
              <div style={{ marginTop: 8 }}><span className="stat-num" style={{ fontSize: 24 }}>¥{yen(data.summary.sales)}</span></div>
            </div>
            <div className="ticket" style={{ padding: '16px 20px' }}>
              <div className="eyebrow" style={{ fontSize: 10 }}>原価（自動＋手入力）</div>
              <div style={{ marginTop: 8 }}><span className="stat-num" style={{ fontSize: 24 }}>¥{yen(data.summary.cost)}</span></div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 4 }}>自動 ¥{yen(data.summary.cost_auto)} ／ 手入力 ¥{yen(data.summary.cost_manual)}</div>
            </div>
            <div className="ticket" style={{ padding: '16px 20px', background: 'var(--card-2)' }}>
              <div className="eyebrow" style={{ fontSize: 10 }}>粗利益</div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-num" style={{ fontSize: 24, color: data.summary.gross < 0 ? 'var(--accent)' : 'var(--ink)' }}>
                  {data.summary.gross < 0 ? '−' : ''}¥{yen(Math.abs(data.summary.gross))}
                </span>
                {data.summary.gross_margin != null && <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 700 }}>{data.summary.gross_margin}%</span>}
              </div>
            </div>
            <div className="ticket" style={{ padding: '16px 20px', background: 'var(--card-2)' }}>
              <div className="eyebrow" style={{ fontSize: 10 }}>営業利益</div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-num" style={{ fontSize: 24, color: data.summary.operating < 0 ? 'var(--accent)' : 'var(--ink)' }}>
                  {data.summary.operating < 0 ? '−' : ''}¥{yen(Math.abs(data.summary.operating))}
                </span>
                {data.summary.operating_margin != null && <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 700 }}>{data.summary.operating_margin}%</span>}
              </div>
            </div>
          </div>

          {/* カテゴリ別 粗利 */}
          <Panel title="カテゴリ別 粗利" sub="売上構成比と、自動計上原価を差し引いた粗利益・粗利率">
            {data.categories.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>会計データがありません</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px 120px 90px', fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.08em', padding: '0 12px 10px' }}>
                  <span>カテゴリ</span>
                  <span style={{ textAlign: 'right' }}>構成比</span>
                  <span style={{ textAlign: 'right' }}>売上</span>
                  <span style={{ textAlign: 'right' }}>原価(自動)</span>
                  <span style={{ textAlign: 'right', color: 'var(--brown)' }}>粗利益</span>
                  <span style={{ textAlign: 'right' }}>粗利率</span>
                </div>
                {data.categories.map((c) => (
                  <div key={c.label} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px 120px 90px', alignItems: 'center', padding: '10px 12px', borderTop: '1px dashed var(--line-2)' }}>
                    <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>{c.label}</span>
                      <span style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--paper-2)', overflow: 'hidden', maxWidth: 220 }}>
                        <span style={{ display: 'block', width: `${c.share}%`, height: '100%', background: 'var(--brown-2)', borderRadius: 3 }} />
                      </span>
                    </span>
                    <span style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>{c.share}%</span>
                    <span style={{ textAlign: 'right' }}><Money v={c.sales} /></span>
                    <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(c.cost_auto)}</span>
                    <span style={{ textAlign: 'right' }}><Money v={c.gross} bold /></span>
                    <span style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-mute)' }}>{c.margin != null ? `${c.margin}%` : '—'}</span>
                  </div>
                ))}
              </>
            )}
          </Panel>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, alignItems: 'start' }}>
            {/* 商品別 粗利ランキング */}
            <Panel title="商品別 粗利ランキング" sub="粗利益の大きい順（上位20品）">
              {data.products.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>会計データがありません</div>
              ) : (
                <>
                  <div style={{ display: 'flex', fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.08em', padding: '0 0 10px' }}>
                    <span style={{ width: 28 }}>#</span>
                    <span style={{ flex: 1 }}>商品名</span>
                    <span style={{ width: 56, textAlign: 'right' }}>数量</span>
                    <span style={{ width: 92, textAlign: 'right' }}>売上</span>
                    <span style={{ width: 92, textAlign: 'right' }}>原価(自動)</span>
                    <span style={{ width: 92, textAlign: 'right' }}>粗利益</span>
                    <span style={{ width: 58, textAlign: 'right' }}>粗利率</span>
                  </div>
                  {data.products.map((p, i) => (
                    <div key={`${p.name}-${i}`} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderTop: '1px dashed var(--line-2)' }}>
                      <span style={{ width: 28, fontFamily: 'var(--mincho)', fontWeight: 800, fontSize: 14, color: i === 0 ? 'var(--accent)' : 'var(--ink-mute)' }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{p.category}</span>
                      </span>
                      <span style={{ width: 56, textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>{p.qty}</span>
                      <span style={{ width: 92, textAlign: 'right', fontSize: 12.5 }} className="price"><span className="yen">¥</span>{yen(p.sales)}</span>
                      <span style={{ width: 92, textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>¥{yen(p.cost_auto)}</span>
                      <span style={{ width: 92, textAlign: 'right' }}><Money v={p.gross} /></span>
                      <span style={{ width: 58, textAlign: 'right', fontSize: 11.5, color: 'var(--ink-mute)' }}>{p.margin != null ? `${p.margin}%` : '—'}</span>
                    </div>
                  ))}
                </>
              )}
            </Panel>

            {/* 経費内訳 */}
            <Panel title="経費・原価の内訳" sub="経費画面の名目別合計（出店料などの自動計上含む）">
              {data.expenses.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>登録がありません</div>
              ) : (
                <>
                  {data.expenses.map((e) => (
                    <div key={e.category} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px dashed var(--line-2)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, color: e.type === 'cost' ? 'var(--gold)' : 'var(--ink-mute)', border: `1px solid ${e.type === 'cost' ? 'var(--gold)' : 'var(--line-2)'}`, borderRadius: 6, padding: '2px 7px' }}>
                        {e.type === 'cost' ? '原価' : '経費'}
                      </span>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.category}</span>
                      <span className="price" style={{ fontSize: 13.5 }}><span className="yen">¥</span>{yen(e.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0 2px', borderTop: '2px solid var(--line-2)', marginTop: 4 }}>
                    <span style={{ flex: 1, fontWeight: 800, fontSize: 13.5 }}>合計</span>
                    <Money v={data.expenses.reduce((s, e) => s + e.amount, 0)} bold />
                  </div>
                </>
              )}
            </Panel>
          </div>

          {/* 月次 利益率推移 */}
          <Panel title="利益率の推移（月次）" sub="粗利率・営業利益率（売上のある月のみ）">
            <MarginChart rows={data.monthly} />
          </Panel>
        </>
      )}
    </div>
  );
}

/** 粗利率・営業利益率(%)の月次折れ線。売上のない月は点を打たない。 */
function MarginChart({ rows }: { rows: ProfitRow[] }) {
  const W = 860, H = 260, padL = 56, padR = 16, padT = 18, padB = 34;
  const series = [
    { key: 'gross_margin' as const, label: '粗利率', color: 'var(--gold)' },
    { key: 'operating_margin' as const, label: '営業利益率', color: 'var(--accent)' },
  ];
  const vals = rows.flatMap((r) => [r.gross_margin, r.operating_margin]).filter((v): v is number => v != null);
  if (vals.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>売上データがありません</div>;
  }
  const rawMax = Math.max(100, ...vals);
  const rawMin = Math.min(0, ...vals);
  const span = rawMax - rawMin || 1;
  const yMax = rawMax + span * 0.06;
  const yMin = rawMin - (rawMin < 0 ? span * 0.06 : 0);

  const x = (i: number) => padL + (W - padL - padR) * (rows.length > 1 ? i / (rows.length - 1) : 0);
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - yMin) / (yMax - yMin));
  // 値のある月だけを線で結ぶ（欠測月で線を切る）
  const path = (key: 'gross_margin' | 'operating_margin') => {
    let d = '';
    let pen = false;
    rows.forEach((r, i) => {
      const v = r[key];
      if (v == null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };
  const ticks = [yMax, yMax - (yMax - yMin) / 2, yMin];

  return (
    <div>
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
            <text x={padL - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-mute)" fontFamily="var(--gothic)">{Math.round(v)}%</text>
          </g>
        ))}
        {series.map((s) => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) => rows.map((r, i) => (
          r[s.key] != null && <circle key={`${s.key}-${i}`} cx={x(i)} cy={y(r[s.key] as number)} r="3" fill="var(--card-2)" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )))}
        {rows.map((r, i) => (
          <text key={i} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--ink-mute)" fontFamily="var(--gothic)">{r.label}</text>
        ))}
      </svg>
    </div>
  );
}
