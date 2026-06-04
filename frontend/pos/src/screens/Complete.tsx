import { useNavigate } from 'react-router-dom';
import type { OrderResultDTO } from '@shared/types';
import { useLocationState } from '../lib/useLocationState';
import { Yen, Stamp, SafeTop } from '../components/common';
import { yen } from '../lib/money';

export function Complete() {
  const nav = useNavigate();
  const order = useLocationState<OrderResultDTO>();

  // 直接アクセス等で会計データが無い場合は注文へ戻す
  if (!order) {
    return (
      <div className="pos theme-roast paper-grain" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <SafeTop />
        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--ink-mute)' }}>
          会計データがありません
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" style={{ padding: '12px 20px', cursor: 'pointer' }} onClick={() => nav('/')}>
              注文画面へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos theme-roast paper-grain" style={{ background: 'var(--bar)' }}>
      <SafeTop />
      <div className="scroll" style={{ padding: '10px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginTop: 24, marginBottom: 18 }}>
          <Stamp size={130} rot={-9}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, fontSize: 30 }}>
              <span>御</span>
              <span>会計</span>
              <span style={{ fontSize: 15, marginTop: 2 }}>済</span>
            </span>
          </Stamp>
        </div>
        <div style={{ fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 22, color: 'var(--bar-ink)', letterSpacing: '0.08em' }}>
          ありがとうございました
        </div>
        <div style={{ color: 'rgba(243,234,214,0.6)', fontSize: 12.5, marginTop: 6 }}>またのお越しをお待ちしております</div>

        {/* receipt */}
        <div className="ticket" style={{ width: '100%', maxWidth: 300, marginTop: 26, padding: '18px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <span className="wordmark" style={{ fontSize: 16, justifyContent: 'center', color: 'var(--ink)' }}>
              とおりすがりの和紅茶
            </span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mute)', marginBottom: 10 }}>
            伝票 No.{order.order_no} · {order.dine_type === 'dine_in' ? '店内' : '持帰'}
          </div>
          <div className="hr-dash" style={{ marginBottom: 10 }} />
          {order.items.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', color: 'var(--ink-soft)' }}>
              <span>
                {r.name}
                {r.qty > 1 ? ` ×${r.qty}` : ''}
              </span>
              <span className="price">
                <span className="yen">¥</span>
                {yen(r.line_total)}
              </span>
            </div>
          ))}
          <div className="hr-dash" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
            <span>合計</span>
            <Yen v={order.total} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>
            <span>内消費税</span>
            <span>¥{yen(order.tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 6 }}>
            <span>現金 / おつり</span>
            <span>
              ¥{yen(order.received)} / ¥{yen(order.change)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 300, marginTop: 22 }}>
          <button
            className="btn btn-ghost"
            disabled
            style={{ flex: 1, padding: 14, color: 'var(--bar-ink)', borderColor: 'rgba(243,234,214,0.4)', opacity: 0.6 }}
            title="フェーズ8で実装"
          >
            レシート印刷
          </button>
          <button
            className="btn"
            style={{ flex: 1.3, padding: 14, background: 'var(--card-2)', color: 'var(--ink)', fontSize: 15, cursor: 'pointer' }}
            onClick={() => nav('/', { replace: true })}
          >
            次のお客様へ →
          </button>
        </div>
      </div>
    </div>
  );
}
