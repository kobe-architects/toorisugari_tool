/* ============================================================
   デザインブリーフ / システム早見表
   ============================================================ */
function SwatchRow({ name, vars }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
      <div style={{ width:78, fontSize:12, fontWeight:700, color:'#4A3724',
        fontFamily:'"Zen Kaku Gothic New",sans-serif' }}>{name}</div>
      <div style={{ display:'flex', flex:1, borderRadius:7, overflow:'hidden',
        border:'1px solid rgba(70,53,36,0.15)' }}>
        {vars.map((c,i)=>(
          <div key={i} style={{ flex:1, height:30, background:c }} />
        ))}
      </div>
    </div>
  );
}

function Brief() {
  const S = { fontFamily:'"Zen Kaku Gothic New",sans-serif', color:'#3A2B1E' };
  const Mincho = { fontFamily:'"Shippori Mincho",serif' };
  return (
    <div className="paper-grain" style={{ ...S, position:'relative', width:'100%', height:'100%',
      background:'#E6D9BF', padding:'40px 46px', overflow:'hidden' }}>
      <div style={{ position:'relative', zIndex:2, display:'flex', gap:44, height:'100%' }}>
        {/* left: brand + reasoning */}
        <div style={{ width:360, flexShrink:0, display:'flex', flexDirection:'column' }}>
          <img src="assets/logo.png" alt="" style={{ width:230, marginLeft:-8 }} />
          <div style={{ ...Mincho, fontWeight:800, fontSize:25, letterSpacing:'0.04em', marginTop:6 }}>
            モバイルPOS デザイン案</div>
          <div style={{ fontSize:12.5, color:'#6E5944', marginTop:3, letterSpacing:'0.08em' }}>
            iPhone 縦持ち · 店頭レジ用</div>

          <div style={{ marginTop:20, fontSize:13, lineHeight:1.85, color:'#4A3724' }}>
            屋号「とおりすがりの和紅茶」の手描きロゴを起点に、<b>クラフト紙の質感</b>と
            <b>朱色のハンコ</b>を軸にした、温かみのあるレジ画面です。商品は明朝体の価格と
            ライン画で素朴に見せ、新商品・おすすめ・売切は判子で表現しました。
          </div>

          <div style={{ marginTop:'auto', paddingTop:20 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.2em',
              color:'#97836A' }}>書体 / TYPE</div>
            <div style={{ ...Mincho, fontWeight:700, fontSize:30, marginTop:8 }}>
              和紅茶 <span style={{ fontSize:15, color:'#6E5944' }}>明朝 — 見出し・価格</span></div>
            <div style={{ fontSize:18, fontWeight:700, marginTop:4 }}>
              ドリンク 茶葉 <span style={{ fontSize:13, color:'#6E5944', fontWeight:500 }}>ゴシック — UI</span></div>
            <div style={{ fontFamily:'"Yuji Syuku",serif', fontSize:22, marginTop:6, color:'#B0402E' }}>
              新 · 推 · 売切 <span style={{ fontSize:13, color:'#6E5944',
                fontFamily:'"Zen Kaku Gothic New",sans-serif' }}>筆 — ハンコ</span></div>
          </div>
        </div>

        {/* right: palette + screens */}
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.2em', color:'#97836A',
            marginBottom:12 }}>配色 3トーン / BROWN TONES</div>
          <SwatchRow name="① 焙煎" vars={['#3C2C1D','#6B4A2E','#E6D9BF','#F6EFDF','#B0402E']} />
          <SwatchRow name="② 新茶" vars={['#5A4326','#8A6A45','#F1E8D4','#FCF7EC','#B0402E']} />
          <SwatchRow name="③ 番茶" vars={['#34210F','#7A4B2C','#DFCDAF','#EFE3CB','#A83A23']} />

          <div style={{ display:'flex', gap:7, marginTop:6, marginBottom:22, flexWrap:'wrap' }}>
            {['濃焙煎 地','茶 主役','クラフト紙 地','生成り 面','朱 ハンコ'].map((t,i)=>(
              <span key={i} style={{ fontSize:10.5, color:'#6E5944' }}>{t}{i<4?' ·':''}</span>
            ))}
          </div>

          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.2em', color:'#97836A',
            marginBottom:12 }}>画面構成 / SCREENS</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['店員ログイン','パスコード入店'],
              ['注文（メイン）','3案を比較'],
              ['カート / 注文確認','数量・小計'],
              ['お会計 / 決済','現金・QR・IC'],
              ['会計完了','ハンコ＋レシート'],
              ['売上サマリー','PC・別URL（別ファイル）'],
            ].map((s,i)=>(
              <div key={i} style={{ background:'#F6EFDF', border:'1.5px solid rgba(58,43,30,0.16)',
                borderRadius:10, padding:'11px 13px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:24, height:24, borderRadius:'50%', flexShrink:0,
                  background:'#3C2C1D', color:'#F3EAD6', fontSize:12, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center', ...Mincho }}>{i+1}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{s[0]}</div>
                  <div style={{ fontSize:10.5, color:'#97836A' }}>{s[1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Brief });
