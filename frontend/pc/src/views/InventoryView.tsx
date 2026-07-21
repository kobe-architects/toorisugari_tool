import { useEffect, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type { MaterialDTO, MaterialPurchaseDTO } from '@shared/types';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

/** 残量(g)の表示。閾値以下・マイナスは朱色で警告。 */
function StockCell({ m }: { m: MaterialDTO }) {
  const low = m.stock_g < 0 || (m.low_stock_g != null && m.stock_g <= m.low_stock_g);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
      <span className="price" style={{ fontSize: 15, color: low ? 'var(--accent)' : 'var(--ink)' }}>
        {m.stock_g.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        <span style={{ fontSize: 11, marginLeft: 1 }}>g</span>
      </span>
      {low && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{m.stock_g < 0 ? '要確認' : '残りわずか'}</span>}
    </span>
  );
}

export function InventoryView() {
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);
  const [editing, setEditing] = useState<MaterialDTO | 'new' | null>(null);
  const [purchasing, setPurchasing] = useState<MaterialDTO | null>(null); // 仕入登録対象
  const [history, setHistory] = useState<MaterialDTO | null>(null); // 履歴表示対象
  const [error, setError] = useState('');

  const load = () => {
    api.admin.materials.list().then(setMaterials).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(load, []);

  const replace = (m: MaterialDTO) => setMaterials((prev) => prev.map((x) => (x.id === m.id ? m : x)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Panel
        title="茶葉一覧"
        sub="仕入で残量と平均g単価が更新され、レジ販売で自動的に消費・原価計上されます"
        right={<button className="btn btn-accent" style={{ padding: '9px 16px', fontSize: 13.5, cursor: 'pointer' }} onClick={() => setEditing('new')}>＋ 茶葉を追加</button>}
      >
        {error && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        {materials.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
            茶葉が未登録です。「＋ 茶葉を追加」から登録し、仕入を記録してください。
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.1em', padding: '0 0 10px' }}>
              <span style={{ flex: 1 }}>茶葉名</span>
              <span style={{ width: 130, textAlign: 'right' }}>残量</span>
              <span style={{ width: 110, textAlign: 'right' }}>平均g単価</span>
              <span style={{ flex: 1.2, paddingLeft: 24 }}>使用商品（1杯あたり）</span>
              <span style={{ width: 230 }} />
            </div>
            {materials.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderTop: '1px dashed var(--line-2)' }}>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{m.name}</span>
                <span style={{ width: 130, textAlign: 'right' }}><StockCell m={m} /></span>
                <span style={{ width: 110, textAlign: 'right' }} className="price">
                  <span className="yen">¥</span>{m.avg_unit_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span style={{ flex: 1.2, paddingLeft: 24, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                  {m.products.length === 0 ? <span style={{ color: 'var(--ink-mute)' }}>未使用</span> : m.products.map((p) => `${p.name} ${p.grams}g`).join('、')}
                </span>
                <span style={{ width: 230, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-accent" style={{ padding: '7px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => setPurchasing(m)}>仕入登録</button>
                  <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => setHistory(m)}>履歴</button>
                  <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => setEditing(m)}>編集</button>
                </span>
              </div>
            ))}
          </>
        )}
      </Panel>

      <Panel title="仕組み" sub="原価の自動計上について">
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 2 }}>
          ・仕入を登録した時点では原価に計上されません（在庫と平均g単価だけが更新されます）。<br />
          ・レジで商品が売れると、商品に登録した使用g数 × その時点の平均g単価が原価として自動計上され、損益管理の「原価」に合算されます。<br />
          ・商品への使用g数の登録は「レジ管理 → 商品の編集 → 使用茶葉」から行います（ドリンク・飲み比べカテゴリの商品）。<br />
          ・物販カテゴリの商品は、商品編集の「原価（1個あたり）」で登録した金額が販売時に自動計上されます。<br />
          ・伝票を取消・編集すると、消費した茶葉は自動で在庫に戻ります。
        </div>
      </Panel>

      {editing && (
        <MaterialEditorModal
          material={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {purchasing && (
        <PurchaseModal
          material={purchasing}
          onClose={() => setPurchasing(null)}
          onSaved={(m) => { replace(m); setPurchasing(null); }}
        />
      )}
      {history && (
        <HistoryModal
          material={history}
          onClose={() => setHistory(null)}
          onChanged={(m) => { replace(m); setHistory(m); }}
        />
      )}
    </div>
  );
}

/** モーダル共通の枠。 */
function Modal({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="ticket theme-roast" style={{ width, maxHeight: '88vh', overflowY: 'auto', padding: '22px 24px', background: 'var(--card-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span className="section-jp" style={{ fontSize: 19 }}>{title}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** 茶葉の追加・編集（名前・残量警告の閾値）。 */
function MaterialEditorModal({ material, onClose, onSaved }: { material: MaterialDTO | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(material?.name ?? '');
  const [lowStock, setLowStock] = useState(material?.low_stock_g != null ? String(material.low_stock_g) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const input = { name: name.trim(), low_stock_g: lowStock.trim() === '' ? null : Number(lowStock) };
      if (material) await api.admin.materials.update(material.id, input);
      else await api.admin.materials.create(input);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!material || busy) return;
    if (!confirm(`「${material.name}」を削除しますか？\n仕入履歴も削除されます（過去の原価計上は残ります）。`)) return;
    setBusy(true);
    setError('');
    try {
      await api.admin.materials.remove(material.id);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '削除に失敗しました');
      setBusy(false);
    }
  };

  return (
    <Modal title={material ? '茶葉を編集' : '茶葉を追加'} onClose={onClose}>
      <div className="field">
        <div className="field-label">茶葉名 <span className="req">必須</span></div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：べにひかり（静岡）" />
      </div>
      <div className="field">
        <div className="field-label">残量警告の閾値(g)<span style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginLeft: 6 }}>残量がこの値以下で警告表示（空欄で無効）</span></div>
        <input className="input" inputMode="decimal" value={lowStock} onChange={(e) => setLowStock(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="例：100" style={{ width: 140 }} />
      </div>
      {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginTop: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {material && <button className="btn" onClick={remove} disabled={busy} style={{ padding: '11px 16px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', fontSize: 13.5, cursor: 'pointer' }}>削除</button>}
        <button className="btn btn-accent" onClick={save} disabled={!name.trim() || busy} style={{ flex: 1, padding: 13, fontSize: 14.5, cursor: 'pointer', opacity: !name.trim() || busy ? 0.5 : 1 }}>
          {busy ? '保存中…' : material ? '変更を保存' : '作成する'}
        </button>
      </div>
    </Modal>
  );
}

/** 仕入登録。量と金額からg単価を即時プレビューする。 */
function PurchaseModal({ material, onClose, onSaved }: { material: MaterialDTO; onClose: () => void; onSaved: (m: MaterialDTO) => void }) {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [date, setDate] = useState(iso);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const q = Number(qty);
  const p = Number(price);
  const valid = date !== '' && q > 0 && price !== '' && p >= 0;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.admin.materials.addPurchase({
        material_id: material.id,
        purchased_on: date,
        quantity_g: q,
        total_price: p,
        note: note.trim() || null,
      });
      onSaved(r.material);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '登録に失敗しました');
      setBusy(false);
    }
  };

  return (
    <Modal title={`仕入登録：${material.name}`} onClose={onClose}>
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 14 }}>
        現在：残量 {material.stock_g.toLocaleString(undefined, { maximumFractionDigits: 1 })}g ／ 平均g単価 ¥{material.avg_unit_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
      <div className="field">
        <div className="field-label">仕入日</div>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <div className="field-label">仕入量(g) <span className="req">必須</span></div>
          <input className="input mincho" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="例：1000" style={{ fontSize: 16 }} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <div className="field-label">仕入額(円・税込) <span className="req">必須</span></div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mincho)', fontWeight: 700, color: 'var(--ink-soft)' }}>¥</span>
            <input className="input mincho" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="例：8000" style={{ paddingLeft: 26, fontSize: 16 }} />
          </div>
        </div>
      </div>
      <div className="field">
        <div className="field-label">メモ</div>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：◯◯茶園 春摘み" />
      </div>
      {valid && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700, marginTop: 4 }}>
          この仕入のg単価：¥{(p / q).toLocaleString(undefined, { maximumFractionDigits: 2 })}/g
        </div>
      )}
      {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginTop: 10 }}>{error}</div>}
      <button className="btn btn-accent" onClick={save} disabled={!valid || busy} style={{ width: '100%', padding: 13, fontSize: 14.5, marginTop: 16, cursor: 'pointer', opacity: !valid || busy ? 0.5 : 1 }}>
        {busy ? '登録中…' : '仕入を登録'}
      </button>
    </Modal>
  );
}

/** 仕入履歴の閲覧と削除（誤登録の取り消し）。 */
function HistoryModal({ material, onClose, onChanged }: { material: MaterialDTO; onClose: () => void; onChanged: (m: MaterialDTO) => void }) {
  const [rows, setRows] = useState<MaterialPurchaseDTO[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    api.admin.materials.purchases(material.id).then(setRows).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(load, [material.id]);

  const remove = async (r: MaterialPurchaseDTO) => {
    if (busyId) return;
    if (!confirm(`${r.purchased_on} の仕入（${r.quantity_g}g / ¥${yen(r.total_price)}）を削除しますか？\n残量と平均g単価が再計算されます。`)) return;
    setBusyId(r.id);
    setError('');
    try {
      const m = await api.admin.materials.removePurchase(r.id);
      setRows((prev) => (prev ?? []).filter((x) => x.id !== r.id));
      onChanged(m);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '削除に失敗しました');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal title={`仕入履歴：${material.name}`} onClose={onClose} width={560}>
      {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{error}</div>}
      {!rows ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-mute)' }}>読み込み中…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>仕入の記録がありません</div>
      ) : (
        <>
          <div style={{ display: 'flex', fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.1em', padding: '0 0 8px' }}>
            <span style={{ width: 100 }}>仕入日</span>
            <span style={{ width: 90, textAlign: 'right' }}>量</span>
            <span style={{ width: 90, textAlign: 'right' }}>金額</span>
            <span style={{ width: 90, textAlign: 'right' }}>g単価</span>
            <span style={{ flex: 1, paddingLeft: 14 }}>メモ</span>
            <span style={{ width: 56 }} />
          </div>
          {rows.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderTop: '1px dashed var(--line-2)', fontSize: 13 }}>
              <span style={{ width: 100, fontWeight: 700 }}>{r.purchased_on}</span>
              <span style={{ width: 90, textAlign: 'right' }}>{r.quantity_g.toLocaleString()}g</span>
              <span style={{ width: 90, textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(r.total_price)}</span>
              <span style={{ width: 90, textAlign: 'right', color: 'var(--ink-soft)' }}>¥{r.unit_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span style={{ flex: 1, paddingLeft: 14, fontSize: 11.5, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note}</span>
              <span style={{ width: 56, textAlign: 'right' }}>
                <button onClick={() => remove(r)} disabled={busyId === r.id} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>削除</button>
              </span>
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}
