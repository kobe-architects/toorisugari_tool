import { useEffect, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type { EventDTO, EventsResponse } from '@shared/types';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

const COLS = '1.4fr 150px 60px 110px 70px 100px 100px 110px 64px 70px';

/** 金額表示。マイナスは朱色＋「−」。 */
function Money({ v, bold }: { v: number; bold?: boolean }) {
  const neg = v < 0;
  return (
    <span className="price" style={{ color: neg ? 'var(--accent)' : 'var(--ink)', fontWeight: bold ? 800 : 700 }}>
      {neg ? '−' : ''}<span className="yen">¥</span>{yen(Math.abs(v))}
    </span>
  );
}

function fmtPeriod(e: EventDTO): string {
  const f = (s: string) => {
    const [, m, d] = s.split('-');
    return `${Number(m)}/${Number(d)}`;
  };
  return e.start_date === e.end_date ? f(e.start_date) : `${f(e.start_date)}〜${f(e.end_date)}`;
}

export function EventsView() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [editing, setEditing] = useState<EventDTO | 'new' | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    api.admin.events.list().then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(load, []);

  const events = data?.events ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 全体サマリー */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <div className="ticket" style={{ padding: '16px 20px' }}>
            <div className="eyebrow" style={{ fontSize: 10 }}>全体売上（全期間）</div>
            <div style={{ marginTop: 8 }}><span className="stat-num" style={{ fontSize: 26 }}>¥{yen(data.overall_sales)}</span></div>
          </div>
          <div className="ticket" style={{ padding: '16px 20px', background: 'var(--card-2)' }}>
            <div className="eyebrow" style={{ fontSize: 10 }}>イベント売上 合計</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-num" style={{ fontSize: 26 }}>¥{yen(data.event_sales)}</span>
              {data.overall_sales > 0 && (
                <span style={{ fontSize: 12.5, color: 'var(--ink-mute)', fontWeight: 700 }}>全体の{Math.round((data.event_sales / data.overall_sales) * 100)}%</span>
              )}
            </div>
          </div>
          <div className="ticket" style={{ padding: '16px 20px', background: 'var(--card-2)' }}>
            <div className="eyebrow" style={{ fontSize: 10 }}>イベント利益 合計</div>
            <div style={{ marginTop: 8 }}>
              <span className="stat-num" style={{ fontSize: 26, color: data.event_profit < 0 ? 'var(--accent)' : 'var(--ink)' }}>
                {data.event_profit < 0 ? '−' : ''}¥{yen(Math.abs(data.event_profit))}
              </span>
            </div>
          </div>
        </div>
      )}

      <Panel
        title="イベント一覧"
        sub="期間内の会計・原価（自動計上）・出店料を日付で集計 ／ 利益 = 売上 − 原価 − 出店料（月単位の手入力経費は含みません）"
        right={<button className="btn btn-accent" style={{ padding: '9px 16px', fontSize: 13.5, cursor: 'pointer' }} onClick={() => setEditing('new')}>＋ イベントを登録</button>}
      >
        {error && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        {!data ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
        ) : events.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
            イベントが未登録です。「＋ イベントを登録」から出店イベント名と期間を登録してください。
          </div>
        ) : (
          <div style={{ minWidth: 980, overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.08em', padding: '0 12px 10px' }}>
              <span>イベント名</span>
              <span>期間</span>
              <span style={{ textAlign: 'right' }}>日数</span>
              <span style={{ textAlign: 'right' }}>売上</span>
              <span style={{ textAlign: 'right' }}>会計</span>
              <span style={{ textAlign: 'right' }}>原価(自動)</span>
              <span style={{ textAlign: 'right' }}>出店料</span>
              <span style={{ textAlign: 'right', color: 'var(--brown)' }}>利益</span>
              <span style={{ textAlign: 'right' }}>利益率</span>
              <span />
            </div>
            {events.map((e) => (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '11px 12px', borderTop: '1px dashed var(--line-2)' }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                  {e.note && <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note}</span>}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{fmtPeriod(e)}</span>
                <span style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>{e.days}日</span>
                <span style={{ textAlign: 'right' }}><Money v={e.sales} /></span>
                <span style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>{e.order_count}</span>
                <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(e.cost_auto)}</span>
                <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(e.event_fee)}</span>
                <span style={{ textAlign: 'right' }}><Money v={e.profit} bold /></span>
                <span style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-mute)' }}>{e.margin != null ? `${e.margin}%` : '—'}</span>
                <span style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => setEditing(e)}>編集</button>
                </span>
              </div>
            ))}
            {/* 合計 */}
            <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '13px 12px 4px', borderTop: '2px solid var(--line-2)', marginTop: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>合計（{events.length}件）</span>
              <span />
              <span style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>{events.reduce((s, e) => s + e.days, 0)}日</span>
              <span style={{ textAlign: 'right' }}><Money v={events.reduce((s, e) => s + e.sales, 0)} bold /></span>
              <span style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--ink-soft)' }}>{events.reduce((s, e) => s + e.order_count, 0)}</span>
              <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(events.reduce((s, e) => s + e.cost_auto, 0))}</span>
              <span style={{ textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(events.reduce((s, e) => s + e.event_fee, 0))}</span>
              <span style={{ textAlign: 'right' }}><Money v={events.reduce((s, e) => s + e.profit, 0)} bold /></span>
              <span />
              <span />
            </div>
          </div>
        )}
      </Panel>

      {editing && (
        <EventEditorModal
          event={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/** イベントの登録・編集モーダル。 */
function EventEditorModal({ event, onClose, onSaved }: { event: EventDTO | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(event?.name ?? '');
  const [start, setStart] = useState(event?.start_date ?? '');
  const [end, setEnd] = useState(event?.end_date ?? '');
  const [note, setNote] = useState(event?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 開始日入力時、終了日が未入力なら同日をセット（1日イベントの入力を短縮）
  const onStart = (v: string) => {
    setStart(v);
    if (!end || end < v) setEnd(v);
  };

  const valid = name.trim() !== '' && start !== '' && end !== '' && end >= start;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const input = { name: name.trim(), start_date: start, end_date: end, note: note.trim() || null };
      if (event) await api.admin.events.update(event.id, input);
      else await api.admin.events.create(input);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!event || busy) return;
    if (!confirm(`「${event.name}」を削除しますか？\n売上・経費のデータには影響しません。`)) return;
    setBusy(true);
    try {
      await api.admin.events.remove(event.id);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '削除に失敗しました');
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="ticket theme-roast" style={{ width: 460, maxHeight: '88vh', overflowY: 'auto', padding: '22px 24px', background: 'var(--card-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span className="section-jp" style={{ fontSize: 19 }}>{event ? 'イベントを編集' : 'イベントを登録'}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="field">
          <div className="field-label">イベント名 <span className="req">必須</span></div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：◯◯マルシェ 夏の陣" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <div className="field-label">開始日 <span className="req">必須</span></div>
            <input className="input" type="date" value={start} onChange={(e) => onStart(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <div className="field-label">終了日 <span className="req">必須</span></div>
            <input className="input" type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <div className="field-label">メモ</div>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：会場・ブース番号など" />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', lineHeight: 1.8 }}>
          期間内の会計・原価・出店料が自動で集計されます。期間が他のイベントと重なると両方に計上されるためご注意ください。
        </div>

        {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {event && <button className="btn" onClick={remove} disabled={busy} style={{ padding: '11px 16px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', fontSize: 13.5, cursor: 'pointer' }}>削除</button>}
          <button className="btn btn-accent" onClick={save} disabled={!valid || busy} style={{ flex: 1, padding: 13, fontSize: 14.5, cursor: 'pointer', opacity: !valid || busy ? 0.5 : 1 }}>
            {busy ? '保存中…' : event ? '変更を保存' : '登録する'}
          </button>
        </div>
      </div>
    </div>
  );
}
