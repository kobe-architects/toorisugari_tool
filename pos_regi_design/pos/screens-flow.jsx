/* ============================================================
   フロー画面（焙煎トーン統一）
   Login / Cart / Checkout / Complete
   ============================================================ */

/* ---------- 店員ログイン ---------- */
function LoginScreen() {
  const staff = [
    { n:'店長',  m:'店' }, { n:'みどり', m:'み' },
    { n:'そう',  m:'そ' }, { n:'はる',  m:'は' },
  ];
  const keys = ['1','2','3','4','5','6','7','8','9','clear','0','ok'];
  return (
    <div className="pos theme-roast paper-grain" style={{ background:'var(--paper-2)' }}>
      <SafeTop />
      <div className="scroll" style={{ padding:'8px 26px 24px', display:'flex', flexDirection:'column' }}>
        {/* logo */}
        <div style={{ textAlign:'center', marginTop:14 }}>
          <img src="assets/logo.png" alt="とおりすがりの和紅茶"
            style={{ width:'86%', maxWidth:300, objectFit:'contain' }} />
        </div>
        <div style={{ textAlign:'center', marginTop:2, marginBottom:18 }}>
          <span className="eyebrow">STAFF LOGIN</span>
          <div style={{ fontFamily:'var(--mincho)', fontWeight:700, fontSize:13,
            color:'var(--ink-soft)', marginTop:4 }}>2026年6月4日（水）· 通し営業</div>
        </div>
        {/* staff picker */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
          {staff.map((s,i) => (
            <div key={s.n} style={{ textAlign:'center' }}>
              <div style={{ width:58, height:58, borderRadius:'50%',
                border: i===1 ? '2.5px solid var(--accent)':'1.5px solid var(--line-2)',
                background: i===1 ? 'rgba(176,64,46,0.06)':'var(--card)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--brush)', fontSize:24,
                color: i===1 ? 'var(--accent)':'var(--ink-soft)' }}>{s.m}</div>
              <div style={{ fontSize:11.5, fontWeight:700, marginTop:5,
                color: i===1 ? 'var(--ink)':'var(--ink-mute)' }}>{s.n}</div>
            </div>
          ))}
        </div>
        {/* PIN */}
        <div style={{ display:'flex', gap:13, justifyContent:'center', marginBottom:18 }}>
          {[1,1,0,0].map((f,i) => (
            <div key={i} style={{ width:13, height:13, borderRadius:'50%',
              background: f ? 'var(--brown)':'transparent',
              border:'1.5px solid var(--line-2)' }} />
          ))}
        </div>
        {/* keypad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:280,
          margin:'0 auto', width:'100%' }}>
          {keys.map(k => {
            if (k==='clear') return <button key={k} className="btn btn-ghost"
              style={{ height:58, fontSize:13, fontWeight:700 }}>消去</button>;
            if (k==='ok') return <button key={k} className="btn"
              style={{ height:58, background:'var(--bar)', color:'var(--bar-ink)', fontSize:16 }}>入店</button>;
            return <button key={k} className="btn"
              style={{ height:58, background:'var(--card)', border:'1.5px solid var(--line)',
                fontFamily:'var(--mincho)', fontWeight:700, fontSize:24, color:'var(--ink)' }}>{k}</button>;
          })}
        </div>
        <div style={{ textAlign:'center', marginTop:18, fontSize:11.5, color:'var(--ink-mute)' }}>
          4桁のパスコードを入力してください
        </div>
      </div>
    </div>
  );
}

/* ---------- カート / 注文確認 ---------- */
function CartScreen() {
  const sub = CART.reduce((a,c)=>a+c.price*c.qty,0);
  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent:'space-between', paddingTop:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22, color:'var(--ink-soft)' }}>‹</span>
          <span className="section-jp" style={{ fontSize:18 }}>ご注文の確認</span>
        </div>
        <span className="chip">No.1042 · 店内</span>
      </div>
      <div className="scroll" style={{ padding:'4px 18px 16px' }}>
        <div className="ticket" style={{ padding:'4px 16px' }}>
          {CART.map((c,i) => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0',
              borderBottom: i<CART.length-1 ? '1px dashed var(--line-2)':'none' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14.5 }}>{c.name}</div>
                <div style={{ fontSize:11.5, color:'var(--ink-mute)', marginTop:2 }}>{c.sub}</div>
              </div>
              <div className="stepper">
                <button>－</button><span className="n">{c.qty}</span><button>＋</button>
              </div>
              <Yen v={c.price*c.qty} className="" />
            </div>
          ))}
        </div>
        {/* add more */}
        <button className="btn btn-ghost" style={{ width:'100%', padding:'12px', marginTop:12,
          borderStyle:'dashed', fontSize:13.5 }}>＋ 商品を追加する</button>
        {/* note */}
        <div style={{ marginTop:14, display:'flex', gap:9, alignItems:'flex-start',
          padding:'12px 14px', background:'var(--card)', borderRadius:12, border:'1.5px solid var(--line)' }}>
          <LeafMark size={17} color="var(--leaf)" />
          <div style={{ fontSize:12, color:'var(--ink-soft)', lineHeight:1.5 }}>
            ポットサービスは茶葉をお選びいただけます。お声がけください。
          </div>
        </div>
      </div>
      {/* totals + cta */}
      <div className="bottombar" style={{ padding:'14px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5,
          color:'var(--ink-soft)', marginBottom:4 }}>
          <span>小計（3点）</span><span className="price"><span className="yen">¥</span>{sub.toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5,
          color:'var(--ink-mute)', marginBottom:10 }}>
          <span>内消費税(10%)</span><span>¥{Math.round(sub-sub/1.1).toLocaleString()}</span>
        </div>
        <button className="btn" style={{ width:'100%', padding:'15px', background:'var(--bar)',
          color:'var(--bar-ink)', fontSize:16 }}>
          お会計へ進む
          <span style={{ marginLeft:'auto', fontFamily:'var(--mincho)', fontWeight:700, fontSize:19 }}>
            <span style={{ fontSize:12 }}>¥</span>{sub.toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- 会計 / 決済 ---------- */
function CheckoutScreen() {
  const total = 2880;
  const pays = [
    { id:'cash', label:'現金',     d:'M3 7h18v10H3z M7 12h.1M12 12a2 2 0 100 .1' },
    { id:'card', label:'クレジット', d:'M3 7h18v10H3z M3 11h18' },
    { id:'qr',   label:'QR決済',   d:'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h3v3h-3z' },
    { id:'ic',   label:'交通系IC', d:'M5 12a7 7 0 0 1 7-7M9 12a3 3 0 0 1 3-3M12 19a7 7 0 0 0 7-7' },
  ];
  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent:'space-between', paddingTop:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22, color:'var(--ink-soft)' }}>‹</span>
          <span className="section-jp" style={{ fontSize:18 }}>お会計</span>
        </div>
        <span className="chip">No.1042</span>
      </div>
      <div className="scroll" style={{ padding:'4px 18px 16px' }}>
        {/* total ticket */}
        <div className="ticket" style={{ overflow:'hidden' }}>
          <div style={{ padding:'18px 18px 16px', textAlign:'center' }}>
            <div className="eyebrow">お会計金額</div>
            <div className="price" style={{ fontSize:46, marginTop:6, lineHeight:1 }}>
              <span style={{ fontSize:22 }}>¥</span>{total.toLocaleString()}</div>
            <div style={{ fontSize:11.5, color:'var(--ink-mute)', marginTop:6 }}>4点 · 内税 ¥262</div>
          </div>
          <div className="perf" style={{ margin:'0 0' }} />
          <div style={{ padding:'12px 18px', display:'flex', justifyContent:'space-between',
            fontSize:12.5, color:'var(--ink-soft)' }}>
            <span>お預かり</span>
            <span className="price"><span className="yen">¥</span>3,000</span>
          </div>
          <div style={{ padding:'0 18px 14px', display:'flex', justifyContent:'space-between',
            fontSize:13, fontWeight:700, color:'var(--accent)' }}>
            <span>おつり</span>
            <span className="price" style={{ color:'var(--accent)' }}><span className="yen">¥</span>120</span>
          </div>
        </div>
        {/* payment methods */}
        <div className="eyebrow" style={{ margin:'18px 2px 10px' }}>お支払い方法</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
          {pays.map((p,i) => (
            <button key={p.id} className="pcard" style={{ padding:'16px 12px', display:'flex',
              flexDirection:'column', alignItems:'center', gap:9, cursor:'pointer',
              borderColor: i===0 ? 'var(--accent)':'var(--line)',
              borderWidth: i===0 ? 2:1.5, background:'var(--card)',
              boxShadow: i===0 ? '0 2px 0 rgba(176,64,46,0.12)':'0 2px 0 rgba(58,43,30,0.05)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                stroke={i===0 ? 'var(--accent)':'var(--brown)'} strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"><path d={p.d}/></svg>
              <span style={{ fontWeight:700, fontSize:13.5,
                color: i===0 ? 'var(--ink)':'var(--ink-soft)' }}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="bottombar" style={{ padding:'14px 18px' }}>
        <button className="btn btn-accent" style={{ width:'100%', padding:'16px', fontSize:16 }}>
          現金で会計を確定する
        </button>
      </div>
    </div>
  );
}

/* ---------- 完了 / レシート ---------- */
function CompleteScreen() {
  return (
    <div className="pos theme-roast paper-grain" style={{ background:'var(--bar)' }}>
      <SafeTop />
      <div className="scroll" style={{ padding:'10px 24px 24px', display:'flex',
        flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        {/* big hanko */}
        <div style={{ position:'relative', marginTop:24, marginBottom:18 }}>
          <Stamp size={130} rot={-9}>
            <span style={{ display:'flex', flexDirection:'column', lineHeight:1.15, fontSize:30 }}>
              <span>御</span><span>会計</span><span style={{ fontSize:15, marginTop:2 }}>済</span></span>
          </Stamp>
        </div>
        <div style={{ fontFamily:'var(--mincho)', fontWeight:700, fontSize:22,
          color:'var(--bar-ink)', letterSpacing:'0.08em' }}>ありがとうございました</div>
        <div style={{ color:'rgba(243,234,214,0.6)', fontSize:12.5, marginTop:6 }}>またのお越しをお待ちしております</div>

        {/* receipt slip */}
        <div className="ticket" style={{ width:'100%', maxWidth:300, marginTop:26, padding:'18px 20px' }}>
          <div style={{ textAlign:'center', marginBottom:12 }}>
            <img src="assets/logo.png" style={{ height:38, objectFit:'contain' }} alt="" />
          </div>
          <div className="hr-dash" style={{ marginBottom:10 }} />
          {[['和紅茶（ホット）×2','1,200'],['和紅茶シフォン','480'],['べにふうき 50g','1,200']].map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5,
              padding:'4px 0', color:'var(--ink-soft)' }}>
              <span>{r[0]}</span><span className="price"><span className="yen">¥</span>{r[1]}</span>
            </div>
          ))}
          <div className="hr-dash" style={{ margin:'10px 0' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:15 }}>
            <span>合計</span><Yen v={2880} /></div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5,
            color:'var(--ink-mute)', marginTop:6 }}>
            <span>現金 / おつり</span><span>¥3,000 / ¥120</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:12, width:'100%', maxWidth:300, marginTop:22 }}>
          <button className="btn btn-ghost" style={{ flex:1, padding:'14px',
            color:'var(--bar-ink)', borderColor:'rgba(243,234,214,0.4)' }}>レシート印刷</button>
          <button className="btn" style={{ flex:1.3, padding:'14px', background:'var(--card-2)',
            color:'var(--ink)', fontSize:15 }}>次のお客様へ →</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, CartScreen, CheckoutScreen, CompleteScreen });
