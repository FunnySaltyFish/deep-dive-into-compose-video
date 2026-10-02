/* 09 Modifier：描述与节点链 —— Element vs Node、NodeChain 差分、onReuse 顺序、coordinator 洋葱、layer 挂载位置 */
H.scene('ch09', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, vs, ve, kw, show, pop, hide, fade, swap, path, drawIn, travel,
    blk, tag, codeBox, makePhone, IR } = H;
  const ov = overlay(L);

  // ---- o01: the card changed its look ----
  const P = makePhone(L).place(120, 170, 0.8);
  P.setOdd(t0);
  show(body, P.el, { dx: -30, dy: 0 });
  const olT = P.outline(P.R.P, C.upd, '样子变了');
  pop(kw('o01', '背景换成了边框'), olT, { s: 1.06 });

  // ---- o02: the modifier code ----
  const code = codeBox(L, `
Modifier
    .width(200.dp)
    .height(80.dp)
    .graphicsLayer { alpha = …; scaleX = … }
    .then(decoration)   // background ⇄ border
    .padding(if (even) 12.dp else 20.dp)`, { x: 600, y: 160, w: 960, fs: 24, title: 'CounterTile 的修饰符' });
  show(vs('o02'), code.el, { dx: 30, dy: 0, sfx: 'whoosh', g: 0.4 });
  ['宽度', '高度', '图层', '装饰', '内边距'].forEach((w, i) => {
    const h = code.hl(i + 2, i + 2, [C.a1, C.a1, C.a2, C.upd, C.a3][i]);
    tl.fromTo(h, { opacity: 0 }, { opacity: 1, duration: 0.15, ...IR }, kw('o02', w));
    tl.to(h, { opacity: 0, duration: 0.3 }, kw('o02', w) + 0.7);
    sfx(kw('o02', w), 'tick', 0.3);
  });

  // ---- o03: description is rebuilt, lightweight ----
  const t3 = vs('o03');
  hide(t3, olT);
  const COLS = [C.a1, C.a1, C.a2, C.upd, C.a3];
  const ex = 600, ew = 176, egap = 18;
  const descY = 460, nodeY = 720;
  const mkRow = (y, labels, cls) => labels.map((t, i) => {
    const e = div(L, 'mcell ' + cls, ex + i * (ew + egap), y, t, ew, 78);
    e.style.setProperty('--c', COLS[i]);
    return e;
  });
  const descLbl = div(L, 'lbl', ex, descY - 40, 'Modifier.Element · 描述（每次执行都新建）');
  const oldDesc = mkRow(descY, ['SizeElement<small>200dp</small>', 'SizeElement<small>80dp</small>', 'BlockGraphics<small>Layer · 偶数 λ</small>', 'Background<small>Element</small>', 'Padding<small>12dp</small>'], 'desc');
  show(kw('o03', 'Modifier'), descLbl);
  show(kw('o03', '重新创建'), oldDesc, { st: 0.08, dy: -16, sfx: 'pop', g: 0.35 });
  const light = tag(L, '轻量 · 不可变', C.ink2, ex + 5 * (ew + egap) + 10, descY + 22, { fs: 20 });
  show(kw('o03', '轻量'), light);

  // ---- o03a..o03f: how the description is built (CombinedModifier) and traversed ----
  const tA = vs('o03a');
  hide(tA - 0.2, [descLbl, ...oldDesc, light]);
  const thenTxt = ['then(Size)', 'then(Size)', 'then(GraphicsLayer)', 'then(decoration)', 'then(Padding)'];
  const thenTags = thenTxt.map((t, i) => { const g = tag(L, '= ' + t, COLS[i], 1580, code.y(i + 2) - 15, { fs: 17 }); g.classList.add('m'); return g; });
  const tDots = kw('o03a', '每一个点');
  const dotHl = [2, 3, 4, 5, 6].map((n, i) => { const h = code.hl(n, n, COLS[i]); tl.set(h, { opacity: 0 }, t0); return h; });
  thenTags.forEach((g, i) => show(tDots + i * 0.22, g, { dx: -14, dy: 0, sfx: i ? false : 'tick', g: 0.35 }));
  dotHl.forEach((h, i) => { tl.to(h, { opacity: 1, duration: 0.15 }, tDots + i * 0.22); });
  tl.to(dotHl, { opacity: 0, duration: 0.3 }, kw('o03a', 'then') + 0.6);

  // tree: C1 = Combined(width, height), C2 = Combined(C1, graphicsLayer) ... C4 = Combined(C3, padding)
  const tB = vs('o03b');
  hide(tB - 0.25, [P.el, code.el, ...thenTags]);
  const TR = {
    C4: [1300, 190], C3: [1100, 340], C2: [900, 490], C1: [700, 640],
    W: [500, 790], H: [900, 790], G: [1100, 640], D: [1300, 490], A: [1500, 340],
  };
  const LEAF = { W: ['SizeElement<small>200dp</small>', 0], H: ['SizeElement<small>80dp</small>', 1], G: ['BlockGraphics<small>Layer · 偶数 λ</small>', 2],
    D: ['Background<small>Element</small>', 3], A: ['Padding<small>12dp</small>', 4] };
  const TN = {};
  const LW = 190, LH = 64, CWd = 170, CHt = 56;
  Object.entries(TR).forEach(([k, [x, y]]) => {
    const leaf = LEAF[k];
    const w = leaf ? LW : CWd, h = leaf ? LH : CHt;
    const e = div(L, 'mcell ' + (leaf ? 'desc' : 'node2'), x - w / 2, y - h / 2, leaf ? leaf[0] : `Combined<small>Modifier #${k[1]}</small>`, w, h);
    e.style.setProperty('--c', leaf ? COLS[leaf[1]] : C.col);
    TN[k] = Object.assign(e, { w, h, x, y });
  });
  const edge = (pa, ch, kind) => {
    const a = TN[pa], b = TN[ch], o = kind === 'outer';
    const p = path(ov, H.edgeD(a.x + (o ? -30 : 30), a.y + a.h / 2 + 2, b.x, b.y - b.h / 2 - 8), o ? C.a2 : C.a3, { w: 2.5, arrow: true });
    const lb = tag(L, kind, o ? C.a2 : C.a3, (a.x + b.x) / 2 + (o ? -86 : 18), (a.y + b.y) / 2 - 14, { fs: 15 });
    lb.classList.add('m');
    return { p, lb };
  };
  const E = { C1: [edge('C1', 'W', 'outer'), edge('C1', 'H', 'inner')], C2: [edge('C2', 'C1', 'outer'), edge('C2', 'G', 'inner')],
    C3: [edge('C3', 'C2', 'outer'), edge('C3', 'D', 'inner')], C4: [edge('C4', 'C3', 'outer'), edge('C4', 'A', 'inner')] };
  const treeAll = [...Object.values(TN), ...Object.values(E).flat().flatMap((e) => [e.p, e.lb])];
  const ring = (t, e, color, hold = 1.0) => {
    tl.fromTo(e, { boxShadow: 'inset 0 0 0 2.5px var(--c)' }, { boxShadow: `inset 0 0 0 4px ${color}, 0 0 28px ${color}`, duration: 0.25, ...IR }, t);
    tl.to(e, { boxShadow: 'inset 0 0 0 2.5px var(--c)', duration: 0.4 }, t + hold);
  };
  // o03b: width.then(height) -> Combined #1
  show(tB + 0.1, [TN.W, TN.H], { st: 0.15, dy: 16, sfx: 'pop', g: 0.35 });
  pop(kw('o03b', 'CombinedModifier'), TN.C1, { s: 0.6 });
  const tOut = kw('o03b', 'outer 是'), tIn = kw('o03b', 'inner 是');
  drawIn(tOut, E.C1[0].p, 0.35); show(tOut, E.C1[0].lb, { dy: 0 }); ring(tOut + 0.2, TN.W, C.a2);
  drawIn(tIn, E.C1[1].p, 0.35); show(tIn, E.C1[1].lb, { dy: 0 }); ring(tIn + 0.2, TN.H, C.a3);
  // o03c: the tree grows up and to the right
  const tGrow = kw('o03c', '五个修饰符');
  [['C2', 'G'], ['C3', 'D'], ['C4', 'A']].forEach(([c, l], i) => {
    const t = tGrow + 0.2 + i * 0.75;
    show(t, TN[l], { dy: 16, sfx: 'pop', g: 0.3 });
    pop(t + 0.25, TN[c], { s: 0.6, sfx: false });
    E[c].forEach((e) => { drawIn(t + 0.35, e.p, 0.3); show(t + 0.35, e.lb, { dy: 0 }); });
  });
  const lean = tag(L, '向左倾斜 · outer 一路向左下', C.ink2, 1420, 176, { fs: 20 });
  show(kw('o03c', '向左倾斜'), lean, { sfx: 'tick', g: 0.3 });
  ring(kw('o03c', '最外层的 inner'), TN.A, C.a3, 1.4);
  ring(kw('o03c', '越往左下'), TN.W, C.a2, 1.4);

  // o03d: foldIn = outer first, then inner -> writing order; foldOut = reverse
  const SH = ['width', 'height', 'graphicsLayer', 'background', 'padding'];
  const rowIn = div(L, 'lbl m', 100, 140, 'foldIn →');
  const rowOut = div(L, 'lbl m', 100, 210, 'foldOut →');
  const inChips = SH.map((t, i) => { const g = tag(L, t, COLS[i], 260 + i * 165, 140, { fs: 19 }); g.classList.add('m'); return g; });
  const outChips = SH.slice().reverse().map((t, i) => { const g = tag(L, t, COLS[4 - i], 260 + i * 165, 210, { fs: 19 }); g.classList.add('m'); return g; });
  hide(vs('o03d') - 0.1, lean);
  const tWalk = kw('o03d', 'foldIn');
  show(tWalk, rowIn, { dx: -14, dy: 0 });
  const cur = div(L, 'curptr', 0, 0, '<span>foldIn</span>');
  const at = (k) => ({ left: TN[k].x - TN[k].w / 2 - 6, top: TN[k].y - TN[k].h / 2 - 6, width: TN[k].w + 12, height: TN[k].h + 12 });
  tl.set(cur, at('C4'), t0);
  pop(tWalk + 0.1, cur, { s: 1.15, sfx: 'tick' });
  const tDown = kw('o03d', '先走完 outer');
  ['C3', 'C2', 'C1'].forEach((k, i) => { tl.to(cur, { ...at(k), duration: 0.3, ease: 'power2.inOut' }, tDown - 0.2 + i * 0.35); });
  sfx(tDown, 'swoosh', 0.35);
  ['宽度', '高度', '图层', '装饰', '内边距'].forEach((w, i) => {
    const t = kw('o03d', w);
    tl.to(cur, { ...at(['W', 'H', 'G', 'D', 'A'][i]), duration: 0.28, ease: 'power2.inOut' }, t - 0.3);
    pop(t, inChips[i], { s: 0.6, sfx: 'tick', g: 0.35 });
  });
  const tFo = kw('o03d', 'foldOut');
  hide(tFo - 0.1, cur);
  show(tFo, rowOut, { dx: -14, dy: 0 });
  outChips.forEach((g, i) => pop(tFo + 0.3 + i * 0.16, g, { s: 0.6, sfx: i ? false : 'pop', g: 0.3 }));

  // o03e: NodeChain.fillVector flattens the tree with an explicit stack
  const tE = vs('o03e');
  hide(tE - 0.1, [rowIn, rowOut, ...inChips, ...outChips]);
  const tStk = kw('o03e', '显式的栈');
  const stk = div(L, 'panel', 90, 470, '<div class="ph">fillVector · stack</div>', 250, 400);
  show(tStk, stk, { sfx: 'whoosh', g: 0.3 });
  const SY = (k) => 800 - k * 58;
  const leafS = {};
  const pushS = (t, k, key) => {
    const leaf = LEAF[key];
    const e = div(L, 'mcell desc', 110, SY(k), leaf ? leaf[0] : `Combined<small>#${key[1]}</small>`, 210, 50);
    e.style.setProperty('--c', leaf ? COLS[leaf[1]] : C.col);
    tl.fromTo(e, { opacity: 0, y: -26 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', ...IR }, t);
    if (leaf) leafS[key] = e;
    return e;
  };
  const popS = (t, e, key) => {
    tl.to(e, { opacity: 0, x: 60, duration: 0.25, ease: 'power2.in' }, t);
    sfx(t, 'tick', 0.3);
    ring(t, TN[key], C.upd, 0.5);
  };
  let top = pushS(tStk + 0.3, 0, 'C4');
  const tPop = kw('o03e', '弹出一个');
  // pop Combined at slot i, push its inner (slot i) then its outer (slot i+1) -> outer pops first
  [['C4', 'A', 'C3'], ['C3', 'D', 'C2'], ['C2', 'G', 'C1'], ['C1', 'H', 'W']].forEach(([c, inner, outer], i) => {
    const t = tPop + i * 0.95;
    popS(t, top, c);
    pushS(t + 0.3, i, inner);
    top = pushS(t + 0.55, i + 1, outer);
  });
  const sNote = tag(L, '先压 inner · 再压 outer → outer 先出栈', C.upd, 90, 890, { fs: 18 });
  show(kw('o03e', '先压 inner'), sNote);
  // leaves pop off top-first (W H G D A = writing order) into the flat Element vector
  const tEmit = Math.max(tPop + 4.0, kw('o03e', '摊平') - 0.3);
  hide(tEmit - 0.35, treeAll);
  ['W', 'H', 'G', 'D', 'A'].forEach((key, i) => {
    const t = tEmit + i * 0.32;
    tl.to(leafS[key], { left: ex + i * (ew + egap), top: descY, width: ew, height: 78, duration: 0.55, ease: 'power3.inOut' }, t);
    sfx(t, 'tick', 0.3);
  });
  const tFlat = tEmit + 4 * 0.32 + 0.6;
  show(tFlat - 0.3, descLbl, { dy: 0 });
  tl.to(oldDesc, { opacity: 1, duration: 0.01 }, tFlat);
  tl.set(Object.values(leafS), { opacity: 0 }, tFlat + 0.02);
  sfx(tFlat, 'pop', 0.35);

  // o03f: written earlier = outer, wraps everything after it
  const tF = vs('o03f');
  hide(tF - 0.1, [stk, sNote]);
  const nest = SH.map((t, i) => {
    const r = div(L, 'ring', 600 + i * 40, 600 + i * 34, `<span>${t}</span>`, 950 - i * 80, 300 - i * 64);
    r.style.setProperty('--c', COLS[i]);
    return r;
  });
  nest.forEach((r, i) => pop(kw('o03f', '写在前面') + i * 0.18, r, { s: 0.94, sfx: i ? false : 'pop', g: 0.35 }));
  tl.fromTo(nest[0], { boxShadow: 'inset 0 0 0 3px var(--c)' }, { boxShadow: `inset 0 0 0 5px ${C.a1}, 0 0 36px rgba(94,234,212,.3)`, duration: 0.35, ...IR }, kw('o03f', '包住'));
  const wrapT = tag(L, '写在前面 = 在外层 · 顺序就是含义', C.keep, 600, 918, { fs: 22 });
  show(kw('o03f', '顺序有意义'), wrapT, { sfx: 'ding', g: 0.35 });
  const tBack = vs('o04') - 0.35;
  hide(tBack, [...nest, wrapT]);
  show(tBack, [P.el, code.el], { dy: 0 });

  // ---- o04: persistent Node chain ----
  const t4 = vs('o04');
  const nodeLbl = div(L, 'lbl', ex, nodeY - 40, 'Modifier.Node 链 · 挂在 LayoutNode P 上，持久存在');
  const nodes = mkRow(nodeY, ['W<small>SizeNode</small>', 'H<small>SizeNode</small>', 'G<small>BlockGraphics…</small>', 'B<small>BackgroundNode</small>', 'A<small>PaddingNode</small>'], 'node2');
  show(kw('o04', 'Modifier.Node'), nodeLbl);
  show(kw('o04', '链') + 0.1, nodes, { st: 0.1, dy: 16, sfx: 'pop', g: 0.4 });
  const links = nodes.slice(0, 4).map((n, i) => path(ov, `M${ex + i * (ew + egap) + ew + 2},${nodeY + 39} L${ex + (i + 1) * (ew + egap) - 4},${nodeY + 39}`, C.line, { w: 3 }));
  links.forEach((p, i) => drawIn(kw('o04', '链') + 0.3 + i * 0.08, p, 0.2));
  const vlinks = oldDesc.map((d, i) => path(ov, `M${ex + i * (ew + egap) + ew / 2},${descY + 82} L${ex + i * (ew + egap) + ew / 2},${nodeY - 6}`, C.dim, { dash: '5 6', w: 2 }));
  const tMap = kw('o04', '每个描述元素');
  vlinks.forEach((p, i) => drawIn(tMap + i * 0.06, p));

  // ---- o05..o10: diff ----
  const t5 = vs('o05');
  hide(t5, [light]);
  // new description flies in above the old one
  const newY = 300;
  const newLbl = div(L, 'lbl', ex, newY - 40, '新描述（n = 1）');
  const newDesc = mkRow(newY, ['SizeElement<small>200dp</small>', 'SizeElement<small>80dp</small>', 'BlockGraphics<small>Layer · 奇数 λ</small>', 'BorderModifier<small>NodeElement</small>', 'Padding<small>20dp</small>'], 'desc');
  hide(t5, code.el);
  show(t5, newLbl);
  show(t5 + 0.1, newDesc, { st: 0.07, dy: -20, sfx: 'whoosh', g: 0.4 });
  const cmpBar = div(L, 'cmpbar', ex - 10, newY - 8, '', ew + 20, descY - newY + 94);
  const cmpAt = (t, i) => {
    tl.to(cmpBar, { left: ex + i * (ew + egap) - 10, duration: 0.35, ease: 'power3.inOut' }, t - 0.35);
  };
  pop(kw('o05', '逐个比较'), cmpBar, { s: 1.04, sfx: 'tick' });
  const verdicts = [];
  const verdict = (t, i, text, color) => {
    const v = tag(L, text, color, ex + i * (ew + egap) + ew / 2, nodeY + 120, { fs: 19, center: true });
    pop(t, v, { sfx: 'tick', g: 0.4 });
    verdicts.push(v);
    return v;
  };
  // o06: W, H equal -> Reuse
  const t6 = kw('o06', '完全相等');
  cmpAt(t6, 0);
  verdict(t6, 0, '== → 保留', C.keep);
  tl.to(cmpBar, { left: ex + 1 * (ew + egap) - 10, duration: 0.3 }, t6 + 0.5);
  verdict(t6 + 0.6, 1, '== → 保留', C.keep);
  tl.fromTo(nodes.slice(0, 2), { boxShadow: 'inset 0 0 0 2.5px var(--c)' }, { boxShadow: `inset 0 0 0 3.5px ${C.keep}`, duration: 0.3, ...IR }, t6 + 0.6);
  // o07: G same type -> update
  const t7 = kw('o07', '同一类型');
  cmpAt(t7, 2);
  verdict(t7 + 0.8, 2, '同类型 → update', C.upd);
  swap(kw('o07', '更新参数'), nodes[2], 'G<small>block 已更新</small>', { color: C.upd });
  // o08: B vs Border -> replace
  const t8 = kw('o08', 'background');
  cmpAt(t8, 3);
  verdict(kw('o08', '类型不同'), 3, '类型不同 → 替换', C.gone);
  const tDel = kw('o08', '旧节点删除');
  tl.to(nodes[3], { opacity: 0, y: 40, duration: 0.45, ease: 'power2.in' }, tDel);
  sfx(tDel, 'remove', 0.6);
  const D = div(L, 'mcell node2', ex + 3 * (ew + egap), nodeY, 'D<small>BorderModifierNode</small>', ew, 78);
  D.style.setProperty('--c', C.nw);
  pop(kw('o08', 'BorderModifierNode'), D, { s: 0.6 });
  const dlg = tag(L, '委托 → CacheDrawModifierNode', C.nw, ex + 3 * (ew + egap) - 60, nodeY + 168, { fs: 17 });
  show(kw('o08', 'BorderModifierNode') + 0.5, dlg);
  // o09: padding
  const t9 = kw('o09', '内边距');
  cmpAt(t9, 4);
  verdict(t9 + 0.5, 4, '同类型 → update', C.upd);
  swap(kw('o09', '12'), nodes[4], 'A<small>Padding · 20dp</small>', { color: C.upd });
  // o10: summary
  const t10 = vs('o10');
  hide(t10, cmpBar);
  const sum = blk(L, '5 个节点 · <b style="color:var(--new)">1</b> 个新建 · <b>4</b> 个复用', ex, 960 - 70, C.keep, { fs: 28 });
  show(t10, sum, { sfx: 'ding', g: 0.45 });

  // ---- o11: onReuse happens before the diff ----
  const t11 = vs('o11');
  hide(t11, [sum]);
  hide(t11 - 0.2, [P.el, newLbl, ...newDesc, descLbl, ...oldDesc, ...vlinks, nodeLbl, ...nodes, ...links, D, dlg, ...verdicts]);
  const timeline = div(L, 'panel', 560, 300, '', 800, 360);
  const step1 = blk(L, '① onReuse()<small>旧链：reset → detach → attach</small>', 620, 340, C.a1, { fs: 30, w: 680 });
  const step2 = blk(L, '② SetModifier<small>拿旧链和新描述做比较</small>', 620, 500, C.upd, { fs: 30, w: 680 });
  show(kw('o11', '回收复用'), timeline, { op: 1 });
  show(kw('o11', 'onReuse'), step1, { sfx: 'tick' });
  show(kw('o11', '重新挂载') + 0.2, step2, { sfx: 'tick' });
  // old B also went through reuse before being removed — make the point visually
  const bGhost = tag(L, '所以旧 B 也先被重置、重新挂载了一次，然后才被删除', C.ink2, 620, 700, { fs: 22 });
  show(kw('o11', '重新挂载'), bGhost);

  // ---- o12: coordinators like an onion ----
  const t12 = vs('o12') - 0.2;
  hide(t12, [timeline, step1, step2, bGhost]);
  const OX = 420, OY = 190;
  const rings = [
    ['CW · width', C.a1, 0], ['CH · height', C.a1, 1], ['CG · graphicsLayer', C.a2, 2], ['CA · padding', C.a3, 3], ['CI · Inner', C.col, 4],
  ].map(([t, c, i]) => {
    const pad = i * 46;
    const r = div(L, 'ring', OX + pad, OY + pad, `<span>${t}</span>`, 980 - pad * 2, 620 - pad * 2);
    r.style.setProperty('--c', c);
    return r;
  });
  rings.forEach((r, i) => pop(kw('o12', 'coordinator') - 0.3 + i * 0.25, r, { s: 0.92, sfx: i % 2 ? false : 'pop', g: 0.35 }));
  const content = blk(L, 'MeasurePolicy · 内容', OX + 4 * 46 + 160, OY + 4 * 46 + 120, C.col, { fs: 22 });
  show(kw('o12', '洋葱'), content);
  const bdr = tag(L, 'D 边框节点 · 不加层，关联到 CA', C.nw, OX + 1000, OY + 3 * 46 + 6, { fs: 20 });
  show(kw('o12', '层层嵌套'), bdr);

  // ---- o13: the layer sits on CA, not CG ----
  const t13 = vs('o13');
  const lay = div(L, 'layerChip', 0, 0, 'OwnedLayer L');
  const notHere = tag(L, '✗ 不在 CG', C.gone, OX + 2 * 46 + 690, OY + 2 * 46 + 8, { fs: 19 });
  tl.set(lay, { left: OX + 2 * 46 + 300, top: OY + 2 * 46 + 4 }, t0);
  pop(kw('o13', '图层'), lay, { s: 0.6 });
  show(kw('o13', '不是挂在'), notHere, { sfx: 'remove', g: 0.5 });
  tl.to(lay, { left: OX + 3 * 46 + 300, top: OY + 3 * 46 + 4, duration: 0.8, ease: 'power3.inOut' }, kw('o13', '里面的那一层'));
  sfx(kw('o13', '里面的那一层'), 'whoosh', 0.5);
  tl.fromTo(rings[3], { boxShadow: 'inset 0 0 0 3px var(--c)' }, { boxShadow: `inset 0 0 0 5px ${C.upd}, 0 0 40px rgba(251,191,36,.25)`, duration: 0.4, ...IR }, kw('o13', 'padding'));
  const why = tag(L, 'placeWithLayer 放置的是内侧 coordinator', C.upd, OX, OY + 650, { fs: 22 });
  why.classList.add('m');
  show(kw('o13', 'padding'), why, { sfx: 'tick' });

  hide(t1 - 0.5, [...L.children]);
});
