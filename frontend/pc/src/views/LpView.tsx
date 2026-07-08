import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, ApiError } from '@shared/api';
import type { LpConfigDTO, LpSection } from '@shared/types';
import { Panel } from '../components/Panel';

// LP同梱の既定画像（未設定時のプレビュー表示用）。LPは別ドメインで配信されるため
// 既定は本番LPのURLを指す。ローカル確認時は VITE_LP_BASE で差し替え可能。
const LP_BASE = ((import.meta.env.VITE_LP_BASE as string | undefined) ?? 'https://toorisugari-wakoucha.jp').replace(/\/+$/, '');
const asset = (name: string) => `${LP_BASE}/lp-assets/assets/${name}`;
const DEFAULT_LOGO = asset('logo.png');
const DEFAULT_ABOUT = asset('cup.png');
const DEFAULT_HERO_SLIDES = [asset('hero-shop.png'), asset('hero-field.png'), asset('hero-cup.png')];
const DEFAULT_HERO_SLIDES_SP = [asset('hero-shop-sp.png'), asset('hero-field-sp.png'), asset('hero-cup-sp.png')];
const LP_URL = `${LP_BASE}/`;

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', maxWidth: '100%', background: 'var(--card-2)', border: '1.5px solid var(--line-2)', borderRadius: 10,
  padding: '10px 12px', fontFamily: 'var(--gothic)', fontSize: 14, lineHeight: 1.9, color: 'var(--ink)',
  resize: 'vertical', minHeight: 84,
};

/** セクション保存フックの共通状態。保存成功時に onSaved（プレビュー再読込）を呼ぶ。 */
function useSectionSaver<K extends LpSection>(section: K, onSaved?: () => void) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const save = async (data: LpConfigDTO[K]) => {
    setBusy(true);
    setSaved('');
    setError('');
    try {
      await api.admin.updateLpSection(section, data);
      setSaved('保存しました');
      onSaved?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };
  return { save, busy, saved, error };
}

function SaveButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button className="btn btn-accent" onClick={onClick} disabled={busy} style={{ padding: '9px 20px', fontSize: 13.5, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>
      {busy ? '保存中…' : '保存'}
    </button>
  );
}

function Status({ saved, error }: { saved: string; error: string }) {
  if (error) return <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700 }}>{error}</span>;
  if (saved) return <span style={{ fontSize: 12.5, color: 'var(--leaf)', fontWeight: 700 }}>{saved}</span>;
  return null;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field" style={{ marginBottom: 16 }}>
      <div className="field-label">{label}{hint && <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginLeft: 6, fontWeight: 400 }}>{hint}</span>}</div>
      {children}
    </div>
  );
}

/** 既定画像であることを示す小バッジ。 */
function DefaultBadge() {
  return <span style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(40,28,16,0.7)', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.04em', pointerEvents: 'none' }}>既定画像</span>;
}

/** 既定画像のサムネイル。マウスホバーで拡大プレビューを body 直下にポータル表示する。
 *  拡大画像はサムネイルの横（余白が無ければ反対側）に出し、必ずビューポート内に収める。 */
function DefaultThumb({ src, width, ratio, imgFit = 'cover' }: { src: string; width: number; ratio: string; imgFit?: 'cover' | 'contain' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState<{ rect: DOMRect; vw: number; vh: number } | null>(null);
  const show = () => { if (ref.current) setVp({ rect: ref.current.getBoundingClientRect(), vw: window.innerWidth, vh: window.innerHeight }); };
  const hide = () => setVp(null);

  let pop: { left: number; top: number; w: number; h: number } | null = null;
  if (vp) {
    const M = 8; // 画面端の余白
    const w = Math.min(380, vp.vw - 2 * M);
    const h = Math.min(340, vp.vh - 2 * M);
    // まず右側、入らなければ左側、どちらも無理なら端に寄せる
    let left = vp.rect.right + 12;
    if (left + w > vp.vw - M) left = vp.rect.left - 12 - w;
    left = Math.max(M, Math.min(left, vp.vw - w - M));
    // サムネイル中央に合わせつつ、上下にはみ出さないようクランプ
    let top = vp.rect.top + vp.rect.height / 2 - h / 2;
    top = Math.max(M, Math.min(top, vp.vh - h - M));
    pop = { left, top, w, h };
  }

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide} style={{ position: 'relative', width, aspectRatio: ratio, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--line)', background: 'var(--paper-2)', cursor: 'zoom-in' }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: imgFit, display: 'block' }} />
      <DefaultBadge />
      {pop && createPortal(
        <div style={{ position: 'fixed', left: pop.left, top: pop.top, width: pop.w, height: pop.h, zIndex: 3000, pointerEvents: 'none', borderRadius: 12, border: '3px solid #fff', boxShadow: '0 16px 48px rgba(40,28,16,0.45)', background: '#fff', overflow: 'hidden' }}>
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>,
        document.body,
      )}
    </div>
  );
}

/** 画像プレビュー＋アップロード／削除。url が null なら fallback（LP同梱の現在画像）を表示。 */
function ImageUploader({ url, fallback, onChange, ratio = '1', hint }: { url: string | null; fallback?: string; onChange: (url: string | null) => void; ratio?: string; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const custom = !!url;
  const shown = url || fallback || null;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.admin.uploadLpImage(file);
      onChange(r.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'アップロードに失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {!custom && shown ? (
          <DefaultThumb src={shown} width={96} ratio={ratio} imgFit="contain" />
        ) : (
          <div style={{ position: 'relative', width: 96, aspectRatio: ratio, borderRadius: 10, overflow: 'hidden', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {shown ? <img src={shown} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', textAlign: 'center', lineHeight: 1.5, padding: 4 }}>未設定</span>}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <label className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>
              {busy ? 'アップロード中…' : custom ? '画像を変更' : '画像を選ぶ'}
              <input ref={inputRef} type="file" accept="image/*" onChange={pick} disabled={busy} style={{ display: 'none' }} />
            </label>
            {custom && <button className="btn" onClick={() => onChange(null)} style={{ padding: '8px 14px', fontSize: 12.5, background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer' }}>既定に戻す</button>}
          </div>
          {hint && <span style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{hint}</span>}
        </div>
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6 }}>{error}</div>}
    </div>
  );
}

// ---- 各セクション ----

function CommonSection({ initial, onSaved }: { initial: LpConfigDTO['common']; onSaved?: () => void }) {
  const [logo, setLogo] = useState(initial.logo);
  const { save, busy, saved, error } = useSectionSaver('common', onSaved);
  return (
    <Panel title="共通" sub="全ページ共通の設定" right={<><Status saved={saved} error={error} /><SaveButton onClick={() => save({ logo })} busy={busy} /></>}>
      <Field label="ロゴ画像" hint="未設定ならLP同梱のロゴを使用">
        <ImageUploader url={logo} fallback={DEFAULT_LOGO} onChange={setLogo} ratio="3/1" hint="横長・透過PNG推奨" />
      </Field>
    </Panel>
  );
}

/** スライド画像の編集（PC用・スマホ用で共用）。枚数自由・追加/削除/並び替え。 */
function SlideEditor({ label, hint, ratio, slides, setSlides, defaults }: {
  label: string; hint: string; ratio: string; slides: string[]; setSlides: React.Dispatch<React.SetStateAction<string[]>>; defaults: string[];
}) {
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const addSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || imgBusy) return;
    setImgBusy(true);
    setImgErr('');
    try {
      const r = await api.admin.uploadLpImage(file);
      setSlides((s) => [...s, r.url]);
    } catch (err) {
      setImgErr(err instanceof ApiError ? err.message : 'アップロードに失敗しました');
    } finally {
      setImgBusy(false);
    }
  };
  const move = (i: number, dir: -1 | 1) => {
    setSlides((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const c = [...s];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  };
  const removeSlide = (i: number) => setSlides((s) => s.filter((_, j) => j !== i));
  // ドラッグ元 from を、ドロップ先 to の位置へ移動。
  const reorder = (from: number, to: number) => {
    setSlides((s) => {
      if (from === to || from < 0 || to < 0 || from >= s.length || to >= s.length) return s;
      const c = [...s];
      const [moved] = c.splice(from, 1);
      c.splice(to, 0, moved);
      return c;
    });
  };
  const onDrop = (i: number) => {
    if (dragIndex != null) reorder(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  };

  const box: React.CSSProperties = { position: 'relative', width: 132, aspectRatio: ratio, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--line)', background: 'var(--paper-2)' };

  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {slides.length === 0 && defaults.map((url, i) => (
          <DefaultThumb key={'def' + i} src={url} width={132} ratio={ratio} imgFit="cover" />
        ))}
        {slides.map((url, i) => {
          const dragging = dragIndex === i;
          const dropTarget = overIndex === i && dragIndex != null && dragIndex !== i;
          return (
            <div
              key={i}
              draggable
              onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch { /* noop */ } }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overIndex !== i) setOverIndex(i); }}
              onDrop={(e) => { e.preventDefault(); onDrop(i); }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              style={{ ...box, cursor: 'grab', opacity: dragging ? 0.4 : 1, outline: dropTarget ? '2.5px solid var(--accent)' : 'none', outlineOffset: 1, transition: 'opacity .12s' }}
            >
              <img src={url} draggable={false} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 4 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span title="ドラッグで並び替え" style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 5px', borderRadius: 5, background: 'rgba(40,28,16,0.55)', color: '#fff', fontSize: 12, lineHeight: 1, letterSpacing: '-1px' }}>⠿</span>
                  <button onClick={() => removeSlide(i)} title="削除" style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(40,28,16,0.66)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="前へ" style={{ width: 22, height: 20, border: 'none', borderRadius: 5, background: 'rgba(40,28,16,0.55)', color: '#fff', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.4 : 1, fontSize: 11 }}>◀</button>
                  <button onClick={() => move(i, 1)} disabled={i === slides.length - 1} title="次へ" style={{ width: 22, height: 20, border: 'none', borderRadius: 5, background: 'rgba(40,28,16,0.55)', color: '#fff', cursor: i === slides.length - 1 ? 'default' : 'pointer', opacity: i === slides.length - 1 ? 0.4 : 1, fontSize: 11 }}>▶</button>
                </div>
              </div>
            </div>
          );
        })}
        <label style={{ ...box, border: '1.5px dashed var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: imgBusy ? 'default' : 'pointer', color: 'var(--ink-mute)', fontSize: 12.5, textAlign: 'center' }}>
          {imgBusy ? 'アップロード中…' : '＋ 画像を追加'}
          <input type="file" accept="image/*" onChange={addSlide} disabled={imgBusy} style={{ display: 'none' }} />
        </label>
      </div>
      {imgErr && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6 }}>{imgErr}</div>}
    </Field>
  );
}

function HeroSection({ initial, onSaved }: { initial: LpConfigDTO['hero']; onSaved?: () => void }) {
  const [slides, setSlides] = useState<string[]>(initial.slides);
  const [slidesSp, setSlidesSp] = useState<string[]>(initial.slides_sp);
  const [interval, setIntervalSec] = useState(String(initial.interval_sec));
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const { save, busy, saved, error } = useSectionSaver('hero', onSaved);

  const onSave = () => save({ slides, slides_sp: slidesSp, interval_sec: Number(interval) || 4.8, title, subtitle });

  return (
    <Panel title="トップ（ヒーロー）" sub="スライドショーとキャッチコピー" right={<><Status saved={saved} error={error} /><SaveButton onClick={onSave} busy={busy} /></>}>
      <SlideEditor label="スライド画像（PC）" hint="枚数自由・ドラッグで並び替え。未設定ならLP同梱の3枚を使用" ratio="5/2" slides={slides} setSlides={setSlides} defaults={DEFAULT_HERO_SLIDES} />
      <SlideEditor label="スライド画像（スマホ）" hint="スマホ表示用・ドラッグで並び替え。未設定ならLP同梱のSP画像（またはPC画像）を使用" ratio="3/4" slides={slidesSp} setSlides={setSlidesSp} defaults={DEFAULT_HERO_SLIDES_SP} />

      <Field label="スライド切替の間隔（秒）">
        <input className="input" inputMode="decimal" value={interval} onChange={(e) => setIntervalSec(e.target.value.replace(/[^0-9.]/g, ''))} style={{ width: 120, textAlign: 'center' }} />
      </Field>
      <Field label="タイトル（キャッチ）" hint="改行で複数行にできます">
        <textarea value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...textareaStyle, minHeight: 64 }} />
      </Field>
      <Field label="副題">
        <input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </Field>
    </Panel>
  );
}

function ConceptSection({ initial, onSaved }: { initial: LpConfigDTO['concept']; onSaved?: () => void }) {
  const [text, setText] = useState(initial.text);
  const { save, busy, saved, error } = useSectionSaver('concept', onSaved);
  return (
    <Panel title="コンセプト" sub="中央の一文" right={<><Status saved={saved} error={error} /><SaveButton onClick={() => save({ text })} busy={busy} /></>}>
      <Field label="文言" hint="改行で複数行にできます">
        <textarea value={text} onChange={(e) => setText(e.target.value)} style={textareaStyle} />
      </Field>
    </Panel>
  );
}

function AboutSection({ initial, onSaved }: { initial: LpConfigDTO['about']; onSaved?: () => void }) {
  const [image, setImage] = useState(initial.image);
  const [heading, setHeading] = useState(initial.heading);
  const [text, setText] = useState(initial.text);
  const { save, busy, saved, error } = useSectionSaver('about', onSaved);
  return (
    <Panel title="About Us（わたしたち）" sub="写真・見出し・本文" right={<><Status saved={saved} error={error} /><SaveButton onClick={() => save({ image, heading, text })} busy={busy} /></>}>
      <Field label="画像" hint="正方形で表示。未設定ならLP同梱画像を使用">
        <ImageUploader url={image} fallback={DEFAULT_ABOUT} onChange={setImage} ratio="1" hint="正方形（1:1）推奨" />
      </Field>
      <Field label="見出し">
        <input className="input" value={heading} onChange={(e) => setHeading(e.target.value)} />
      </Field>
      <Field label="文言" hint="空行で段落を分けられます">
        <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ ...textareaStyle, minHeight: 128 }} />
      </Field>
    </Panel>
  );
}

function FooterSection({ initial, onSaved }: { initial: LpConfigDTO['footer']; onSaved?: () => void }) {
  const [text, setText] = useState(initial.text);
  const { save, busy, saved, error } = useSectionSaver('footer', onSaved);
  return (
    <Panel title="フッター" sub="最下部のメッセージ" right={<><Status saved={saved} error={error} /><SaveButton onClick={() => save({ text })} busy={busy} /></>}>
      <Field label="文言" hint="改行で複数行にできます">
        <textarea value={text} onChange={(e) => setText(e.target.value)} style={textareaStyle} />
      </Field>
    </Panel>
  );
}

/** 右側のLPライブプレビュー。PC/スマホ切替。設定側とは独立してスクロールする。 */
function PreviewPane({ reloadToken }: { reloadToken: number }) {
  const [device, setDevice] = useState<'pc' | 'sp'>('pc');
  const [vh, setVh] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const INNER_W = 440;                       // プレビュー枠の内寸
  const designW = device === 'pc' ? 1280 : 390; // 端末の設計幅
  const scale = Math.min(1, INNER_W / designW);
  const displayW = designW * scale;
  const paneH = Math.max(380, vh - 150);     // 上部ヘッダー分を差し引いた高さ
  const frameH = paneH / scale;              // 縮小後にちょうど枠を埋める高さ

  const src = `${LP_URL}?_=${reloadToken}`;

  return (
    <div style={{ position: 'sticky', top: 0, flexShrink: 0, width: 480, alignSelf: 'flex-start' }}>
      <div className="ticket" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="eyebrow">プレビュー</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(['pc', 'sp'] as const).map((d) => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: '1.5px solid var(--line-2)', background: device === d ? 'var(--brown)' : 'transparent', color: device === d ? '#fff' : 'var(--ink-soft)' }}>
                {d === 'pc' ? 'PC' : 'スマホ'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: INNER_W, height: paneH, margin: '0 auto', overflow: 'hidden', borderRadius: 12, border: '1.5px solid var(--line)', background: '#fff' }}>
          <div style={{ width: displayW, height: paneH, margin: '0 auto', overflow: 'hidden' }}>
            <iframe
              key={reloadToken}
              src={src}
              title="LPプレビュー"
              style={{ width: designW, height: frameH, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', display: 'block' }}
            />
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 8, textAlign: 'center' }}>
          保存すると自動で再読み込みされます（公開中のLPを表示）
        </div>
      </div>
    </div>
  );
}

export function LpView() {
  const [config, setConfig] = useState<LpConfigDTO | null>(null);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const reloadPreview = () => setReloadToken(Date.now());

  useEffect(() => {
    api.lpConfig().then(setConfig).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <div style={{ color: 'var(--accent)', fontSize: 14, padding: 12 }}>設定の読み込みに失敗しました：{error}</div>;
  if (!config) return <div style={{ color: 'var(--ink-mute)', fontSize: 14, padding: 12 }}>読み込み中…</div>;

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', lineHeight: 1.9 }}>
          公式サイト（LP）の各セクションを編集できます。セクションごとに「保存」してください。<br />
          画像・文言を未設定のままにすると、LP同梱の既定内容が表示されます。
        </div>
        <CommonSection initial={config.common} onSaved={reloadPreview} />
        <HeroSection initial={config.hero} onSaved={reloadPreview} />
        <ConceptSection initial={config.concept} onSaved={reloadPreview} />
        <AboutSection initial={config.about} onSaved={reloadPreview} />
        <FooterSection initial={config.footer} onSaved={reloadPreview} />
      </div>
      <PreviewPane reloadToken={reloadToken} />
    </div>
  );
}
