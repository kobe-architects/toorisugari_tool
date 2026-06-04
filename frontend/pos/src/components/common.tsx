import type { ReactNode } from 'react';
import { yen } from '../lib/money';

/** 価格表示（明朝＋小さい¥）。 */
export function Yen({ v, className = '' }: { v: number; className?: string }) {
  return (
    <span className={'price ' + className}>
      <span className="yen">¥</span>
      {yen(v)}
    </span>
  );
}

/** ハンコ（判子）バッジ。 */
export function Stamp({
  children,
  size = 40,
  rot = -8,
  type = '',
}: {
  children: ReactNode;
  size?: number;
  rot?: number;
  type?: '' | 'sold' | 'sq';
}) {
  return (
    <span
      className={'stamp ' + type}
      style={{ width: size, height: size, fontSize: size * 0.42, transform: `rotate(${rot}deg)` }}
    >
      {children}
    </span>
  );
}

/** ステータスバー回避の上部スペーサ。 */
export function SafeTop() {
  return <div className="safe-top" />;
}

/** スマホ幅に収める外枠（中央寄せ）。 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: 460, margin: '0 auto', height: '100%', boxShadow: '0 0 40px rgba(0,0,0,.10)' }}>
      {children}
    </div>
  );
}
