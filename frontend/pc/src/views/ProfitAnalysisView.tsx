import { useEffect, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type { BreakEvenDTO } from '@shared/types';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

const selectStyle: React.CSSProperties = {
  background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10,
  padding: '8px 12px', fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', cursor: 'pointer',
};

/** 損益分岐分析：分岐点・予算に対する進捗と、商品別「あと何杯で達成」。 */
export function ProfitAnalysisView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<BreakEvenDTO | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    api.analytics.breakEven(year, month).then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const years = data?.available_years ?? [year];

  if (error) return <div className="ticket" style={{ padding: 20, color: 'var(--accent)' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 年月選択 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select style={selectStyle} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
        <select style={selectStyle} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>変動費 = 原価（自動計上＋手入力） ／ 固定費 = 経費（出店料含む）</span>
      </div>

      {!data ? (
        <div className="ticket" style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
      ) : (
        <>
          {/* サマリーカード */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <SummaryCard label={`売上（${data.month}月）`} main={`¥${yen(data.sales)}`} />
            <SummaryCard
              label="損益分岐点売上高"
              main={data.break_even_sales != null ? `¥${yen(data.break_even_sales)}` : '—'}
              sub={data.break_even_achievement != null ? `達成率 ${data.break_even_achievement}%` : data.fixed_cost === 0 ? '固定費の登録がありません' : '売上データ不足で算出できません'}
              strong
              good={data.uncovered <= 0}
            />
            <SummaryCard
              label="売上予算"
              main={data.target_sales != null ? `¥${yen(data.target_sales)}` : '未設定'}
              sub={data.target_achievement != null ? `達成率 ${data.target_achievement}%` : '下の欄から登録できます'}
              strong
              good={data.target_sales != null && data.sales >= data.target_sales}
            />
            <SummaryCard
              label="営業利益（現時点）"
              main={`${data.operating < 0 ? '−' : ''}¥${yen(Math.abs(data.operating))}`}
              sub={data.uncovered > 0 ? `黒字まであと ¥${yen(data.uncovered)}` : '損益分岐点を超えています'}
              accent={data.operating < 0}
            />
          </div>

          {/* 進捗バー */}
          <Panel title="進捗" sub="売上の現在地（▲=損益分岐点 ／ ★=予算）">
            <ProgressBar data={data} />
            <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-soft)' }}>
              <span>変動費 <b>¥{yen(data.var_cost)}</b>（自動 ¥{yen(data.var_cost_auto)}・手入力 ¥{yen(data.var_cost_manual)}）</span>
              <span>固定費 <b>¥{yen(data.fixed_cost)}</b></span>
              <span>貢献利益 <b>¥{yen(data.contribution)}</b>{data.cm_ratio != null && <>（率 {data.cm_ratio}%）</>}</span>
            </div>
          </Panel>

          {/* 予算登録 */}
          <BudgetPanel year={data.year} month={data.month} current={data.target_sales} onSaved={load} />

          {/* 商品別 あと何杯 */}
          <Panel
            title="商品別 達成シミュレーション"
            sub="この商品だけを追加で売った場合に必要な杯数（分岐点＝1杯あたり貢献利益で計算 ／ 予算＝販売価格で計算）"
          >
            {data.products.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>表示できる商品がありません</div>
            ) : (
              <div style={{ minWidth: 860 }}>
                <div style={{ display: 'grid', gridTemplateColumns: GRID, fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.08em', padding: '0 12px 10px' }}>
                  <span>商品</span>
                  <span style={{ textAlign: 'right' }}>価格</span>
                  <span style={{ textAlign: 'right' }}>変動費/杯</span>
                  <span style={{ textAlign: 'right' }}>貢献利益/杯</span>
                  <span style={{ textAlign: 'right' }}>今月販売</span>
                  <span style={{ textAlign: 'right', color: 'var(--brown)' }}>分岐点まで</span>
                  <span style={{ textAlign: 'right', color: 'var(--brown)' }}>予算まで</span>
                </div>
                {data.products.map((p) => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '10px 12px', borderTop: '1px dashed var(--line-2)' }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{p.category}</span>
                    </span>
                    <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(p.price)}</span>
                    <span style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>¥{p.unit_var_cost.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                    <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{p.unit_cm.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                    <span style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>{p.sold_qty}杯</span>
                    <Cups n={p.cups_to_break_even} />
                    <Cups n={p.cups_to_target} unset={data.target_sales == null} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

const GRID = '1.3fr 90px 100px 110px 90px 130px 130px';

function SummaryCard({ label, main, sub, strong, good, accent }: { label: string; main: string; sub?: string; strong?: boolean; good?: boolean; accent?: boolean }) {
  return (
    <div className="ticket" style={{ padding: '16px 20px', background: strong ? 'var(--card-2)' : 'var(--card)' }}>
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ marginTop: 8 }}>
        <span className="stat-num" style={{ fontSize: 23, color: accent ? 'var(--accent)' : 'var(--ink)' }}>{main}</span>
      </div>
      {sub && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 5, color: good ? 'var(--leaf)' : 'var(--ink-mute)' }}>{sub}</div>}
    </div>
  );
}

/** 売上・分岐点・予算を1本のバーで可視化。 */
function ProgressBar({ data }: { data: BreakEvenDTO }) {
  const max = Math.max(data.sales, data.break_even_sales ?? 0, data.target_sales ?? 0, 1) * 1.08;
  const pct = (v: number) => Math.min(100, (v / max) * 100);
  const beOk = data.break_even_sales != null && data.sales >= data.break_even_sales;

  return (
    <div style={{ padding: '18px 6px 6px' }}>
      <div style={{ position: 'relative', height: 26, background: 'var(--paper-2)', borderRadius: 8 }}>
        {/* 売上バー */}
        <div style={{ position: 'absolute', inset: 0, width: `${pct(data.sales)}%`, background: beOk ? 'var(--leaf)' : 'var(--brown-2)', borderRadius: 8, transition: 'width .3s' }} />
        {/* 分岐点マーカー */}
        {data.break_even_sales != null && (
          <Marker left={pct(data.break_even_sales)} symbol="▲" label={`分岐点 ¥${yen(data.break_even_sales)}`} color="var(--accent)" />
        )}
        {/* 予算マーカー */}
        {data.target_sales != null && (
          <Marker left={pct(data.target_sales)} symbol="★" label={`予算 ¥${yen(data.target_sales)}`} color="var(--gold)" below />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 12, color: 'var(--ink-soft)', fontWeight: 700 }}>
        <span>売上 ¥{yen(data.sales)}</span>
        {data.break_even_sales != null && data.uncovered > 0 && <span>分岐点まで あと¥{yen(Math.max(0, data.break_even_sales - data.sales))}</span>}
        {data.target_sales != null && data.sales < data.target_sales && <span>予算まで あと¥{yen(data.target_sales - data.sales)}</span>}
      </div>
    </div>
  );
}

function Marker({ left, symbol, label, color, below }: { left: number; symbol: string; label: string; color: string; below?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: `${left}%`, top: 0, bottom: 0, width: 0 }}>
      <div style={{ position: 'absolute', top: -2, bottom: -2, left: -1, width: 2, background: color, borderRadius: 1 }} />
      <div style={{ position: 'absolute', [below ? 'bottom' : 'top']: -22, left: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 10.5, fontWeight: 700, color }}>
        {symbol} {label}
      </div>
    </div>
  );
}

/** 「あと◯杯」セル。0=達成済み。 */
function Cups({ n, unset }: { n: number | null; unset?: boolean }) {
  if (unset) return <span style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--ink-mute)' }}>予算未設定</span>;
  if (n == null) return <span style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--ink-mute)' }}>—</span>;
  if (n === 0) return <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--leaf)' }}>達成済み</span>;
  return (
    <span style={{ textAlign: 'right' }}>
      <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>あと</span>
      <span className="price" style={{ fontSize: 15, margin: '0 2px' }}>{n.toLocaleString()}</span>
      <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>杯</span>
    </span>
  );
}

/** 売上予算の登録・更新（0円で解除）。 */
function BudgetPanel({ year, month, current, onSaved }: { year: number; month: number; current: number | null; onSaved: () => void }) {
  const [value, setValue] = useState(current != null ? String(current) : '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(current != null ? String(current) : '');
    setMsg('');
    setError('');
  }, [current, year, month]);

  const save = async () => {
    if (busy || value === '') return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      await api.analytics.saveBudget(year, month, Number(value));
      setMsg(Number(value) > 0 ? '保存しました' : '予算を解除しました');
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="売上予算の設定" sub={`${year}年${month}月の売上目標（¥0で解除）`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 200 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mincho)', fontWeight: 700, color: 'var(--ink-soft)' }}>¥</span>
          <input className="input mincho" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))} placeholder="例：300000" style={{ paddingLeft: 30, fontSize: 17 }} />
        </div>
        <button className="btn btn-accent" onClick={save} disabled={busy || value === ''} style={{ padding: '11px 22px', fontSize: 13.5, cursor: 'pointer', opacity: busy || value === '' ? 0.5 : 1 }}>
          {busy ? '保存中…' : '保存'}
        </button>
        {msg && <span style={{ fontSize: 12.5, color: 'var(--leaf)', fontWeight: 700 }}>{msg}</span>}
        {error && <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700 }}>{error}</span>}
      </div>
    </Panel>
  );
}
