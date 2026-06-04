/* ============================================================
   注文画面 3案 — OrderA(焙煎/グリッド) OrderB(新茶/リスト) OrderC(番茶/帳場)
   ============================================================ */

function thumbIco(ico, size) {
  return (
    <div style={{ width: size, height: size, color: 'var(--brown)' }}>{Ico[ico]}</div>
  );
}

/* ---- bottom tab bar (shared visual) ---- */
function TabBar({ active='order' }) {
  const items = [
    { id:'order', label:'注文', d:'M4 7h16M4 12h16M4 17h10' },
    { id:'cart',  label:'カート', d:'M5 6h15l-2 9H7zM7 19a1 1 0 100 .1M16 19a1 1 0 100 .1' },
    { id:'hist',  label:'履歴', d:'M12 7v5l3 2M5 12a7 7 0 1 0 2-5' },
    { id:'more',  label:'メニュー', d:'M5 6h14M5 12h14M5 18h14' },
  ];
  return (
    <div className="tabbar">
      {items.map(it => (
        <div key={it.id} className={'tab' + (it.id===active ? ' on':'')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={it.d}/></svg>
          {it.label}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   案A — 焙煎 / 2列グリッド
   ============================================================ */
function OrderA() {
  const [cat, setCat] = React.useState('drink');
  const items = MENU.filter(m => m.cat === cat);
  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      {/* header */}
      <div className="topbar" style={{ justifyContent:'space-between', paddingTop:0 }}>
        <div className="wordmark" style={{ fontSize:19, color:'var(--ink)' }}>
          <LeafMark size={20} color="var(--brown)" /> 和紅茶
          <span style={{ fontFamily:'var(--gothic)', fontWeight:700, fontSize:11,
            letterSpacing:'0.16em', color:'var(--ink-mute)', marginLeft:6 }}>レジ</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="chip">店内</span>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--mincho)',
            fontWeight:700, fontSize:13, color:'var(--ink-soft)' }}>
            <span style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--ink-mute)' }}>No.</span>1042
          </div>
        </div>
      </div>
      {/* category tabs */}
      <div style={{ display:'flex', gap:8, padding:'0 16px 12px', overflowX:'auto', position:'relative', zIndex:3 }}>
        {CATS.map(c => (
          <button key={c.id} onClick={()=>setCat(c.id)}
            className={'chip' + (c.id===cat ? ' on':'')}
            style={{ flex:'0 0 auto', fontSize:13, padding:'7px 14px', cursor:'pointer' }}>
            {c.label}
          </button>
        ))}
      </div>
      {/* grid */}
      <div className="scroll" style={{ padding:'2px 16px 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {items.map(m => (
            <div key={m.id} className="pcard" style={{ opacity: m.sold ? 0.62 : 1 }}>
              <div className="thumb" style={{ height:96 }}>
                {thumbIco(m.ico, 58)}
                {m.stamp && <div style={{ position:'absolute', top:7, right:7 }}>
                  <Stamp size={34} rot={-10}>{m.stamp}</Stamp></div>}
                {m.sold && <div style={{ position:'absolute', inset:0, display:'flex',
                  alignItems:'center', justifyContent:'center' }}>
                  <Stamp size={56} rot={-14} type="sold">売切</Stamp></div>}
              </div>
              <div style={{ padding:'9px 11px 11px' }}>
                <div style={{ fontWeight:700, fontSize:13.5, lineHeight:1.3 }}>{m.name}</div>
                <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:2 }}>{m.sub}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <Yen v={m.price} className="" />
                  <button className="btn btn-primary" disabled={m.sold}
                    style={{ width:30, height:30, borderRadius:9, fontSize:20, padding:0,
                      opacity:m.sold?0.4:1 }}>＋</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* cart summary */}
      <div className="bottombar" style={{ padding:'12px 16px' }}>
        <button className="btn" style={{ width:'100%', padding:'14px', background:'var(--bar)',
          color:'var(--bar-ink)', borderRadius:13 }}>
          <span style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, fontWeight:700 }}>
            <span style={{ background:'var(--accent)', color:'#FBEFD9', borderRadius:999,
              width:22, height:22, display:'inline-flex', alignItems:'center', justifyContent:'center',
              fontSize:12 }}>4</span>
            カートを見る
          </span>
          <span style={{ marginLeft:'auto', fontFamily:'var(--mincho)', fontWeight:700, fontSize:18 }}>
            <span style={{ fontSize:11 }}>¥</span>2,360</span>
        </button>
      </div>
      <TabBar active="order" />
    </div>
  );
}

/* ============================================================
   案B — 新茶 / エディトリアル・リスト
   ============================================================ */
function OrderB() {
  return (
    <div className="pos theme-fresh paper-fiber">
      <SafeTop />
      {/* brand strip */}
      <div style={{ position:'relative', zIndex:3, padding:'0 20px 10px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <img src="assets/logo.png" alt="とおりすがりの和紅茶"
          style={{ height:44, marginLeft:-6, objectFit:'contain', objectPosition:'left' }} />
        <div style={{ textAlign:'right' }}>
          <div className="eyebrow" style={{ fontSize:10 }}>ORDER</div>
          <div style={{ fontFamily:'var(--mincho)', fontWeight:700, fontSize:15, color:'var(--ink-soft)' }}>No.1042</div>
        </div>
      </div>
      {/* dine option pills */}
      <div style={{ display:'flex', gap:8, padding:'0 20px 12px', position:'relative', zIndex:3 }}>
        <span className="chip on" style={{ padding:'6px 16px' }}>店内</span>
        <span className="chip" style={{ padding:'6px 16px' }}>お持ち帰り</span>
        <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6,
          fontSize:12, color:'var(--ink-mute)', fontWeight:700 }}>
          <LeafMark size={15} /> 本日のおすすめ
        </span>
      </div>
      <div className="scroll" style={{ padding:'4px 20px 14px' }}>
        {CATS.map(c => {
          const items = MENU.filter(m => m.cat === c.id);
          return (
            <div key={c.id} style={{ marginBottom:18 }}>
              {/* section header with brush underline */}
              <div style={{ display:'flex', alignItems:'baseline', gap:9, marginBottom:8 }}>
                <span className="section-jp" style={{ fontSize:17 }}>{c.label}</span>
                <span className="eyebrow" style={{ fontSize:9.5 }}>{c.sub}</span>
                <svg width="100%" height="6" style={{ flex:1, color:'var(--brown-2)', opacity:0.5 }}>
                  <path d="M0 4 Q 40 1 90 4 T 200 4 T 320 4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              {items.map((m,i) => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:13,
                  padding:'11px 2px', borderBottom: i<items.length-1 ? '1px dashed var(--line-2)':'none',
                  opacity:m.sold?0.55:1 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0,
                    background:'var(--card)', border:'1.5px solid var(--line)', position:'relative',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'var(--brown)' }}>
                    <div style={{ width:34, height:34 }}>{Ico[m.ico]}</div>
                    {m.stamp && <div style={{ position:'absolute', top:-7, right:-7 }}>
                      <Stamp size={26} rot={-12}>{m.stamp}</Stamp></div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14.5 }}>{m.name}</div>
                    <div style={{ fontSize:11.5, color:'var(--ink-mute)', marginTop:1 }}>{m.sub}</div>
                  </div>
                  <Yen v={m.price} className="" />
                  {m.sold
                    ? <Stamp size={36} rot={-10} type="sold">売切</Stamp>
                    : <button className="btn btn-ghost" style={{ width:34, height:34, borderRadius:'50%',
                        fontSize:20, padding:0, borderColor:'var(--brown-2)', color:'var(--brown)' }}>＋</button>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {/* floating order bar */}
      <div className="bottombar" style={{ padding:'12px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--ink-mute)', fontWeight:700 }}>4点 / 合計</div>
          <Yen v={2360} className="" />
        </div>
        <button className="btn btn-accent" style={{ marginLeft:'auto', padding:'13px 26px',
          borderRadius:999, fontSize:15 }}>お会計へ →</button>
      </div>
    </div>
  );
}

/* ============================================================
   案C — 番茶 / 帳場（濃焙煎ヘッダー＋伝票）
   ============================================================ */
function OrderC() {
  return (
    <div className="pos theme-hojicha paper-grain">
      {/* dark roasted header (covers status area) */}
      <div style={{ background:'var(--bar)', color:'var(--bar-ink)', position:'relative', zIndex:4,
        paddingTop:54, boxShadow:'0 6px 16px rgba(52,33,15,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 18px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <img src="assets/logo-cream.png" style={{ height:30 }} alt="" />
            <div className="wordmark" style={{ fontSize:18, color:'var(--bar-ink)' }}>和紅茶</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12,
            fontFamily:'var(--mincho)', fontWeight:700 }}>
            <span style={{ opacity:0.6, fontSize:10 }}>伝票</span>No.1042
            <span style={{ border:'1px solid rgba(243,234,214,0.4)', borderRadius:6, padding:'3px 9px',
              fontFamily:'var(--gothic)', fontWeight:700, fontSize:11 }}>店内</span>
          </div>
        </div>
        {/* category chips */}
        <div style={{ display:'flex', gap:18, padding:'0 18px', overflowX:'auto' }}>
          {CATS.map((c,i) => (
            <div key={c.id} style={{ paddingBottom:11, position:'relative', whiteSpace:'nowrap',
              fontFamily:'var(--mincho)', fontWeight:700, fontSize:15,
              color: i===0 ? 'var(--bar-ink)' : 'rgba(243,234,214,0.5)' }}>
              {c.label}
              {i===0 && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3,
                background:'var(--accent)', borderRadius:3 }} />}
            </div>
          ))}
        </div>
      </div>
      {/* big rows */}
      <div className="scroll" style={{ padding:'14px 16px 16px' }}>
        <div className="eyebrow" style={{ marginBottom:10 }}>ドリンク · Drink</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {MENU.filter(m=>m.cat==='drink').map(m => (
            <div key={m.id} className="ticket" style={{ display:'flex', alignItems:'stretch',
              overflow:'hidden', opacity:m.sold?0.6:1 }}>
              <div style={{ width:74, flexShrink:0, background:'var(--paper-2)',
                borderRight:'2px dashed var(--line-2)', display:'flex', alignItems:'center',
                justifyContent:'center', color:'var(--brown)', position:'relative' }}>
                <div style={{ width:44, height:44 }}>{Ico[m.ico]}</div>
                {m.stamp && <div style={{ position:'absolute', top:5, left:5 }}>
                  <Stamp size={26} rot={-12}>{m.stamp}</Stamp></div>}
              </div>
              <div style={{ flex:1, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15.5 }}>{m.name}</div>
                  <div style={{ fontSize:11.5, color:'var(--ink-mute)', marginTop:2 }}>{m.sub}</div>
                </div>
                <Yen v={m.price} className="" />
                <button className="btn btn-accent" style={{ width:40, height:40, borderRadius:11,
                  fontSize:22, padding:0 }}>＋</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* running tab footer */}
      <div className="bottombar" style={{ padding:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ background:'var(--accent)', color:'#FBEFD9', borderRadius:8, width:26, height:26,
              display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>4</span>
            <div>
              <div style={{ fontSize:10.5, color:'var(--ink-mute)', fontWeight:700, letterSpacing:'0.08em' }}>お預かり伝票</div>
              <Yen v={2360} className="" />
            </div>
          </div>
          <button className="btn" style={{ marginLeft:'auto', padding:'13px 22px', background:'var(--bar)',
            color:'var(--bar-ink)', borderRadius:11, fontSize:15 }}>会計する →</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OrderA, OrderB, OrderC, TabBar });
