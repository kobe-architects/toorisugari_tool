import { useEffect, useState } from 'react';
import { api } from '@shared/api';
import type { CustomerAnalyticsDTO } from '@shared/types';
import { Donut, HBars } from '../charts';
import { Panel, Legend } from '../components/Panel';

const GENDER_COLORS: Record<string, string> = { 女性: '#B0402E', 男性: '#6B4A2E', その他: '#B98A3E' };

export function CustomerView() {
  const [data, setData] = useState<CustomerAnalyticsDTO | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.analytics
      .customers()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <div className="ticket" style={{ padding: 20, color: 'var(--accent)' }}>{error}</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>;

  const genderItems = data.gender.map((g) => ({ label: g.label, pct: g.pct, color: GENDER_COLORS[g.label] ?? 'var(--brown-2)' }));
  const topGender = [...data.gender].sort((a, b) => b.pct - a.pct)[0];
  const ageRows = data.age.map((a) => ({ label: a.label, value: a.value, pct: a.pct }));
  const topAge = [...data.age].sort((a, b) => b.pct - a.pct)[0];

  const notes: [string, string, string][] = [
    ['平均年齢', data.avg_age != null ? String(data.avg_age) : '—', data.avg_age != null ? '歳' : ''],
    ['客層サンプル数', String(data.sample_size), '件'],
    ['最多客層', data.top_segment, ''],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* seg notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {notes.map((s, i) => (
          <div key={i} className="ticket" style={{ padding: '16px 20px' }}>
            <div className="eyebrow" style={{ fontSize: 10 }}>{s[0]}</div>
            <div style={{ marginTop: 8 }}>
              <span className="stat-num" style={{ fontSize: s[2] ? 30 : 22 }}>{s[1]}</span>
              {s[2] && <span style={{ fontSize: 13, color: 'var(--ink-mute)', marginLeft: 3 }}>{s[2]}</span>}
            </div>
          </div>
        ))}
      </div>

      {data.sample_size === 0 ? (
        <div className="ticket" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)' }}>
          客層データがまだありません。レジの会計時に客層をタップ入力すると、ここに集計されます。
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 18 }}>
          <Panel title="性別構成" sub="会計時タップ入力">
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Donut data={genderItems.map((g) => ({ pct: g.pct, value: g.pct, color: g.color }))} size={172} thick={28} center={topGender ? [topGender.label, `${topGender.pct}%`] : undefined} />
              <div style={{ flex: 1 }}>
                <Legend items={genderItems} />
              </div>
            </div>
          </Panel>
          <Panel title="年代別構成" sub={topAge ? `最多は ${topAge.label}（${topAge.pct}%）` : undefined}>
            <HBars rows={ageRows} />
          </Panel>
        </div>
      )}
    </div>
  );
}
