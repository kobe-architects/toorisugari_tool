/* ============================================================
   data + shared primitives  (window globals)
   ============================================================ */

// ---- hand-drawn line icons (ink, single stroke) ----
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  cup: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M14 26h32v12a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z"/>
      <path {...stroke} d="M46 29h5a6 6 0 0 1 0 12h-4"/>
      <path {...stroke} strokeWidth="1.3" d="M24 12c-2 3 2 5 0 8M32 11c-2 3 2 5 0 8M40 12c-2 3 2 5 0 8"/>
      <path {...stroke} d="M12 58h40"/>
    </svg>
  ),
  ice: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M18 20h28l-3 34a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z"/>
      <path {...stroke} strokeWidth="1.3" d="M20 34l24 0M30 28l6 6-6 6M40 30l-6 12"/>
      <path {...stroke} d="M22 20l4-8h12l4 8"/>
    </svg>
  ),
  latte: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M16 24h32v22a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12z"/>
      <path {...stroke} d="M48 28h4a6 6 0 0 1 0 12h-4"/>
      <path {...stroke} strokeWidth="1.3" d="M16 34h32"/>
      <path {...stroke} strokeWidth="1.3" d="M27 44c0-3 5-3 5-6s-5-3-5-6M37 44c0-3-5-3-5-6"/>
    </svg>
  ),
  pot: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M10 36a18 12 0 0 0 36 0z"/>
      <path {...stroke} d="M10 36a18 12 0 0 1 36 0"/>
      <path {...stroke} d="M46 30c8 0 9 14 1 16"/>
      <path {...stroke} d="M4 33l6 2"/>
      <path {...stroke} strokeWidth="1.3" d="M22 24c-1-3 2-4 2-7M30 24c-1-3 2-4 2-7"/>
      <path {...stroke} d="M20 24h16"/>
      <path {...stroke} d="M16 52h26"/>
      <path {...stroke} d="M22 48v4M36 48v4"/>
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M18 24h28l-2 30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z"/>
      <path {...stroke} d="M18 24l3-6h22l3 6"/>
      <path {...stroke} strokeWidth="1.3" d="M26 34h12M26 42h12"/>
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M44 14C26 16 16 28 16 44c16 0 32-10 32-30z"/>
      <path {...stroke} strokeWidth="1.3" d="M18 42C28 36 36 28 42 18"/>
      <path {...stroke} d="M16 44c-2 3-3 6-3 9"/>
    </svg>
  ),
  chiffon: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M12 34h40v8a14 10 0 0 1-40 0z"/>
      <path {...stroke} d="M12 34a20 12 0 0 1 40 0"/>
      <ellipse {...stroke} cx="32" cy="34" rx="6" ry="3.5"/>
      <path {...stroke} strokeWidth="1.3" d="M20 30c0-3 3-3 3-6M44 30c0-3-3-3-3-6"/>
    </svg>
  ),
  cookie: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M32 12a20 20 0 1 0 .1 0z"/>
      <circle {...stroke} strokeWidth="1.3" cx="26" cy="26" r="1.6"/>
      <circle {...stroke} strokeWidth="1.3" cx="38" cy="30" r="1.6"/>
      <circle {...stroke} strokeWidth="1.3" cx="30" cy="40" r="1.6"/>
      <circle {...stroke} strokeWidth="1.3" cx="40" cy="40" r="1.6"/>
    </svg>
  ),
  yokan: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M12 30l14-6 26 8-14 6z"/>
      <path {...stroke} d="M12 30v10l26 8V38M52 32v10L38 48"/>
      <path {...stroke} strokeWidth="1.3" d="M22 33l24 7"/>
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path {...stroke} d="M14 26h36v26a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z"/>
      <path {...stroke} d="M10 20h44v6H10z"/>
      <path {...stroke} d="M32 20v36"/>
      <path {...stroke} strokeWidth="1.3" d="M32 20c-6-10-16-2-8 0M32 20c6-10 16-2 8 0"/>
    </svg>
  ),
};

// ---- categories ----
const CATS = [
  { id: 'drink', label: 'ドリンク', sub: 'Drink' },
  { id: 'leaf',  label: '茶葉',     sub: 'Tea leaf' },
  { id: 'sweet', label: 'お菓子',   sub: 'Sweets' },
  { id: 'set',   label: 'セット',   sub: 'Set' },
];

// ---- menu ----
const MENU = [
  { id:'d1', cat:'drink', name:'和紅茶（ホット）', sub:'静岡 べにふうき', price:600, ico:'cup',   stamp:'推' },
  { id:'d2', cat:'drink', name:'和紅茶（アイス）', sub:'水出し仕立て',     price:650, ico:'ice' },
  { id:'d3', cat:'drink', name:'和紅茶ラテ',       sub:'有機ミルク',       price:680, ico:'latte' },
  { id:'d4', cat:'drink', name:'ほうじ茶ラテ',     sub:'自家焙煎',         price:650, ico:'latte' },
  { id:'d5', cat:'drink', name:'季節のフレーバー', sub:'和紅茶 × 柚子',    price:720, ico:'cup',   stamp:'新' },
  { id:'d6', cat:'drink', name:'ポットサービス',   sub:'2杯分・茶葉選択',  price:880, ico:'pot' },

  { id:'l1', cat:'leaf', name:'べにふうき',         sub:'50g 茶缶',        price:1200, ico:'bag',  stamp:'新' },
  { id:'l2', cat:'leaf', name:'やぶきた和紅茶',     sub:'50g 茶缶',        price:1000, ico:'bag' },
  { id:'l3', cat:'leaf', name:'ティーバッグ',       sub:'5個入り',         price:650,  ico:'leaf' },
  { id:'l4', cat:'leaf', name:'水出しパック',       sub:'8個入り',         price:780,  ico:'leaf', sold:true },

  { id:'s1', cat:'sweet', name:'和紅茶シフォン',    sub:'茶葉練り込み',     price:480,  ico:'chiffon' },
  { id:'s2', cat:'sweet', name:'茶葉クッキー',      sub:'2枚入り',          price:380,  ico:'cookie' },
  { id:'s3', cat:'sweet', name:'紅茶羊羹',          sub:'一棹',             price:320,  ico:'yokan' },

  { id:'t1', cat:'set', name:'ティー＆シフォン',    sub:'ドリンク＋菓子',   price:980,  ico:'gift', stamp:'推' },
  { id:'t2', cat:'set', name:'茶葉お試しセット',    sub:'3種 各20g',        price:1500, ico:'gift' },
];

// sample cart for the flow screens
const CART = [
  { id:'d1', name:'和紅茶（ホット）',  sub:'べにふうき',   price:600, qty:2 },
  { id:'s1', name:'和紅茶シフォン',    sub:'茶葉練り込み', price:480, qty:1 },
  { id:'l1', name:'べにふうき 50g',    sub:'茶缶 / 物販',  price:1200, qty:1 },
];

// ---- shared bits ----
function Yen({ v, className='' }) {
  return <span className={'price ' + className}><span className="yen">¥</span>{v.toLocaleString()}</span>;
}

function LeafMark({ size=18, color='var(--leaf)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color }}>
      <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        d="M19 4C9 5 5 11 5 19c8 0 14-5 14-15z M6 18C11 14 15 9 17 5"/>
    </svg>
  );
}

// hanko stamp badge
function Stamp({ children, size=40, rot=-8, type='' }) {
  return (
    <span className={'stamp ' + type} style={{
      width: size, height: size, fontSize: size*0.42,
      transform: `rotate(${rot}deg)`,
    }}>{children}</span>
  );
}

// status-bar safe wrapper to push content below the dynamic island
function SafeTop() { return <div className="safe-top" />; }

Object.assign(window, { Ico, CATS, MENU, CART, Yen, LeafMark, Stamp, SafeTop });
