/* ============================================================
   管理画面（オーナー・スマホ / 焙煎トーン統一）
   AdminLogin / AdminHome / ProductList / ProductEdit
   ============================================================ */

/* small line icons for settings rows */
const AIco = {
  box:  'M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8M12 12v8',
  staff:'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20a7 7 0 0 1 14 0',
  shop: 'M4 9l1.5-4h13L20 9M4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0',
  pay:  'M3 7h18v10H3zM3 11h18M7 15h3',
  chart:'M5 19V11M12 19V5M19 19v-5',
  bell: 'M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0',
};

function Chev() {
  return <svg className="chev" width="8" height="14" viewBox="0 0 8 14" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l6 6-6 6"/></svg>;
}

/* ---------- オーナーログイン（管理者） ---------- */
function AdminLogin() {
  const keys = ['1','2','3','4','5','6','7','8','9','clear','0','ok'];
  return (
    <div className="pos theme-roast paper-grain" style={{ background:'var(--bar)' }}>
      <SafeTop />
      <div className="scroll" style={{ padding:'8px 26px 24px', display:'flex', flexDirection:'column',
        alignItems:'center' }}>
        <div style={{ marginTop:18 }}>
          <img src="assets/logo-cream.png" alt="" style={{ width:200 }} />
        </div>
        {/* 管理者 stamp */}
        <div style={{ marginTop:8, marginBottom:6 }}>
          <Stamp size={78} rot={-8}>
            <span style={{ display:'flex', flexDirection:'column', lineHeight:1.1, fontSize:20 }}>
              <span>管理</span><span>者</span></span>
          </Stamp>
        </div>
        <div style={{ color:'rgba(243,234,214,0.65)', fontSize:12.5, letterSpacing:'0.12em',
          fontWeight:700 }}>OWNER · 管理者ログイン</div>
        <div style={{ fontFamily:'var(--mincho)', fontWeight:700, fontSize:13,
          color:'rgba(243,234,214,0.45)', marginTop:5 }}>店長 · 2026年6月4日（水）</div>

        {/* PIN */}
        <div style={{ display:'flex', gap:13, justifyContent:'center', margin:'20px 0 18px' }}>
          {[1,1,1,0].map((f,i) => (
            <div key={i} style={{ width:13, height:13, borderRadius:'50%',
              background: f ? 'var(--bar-ink)':'transparent',
              border:'1.5px solid rgba(243,234,214,0.4)' }} />
          ))}
        </div>
        {/* keypad (dark) */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:280,
          width:'100%' }}>
          {keys.map(k => {
            if (k==='clear') return <button key={k} className="btn" style={{ height:58,
              background:'transparent', color:'rgba(243,234,214,0.8)',
              border:'1.5px solid rgba(243,234,214,0.3)', fontSize:13 }}>消去</button>;
            if (k==='ok') return <button key={k} className="btn btn-accent" style={{ height:58,
              fontSize:16 }}>承認</button>;
            return <button key={k} className="btn" style={{ height:58,
              background:'rgba(243,234,214,0.08)', border:'1.5px solid rgba(243,234,214,0.18)',
              fontFamily:'var(--mincho)', fontWeight:700, fontSize:24, color:'var(--bar-ink)' }}>{k}</button>;
          })}
        </div>
        <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:7,
          color:'rgba(243,234,214,0.55)', fontSize:12.5, fontWeight:700 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8"><path d="M15 18l-6-6 6-6"/></svg>
          店員レジモードへ戻る
        </div>
      </div>
    </div>
  );
}

/* ---------- 管理ホーム（本日の要約＋設定） ---------- */
function AdminHome() {
  const hours = [3,5,8,12,15,11,9,14,18,16,10,6];
  const max = Math.max(...hours);
  const groups = [
    { title:'店舗運営', items:[
      { k:'box',   t:'商品管理',       s:'15品 · 1品 売切', tag:'' },
      { k:'staff', t:'スタッフ管理',   s:'4名 登録', tag:'' },
      { k:'shop',  t:'営業・店舗設定', s:'営業時間 · 税率 · レシート', tag:'' },
    ]},
    { title:'会計・データ', items:[
      { k:'pay',   t:'決済設定',       s:'現金 · QR · 交通系IC', tag:'' },
      { k:'chart', t:'売上サマリー',   s:'日次・月次（PCでも確認）', tag:'PC' },
    ]},
  ];
  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent:'space-between', paddingTop:0 }}>
        <div className="wordmark" style={{ fontSize:19 }}>
          <LeafMark size={20} color="var(--brown)" /> 和紅茶
          <span style={{ fontFamily:'var(--gothic)', fontWeight:700, fontSize:11,
            letterSpacing:'0.16em', color:'var(--accent)', marginLeft:6 }}>管理</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="chip leaf">営業中</span>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--card)',
            border:'1.5px solid var(--line-2)', display:'flex', alignItems:'center',
            justifyContent:'center', fontFamily:'var(--brush)', fontSize:16, color:'var(--ink-soft)' }}>店</div>
        </div>
      </div>

      <div className="scroll" style={{ padding:'4px 16px 16px' }}>
        {/* today summary ticket */}
        <div className="ticket" style={{ overflow:'hidden', marginBottom:18 }}>
          <div style={{ padding:'15px 18px 12px', display:'flex', alignItems:'flex-end',
            justifyContent:'space-between' }}>
            <div>
              <div className="eyebrow">本日の売上 · 6/4</div>
              <div className="stat-num" style={{ fontSize:40, marginTop:6 }}>
                <span style={{ fontSize:20 }}>¥</span>84,200</div>
            </div>
            <Stamp size={50} rot={-10}>好調</Stamp>
          </div>
          {/* hourly bars */}
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:42,
            padding:'0 18px 4px' }}>
            {hours.map((h,i)=>(
              <div key={i} style={{ flex:1, height:`${(h/max)*100}%`, borderRadius:'3px 3px 0 0',
                background: i===8 ? 'var(--accent)':'var(--brown-2)', opacity: i===8?1:0.5 }} />
            ))}
          </div>
          <div className="perf" />
          <div style={{ display:'flex', padding:'12px 18px' }}>
            {[['会計件数','132','件'],['客単価','638','円'],['店内/持帰','7:3','']].map((s,i)=>(
              <div key={i} style={{ flex:1, borderLeft: i? '1px dashed var(--line-2)':'none',
                paddingLeft: i?14:0 }}>
                <div style={{ fontSize:10.5, color:'var(--ink-mute)', fontWeight:700 }}>{s[0]}</div>
                <div style={{ marginTop:3 }}>
                  <span className="stat-num" style={{ fontSize:21 }}>{s[1]}</span>
                  <span style={{ fontSize:11, color:'var(--ink-mute)', marginLeft:2 }}>{s[2]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* settings groups */}
        {groups.map(g=>(
          <div key={g.title} style={{ marginBottom:16 }}>
            <div className="eyebrow" style={{ margin:'0 2px 9px' }}>{g.title}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {g.items.map(it=>(
                <div key={it.t} className="arow">
                  <div className="ico">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={AIco[it.k]}/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14.5 }}>{it.t}</div>
                    <div style={{ fontSize:11.5, color:'var(--ink-mute)', marginTop:1 }}>{it.s}</div>
                  </div>
                  {it.tag && <span className="chip" style={{ fontSize:10.5, padding:'2px 8px' }}>{it.tag}</span>}
                  <Chev />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bottombar" style={{ padding:'12px 16px', display:'flex', gap:10 }}>
        <button className="btn btn-ghost" style={{ flex:1, padding:'13px', fontSize:14 }}>ログアウト</button>
        <button className="btn" style={{ flex:1.4, padding:'13px', background:'var(--bar)',
          color:'var(--bar-ink)', fontSize:14 }}>レジ画面へ戻る →</button>
      </div>
    </div>
  );
}

/* ---------- 商品管理（一覧・売切/表示切替） ---------- */
function ProductList() {
  const rows = MENU.filter(m => ['drink','leaf'].includes(m.cat)).slice(0,7);
  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent:'space-between', paddingTop:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22, color:'var(--ink-soft)' }}>‹</span>
          <span className="section-jp" style={{ fontSize:18 }}>商品管理</span>
        </div>
        <button className="btn btn-accent" style={{ padding:'8px 14px', borderRadius:10, fontSize:13 }}>
          ＋ 追加</button>
      </div>
      {/* category chips */}
      <div style={{ display:'flex', gap:8, padding:'0 16px 12px', overflowX:'auto', position:'relative', zIndex:3 }}>
        {[['すべて',1],['ドリンク',0],['茶葉',0],['お菓子',0],['セット',0]].map((c,i)=>(
          <span key={i} className={'chip'+(c[1]?' on':'')} style={{ flex:'0 0 auto', padding:'7px 14px' }}>{c[0]}</span>
        ))}
      </div>
      <div className="scroll" style={{ padding:'2px 16px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          margin:'0 2px 10px' }}>
          <span className="eyebrow">15品中 7品 表示</span>
          <span style={{ fontSize:11.5, color:'var(--ink-mute)', fontWeight:700 }}>並び替え ⇅</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {rows.map((m,idx)=>{
            const sold = m.sold;
            return (
              <div key={m.id} className="ticket" style={{ display:'flex', alignItems:'center',
                gap:12, padding:'11px 13px', opacity: sold?0.7:1 }}>
                <div style={{ width:42, height:42, borderRadius:10, flexShrink:0,
                  background:'var(--paper-2)', border:'1.5px solid var(--line)', color:'var(--brown)',
                  display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  <div style={{ width:28, height:28 }}>{Ico[m.ico]}</div>
                  {m.stamp && <div style={{ position:'absolute', top:-6, right:-6 }}>
                    <Stamp size={22} rot={-12}>{m.stamp}</Stamp></div>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{m.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                    <Yen v={m.price} />
                    <span style={{ fontSize:11, color:'var(--ink-mute)' }}>{m.sub}</span>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <button className={'switch'+(sold?'':' on')}><span className="knob" /></button>
                  <span style={{ fontSize:10, fontWeight:700,
                    color: sold?'var(--accent)':'var(--leaf)' }}>{sold?'売切':'販売中'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- 商品の追加・編集 ---------- */
function ProductEdit() {
  const cats = ['ドリンク','茶葉','お菓子','セット'];
  const stamps = [['無し',0],['新',0],['推',1],['季',0]];
  return (
    <div className="pos theme-roast paper-grain">
      <SafeTop />
      <div className="topbar" style={{ justifyContent:'space-between', paddingTop:0 }}>
        <span style={{ fontSize:22, color:'var(--ink-soft)', fontWeight:700 }}>✕</span>
        <span className="section-jp" style={{ fontSize:17 }}>商品を編集</span>
        <button className="btn btn-accent" style={{ padding:'8px 16px', borderRadius:10, fontSize:13 }}>保存</button>
      </div>
      <div className="scroll" style={{ padding:'6px 18px 18px' }}>
        {/* icon / thumbnail picker */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <div style={{ width:72, height:72, borderRadius:14, background:'var(--paper-2)',
            border:'1.5px dashed var(--line-2)', display:'flex', alignItems:'center',
            justifyContent:'center', color:'var(--brown)' }}>
            <div style={{ width:48, height:48 }}>{Ico.latte}</div>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13.5, marginBottom:6 }}>商品の絵柄</div>
            <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize:12.5 }}>絵柄を選ぶ</button>
          </div>
        </div>

        <div className="field">
          <div className="field-label">商品名 <span className="req">必須</span></div>
          <input className="input" defaultValue="和紅茶ラテ" />
        </div>
        <div className="field">
          <div className="field-label">説明 / サブ</div>
          <input className="input" defaultValue="有機ミルク" placeholder="例：静岡 べにふうき" />
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <div className="field" style={{ flex:1 }}>
            <div className="field-label">価格（税込）<span className="req">必須</span></div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                fontFamily:'var(--mincho)', fontWeight:700, color:'var(--ink-soft)' }}>¥</span>
              <input className="input mincho" defaultValue="680" style={{ paddingLeft:30, fontSize:18 }} />
            </div>
          </div>
          <div className="field" style={{ width:120 }}>
            <div className="field-label">税率</div>
            <input className="input" defaultValue="10%" style={{ textAlign:'center' }} />
          </div>
        </div>

        <div className="field">
          <div className="field-label">カテゴリ</div>
          <div className="seg">
            {cats.map((c,i)=>(
              <div key={c} className={'opt'+(i===0?' on':'')}>{c}</div>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">ハンコ札</div>
          <div className="seg">
            {stamps.map((s,i)=>(
              <div key={i} className={'opt accent'+(s[1]?' on':'')}
                style={{ fontFamily: i? 'var(--brush)':'var(--gothic)', fontSize: i?17:13.5 }}>{s[0]}</div>
            ))}
          </div>
        </div>

        {/* toggles */}
        <div style={{ background:'var(--card)', border:'1.5px solid var(--line)', borderRadius:13,
          padding:'4px 16px', marginTop:4 }}>
          {[['販売状態','「販売中」で会計画面に表示',true],
            ['レジに表示','非表示にすると注文画面から隠れます',true]].map((r,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 0',
              borderBottom: i===0?'1px dashed var(--line-2)':'none' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{r[0]}</div>
                <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:1 }}>{r[1]}</div>
              </div>
              <button className="switch on"><span className="knob" /></button>
            </div>
          ))}
        </div>

        <button className="btn" style={{ width:'100%', marginTop:18, padding:'13px',
          background:'transparent', color:'var(--accent)', border:'1.5px solid var(--accent)',
          fontSize:14 }}>この商品を削除する</button>
      </div>
    </div>
  );
}

Object.assign(window, { AdminLogin, AdminHome, ProductList, ProductEdit });
