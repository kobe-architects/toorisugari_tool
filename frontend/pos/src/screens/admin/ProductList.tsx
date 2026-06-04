import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/api';
import type { AdminProductDTO } from '@shared/types';
import { ProductIcon } from '@shared/icons';
import { Yen, Stamp, SafeTop } from '../../components/common';

export function ProductList() {
  const nav = useNavigate();
  const [products, setProducts] = useState<AdminProductDTO[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    api.admin
      .products()
      .then(setProducts)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(load, []);

  const cats = [
    { slug: 'all', label: 'すべて' },
    { slug: 'drink', label: 'ドリンク' },
    { slug: 'leaf', label: '茶葉' },
    { slug: 'sweet', label: 'お菓子' },
    { slug: 'set', label: 'セット' },
  ];

  const rows = products.filter((p) => filter === 'all' || p.category?.slug === filter);

  const toggleSold = async (p: AdminProductDTO) => {
    setBusyId(p.id);
    try {
      const updated = await api.admin.updateProduct(p.id, { is_sold_out: !p.is_sold_out });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }} onClick={() => nav('/admin')}>
            ‹
          </span>
          <span className="section-jp" style={{ fontSize: 18 }}>
            商品管理
          </span>
        </div>
        <button className="btn btn-accent" style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer' }} onClick={() => nav('/admin/products/new')}>
          ＋ 追加
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', position: 'relative', zIndex: 3 }}>
        {cats.map((c) => (
          <button key={c.slug} className={'chip' + (c.slug === filter ? ' on' : '')} style={{ flex: '0 0 auto', padding: '7px 14px', cursor: 'pointer' }} onClick={() => setFilter(c.slug)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="scroll" style={{ padding: '2px 16px 16px' }}>
        {error && <div className="ticket" style={{ padding: 14, color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 2px 10px' }}>
          <span className="eyebrow">{products.length}品中 {rows.length}品 表示</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {rows.map((m) => (
            <div key={m.id} className="ticket" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', opacity: m.is_sold_out ? 0.7 : 1 }}>
              <div
                style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'var(--paper-2)', border: '1.5px solid var(--line)', color: 'var(--brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}
                onClick={() => nav(`/admin/products/${m.id}`)}
              >
                <ProductIcon icon={m.icon} size={28} fallback={m.name} />
                {m.stamp && (
                  <div style={{ position: 'absolute', top: -6, right: -6 }}>
                    <Stamp size={22} rot={-12}>
                      {m.stamp}
                    </Stamp>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => nav(`/admin/products/${m.id}`)}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {m.name}
                  {!m.is_visible && <span style={{ fontSize: 10, color: 'var(--ink-mute)', marginLeft: 6 }}>（非表示）</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Yen v={m.price} />
                  <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{m.sub}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <button className={'switch' + (m.is_sold_out ? '' : ' on')} disabled={busyId === m.id} style={{ cursor: 'pointer' }} onClick={() => toggleSold(m)}>
                  <span className="knob" />
                </button>
                <span style={{ fontSize: 10, fontWeight: 700, color: m.is_sold_out ? 'var(--accent)' : 'var(--leaf)' }}>{m.is_sold_out ? '売切' : '販売中'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
