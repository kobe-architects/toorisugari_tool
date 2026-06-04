import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/api';
import type { CategoryDTO, ProductDTO, Temperature } from '@shared/types';
import { ProductIcon } from '@shared/icons';
import { useCart } from '../state/CartContext';
import { useAuth } from '../state/AuthContext';
import { Yen, Stamp, SafeTop } from '../components/common';
import { yen } from '../lib/money';

export function Order() {
  const nav = useNavigate();
  const cart = useCart();
  const { staff, logout } = useAuth();
  const [cats, setCats] = useState<CategoryDTO[]>([]);
  const [active, setActive] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<ProductDTO | null>(null); // 選択中の商品
  const [pTemp, setPTemp] = useState<Temperature | null>(null);
  const [pOpts, setPOpts] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .products()
      .then((data) => {
        setCats(data);
        setActive((a) => a || data[0]?.id || '');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const current = cats.find((c) => c.id === active);

  const onAdd = (m: ProductDTO) => {
    if (m.has_temperature || m.options.length > 0) {
      setPending(m);
      setPTemp(null);
      setPOpts({});
    } else {
      cart.add(m, null, []);
    }
  };

  // 必要な選択がすべて揃ったか
  const ready =
    !!pending &&
    (!pending.has_temperature || pTemp != null) &&
    pending.options.every((g) => pOpts[g.name]);

  const confirmAdd = () => {
    if (!pending || !ready) return;
    const selections = pending.options.map((g) => ({ name: g.name, value: pOpts[g.name] }));
    cart.add(pending, pTemp, selections);
    setPending(null);
  };

  const onLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    await logout();
    nav('/login', { replace: true });
  };

  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />

      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <div className="wordmark" style={{ fontSize: 19, color: 'var(--ink)' }}>
          和紅茶
          <span style={{ fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-mute)', marginLeft: 6 }}>
            レジ
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className={'chip' + (cart.dineType === 'takeout' ? ' on' : '')} style={{ cursor: 'pointer' }} onClick={() => cart.setDineType('takeout')}>
            持帰
          </button>
          <button className={'chip' + (cart.dineType === 'dine_in' ? ' on' : '')} style={{ cursor: 'pointer' }} onClick={() => cart.setDineType('dine_in')}>
            店内
          </button>
          {staff?.role === 'owner' && (
            <button className="chip" style={{ cursor: 'pointer', color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => nav('/admin')}>
              管理
            </button>
          )}
          <button
            title={`${staff?.name ?? ''}（タップでログアウト）`}
            onClick={onLogout}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card)', border: '1.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--brush)', fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer' }}
          >
            {staff?.initial ?? '茶'}
          </button>
        </div>
      </div>

      {/* category chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', position: 'relative', zIndex: 3 }}>
        {cats.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)} className={'chip' + (c.id === active ? ' on' : '')} style={{ flex: '0 0 auto', fontSize: 13, padding: '7px 14px', cursor: 'pointer' }}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="scroll" style={{ padding: '2px 16px 16px' }}>
        {error && <div className="ticket" style={{ padding: 16, color: 'var(--accent)', fontSize: 13 }}>商品を取得できません：{error}</div>}
        {current && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {current.items.map((m) => (
              <div key={m.id} className="pcard" onClick={() => !m.sold && onAdd(m)} style={{ opacity: m.sold ? 0.62 : 1, cursor: m.sold ? 'default' : 'pointer' }}>
                <div className="thumb" style={{ height: 96 }}>
                  {m.image ? (
                    <img src={m.image} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ProductIcon icon={m.icon} size={58} fallback={m.name} />
                  )}
                  {m.stamp && (
                    <div style={{ position: 'absolute', top: 7, right: 7 }}>
                      <Stamp size={34} rot={-10}>{m.stamp}</Stamp>
                    </div>
                  )}
                  {m.has_temperature && !m.sold && (
                    <div style={{ position: 'absolute', bottom: 6, left: 7, fontSize: 10, fontWeight: 700, color: 'var(--ink-mute)', background: 'var(--card-2)', borderRadius: 6, padding: '2px 6px', border: '1px solid var(--line)' }}>
                      HOT / ICE
                    </div>
                  )}
                  {m.sold && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Stamp size={56} rot={-14} type="sold">売切</Stamp>
                    </div>
                  )}
                </div>
                <div style={{ padding: '9px 11px 11px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, minHeight: 14 }}>{m.sub}</div>
                  <div style={{ marginTop: 8 }}>
                    <Yen v={m.price} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* cart summary bar */}
      <div className="bottombar" style={{ padding: '12px 16px' }}>
        <button className="btn" onClick={() => cart.count > 0 && nav('/cart')} disabled={cart.count === 0} style={{ width: '100%', padding: 14, background: 'var(--bar)', color: 'var(--bar-ink)', borderRadius: 13, opacity: cart.count === 0 ? 0.5 : 1, cursor: cart.count === 0 ? 'default' : 'pointer' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 700 }}>
            <span style={{ background: 'var(--accent)', color: '#FBEFD9', borderRadius: 999, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              {cart.count}
            </span>
            カートを見る
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 18 }}>
            <span style={{ fontSize: 11 }}>¥</span>
            {yen(cart.subtotal)}
          </span>
        </button>
      </div>

      {/* 選択シート（ホット/アイス＋任意オプション） */}
      {pending && (
        <div
          onClick={() => setPending(null)}
          style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div onClick={(e) => e.stopPropagation()} className="theme-roast" style={{ width: '100%', maxHeight: '85%', overflowY: 'auto', background: 'var(--card-2)', borderRadius: '18px 18px 0 0', padding: '20px 20px 24px', boxShadow: '0 -8px 24px rgba(40,28,16,0.25)' }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <span className="section-jp" style={{ fontSize: 18 }}>{pending.name}</span>
            </div>

            {/* 温度 */}
            {pending.has_temperature && (
              <div style={{ marginBottom: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>ホット / アイス</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn"
                    onClick={() => setPTemp('hot')}
                    style={{ flex: 1, padding: '20px 0', background: 'var(--accent)', color: '#FBEFD9', fontSize: 18, borderRadius: 14, cursor: 'pointer', opacity: pTemp === 'hot' || pTemp == null ? 1 : 0.45, outline: pTemp === 'hot' ? '3px solid rgba(176,64,46,0.35)' : 'none' }}
                  >
                    ホット
                  </button>
                  <button
                    className="btn"
                    onClick={() => setPTemp('ice')}
                    style={{ flex: 1, padding: '20px 0', background: '#DCEBF5', color: '#2C4A5E', fontSize: 18, borderRadius: 14, cursor: 'pointer', opacity: pTemp === 'ice' || pTemp == null ? 1 : 0.45, outline: pTemp === 'ice' ? '3px solid rgba(44,74,94,0.3)' : 'none' }}
                  >
                    アイス
                  </button>
                </div>
              </div>
            )}

            {/* 任意オプション群（産地など） */}
            {pending.options.map((g) => (
              <div key={g.name} style={{ marginBottom: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{g.name}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {g.choices.map((c) => {
                    const on = pOpts[g.name] === c;
                    return (
                      <button
                        key={c}
                        className={'btn' + (on ? ' btn-primary' : ' btn-ghost')}
                        onClick={() => setPOpts((p) => ({ ...p, [g.name]: c }))}
                        style={{ flex: '1 1 40%', padding: '16px 0', fontSize: 16, borderRadius: 12, cursor: 'pointer' }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              className="btn btn-accent"
              onClick={confirmAdd}
              disabled={!ready}
              style={{ width: '100%', marginTop: 6, padding: 15, fontSize: 16, cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5 }}
            >
              カートに追加
            </button>
            <button className="btn btn-ghost" onClick={() => setPending(null)} style={{ width: '100%', marginTop: 10, padding: 12, fontSize: 14, cursor: 'pointer' }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
