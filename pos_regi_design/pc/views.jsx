/* ============================================================
   PC ビュー：売上管理 / 顧客分析
   ============================================================ */

function Panel({ title, sub, right, children, style }) {
  return (
    <div className="ticket" style={{ padding:'18px 22px', ...style }}>
      <div style={{ display:'flex', alignItems:'flex-end', marginBottom:16, gap:12 }}>
        <div>
          <div className="eyebrow">{title}</div>
          {sub && <div style={{ fontSize:11.5, color:'var(--ink-mute)', marginTop:3 }}>{sub}</div>}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:14 }}>{right}</div>
      </div>
      {children}
    </div>
  );
}

function Legend({ items, fmt }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      {items.map((d,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:9 }}>
          <span style={{ width:12, height:12, borderRadius:3, background:d.color, flexShrink:0 }} />
          <span style={{ fontSize:13, fontWeight:700, color:'var(--ink-soft)', flex:1 }}>{d.label}</span>
          <span className="price" style={{ fontSize:14 }}>{fmt?fmt(d.v):d.v+'%'}</span>
        </div>
      ))}
    </div>
  );
}

function YoY({ txt, up }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:12, fontWeight:700,
      color: up?'var(--leaf)':'var(--accent)' }}>
      {up?'▲':'▼'} 前年比 {txt}
    </span>
  );
}

function SeriesLegend() {
  return (
    <div style={{ display:'flex', gap:16, alignItems:'center' }}>
      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-soft)', fontWeight:700 }}>
        <span style={{ width:18, height:3, background:'var(--brown)', borderRadius:2 }} />当年</span>
      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', fontWeight:700 }}>
        <span style={{ width:18, height:0, borderTop:'2px dashed var(--ink-mute)' }} />前年</span>
    </div>
  );
}

/* ---------- 売上管理 ---------- */
function SalesView() {
  const [pk, setPk] = React.useState('month');
  const p = PCD.periods[pk];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* period tabs */}
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ display:'flex', background:'var(--card-2)', border:'1.5px solid var(--line-2)',
          borderRadius:11, overflow:'hidden' }}>
          {Object.entries(PCD.periods).map(([k,v])=>(
            <button key={k} onClick={()=>setPk(k)} className="btn"
              style={{ padding:'10px 22px', borderRadius:0, fontSize:14,
                background: k===pk?'var(--bar)':'transparent',
                color: k===pk?'var(--bar-ink)':'var(--ink-soft)' }}>{v.tab}</button>
          ))}
        </div>
        <span style={{ fontSize:12.5, color:'var(--ink-mute)' }}>{p.sub}</span>
        <span style={{ marginLeft:'auto' }}><YoY txt={p.yoy} up={true} /></span>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {PCD.kpi.map((k,i)=>(
          <div key={i} className="ticket" style={{ padding:'16px 20px' }}>
            <div className="eyebrow" style={{ fontSize:10 }}>{k.label}</div>
            <div style={{ marginTop:8 }}>
              <span className="stat-num" style={{ fontSize:30 }}>{k.val}</span>
              {k.unit && <span style={{ fontSize:13, color:'var(--ink-mute)', marginLeft:3 }}>{k.unit}</span>}
            </div>
            <div style={{ marginTop:8 }}><YoY txt={k.yoy} up={k.up} /></div>
          </div>
        ))}
      </div>

      {/* trend */}
      <Panel title="売上推移" sub={`${p.tab} · 当年 / 前年同期`} right={<SeriesLegend />}>
        <AreaChart labels={p.labels} cur={p.cur} prev={p.prev} unit={p.unit} />
      </Panel>

      {/* hourly + category */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:18 }}>
        <Panel title="時間帯別 売上" sub="ピークタイムの把握"
          right={<span className="chip" style={{ fontSize:11 }}>ピーク 18時台</span>}>
          <ColumnChart labels={PCD.hours.labels} data={PCD.hours.data} peak={PCD.hours.peak} H={232} />
        </Panel>
        <Panel title="カテゴリー別 構成比">
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <Donut data={PCD.category} size={172} thick={28} center={['ドリンク','58%']} />
            <div style={{ flex:1 }}><Legend items={PCD.category} /></div>
          </div>
        </Panel>
      </div>

      {/* product ranking */}
      <Panel title="商品別 売上ランキング" sub="当月 · 全15品中 上位8品"
        right={<button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize:12.5 }}>CSV出力</button>}>
        <RankTable rows={PCD.products} />
      </Panel>
    </div>
  );
}

/* ---------- 顧客分析 ---------- */
function CustomerView() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* seg notes */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {PCD.segNote.map((s,i)=>(
          <div key={i} className="ticket" style={{ padding:'16px 20px' }}>
            <div className="eyebrow" style={{ fontSize:10 }}>{s[0]}</div>
            <div style={{ marginTop:8 }}>
              <span className="stat-num" style={{ fontSize: s[2]?30:22 }}>{s[1]}</span>
              {s[2] && <span style={{ fontSize:13, color:'var(--ink-mute)', marginLeft:3 }}>{s[2]}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* gender + age */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:18 }}>
        <Panel title="性別構成" sub="会員 POS データ">
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <Donut data={PCD.gender} size={172} thick={28} center={['女性','64%']} />
            <div style={{ flex:1 }}><Legend items={PCD.gender} /></div>
          </div>
        </Panel>
        <Panel title="年代別構成" sub="最多は 30代（29%）">
          <HBars rows={PCD.age} />
        </Panel>
      </div>

      {/* 客層サマリー */}
      <Panel title="客層サマリー">
        <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
          <div style={{ flex:1, fontSize:13.5, lineHeight:1.9, color:'var(--ink-soft)' }}>
            主要客層は <b style={{ color:'var(--accent)' }}>30代女性</b>。平日午後と夕方18時台に来店ピークがあり、
            ドリンク＋お菓子のセット購入が中心です。茶葉（物販）は40〜50代の購入比率が高く、
            ギフト需要として伸びています。リピート率は58%で前年から+6pt 改善しました。
          </div>
          <div style={{ width:260, flexShrink:0 }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>来店時間帯 × 客層</div>
            {[['朝〜昼','20-40代 / 女性'],['午後','30-50代 / 女性'],['夕方','20-30代 / 混在'],['夜','30-40代 / 男性']].map((r,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0',
                borderTop:i?'1px dashed var(--line-2)':'none', fontSize:12.5 }}>
                <span style={{ fontWeight:700, color:'var(--ink-soft)' }}>{r[0]}</span>
                <span style={{ color:'var(--ink-mute)' }}>{r[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

Object.assign(window, { SalesView, CustomerView, Panel });
