import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@shared/api';
import type { EventOptionDTO, EventSelection, GeocodeCandidate, RegionDTO, RegionSource } from '@shared/types';
import { SafeTop } from '../components/common';

const TODAY = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

/** イベントの選択状態。id=登録済み / none=イベントなし / new=新規名で作成。 */
type EventChoice = { kind: 'event'; id: number; name: string } | { kind: 'none' } | { kind: 'new' };

/** ログイン直後の開店設定。営業地域・イベント（必須選択）・イベント出店料（必須）。 */
export function RegionSetup() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<RegionDTO | null>(null);
  const [source, setSource] = useState<RegionSource>('gps');
  const [fee, setFee] = useState(''); // イベント出店料(円)。必須（0円可）
  const [events, setEvents] = useState<EventOptionDTO[]>([]);
  const [choice, setChoice] = useState<EventChoice | null>(null); // イベント選択（必須）
  const [newName, setNewName] = useState('');
  const [def, setDef] = useState<RegionDTO | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'locating' | 'ok' | 'error'>('idle');
  const [gpsMsg, setGpsMsg] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeocodeCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const autoTried = useRef(false);

  // 初期化：本日の設定・デフォルト地域を取得し、既存があれば選択。無ければGPSを自動試行。
  useEffect(() => {
    api.operatingDay
      .today()
      .then((t) => {
        setDef(t.default);
        if (t.event_fee != null) {
          setFee(String(t.event_fee));
          // 登録済みの日は選択状態を復元（event=null は「イベントなし」で登録済み）
          setChoice(t.event ? { kind: 'event', id: t.event.id, name: t.event.name } : { kind: 'none' });
        }
        if (t.region) {
          setSelected(t.region);
          setSource(t.source ?? 'manual');
        } else if (!autoTried.current) {
          autoTried.current = true;
          detectGps();
        }
      })
      .catch(() => {
        if (!autoTried.current) {
          autoTried.current = true;
          detectGps();
        }
      });
    api.operatingDay.eventOptions().then(setEvents).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsState('error');
      setGpsMsg('この端末では位置情報を利用できません');
      return;
    }
    setGpsState('locating');
    setGpsMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { result } = await api.geo.reverse(pos.coords.latitude, pos.coords.longitude);
          setSelected(result);
          setSource('gps');
          setGpsState('ok');
        } catch {
          // リバース失敗でも座標で確定できるようフォールバック
          setSelected({
            name: '現在地',
            label: `現在地（${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}）`,
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            timezone: 'Asia/Tokyo',
          });
          setSource('gps');
          setGpsState('ok');
        }
      },
      (err) => {
        setGpsState('error');
        setGpsMsg(err.code === err.PERMISSION_DENIED ? '位置情報が許可されていません' : '現在地を取得できませんでした');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const useDefault = () => {
    if (!def) return;
    setSelected(def);
    setSource('default');
  };

  const search = async () => {
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    setError('');
    try {
      const { results } = await api.geo.search(term);
      setResults(results.filter((r) => r.latitude !== null && r.longitude !== null));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '検索に失敗しました');
    } finally {
      setSearching(false);
    }
  };

  const pickCandidate = (c: GeocodeCandidate) => {
    setSelected({
      name: c.name,
      label: c.label,
      latitude: c.latitude as number,
      longitude: c.longitude as number,
      timezone: c.timezone || 'Asia/Tokyo',
    });
    setSource('search');
    setResults([]);
    setQ('');
  };

  const eventReady = choice != null && (choice.kind !== 'new' || newName.trim() !== '');
  const ready = selected != null && fee !== '' && eventReady;

  const start = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      const ev: EventSelection = choice!.kind === 'event'
        ? { event_id: choice!.id }
        : choice!.kind === 'new'
          ? { event_id: null, new_event_name: newName.trim() }
          : { event_id: null };
      await api.operatingDay.set(selected!, source, Number(fee), ev);
      nav('/', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const cardBtn: React.CSSProperties = { height: 52, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' };

  return (
    <div className="pos theme-roast paper-grain" style={{ background: 'var(--paper-2)' }}>
      <SafeTop />
      <div className="scroll" style={{ padding: '8px 24px 28px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginTop: 14, marginBottom: 4 }}>
          <span className="eyebrow">本日の開店設定</span>
          <div className="wordmark" style={{ fontSize: 24, justifyContent: 'center', color: 'var(--ink)', marginTop: 6 }}>
            出店エリアと出店料
          </div>
          <div style={{ fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            {TODAY}
          </div>
        </div>

        {/* 選択中の地域 */}
        <div className="ticket" style={{ padding: 16, marginTop: 16, marginBottom: 16 }}>
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>選択中</div>
          {selected ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.label || selected.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 4 }}>
                {SOURCE_LABEL[source]} ・ 緯度 {selected.latitude} / 経度 {selected.longitude}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
              {gpsState === 'locating' ? '現在地を取得中…' : '下のボタンから地域を選んでください'}
            </div>
          )}
        </div>

        {/* GPS / デフォルト */}
        <div style={{ display: 'grid', gridTemplateColumns: def ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 12 }}>
          <button className="btn" style={{ ...cardBtn, background: 'var(--bar)', color: 'var(--bar-ink)', opacity: gpsState === 'locating' ? 0.6 : 1 }} onClick={detectGps} disabled={gpsState === 'locating'}>
            {gpsState === 'locating' ? '取得中…' : '📍 現在地（GPS）'}
          </button>
          {def && (
            <button className="btn btn-ghost" style={cardBtn} onClick={useDefault}>
              既定：{def.name}
            </button>
          )}
        </div>
        {gpsState === 'error' && (
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>{gpsMsg}</div>
        )}

        {/* 手動検索 */}
        <div className="eyebrow" style={{ fontSize: 10, margin: '4px 0 8px' }}>地域名で検索</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={q}
            placeholder="例: 鹿児島県 / Kagoshima"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
            style={{ flex: 1, minWidth: 0, background: 'var(--card)', border: '1.5px solid var(--line-2)', borderRadius: 10, padding: '11px 12px', fontFamily: 'var(--gothic)', fontSize: 14, color: 'var(--ink)' }}
          />
          <button className="btn" style={{ padding: '0 18px', height: 44, background: 'var(--card)', border: '1.5px solid var(--line-2)', fontWeight: 700, cursor: 'pointer', opacity: searching || !q.trim() ? 0.5 : 1 }} onClick={search} disabled={searching || !q.trim()}>
            {searching ? '…' : '検索'}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {results.map((c, i) => (
              <button key={i} className="btn" onClick={() => pickCandidate(c)} style={{ textAlign: 'left', padding: '11px 13px', borderRadius: 10, border: '1.5px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer' }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* イベント選択（必須） */}
        <div className="ticket" style={{ padding: 16, marginTop: 18 }}>
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 10 }}>本日のイベント（必須）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {events.map((e) => {
              const on = choice?.kind === 'event' && choice.id === e.id;
              return (
                <button
                  key={e.id}
                  className="btn"
                  onClick={() => setChoice({ kind: 'event', id: e.id, name: e.name })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '11px 13px', borderRadius: 10, cursor: 'pointer', border: on ? '2px solid var(--accent)' : '1.5px solid var(--line-2)', background: on ? 'rgba(176,64,46,0.06)' : 'var(--card)' }}
                >
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                  {e.covers_today && <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--leaf)', border: '1px solid var(--leaf)', borderRadius: 6, padding: '2px 6px' }}>開催中</span>}
                  <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--ink-mute)' }}>
                    {e.start_date === e.end_date ? e.start_date.slice(5).replace('-', '/') : `${e.start_date.slice(5).replace('-', '/')}〜${e.end_date.slice(5).replace('-', '/')}`}
                  </span>
                </button>
              );
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              <button
                className="btn"
                onClick={() => setChoice({ kind: 'new' })}
                style={{ padding: '11px 8px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: choice?.kind === 'new' ? '2px solid var(--accent)' : '1.5px dashed var(--line-2)', background: choice?.kind === 'new' ? 'rgba(176,64,46,0.06)' : 'var(--card)' }}
              >
                ＋ 新しいイベント
              </button>
              <button
                className="btn"
                onClick={() => setChoice({ kind: 'none' })}
                style={{ padding: '11px 8px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: choice?.kind === 'none' ? 'var(--ink)' : 'var(--ink-mute)', border: choice?.kind === 'none' ? '2px solid var(--accent)' : '1.5px solid var(--line-2)', background: choice?.kind === 'none' ? 'rgba(176,64,46,0.06)' : 'var(--card)' }}
              >
                イベントなし（通常営業）
              </button>
            </div>
            {choice?.kind === 'new' && (
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="イベント名を入力（例：◯◯マルシェ）"
                style={{ background: 'var(--card)', border: '1.5px solid var(--line-2)', borderRadius: 10, padding: '12px 13px', fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}
              />
            )}
          </div>
          {choice?.kind === 'new' && (
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 8 }}>
              本日1日のイベントとして登録されます（期間はPCのイベント管理で変更できます）
            </div>
          )}
        </div>

        {/* イベント出店料（必須） */}
        <div className="ticket" style={{ padding: 16, marginTop: 18 }}>
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>本日のイベント出店料（必須）</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 17, color: 'var(--ink-soft)' }}>¥</span>
              <input
                inputMode="numeric"
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="例：3000"
                style={{ width: '100%', background: 'var(--card)', border: '1.5px solid var(--line-2)', borderRadius: 10, padding: '12px 12px 12px 32px', fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}
              />
            </div>
            <button className="btn btn-ghost" onClick={() => setFee('0')} style={{ height: 46, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              ¥0（無料）
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 8 }}>
            登録すると経費「イベント出店料」に自動計上されます（同日の再登録は上書き）
          </div>
        </div>

        {error && <div style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginTop: 14 }}>{error}</div>}

        {/* 開始 */}
        <button
          className="btn"
          onClick={start}
          disabled={!ready || busy}
          style={{ marginTop: 20, height: 56, borderRadius: 14, background: 'var(--accent)', color: '#FBEFD9', fontSize: 16, fontWeight: 700, cursor: !ready || busy ? 'default' : 'pointer', opacity: !ready || busy ? 0.5 : 1 }}
        >
          {busy ? '保存中…' : '営業を開始'}
        </button>
        {!ready && (
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 10 }}>
            {!selected
              ? '営業地域を選択してください'
              : !eventReady
                ? choice?.kind === 'new' ? 'イベント名を入力してください' : '本日のイベントを選択してください'
                : '出店料を入力してください（無料の場合は「¥0」）'}
          </div>
        )}
      </div>
    </div>
  );
}

const SOURCE_LABEL: Record<RegionSource, string> = {
  gps: 'GPSで取得',
  default: 'デフォルト地域',
  search: '検索で選択',
  manual: '手動設定',
};
