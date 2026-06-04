import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@shared/api';
import type { AdminProductDTO, CategoryLiteDTO, ProductInput } from '@shared/types';
import { ProductIcon } from '@shared/icons';
import { Panel } from '../components/Panel';
import { yen } from '../lib/format';

const ICON_KEYS = ['cup', 'ice', 'latte', 'pot', 'bag', 'leaf', 'chiffon', 'cookie', 'yokan', 'gift'];
const STAMPS: { v: string | null; label: string }[] = [
  { v: null, label: '無し' }, { v: '新', label: '新' }, { v: '推', label: '推' }, { v: '季', label: '季' },
];

const selectStyle: React.CSSProperties = {
  background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10,
  padding: '9px 12px', fontFamily: 'var(--gothic)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', cursor: 'pointer',
};

function Thumb({ p, size = 44 }: { p: { image: string | null; icon: string | null; name: string }; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 10, overflow: 'hidden', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown)', flexShrink: 0 }}>
      {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ProductIcon icon={p.icon} size={Math.round(size * 0.62)} fallback={p.name} />}
    </div>
  );
}

export function RegisterView() {
  const [products, setProducts] = useState<AdminProductDTO[]>([]);
  const [cats, setCats] = useState<CategoryLiteDTO[]>([]);
  const [editing, setEditing] = useState<AdminProductDTO | 'new' | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    api.admin.products().then(setProducts).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(() => {
    api.admin.categories().then(setCats);
    load();
  }, []);

  const toggleSold = async (p: AdminProductDTO) => {
    const updated = await api.admin.updateProduct(p.id, { is_sold_out: !p.is_sold_out });
    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
  };

  return (
    <>
      <Panel
        title="商品・メニュー設定"
        sub={`全${products.length}品`}
        right={<button className="btn btn-accent" style={{ padding: '9px 16px', fontSize: 13.5, cursor: 'pointer' }} onClick={() => setEditing('new')}>＋ 商品を追加</button>}
      >
        {error && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', fontSize: 10.5, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '0.1em', padding: '0 0 10px' }}>
          <span style={{ width: 56 }} />
          <span style={{ flex: 1 }}>商品名</span>
          <span style={{ width: 110 }}>カテゴリ</span>
          <span style={{ width: 90, textAlign: 'right' }}>価格</span>
          <span style={{ width: 110, textAlign: 'center' }}>販売状態</span>
          <span style={{ width: 70, textAlign: 'center' }}>表示</span>
          <span style={{ width: 70 }} />
        </div>
        {products.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px dashed var(--line-2)', opacity: p.is_sold_out ? 0.72 : 1 }}>
            <Thumb p={p} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{p.sub}</div>
            </div>
            <span style={{ width: 110, fontSize: 12.5, color: 'var(--ink-soft)' }}>{p.category?.label}</span>
            <span style={{ width: 90, textAlign: 'right' }} className="price"><span className="yen">¥</span>{yen(p.price)}</span>
            <span style={{ width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <button className={'switch' + (p.is_sold_out ? '' : ' on')} style={{ cursor: 'pointer' }} onClick={() => toggleSold(p)}><span className="knob" /></button>
              <span style={{ fontSize: 10, fontWeight: 700, color: p.is_sold_out ? 'var(--accent)' : 'var(--leaf)' }}>{p.is_sold_out ? '売切' : '販売中'}</span>
            </span>
            <span style={{ width: 70, textAlign: 'center', fontSize: 11.5, color: p.is_visible ? 'var(--ink-soft)' : 'var(--ink-mute)' }}>{p.is_visible ? '表示' : '非表示'}</span>
            <span style={{ width: 70, textAlign: 'right' }}>
              <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12.5, cursor: 'pointer' }} onClick={() => setEditing(p)}>編集</button>
            </span>
          </div>
        ))}
      </Panel>

      {editing && (
        <ProductEditorModal
          product={editing === 'new' ? null : editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </>
  );
}

function ProductEditorModal({ product, cats, onClose, onSaved }: { product: AdminProductDTO | null; cats: CategoryLiteDTO[]; onClose: () => void; onSaved: () => void }) {
  const [current, setCurrent] = useState<AdminProductDTO | null>(product);
  const [name, setName] = useState(product?.name ?? '');
  const [sub, setSub] = useState(product?.sub ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [taxRate, setTaxRate] = useState(product ? String(product.tax_rate) : '10');
  const [categoryId, setCategoryId] = useState<number | null>(product?.category_id ?? cats[0]?.id ?? null);
  const [icon, setIcon] = useState<string | null>(product?.icon ?? 'cup');
  const [stamp, setStamp] = useState<string | null>(product?.stamp ?? null);
  const [isSoldOut, setIsSoldOut] = useState(product?.is_sold_out ?? false);
  const [isVisible, setIsVisible] = useState(product?.is_visible ?? true);
  const [hasTemperature, setHasTemperature] = useState(product?.has_temperature ?? false);
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  const [busy, setBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const valid = useMemo(() => name.trim() !== '' && price !== '' && Number(price) >= 0 && categoryId != null, [name, price, categoryId]);

  const save = async () => {
    if (!valid || categoryId == null || busy) return;
    setBusy(true);
    setError('');
    setSaved('');
    const input: ProductInput = {
      category_id: categoryId, name: name.trim(), sub: sub.trim() || null, price: Number(price),
      tax_rate: Number(taxRate) || 10, icon, stamp, is_sold_out: isSoldOut, is_visible: isVisible, has_temperature: hasTemperature,
    };
    try {
      const result = current ? await api.admin.updateProduct(current.id, input) : await api.admin.createProduct(input);
      setCurrent(result);
      setImage(result.image);
      setSaved('保存しました');
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!current || busy) return;
    if (!confirm('この商品を削除しますか？')) return;
    await api.admin.deleteProduct(current.id);
    onSaved();
    onClose();
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !current || imgBusy) return;
    setImgBusy(true);
    try {
      const r = await api.admin.uploadProductImage(current.id, file);
      setImage(r.image);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '画像アップロードに失敗しました');
    } finally {
      setImgBusy(false);
    }
  };

  const onDeleteImage = async () => {
    if (!current || imgBusy) return;
    setImgBusy(true);
    try {
      const r = await api.admin.deleteProductImage(current.id);
      setImage(r.image);
      onSaved();
    } finally {
      setImgBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(40,28,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="ticket theme-roast" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto', padding: '24px 26px', background: 'var(--card-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <span className="section-jp" style={{ fontSize: 20 }}>{current ? '商品を編集' : '商品を追加'}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', fontSize: 22, color: 'var(--ink-soft)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* 画像 */}
        <div className="field">
          <div className="field-label">商品画像</div>
          {!current ? (
            <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>保存後に画像を設定できます。</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Thumb p={{ image, icon, name }} size={72} />
              <div style={{ display: 'flex', gap: 8 }}>
                <label className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', opacity: imgBusy ? 0.5 : 1 }}>
                  {imgBusy ? 'アップロード中…' : image ? '画像を変更' : '画像を選ぶ'}
                  <input type="file" accept="image/*" onChange={onPickImage} disabled={imgBusy} style={{ display: 'none' }} />
                </label>
                {image && <button className="btn" onClick={onDeleteImage} disabled={imgBusy} style={{ padding: '8px 14px', fontSize: 12.5, background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer' }}>削除</button>}
              </div>
            </div>
          )}
        </div>

        {/* アイコン */}
        <div className="field">
          <div className="field-label">アイコン<span style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginLeft: 6 }}>画像が無い場合に表示</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ICON_KEYS.map((k) => (
              <div key={k} onClick={() => setIcon(k)} style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--paper-2)', border: icon === k ? '2px solid var(--accent)' : '1.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ProductIcon icon={k} size={30} />
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">商品名 <span className="req">必須</span></div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：みなみさやか" />
        </div>
        <div className="field">
          <div className="field-label">説明 / サブ</div>
          <input className="input" value={sub} onChange={(e) => setSub(e.target.value)} placeholder="例：宮崎 or 五ヶ瀬" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <div className="field-label">価格（税込）<span className="req">必須</span></div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mincho)', fontWeight: 700, color: 'var(--ink-soft)' }}>¥</span>
              <input className="input mincho" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} style={{ paddingLeft: 30, fontSize: 18 }} />
            </div>
          </div>
          <div className="field" style={{ width: 110 }}>
            <div className="field-label">税率(%)</div>
            <input className="input" inputMode="numeric" value={taxRate} onChange={(e) => setTaxRate(e.target.value.replace(/[^0-9]/g, ''))} style={{ textAlign: 'center' }} />
          </div>
        </div>
        <div className="field">
          <div className="field-label">カテゴリ</div>
          <select style={{ ...selectStyle, width: '100%' }} value={categoryId ?? ''} onChange={(e) => setCategoryId(Number(e.target.value))}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <div className="field-label">ハンコ札</div>
          <div className="seg">
            {STAMPS.map((s) => (
              <div key={s.label} className={'opt accent' + (stamp === s.v ? ' on' : '')} style={{ fontFamily: s.v ? 'var(--brush)' : 'var(--gothic)', fontSize: s.v ? 17 : 13.5 }} onClick={() => setStamp(s.v)}>{s.label}</div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 13, padding: '4px 16px', marginTop: 4 }}>
          <ToggleRow title="販売状態" sub="「販売中」で会計画面に表示" on={!isSoldOut} onToggle={() => setIsSoldOut((v) => !v)} border />
          <ToggleRow title="レジに表示" sub="非表示にすると注文画面から隠れます" on={isVisible} onToggle={() => setIsVisible((v) => !v)} border />
          <ToggleRow title="ホット/アイス選択" sub="ONで注文時に温度を選択" on={hasTemperature} onToggle={() => setHasTemperature((v) => !v)} />
        </div>

        {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, textAlign: 'center', marginTop: 14 }}>{error}</div>}
        {saved && <div style={{ color: 'var(--leaf)', fontSize: 12.5, fontWeight: 700, textAlign: 'center', marginTop: 14 }}>{saved}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          {current && <button className="btn" onClick={remove} disabled={busy} style={{ padding: '12px 18px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', fontSize: 14, cursor: 'pointer' }}>削除</button>}
          <button className="btn btn-accent" onClick={save} disabled={!valid || busy} style={{ flex: 1, padding: 14, fontSize: 15, cursor: valid && !busy ? 'pointer' : 'default', opacity: valid && !busy ? 1 : 0.5 }}>
            {busy ? '保存中…' : current ? '変更を保存' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ title, sub, on, onToggle, border }: { title: string; sub: string; on: boolean; onToggle: () => void; border?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: border ? '1px dashed var(--line-2)' : 'none' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>{sub}</div>
      </div>
      <button className={'switch' + (on ? ' on' : '')} style={{ cursor: 'pointer' }} onClick={onToggle}><span className="knob" /></button>
    </div>
  );
}
