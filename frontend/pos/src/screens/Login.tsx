import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@shared/api';
import type { StaffDTO } from '@shared/types';
import { useAuth } from '../state/AuthContext';
import { SafeTop } from '../components/common';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'];

const TODAY = new Date().toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

export function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [staff, setStaff] = useState<StaffDTO[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .staff()
      .then((list) => {
        setStaff(list);
        setPicked(list[0]?.id ?? null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const submit = async () => {
    if (picked == null || pin.length < 4 || busy) return;
    setBusy(true);
    setError('');
    try {
      await login(picked, pin);
      nav('/', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.errors?.pin) setError(e.errors.pin[0]);
      else setError(e instanceof Error ? e.message : 'ログインに失敗しました');
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const press = (k: string) => {
    setError('');
    if (k === 'clear') return setPin('');
    if (k === 'ok') return void submit();
    if (pin.length < 4) setPin(pin + k);
  };

  return (
    <div className="pos theme-roast paper-grain" style={{ background: 'var(--paper-2)' }}>
      <SafeTop />
      <div className="scroll" style={{ padding: '8px 26px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <div className="wordmark" style={{ fontSize: 30, justifyContent: 'center', color: 'var(--ink)' }}>
            とおりすがりの和紅茶
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 18 }}>
          <span className="eyebrow">STAFF LOGIN</span>
          <div style={{ fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            {TODAY} · 通し営業
          </div>
        </div>

        {/* staff picker */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {staff.map((s) => {
            const on = s.id === picked;
            return (
              <div key={s.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setPicked(s.id)}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    border: on ? '2.5px solid var(--accent)' : '1.5px solid var(--line-2)',
                    background: on ? 'rgba(176,64,46,0.06)' : 'var(--card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--brush)',
                    fontSize: 24,
                    color: on ? 'var(--accent)' : 'var(--ink-soft)',
                  }}
                >
                  {s.initial ?? s.name.slice(0, 1)}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 5, color: on ? 'var(--ink)' : 'var(--ink-mute)' }}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', gap: 13, justifyContent: 'center', marginBottom: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: i < pin.length ? 'var(--brown)' : 'transparent',
                border: '1.5px solid var(--line-2)',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 280, margin: '0 auto', width: '100%' }}>
          {KEYS.map((k) => {
            if (k === 'clear')
              return (
                <button key={k} className="btn btn-ghost" style={{ height: 58, fontSize: 13, fontWeight: 700 }} onClick={() => press(k)}>
                  消去
                </button>
              );
            if (k === 'ok')
              return (
                <button
                  key={k}
                  className="btn"
                  style={{ height: 58, background: 'var(--bar)', color: 'var(--bar-ink)', fontSize: 16, opacity: pin.length < 4 || busy ? 0.5 : 1 }}
                  onClick={() => press(k)}
                  disabled={pin.length < 4 || busy}
                >
                  入店
                </button>
              );
            return (
              <button
                key={k}
                className="btn"
                style={{ height: 58, background: 'var(--card)', border: '1.5px solid var(--line)', fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: 24, color: 'var(--ink)' }}
                onClick={() => press(k)}
              >
                {k}
              </button>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11.5, color: 'var(--ink-mute)' }}>
          4桁のパスコードを入力してください
        </div>
      </div>
    </div>
  );
}
