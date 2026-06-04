import { useState } from 'react';
import { SalesView } from './SalesView';
import { ExpenseView } from './ExpenseView';
import { ProfitView } from './ProfitView';

type Tab = 'sales' | 'expense' | 'profit';
const TABS: { k: Tab; label: string }[] = [
  { k: 'sales', label: '売上管理' },
  { k: 'expense', label: '経費管理' },
  { k: 'profit', label: '損益管理' },
];

export function SalesAdminPage() {
  const [tab, setTab] = useState<Tab>('sales');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* タブ */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1.5px solid var(--line)' }}>
        {TABS.map((t) => {
          const on = t.k === tab;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="btn"
              style={{
                padding: '12px 22px',
                borderRadius: '10px 10px 0 0',
                fontSize: 14.5,
                cursor: 'pointer',
                background: on ? 'var(--card-2)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-mute)',
                border: on ? '1.5px solid var(--line)' : '1.5px solid transparent',
                borderBottom: on ? '1.5px solid var(--card-2)' : '1.5px solid transparent',
                marginBottom: -1.5,
                fontFamily: 'var(--mincho)',
                fontWeight: 700,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'sales' && <SalesView />}
      {tab === 'expense' && <ExpenseView />}
      {tab === 'profit' && <ProfitView />}
    </div>
  );
}
