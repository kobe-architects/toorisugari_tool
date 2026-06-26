import { useNavigate } from 'react-router-dom';
import { useCart } from '../state/CartContext';
import type { AgeBand, Gender, Temperature } from '@shared/types';
import { Yen, SafeTop } from '../components/common';
import { yen } from '../lib/money';

const GENDER_LABEL: Record<Gender, string> = { female: '女性', male: '男性', other: 'その他' };
const AGE_LABEL: Record<AgeBand, string> = { '10s': '10代', '20s': '20代', '30s': '30代', '40s': '40代', '50s': '50代', '60plus': '60代〜' };

/** 客層（年代＋性別）の表示。例: 20代女性 */
function segmentLabel(gender: Gender | null, ageBand: AgeBand | null): string {
  return `${ageBand ? AGE_LABEL[ageBand] : ''}${gender ? GENDER_LABEL[gender] : ''}` || '客層未設定';
}

/** ホット=赤 / アイス=青 のバッジ（注文時の選択肢と同色）。 */
function TempBadge({ t }: { t: Temperature }) {
  const hot = t === 'hot';
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 999,
        background: hot ? 'var(--accent)' : '#DCEBF5',
        color: hot ? '#FBEFD9' : '#2C4A5E',
      }}
    >
      {hot ? 'ホット' : 'アイス'}
    </span>
  );
}

export function Cart() {
  const nav = useNavigate();
  const cart = useCart();

  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }} onClick={() => nav('/')}>
            ‹
          </span>
          <span className="section-jp" style={{ fontSize: 18 }}>
            ご注文の確認
          </span>
        </div>
        <span className="chip">{cart.dineType === 'dine_in' ? '店内' : '持帰'}</span>
      </div>

      <div className="scroll" style={{ padding: '4px 18px 16px' }}>
        {cart.lines.length === 0 ? (
          <div className="ticket" style={{ padding: 28, textAlign: 'center', color: 'var(--ink-mute)' }}>
            カートが空です
          </div>
        ) : (
          <div className="ticket" style={{ padding: '4px 16px' }}>
            {cart.lines.map((l, i) => (
              <div
                key={l.lineId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: i < cart.lines.length - 1 ? '1px dashed var(--line-2)' : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{l.product.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {/* 客層（商品ごとに入力） */}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--gold)', color: '#3A2A12' }}>
                      {segmentLabel(l.gender, l.ageBand)}
                    </span>
                    {l.temperature && <TempBadge t={l.temperature} />}
                      {l.orderSource === 'tasting' && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--leaf)', color: '#FBEFD9' }}>試飲から</span>
                      )}
                      {l.selections.map((s) => (
                        <span key={s.name} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--paper-2)', border: '1px solid var(--line-2)', color: 'var(--ink-soft)' }}>
                          {s.value}
                        </span>
                      ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{l.product.sub}</div>
                </div>
                <div className="stepper">
                  <button onClick={() => cart.dec(l.lineId)}>－</button>
                  <span className="n">{l.qty}</span>
                  <button onClick={() => cart.inc(l.lineId)}>＋</button>
                </div>
                <Yen v={l.product.price * l.qty} />
              </div>
            ))}
          </div>
        )}

        <button
          className="btn btn-ghost"
          onClick={() => nav('/')}
          style={{ width: '100%', padding: 12, marginTop: 12, borderStyle: 'dashed', fontSize: 13.5, cursor: 'pointer' }}
        >
          ＋ 商品を追加する
        </button>
      </div>

      <div className="bottombar" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 4 }}>
          <span>小計（{cart.count}点）</span>
          <span className="price">
            <span className="yen">¥</span>
            {yen(cart.subtotal)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 10 }}>
          <span>内消費税(10%)</span>
          <span>¥{yen(cart.tax)}</span>
        </div>
        <button
          className="btn"
          onClick={() => cart.count > 0 && nav('/checkout')}
          disabled={cart.count === 0}
          style={{ width: '100%', padding: 15, background: 'var(--bar)', color: 'var(--bar-ink)', fontSize: 16, opacity: cart.count === 0 ? 0.5 : 1, cursor: cart.count === 0 ? 'default' : 'pointer' }}
        >
          お会計へ進む
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 19 }}>
            <span style={{ fontSize: 12 }}>¥</span>
            {yen(cart.total)}
          </span>
        </button>
      </div>
    </div>
  );
}
