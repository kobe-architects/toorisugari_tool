/* ============================================================
   タブレット横 管理画面 — 焙煎トーン
   左ナビレール + 本文。AdminHome / ProductMgr / Settings
   ============================================================ */

const TA_NAV = [
  { id:'home',  t:'ダッシュボード', d:'M4 13h7V4H4zM13 21h7v-9h-7zM13 4v5h7V4zM4 21h7v-5H4z' },
  { id:'prod',  t:'商品管理',       d:'M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8M12 12v8' },
  { id:'staff', t:'スタッフ',       d:'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M17 11a3 3 0 0 0 0-6M21 20a6 6 0 0 0-4-5.7' },
  { id:'shop',  t:'営業・店舗設定', d:'M4 9l1.5-4h13L20 9M4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0' },
  { id:'pay',   t:'決済設定',       d:'M3 7h18v10H3zM3 11h18M7 15h3' },
  { id:'sales', t:'売上サマリー',   d:'M5 19V11M12 19V5M19 19v-5', tag:'PC' },
];

function NavIcon({ d }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

function TAdminShell({ active, title, sub, right, children }) {
  return (
    <div className="theme-roast paper-grain" style={{ width:'100%', height:'100%',
      background:'var(--paper)', color:'var(--ink)', fontFamily:'var(--gothic)',
      display:'flex', position:'relative', overflow:'hidden' }}>
      {/* left nav rail */}
      <div style={{ width:232, flexShrink:0, background:'var(--bar)', color:'var(--bar-ink)',
        display:'flex', flexDirection:'column', position:'relative', zIndex:4, padding:'22px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 6px 4px' }}>
          <img src="assets/logo-cream.png" alt="" style={{ height:26 }} />
          <div className="wordmark" style={{ fontSize:17, color:'var(--bar-ink)' }}>和紅茶</div>
        </div>
        <div style={{ fontSize:10.5, letterSpacing:'0.22em', color:'rgba(243,234,214,0.5)',
          fontWeight:700, padding:'0 6px 18px' }}>OWNER 管理</div>
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {TA_NAV.map(n=>{
            const on = n.id===active;
            return (
              <div key={n.id} style={{ display:'flex', alignItems:'center', gap:11,
                padding:'11px 12px', borderRadius:10, cursor:'pointer',
                background: on?'var(--bar-ink)':'transparent',
                color: on?'var(--bar)':'rgba(243,234,214,0.82)',
                fontWeight:700, fontSize:13.5 }}>
                <NavIcon d={n.d} />
                <span style={{ flex:1 }}>{n.t}</span>
                {n.tag && <span style={{ fontSize:9.5, fontWeight:700, padding:'2px 6px',
                  borderRadius:5, border:`1px solid ${on?'rgba(60,44,29,0.3)':'rgba(243,234,214,0.35)'}` }}>{n.tag}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:10,
          padding:'12px 8px 0', borderTop:'1px solid rgba(243,234,214,0.15)' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(243,234,214,0.12)',
            display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--brush)',
            fontSize:17 }}>店</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>店長</div>
            <div style={{ fontSize:10.5, color:'rgba(243,234,214,0.5)' }}>オーナー</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" style={{ opacity:0.6 }}><path d="M16 17l5-5-5-5M21 12H9M12 19H5V5h7"/></svg>
        </div>
      </div>

      {/* content */}
      <div style={{ flex:1, minWidth:0, position:'relative', zIndex:2, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'22px 28px 16px' }}>
          <div>
            <div className="section-jp" style={{ fontSize:24 }}>{title}</div>
            {sub && <div style={{ fontSize:12.5, color:'var(--ink-mute)', marginTop:3 }}>{sub}</div>}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>{right}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- ① ダッシュボード ---------- */
function TabletAdminHome() {
  const hours = [3,5,8,12,15,11,9,14,18,16,12,7];
  const max = Math.max(...hours);
  const labels = ['10','11','12','13','14','15','16','17','18','19','20','21'];
  const ranking = [
    ['和紅茶（ホット）', 48, 28800],
    ['和紅茶ラテ',       33, 22440],
    ['和紅茶シフォン',   27, 12960],
    ['べにふうき 50g',   9,  10800],
    ['季節のフレーバー', 14, 10080],
  ];
  const rmax = ranking[0][1];
  const recent = [
    ['14:38','No.1042','¥2,960','現金'],
    ['14:31','No.1041','¥1,180','QR'],
    ['14:25','No.1040','¥680','IC'],
    ['14:18','No.1039','¥3,420','現金'],
    ['14:09','No.1038','¥980','クレジット'],
  ];
  return (
    <TAdminShell active="home" title="ダッシュボード" sub="2026年6月4日（水）· 通し営業"
      right={<>
        <span className="chip leaf">営業中</span>
        <button className="btn" style={{ padding:'11px 18px', background:'var(--bar)',
          color:'var(--bar-ink)', fontSize:13.5 }}>レジ画面へ →</button>
      </>}>
      <div className="scroll" style={{ padding:'2px 28px 26px' }}>
        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:14, marginBottom:18 }}>
          <div className="ticket" style={{ padding:'16px 20px', display:'flex', flexDirection:'column' }}>
            <div className="eyebrow">本日の売上</div>
            <div className="stat-num" style={{ fontSize:38, marginTop:6 }}>
              <span style={{ fontSize:19 }}>¥</span>84,200</div>
            <div style={{ fontSize:11.5, color:'var(--leaf)', fontWeight:700, marginTop:'auto', paddingTop:6 }}>
              ▲ 前日比 +12%</div>
          </div>
          {[['会計件数','132','件','▲ +8'],['客単価','638','円','▼ −2%'],['客数','176','名','▲ +15']].map((k,i)=>(
            <div key={i} className="pcard" style={{ padding:'16px 18px', background:'var(--card)' }}>
              <div className="eyebrow" style={{ fontSize:10 }}>{k[0]}</div>
              <div style={{ marginTop:8 }}>
                <span className="stat-num" style={{ fontSize:28 }}>{k[1]}</span>
                <span style={{ fontSize:12, color:'var(--ink-mute)', marginLeft:3 }}>{k[2]}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--ink-mute)', fontWeight:700, marginTop:6 }}>{k[3]}</div>
            </div>
          ))}
        </div>

        {/* chart */}
        <div className="ticket" style={{ padding:'16px 22px 14px', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div className="eyebrow">時間帯別 売上</div>
            <div style={{ fontSize:11.5, color:'var(--ink-mute)' }}>ピーク 18時台</div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:120 }}>
            {hours.map((h,i)=>(
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:'100%', height:`${(h/max)*100}px`, borderRadius:'4px 4px 0 0',
                  background:i===8?'var(--accent)':'var(--brown-2)', opacity:i===8?1:0.55 }} />
                <span style={{ fontSize:10, color:'var(--ink-mute)' }}>{labels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <div className="ticket" style={{ padding:'16px 20px' }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>人気商品 ランキング</div>
            {ranking.map((r,i)=>(
              <div key={i} style={{ marginBottom:i<ranking.length-1?12:0 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:5 }}>
                  <span style={{ fontFamily:'var(--mincho)', fontWeight:800, fontSize:14,
                    color:i===0?'var(--accent)':'var(--ink-mute)', width:18 }}>{i+1}</span>
                  <span style={{ fontWeight:700, fontSize:13.5, flex:1 }}>{r[0]}</span>
                  <span style={{ fontSize:12, color:'var(--ink-mute)' }}>{r[1]}点</span>
                  <span className="price" style={{ fontSize:13 }}><span className="yen">¥</span>{r[2].toLocaleString()}</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:'var(--paper-2)', marginLeft:26 }}>
                  <div style={{ width:`${(r[1]/rmax)*100}%`, height:'100%', borderRadius:3,
                    background:i===0?'var(--accent)':'var(--brown-2)', opacity:i===0?1:0.5 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="ticket" style={{ padding:'16px 20px' }}>
            <div className="eyebrow" style={{ marginBottom:6 }}>最近の会計</div>
            {recent.map((r,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0',
                borderBottom:i<recent.length-1?'1px dashed var(--line-2)':'none' }}>
                <span style={{ fontSize:12, color:'var(--ink-mute)', width:42 }}>{r[0]}</span>
                <span style={{ fontFamily:'var(--mincho)', fontWeight:700, fontSize:13, flex:1 }}>{r[1]}</span>
                <span className="chip" style={{ fontSize:10, padding:'2px 8px' }}>{r[3]}</span>
                <span className="price" style={{ fontSize:14, width:62, textAlign:'right' }}>{r[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TAdminShell>
  );
}

/* ---------- ② 商品管理（マスター詳細） ---------- */
function TabletProductMgr() {
  const rows = MENU.filter(m=>['drink','leaf','sweet'].includes(m.cat));
  const sel = 'd3';
  return (
    <TAdminShell active="prod" title="商品管理" sub="15品 · 1品 売切"
      right={<button className="btn btn-accent" style={{ padding:'11px 18px', fontSize:13.5 }}>＋ 新規商品</button>}>
      <div style={{ flex:1, display:'flex', minHeight:0, padding:'0 28px 26px', gap:18 }}>
        {/* list column */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', gap:9, marginBottom:12 }}>
            {['すべて','ドリンク','茶葉','お菓子','セット'].map((c,i)=>(
              <span key={i} className={'chip'+(i===0?' on':'')} style={{ padding:'8px 15px', fontSize:13 }}>{c}</span>
            ))}
          </div>
          <div className="scroll" style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {rows.map(m=>{
              const on = m.id===sel;
              return (
                <div key={m.id} className="ticket" style={{ display:'flex', alignItems:'center', gap:12,
                  padding:'11px 13px', cursor:'pointer', opacity:m.sold?0.7:1,
                  borderColor:on?'var(--accent)':'var(--line)', borderWidth:on?2:1.5,
                  background:on?'rgba(176,64,46,0.05)':'var(--card-2)' }}>
                  <div style={{ width:42, height:42, borderRadius:10, flexShrink:0, background:'var(--paper-2)',
                    border:'1.5px solid var(--line)', color:'var(--brown)', display:'flex',
                    alignItems:'center', justifyContent:'center', position:'relative' }}>
                    <div style={{ width:28, height:28 }}>{Ico[m.ico]}</div>
                    {m.stamp && <div style={{ position:'absolute', top:-6, right:-6 }}>
                      <Stamp size={22} rot={-12}>{m.stamp}</Stamp></div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{m.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                      <Yen v={m.price} /><span style={{ fontSize:11, color:'var(--ink-mute)' }}>{m.sub}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <button className={'switch'+(m.sold?'':' on')}><span className="knob" /></button>
                    <span style={{ fontSize:9.5, fontWeight:700, color:m.sold?'var(--accent)':'var(--leaf)' }}>{m.sold?'売切':'販売中'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* edit panel */}
        <div style={{ width:360, flexShrink:0, background:'var(--card-2)', borderRadius:16,
          border:'1.5px solid var(--line)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'2px dashed var(--line-2)', display:'flex',
            alignItems:'center', gap:10 }}>
            <span className="section-jp" style={{ fontSize:16 }}>商品を編集</span>
            <span className="chip" style={{ marginLeft:'auto', fontSize:10.5 }}>ドリンク</span>
          </div>
          <div className="scroll" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:16 }}>
              <div style={{ width:64, height:64, borderRadius:13, background:'var(--paper-2)',
                border:'1.5px dashed var(--line-2)', display:'flex', alignItems:'center',
                justifyContent:'center', color:'var(--brown)' }}>
                <div style={{ width:42, height:42 }}>{Ico.latte}</div>
              </div>
              <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize:12.5 }}>絵柄を選ぶ</button>
            </div>
            <div className="field">
              <div className="field-label">商品名 <span className="req">必須</span></div>
              <input className="input" defaultValue="和紅茶ラテ" />
            </div>
            <div className="field">
              <div className="field-label">説明 / サブ</div>
              <input className="input" defaultValue="有機ミルク" />
            </div>
            <div className="field">
              <div className="field-label">価格（税込）<span className="req">必須</span></div>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                  fontFamily:'var(--mincho)', fontWeight:700, color:'var(--ink-soft)' }}>¥</span>
                <input className="input mincho" defaultValue="680" style={{ paddingLeft:30, fontSize:18 }} />
              </div>
            </div>
            <div className="field">
              <div className="field-label">ハンコ札</div>
              <div className="seg">
                {[['無し',0],['新',0],['推',1],['季',0]].map((s,i)=>(
                  <div key={i} className={'opt accent'+(s[1]?' on':'')}
                    style={{ fontFamily:i?'var(--brush)':'var(--gothic)', fontSize:i?17:13.5 }}>{s[0]}</div>
                ))}
              </div>
            </div>
            <div style={{ background:'var(--card)', border:'1.5px solid var(--line)', borderRadius:12,
              padding:'2px 14px' }}>
              {[['販売中',true],['レジに表示',true]].map((r,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', padding:'12px 0',
                  borderBottom:i===0?'1px dashed var(--line-2)':'none' }}>
                  <span style={{ flex:1, fontWeight:700, fontSize:13.5 }}>{r[0]}</span>
                  <button className="switch on"><span className="knob" /></button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:'14px 20px', borderTop:'1.5px solid var(--line)', display:'flex', gap:10 }}>
            <button className="btn btn-ghost" style={{ flex:1, padding:'13px', fontSize:13,
              color:'var(--accent)', borderColor:'var(--accent)' }}>削除</button>
            <button className="btn btn-accent" style={{ flex:2, padding:'13px', fontSize:15 }}>保存する</button>
          </div>
        </div>
      </div>
    </TAdminShell>
  );
}

/* ---------- ③ 営業・店舗設定 ---------- */
function TabletAdminSettings() {
  return (
    <TAdminShell active="shop" title="営業・店舗設定" sub="店舗情報・営業時間・税率・レシート・決済"
      right={<button className="btn btn-accent" style={{ padding:'11px 20px', fontSize:13.5 }}>変更を保存</button>}>
      <div className="scroll" style={{ padding:'2px 28px 26px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {/* 店舗情報 */}
          <div className="ticket" style={{ padding:'18px 22px' }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>店舗情報</div>
            <div className="field"><div className="field-label">店名</div>
              <input className="input" defaultValue="とおりすがりの和紅茶" /></div>
            <div className="field"><div className="field-label">住所</div>
              <input className="input" defaultValue="静岡県静岡市葵区茶町1-2-3" /></div>
            <div style={{ display:'flex', gap:12 }}>
              <div className="field" style={{ flex:1 }}><div className="field-label">電話番号</div>
                <input className="input" defaultValue="054-000-0000" /></div>
              <div className="field" style={{ flex:1 }}><div className="field-label">税率</div>
                <input className="input" defaultValue="10%" /></div>
            </div>
          </div>

          {/* 営業時間 */}
          <div className="ticket" style={{ padding:'18px 22px' }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>営業時間</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <input className="input mincho" defaultValue="10:00" style={{ textAlign:'center', fontSize:20 }} />
              <span style={{ color:'var(--ink-mute)' }}>〜</span>
              <input className="input mincho" defaultValue="21:00" style={{ textAlign:'center', fontSize:20 }} />
            </div>
            <div className="field-label" style={{ marginBottom:9 }}>定休日</div>
            <div className="seg">
              {['月','火','水','木','金','土','日'].map((d,i)=>(
                <div key={d} className={'opt'+(i===1?' on':'')} style={{ padding:'10px 2px' }}>{d}</div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', marginTop:16,
              background:'var(--card)', border:'1.5px solid var(--line)', borderRadius:11, padding:'12px 14px' }}>
              <span style={{ flex:1, fontWeight:700, fontSize:13.5 }}>ラストオーダー 20:30</span>
              <button className="switch on"><span className="knob" /></button>
            </div>
          </div>

          {/* レシート */}
          <div className="ticket" style={{ padding:'18px 22px' }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>レシート</div>
            <div className="field"><div className="field-label">フッター文言</div>
              <input className="input" defaultValue="またのお越しをお待ちしております" /></div>
            {[['店名ロゴを印刷',true],['軽減税率を内訳表示',true],['電子レシートQRを印字',false]].map((r,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', padding:'11px 0',
                borderTop:'1px dashed var(--line-2)' }}>
                <span style={{ flex:1, fontWeight:700, fontSize:13.5 }}>{r[0]}</span>
                <button className={'switch'+(r[1]?' on':'')}><span className="knob" /></button>
              </div>
            ))}
          </div>

          {/* 決済方法 */}
          <div className="ticket" style={{ padding:'18px 22px' }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>決済方法</div>
            {[['現金',true],['クレジットカード',true],['QR決済（PayPay他）',true],['交通系IC',true],['電子マネー',false]].map((r,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', padding:'12px 0',
                borderTop:i?'1px dashed var(--line-2)':'none' }}>
                <span style={{ flex:1, fontWeight:700, fontSize:13.5 }}>{r[0]}</span>
                <span style={{ fontSize:11, color:r[1]?'var(--leaf)':'var(--ink-mute)', fontWeight:700,
                  marginRight:12 }}>{r[1]?'有効':'無効'}</span>
                <button className={'switch'+(r[1]?' on':'')}><span className="knob" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TAdminShell>
  );
}

Object.assign(window, { TabletAdminHome, TabletProductMgr, TabletAdminSettings });
