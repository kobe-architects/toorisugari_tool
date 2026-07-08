import { useEffect, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type { GeocodeCandidate, RegionDTO } from '@shared/types';
import { Panel } from '../components/Panel';

const inputStyle: React.CSSProperties = {
  background: 'var(--card-2)',
  border: '1.5px solid var(--line-2)',
  borderRadius: 10,
  padding: '10px 12px',
  fontFamily: 'var(--gothic)',
  fontSize: 14,
  color: 'var(--ink)',
  minWidth: 260,
};

export function SystemSettingsView() {
  const [region, setRegion] = useState<RegionDTO | null>(null);
  const [fallback, setFallback] = useState<RegionDTO | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeocodeCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin
      .systemSettings()
      .then((s) => { setRegion(s.region); setFallback(s.fallback ?? null); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoaded(true));
  }, []);

  const search = async () => {
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    setSearched(false);
    setError('');
    try {
      const { results } = await api.geo.search(term);
      setResults(results.filter((r) => r.latitude !== null && r.longitude !== null));
      setSearched(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '検索に失敗しました');
    } finally {
      setSearching(false);
    }
  };

  const persist = async (next: RegionDTO | null) => {
    setBusy(true);
    setSaved('');
    setError('');
    try {
      const s = await api.admin.updateSystemSettings({ region: next });
      setRegion(s.region);
      setSaved(next ? '地域を保存しました' : '地域設定を解除しました');
      setResults([]);
      setSearched(false);
      setQ('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const selectCandidate = (c: GeocodeCandidate) => {
    persist({
      name: c.name,
      label: c.label,
      latitude: c.latitude as number,
      longitude: c.longitude as number,
      timezone: c.timezone || 'Asia/Tokyo',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 }}>
      <Panel title="デフォルト地域" sub="POSレジのログイン時に初期表示する地域。各営業日の地域はPOS側で設定でき（GPS等）、天気表示はその日の設定を優先します">
        {!loaded ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
        ) : (
          <>
            {/* 現在の設定 */}
            <div style={{ marginBottom: 18 }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>現在のデフォルト地域</div>
              {region ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{region.label || region.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 3 }}>
                      緯度 {region.latitude} / 経度 {region.longitude} ・ {region.timezone}
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => persist(null)} disabled={busy} style={{ padding: '8px 14px', fontSize: 12.5, cursor: busy ? 'default' : 'pointer' }}>
                    解除
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
                  未設定です。下で地域を検索して設定してください。
                  {fallback && <>（未設定時は <strong style={{ color: 'var(--ink-soft)' }}>{fallback.label || fallback.name}</strong>）</>}
                </div>
              )}
            </div>

            {/* 検索フォーム */}
            <div className="field-label" style={{ marginBottom: 8 }}>地域を検索</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                style={inputStyle}
                value={q}
                placeholder="例: 鹿児島県 / Kagoshima"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
              />
              <button className="btn btn-accent" onClick={search} disabled={searching || !q.trim()} style={{ padding: '10px 20px', fontSize: 13.5, cursor: searching ? 'default' : 'pointer', opacity: searching || !q.trim() ? 0.5 : 1 }}>
                {searching ? '検索中…' : '検索'}
              </button>
            </div>

            {/* 候補 */}
            {searched && results.length === 0 && (
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-mute)' }}>該当する地域が見つかりませんでした。</div>
            )}
            {results.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((c, i) => (
                  <button
                    key={i}
                    className="btn"
                    onClick={() => selectCandidate(c)}
                    disabled={busy}
                    style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--line-2)', background: 'var(--card-2)', cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <span style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-mute)', marginLeft: 8 }}>{c.latitude}, {c.longitude}</span>
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>選択 →</span>
                  </button>
                ))}
              </div>
            )}

            {/* ステータス */}
            {(saved || error) && (
              <div style={{ marginTop: 14 }}>
                {error
                  ? <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700 }}>{error}</span>
                  : <span style={{ fontSize: 12.5, color: 'var(--leaf)', fontWeight: 700 }}>{saved}</span>}
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
