import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/api';
import type { TodaySummaryDTO } from '@shared/types';
import { useAuth } from '../../state/AuthContext';
import { Stamp, SafeTop } from '../../components/common';
import { yen } from '../../lib/money';

const AIco: Record<string, string> = {
  box: 'M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8M12 12v8',
  staff: 'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20a7 7 0 0 1 14 0',
  shop: 'M4 9l1.5-4h13L20 9M4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0',
  pay: 'M3 7h18v10H3zM3 11h18M7 15h3',
  chart: 'M5 19V11M12 19V5M19 19v-5',
};

function Row({ icon, title, sub, tag, onClick }: { icon: string; title: string; sub: string; tag?: string; onClick?: () => void }) {
  return (
    <div className="arow" style={{ opacity: onClick ? 1 : 0.55, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="ico">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d={AIco[icon]} />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 1 }}>{sub}</div>
      </div>
      {tag && <span className="chip" style={{ fontSize: 10.5, padding: '2px 8px' }}>{tag}</span>}
      <svg className="chev" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--ink-mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 1l6 6-6 6" />
      </svg>
    </div>
  );
}

export function AdminHome() {
  const nav = useNavigate();
  const { staff, logout } = useAuth();
  const [sum, setSum] = useState<TodaySummaryDTO | null>(null);

  useEffect(() => {
    api.admin.summaryToday().then(setSum).catch(() => setSum(null));
  }, []);

  const maxHour = sum ? Math.max(1, ...sum.hours.map((h) => h.total)) : 1;
  const peakIdx = sum ? sum.hours.reduce((best, h, i, arr) => (h.total > arr[best].total ? i : best), 0) : -1;
  const dineRatio = sum && sum.order_count > 0 ? `${Math.round((sum.dine_in / sum.order_count) * 10)}:${10 - Math.round((sum.dine_in / sum.order_count) * 10)}` : '—';

  const doLogout = async () => {
    await logout();
    nav('/login', { replace: true });
  };

  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <div className="wordmark" style={{ fontSize: 19 }}>
          和紅茶
          <span style={{ fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', marginLeft: 6 }}>
            管理
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="chip leaf">営業中</span>
          <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--card)', border: '1.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--brush)', fontSize: 16, color: 'var(--ink-soft)' }}>
            {staff?.initial ?? '店'}
          </span>
        </div>
      </div>

      <div className="scroll" style={{ padding: '4px 16px 16px' }}>
        {/* today summary */}
        <div className="ticket" style={{ overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ padding: '15px 18px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow">本日の売上 · {sum?.date ?? '—'}</div>
              <div className="stat-num" style={{ fontSize: 40, marginTop: 6 }}>
                <span style={{ fontSize: 20 }}>¥</span>
                {yen(sum?.total_sales ?? 0)}
              </div>
            </div>
            {(sum?.total_sales ?? 0) > 0 && (
              <Stamp size={50} rot={-10}>
                好調
              </Stamp>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 42, padding: '0 18px 4px' }}>
            {(sum?.hours ?? []).map((h, i) => (
              <div
                key={h.hour}
                title={`${h.hour}時 ¥${yen(h.total)}`}
                style={{ flex: 1, height: `${(h.total / maxHour) * 100}%`, minHeight: 2, borderRadius: '3px 3px 0 0', background: i === peakIdx && h.total > 0 ? 'var(--accent)' : 'var(--brown-2)', opacity: i === peakIdx && h.total > 0 ? 1 : 0.5 }}
              />
            ))}
          </div>
          <div className="perf" />
          <div style={{ display: 'flex', padding: '12px 18px' }}>
            {[
              ['会計件数', String(sum?.order_count ?? 0), '件'],
              ['客単価', yen(sum?.avg_price ?? 0), '円'],
              ['店内/持帰', dineRatio, ''],
            ].map((s, i) => (
              <div key={s[0]} style={{ flex: 1, borderLeft: i ? '1px dashed var(--line-2)' : 'none', paddingLeft: i ? 14 : 0 }}>
                <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700 }}>{s[0]}</div>
                <div style={{ marginTop: 3 }}>
                  <span className="stat-num" style={{ fontSize: 21 }}>{s[1]}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-mute)', marginLeft: 2 }}>{s[2]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* settings */}
        <div className="eyebrow" style={{ margin: '0 2px 9px' }}>店舗運営</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
          <Row icon="box" title="商品管理" sub="価格・売切・表示の管理" onClick={() => nav('/admin/products')} />
          <Row icon="staff" title="スタッフ管理" sub="今後のフェーズで対応" />
          <Row icon="shop" title="営業・店舗設定" sub="今後のフェーズで対応" />
        </div>
        <div className="eyebrow" style={{ margin: '0 2px 9px' }}>会計・データ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Row icon="pay" title="決済設定" sub="現在は現金のみ" />
          <Row icon="chart" title="売上サマリー" sub="日次・月次（PCで確認）" tag="PC" />
        </div>
      </div>

      <div className="bottombar" style={{ padding: '12px 16px', display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, padding: 13, fontSize: 14, cursor: 'pointer' }} onClick={doLogout}>
          ログアウト
        </button>
        <button className="btn" style={{ flex: 1.4, padding: 13, background: 'var(--bar)', color: 'var(--bar-ink)', fontSize: 14, cursor: 'pointer' }} onClick={() => nav('/')}>
          レジ画面へ戻る →
        </button>
      </div>
    </div>
  );
}
