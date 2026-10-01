/* 06 SlotTable：一张扁平的表 —— groups IntArray 五字段、slots、先序 + size、node count、gap */
H.scene('ch06', (L, { t0, t1, body }) => {
  const { tl, C, div, el, overlay, sfx, vs, ve, kw, show, pop, hide, fade, move, swap, path, drawIn, travel, blk, tag, IR } = H;
  const ov = overlay(L);

  // reduced teaching model, n = 0 (from ref §33.1)
  const G = [
    ['Counter', 'K_COUNTER', '0x00000001', '-1', 9, 0, C.a2],
    ['C node', '125', '0x40000003', '0', 8, 4, C.col],
    ['Reuse', '207', '0x10000001', '1', 3, 9, C.a1],
    ['P node', '125', '0x40000001', '2', 2, 11, C.a1],
    ['T node', '125', '0x40000000', '3', 1, 16, C.a1],
    ['Even', 'K_EVEN', '0x00000001', '1', 2, 21, C.a2],
    ['E node', '125', '0x40000000', '5', 1, 21, C.a2],
    ['I node', '125', '0x40000001', '1', 2, 26, C.a3],
    ['IT node', '125', '0x40000000', '7', 1, 31, C.a3],
  ];
  // ---- t01: tree vs flat arrays ----
  const treeT = tag(L, '逻辑上：一棵树', C.ink2, 140, 170, { fs: 24 });
  show(body, treeT);
  const mini = G.map((g, i) => {
    const depth = [0, 1, 2, 3, 4, 2, 3, 2, 3][i];
    const e = div(L, 'mini', 160 + depth * 34, 220 + i * 46, g[0]);
    e.style.setProperty('--c', g[6]);
    return e;
  });
  show(body + 0.2, mini, { st: 0.05, dx: -14, dy: 0, d: 0.3 });
  const flatT = tag(L, '内存里：两个扁平数组', C.keep, 720, 170, { fs: 24 });
  show(kw('t01', '两个扁平数组'), flatT, { sfx: 'tick' });
  // groups strip
  const gx0 = 720, gy = 240, cw = 23, ch = 50;
  const strip = div(L, 'strip', gx0, gy, '', G.length * 5 * cw, ch);
  const cells = [];
  G.forEach((g, i) => {
    for (let f = 0; f < 5; f++) {
      const c = div(strip, 'ic', (i * 5 + f) * cw, 0, '', cw - 2, ch);
      c.style.setProperty('--c', g[6]);
      cells.push(c);
    }
  });
  const gLbl = div(L, 'lbl m', gx0, gy - 34, 'groups: IntArray');
  show(kw('t01', '两个扁平数组') + 0.2, [strip, gLbl], { dy: 0 });
  tl.fromTo(cells, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.25, stagger: 0.012, ...IR }, kw('t01', '两个扁平数组') + 0.3);
  // slots strip
  const sy = 360, sw = 29;
  const slotStrip = div(L, 'strip', gx0, sy, '', 36 * sw, ch);
  const scells = [];
  for (let i = 0; i < 36; i++) {
    const g = G.findIndex((x, k) => (G[k + 1] ? G[k + 1][5] : 36) > i && x[5] <= i);
    const owner = [...G].reverse().find((x) => x[5] <= i);
    const c = div(slotStrip, 'ic sl', i * sw, 0, '', sw - 3, ch);
    c.style.setProperty('--c', owner[6]);
    scells.push(c);
  }
  const sLbl = div(L, 'lbl m', gx0, sy - 34, 'slots: Array<Any?>');
  show(kw('t01', '两个扁平数组') + 0.6, [slotStrip, sLbl], { dy: 0 });
  tl.fromTo(scells, { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.01, ...IR }, kw('t01', '两个扁平数组') + 0.7);
  sfx(kw('t01', '两个扁平数组') + 0.3, 'swoosh', 0.4);

  // ---- t02: five ints per group ----
  const t2 = vs('t02');
  const zoom = div(L, 'zoomrow', 720, 470, '');
  const F = ['Key', 'GroupInfo', 'Parent', 'Size', 'Data'];
  const FZ = ['key', '标志位', '父 group', '大小', '数据位置'];
  const zc = F.map((f, i) => {
    const c = div(zoom, 'zc', i * 210, 0, `<small>${f}</small><b></b><em>${FZ[i]}</em>`, 200, 110);
    c.style.setProperty('--c', C.col);
    return c;
  });
  const zoomLbl = div(L, 'lbl m', 720, 440, 'group #1 = groups[5..9]');
  const br = path(ov, `M${gx0 + 5 * cw},${gy + ch + 4} L720,466 M${gx0 + 10 * cw - 2},${gy + ch + 4} L${720 + 1040},466`, C.col, { w: 2, dash: '5 6' });
  const tFive = kw('t02', '五个整数');
  tl.fromTo(cells.slice(5, 10), { y: 0 }, { y: -10, duration: 0.25, ...IR }, tFive - 0.3);
  drawIn(tFive - 0.2, br);
  show(tFive - 0.1, zoomLbl);
  const vals = ['125', '0x40000003', '0', '8', '4'];
  zc.forEach((c, i) => {
    const t = i === 0 ? kw('t02', 'key') : kw('t02', FZ[i]);
    show(t - 0.1, c, { dy: 16, d: 0.35, sfx: 'tick', g: 0.35 });
    H.setHtml(t0, c.querySelector('b'), vals[i]);
  });

  // ---- t03: slots ----
  const t3 = vs('t03');
  const sNames = ['RC', 'S0', 'S0', 'inc', 'C', 'U1', 'U2', 'U3', 'U4', 'true', '"Even"', 'P', '', '', '', '', 'T'];
  sNames.forEach((n, i) => { if (n) scells[i].textContent = n; });
  tl.fromTo(scells.slice(0, 17), { color: 'rgba(0,0,0,0)' }, { color: '#e6edf7', duration: 0.3, stagger: 0.04, ...IR }, t3 + 0.2);
  sfx(t3 + 0.2, 'swoosh', 0.3);
  const dataArrow = path(ov, `M${720 + 4 * 210 + 100},${470 + 112} C${720 + 4 * 210 + 100},${620} ${gx0 + 4 * sw + 60},${640} ${gx0 + 4 * sw + 14},${sy + ch + 8}`, C.upd, { arrow: true, w: 3 });
  drawIn(kw('t03', '按顺序'), dataArrow, 0.6);

  // ---- t04/t05: preorder + size ----
  const t4 = vs('t04') - 0.2;
  hide(t4, [strip, slotStrip, gLbl, sLbl, zoom, zoomLbl, br, dataArrow, flatT]);
  hide(t4, treeT);
  tl.to(mini, { opacity: 0, duration: 0.3 }, t4);
  const TX = 220, TY = 200, RH = 62;
  const hd = div(L, 'thead', TX, TY - 46, '<span>row</span><span>逻辑身份</span><span>Key</span><span>GroupInfo</span><span>Parent</span><span>Size</span><span>Data</span>');
  show(t4 + 0.3, hd, { dy: 0 });
  const R = G.map((g, i) => {
    const r = div(L, 'trow', TX, TY + i * RH,
      `<span>${i}</span><span class="nm" style="padding-left:${[0, 1, 2, 3, 4, 2, 3, 2, 3][i] * 18}px">${g[0]}</span><span>${g[1]}</span><span>${g[2]}</span><span>${g[3]}</span><span class="sz">${g[4]}</span><span>${g[5]}</span>`);
    r.style.setProperty('--c', g[6]);
    return r;
  });
  show(t4 + 0.4, R, { st: 0.06, dx: -16, dy: 0, d: 0.3, sfx: 'swoosh', g: 0.3 });
  const tPre = kw('t04', '先序排列');
  const pre = tag(L, '先序：父在前，后代紧跟其后', C.ink2, 1430, 200, { fs: 22 });
  show(tPre, pre);
  // size bracket for row 1 (C node)
  const tSize = kw('t05', 'size 是 8');
  const brk = div(L, 'brk', TX + 1150, TY + RH, '', 26, RH * 8 - 8);
  brk.style.setProperty('--c', C.col);
  const rowC = R[1];
  tl.to(rowC, { '--hl': 1, duration: 0.2 }, tSize - 0.4);
  tl.fromTo(rowC.querySelector('.sz'), { color: '#e6edf7' }, { color: C.upd, duration: 0.2, ...IR }, tSize - 0.4);
  tl.fromTo(brk, { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.6, ease: 'power3.out', transformOrigin: '50% 0%', ...IR }, tSize);
  sfx(tSize, 'swoosh', 0.4);
  const eight = tag(L, 'rows 1…8 都属于 Column', C.col, TX + 1190, TY + RH * 4.5 - 18, { fs: 22 });
  show(kw('t05', '八行'), eight);
  tl.fromTo(R.slice(1, 9), { backgroundColor: 'rgba(148,163,184,0)' }, { backgroundColor: 'rgba(148,163,184,.10)', duration: 0.3, stagger: 0.03, ...IR }, kw('t05', '八行'));

  // ---- t06: node count in GroupInfo ----
  const t6 = vs('t06');
  hide(t6, [eight, pre]);
  tl.to(brk, { opacity: 0, duration: 0.3 }, t6);
  tl.to(R.slice(1, 9), { backgroundColor: 'rgba(148,163,184,0)', duration: 0.3 }, t6);
  const gi = rowC.children[3];
  const tNc = kw('t06', '节点计数');
  tl.fromTo(gi, { color: '#e6edf7' }, { color: C.upd, duration: 0.2, ...IR }, tNc);
  const bits = blk(L, '0x4000000<b style="color:var(--upd)">3</b><small>NodeBit · node count = 3</small>', 1430, TY + RH - 10, C.upd, { cls: 'm', fs: 26 });
  show(tNc, bits, { sfx: 'tick' });
  const kids = [3, 5, 7].map((i) => R[i]);
  const tKids = kw('t06', '卡片');
  ['卡片', '分支', '按钮'].forEach((w, k) => {
    const t = kw('t06', w);
    tl.fromTo(kids[k], { backgroundColor: 'rgba(94,234,212,0)' }, { backgroundColor: 'rgba(94,234,212,.16)', duration: 0.25, ...IR }, t);
    sfx(t, 'tick', 0.4);
  });
  const direct = tag(L, '只数直接孩子：P · Even 分支 · I', C.keep, 1430, TY + RH * 2 + 20, { fs: 20 });
  show(tKids, direct);

  // ---- t07: disclaimer ----
  const t7 = vs('t07');
  const disc = div(L, 'disc', 220, 800, '⚠ 教学精简模型：省略了编译器生成的包装 group；字段格式与计数规则与源码一致 · K_* 为符号占位，125 / 207 是 runtime 真实常量');
  show(t7 + 0.1, disc, { sfx: 'tick' });

  // ---- t08: why flat ----
  const t8 = vs('t08') - 0.2;
  hide(t8, [hd, ...R, bits, direct, disc]);
  tl.to(kids, { backgroundColor: 'rgba(94,234,212,0)', duration: 0.1 }, t8);
  const mem = div(L, 'strip', 260, 420, '', 1400, 70);
  const mc = [];
  for (let i = 0; i < 40; i++) { const c = div(mem, 'ic', i * 35, 0, '', 33, 70); c.style.setProperty('--c', C.a1); mc.push(c); }
  show(t8 + 0.3, mem, { dy: 0 });
  tl.fromTo(mc, { opacity: 0 }, { opacity: 1, duration: 0.1, stagger: 0.01, ...IR }, t8 + 0.3);
  const scan = div(L, 'scanbar', 260, 400, '', 35, 110);
  const tSeq = kw('t08', '顺序读写');
  tl.fromTo(scan, { left: 260, opacity: 1 }, { left: 260 + 39 * 35, duration: 1.6, ease: 'none', ...IR }, tSeq);
  tl.set(scan, { opacity: 0 }, tSeq + 1.7);
  sfx(tSeq, 'swoosh', 0.5);
  const fast = tag(L, '连续内存 · 顺序访问最快', C.keep, 260, 540, { fs: 24 });
  show(kw('t08', '连续的内存'), fast, { sfx: 'tick' });

  // ---- t09: gap buffer ----
  const t9 = vs('t09');
  const gapStart = 28, gapLen = 8;
  for (let i = gapStart; i < gapStart + gapLen; i++) tl.to(mc[i], { opacity: 0.12, duration: 0.3 }, kw('t09', '空隙'));
  const gapLbl = tag(L, 'gap', C.upd, 260 + gapStart * 35 + 110, 360, { fs: 22 });
  show(kw('t09', 'gap'), gapLbl, { sfx: 'pop' });
  const tMove = kw('t09', '移到哪里');
  // move gap to position 10: shift cells 10..27 right by gapLen
  for (let i = 10; i < gapStart; i++) tl.to(mc[i], { x: gapLen * 35, duration: 0.8, ease: 'power3.inOut' }, tMove - 0.4);
  for (let i = gapStart; i < gapStart + gapLen; i++) tl.to(mc[i], { x: -(gapStart - 10) * 35, duration: 0.8, ease: 'power3.inOut' }, tMove - 0.4);
  tl.to(gapLbl, { left: 260 + 10 * 35 + 110, duration: 0.8, ease: 'power3.inOut' }, tMove - 0.4);
  sfx(tMove - 0.4, 'whoosh', 0.5);
  const caret = div(L, 'caret', 260 + 10 * 35 - 2, 405, '', 4, 100);
  const editor = tag(L, '像文本编辑器的光标', C.ink2, 260 + 10 * 35 - 80, 530, { fs: 22 });
  show(kw('t09', '文本编辑器'), [caret, editor], { sfx: 'tick' });
  hide(kw('t09', '文本编辑器') - 0.05, fast);
  tl.fromTo(caret, { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: 7, ease: 'steps(1)', ...IR }, kw('t09', '文本编辑器') + 0.5);

  hide(t1 - 0.5, [...L.children]);
});
