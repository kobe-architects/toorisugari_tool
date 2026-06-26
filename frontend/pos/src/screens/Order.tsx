import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/api';
import type { AgeBand, CategoryDTO, Gender, OrderSource, ProductDTO, ProductOption, Temperature } from '@shared/types';

/** 同名のオプショングループを1つにまとめ、選択肢を結合する。 */
function mergeOptionGroups(opts: ProductOption[]): ProductOption[] {
  const map = new Map<string, ProductOption>();
  for (const g of opts) {
    const ex = map.get(g.name);
    if (ex) ex.choices = [...new Set([...ex.choices, ...g.choices])];
    else map.set(g.name, { name: g.name, choices: [...g.choices] });
  }
  return [...map.values()];
}
import { ProductIcon } from '@shared/icons';
import { useCart } from '../state/CartContext';
import { useAuth } from '../state/AuthContext';
import { Yen, Stamp, SafeTop } from '../components/common';
import { yen } from '../lib/money';

const GENDERS: { v: Gender; label: string }[] = [
  { v: 'female', label: '女性' },
  { v: 'male', label: '男性' },
  { v: 'other', label: 'その他' },
];

const AGE_BANDS: { v: AgeBand; label: string }[] = [
  { v: '10s', label: '10代' },
  { v: '20s', label: '20代' },
  { v: '30s', label: '30代' },
  { v: '40s', label: '40代' },
  { v: '50s', label: '50代' },
  { v: '60plus', label: '60代〜' },
];

export function Order() {
  const nav = useNavigate();
  const cart = useCart();
  const { staff, logout } = useAuth();
  const [cats, setCats] = useState<CategoryDTO[]>([]);
  const [active, setActive] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<ProductDTO | null>(null); // 選択中の商品
  const [pStep, setPStep] = useState<'segment' | 'options'>('segment'); // まず客層、その後に温度など
  const [pGender, setPGender] = useState<Gender | null>(null); // 客層（性別）
  const [pAge, setPAge] = useState<AgeBand | null>(null); // 客層（年代）
  const [pTemp, setPTemp] = useState<Temperature | null>(null);
  const [pSource, setPSource] = useState<OrderSource>('direct'); // 注文経路（既定: 直注文）
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

  // 商品を選ぶと、まず客層入力モーダルを開く（客層は全商品で必須）
  const onAdd = (m: ProductDTO) => {
    setPending(m);
    setPStep('segment');
    setPGender(null);
    setPAge(null);
    setPTemp(null);
    setPSource('direct');
    // 選択肢が1つだけのオプショングループは既定で選択しておく
    const defaults: Record<string, string> = {};
    for (const g of mergeOptionGroups(m.options)) {
      if (g.choices.length === 1) defaults[g.name] = g.choices[0];
    }
    setPOpts(defaults);
  };

  // 同名グループはまとめて表示・選択
  const groups = pending ? mergeOptionGroups(pending.options) : [];

  // 温度・経路・オプションの入力ステップが必要な商品か
  const hasOptionsStep = !!pending && (pending.has_temperature || pending.has_order_source || groups.length > 0);
  // 客層（性別・年代）が揃ったか
  const segmentReady = pGender != null && pAge != null;
  // 温度・オプションの必須選択が揃ったか
  const optionsReady = !!pending && (!pending.has_temperature || pTemp != null) && groups.every((g) => pOpts[g.name]);
  // すべて揃ってカートに追加できるか
  const ready = segmentReady && optionsReady;

  const confirmAdd = () => {
    if (!pending || !ready) return;
    const selections = groups.map((g) => ({ name: g.name, value: pOpts[g.name] }));
    cart.add(pending, pTemp, selections, pSource, pGender, pAge);
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
              <div className="eyebrow" style={{ marginTop: 4, fontSize: 10, color: 'var(--ink-mute)' }}>
                {pStep === 'segment' ? 'まず客層を選択' : '温度・オプションを選択'}
              </div>
            </div>

            {pStep === 'segment' ? (
              <>
                {/* 客層（性別） */}
                <div style={{ marginBottom: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>性別</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {GENDERS.map((g) => (
                      <button
                        key={g.v}
                        className={'btn' + (pGender === g.v ? ' btn-primary' : ' btn-ghost')}
                        onClick={() => setPGender(g.v)}
                        style={{ padding: '16px 0', fontSize: 16, borderRadius: 12, cursor: 'pointer' }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 客層（年代） */}
                <div style={{ marginBottom: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>年代</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {AGE_BANDS.map((a) => (
                      <button
                        key={a.v}
                        className={'btn' + (pAge === a.v ? ' btn-primary' : ' btn-ghost')}
                        onClick={() => setPAge(a.v)}
                        style={{ padding: '16px 0', fontSize: 16, borderRadius: 12, cursor: 'pointer' }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-accent"
                  onClick={() => (hasOptionsStep ? setPStep('options') : confirmAdd())}
                  disabled={!segmentReady}
                  style={{ width: '100%', marginTop: 6, padding: 15, fontSize: 16, cursor: segmentReady ? 'pointer' : 'default', opacity: segmentReady ? 1 : 0.5 }}
                >
                  {hasOptionsStep ? '次へ' : 'カートに追加'}
                </button>
                <button className="btn btn-ghost" onClick={() => setPending(null)} style={{ width: '100%', marginTop: 10, padding: 12, fontSize: 14, cursor: 'pointer' }}>
                  キャンセル
                </button>
              </>
            ) : (
              <>
                {/* 温度 */}
                {pending.has_temperature && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>ホット / アイス</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        className="btn"
                        onClick={() => setPTemp('hot')}
                        style={{ flex: 1, padding: '20px 0', background: 'var(--accent)', color: '#FBEFD9', fontSize: 18, borderRadius: 14, cursor: 'pointer', opacity: pTemp === 'hot' ? 1 : 0.4, outline: pTemp === 'hot' ? '3px solid rgba(176,64,46,0.35)' : 'none' }}
                      >
                        ホット
                      </button>
                      <button
                        className="btn"
                        onClick={() => setPTemp('ice')}
                        style={{ flex: 1, padding: '20px 0', background: '#DCEBF5', color: '#2C4A5E', fontSize: 18, borderRadius: 14, cursor: 'pointer', opacity: pTemp === 'ice' ? 1 : 0.4, outline: pTemp === 'ice' ? '3px solid rgba(44,74,94,0.3)' : 'none' }}
                      >
                        アイス
                      </button>
                    </div>
                  </div>
                )}

                {/* 注文経路（直注文 / 試飲から）。既定は直注文 */}
                {pending.has_order_source && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>注文経路</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {([['direct', '直注文'], ['tasting', '試飲から']] as const).map(([v, label]) => (
                        <button
                          key={v}
                          className={'btn' + (pSource === v ? ' btn-primary' : ' btn-ghost')}
                          onClick={() => setPSource(v)}
                          style={{ padding: '16px 0', fontSize: 16, borderRadius: 12, cursor: 'pointer' }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 任意オプション群（産地など）。選択肢は2列グリッド表示 */}
                {groups.map((g) => (
                  <div key={g.name} style={{ marginBottom: 16 }}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>{g.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {g.choices.map((c) => {
                        const on = pOpts[g.name] === c;
                        return (
                          <button
                            key={c}
                            className={'btn' + (on ? ' btn-primary' : ' btn-ghost')}
                            onClick={() => setPOpts((p) => ({ ...p, [g.name]: c }))}
                            style={{ padding: '16px 0', fontSize: 16, borderRadius: 12, cursor: 'pointer' }}
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
                <button className="btn btn-ghost" onClick={() => setPStep('segment')} style={{ width: '100%', marginTop: 10, padding: 12, fontSize: 14, cursor: 'pointer' }}>
                  ← 客層に戻る
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
