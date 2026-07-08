import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@shared/api';
import type { GeocodeCandidate, RegionDTO, RegionSource } from '@shared/types';
import { SafeTop } from '../components/common';

const TODAY = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

/** ログイン直後の「本日の営業地域」設定。GPS自動取得＋デフォルト＋手動検索。 */
export function RegionSetup() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<RegionDTO | null>(null);
  const [source, setSource] = useState<RegionSource>('gps');
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

  const start = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.operatingDay.set(selected, source);
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
          <span className="eyebrow">本日の営業地域</span>
          <div className="wordmark" style={{ fontSize: 24, justifyContent: 'center', color: 'var(--ink)', marginTop: 6 }}>
            出店エリアを設定
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

        {error && <div style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginTop: 14 }}>{error}</div>}

        {/* 開始 */}
        <button
          className="btn"
          onClick={start}
          disabled={!selected || busy}
          style={{ marginTop: 20, height: 56, borderRadius: 14, background: 'var(--accent)', color: '#FBEFD9', fontSize: 16, fontWeight: 700, cursor: !selected || busy ? 'default' : 'pointer', opacity: !selected || busy ? 0.5 : 1 }}
        >
          {busy ? '保存中…' : 'この地域で営業を開始'}
        </button>
        <button className="btn" onClick={() => nav('/', { replace: true })} style={{ marginTop: 10, height: 40, background: 'transparent', color: 'var(--ink-mute)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
          あとで設定する
        </button>
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
