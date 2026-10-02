/* Intro + chapter 01: the surface (code, UI, LayoutNode tree). Approved sample, ported to layers. */
H.scene('intro', (L) => {
  const { tl, C, el, svgEl, overlay, discrete, sfx, seg, segEnd, vs, ve, IR, makePhone, makeFinger, setChapter, DP, LINE } = H;

  const P = makePhone(L);
  const phone = P.el;
  const R = P.R;
  const PH = { A: [710, 150], B: [1290, 150], C: [110, 150] };
  const pw = (base, x, y) => [PH[base][0] + 14 + x, PH[base][1] + 62 + y];
  const outline = P.outline;
  const finger = makeFinger(L);

  const ov = overlay(L);
  function callout(t, x, y, key, text, color, from, to) {
    const c = el('div', 'callout', L);
    c.style.setProperty('--c', color);
    c.style.left = x + 'px'; c.style.top = y + 'px';
    c.innerHTML = `<span class="k">${key}</span><span class="v">${text}</span>`;
    const line = svgEl('path', { d: `M${from[0]},${from[1]} L${to[0]},${to[1]}`, stroke: color, 'stroke-width': 3, fill: 'none', 'stroke-dasharray': 1000, 'stroke-dashoffset': 1000 }, ov);
    const dot = svgEl('circle', { cx: to[0], cy: to[1], r: 7, fill: color, opacity: 0 }, ov);
    tl.to(line, { attr: { 'stroke-dashoffset': 0 }, duration: 0.45, ease: 'power2.out' }, t);
    tl.to(dot, { opacity: 1, duration: 0.15 }, t + 0.35);
    tl.fromTo(c, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', ...IR }, t + 0.15);
    sfx(t, 'tick', 0.6);
    return [c, line, dot];
  }

  // ================= SCENE A: intro =================
  P.setEven(0);
  tl.fromTo(phone, { x: PH.A[0], y: PH.A[1] + 60, opacity: 0, scale: 0.96 },
    { x: PH.A[0], y: PH.A[1], opacity: 1, scale: 1, duration: 1.0, ease: 'power3.out' }, 0.25);
  sfx(0.3, 'whoosh', 0.5);

  const tapA = vs('c02') + 1.25;
  const btnA = pw('A', 32 + 200, 208 + LINE + 16 + 48);
  finger.tap(tapA, btnA[0], btnA[1]);
  P.setOdd(tapA + 0.03);
  sfx(tapA + 0.03, 'pop', 0.8);

  const tA = pw('A', 0, 0);
  const c3a = seg('c03', 1), c3b = c3a + (segEnd('c03', 1) - c3a) * 0.55, c3c = seg('c03', 2);
  const co1 = callout(c3a, 250, tA[1] + 78, '边框', '背景 → <em>蓝色边框</em>', C.a1, [560, tA[1] + 100], [tA[0] + 50, tA[1] + 80]);
  const co2 = callout(c3b, 1290, tA[1] + 150, '外观', '变淡 · 缩小', C.upd, [1280, tA[1] + 172], [tA[0] + 410, tA[1] + 150]);
  const co3 = callout(c3c, 250, tA[1] + 228, '分支', '一行 → <em>两行</em>', C.a2, [560, tA[1] + 250], [tA[0] + 26, tA[1] + 240]);
  const coAll = [...co1, ...co2, ...co3];

  const t4 = vs('c04');
  tl.to(coAll, { opacity: 0, duration: 0.35 }, t4 - 0.2);
  const ROWY = 520;
  const st1 = el('div', 'station', L); st1.innerHTML = '<div class="ic"><span style="width:44px;height:44px;border-radius:50%;background:#e6edf7;display:block;box-shadow:0 0 0 8px rgba(230,237,247,.18)"></span></div><div class="lb">手指按下</div>';
  const st3 = el('div', 'station', L); st3.innerHTML = '<div class="ic" style="background:none;box-shadow:none"></div><div class="lb">屏幕换上新画面</div>';
  gsap.set(st1, { left: 470, top: ROWY + 20 }); gsap.set(st3, { left: 1450, top: ROWY + 20 });
  const bb = el('div', 'blackbox', L, '?'); gsap.set(bb, { left: 960, top: ROWY });
  const arrL = svgEl('path', { d: `M545,${ROWY} L870,${ROWY}`, stroke: '#475569', 'stroke-width': 4, fill: 'none', 'stroke-dasharray': '14 12', opacity: 0 }, ov);
  const arrR = svgEl('path', { d: `M1050,${ROWY} L1375,${ROWY}`, stroke: '#475569', 'stroke-width': 4, fill: 'none', 'stroke-dasharray': '14 12', opacity: 0 }, ov);
  tl.to(phone, { x: 1450 - 40, y: ROWY - 62, scale: 0.16, duration: 0.9, ease: 'power3.inOut' }, t4);
  tl.fromTo(st1, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', ...IR }, t4 + 0.1);
  tl.to(st3, { opacity: 1, duration: 0.5 }, t4 + 0.6);
  sfx(t4, 'whoosh', 0.6);
  const t4b = seg('c04', 1);
  tl.to([arrL, arrR], { opacity: 1, duration: 0.3 }, t4b - 0.6);
  tl.fromTo([arrL, arrR], { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': -260 }, duration: 6, ease: 'none', ...IR }, t4b - 0.6);
  tl.fromTo(bb, { opacity: 0, scale: 0.4, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)', ...IR }, t4b);
  sfx(t4b, 'pop', 0.7);

  const t5 = seg('c05', 1);
  const pieces = [];
  const NP = 7;
  for (let i = 0; i < NP; i++) {
    const p = el('div', 'piece', L, '?');
    gsap.set(p, { left: 960, top: ROWY });
    pieces.push(p);
    const px = 620 + (i * (1300 - 620)) / (NP - 1);
    tl.fromTo(p, { opacity: 0, x: 0, y: 0, scale: 0.5, rotation: (i - 3) * 14 },
      { opacity: 1, x: px - 960, y: 0, scale: 0.78, rotation: 0, duration: 0.8, ease: 'expo.out', ...IR }, t5 + i * 0.03);
  }
  tl.to(bb, { scale: 1.25, opacity: 0, duration: 0.35, ease: 'power2.in' }, t5 - 0.05);
  tl.to([arrL, arrR], { opacity: 0, duration: 0.3 }, t5);
  sfx(t5 - 0.05, 'burst', 0.8);
  const title = el('div', 'big', L, '<h1>点一下，<em>发生了什么</em></h1><p>Compose 从点击到屏幕刷新的全过程</p>');
  gsap.set(title, { top: 190 });
  tl.fromTo(title, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', ...IR }, vs('c05') + 0.2);
  sfx(vs('c05') + 0.2, 'ding', 0.6);

  // ================= SCENE B: code + UI =================
  const t6 = vs('c06') - 0.35;
  tl.to([title, st1, st3, ...pieces], { opacity: 0, duration: 0.45, ease: 'power2.in' }, t6);
  tl.to(phone, { opacity: 0, duration: 0.3 }, t6);
  P.setEven(t6 + 0.35);
  setChapter(t6 + 0.4, '01', '表象：代码与界面');
  tl.fromTo('#chapter', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ...IR }, t6 + 0.4);
  tl.fromTo(phone, { x: PH.B[0] + 80, y: PH.B[1], scale: 1, opacity: 0 }, { x: PH.B[0], opacity: 1, duration: 0.8, ease: 'power3.out', ...IR }, t6 + 0.5);
  const plB = el('div', 'plabel', L, '点击前 · <span style="font-family:var(--mono);color:var(--keep)">n = 0</span>');
  gsap.set(plB, { left: PH.B[0] + 250, top: 96 });
  tl.to(plB, { opacity: 1, duration: 0.4 }, t6 + 0.9);
  sfx(t6 + 0.3, 'whoosh', 0.6);

  const CODE = [
    '<span class="an">@Composable</span>',
    '<span class="kw">fun</span> <span class="fn">Counter</span>() {',
    '    <span class="kw">val</span> count = <span class="fn">remember</span> { <span class="fn">mutableIntStateOf</span>(<span class="nu">0</span>) }',
    '    <span class="kw">val</span> n = count.<span class="pr">intValue</span>',
    '    <span class="kw">val</span> even = n % <span class="nu">2</span> == <span class="nu">0</span>',
    '    <span class="kw">val</span> increment = <span class="fn">remember</span>(count) { { count.<span class="pr">intValue</span> += <span class="nu">1</span> } }',
    '',
    '    <span class="fn">Column</span>(Modifier.<span class="fn">padding</span>(<span class="nu">16</span>.dp)) {',
    '        <span class="fn">CounterTile</span>(label = <span class="st">"$prefix $n"</span>, <span class="fold">⋯</span>)',
    '',
    '        <span class="kw">if</span> (even) {',
    '            <span class="fn">BasicText</span>(<span class="st">"Even branch"</span>)',
    '        } <span class="kw">else</span> {',
    '            <span class="fn">Column</span> {',
    '                <span class="fn">BasicText</span>(<span class="st">"Odd branch"</span>)',
    '                <span class="fn">BasicText</span>(<span class="st">"Extra line"</span>)',
    '            }',
    '        }',
    '        <span class="fn">IncrementControl</span>(onClick = increment)',
    '    }',
    '}',
  ];
  const code = el('div', 'code', L);
  gsap.set(code, { x: 100, y: 150 });
  el('div', 'bar', code, '<i></i><i></i><i></i><span>Counter.kt · 部分代码已折叠</span>');
  const hl = (from, to, color) => {
    const h = el('div', 'hl', code);
    h.style.setProperty('--c', color);
    h.style.top = 56 + from * 31 + 'px'; h.style.height = (to - from + 1) * 31 + 'px';
    return h;
  };
  CODE.forEach((l, i) => { const d = el('div', 'ln', code, l); d.dataset.n = i + 1; });
  const lines = [...code.querySelectorAll('.ln')];
  tl.fromTo(code, { opacity: 0, x: 40 }, { opacity: 1, x: 100, duration: 0.7, ease: 'power3.out', ...IR }, t6 + 0.45);
  tl.fromTo(lines, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.035, ease: 'power2.out', ...IR }, t6 + 0.6);

  const hCount = hl(2, 2, C.keep);
  const hCol = hl(7, 19, C.col);
  const olC = outline(R.C, C.col, 'Column');
  tl.to(hCount, { opacity: 1, duration: 0.3 }, seg('c07', 0) + 0.3);
  const cntPop = el('div', 'chip', L, 'count');
  cntPop.style.setProperty('--c', C.keep);
  gsap.set(cntPop, { left: 760, top: 140 + 56 + 2 * 31 - 6, fontSize: '20px', padding: '4px 12px' });
  tl.fromTo(cntPop, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.35, ease: 'back.out(2)', ...IR }, seg('c07', 0) + 1.6);
  sfx(seg('c07', 0) + 1.6, 'tick', 0.5);
  const t7b = seg('c07', 1);
  tl.to([hCount, cntPop], { opacity: 0, duration: 0.3 }, t7b);
  tl.to(hCol, { opacity: 0.8, duration: 0.3 }, t7b);
  tl.to(olC, { opacity: 1, duration: 0.3 }, t7b + 0.1);
  sfx(t7b, 'tick', 0.5);

  const t8a = seg('c08', 1), t8b = t8a + (segEnd('c08', 1) - t8a) * 0.5, t8c = seg('c08', 2);
  const hTile = hl(8, 8, C.a1), hBr = hl(10, 17, C.a2), hBtn = hl(18, 18, C.a3);
  const olP = outline(R.P, C.a1, '卡片'), olE = outline(R.E, C.a2, '分支'), olI = outline(R.I, C.a3, '按钮');
  tl.to(hCol, { opacity: 0.25, duration: 0.3 }, seg('c08', 0) + 0.2);
  [[hTile, olP, t8a], [hBr, olE, t8b], [hBtn, olI, t8c]].forEach(([h, o, t]) => {
    tl.to(h, { opacity: 1, duration: 0.25 }, t);
    tl.fromTo(o, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', ...IR }, t);
    sfx(t, 'tick', 0.7);
  });
  tl.to(olC, { opacity: 0.35, duration: 0.3 }, t8a);

  // ================= SCENE C: LayoutNode tree =================
  const t9 = vs('c09') - 0.3;
  tl.to([code, hCol, hTile, hBr, hBtn], { opacity: 0, x: '-=60', duration: 0.6, ease: 'power2.in' }, t9);
  tl.to(plB, { opacity: 0, duration: 0.3 }, t9);
  tl.to([olC, olP, olE, olI], { opacity: 0, duration: 0.3 }, t9);
  tl.to(phone, { x: PH.C[0], duration: 1.1, ease: 'power3.inOut' }, t9 + 0.15);
  sfx(t9 + 0.1, 'whoosh', 0.7);

  const NODES = {
    C: { ty: 'Column', de: '外层布局', pos: [1110, 260], col: C.col },
    P: { ty: 'Layout', de: 'CounterTile', pos: [700, 460], col: C.a1 },
    T: { ty: 'BasicText', de: '"Even 0"', pos: [700, 660], col: C.a1 },
    E: { ty: 'BasicText', de: '"Even branch"', pos: [1110, 460], col: C.a2 },
    I: { ty: 'Box', de: 'IncrementControl', pos: [1540, 460], col: C.a3 },
    IT: { ty: 'BasicText', de: '"+1"', pos: [1540, 660], col: C.a3 },
    O: { ty: 'Column', de: '奇数分支', pos: [1110, 460], col: C.a2 },
    O1: { ty: 'BasicText', de: '"Odd branch"', pos: [980, 660], col: C.a2 },
    O2: { ty: 'BasicText', de: '"Extra line"', pos: [1240, 660], col: C.a2 },
  };
  const NW = 240, NH = 100;
  for (const k in NODES) {
    const n = NODES[k];
    const e = el('div', 'node', L);
    e.style.setProperty('--c', n.col);
    gsap.set(e, { left: n.pos[0], top: n.pos[1] });
    e.innerHTML = `<div class="ty">${n.ty}</div><div class="de"><span>${n.de}</span></div><div class="badge"></div><div class="glow"></div>`;
    const label = n.de;
    n.el = e; n.de = e.querySelector('.de span'); n.badge = e.querySelector('.badge'); n.glow = e.querySelector('.glow');
    n.deTrack = discrete(n.de, label, (v) => { n.de.textContent = v; });
  }

  const order = ['C', 'P', 'T', 'E', 'I', 'IT'];
  const ols = {};
  const t9b = seg('c09', 1), t9c = segEnd('c09', 1) - 1.0;
  order.forEach((k, i) => {
    const o = outline(R[k], NODES[k].col);
    ols[k] = o;
    tl.fromTo(o, { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', ...IR }, t9b + i * 0.16);
    sfx(t9b + i * 0.16, 'tick', 0.35);
  });
  order.forEach((k, i) => {
    const n = NODES[k], r = R[k];
    const [sx, sy] = pw('C', r[0] + r[2] / 2, r[1] + r[3] / 2);
    const t = t9c + i * 0.14;
    tl.fromTo(n.el, { x: sx - n.pos[0] - NW * 0.2, y: sy - n.pos[1] - NH * 0.2, scale: 0.4, opacity: 0 },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.85, ease: 'expo.out', ...IR }, t);
    sfx(t, 'pop', 0.35);
  });
  const lnChip = el('div', 'chip', L, 'LayoutNode');
  lnChip.style.setProperty('--c', C.keep);
  gsap.set(lnChip, { left: 700, top: 150 });
  tl.fromTo(lnChip, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(2)', ...IR }, seg('c09', 2));
  sfx(seg('c09', 2), 'tick', 0.6);

  const tov = overlay(L);
  const edgeOf = (a, b) => {
    const A = NODES[a].pos, B = NODES[b].pos;
    const x1 = A[0] + NW / 2, y1 = A[1] + NH, x2 = B[0] + NW / 2, y2 = B[1];
    return svgEl('path', { d: `M${x1},${y1} C${x1},${y1 + 55} ${x2},${y2 - 55} ${x2},${y2}`, stroke: '#4b5a75', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': 600, 'stroke-dashoffset': 600 }, tov);
  };
  const E = { CP: edgeOf('C', 'P'), CE: edgeOf('C', 'E'), CI: edgeOf('C', 'I'), PT: edgeOf('P', 'T'), IIT: edgeOf('I', 'IT'),
              CO: edgeOf('C', 'O'), OO1: edgeOf('O', 'O1'), OO2: edgeOf('O', 'O2') };
  const host = el('div', 'chip', L, 'Host（宿主）');
  Object.assign(host.style, { background: 'transparent', color: '#64748b', border: '2px dashed #3a4458', fontSize: '18px', padding: '4px 14px' });
  const hx = NODES.C.pos[0] + NW / 2;
  gsap.set(host, { left: hx, top: 180, xPercent: -50 });
  const hostEdge = svgEl('path', { d: `M${hx},218 L${hx},258`, stroke: '#3a4458', 'stroke-width': 3, 'stroke-dasharray': '6 6', fill: 'none', opacity: 0 }, tov);
  const t10 = vs('c10');
  [['CP', 0], ['CE', 0.08], ['CI', 0.16], ['PT', 0.45], ['IIT', 0.53]].forEach(([k, d]) =>
    tl.to(E[k], { attr: { 'stroke-dashoffset': 0 }, duration: 0.55, ease: 'power2.inOut' }, t10 + 0.2 + d));
  tl.to(order.map((k) => ols[k]), { opacity: 0, duration: 0.4 }, t10 + 0.3);
  tl.to([host, hostEdge], { opacity: 1, duration: 0.4 }, t10 + 0.9);
  sfx(t10 + 0.2, 'swoosh', 0.4);
  discrete(lnChip, 'LayoutNode', (v) => { lnChip.textContent = v; }).at(seg('c10', 1), 'LayoutNode 树 = UI 树');
  tl.fromTo(lnChip, { scale: 1 }, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1, ...IR }, seg('c10', 1));

  // ================= SCENE D: click again, watch the tree =================
  const t11 = ve('c11') - 0.25;
  const btnC = pw('C', 32 + 200, 208 + LINE + 16 + 48);
  finger.tap(t11, btnC[0], btnC[1]);
  P.setOdd(t11 + 0.03);
  sfx(t11 + 0.03, 'pop', 0.8);
  order.forEach((k) => tl.fromTo(NODES[k].glow, { opacity: 0.9, '--gc': C.upd }, { opacity: 0, duration: 0.6, ...IR }, t11 + 0.05));

  const slow = el('div', 'chip', L, '逐步拆解');
  Object.assign(slow.style, { background: 'transparent', color: C.upd, border: `2px solid ${C.upd}`, fontSize: '20px', padding: '4px 14px' });
  gsap.set(slow, { left: 1640, top: 150 });
  tl.fromTo(slow, { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, vs('c12') - 0.2);

  const badge = (n, t, text, color) => {
    tl.set(n.badge, { '--bc': color }, t);
    discrete(n.badge, '', (v) => { n.badge.textContent = v; }).at(t, text);
    tl.fromTo(n.badge, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)', ...IR }, t);
  };
  const glow = (n, t, color, hold = 1.2) => {
    tl.set(n.glow, { '--gc': color }, t);
    tl.fromTo(n.glow, { opacity: 0 }, { opacity: 1, duration: 0.2, ...IR }, t);
    if (hold != null) tl.to(n.glow, { opacity: 0, duration: 0.4 }, t + hold);
  };

  const t12a = seg('c12', 0) + 0.2;
  glow(NODES.E, t12a, C.gone, null);
  badge(NODES.E, t12a, '移除', C.gone);
  sfx(t12a, 'tick', 0.6);
  const t12a2 = segEnd('c12', 0) - 0.35;
  tl.to(NODES.E.el, { y: 70, opacity: 0, rotation: 6, duration: 0.6, ease: 'power2.in' }, t12a2);
  tl.to(E.CE, { opacity: 0, duration: 0.4 }, t12a2);
  sfx(t12a2 + 0.2, 'remove', 0.7);
  const t12b = seg('c12', 1) + 0.15;
  tl.fromTo(NODES.O.el, { opacity: 0, scale: 0.6, x: NW * 0.2, y: NH * 0.2 }, { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.55, ease: 'back.out(2)', ...IR }, t12b);
  tl.to(E.CO, { attr: { 'stroke-dashoffset': 0 }, duration: 0.5 }, t12b);
  glow(NODES.O, t12b, C.nw, 2.6);
  badge(NODES.O, t12b + 0.1, '新建', C.nw);
  sfx(t12b, 'pop', 0.8);
  const t12c = seg('c12', 2) + 0.1;
  const olO1 = outline(R.O1, C.nw), olO2 = outline(R.O2, C.nw);
  ['O1', 'O2'].forEach((k, i) => {
    const t = t12c + i * 0.25;
    tl.fromTo(NODES[k].el, { opacity: 0, scale: 0.6, x: NW * 0.2, y: NH * 0.2 }, { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.55, ease: 'back.out(2)', ...IR }, t);
    tl.to(E['O' + k], { attr: { 'stroke-dashoffset': 0 }, duration: 0.5 }, t);
    glow(NODES[k], t, C.nw, 1.8);
    badge(NODES[k], t + 0.1, '新建', C.nw);
    tl.fromTo([olO1, olO2][i], { opacity: 0 }, { opacity: 1, duration: 0.25, ...IR }, t);
    sfx(t, 'pop', 0.6);
  });
  tl.to([olO1, olO2], { opacity: 0, duration: 0.4 }, t12c + 2.0);

  const t13a = seg('c13', 0) + 0.1;
  const olP2 = outline(R.P, C.keep);
  glow(NODES.P, t13a, C.keep, 3.0); glow(NODES.T, t13a + 0.15, C.keep, 3.0);
  badge(NODES.P, t13a, '同一个节点', C.keep); badge(NODES.T, t13a + 0.15, '同一个节点', C.keep);
  tl.fromTo(olP2, { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, t13a);
  tl.to(olP2, { opacity: 0, duration: 0.4 }, t13a + 3.2);
  sfx(t13a, 'ding', 0.4);
  const t13b = seg('c13', 1) + (segEnd('c13', 1) - seg('c13', 1)) * 0.55;
  tl.to(NODES.T.de, { y: -18, opacity: 0, duration: 0.18, ease: 'power2.in' }, t13b);
  NODES.T.deTrack.at(t13b + 0.18, '"Odd 1"');
  tl.fromTo(NODES.T.de, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out', ...IR }, t13b + 0.18);
  tl.set(NODES.T.de, { color: C.upd }, t13b + 0.18);
  sfx(t13b, 'tick', 0.7);
  badge(NODES.I, t13b + 0.3, '保留', '#64748b'); badge(NODES.IT, t13b + 0.4, '保留', '#64748b');

  const t14 = vs('c14');
  const legend = el('div', '', L);
  Object.assign(legend.style, { position: 'absolute', left: '700px', top: '820px', display: 'flex', gap: '18px', opacity: 0 });
  [['保留', C.keep], ['新建', C.nw], ['移除', C.gone]].forEach(([t, c]) => {
    const s = el('div', '', legend, `<i style="display:inline-block;width:16px;height:16px;border-radius:5px;background:${c};margin-right:10px;vertical-align:-1px"></i>${t}`);
    Object.assign(s.style, { fontSize: '24px', color: '#cbd5e1', padding: '8px 18px', borderRadius: '12px', background: 'rgba(20,27,40,.9)', boxShadow: 'inset 0 0 0 1.5px #273246' });
  });
  tl.fromTo(legend, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ...IR }, t14 + 0.2);
  const q = el('div', 'qmark', L, '?');
  gsap.set(q, { left: 1640, top: 840 });
  tl.fromTo(q, { opacity: 0, scale: 0.4, rotation: -20 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.5)', ...IR }, seg('c14', 1));
  sfx(seg('c14', 1), 'pop', 0.6);

  const t15 = vs('c15');
  const treeEls = [...['C', 'P', 'T', 'O', 'O1', 'O2', 'I', 'IT'].map((k) => NODES[k].el),
    E.CP, E.CI, E.PT, E.IIT, E.CO, E.OO1, E.OO2, host, hostEdge, legend, q, slow, lnChip];
  tl.to(treeEls, { opacity: 0.12, duration: 0.6 }, t15 + 0.2);
  const cnt = el('div', 'chip', L, 'count');
  cnt.style.setProperty('--c', C.keep);
  Object.assign(cnt.style, { fontSize: '40px', padding: '14px 30px' });
  gsap.set(cnt, { left: 1380, top: 470 });
  const btnOdd = pw('C', 32 + 400, 208 + 2 * LINE + 16 + 48);
  const pth = svgEl('path', { d: `M${btnOdd[0] + 10},${btnOdd[1]} C900,${btnOdd[1] + 40} 1100,520 1370,510`, stroke: C.upd, 'stroke-width': 4, fill: 'none', 'stroke-dasharray': '12 12', opacity: 0 }, tov);
  const pq = el('div', 'qmark', L, '?');
  Object.assign(pq.style, { fontSize: '72px' });
  gsap.set(pq, { left: 1000, top: 470 });
  const t15b = seg('c15', 1);
  tl.fromTo(cnt, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', ...IR }, t15b - 0.2);
  tl.to(pth, { opacity: 1, duration: 0.4 }, t15b);
  tl.fromTo(pth, { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': -200 }, duration: 6, ease: 'none', ...IR }, t15b);
  tl.fromTo(pq, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', ...IR }, t15b + 0.5);
  sfx(t15b - 0.2, 'pop', 0.6);

  const tEnd = ve('c15') + 0.5;
  tl.to(L.children, { opacity: 0, duration: 0.5 }, tEnd);
});
