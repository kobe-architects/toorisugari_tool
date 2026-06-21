import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const NAV = [
  { path: '/', label: '販売管理', sub: '売上・経費・損益の管理' },
  { path: '/customer', label: '顧客分析', sub: '性別・年代別の客層と来店傾向' },
  { path: '/orders', label: '伝票管理', sub: '伝票の閲覧・編集・取消' },
  { path: '/register', label: 'レジ管理', sub: '商品・メニューの設定' },
];

export function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, logout } = useAuth();
  const active = NAV.find((n) => n.path === loc.pathname) ?? NAV[0];

  const doLogout = async () => {
    await logout();
    nav('/login', { replace: true });
  };

  return (
    <div className="theme-roast paper-grain" style={{ width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'var(--gothic)', display: 'flex', position: 'relative', overflow: 'hidden', minWidth: 1180 }}>
      {/* sidebar */}
      <div style={{ width: 248, flexShrink: 0, background: 'var(--bar)', color: 'var(--bar-ink)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 5, padding: '24px 18px' }}>
        <div className="wordmark" style={{ fontSize: 18, color: 'var(--bar-ink)', padding: '0 6px 4px' }}>
          和紅茶
        </div>
        <div style={{ fontSize: 10.5, letterSpacing: '0.22em', color: 'rgba(243,234,214,0.5)', fontWeight: 700, padding: '0 6px 20px' }}>
          OWNER 管理コンソール
        </div>

        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(243,234,214,0.4)', fontWeight: 700, padding: '0 8px 8px' }}>分析</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map((n) => {
            const on = n.path === active.path;
            return (
              <div key={n.path} onClick={() => nav(n.path)} style={{ padding: '12px 12px', borderRadius: 10, cursor: 'pointer', background: on ? 'var(--bar-ink)' : 'transparent', color: on ? 'var(--bar)' : 'rgba(243,234,214,0.82)', fontWeight: 700, fontSize: 14 }}>
                {n.label}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 8px 0', borderTop: '1px solid rgba(243,234,214,0.15)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(243,234,214,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--brush)', fontSize: 17 }}>
            {user?.initial ?? '店'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.name ?? 'オーナー'}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(243,234,214,0.5)' }}>オーナー</div>
          </div>
          <button onClick={doLogout} title="ログアウト" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(243,234,214,0.7)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M16 17l5-5-5-5M21 12H9M12 19H5V5h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 32px 18px', borderBottom: '1.5px solid var(--line)' }}>
          <div>
            <div className="section-jp" style={{ fontSize: 26 }}>{active.label}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 3 }}>{active.sub}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
          <Outlet />
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 11, color: 'var(--ink-mute)' }}>
            とおりすがりの和紅茶 POS 管理コンソール
          </div>
        </div>
      </div>
    </div>
  );
}
