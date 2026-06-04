import type { CSSProperties, ReactElement } from 'react';

// 手描き風ラインアイコン（元デザイン data.jsx の Ico を移植）。currentColor で着色。
const s: CSSProperties = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const t: CSSProperties = { ...s, strokeWidth: 1.3 };

export const Ico: Record<string, ReactElement> = {
  cup: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M14 26h32v12a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z" />
      <path style={s} d="M46 29h5a6 6 0 0 1 0 12h-4" />
      <path style={t} d="M24 12c-2 3 2 5 0 8M32 11c-2 3 2 5 0 8M40 12c-2 3 2 5 0 8" />
      <path style={s} d="M12 58h40" />
    </svg>
  ),
  ice: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M18 20h28l-3 34a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z" />
      <path style={t} d="M20 34l24 0M30 28l6 6-6 6M40 30l-6 12" />
      <path style={s} d="M22 20l4-8h12l4 8" />
    </svg>
  ),
  latte: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M16 24h32v22a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12z" />
      <path style={s} d="M48 28h4a6 6 0 0 1 0 12h-4" />
      <path style={t} d="M16 34h32" />
      <path style={t} d="M27 44c0-3 5-3 5-6s-5-3-5-6M37 44c0-3-5-3-5-6" />
    </svg>
  ),
  pot: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M10 36a18 12 0 0 0 36 0z" />
      <path style={s} d="M10 36a18 12 0 0 1 36 0" />
      <path style={s} d="M46 30c8 0 9 14 1 16" />
      <path style={s} d="M4 33l6 2" />
      <path style={t} d="M22 24c-1-3 2-4 2-7M30 24c-1-3 2-4 2-7" />
      <path style={s} d="M20 24h16" />
      <path style={s} d="M16 52h26" />
      <path style={s} d="M22 48v4M36 48v4" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M18 24h28l-2 30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" />
      <path style={s} d="M18 24l3-6h22l3 6" />
      <path style={t} d="M26 34h12M26 42h12" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M44 14C26 16 16 28 16 44c16 0 32-10 32-30z" />
      <path style={t} d="M18 42C28 36 36 28 42 18" />
      <path style={s} d="M16 44c-2 3-3 6-3 9" />
    </svg>
  ),
  chiffon: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M12 34h40v8a14 10 0 0 1-40 0z" />
      <path style={s} d="M12 34a20 12 0 0 1 40 0" />
      <ellipse style={s} cx="32" cy="34" rx="6" ry="3.5" />
      <path style={t} d="M20 30c0-3 3-3 3-6M44 30c0-3-3-3-3-6" />
    </svg>
  ),
  cookie: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M32 12a20 20 0 1 0 .1 0z" />
      <circle style={t} cx="26" cy="26" r="1.6" />
      <circle style={t} cx="38" cy="30" r="1.6" />
      <circle style={t} cx="30" cy="40" r="1.6" />
      <circle style={t} cx="40" cy="40" r="1.6" />
    </svg>
  ),
  yokan: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M12 30l14-6 26 8-14 6z" />
      <path style={s} d="M12 30v10l26 8V38M52 32v10L38 48" />
      <path style={t} d="M22 33l24 7" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path style={s} d="M14 26h36v26a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" />
      <path style={s} d="M10 20h44v6H10z" />
      <path style={s} d="M32 20v36" />
      <path style={t} d="M32 20c-6-10-16-2-8 0M32 20c6-10 16-2 8 0" />
    </svg>
  ),
};

/** 商品アイコンを正方形枠で描画。icon キーが無ければ商品名の頭文字にフォールバック。 */
export function ProductIcon({ icon, size = 44, fallback }: { icon: string | null; size?: number; fallback?: string }): ReactElement {
  const art = icon ? Ico[icon] : undefined;
  if (art) {
    return <div style={{ width: size, height: size, color: 'var(--brown)' }}>{art}</div>;
  }
  return (
    <span className="section-jp" style={{ fontSize: size * 0.6, color: 'var(--brown)' }}>
      {fallback?.slice(0, 1) ?? '茶'}
    </span>
  );
}
