import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '@shared/api';
import type { CategoryLiteDTO, ProductInput } from '@shared/types';
import { ProductIcon } from '@shared/icons';
import { SafeTop } from '../../components/common';

const ICON_KEYS = ['cup', 'ice', 'latte', 'pot', 'bag', 'leaf', 'chiffon', 'cookie', 'yokan', 'gift'];
const STAMPS: { v: string | null; label: string }[] = [
  { v: null, label: '無し' },
  { v: '新', label: '新' },
  { v: '推', label: '推' },
  { v: '季', label: '季' },
];

export function ProductEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new' || id === undefined;
  const productId = isNew ? null : Number(id);

  const [cats, setCats] = useState<CategoryLiteDTO[]>([]);
  const [name, setName] = useState('');
  const [sub, setSub] = useState('');
  const [price, setPrice] = useState('');
  const [taxRate, setTaxRate] = useState('10');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [icon, setIcon] = useState<string | null>('cup');
  const [stamp, setStamp] = useState<string | null>(null);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasTemperature, setHasTemperature] = useState(false);
  const [optGroups, setOptGroups] = useState<{ name: string; choicesText: string }[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.categories().then((list) => {
      setCats(list);
      setCategoryId((c) => c ?? list[0]?.id ?? null);
    });
    if (productId != null) {
      api.admin.products().then((all) => {
        const p = all.find((x) => x.id === productId);
        if (!p) return;
        setName(p.name);
        setSub(p.sub ?? '');
        setPrice(String(p.price));
        setTaxRate(String(p.tax_rate));
        setCategoryId(p.category_id);
        setIcon(p.icon);
        setStamp(p.stamp);
        setIsSoldOut(p.is_sold_out);
        setIsVisible(p.is_visible);
        setHasTemperature(p.has_temperature);
        setOptGroups((p.options ?? []).map((g) => ({ name: g.name, choicesText: g.choices.join('、') })));
        setImage(p.image);
      });
    }
  }, [productId]);

  const valid = useMemo(() => name.trim() !== '' && price !== '' && Number(price) >= 0 && categoryId != null, [name, price, categoryId]);

  const save = async () => {
    if (!valid || categoryId == null || busy) return;
    setBusy(true);
    setError('');
    const input: ProductInput = {
      category_id: categoryId,
      name: name.trim(),
      sub: sub.trim() || null,
      price: Number(price),
      tax_rate: Number(taxRate) || 10,
      icon,
      stamp,
      is_sold_out: isSoldOut,
      is_visible: isVisible,
      has_temperature: hasTemperature,
      options: optGroups
        .map((g) => ({ name: g.name.trim(), choices: g.choicesText.split(/[、,\s]+/).map((s) => s.trim()).filter(Boolean) }))
        .filter((g) => g.name && g.choices.length > 0),
    };
    try {
      if (isNew) await api.admin.createProduct(input);
      else await api.admin.updateProduct(productId!, input);
      nav('/admin/products', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (productId == null || busy) return;
    if (!confirm('この商品を削除しますか？')) return;
    setBusy(true);
    try {
      await api.admin.deleteProduct(productId);
      nav('/admin/products', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
      setBusy(false);
    }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || productId == null || imgBusy) return;
    setImgBusy(true);
    setError('');
    try {
      const r = await api.admin.uploadProductImage(productId, file);
      setImage(r.image);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '画像のアップロードに失敗しました');
    } finally {
      setImgBusy(false);
    }
  };

  const onDeleteImage = async () => {
    if (productId == null || imgBusy) return;
    setImgBusy(true);
    try {
      const r = await api.admin.deleteProductImage(productId);
      setImage(r.image);
    } finally {
      setImgBusy(false);
    }
  };

  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22, color: 'var(--ink-soft)', fontWeight: 700, cursor: 'pointer' }} onClick={() => nav('/admin/products')}>
          ✕
        </span>
        <span className="section-jp" style={{ fontSize: 17 }}>
          {isNew ? '商品を追加' : '商品を編集'}
        </span>
        <button className="btn btn-accent" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, opacity: valid && !busy ? 1 : 0.5, cursor: valid && !busy ? 'pointer' : 'default' }} onClick={save} disabled={!valid || busy}>
          保存
        </button>
      </div>

      <div className="scroll" style={{ padding: '6px 18px 18px' }}>
        {/* 商品画像 */}
        <div className="field">
          <div className="field-label">商品画像</div>
          {isNew ? (
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', padding: '8px 0' }}>保存後に画像を設定できます。</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', background: 'var(--paper-2)', border: '1.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown)', flexShrink: 0 }}>
                {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ProductIcon icon={icon} size={44} fallback={name} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', opacity: imgBusy ? 0.5 : 1 }}>
                  {imgBusy ? 'アップロード中…' : image ? '画像を変更' : '画像を選ぶ'}
                  <input type="file" accept="image/*" onChange={onPickImage} disabled={imgBusy} style={{ display: 'none' }} />
                </label>
                {image && (
                  <button className="btn" onClick={onDeleteImage} disabled={imgBusy} style={{ padding: '8px 14px', fontSize: 12.5, background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer' }}>
                    画像を削除
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* icon picker（画像が無いときに表示） */}
        <div className="field">
          <div className="field-label">アイコン<span style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginLeft: 6 }}>画像が無い場合に表示</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ICON_KEYS.map((k) => (
              <div
                key={k}
                onClick={() => setIcon(k)}
                style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--paper-2)', border: icon === k ? '2px solid var(--accent)' : '1.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ProductIcon icon={k} size={32} />
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">商品名 <span className="req">必須</span></div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：和紅茶ラテ" />
        </div>
        <div className="field">
          <div className="field-label">説明 / サブ</div>
          <input className="input" value={sub} onChange={(e) => setSub(e.target.value)} placeholder="例：静岡 べにふうき" />
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
          <div className="seg">
            {cats.map((c) => (
              <div key={c.id} className={'opt' + (categoryId === c.id ? ' on' : '')} onClick={() => setCategoryId(c.id)}>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">ハンコ札</div>
          <div className="seg">
            {STAMPS.map((s) => (
              <div key={s.label} className={'opt accent' + (stamp === s.v ? ' on' : '')} style={{ fontFamily: s.v ? 'var(--brush)' : 'var(--gothic)', fontSize: s.v ? 17 : 13.5 }} onClick={() => setStamp(s.v)}>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* 選択オプション（産地など） */}
        <div className="field">
          <div className="field-label">選択オプション<span style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginLeft: 6 }}>注文時に選択（産地など）</span></div>
          {optGroups.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="input" placeholder="名称(例:産地)" value={g.name} onChange={(e) => setOptGroups((a) => a.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} style={{ width: 110 }} />
              <input className="input" placeholder="選択肢(例:宮崎、五ヶ瀬)" value={g.choicesText} onChange={(e) => setOptGroups((a) => a.map((x, j) => (j === i ? { ...x, choicesText: e.target.value } : x)))} style={{ flex: 1 }} />
              <button className="btn" onClick={() => setOptGroups((a) => a.filter((_, j) => j !== i))} style={{ padding: '0 12px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          <button className="btn btn-ghost" onClick={() => setOptGroups((a) => [...a, { name: '', choicesText: '' }])} style={{ width: '100%', padding: 10, borderStyle: 'dashed', fontSize: 13, cursor: 'pointer' }}>＋ オプションを追加</button>
        </div>

        {/* toggles */}
        <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 13, padding: '4px 16px', marginTop: 4 }}>
          <ToggleRow title="販売状態" sub="「販売中」で会計画面に表示" on={!isSoldOut} onToggle={() => setIsSoldOut((v) => !v)} border />
          <ToggleRow title="レジに表示" sub="非表示にすると注文画面から隠れます" on={isVisible} onToggle={() => setIsVisible((v) => !v)} border />
          <ToggleRow title="ホット/アイス選択" sub="ONで注文時に温度を選択" on={hasTemperature} onToggle={() => setHasTemperature((v) => !v)} />
        </div>

        {error && <div style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, textAlign: 'center', marginTop: 14 }}>{error}</div>}

        {!isNew && (
          <button className="btn" style={{ width: '100%', marginTop: 18, padding: 13, background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', fontSize: 14, cursor: 'pointer' }} onClick={remove} disabled={busy}>
            この商品を削除する
          </button>
        )}
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
      <button className={'switch' + (on ? ' on' : '')} style={{ cursor: 'pointer' }} onClick={onToggle}>
        <span className="knob" />
      </button>
    </div>
  );
}
