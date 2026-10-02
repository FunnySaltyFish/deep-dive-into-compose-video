/* Master assembly: background, subtitles, chapter cards, progress rail, then every scene in its own layer. */
(function () {
  const { tl, TM, C, el, div, discrete, applyDiscrete, sfx, scenes, setChapter, IR } = H;
  const D = TM.duration;

  // ---------- background ----------
  tl.to('#fade', { opacity: 0, duration: 0.8, ease: 'none' }, 0);
  tl.fromTo('#grid', { x: 0, y: 0 }, { x: -40 * Math.round(D / 30), y: -40 * Math.round(D / 30), duration: D, ease: 'none' }, 0);
  tl.fromTo('#glow', { x: 0, y: 0 }, { x: -520, y: 120, duration: D, ease: 'sine.inOut', yoyo: true, repeat: Math.floor(D / 40) }, 0);
  tl.to('#fade', { opacity: 1, duration: 1.2, ease: 'none' }, D - 1.2);

  // ---------- subtitles: same text source as the TTS ----------
  const subTrack = discrete(document.querySelector('#subtitle span'), '', (v) => { document.querySelector('#subtitle span').textContent = v; });
  const allSubs = TM.cues.flatMap((c) => c.subs).sort((a, b) => a.t0 - b.t0);
  allSubs.forEach((s, i) => {
    subTrack.at(s.t0, s.text);
    const next = allSubs[i + 1];
    if (!next || next.t0 > s.t1 + 0.05) subTrack.at(s.t1, '');
  });

  // ---------- progress rail (only after the intro) ----------
  const rail = document.getElementById('rail');
  const chs = TM.chapters;
  const steps = chs.filter((c) => c.num !== '12');
  const railItems = steps.map((c) => el('div', 'ri', rail, `<i></i><span>${c.rail}</span>`));
  tl.fromTo(rail, { opacity: 0 }, { opacity: 1, duration: 0.6, ...IR }, chs[0].t0 + 0.4);
  tl.to(rail, { opacity: 0, duration: 0.6 }, chs[chs.length - 1].t0);
  steps.forEach((c, i) => {
    railItems.forEach((r, j) => {
      const st = j < i ? 'done' : j === i ? 'cur' : '';
      discrete(r, '', (v) => { r.className = 'ri ' + v; }).at(c.t0 + 0.2, st);
    });
  });

  // ---------- chapter title cards ----------
  const cards = document.getElementById('cards');
  chs.forEach((c) => {
    const card = div(cards, 'ccard', 0, 0, `<div class="n">${c.num}</div><div class="t">${c.name}</div>`);
    const n = card.querySelector('.n'), t = card.querySelector('.t');
    tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, c.t0);
    tl.fromTo(n, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', ...IR }, c.t0);
    tl.fromTo(t, { y: 30, opacity: 0, letterSpacing: '0.3em' }, { y: 0, opacity: 1, letterSpacing: '0.06em', duration: 0.8, ease: 'expo.out', ...IR }, c.t0 + 0.12);
    tl.to(card, { opacity: 0, y: -30, duration: 0.45, ease: 'power2.in' }, c.body - 0.5);
    sfx(c.t0, 'chapter', 0.8);
    const [num, name] = [c.num, c.name.split(/[：:]/)[0]];
    setChapter(c.body - 0.2, num, name);
  });
  chs.forEach((c) => {
    tl.to('#chapter', { opacity: 0, duration: 0.3 }, c.t0 - 0.3);
    tl.to('#chapter', { opacity: 1, duration: 0.4 }, c.body - 0.2);
  });

  // ---------- scenes ----------
  const ranges = { intro: [0, chs[0].t0] };
  chs.forEach((c) => { ranges[c.id] = [c.t0, c.end]; });
  for (const s of scenes) {
    const L = div(H.world, 'layer', 0, 0);
    const [t0, t1] = ranges[s.id];
    s.build(L, { t0, t1, body: s.id === 'intro' ? 0 : TM.chapters.find((c) => c.id === s.id).body });
    // layers are hidden outside their range (keeps rendering cheap and avoids stray leftovers)
    discrete(L, 'none', (v) => { L.style.display = v; }).at(t0 - 0.05, 'block').at(t1 + 0.05, 'none');
  }

  // ---------- runtime ----------
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    document.getElementById('stage').style.transform = `scale(${s})`;
  }
  addEventListener('resize', fit); fit();
  window.seek = (t) => { applyDiscrete(t); tl.seek(t, false); };
  window.DURATION = D;
  window.SFX_LIST = H.SFX.sort((a, b) => a.t - b.t);
  window.seek(0);
  const q = new URLSearchParams(location.search);
  if (q.has('play')) {
    const t0 = performance.now() / 1000 - (parseFloat(q.get('t')) || 0);
    const loop = () => { window.seek(performance.now() / 1000 - t0); requestAnimationFrame(loop); };
    loop();
  }
})();
