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
  swap(kw('o09', '12'), nodes[4], 'A<small>PaddingNode · 20dp</small>', { color: C.upd });
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
