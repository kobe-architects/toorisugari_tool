import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type { CalendarEntryDTO } from '@shared/types';
import { Panel } from '../components/Panel';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** 予定の時刻表示（終日は空）。 */
function fmtTime(e: CalendarEntryDTO): string {
  if (!e.start_time) return '';
  return e.end_time ? `${e.start_time}〜${e.end_time}` : e.start_time;
}

export function CalendarView() {
  const today = ymd(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() }; // m: 0-11
  });
  const [entries, setEntries] = useState<CalendarEntryDTO[]>([]);
  const [editing, setEditing] = useState<CalendarEntryDTO | { date: string } | null>(null);
  const [error, setError] = useState('');

  const monthKey = `${cursor.y}-${pad2(cursor.m + 1)}`;

  const load = () => {
    api.calendar.list(monthKey)
      .then(setEntries)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [monthKey]);

  // 月カレンダーのマス（前月末〜翌月頭で6週42マス）
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const start = new Date(cursor.y, cursor.m, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date: ymd(d), day: d.getDate(), inMonth: d.getMonth() === cursor.m, dow: d.getDay() };
    });
  }, [cursor]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntryDTO[]>();
    for (const e of entries) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [entries]);

  const move = (diff: number) => {
    const d = new Date(cursor.y, cursor.m + diff, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Panel
        title="カレンダー"
        sub="日付をクリックすると予定を登録できます ／ 予定をクリックすると編集できます"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-ghost" style={{ padding: '7px 13px', fontSize: 13, cursor: 'pointer' }} onClick={() => move(-1)}>◀ 前月</button>
            <span className="section-jp" style={{ fontSize: 19, minWidth: 120, textAlign: 'center' }}>{cursor.y}年{cursor.m + 1}月</span>
            <button className="btn btn-ghost" style={{ padding: '7px 13px', fontSize: 13, cursor: 'pointer' }} onClick={() => move(1)}>翌月 ▶</button>
            <button
              className="btn btn-ghost"
              style={{ padding: '7px 13px', fontSize: 13, cursor: 'pointer' }}
              onClick={() => { const now = new Date(); setCursor({ y: now.getFullYear(), m: now.getMonth() }); }}
            >
              今日
            </button>
            <button className="btn btn-accent" style={{ padding: '9px 16px', fontSize: 13.5, cursor: 'pointer' }} onClick={() => setEditing({ date: today })}>
              ＋ 予定を登録
            </button>
          </div>
        }
      >
        {error && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderLeft: '1px solid var(--line)', borderTop: '1px solid var(--line)' }}>
          {WEEK.map((w, i) => (
            <div key={w} style={{ padding: '7px 0', textAlign: 'center', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.15em', color: i === 0 ? 'var(--accent)' : i === 6 ? '#3E5C76' : 'var(--ink-mute)', borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--card-2)' }}>
              {w}
            </div>
          ))}
          {cells.map((c) => {
            const list = byDate.get(c.date) ?? [];
            const isToday = c.date === today;
            return (
              <div
                key={c.date}
                onClick={() => setEditing({ date: c.date })}
                style={{ minHeight: 96, padding: '6px 6px 8px', borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', cursor: 'pointer', background: c.inMonth ? 'transparent' : 'rgba(58,43,30,0.045)', opacity: c.inMonth ? 1 : 0.55 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', fontSize: 12.5, fontWeight: 800, background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? '#fff' : c.dow === 0 ? 'var(--accent)' : c.dow === 6 ? '#3E5C76' : 'var(--ink-soft)' }}>
                    {c.day}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                  {list.map((e) => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); setEditing(e); }}
                      title={`${e.title}${fmtTime(e) ? ` ${fmtTime(e)}` : ''}${e.memo ? `\n${e.memo}` : ''}`}
                      style={{ padding: '3px 7px', borderRadius: 6, background: 'var(--bar)', color: 'var(--bar-ink)', fontSize: 11.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {fmtTime(e) && <span style={{ opacity: 0.75, marginRight: 4, fontSize: 10.5 }}>{e.start_time}</span>}
                      {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {editing && (
        <EntryEditorModal
          entry={'id' in editing ? editing : null}
          defaultDate={'id' in editing ? editing.date : editing.date}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/** 予定の登録・編集モーダル。 */
function EntryEditorModal({ entry, defaultDate, onClose, onSaved }: { entry: CalendarEntryDTO | null; defaultDate: string; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [title, setTitle] = useState(entry?.title ?? '');
  const [start, setStart] = useState(entry?.start_time ?? '');
  const [end, setEnd] = useState(entry?.end_time ?? '');
  const [memo, setMemo] = useState(entry?.memo ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const valid = date !== '' && title.trim() !== '';

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const input = {
        date,
        title: title.trim(),
        start_time: start || null,
        end_time: start && end ? end : null, // 開始なしで終了のみは保存しない
        memo: memo.trim() || null,
      };
      if (entry) await api.calendar.update(entry.id, input);
      else await api.calendar.create(input);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!entry || busy) return;
    if (!confirm(`「${entry.title}」を削除しますか？`)) return;
    setBusy(true);
    try {
      await api.calendar.remove(entry.id);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '削除に失敗しました');
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="ticket theme-roast" style={{ width: 440, maxHeight: '88vh', overflowY: 'auto', padding: '22px 24px', background: 'var(--card-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span className="section-jp" style={{ fontSize: 19 }}>{entry ? '予定を編集' : '予定を登録'}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="field">
          <div className="field-label">日付 <span className="req">必須</span></div>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label">予定名 <span className="req">必須</span></div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：◯◯マルシェ出店 ／ 茶葉の仕入れ" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <div className="field-label">開始時刻（任意）</div>
            <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <div className="field-label">終了時刻（任意）</div>
            <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={!start} />
          </div>
        </div>
        <div className="field">
          <div className="field-label">メモ（任意）</div>
          <textarea className="input" rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        {error && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {entry && (
            <button className="btn btn-ghost" style={{ padding: '10px 16px', fontSize: 13.5, cursor: 'pointer', color: 'var(--accent)' }} onClick={remove} disabled={busy}>
              削除
            </button>
          )}
          <button className="btn btn-accent" style={{ marginLeft: 'auto', padding: '10px 22px', fontSize: 14, cursor: valid ? 'pointer' : 'default', opacity: valid ? 1 : 0.5 }} onClick={save} disabled={!valid || busy}>
            {busy ? '保存中…' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
