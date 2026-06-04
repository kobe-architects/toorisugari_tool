import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@shared/api';
import type { Gender, AgeBand, OrderPayload } from '@shared/types';
import { useCart } from '../state/CartContext';
import { SafeTop } from '../components/common';
import { NumericKeypad } from '../components/NumericKeypad';
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

export function Checkout() {
  const nav = useNavigate();
  const cart = useCart();
  const total = cart.total;

  const [gender, setGender] = useState<Gender | null>(null);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [received, setReceived] = useState<number | null>(null);
  const [presets, setPresets] = useState<number[]>([]);
  const [keypad, setKeypad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 管理側で設定したお預かりプリセット金額を取得（合計以上のみ表示）
  useEffect(() => {
    api.settings().then((s) => setPresets(s.cash_presets)).catch(() => setPresets([]));
  }, []);
  const quickPresets = presets.filter((a) => a >= total);

  const change = received != null ? received - total : null;
  const segmentDone = gender != null && ageBand != null; // 客層は必須
  const canConfirm = received != null && received >= total && cart.count > 0 && segmentDone && !busy;

  const confirm = async () => {
    if (received == null || received < total || cart.count === 0 || !segmentDone || busy) return;
    setBusy(true);
    setError('');

    const payload: OrderPayload = {
      dine_type: cart.dineType,
      payment_method: 'cash',
      received,
      items: cart.lines.map((l) => ({ product_id: l.product.id, qty: l.qty, temperature: l.temperature, options: l.selections })),
      customer: { gender, age_band: ageBand },
    };

    try {
      const result = await api.createOrder(payload);
      cart.clear();
      nav('/complete', { replace: true, state: result });
    } catch (e) {
      if (e instanceof ApiError && e.errors?.received) setError(e.errors.received[0]);
      else if (e instanceof ApiError) setError(e.message);
      else setError('会計の保存に失敗しました。通信状態を確認してください。');
      setBusy(false);
    }
  };

  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }} onClick={() => nav('/cart')}>
            ‹
          </span>
          <span className="section-jp" style={{ fontSize: 18 }}>
            お会計
          </span>
        </div>
        <span className="chip">{cart.dineType === 'dine_in' ? '店内' : '持帰'}</span>
      </div>

      <div className="scroll" style={{ padding: '4px 18px 16px' }}>
        {/* total */}
        <div className="ticket" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 18px 16px', textAlign: 'center' }}>
            <div className="eyebrow">お会計金額</div>
            <div className="price" style={{ fontSize: 46, marginTop: 6, lineHeight: 1 }}>
              <span style={{ fontSize: 22 }}>¥</span>
              {yen(total)}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 6 }}>
              {cart.count}点 · 内税 ¥{yen(cart.tax)}
            </div>
          </div>
          <div className="perf" />
          <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-soft)' }}>
            <span>お預かり</span>
            <span className="price">{received != null ? <><span className="yen">¥</span>{yen(received)}</> : '—'}</span>
          </div>
          <div style={{ padding: '0 18px 14px', display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
            <span>おつり</span>
            <span className="price" style={{ color: 'var(--accent)' }}>
              {change != null && change >= 0 ? <><span className="yen">¥</span>{yen(change)}</> : '—'}
            </span>
          </div>
        </div>

        {/* cash received */}
        <div className="eyebrow" style={{ margin: '18px 2px 10px' }}>お預かり（現金）</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {/* ちょうど（常設） */}
          <button
            className={'btn' + (received === total ? ' btn-primary' : ' btn-ghost')}
            style={{ padding: '13px 6px', fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
            onClick={() => setReceived(total)}
          >
            ちょうど
          </button>
          {/* 管理側プリセット（合計以上） */}
          {quickPresets.map((a) => (
            <button
              key={a}
              className={'btn' + (received === a ? ' btn-primary' : ' btn-ghost')}
              style={{ padding: '13px 6px', fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
              onClick={() => setReceived(a)}
            >
              ¥{yen(a)}
            </button>
          ))}
          {/* 手入力（独自テンキー） */}
          <button
            className="btn btn-ghost"
            style={{ padding: '13px 6px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            onClick={() => setKeypad(true)}
          >
            手入力
          </button>
        </div>

        {/* customer segment tap（必須） */}
        <div className="eyebrow" style={{ margin: '20px 2px 10px' }}>
          客層 <span style={{ color: 'var(--accent)' }}>必須</span>
          {!segmentDone && <span style={{ color: 'var(--ink-mute)', fontWeight: 700, marginLeft: 8, letterSpacing: 0 }}>性別・年代を選択してください</span>}
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <div className="field-label">性別</div>
          <div className="seg">
            {GENDERS.map((g) => (
              <div key={g.v} className={'opt' + (gender === g.v ? ' on' : '')} onClick={() => setGender(gender === g.v ? null : g.v)}>
                {g.label}
              </div>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label">年代</div>
          <div className="seg">
            {AGE_BANDS.map((a) => (
              <div key={a.v} className={'opt' + (ageBand === a.v ? ' on' : '')} onClick={() => setAgeBand(ageBand === a.v ? null : a.v)}>
                {a.label}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 14, color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, textAlign: 'center' }}>{error}</div>
        )}
      </div>

      <div className="bottombar" style={{ padding: '14px 18px' }}>
        <button
          className="btn btn-accent"
          onClick={confirm}
          disabled={!canConfirm}
          style={{ width: '100%', padding: 16, fontSize: 16, opacity: canConfirm ? 1 : 0.5, cursor: canConfirm ? 'pointer' : 'default' }}
        >
          {busy ? '会計を保存中…' : '現金で会計を確定する'}
        </button>
      </div>

      {keypad && (
        <NumericKeypad
          title="お預かり金額（手入力）"
          initial={received ?? 0}
          min={total}
          onConfirm={(v) => {
            setReceived(v);
            setKeypad(false);
          }}
          onCancel={() => setKeypad(false)}
        />
      )}
    </div>
  );
}
