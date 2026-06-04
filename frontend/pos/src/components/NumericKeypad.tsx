import { useState } from 'react';
import { yen } from '../lib/money';

/** スマホ用 独自テンキー（整数のみ）。端末キーボードを出さずに金額入力する。 */
export function NumericKeypad({
  title = 'お預かり金額',
  initial = 0,
  min,
  onConfirm,
  onCancel,
}: {
  title?: string;
  initial?: number;
  min?: number; // これ未満は確定不可（例: 合計金額）
  onConfirm: (value: number) => void;
  onCancel: () => void;
}) {
  const [s, setS] = useState(initial > 0 ? String(initial) : '');
  const value = s === '' ? 0 : parseInt(s, 10);
  const ok = min == null || value >= min;

  const press = (k: string) => {
    if (k === 'back') return setS((p) => p.slice(0, -1));
    if (k === 'clear') return setS('');
    const next = (s + k).replace(/^0+(?=\d)/, ''); // 先頭ゼロ抑制
    if (next.length <= 7) setS(next); // 最大1,000万円弱
  };

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'];

  return (
    <div onClick={onCancel} style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="theme-roast" style={{ width: '100%', background: 'var(--card-2)', borderRadius: '18px 18px 0 0', padding: '18px 18px 22px', boxShadow: '0 -8px 24px rgba(40,28,16,0.25)' }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-mute)', fontWeight: 700, marginBottom: 4 }}>{title}</div>
        {/* 入力ディスプレイ */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span className="price" style={{ fontSize: 40, color: ok ? 'var(--ink)' : 'var(--ink-mute)' }}>
            <span style={{ fontSize: 22 }}>¥</span>{yen(value)}
          </span>
        </div>
        {min != null && !ok && (
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--accent)', fontWeight: 700, marginBottom: 8 }}>
            合計（¥{yen(min)}）以上を入力してください
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 340, margin: '8px auto 0' }}>
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="btn"
              style={{ height: 60, fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: k === 'back' ? 22 : 24, background: 'var(--card)', border: '1.5px solid var(--line)', color: 'var(--ink)', cursor: 'pointer' }}
            >
              {k === 'back' ? '←' : k}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, maxWidth: 340, margin: '12px auto 0' }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1, padding: 14, fontSize: 14, cursor: 'pointer' }}>
            キャンセル
          </button>
          <button
            className="btn btn-accent"
            onClick={() => ok && onConfirm(value)}
            disabled={!ok}
            style={{ flex: 1.4, padding: 14, fontSize: 15, cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.5 }}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
