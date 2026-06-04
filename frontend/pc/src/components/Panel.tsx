import type { CSSProperties, ReactNode } from 'react';

export function Panel({
  title,
  sub,
  right,
  children,
  style,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="ticket" style={{ padding: '18px 22px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 16, gap: 12 }}>
        <div>
          <div className="eyebrow">{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 3 }}>{sub}</div>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>{right}</div>
      </div>
      {children}
    </div>
  );
}

/** 前期比バッジ。 */
export function Delta({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-mute)' }}>前期比 —</span>;
  }
  const up = pct >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: up ? 'var(--leaf)' : 'var(--accent)' }}>
      {up ? '▲' : '▼'} 前期比 {up ? '+' : ''}{pct}%
    </span>
  );
}

export function SeriesLegend() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-soft)', fontWeight: 700 }}>
        <span style={{ width: 18, height: 3, background: 'var(--brown)', borderRadius: 2 }} />当期
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-mute)', fontWeight: 700 }}>
        <span style={{ width: 18, height: 0, borderTop: '2px dashed var(--ink-mute)' }} />前期
      </span>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; pct: number; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {items.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', flex: 1 }}>{d.label}</span>
          <span className="price" style={{ fontSize: 14 }}>{d.pct}%</span>
        </div>
      ))}
    </div>
  );
}
