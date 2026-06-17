import { useEffect, useState } from 'react';
import { api } from '@shared/api';
import type { Period, SalesAnalyticsDTO } from '@shared/types';
import { AreaChart, ColumnChart, Donut, RankTable } from '../charts';
import { Panel, Legend } from '../components/Panel';
import { yen } from '../lib/format';

const PERIOD_TABS: { k: Period; label: string }[] = [
  { k: 'day', label: '日次' },
  { k: 'month', label: '月次' },
  { k: 'year', label: '年次' },
];

const COL_LABEL: Record<Period, string> = { day: '日付', month: '月', year: '年' };

const selectStyle: React.CSSProperties = {
  background: 'var(--card-2)',
  border: '1.5px solid var(--line-2)',
  borderRadius: 10,
  padding: '9px 12px',
  fontFamily: 'var(--gothic)',
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--ink)',
  cursor: 'pointer',
};

export function SalesView() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>('day');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<SalesAnalyticsDTO | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.analytics
      .sales(period, { year, month })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [period, year, month]);

  const downloadCsv = async () => {
    const blob = await api.analytics.salesCsv(period, { year, month });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <div className="ticket" style={{ padding: 20, color: 'var(--accent)' }}>{error}</div>;

  const years = data?.available_years ?? [year];
  const catCenter = data?.categories[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* period tabs + selection form */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 11, overflow: 'hidden' }}>
          {PERIOD_TABS.map((t) => (
            <button key={t.k} onClick={() => setPeriod(t.k)} className="btn" style={{ padding: '10px 22px', borderRadius: 0, fontSize: 14, cursor: 'pointer', background: t.k === period ? 'var(--bar)' : 'transparent', color: t.k === period ? 'var(--bar-ink)' : 'var(--ink-soft)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* selection form */}
        {period === 'day' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select style={selectStyle} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select style={selectStyle} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        )}
        {period === 'month' && (
          <select style={selectStyle} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        )}
        {period === 'year' && <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>年別（2026年〜）</span>}

        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-mute)' }}>
          期間合計 <span className="price" style={{ fontSize: 15, color: 'var(--ink)' }}><span className="yen">¥</span>{yen(data?.total ?? 0)}</span>
        </span>
      </div>

      {/* 売上推移：左=表 / 右=グラフ */}
      <Panel title="売上推移" sub={period === 'day' ? `${year}年${month}月 日別` : period === 'month' ? `${year}年 月別` : '年別（2026年〜）'}>
        {!data ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ width: 480, flexShrink: 0 }}>
              <TrendTable period={period} data={data} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
              <AreaChart
                labels={period === 'day' ? data.rows.map((r) => r.label.split('/')[1] ?? r.label) : data.rows.map((r) => r.label)}
                cur={data.rows.map((r) => r.sales)}
                unit="円"
              />
            </div>
          </div>
        )}
      </Panel>

      {/* 時間帯別 + カテゴリ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        <Panel title="時間帯別 売上" sub="選択期間の時間帯合計" right={data && data.total > 0 ? <span className="chip" style={{ fontSize: 11 }}>ピーク {data.hours.labels[data.hours.peak]}時台</span> : undefined}>
          {data && <ColumnChart labels={data.hours.labels} data={data.hours.data} peak={data.hours.peak} H={232} />}
        </Panel>
        <Panel title="カテゴリー別 構成比">
          {!data || data.categories.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>データなし</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Donut data={data.categories} size={172} thick={28} center={catCenter ? [catCenter.label, `${catCenter.pct}%`] : undefined} />
              <div style={{ flex: 1 }}>
                <Legend items={data.categories} />
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* 注文経路別 */}
      {data?.by_source && (
        <Panel title="注文経路別 売上" sub="直注文 / 試飲から（選択期間）">
          <div style={{ display: 'flex', gap: 24 }}>
            {data.by_source.map((s) => (
              <div key={s.key} style={{ flex: 1, borderLeft: s.key === 'tasting' ? '1px dashed var(--line-2)' : 'none', paddingLeft: s.key === 'tasting' ? 24 : 0 }}>
                <div className="eyebrow" style={{ fontSize: 10 }}>{s.label}</div>
                <div style={{ marginTop: 8 }}>
                  <span className="stat-num" style={{ fontSize: 28 }}><span style={{ fontSize: 16 }}>¥</span>{yen(s.amount)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>{s.qty}点</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* 商品別ランキング */}
      <Panel title="商品別 売上ランキング" sub="選択期間" right={<button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5, cursor: 'pointer' }} onClick={downloadCsv}>CSV出力</button>}>
        {!data || data.products.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>会計データがありません</div>
        ) : (
          <RankTable rows={data.products} />
        )}
      </Panel>
    </div>
  );
}

function TrendTable({ period, data }: { period: Period; data: SalesAnalyticsDTO }) {
  // 4列を等間隔のグリッドにし、全幅に間延びしないよう最大幅を制限
  const cols = '88px 1fr 1fr 1fr';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.1em', padding: '0 12px 10px' }}>
        <span>{COL_LABEL[period]}</span>
        <span style={{ textAlign: 'right' }}>売上</span>
        <span style={{ textAlign: 'right' }}>会計件数</span>
        <span style={{ textAlign: 'right' }}>客単価</span>
      </div>
      <div style={{ maxHeight: 440, overflowY: 'auto' }}>
        {data.rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', padding: '10px 12px', borderTop: '1px dashed var(--line-2)', opacity: r.count === 0 ? 0.5 : 1 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.label}</span>
            <span style={{ textAlign: 'right' }} className="price">
              <span className="yen">¥</span>{yen(r.sales)}
            </span>
            <span style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-soft)' }}>{r.count}</span>
            <span style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-soft)' }}>
              {r.count ? `¥${yen(r.avg)}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
