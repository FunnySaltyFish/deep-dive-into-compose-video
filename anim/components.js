/* Shared helpers: element factory, discrete (text) tracks, SFX cue list, timing lookups. */
(function () {
  const world = document.getElementById('world');
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, parent = world, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  }
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }
  function overlay(parent = world) {
    const s = svgEl('svg', { class: 'overlay' }, parent);
    s.innerHTML = `<defs>
      <marker id="arr${Math.random().toString(36).slice(2, 6)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`;
    s.arrowId = s.querySelector('marker').id;
    return s;
  }

  // ---- discrete tracks: values that jump (text content, classes) and must survive seeking ----
  const tracks = [];
  function discrete(target, initial, apply) {
    const tr = { kf: [[-Infinity, initial]], apply: apply || ((v) => { target.textContent = v; }), last: undefined };
    tracks.push(tr);
    return { at(t, v) { tr.kf.push([t, v]); tr.kf.sort((a, b) => a[0] - b[0]); return this; } };
  }
  function applyDiscrete(t) {
    for (const tr of tracks) {
      let v = tr.kf[0][1];
      for (const [kt, kv] of tr.kf) if (kt <= t) v = kv; else break;
      if (v !== tr.last) { tr.apply(v); tr.last = v; }
    }
  }

  // ---- sound effects cue list, read by the mixer ----
  const SFX = [];
  function sfx(t, name, gain = 1) { SFX.push({ t: +t.toFixed(3), name, gain }); }

  // ---- timing lookups ----
  const TM = window.TIMING;
  const cue = (id) => {
    const c = TM.cues.find((c) => c.id === id);
    if (!c) throw new Error('no cue ' + id);
    return c;
  };
  const seg = (id, k = 0) => cue(id).subs[k].t0;          // start of k-th subtitle segment (voiced)
  const segEnd = (id, k = 0) => cue(id).subs[k].t1;
  const vs = (id) => cue(id).voiceStart;
  const ve = (id) => cue(id).voiceEnd;

  window.H = { el, svgEl, overlay, discrete, applyDiscrete, SFX, sfx, cue, seg, segEnd, vs, ve, TM, world };
})();
