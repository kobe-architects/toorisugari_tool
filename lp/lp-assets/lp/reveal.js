/* reveal: hero reveals after loader; rest on scroll.
   Hardened: no reliance on rAF for the critical reveal; manual in-view check
   as a fallback for throttled IntersectionObserver delivery. */
(function () {
  let ran = false;

  function revealInView() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('.rv, .rv-scale').forEach(el => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
    });
  }

  function go() {
    if (ran) return;
    ran = true;

    // hero: reveal immediately & synchronously (no rAF, no IO)
    document.querySelectorAll('[data-hero] .rv, [data-hero].rv, [data-hero] .rv-scale')
      .forEach(el => el.classList.add('in'));

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((ents) => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('.rv, .rv-scale').forEach(el => io.observe(el));
    } else {
      document.querySelectorAll('.rv, .rv-scale').forEach(el => el.classList.add('in'));
    }

    // manual fallback for in-view elements (covers throttled IO delivery)
    revealInView();
    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView, { passive: true });
    setTimeout(revealInView, 300);
    setTimeout(revealInView, 1200);
  }

  document.addEventListener('tw-loaded', go);
  // hard fallback if the loader never signals
  window.addEventListener('load', () => setTimeout(go, 5200));
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => { if (!document.body.classList.contains('tw-started')) go(); }, 200));
  else
    setTimeout(() => { if (!document.body.classList.contains('tw-started')) go(); }, 200);
})();
