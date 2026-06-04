import { useEffect, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type { ExpenseCategoryDTO, ExpenseMonthDTO, ExpenseType } from '@shared/types';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const selectStyle: React.CSSProperties = {
  background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10,
  padding: '8px 12px', fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', cursor: 'pointer',
};

function TypeChip({ type }: { type: ExpenseType }) {
  const cost = type === 'cost';
  return (
    <span className="chip" style={{ fontSize: 10.5, padding: '2px 8px', color: cost ? 'var(--accent)' : 'var(--leaf)', borderColor: cost ? 'var(--accent)' : 'var(--leaf)' }}>
      {cost ? '原価' : '経費'}
    </span>
  );
}

export function ExpenseView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<ExpenseMonthDTO | null>(null);
  const [cats, setCats] = useState<ExpenseCategoryDTO[]>([]);

  // 計上フォーム
  const [catId, setCatId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 名目マスタフォーム
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ExpenseType>('expense');
  const [mBusy, setMBusy] = useState(false);

  const loadCats = () =>
    api.expenseCategories.list().then((list) => {
      setCats(list);
      setCatId((cur) => cur ?? list[0]?.id ?? null);
    });
  const loadEntries = () => {
    setData(null);
    api.expenses.list(year, month).then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };

  useEffect(() => { loadCats(); }, []);
  useEffect(loadEntries, [year, month]);

  const costCats = cats.filter((c) => c.type === 'cost');
  const expCats = cats.filter((c) => c.type === 'expense');

  const addExpense = async () => {
    if (catId == null || amount === '' || Number(amount) < 0 || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.expenses.create({ year, month, expense_category_id: catId, amount: Number(amount), note: note.trim() || null });
      setAmount('');
      setNote('');
      loadEntries();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '登録に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const removeExpense = async (id: number) => {
    if (!confirm('この経費を削除しますか？')) return;
    await api.expenses.remove(id);
    loadEntries();
  };

  const addCategory = async () => {
    if (newName.trim() === '' || mBusy) return;
    setMBusy(true);
    try {
      await api.expenseCategories.create({ name: newName.trim(), type: newType });
      setNewName('');
      await loadCats();
    } finally {
      setMBusy(false);
    }
  };

  const removeCategory = async (id: number) => {
    if (!confirm('この名目を削除しますか？（過去の計上の名目表示は残ります）')) return;
    await api.expenseCategories.remove(id);
    await loadCats();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 経費の計上 */}
      <Panel
        title="経費の計上"
        sub={`${year}年${month}月`}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={selectStyle} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select style={selectStyle} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
            </select>
          </div>
        }
      >
        <div style={{ maxWidth: 760 }}>
          {/* 追加フォーム */}
          {cats.length === 0 ? (
            <div style={{ padding: '12px 14px', marginBottom: 14, background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 12, fontSize: 12.5, color: 'var(--ink-soft)' }}>
              先に下の「名目マスタ」で原価・経費の名目を登録してください。
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <select style={{ ...selectStyle, minWidth: 150 }} value={catId ?? ''} onChange={(e) => setCatId(Number(e.target.value))}>
                {costCats.length > 0 && (
                  <optgroup label="原価">
                    {costCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                )}
                {expCats.length > 0 && (
                  <optgroup label="経費">
                    {expCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                )}
              </select>
              <div style={{ position: 'relative', width: 150 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mincho)', fontWeight: 700, color: 'var(--ink-soft)' }}>¥</span>
                <input className="input mincho" inputMode="numeric" placeholder="金額" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} style={{ paddingLeft: 26, fontSize: 16 }} />
              </div>
              <input className="input" placeholder="メモ（任意）" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-accent" onClick={addExpense} disabled={catId == null || amount === '' || busy} style={{ padding: '11px 20px', fontSize: 14, cursor: 'pointer', opacity: catId == null || amount === '' || busy ? 0.5 : 1 }}>追加</button>
            </div>
          )}

          {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>{error}</div>}

          {/* 一覧 */}
          <div style={{ display: 'flex', fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.1em', padding: '0 0 8px' }}>
            <span style={{ width: 150 }}>名目</span>
            <span style={{ width: 130, textAlign: 'right' }}>金額</span>
            <span style={{ flex: 1, paddingLeft: 16 }}>メモ</span>
            <span style={{ width: 50 }} />
          </div>
          {!data ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
          ) : data.entries.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)' }}>この月の経費はまだありません</div>
          ) : (
            data.entries.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderTop: '1px dashed var(--line-2)' }}>
                <span style={{ width: 150, fontWeight: 700, fontSize: 13.5 }}>{e.category}</span>
                <span style={{ width: 130, textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(e.amount)}</span>
                <span style={{ flex: 1, paddingLeft: 16, fontSize: 12.5, color: 'var(--ink-mute)' }}>{e.note}</span>
                <span style={{ width: 50, textAlign: 'right' }}>
                  <button onClick={() => removeExpense(e.id)} title="削除" style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </span>
              </div>
            ))
          )}

          {/* 合計 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0 0', borderTop: '2px solid var(--line-2)', marginTop: 6 }}>
            <span style={{ width: 150, fontWeight: 700, fontSize: 13.5 }}>費用合計</span>
            <span style={{ width: 130, textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(data?.total ?? 0)}</span>
            <span style={{ flex: 1 }} />
          </div>
        </div>
      </Panel>

      {/* 名目マスタ */}
      <Panel title="名目マスタ" sub="原価・経費の名目を登録（計上時に選択）">
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <select style={selectStyle} value={newType} onChange={(e) => setNewType(e.target.value as ExpenseType)}>
              <option value="cost">原価</option>
              <option value="expense">経費</option>
            </select>
            <input className="input" placeholder="名目名（例：包装資材費）" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-accent" onClick={addCategory} disabled={newName.trim() === '' || mBusy} style={{ padding: '11px 20px', fontSize: 14, cursor: 'pointer', opacity: newName.trim() === '' || mBusy ? 0.5 : 1 }}>追加</button>
          </div>

          {cats.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-mute)' }}>名目がありません</div>
          ) : (
            cats.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px dashed var(--line-2)' }}>
                <TypeChip type={c.type} />
                <span style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>{c.name}</span>
                <button onClick={() => removeCategory(c.id)} title="削除" style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
