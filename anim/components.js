/* Shared toolkit for every scene: one master timeline, element factories,
   discrete (text) tracks that survive seeking, sound cues and narration timing lookups. */
(function () {
  const world = document.getElementById('world');
  const NS = 'http://www.w3.org/2000/svg';
  const TM = window.TIMING;
  const tl = gsap.timeline({ paused: true });
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const C = {
    keep: css('--keep'), nw: css('--new'), gone: css('--gone'), upd: css('--upd'),
    a1: css('--a1'), a2: css('--a2'), a3: css('--a3'), col: '#94a3b8', ink: '#e6edf7', ink2: '#9aa7bd', dim: '#475569', line: '#4b5a75',
  };

  // ---------- DOM ----------
  function el(tag, cls, parent = world, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  }
  function pos(e, x, y, w, h) {
    if (x != null) e.style.left = x + 'px';
    if (y != null) e.style.top = y + 'px';
    if (w != null) e.style.width = w + 'px';
    if (h != null) e.style.height = h + 'px';
    return e;
  }
  const div = (parent, cls, x, y, html, w, h) => pos(el('div', cls, parent, html), x, y, w, h);
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }
  function overlay(parent = world) {
    const s = svgEl('svg', { class: 'overlay' }, parent);
    s.defsEl = svgEl('defs', {}, s);
    s.markers = {};
    return s;
  }
  function marker(svg, color) {
    if (svg.markers[color]) return svg.markers[color];
    const id = 'm' + Math.random().toString(36).slice(2, 8);
    const m = svgEl('marker', { id, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, svg.defsEl);
    svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, m);
    return (svg.markers[color] = `url(#${id})`);
  }

  // ---------- discrete tracks: values that jump (text/html) and must survive seeking ----------
  const tracks = [];
  const trackMap = new Map();
  function discrete(target, initial, apply) {
    let tr = trackMap.get(target);
    if (!tr) {
      tr = { kf: [[-Infinity, initial !== undefined ? initial : target.innerHTML]], apply: apply || ((v) => { target.innerHTML = v; }), last: undefined };
      tracks.push(tr);
      trackMap.set(target, tr);
    }
    return { at(t, v) { tr.kf.push([t, v]); tr.kf.sort((a, b) => a[0] - b[0]); return this; } };
  }
  function applyDiscrete(t) {
    for (const tr of tracks) {
      let v = tr.kf[0][1];
      for (const [kt, kv] of tr.kf) if (kt <= t) v = kv; else break;
      if (v !== tr.last) { tr.apply(v); tr.last = v; }
    }
  }

  // ---------- sound cues (read by the mixer) ----------
  const SFX = [];
  const sfx = (t, name, gain = 1) => SFX.push({ t: +t.toFixed(3), name, gain });

  // ---------- timing lookups ----------
  const cue = (id) => {
    const c = TM.cues.find((c) => c.id === id);
    if (!c) throw new Error('no cue ' + id);
    return c;
  };
  const seg = (id, k = 0) => cue(id).subs[k].t0;
  const segEnd = (id, k = 0) => cue(id).subs[k].t1;
  const vs = (id) => cue(id).voiceStart;
  const ve = (id) => cue(id).voiceEnd;
  /** Estimated time the n-th occurrence of `str` is spoken inside cue `id`. */
  function kw(id, str, n = 0) {
    const c = cue(id);
    let idx = -1;
    for (let i = 0; i <= n; i++) {
      idx = c.text.indexOf(str, idx + 1);
      if (idx < 0) throw new Error(`kw: "${str}" not in ${id}`);
    }
    const s = c.subs.find((s) => idx >= s.c0 && idx < s.c1) || c.subs[c.subs.length - 1];
    const dur = Math.max(0.2, s.t1 - s.t0 - 0.2);
    return s.t0 + ((idx - s.c0) / Math.max(1, s.c1 - s.c0)) * dur;
  }
  const chap = (id) => TM.chapters.find((c) => c.id === id);

  // ---------- animation shorthands ----------
  const IR = { immediateRender: false };
  function show(t, e, o = {}) {
    const from = { opacity: 0, y: o.dy ?? 14, x: o.dx ?? 0 }, to = { opacity: o.op ?? 1, y: 0, x: 0 };
    if (o.s != null) { from.scale = o.s; to.scale = 1; } // leave scale alone otherwise (placed phones are scaled)
    tl.fromTo(e, from, { ...to, duration: o.d ?? 0.45, ease: o.ease ?? 'power3.out', stagger: o.st ?? 0, ...IR }, t);
    if (o.sfx) sfx(t, o.sfx, o.g ?? 0.5);
  }
  function pop(t, e, o = {}) {
    tl.fromTo(e, { opacity: 0, scale: o.s ?? 0.5 },
      { opacity: o.op ?? 1, scale: 1, duration: o.d ?? 0.45, ease: o.ease ?? 'back.out(2.2)', stagger: o.st ?? 0, ...IR }, t);
    if (o.sfx !== false) sfx(t, o.sfx || 'pop', o.g ?? 0.45);
  }
  const hide = (t, e, d = 0.35) => tl.to(e, { opacity: 0, duration: d, ease: 'power1.in' }, t);
  const fade = (t, e, op, d = 0.4) => tl.to(e, { opacity: op, duration: d }, t);
  const move = (t, e, props, d = 0.7, ease = 'power3.inOut') => tl.to(e, { ...props, duration: d, ease }, t);
  /** Replace inner html with a quick vertical flip. */
  function swap(t, e, html, o = {}) {
    const tr = discrete(e);
    tl.to(e, { opacity: 0, y: -12, duration: 0.14, ease: 'power2.in' }, t);
    tr.at(t + 0.14, html);
    tl.fromTo(e, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', ...IR }, t + 0.14);
    if (o.color) tl.set(e, { color: o.color }, t + 0.14);
    if (o.sfx !== false) sfx(t, 'tick', 0.5);
  }
  const setHtml = (t, e, html) => discrete(e).at(t, html);

  // ---------- svg paths ----------
  function path(svg, d, color = C.line, o = {}) {
    const p = svgEl('path', { d, stroke: color, 'stroke-width': o.w ?? 3, fill: 'none', 'stroke-linecap': 'round' }, svg);
    if (o.arrow) p.setAttribute('marker-end', marker(svg, color));
    p.len = p.getTotalLength();
    p.fadeOnly = !!o.dash || o.draw === false;
    if (o.dash) p.setAttribute('stroke-dasharray', o.dash);
    if (p.fadeOnly) p.setAttribute('opacity', 0);
    else { p.setAttribute('stroke-dasharray', p.len + ' ' + (p.len + 40)); p.setAttribute('stroke-dashoffset', p.len + 1); }
    p.targetOp = o.op ?? 1;
    p.setAttribute('opacity', 0); // hidden (incl. arrow head) until drawIn
    return p;
  }
  function drawIn(t, p, d = 0.5, ease = 'power2.inOut') {
    if (p.fadeOnly) tl.fromTo(p, { opacity: 0 }, { opacity: p.targetOp, duration: 0.3, ...IR }, t);
    else {
      tl.set(p, { opacity: p.targetOp }, t);
      tl.fromTo(p, { attr: { 'stroke-dashoffset': p.len + 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: d, ease, ...IR }, t);
    }
  }
  /** Marching-ants motion on a dashed path between t and t+d. */
  function march(t, p, d = 4, speed = 60) {
    tl.fromTo(p, { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': -speed * d }, duration: d, ease: 'none', ...IR }, t);
  }
  /** A glowing dot that runs along a path between t and t+d. */
  function travel(t, p, d = 0.8, color = C.upd, o = {}) {
    const svg = p.ownerSVGElement;
    const c = svgEl('circle', { r: o.r ?? 9, fill: color, opacity: 0, style: `filter: drop-shadow(0 0 8px ${color})` }, svg);
    const L = p.len || p.getTotalLength();
    const st = { v: 0 };
    const place = () => { const q = p.getPointAtLength((o.rev ? 1 - st.v : st.v) * L); c.setAttribute('cx', q.x); c.setAttribute('cy', q.y); };
    tl.fromTo(st, { v: 0 }, { v: 1, duration: d, ease: o.ease ?? 'power1.inOut', ...IR, onUpdate: place }, t);
    tl.set(c, { opacity: 1 }, t);
    tl.set(c, { opacity: 0 }, t + d + (o.hold ?? 0));
    if (o.sfx) sfx(t, o.sfx, o.g ?? 0.4);
    return c;
  }
  const edgeD = (x1, y1, x2, y2) => { const m = (y2 - y1) * 0.5; return `M${x1},${y1} C${x1},${y1 + m} ${x2},${y2 - m} ${x2},${y2}`; };
  const edgeH = (x1, y1, x2, y2) => { const m = (x2 - x1) * 0.5; return `M${x1},${y1} C${x1 + m},${y1} ${x2 - m},${y2} ${x2},${y2}`; };

  // ---------- Kotlin highlighting ----------
  function hlKotlin(src) {
    const esc = src.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return esc
      .replace(/("[^"]*")|(@\w+)|(\/\/.*$)|\b(fun|val|var|if|else|return|object|class|override|private|internal|true|false|null)\b|\b(\d+(?:\.\d+)?f?)\b|(\$?\b[A-Za-z_]\w*)(?=\s*[({])/g,
        (m, s, a, cm, k, n, f) => s ? `<span class="st">${s}</span>` : a ? `<span class="an">${a}</span>` : cm ? `<span class="cm">${cm}</span>`
          : k ? `<span class="kw">${k}</span>` : n ? `<span class="nu">${n}</span>` : `<span class="fn">${f}</span>`)
      .replace(/…/g, '<span class="fold">⋯</span>');
  }
  /** Code panel. hl(from,to,color) uses 1-based line numbers. */
  function codeBox(parent, src, o = {}) {
    const fs = o.fs || 22, lh = o.lh || Math.round(fs * 1.42), pt = o.bar === false ? 22 : 56;
    const box = div(parent, 'code' + (o.ln === false ? ' noln' : ''), o.x, o.y, '', o.w);
    box.style.font = `${fs}px/${lh}px var(--mono)`;
    box.style.paddingTop = pt + 'px';
    box.style.paddingBottom = (o.pb ?? 22) + 'px';
    if (o.bar !== false) el('div', 'bar', box, `<i></i><i></i><i></i><span>${o.title || ''}</span>`);
    const lines = src.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n').map((l, i) => {
      const d = el('div', 'ln', box, hlKotlin(l));
      d.style.height = lh + 'px';
      d.dataset.n = (o.n0 || 1) + i;
      return d;
    });
    return {
      el: box, lines, lh, pt,
      hl(from, to = from, color = C.keep) {
        const h = el('div', 'hl', box);
        h.style.setProperty('--c', color);
        h.style.top = pt + (from - 1) * lh + 'px';
        h.style.height = (to - from + 1) * lh + 'px';
        return h;
      },
      y: (n) => o.y + pt + (n - 0.5) * lh,
      top: (n) => o.y + pt + (n - 1) * lh,
    };
  }

  // ---------- blocks, chips, nodes ----------
  /** Rounded block with colored inset border. Coordinates are its top-left corner. */
  function blk(parent, html, x, y, color = C.col, o = {}) {
    const e = div(parent, 'blk ' + (o.cls || ''), x, y, html, o.w, o.h);
    e.style.setProperty('--c', color);
    if (o.fs) e.style.fontSize = o.fs + 'px';
    const w = o.w ?? e.offsetWidth, h = o.h ?? e.offsetHeight;
    return Object.assign(e, { bx: x, by: y, bw: w, bh: h,
      cx: x + w / 2, cy: y + h / 2, L: [x, y + h / 2], R: [x + w, y + h / 2], T: [x + w / 2, y], B: [x + w / 2, y + h] });
  }
  function chip(parent, html, color, x, y, o = {}) {
    const e = div(parent, 'chip ' + (o.cls || ''), x, y, html);
    e.style.setProperty('--c', color);
    if (o.fs) e.style.fontSize = o.fs + 'px';
    if (o.center) gsap.set(e, { xPercent: -50, yPercent: -50 });
    return e;
  }
  /** Outlined small label. */
  function tag(parent, html, color, x, y, o = {}) {
    const e = div(parent, 'tag', x, y, html);
    e.style.setProperty('--c', color);
    if (o.fs) e.style.fontSize = o.fs + 'px';
    if (o.center) gsap.set(e, { xPercent: -50, yPercent: -50 });
    return e;
  }
  function nodeCard(parent, o) {
    const e = div(parent, 'node' + (o.sm ? ' sm' : ''), o.x, o.y,
      `<div class="ty">${o.ty}</div><div class="de"><span>${o.de || ''}</span></div><div class="badge"></div><div class="glow"></div>`);
    e.style.setProperty('--c', o.col);
    const w = o.sm ? 200 : 240, h = o.sm ? 80 : 100;
    return { el: e, x: o.x, y: o.y, w, h, de: e.querySelector('.de span'), badgeEl: e.querySelector('.badge'), glowEl: e.querySelector('.glow'),
      T: [o.x + w / 2, o.y], B: [o.x + w / 2, o.y + h], L: [o.x, o.y + h / 2], R: [o.x + w, o.y + h / 2], cx: o.x + w / 2, cy: o.y + h / 2 };
  }
  function badge(t, n, text, color, o = {}) {
    const b = n.badgeEl;
    tl.set(b, { '--bc': color }, t);
    discrete(b, '').at(t, text);
    tl.fromTo(b, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)', ...IR }, t);
    if (o.sfx !== false) sfx(t, 'tick', 0.45);
  }
  function glow(t, n, color, hold = 1.2) {
    const g = n.glowEl || n;
    tl.set(g, { '--gc': color }, t);
    tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.2, ...IR }, t);
    if (hold != null) tl.to(g, { opacity: 0, duration: 0.4 }, t + hold);
  }
  /** Logical SlotTable view: rows of [group label][slot cells...], indented by depth. */
  function logicTable(parent, x, y, rows, o = {}) {
    const RH = o.rh || 50;
    const map = {};
    rows.forEach((r, i) => {
      const e = div(parent, 'lrow', x, y + i * RH, '');
      e.style.setProperty('--c', r.col || C.col);
      const g = el('div', 'g' + (r.node ? ' nd' : ''), e, r.label);
      g.style.marginLeft = (r.depth || 0) * (o.indent || 28) + 'px';
      if (o.gw) g.style.minWidth = o.gw - (r.depth || 0) * (o.indent || 28) + 'px';
      const sl = (r.slots || []).map((s) => el('div', 's', e, s));
      map[r.id] = { el: e, g, sl, i, y: y + i * RH, cy: y + i * RH + (RH - 6) / 2, r };
    });
    map._rh = RH;
    return map;
  }
  /** Big centered statement card. */
  function statement(parent, html, y = 420) {
    const e = div(parent, 'stmt', 0, y, html);
    return e;
  }

  // ---------- phone ----------
  const DP = 2, LINE = 38;
  function makePhone(parent) {
    const phone = el('div', 'phone', parent);
    const screen = el('div', 'screen', phone);
    el('div', 'status', screen, '<span>9:41</span><span>5G<i></i></span>');
    const content = el('div', 'content', screen);
    const box = (cls, x, y, w, h, p = content) => pos(el('div', cls, p), x, y, w || null, h || null);
    const tile = box('tile', 16 * DP, 16 * DP, 200 * DP, 80 * DP);
    tile.style.borderRadius = 8 * DP + 'px';
    const tileBg = el('div', 'tileBg', tile);
    const tileBorder = el('div', 'tileBorder', tile);
    const tileText = box('tileText', 12 * DP, 12 * DP, 0, 0, tile);
    tileText.style.fontSize = 20 * DP + 'px';
    tileText.textContent = 'Even 0';
    const BODY = 16 * DP;
    const mk = (t, y) => { const e = box('txt', 32, y, 0, 0); e.textContent = t; e.style.fontSize = BODY + 'px'; return e; };
    const evenText = mk('Even branch', 208), oddA = mk('Odd branch', 208), oddB = mk('Extra line', 208 + LINE);
    gsap.set([oddA, oddB], { opacity: 0 });
    const btn = box('btn', 32, 208 + LINE + 16, 200 * DP, 48 * DP);
    const btnText = box('txt', 12 * DP, 12 * DP, 0, 0, btn);
    btnText.textContent = '+1';
    btnText.style.fontSize = BODY + 'px';
    const P = { el: phone, content, tile, tileText, tileBorder, evenText, oddA, oddB, btn, base: [0, 0, 1] };
    P.setOdd = (t) => {
      tl.set(tileBg, { opacity: 0 }, t); tl.set(tileBorder, { opacity: 1 }, t);
      tl.set(tile, { scale: 0.9, opacity: 0.65 }, t);
      tl.set(tileText, { left: 20 * DP, top: 20 * DP }, t);
      tl.set(evenText, { opacity: 0 }, t); tl.set([oddA, oddB], { opacity: 1 }, t);
      tl.set(btn, { top: 208 + 2 * LINE + 16 }, t);
      discrete(tileText, 'Even 0', (v) => { tileText.textContent = v; }).at(t, 'Odd 1');
    };
    P.setEven = (t) => {
      tl.set(tileBg, { opacity: 1 }, t); tl.set(tileBorder, { opacity: 0 }, t);
      tl.set(tile, { scale: 1, opacity: 1 }, t);
      tl.set(tileText, { left: 12 * DP, top: 12 * DP }, t);
      tl.set(evenText, { opacity: 1 }, t); tl.set([oddA, oddB], { opacity: 0 }, t);
      tl.set(btn, { top: 208 + LINE + 16 }, t);
      discrete(tileText, 'Even 0', (v) => { tileText.textContent = v; }).at(t, 'Even 0');
    };
    P.R = {
      C: [0, 0, 232 * DP, 208 + LINE + 16 + 96 + 32], P: [32, 32, 400, 160], T: [56, 56, 140, 48],
      E: [32, 208, 186, LINE], I: [32, 208 + LINE + 16, 400, 96], IT: [56, 208 + LINE + 16 + 24, 40, LINE],
      O: [32, 208, 186, 2 * LINE], O1: [32, 208, 180, LINE], O2: [32, 208 + LINE, 160, LINE],
      I2: [32, 208 + 2 * LINE + 16, 400, 96], screen: [6, -42, 460, 736],
    };
    P.outline = (rect, color, label) => {
      const o = box('ol', rect[0] - 5, rect[1] - 5, rect[2] + 10, rect[3] + 10);
      o.style.setProperty('--c', color);
      if (label) el('b', '', o, label);
      return o;
    };
    /** Place at stage (x, y) with scale s (static; used by chapters after the intro). */
    // placement uses left/top so that transform-based entrance animations (show/pop) don't fight it
    P.place = (x, y, s = 1) => { pos(phone, x, y); gsap.set(phone, { scale: s }); P.base = [x, y, s]; return P; };
    /** Stage coordinates of a point in content space for a phone placed with place(). */
    P.pt = (cx, cy) => [P.base[0] + (14 + cx) * P.base[2], P.base[1] + (62 + cy) * P.base[2]];
    P.center = (r) => P.pt(r[0] + r[2] / 2, r[1] + r[3] / 2);
    return P;
  }

  // ---------- finger ----------
  function makeFinger(parent) {
    const f = el('div', 'finger', parent);
    const dot = el('div', 'dot', f), ring = el('div', 'ring', f);
    return {
      el: f,
      tap(t, x, y) {
        tl.fromTo(f, { x: x + 170, y: y + 280, opacity: 0 }, { x, y, opacity: 1, duration: 0.6, ease: 'power3.out', ...IR }, t - 0.7);
        tl.to(dot, { scale: 0.8, duration: 0.07, ease: 'power2.in' }, t - 0.05);
        tl.fromTo(ring, { scale: 0.7, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.55, ease: 'power2.out', ...IR }, t);
        tl.to(dot, { scale: 1, duration: 0.16, ease: 'back.out(3)' }, t + 0.1);
        tl.to(f, { x: x + 110, y: y + 200, opacity: 0, duration: 0.5, ease: 'power2.in' }, t + 0.45);
        sfx(t - 0.02, 'tap');
      },
      down(t, x, y) {
        tl.fromTo(f, { x: x + 170, y: y + 280, opacity: 0 }, { x, y, opacity: 1, duration: 0.6, ease: 'power3.out', ...IR }, t - 0.7);
        tl.to(dot, { scale: 0.8, duration: 0.08, ease: 'power2.in' }, t - 0.05);
        tl.fromTo(ring, { scale: 0.7, opacity: 0.9 }, { scale: 2.2, opacity: 0, duration: 0.6, ease: 'power2.out', ...IR }, t);
        sfx(t - 0.02, 'tap');
      },
      up(t, x, y) {
        tl.to(dot, { scale: 1, duration: 0.16, ease: 'back.out(3)' }, t);
        tl.fromTo(ring, { scale: 1, opacity: 0.7 }, { scale: 1.8, opacity: 0, duration: 0.45, ...IR }, t);
        tl.to(f, { x: x + 110, y: y + 200, opacity: 0, duration: 0.5, ease: 'power2.in' }, t + 0.25);
        sfx(t, 'tick', 0.6);
      },
    };
  }

  // ---------- chapter registry ----------
  const scenes = [];
  const scene = (id, build) => scenes.push({ id, build });
  const chapterTag = { num: null, name: null };
  function setChapter(t, num, name) {
    discrete(document.querySelector('#chapter .num'), '').at(t, num);
    discrete(document.querySelector('#chapter .name'), '').at(t, name);
  }

  window.H = {
    tl, C, TM, world, el, pos, div, svgEl, overlay, marker, discrete, applyDiscrete, SFX, sfx,
    cue, seg, segEnd, vs, ve, kw, chap, IR, show, pop, hide, fade, move, swap, setHtml,
    path, drawIn, march, travel, edgeD, edgeH, hlKotlin, codeBox, blk, chip, tag, nodeCard, badge, glow, statement,
    makePhone, makeFinger, DP, LINE, scenes, scene, setChapter, chapterTag, logicTable,
  };
})();
