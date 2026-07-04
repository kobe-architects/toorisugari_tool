/* ============================================================
   とおりすがりの和紅茶 — 共通ローダー
   ロゴが左→右に満ちていく + 茶摘み人が歩く + %カウント
   usage:  TWLoader.start({ dark:false, logo:'assets/logo.png',
                            farmer:'assets/farmer.png', minMs:2200 });
   完了時に document へ 'tw-loaded' を dispatch。
   ============================================================ */
(function () {
  const MSG = ['茶葉を摘んでいます', 'お湯を沸かしています', '一杯分、蒸らしています', 'まもなく開店します'];

  function start(opts = {}) {
    const dark = !!opts.dark;
    const logo = opts.logo || 'assets/logo.png';
    const logoOn = opts.logoOverride || (dark ? 'assets/logo-cream.png' : logo);
    const farmer = opts.farmer || (dark ? 'assets/farmer-cream.png' : 'assets/farmer.png');
    const minMs = opts.minMs || 2200;
    const paper = opts.bg || (dark ? '#34210F' : '#E9DDC4');
    const ink = opts.ink || (dark ? 'rgba(243,234,214,0.78)' : '#6E5944');
    const mute = opts.mute || (dark ? 'rgba(243,234,214,0.45)' : '#A18A6C');
    const accent = opts.accent || '#B0402E';
    const flip = opts.flip ? -1 : 1;
    const mode = opts.mode === 'image' ? 'image' : 'logo';
    const image = opts.image || 'assets/tea-field.png';

    const wrap = document.createElement('div');
    wrap.id = 'tw-loader';
    if (mode === 'image') {
      wrap.innerHTML = `
      <div class="twl-grain"></div>
      <div class="twl-stage twl-imgstage">
        <div class="twl-photo">
          <img class="twl-pgray" src="${image}" alt="">
          <img class="twl-pcolor" src="${image}" alt="茶畑">
        </div>
        <div class="twl-pbar"><div class="twl-pbar-fill"></div>
          <img class="twl-farmer twl-farmer-img" src="${farmer}" alt="" style="--flip:${flip}">
        </div>
        <div class="twl-meta">
          <span class="twl-msg">${MSG[0]}</span>
          <span class="twl-pct">0<span class="twl-pp">%</span></span>
        </div>
      </div>`;
    } else {
      wrap.innerHTML = `
      <div class="twl-grain"></div>
      <div class="twl-stage">
        <div class="twl-logo">
          <img class="twl-ghost" src="${logoOn}" alt="">
          <img class="twl-fill"  src="${logoOn}" alt="とおりすがりの和紅茶">
        </div>
        <div class="twl-track">
          <div class="twl-road"></div>
          <div class="twl-fillbar"></div>
          <img class="twl-farmer" src="${farmer}" alt="" style="--flip:${flip}">
        </div>
        <div class="twl-meta">
          <span class="twl-msg">${MSG[0]}</span>
          <span class="twl-pct">0<span class="twl-pp">%</span></span>
        </div>
      </div>`;
    }

    const css = document.createElement('style');
    css.textContent = `
      #tw-loader{position:fixed;inset:0;z-index:99999;background:${paper};
        display:flex;align-items:center;justify-content:center;
        transition:opacity .6s ease, transform .8s cubic-bezier(.7,0,.2,1);
        font-family:var(--gothic);overflow:hidden;}
      #tw-loader .twl-grain{position:absolute;inset:0;pointer-events:none;opacity:.10;
        mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");}
      #tw-loader .twl-stage{position:relative;width:min(540px,82vw);text-align:center;}
      #tw-loader .twl-logo{position:relative;width:100%;margin-bottom:30px;}
      #tw-loader .twl-logo img{width:100%;display:block;}
      #tw-loader .twl-ghost{opacity:${dark?0.16:0.14};}
      #tw-loader .twl-fill{position:absolute;inset:0;clip-path:inset(0 100% 0 0);
        transition:clip-path .25s linear;}
      #tw-loader .twl-track{position:relative;height:96px;margin:0 6px;}
      #tw-loader .twl-road{position:absolute;left:0;right:0;bottom:20px;height:0;
        border-top:2.5px dashed ${mute};opacity:.6;}
      #tw-loader .twl-fillbar{position:absolute;left:0;bottom:19px;height:3px;width:0;
        background:${accent};border-radius:2px;transition:width .25s linear;}
      #tw-loader .twl-farmer{position:absolute;bottom:18px;left:0;height:78px;width:auto;
        transform:translateX(-50%) scaleX(var(--flip,1));transition:left .25s linear;transform-origin:bottom center;
        animation:twl-walk .5s ease-in-out infinite;}
      @keyframes twl-walk{0%,100%{transform:translateX(-50%) scaleX(var(--flip,1)) translateY(0) rotate(-1.5deg);}
        50%{transform:translateX(-50%) scaleX(var(--flip,1)) translateY(-5px) rotate(1.5deg);}}
      #tw-loader .twl-meta{display:flex;align-items:baseline;justify-content:space-between;
        margin-top:14px;padding:0 4px;}
      #tw-loader .twl-msg{font-size:13.5px;letter-spacing:.08em;color:${ink};font-weight:500;}
      #tw-loader .twl-msg::after{content:'…';}
      #tw-loader .twl-pct{font-family:var(--mincho);font-weight:800;font-size:30px;color:${dark?'#F3EAD6':'#3A2B1E'};line-height:1;}
      #tw-loader .twl-pp{font-size:15px;margin-left:1px;color:${mute};}
      #tw-loader.twl-done{transform:translateY(-100%);}
      /* image mode */
      #tw-loader .twl-imgstage{width:min(620px,86vw);}
      #tw-loader .twl-photo{position:relative;width:100%;aspect-ratio:1983/793;border-radius:14px;
        overflow:hidden;box-shadow:0 22px 50px rgba(58,43,30,0.22);margin-bottom:62px;}
      #tw-loader .twl-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
      #tw-loader .twl-pgray{filter:grayscale(1) contrast(.96) brightness(1.03);}
      #tw-loader .twl-pcolor{clip-path:inset(0 100% 0 0);transition:clip-path .22s linear;}
      #tw-loader .twl-pbar{position:relative;height:4px;border-radius:3px;background:${mute};
        opacity:.45;margin:0 2px 0;}
      #tw-loader .twl-pbar-fill{position:absolute;left:0;top:0;height:100%;width:0;border-radius:3px;
        background:${accent};transition:width .22s linear;opacity:1;}
      #tw-loader .twl-farmer-img{position:absolute;bottom:2px;left:0;height:50px;width:auto;
        transform:translateX(-50%) scaleX(var(--flip,1));transition:left .22s linear;
        transform-origin:bottom center;animation:twl-walk .5s ease-in-out infinite;
        filter:drop-shadow(0 5px 6px rgba(58,43,30,0.22));overflow:visible;}
      @media (prefers-reduced-motion: reduce){
        #tw-loader .twl-farmer{animation:none;}}
    `;
    document.head.appendChild(css);
    document.body.appendChild(wrap);
    document.documentElement.style.overflow = 'hidden';

    const fill = wrap.querySelector('.twl-fill');
    const bar  = wrap.querySelector('.twl-fillbar');
    const farm = wrap.querySelector('.twl-farmer');
    const pcolor = wrap.querySelector('.twl-pcolor');
    const pbar = wrap.querySelector('.twl-pbar-fill');
    const farmImg = wrap.querySelector('.twl-farmer-img');
    const pctE = wrap.querySelector('.twl-pct');
    const msgE = wrap.querySelector('.twl-msg');

    const t0 = Date.now();
    let done = false;
    function render(p) {
      const pr = Math.max(0, Math.min(100, Math.floor(p)));
      if (mode === 'image') {
        pcolor.style.clipPath = `inset(0 ${100 - pr}% 0 0)`;
        pbar.style.width = pr + '%';
        if (farmImg) farmImg.style.left = pr + '%';
      } else {
        fill.style.clipPath = `inset(0 ${100 - pr}% 0 0)`;
        bar.style.width = pr + '%';
        farm.style.left = pr + '%';
      }
      pctE.firstChild.nodeValue = pr;
      msgE.textContent = MSG[Math.min(MSG.length - 1, Math.floor(pr / 26))];
    }
    // deterministic, timer-driven progress (robust when rAF is throttled/backgrounded)
    const iv = setInterval(() => {
      const elapsed = Date.now() - t0;
      render((elapsed / minMs) * 100);
      if (elapsed >= minMs) { clearInterval(iv); finish(); }
    }, 40);
    // hard guarantee in case the interval is throttled while backgrounded
    setTimeout(() => { clearInterval(iv); finish(); }, minMs + 1200);

    function finish() {
      if (done) return;
      done = true;
      render(100);
      setTimeout(() => {
        wrap.style.opacity = '0';
        wrap.classList.add('twl-done');
        document.documentElement.style.overflow = '';
        document.dispatchEvent(new CustomEvent('tw-loaded'));
        setTimeout(() => wrap.remove(), 850);
      }, 360);
    }
  }

  window.TWLoader = { start };
})();
