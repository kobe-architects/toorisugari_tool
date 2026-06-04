/* ============================================================
   タブレット横向き（iPad）レジ一式 — 焙煎トーン
   TabletDevice / TabletRegister / TabletCheckout / TabletLogin
   ============================================================ */

const SCREEN_W = 1194, SCREEN_H = 834;

function TabletDevice({ children }) {
  return (
    <div style={{ width: SCREEN_W+40, height: SCREEN_H+40, borderRadius: 38, background:'#16120d',
      padding: 20, position:'relative', boxSizing:'border-box',
      boxShadow:'0 40px 90px rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(255,255,255,0.04)' }}>
      {/* front camera */}
      <div style={{ position:'absolute', top:9, left:'50%', transform:'translateX(-50%)',
        width:7, height:7, borderRadius:'50%', background:'#2c2722',
        boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.08)' }} />
      <div style={{ width:'100%', height:'100%', borderRadius:20, overflow:'hidden',
        background:'#000', position:'relative' }}>
        {children}
      </div>
    </div>
  );
}

/* ---- tablet order ticket (right pane), reused by register ---- */
const TCART = [
  { id:'d1', name:'和紅茶（ホット）', sub:'べにふうき', price:600, qty:2 },
  { id:'d3', name:'和紅茶ラテ',       sub:'有機ミルク', price:680, qty:1 },
  { id:'s1', name:'和紅茶シフォン',   sub:'茶葉練り込み', price:480, qty:1 },
  { id:'l1', name:'べにふうき 50g',   sub:'茶缶 / 物販', price:1200, qty:1 },
];

/* ============================================================
   注文レジ — 2ペイン
   ============================================================ */
function TabletRegister() {
  const sub = TCART.reduce((a,c)=>a+c.price*c.qty,0);
  const qtyTotal = TCART.reduce((a,c)=>a+c.qty,0);
  const tax = Math.round(sub - sub/1.1);
  return (
    <div className="theme-roast paper-grain" style={{ width:'100%', height:'100%',
      background:'var(--paper)', color:'var(--ink)', fontFamily:'var(--gothic)',
      display:'flex', position:'relative', overflow:'hidden' }}>
      {/* ===== LEFT: products ===== */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:2,
        minWidth:0 }}>
        {/* top bar */}
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 24px 14px' }}>
          <div className="wordmark" style={{ fontSize:22 }}>
            <LeafMark size={23} color="var(--brown)" /> 和紅茶
            <span style={{ fontFamily:'var(--gothic)', fontWeight:700, fontSize:12,
              letterSpacing:'0.16em', color:'var(--ink-mute)', marginLeft:7 }}>レジ</span>
          </div>
          {/* search */}
          <div style={{ flex:1, maxWidth:300, display:'flex', alignItems:'center', gap:9,
            background:'var(--card-2)', border:'1.5px solid var(--line)', borderRadius:11,
            padding:'10px 14px', color:'var(--ink-mute)', fontSize:14 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            商品を検索
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', background:'var(--card-2)', border:'1.5px solid var(--line-2)',
              borderRadius:10, overflow:'hidden', fontSize:13.5, fontWeight:700 }}>
              <span style={{ padding:'9px 16px', background:'var(--bar)', color:'var(--bar-ink)' }}>店内</span>
              <span style={{ padding:'9px 16px', color:'var(--ink-soft)' }}>持帰り</span>
            </div>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--card)',
              border:'1.5px solid var(--line-2)', display:'flex', alignItems:'center',
              justifyContent:'center', fontFamily:'var(--brush)', fontSize:18, color:'var(--accent)' }}>み</div>
          </div>
        </div>
        {/* categories */}
        <div style={{ display:'flex', gap:10, padding:'0 24px 14px' }}>
          {CATS.map((c,i)=>(
            <span key={c.id} className={'chip'+(i===0?' on':'')}
              style={{ padding:'9px 18px', fontSize:14.5 }}>{c.label}</span>
          ))}
        </div>
        {/* grid */}
        <div className="scroll" style={{ padding:'2px 24px 22px' }}>
          <div className="eyebrow" style={{ marginBottom:12 }}>ドリンク · Drink</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
            {MENU.filter(m=>m.cat==='drink').map(m=>(
              <ProdCard key={m.id} m={m} />
            ))}
          </div>
          <div className="eyebrow" style={{ marginBottom:12 }}>茶葉 · Tea leaf</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {MENU.filter(m=>m.cat==='leaf').map(m=>(
              <ProdCard key={m.id} m={m} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== RIGHT: order ticket ===== */}
      <div style={{ width:430, flexShrink:0, position:'relative', zIndex:3,
        background:'var(--card-2)', borderLeft:'1.5px solid var(--line)',
        boxShadow:'-8px 0 24px rgba(58,43,30,0.06)', display:'flex', flexDirection:'column' }}>
        {/* header */}
        <div style={{ padding:'20px 24px 14px', display:'flex', alignItems:'center', gap:12,
          borderBottom:'2px dashed var(--line-2)' }}>
          <div>
            <div className="eyebrow">お会計伝票</div>
            <div style={{ fontFamily:'var(--mincho)', fontWeight:700, fontSize:22, marginTop:3 }}>
              No.1042</div>
          </div>
          <span className="chip" style={{ marginLeft:'auto' }}>店内 · {qtyTotal}点</span>
        </div>
        {/* items */}
        <div className="scroll" style={{ padding:'6px 24px' }}>
          {TCART.map((c,i)=>(
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'15px 0',
              borderBottom: i<TCART.length-1 ? '1px dashed var(--line-2)':'none' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15.5 }}>{c.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:2 }}>{c.sub}</div>
              </div>
              <div className="stepper">
                <button>－</button><span className="n">{c.qty}</span><button>＋</button>
              </div>
              <div style={{ width:62, textAlign:'right' }}><Yen v={c.price*c.qty} /></div>
            </div>
          ))}
        </div>
        {/* totals + actions */}
        <div style={{ borderTop:'2px dashed var(--line-2)', padding:'16px 24px 20px',
          background:'var(--card)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13.5,
            color:'var(--ink-soft)', marginBottom:5 }}>
            <span>小計</span><span className="price"><span className="yen">¥</span>{sub.toLocaleString()}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13,
            color:'var(--ink-mute)', marginBottom:12 }}>
            <span>内消費税(10%)</span><span>¥{tax.toLocaleString()}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end',
            marginBottom:16 }}>
            <span style={{ fontFamily:'var(--mincho)', fontWeight:700, fontSize:18 }}>合計</span>
            <span className="stat-num" style={{ fontSize:38, lineHeight:1 }}>
              <span style={{ fontSize:20 }}>¥</span>{sub.toLocaleString()}</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-ghost" style={{ flex:1, padding:'16px', fontSize:14.5 }}>保留</button>
            <button className="btn btn-accent" style={{ flex:2.2, padding:'16px', fontSize:18 }}>
              お会計へ →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProdCard({ m }) {
  return (
    <div className="pcard" style={{ opacity:m.sold?0.62:1 }}>
      <div className="thumb" style={{ height:84 }}>
        <div style={{ width:50, height:50, color:'var(--brown)' }}>{Ico[m.ico]}</div>
        {m.stamp && <div style={{ position:'absolute', top:7, right:7 }}>
          <Stamp size={30} rot={-10}>{m.stamp}</Stamp></div>}
        {m.sold && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
          justifyContent:'center' }}><Stamp size={52} rot={-14} type="sold">売切</Stamp></div>}
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <div style={{ fontWeight:700, fontSize:14, lineHeight:1.3 }}>{m.name}</div>
        <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:2 }}>{m.sub}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:9 }}>
          <Yen v={m.price} />
          <button className="btn btn-primary" disabled={m.sold} style={{ width:32, height:32,
            borderRadius:9, fontSize:21, padding:0, opacity:m.sold?0.4:1 }}>＋</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   お会計 / 決済 — 左:伝票  右:支払い＋テンキー
   ============================================================ */
function TabletCheckout() {
  const total = 2960;
  const keys = ['7','8','9','4','5','6','1','2','3','00','0','C'];
  const pays = [
    { id:'cash', label:'現金',     d:'M3 7h18v10H3z M7 12h.1M12 12a2 2 0 100 .1' },
    { id:'card', label:'クレジット', d:'M3 7h18v10H3z M3 11h18' },
    { id:'qr',   label:'QR決済',   d:'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h3v3h-3z' },
    { id:'ic',   label:'交通系IC', d:'M5 12a7 7 0 0 1 7-7M9 12a3 3 0 0 1 3-3M12 19a7 7 0 0 0 7-7' },
  ];
  return (
    <div className="theme-roast paper-grain" style={{ width:'100%', height:'100%',
      background:'var(--paper)', color:'var(--ink)', fontFamily:'var(--gothic)',
      display:'flex', position:'relative', overflow:'hidden' }}>
      {/* LEFT: receipt */}
      <div style={{ width:430, flexShrink:0, position:'relative', zIndex:3, background:'var(--card-2)',
        borderRight:'1.5px solid var(--line)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'20px 24px 14px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24, color:'var(--ink-soft)' }}>‹</span>
          <span className="section-jp" style={{ fontSize:20 }}>お会計</span>
          <span className="chip" style={{ marginLeft:'auto' }}>No.1042</span>
        </div>
        <div className="scroll" style={{ padding:'4px 24px', borderTop:'2px dashed var(--line-2)' }}>
          {TCART.map((c,i)=>(
            <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
              padding:'13px 0', borderBottom: i<TCART.length-1?'1px dashed var(--line-2)':'none' }}>
              <div>
                <span style={{ fontWeight:700, fontSize:14.5 }}>{c.name}</span>
                <span style={{ fontSize:12, color:'var(--ink-mute)', marginLeft:8 }}>×{c.qty}</span>
              </div>
              <Yen v={c.price*c.qty} />
            </div>
          ))}
        </div>
        <div style={{ borderTop:'2px dashed var(--line-2)', padding:'18px 24px 22px' }}>
          <div className="eyebrow">お会計金額</div>
          <div className="stat-num" style={{ fontSize:48, marginTop:6, lineHeight:1 }}>
            <span style={{ fontSize:24 }}>¥</span>{total.toLocaleString()}</div>
          <div style={{ fontSize:12.5, color:'var(--ink-mute)', marginTop:8 }}>5点 · 内税 ¥269</div>
        </div>
      </div>

      {/* RIGHT: payment */}
      <div style={{ flex:1, position:'relative', zIndex:2, display:'flex', flexDirection:'column',
        padding:'24px 28px' }}>
        <div className="eyebrow" style={{ marginBottom:12 }}>お支払い方法</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
          {pays.map((p,i)=>(
            <button key={p.id} className="pcard" style={{ padding:'18px 10px', display:'flex',
              flexDirection:'column', alignItems:'center', gap:10, cursor:'pointer',
              borderColor: i===0?'var(--accent)':'var(--line)', borderWidth:i===0?2:1.5,
              background:'var(--card)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke={i===0?'var(--accent)':'var(--brown)'} strokeWidth="1.6" strokeLinecap="round"
                strokeLinejoin="round"><path d={p.d}/></svg>
              <span style={{ fontWeight:700, fontSize:14, color:i===0?'var(--ink)':'var(--ink-soft)' }}>{p.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:24, flex:1 }}>
          {/* tendered summary */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            <div className="ticket" style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:14, color:'var(--ink-soft)', fontWeight:700 }}>お預かり</span>
                <span className="stat-num" style={{ fontSize:30 }}>
                  <span style={{ fontSize:16 }}>¥</span>3,000</span>
              </div>
            </div>
            <div className="ticket" style={{ padding:'16px 18px', background:'rgba(176,64,46,0.06)',
              borderColor:'var(--accent)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:14, color:'var(--accent)', fontWeight:700 }}>おつり</span>
                <span className="stat-num" style={{ fontSize:30, color:'var(--accent)' }}>
                  <span style={{ fontSize:16 }}>¥</span>40</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['ちょうど','¥3,000','¥5,000'].map((t,i)=>(
                <button key={i} className="btn btn-ghost" style={{ flex:1, padding:'12px 4px', fontSize:13 }}>{t}</button>
              ))}
            </div>
            <button className="btn btn-accent" style={{ marginTop:'auto', padding:'18px', fontSize:18 }}>
              会計を確定する</button>
          </div>
          {/* numpad */}
          <div style={{ width:280, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:11 }}>
            {keys.map(k=>(
              <button key={k} className="btn" style={{ background: k==='C'?'transparent':'var(--card)',
                border:'1.5px solid var(--line-2)', color: k==='C'?'var(--accent)':'var(--ink)',
                fontFamily:'var(--mincho)', fontWeight:700, fontSize:24 }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   店員ログイン（横）
   ============================================================ */
function TabletLogin() {
  const staff = [['店長','店'],['みどり','み'],['そう','そ'],['はる','は']];
  const keys = ['1','2','3','4','5','6','7','8','9','clear','0','ok'];
  return (
    <div className="theme-roast paper-grain" style={{ width:'100%', height:'100%',
      background:'var(--paper-2)', color:'var(--ink)', fontFamily:'var(--gothic)',
      display:'flex', position:'relative', overflow:'hidden' }}>
      {/* left brand */}
      <div style={{ flex:1, position:'relative', zIndex:2, display:'flex', flexDirection:'column',
        justifyContent:'center', alignItems:'center', padding:40,
        borderRight:'2px dashed var(--line-2)' }}>
        <img src="assets/logo.png" alt="とおりすがりの和紅茶" style={{ width:'74%', maxWidth:420 }} />
        <div style={{ marginTop:14, fontFamily:'var(--mincho)', fontWeight:700, fontSize:15,
          color:'var(--ink-soft)' }}>2026年6月4日（水）· 通し営業</div>
        <div style={{ marginTop:6 }}><span className="chip leaf">本日 開店中</span></div>
      </div>
      {/* right login */}
      <div style={{ width:480, flexShrink:0, position:'relative', zIndex:2, display:'flex',
        flexDirection:'column', justifyContent:'center', padding:'40px 54px' }}>
        <div className="eyebrow" style={{ textAlign:'center' }}>STAFF LOGIN</div>
        <div style={{ display:'flex', gap:14, justifyContent:'center', margin:'20px 0 22px' }}>
          {staff.map((s,i)=>(
            <div key={s[0]} style={{ textAlign:'center' }}>
              <div style={{ width:62, height:62, borderRadius:'50%',
                border:i===1?'2.5px solid var(--accent)':'1.5px solid var(--line-2)',
                background:i===1?'rgba(176,64,46,0.06)':'var(--card)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--brush)', fontSize:26, color:i===1?'var(--accent)':'var(--ink-soft)' }}>{s[1]}</div>
              <div style={{ fontSize:12, fontWeight:700, marginTop:6,
                color:i===1?'var(--ink)':'var(--ink-mute)' }}>{s[0]}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:14, justifyContent:'center', marginBottom:20 }}>
          {[1,1,0,0].map((f,i)=>(
            <div key={i} style={{ width:14, height:14, borderRadius:'50%',
              background:f?'var(--brown)':'transparent', border:'1.5px solid var(--line-2)' }} />
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {keys.map(k=>{
            if(k==='clear') return <button key={k} className="btn btn-ghost" style={{ height:62, fontSize:14 }}>消去</button>;
            if(k==='ok') return <button key={k} className="btn" style={{ height:62, background:'var(--bar)',
              color:'var(--bar-ink)', fontSize:16 }}>入店</button>;
            return <button key={k} className="btn" style={{ height:62, background:'var(--card)',
              border:'1.5px solid var(--line)', fontFamily:'var(--mincho)', fontWeight:700, fontSize:26,
              color:'var(--ink)' }}>{k}</button>;
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TabletDevice, TabletRegister, TabletCheckout, TabletLogin });
