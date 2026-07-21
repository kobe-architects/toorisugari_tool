import { useCallback, useEffect, useState } from 'react';
import { api } from '@shared/api';
import type { CategoryLiteDTO, Period, SalesAnalyticsDTO, WeatherDayDTO, WeatherIconKind } from '@shared/types';
import { AreaChart, ColumnChart, Donut, RankTable } from '../charts';
import { Panel, Legend } from '../components/Panel';
import { WeatherIcon } from '../components/WeatherIcon';
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
  const [cats, setCats] = useState<CategoryLiteDTO[]>([]);
  const [category, setCategory] = useState('all'); // カテゴリslug（all=全体）
  const [data, setData] = useState<SalesAnalyticsDTO | null>(null);
  const [weather, setWeather] = useState<Record<number, WeatherDayDTO>>({});
  const [editDay, setEditDay] = useState<number | null>(null); // 天気を手動編集中の日
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.categories().then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    api.analytics
      .sales(period, { year, month, category: category === 'all' ? undefined : category })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [period, year, month, category]);

  // 日次のみ、伝票のある日の天気を取得（自動＋手動登録をマージ済み）。
  const loadWeather = useCallback(() => {
    if (period !== 'day') { setWeather({}); return; }
    api.analytics
      .weather(year, month)
      .then((w) => setWeather(w.configured ? Object.fromEntries(w.days.map((d) => [d.day, d])) : {}))
      .catch(() => { /* 天気は補助情報のため失敗しても無視 */ });
  }, [period, year, month]);

  useEffect(() => {
    setWeather({});
    loadWeather();
  }, [loadWeather]);

  const downloadCsv = async () => {
    const blob = await api.analytics.salesCsv(period, { year, month, category: category === 'all' ? undefined : category });
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
  const catLabel = category === 'all' ? '' : `・${cats.find((c) => c.slug === category)?.label ?? ''}`;

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

        {/* カテゴリ切替（全体 / カテゴリ別） */}
        <div style={{ display: 'flex', background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 11, overflow: 'hidden' }}>
          {[{ slug: 'all', label: '全体' }, ...cats].map((c) => (
            <button key={c.slug} onClick={() => setCategory(c.slug)} className="btn" style={{ padding: '10px 16px', borderRadius: 0, fontSize: 13, cursor: 'pointer', background: c.slug === category ? 'var(--bar)' : 'transparent', color: c.slug === category ? 'var(--bar-ink)' : 'var(--ink-soft)' }}>
              {c.label}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-mute)' }}>
          期間合計 <span className="price" style={{ fontSize: 15, color: 'var(--ink)' }}><span className="yen">¥</span>{yen(data?.total ?? 0)}</span>
        </span>
      </div>

      {/* 売上推移：左=表 / 右=グラフ */}
      <Panel title="売上推移" sub={(period === 'day' ? `${year}年${month}月 日別` : period === 'month' ? `${year}年 月別` : '年別（2026年〜）') + catLabel}>
        {!data ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ width: period === 'day' ? 540 : 480, flexShrink: 0 }}>
              <TrendTable period={period} data={data} weather={weather} onEditWeather={period === 'day' ? setEditDay : undefined} />
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
        <Panel title="時間帯別 売上" sub={`選択期間の時間帯合計${catLabel}`} right={data && data.total > 0 ? <span className="chip" style={{ fontSize: 11 }}>ピーク {data.hours.labels[data.hours.peak]}時台</span> : undefined}>
          {data && <ColumnChart labels={data.hours.labels} data={data.hours.data} peak={data.hours.peak} H={232} />}
        </Panel>
        <Panel title="カテゴリー別 構成比" sub="常に全体の構成比">
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

      {/* 商品別ランキング（カテゴリ別） */}
      <Panel title="商品別 売上ランキング" sub={`選択期間${catLabel}・カテゴリ別（構成比はカテゴリ内）`} right={<button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5, cursor: 'pointer' }} onClick={downloadCsv}>CSV出力</button>}>
        {!data || data.products.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>会計データがありません</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {data.products.map((g) => (
              <div key={g.key}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1.5px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--mincho)', fontWeight: 800, fontSize: 16 }}>{g.label}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{g.rows.length}品</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-mute)' }}>
                    小計 <span className="price" style={{ fontSize: 14, color: 'var(--ink)' }}><span className="yen">¥</span>{yen(g.total)}</span>
                  </span>
                </div>
                <RankTable rows={g.rows} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* 天気の手動登録モーダル */}
      {editDay != null && (
        <WeatherEditor
          year={year}
          month={month}
          day={editDay}
          current={weather[editDay]}
          onClose={() => setEditDay(null)}
          onSaved={() => { setEditDay(null); loadWeather(); }}
        />
      )}
    </div>
  );
}

const ICON_CHOICES: { k: WeatherIconKind; label: string }[] = [
  { k: 'sunny', label: '晴れ' },
  { k: 'partly', label: '晴れ時々曇り' },
  { k: 'cloudy', label: '曇り' },
  { k: 'rain', label: '雨' },
  { k: 'snow', label: '雪' },
  { k: 'thunder', label: '雷雨' },
];

/** 天気の手動登録・修正モーダル。伝票のある日に対して1日分を上書きする。 */
function WeatherEditor({
  year, month, day, current, onClose, onSaved,
}: {
  year: number; month: number; day: number; current?: WeatherDayDTO; onClose: () => void; onSaved: () => void;
}) {
  const [icon, setIcon] = useState<WeatherIconKind>(current?.icon ?? 'sunny');
  const [tmax, setTmax] = useState(current?.tmax != null ? String(current.tmax) : '');
  const [tmin, setTmin] = useState(current?.tmin != null ? String(current.tmin) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.analytics.saveWeather({
        date,
        icon,
        tmax: tmax.trim() === '' ? null : Number(tmax),
        tmin: tmin.trim() === '' ? null : Number(tmin),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
      setBusy(false);
    }
  };

  const revert = async () => {
    setBusy(true);
    setError('');
    try {
      await api.analytics.deleteWeather(date);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
      setBusy(false);
    }
  };

  const tInput: React.CSSProperties = {
    width: 90, background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 8,
    padding: '8px 10px', fontFamily: 'var(--gothic)', fontSize: 14, color: 'var(--ink)',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="ticket" style={{ width: 420, maxWidth: '92vw', padding: '22px 24px', background: 'var(--card)' }}>
        <div className="eyebrow" style={{ fontSize: 11 }}>天気の登録・修正</div>
        <div style={{ fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 18, marginTop: 4, marginBottom: 4 }}>{month}月{day}日</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginBottom: 16 }}>
          {current?.source === 'manual' ? '現在：手動登録' : current ? '現在：自動取得（上書きできます）' : '未登録'}
        </div>

        {/* アイコン選択 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {ICON_CHOICES.map((c) => {
            const on = c.k === icon;
            return (
              <button
                key={c.k}
                onClick={() => setIcon(c.k)}
                className="btn"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, cursor: 'pointer', border: on ? '2px solid var(--accent)' : '1.5px solid var(--line-2)', background: on ? 'rgba(176,64,46,0.06)' : 'var(--card-2)' }}
              >
                <WeatherIcon kind={c.k} size={26} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? 'var(--accent)' : 'var(--ink-soft)' }}>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* 気温 */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
            最高<input type="number" step="0.1" value={tmax} onChange={(e) => setTmax(e.target.value)} style={tInput} />℃
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
            最低<input type="number" step="0.1" value={tmin} onChange={(e) => setTmin(e.target.value)} style={tInput} />℃
          </label>
        </div>

        {error && <div style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-accent" onClick={save} disabled={busy} style={{ padding: '10px 22px', fontSize: 14, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>
            {busy ? '保存中…' : '保存'}
          </button>
          {current?.source === 'manual' && (
            <button className="btn btn-ghost" onClick={revert} disabled={busy} style={{ padding: '10px 16px', fontSize: 13, cursor: busy ? 'default' : 'pointer' }}>
              自動に戻す
            </button>
          )}
          <button className="btn" onClick={onClose} disabled={busy} style={{ marginLeft: 'auto', padding: '10px 16px', fontSize: 13, background: 'transparent', color: 'var(--ink-mute)', cursor: 'pointer' }}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendTable({ period, data, weather, onEditWeather }: { period: Period; data: SalesAnalyticsDTO; weather: Record<number, WeatherDayDTO>; onEditWeather?: (day: number) => void }) {
  // 日次のみ「天気」列を追加。全幅に間延びしないよう最大幅を制限
  const showWeather = period === 'day';
  const cols = showWeather ? '64px 92px 1fr 1fr 1fr' : '88px 1fr 1fr 1fr';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.1em', padding: '0 12px 10px' }}>
        <span>{COL_LABEL[period]}</span>
        {showWeather && <span>天気</span>}
        <span style={{ textAlign: 'right' }}>売上</span>
        <span style={{ textAlign: 'right' }}>会計件数</span>
        <span style={{ textAlign: 'right' }}>客単価</span>
      </div>
      <div style={{ maxHeight: 440, overflowY: 'auto' }}>
        {data.rows.map((r, i) => {
          const day = Number(r.label.split('/')[1]);
          const w = showWeather ? weather[day] : undefined;
          const hasOrders = r.count > 0;
          // 天気は伝票のある日だけ表示・登録可。クリックで手動登録・修正。
          const editable = showWeather && hasOrders && !!onEditWeather;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', padding: '10px 12px', borderTop: '1px dashed var(--line-2)', opacity: r.count === 0 ? 0.5 : 1 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.label}</span>
              {showWeather && (
                <span
                  onClick={editable ? () => onEditWeather!(day) : undefined}
                  title={editable ? '天気を登録・修正' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: editable ? 'pointer' : 'default', borderRadius: 6, padding: '2px 4px', margin: '-2px -4px' }}
                >
                  {w ? (
                    <>
                      <WeatherIcon kind={w.icon} size={19} title={w.region ? `${w.label}・${w.region}` : w.label} />
                      <span style={{ fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                        {w.tmax != null ? Math.round(w.tmax) : '—'}°/{w.tmin != null ? Math.round(w.tmin) : '—'}°
                      </span>
                      {w.source === 'manual' && <span title="手動登録" style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--accent)' }}>手</span>}
                    </>
                  ) : editable ? (
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>＋登録</span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>—</span>
                  )}
                </span>
              )}
              <span style={{ textAlign: 'right' }} className="price">
                <span className="yen">¥</span>{yen(r.sales)}
              </span>
              <span style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-soft)' }}>{r.count}</span>
              <span style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-soft)' }}>
                {r.count ? `¥${yen(r.avg)}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
