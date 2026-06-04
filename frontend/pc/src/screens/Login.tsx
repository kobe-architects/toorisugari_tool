import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@shared/api';
import { useAuth } from '../state/AuthContext';

export function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      nav('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.errors?.email) setError(err.errors.email[0]);
      else setError(err instanceof Error ? err.message : 'ログインに失敗しました');
      setBusy(false);
    }
  };

  return (
    <div className="theme-roast paper-grain" style={{ width: '100%', height: '100%', background: 'var(--bar)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--gothic)' }}>
      <form onSubmit={submit} className="ticket" style={{ width: 380, padding: '36px 34px', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div className="wordmark" style={{ fontSize: 22, justifyContent: 'center', color: 'var(--ink)' }}>
            とおりすがりの和紅茶
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span className="eyebrow">OWNER · 売上管理コンソール</span>
        </div>

        <div className="field">
          <div className="field-label">メールアドレス</div>
          <input className="input" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" />
        </div>
        <div className="field">
          <div className="field-label">パスワード</div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: 14, fontSize: 15, marginTop: 4, opacity: busy ? 0.6 : 1, cursor: 'pointer' }} disabled={busy}>
          {busy ? 'ログイン中…' : 'ログイン'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--ink-mute)' }}>
          オーナーアカウントのみアクセスできます
        </div>
      </form>
    </div>
  );
}
