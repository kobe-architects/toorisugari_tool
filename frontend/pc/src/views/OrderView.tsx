import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type {
  AdminProductDTO,
  AgeBand,
  DineType,
  Gender,
  OrderDetailDTO,
  OrderListItemDTO,
  OrderListResponse,
  OrderSortKey,
  OrderSource,
  OrderStatus,
  OrderUpdatePayload,
  OptionSelection,
  Temperature,
} from '@shared/types';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

const STATUS_TABS: { v: OrderStatus | ''; label: string }[] = [
  { v: '', label: '全て' },
  { v: 'completed', label: '完了' },
  { v: 'voided', label: '取消' },
];

const DINE_LABEL: Record<DineType, string> = { dine_in: '店内', takeout: '持ち帰り' };
const GENDERS: { v: Gender; label: string }[] = [
  { v: 'female', label: '女性' }, { v: 'male', label: '男性' }, { v: 'other', label: 'その他' },
];
const AGE_BANDS: { v: AgeBand; label: string }[] = [
  { v: '10s', label: '10代' }, { v: '20s', label: '20代' }, { v: '30s', label: '30代' },
  { v: '40s', label: '40代' }, { v: '50s', label: '50代' }, { v: '60plus', label: '60代+' },
];

const selectStyle: React.CSSProperties = {
  background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10,
  padding: '8px 11px', fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', cursor: 'pointer',
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// 列幅（固定・テーブルは左寄せ）
const COL = { no: 84, dt: 150, dine: 84, qty: 64, total: 110, status: 84, staff: 100, act: 76 };

function SortHeader({ label, col, sortKey, sort, dir, onSort, align = 'left' }: {
  label: string; col: number; sortKey?: OrderSortKey; sort: OrderSortKey; dir: 'asc' | 'desc'; onSort: (k: OrderSortKey) => void; align?: 'left' | 'right' | 'center';
}) {
  const on = sortKey && sort === sortKey;
  return (
    <span
      onClick={sortKey ? () => onSort(sortKey) : undefined}
      style={{ width: col, textAlign: align, cursor: sortKey ? 'pointer' : 'default', color: on ? 'var(--ink-soft)' : 'var(--ink-mute)', userSelect: 'none', display: 'inline-flex', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start', gap: 3 }}
    >
      {label}{on ? (dir === 'asc' ? ' ▲' : ' ▼') : sortKey ? ' ⇅' : ''}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const voided = status === 'voided';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: voided ? 'var(--accent)' : 'var(--leaf)', background: voided ? 'rgba(180,60,40,0.1)' : 'rgba(90,140,70,0.12)', border: `1px solid ${voided ? 'var(--accent)' : 'var(--leaf)'}` }}>
      {voided ? '取消済' : '完了'}
    </span>
  );
}

export function OrderView() {
  const [resp, setResp] = useState<OrderListResponse | null>(null);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<OrderSortKey>('completed_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    api.admin.orders
      .list({ status: status || undefined, q: q || undefined, from: from || undefined, to: to || undefined, page, sort, dir })
      .then(setResp)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(load, [status, q, from, to, page, sort, dir]);

  // フィルタ変更時は1ページ目に戻す
  const onFilter = (fn: () => void) => { fn(); setPage(1); };

  // ヘッダクリックでソート。同じ列なら昇順/降順を切替、別列なら降順から。
  const onSort = (k: OrderSortKey) => {
    if (sort === k) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(k); setDir('desc'); }
    setPage(1);
  };

  return (
    <>
      <Panel title="伝票一覧" sub={resp ? `全${resp.total}件` : '読み込み中…'}>
        {error && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        {/* フィルタ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="seg" style={{ width: 'auto' }}>
            {STATUS_TABS.map((t) => (
              <div key={t.label} className={'opt' + (status === t.v ? ' on' : '')} style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => onFilter(() => setStatus(t.v))}>{t.label}</div>
            ))}
          </div>
          <input className="input" placeholder="伝票番号で検索" value={q} onChange={(e) => onFilter(() => setQ(e.target.value.replace(/[^0-9]/g, '')))} inputMode="numeric" style={{ width: 150 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
            <input type="date" className="input" value={from} onChange={(e) => onFilter(() => setFrom(e.target.value))} style={{ width: 150 }} />
            <span>〜</span>
            <input type="date" className="input" value={to} onChange={(e) => onFilter(() => setTo(e.target.value))} style={{ width: 150 }} />
          </div>
        </div>

        {/* テーブル（左寄せ・固定幅） */}
        <div style={{ display: 'inline-block', minWidth: 0 }}>
          {/* ヘッダ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', padding: '0 0 10px' }}>
            <SortHeader label="伝票番号" col={COL.no} sortKey="order_no" sort={sort} dir={dir} onSort={onSort} />
            <SortHeader label="日時" col={COL.dt} sortKey="completed_at" sort={sort} dir={dir} onSort={onSort} />
            <SortHeader label="区分" col={COL.dine} sortKey="dine_type" sort={sort} dir={dir} onSort={onSort} />
            <SortHeader label="点数" col={COL.qty} sortKey="item_count" sort={sort} dir={dir} onSort={onSort} align="right" />
            <SortHeader label="合計" col={COL.total} sortKey="total" sort={sort} dir={dir} onSort={onSort} align="right" />
            <SortHeader label="状態" col={COL.status} sortKey="status" sort={sort} dir={dir} onSort={onSort} align="center" />
            <span style={{ width: COL.staff, color: 'var(--ink-mute)' }}>担当</span>
            <span style={{ width: COL.act }} />
          </div>
          {resp?.data.map((o) => (
            <OrderRow key={o.id} o={o} onOpen={() => setEditingId(o.id)} />
          ))}
          {resp && resp.data.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 0', fontSize: 13, color: 'var(--ink-mute)' }}>該当する伝票がありません</div>
          )}
        </div>

        {/* ページネーション */}
        {resp && resp.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 18 }}>
            <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.4 }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← 前へ</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>{resp.page} / {resp.last_page}</span>
            <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, cursor: page < resp.last_page ? 'pointer' : 'default', opacity: page < resp.last_page ? 1 : 0.4 }} disabled={page >= resp.last_page} onClick={() => setPage((p) => p + 1)}>次へ →</button>
          </div>
        )}
      </Panel>

      {editingId != null && (
        <OrderEditModal id={editingId} onClose={() => setEditingId(null)} onSaved={load} />
      )}
    </>
  );
}

function OrderRow({ o, onOpen }: { o: OrderListItemDTO; onOpen: () => void }) {
  const voided = o.status === 'voided';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px dashed var(--line-2)', opacity: voided ? 0.6 : 1 }}>
      <span style={{ width: COL.no, fontWeight: 700, fontSize: 14 }} className="price">#{o.order_no}</span>
      <span style={{ width: COL.dt, fontSize: 13, color: 'var(--ink-soft)' }}>{fmtDateTime(o.completed_at)}</span>
      <span style={{ width: COL.dine, fontSize: 12.5, color: 'var(--ink-soft)' }}>{DINE_LABEL[o.dine_type]}</span>
      <span style={{ width: COL.qty, textAlign: 'right', fontSize: 13 }}>{o.item_count}点</span>
      <span style={{ width: COL.total, textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(o.total)}</span>
      <span style={{ width: COL.status, textAlign: 'center' }}><StatusBadge status={o.status} /></span>
      <span style={{ width: COL.staff, fontSize: 12.5, color: 'var(--ink-soft)' }}>{o.staff ?? '—'}</span>
      <span style={{ width: COL.act, textAlign: 'right' }}>
        <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12.5, cursor: 'pointer' }} onClick={onOpen}>{voided ? '詳細' : '編集'}</button>
      </span>
    </div>
  );
}

/** 編集モデル（行） */
interface EditLine {
  key: string;
  product_id: number;
  qty: number;
  temperature: Temperature | null;
  order_source: OrderSource;
  options: OptionSelection[];
}

let lineSeq = 0;
const newKey = () => `l${lineSeq++}`;

function OrderEditModal({ id, onClose, onSaved }: { id: number; onClose: () => void; onSaved: () => void }) {
  const [detail, setDetail] = useState<OrderDetailDTO | null>(null);
  const [products, setProducts] = useState<AdminProductDTO[]>([]);
  const [lines, setLines] = useState<EditLine[]>([]);
  const [dineType, setDineType] = useState<DineType>('dine_in');
  const [received, setReceived] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [ageBand, setAgeBand] = useState<AgeBand | ''>('');
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.admin.orders.get(id), api.admin.products()])
      .then(([d, ps]) => {
        setDetail(d);
        setProducts(ps);
        setLines(d.items.map((i) => ({ key: newKey(), product_id: i.product_id, qty: i.qty, temperature: i.temperature, order_source: i.order_source, options: i.options })));
        setDineType(d.dine_type);
        setReceived(String(d.received));
        setGender(d.customer?.gender ?? '');
        setAgeBand(d.customer?.age_band ?? '');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [id]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const total = useMemo(() => lines.reduce((s, l) => s + (productById.get(l.product_id)?.price ?? 0) * l.qty, 0), [lines, productById]);
  const voided = detail?.status === 'voided';

  const setLine = (key: string, patch: Partial<EditLine>) => setLines((arr) => arr.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((arr) => arr.filter((l) => l.key !== key));
  const addProduct = (p: AdminProductDTO) => {
    setLines((arr) => [...arr, { key: newKey(), product_id: p.id, qty: 1, temperature: p.has_temperature ? 'hot' : null, order_source: 'direct', options: (p.options ?? []).map((g) => ({ name: g.name, value: g.choices[0] ?? '' })) }]);
    setPicking(false);
  };

  const save = async () => {
    if (busy || lines.length === 0) return;
    setBusy(true);
    setError('');
    const payload: OrderUpdatePayload = {
      dine_type: dineType,
      received: Number(received) || 0,
      items: lines.map((l) => ({ product_id: l.product_id, qty: l.qty, temperature: l.temperature, order_source: l.order_source, options: l.options.filter((o) => o.value) })),
      customer: gender || ageBand ? { gender: gender || null, age_band: ageBand || null } : null,
    };
    try {
      await api.admin.orders.update(id, payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
      setBusy(false);
    }
  };

  const doVoid = async () => {
    if (busy) return;
    if (!confirm('この伝票を取消しますか？\n取消した伝票は売上集計から除外されます。')) return;
    setBusy(true);
    try {
      await api.admin.orders.void(id);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '取消に失敗しました');
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="ticket theme-roast" style={{ width: 600, maxHeight: '90vh', overflowY: 'auto', padding: '24px 26px', background: 'var(--card-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span className="section-jp" style={{ fontSize: 20 }}>伝票 #{detail?.order_no ?? ''}</span>
          {detail && <StatusBadge status={detail.status} />}
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{detail ? fmtDateTime(detail.completed_at) : ''}{detail?.staff ? `・${detail.staff}` : ''}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }}>✕</button>
        </div>

        {!detail && !error && <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>読み込み中…</div>}
        {voided && <div style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700, marginBottom: 14 }}>この伝票は取消済みのため編集できません。</div>}

        {detail && (
          <>
            {/* 明細 */}
            <div className="field-label" style={{ marginBottom: 8 }}>明細</div>
            {lines.map((l) => {
              const p = productById.get(l.product_id);
              return (
                <div key={l.key} style={{ borderTop: '1px dashed var(--line-2)', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p?.name ?? `商品#${l.product_id}`}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>¥{yen(p?.price ?? 0)} / 点</div>
                    </div>
                    {/* 数量ステッパー */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="btn btn-ghost" disabled={voided} style={{ padding: '4px 12px', fontSize: 16, cursor: voided ? 'default' : 'pointer' }} onClick={() => setLine(l.key, { qty: Math.max(1, l.qty - 1) })}>−</button>
                      <span className="price" style={{ width: 24, textAlign: 'center', fontSize: 15 }}>{l.qty}</span>
                      <button className="btn btn-ghost" disabled={voided} style={{ padding: '4px 12px', fontSize: 16, cursor: voided ? 'default' : 'pointer' }} onClick={() => setLine(l.key, { qty: l.qty + 1 })}>＋</button>
                    </div>
                    <span className="price" style={{ width: 90, textAlign: 'right', fontSize: 14 }}><span className="yen">¥</span>{yen((p?.price ?? 0) * l.qty)}</span>
                    {!voided && <button className="btn" onClick={() => removeLine(l.key)} style={{ padding: '4px 10px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer', fontSize: 12 }}>✕</button>}
                  </div>
                  {/* 温度・経路・オプション */}
                  {!voided && (p?.has_temperature || p?.has_order_source || (p?.options?.length ?? 0) > 0) && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, paddingLeft: 2 }}>
                      {p?.has_temperature && (
                        <div className="seg" style={{ width: 'auto' }}>
                          {(['hot', 'ice'] as Temperature[]).map((t) => (
                            <div key={t} className={'opt' + (l.temperature === t ? ' on' : '')} style={{ padding: '5px 14px', fontSize: 12.5 }} onClick={() => setLine(l.key, { temperature: t })}>{t === 'hot' ? 'ホット' : 'アイス'}</div>
                          ))}
                        </div>
                      )}
                      {p?.has_order_source && (
                        <div className="seg" style={{ width: 'auto' }}>
                          {(['direct', 'tasting'] as OrderSource[]).map((s) => (
                            <div key={s} className={'opt' + (l.order_source === s ? ' on' : '')} style={{ padding: '5px 14px', fontSize: 12.5 }} onClick={() => setLine(l.key, { order_source: s })}>{s === 'direct' ? '直注文' : '試飲から'}</div>
                          ))}
                        </div>
                      )}
                      {(p?.options ?? []).map((g) => (
                        <select key={g.name} style={selectStyle} value={l.options.find((o) => o.name === g.name)?.value ?? ''} onChange={(e) => setLine(l.key, { options: [...l.options.filter((o) => o.name !== g.name), { name: g.name, value: e.target.value }] })}>
                          <option value="">{g.name}：未選択</option>
                          {g.choices.map((c) => <option key={c} value={c}>{g.name}：{c}</option>)}
                        </select>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {!voided && (
              <div style={{ marginTop: 10 }}>
                {!picking ? (
                  <button className="btn btn-ghost" onClick={() => setPicking(true)} style={{ width: '100%', padding: 10, borderStyle: 'dashed', fontSize: 13, cursor: 'pointer' }}>＋ 商品を追加</button>
                ) : (
                  <div style={{ border: '1.5px dashed var(--line-2)', borderRadius: 10, padding: 10, maxHeight: 200, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span className="field-label">商品を選択</span>
                      <button onClick={() => setPicking(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', fontSize: 16, color: 'var(--ink-soft)', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {products.map((p) => (
                        <button key={p.id} className="btn btn-ghost" onClick={() => addProduct(p)} style={{ padding: '7px 12px', fontSize: 12.5, cursor: 'pointer' }}>{p.name}　¥{yen(p.price)}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 合計 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 12, borderTop: '1.5px solid var(--line)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>合計（税込）</span>
              <span className="price" style={{ fontSize: 22 }}><span className="yen">¥</span>{yen(total)}</span>
            </div>

            {/* 区分・お預かり・客層 */}
            {!voided && (
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 13, padding: '14px 16px', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="field-label" style={{ width: 90 }}>区分</span>
                  <div className="seg" style={{ width: 'auto' }}>
                    {(['dine_in', 'takeout'] as DineType[]).map((d) => (
                      <div key={d} className={'opt' + (dineType === d ? ' on' : '')} style={{ padding: '6px 18px', fontSize: 13 }} onClick={() => setDineType(d)}>{DINE_LABEL[d]}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="field-label" style={{ width: 90 }}>お預かり</span>
                  <div style={{ position: 'relative', width: 160 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mincho)', fontWeight: 700, color: 'var(--ink-soft)' }}>¥</span>
                    <input className="input mincho" inputMode="numeric" value={received} onChange={(e) => setReceived(e.target.value.replace(/[^0-9]/g, ''))} style={{ paddingLeft: 26, fontSize: 16 }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>おつり ¥{yen(Math.max(0, (Number(received) || 0) - total))}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="field-label" style={{ width: 90 }}>客層</span>
                  <select style={selectStyle} value={gender} onChange={(e) => setGender(e.target.value as Gender | '')}>
                    <option value="">性別 未選択</option>
                    {GENDERS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}
                  </select>
                  <select style={selectStyle} value={ageBand} onChange={(e) => setAgeBand(e.target.value as AgeBand | '')}>
                    <option value="">年代 未選択</option>
                    {AGE_BANDS.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, textAlign: 'center', marginTop: 14 }}>{error}</div>}

            {!voided && (
              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                <button className="btn" onClick={doVoid} disabled={busy} style={{ padding: '12px 18px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', fontSize: 14, cursor: 'pointer' }}>伝票を取消</button>
                <button className="btn btn-accent" onClick={save} disabled={busy || lines.length === 0} style={{ flex: 1, padding: 14, fontSize: 15, cursor: busy || lines.length === 0 ? 'default' : 'pointer', opacity: busy || lines.length === 0 ? 0.5 : 1 }}>
                  {busy ? '保存中…' : '変更を保存'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
