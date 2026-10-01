/* 12 回顾 —— 全链路、只做必要的事、延迟读取变体、结尾 */
H.scene('ch12', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, vs, ve, kw, show, pop, hide, fade, swap, path, drawIn, travel, blk, tag, codeBox, IR } = H;
  const ov = overlay(L);

  // ---- z01..z06: the whole pipeline as a 2-row chain ----
  const ST = [
    ['命中测试', 'ClickableNode', C.a3], ['increment', '状态写入', C.upd], ['通知', 'Recomposer', C.a1], ['作用域失效', 'RC', C.gone],
    ['下一帧', 'Choreographer', C.a1], ['重组', 'SlotTable 对照', C.a2], ['ChangeList', '修改清单', C.a2], ['Applier', '改 LayoutNode 树', C.keep],
    ['NodeChain', '比较修饰符', C.nw], ['测量 · 放置', 'constraints / place', C.a3], ['图层 · 录制', 'RenderNode', C.upd], ['屏幕刷新', 'Odd 1', C.keep],
  ];
  const W = 340, GX = 410, X0 = 150;
  const pos = (i) => {
    const row = Math.floor(i / 4), col = i % 4;
    const x = row % 2 === 0 ? X0 + col * GX : X0 + (3 - col) * GX;
    return [x, 210 + row * 230];
  };
  const S = ST.map(([a, b, c], i) => {
    const [x, y] = pos(i);
    return blk(L, `${a}<small>${b}</small>`, x, y, c, { fs: 28, w: W });
  });
  const A = S.slice(0, -1).map((s, i) => {
    const n = S[i + 1];
    const d = Math.floor(i / 4) !== Math.floor((i + 1) / 4)
      ? `M${s.cx},${s.by + s.bh + 6} L${n.cx},${n.by - 12}`
      : (s.bx < n.bx ? `M${s.bx + s.bw + 8},${s.cy} L${n.bx - 12},${n.cy}` : `M${s.bx - 8},${s.cy} L${n.bx + n.bw + 12},${n.cy}`);
    return path(ov, d, C.dim, { arrow: true, w: 3 });
  });
  const groups = [
    ['z02', [0, 1]], ['z03', [2, 3]], ['z04', [4, 5, 6]], ['z05', [7, 8]], ['z06', [9, 10, 11]],
  ];
  show(vs('z01') + 0.3, [], {});
  groups.forEach(([id, idx]) => {
    const t = vs(id);
    const dur = Math.max(0.6, ve(id) - t);
    idx.forEach((k, j) => {
      const tt = t + (dur * j) / idx.length;
      if (k > 0) { drawIn(tt - 0.25, A[k - 1], 0.25); travel(tt - 0.25, A[k - 1], 0.3, C.upd); }
      show(tt, S[k], { s: 0.9, dy: 0, sfx: 'tick', g: 0.4 });
    });
  });

  // ---- z07: only what's needed ----
  const t7 = vs('z07');
  tl.to([...S, ...A], { opacity: 0.25, duration: 0.5 }, t7 - 0.1);
  const facts = [
    ['状态对象', '没换', C.keep], ['卡片节点', '没换', C.keep], ['5 个修饰符节点', '只新建 1 个', C.nw],
  ].map(([a, b, c], i) => blk(L, `${a} · <b>${b}</b>`, 360 + i * 420, 860, c, { fs: 30, cls: 'solid' }));
  ['状态对象', '卡片节点', '五个修饰符'].forEach((w, i) => show(kw('z07', w), facts[i], { sfx: 'ding', g: 0.35 }));

  // ---- z08/z09: deferred read variant ----
  const t8 = vs('z08') - 0.2;
  hide(t8, [...S, ...A, ...facts]);
  const code = codeBox(L, `
val count = remember { mutableIntStateOf(0) }
// 外面不读 count
Modifier.graphicsLayer {
    alpha = if (count.intValue % 2 == 0) 1f else 0.65f
}`, { x: 160, y: 200, w: 1000, fs: 26, title: '变体 · 只在 graphicsLayer 里读' });
  show(t8 + 0.2, code.el, { dx: -30, dy: 0, sfx: 'whoosh', g: 0.4 });
  const hR = code.hl(4, 4, C.upd);
  fade(kw('z08', '读取'), hR, 1, 0.3);
  const phases = [['重组', C.a2], ['测量', C.a3], ['放置', C.a3], ['图层属性', C.upd], ['绘制', C.a1]].map(([t, c], i) =>
    blk(L, t, 1260 + (i % 2) * 280, 200 + Math.floor(i / 2) * 130, c, { fs: 28, w: 250 }));
  show(vs('z09'), phases, { st: 0.08, dy: 10 });
  const tObs = kw('z09', '观察范围');
  const obsT = tag(L, 'layer 参数的 snapshot 读观察', C.upd, 160, 560, { fs: 24 });
  show(tObs, obsT, { sfx: 'tick' });
  tl.fromTo(phases[3], { boxShadow: 'inset 0 0 0 2.5px var(--c)' }, { boxShadow: `inset 0 0 0 4px ${C.upd}, 0 0 30px rgba(251,191,36,.35)`, duration: 0.3, ...IR }, kw('z09', '更新图层属性'));
  const tSkip = kw('z09', '跳过');
  tl.to([phases[0], phases[1], phases[2], phases[4]], { opacity: 0.25, duration: 0.4 }, tSkip);
  const skips = [0, 1, 2].map((i) => { const p = phases[i]; const x = div(L, 'qmark', p.cx, p.cy, '✗'); x.style.fontSize = '44px'; x.style.color = C.gone; return x; });
  skips.forEach((x, i) => pop(tSkip + i * 0.1, x, { sfx: i ? false : 'remove' }));

  // ---- z10: the principle ----
  const t10 = vs('z10') - 0.2;
  hide(t10, [code.el, hR, obsT, ...phases, ...skips]);
  const st = div(L, 'stmt', 0, 380, '读取发生在<em>哪个阶段</em><small>就决定了哪个阶段要重新工作</small>');
  show(kw('z10', '读取发生'), st, { sfx: 'ding', g: 0.6 });
  const lanes = [['组合', C.a2], ['布局', C.a3], ['图层', C.upd], ['绘制', C.a1]].map(([t, c], i) =>
    tag(L, t, c, 560 + i * 220, 640, { fs: 26 }));
  show(kw('z10', '哪个阶段要'), lanes, { st: 0.12, sfx: 'tick' });

  // ---- z11/z12: ending ----
  const t11 = vs('z11') - 0.2;
  hide(t11, [st, ...lanes]);
  const end = div(L, 'big', 0, 320, '<h1>点一下，<em>发生了什么</em></h1><p>Compose 1.12.1 · 源码推演 · 教学示意</p>');
  show(t11 + 0.2, end, { sfx: 'ding', g: 0.6 });
  // a single slot glowing
  const cell = div(L, 'endcell', 960 - 60, 640, 'remember', 120, 56);
  pop(kw('z12', '那张表里的哪一格'), cell, { s: 0.5, sfx: 'pop' });
  const row = [...Array(15)].map((_, i) => { const c = div(L, 'ic', 960 - 7.5 * 66 + i * 66, 720, '', 60, 26); c.style.setProperty('--c', C.a1); return c; });
  tl.set(row, { opacity: 0 }, t0);
  tl.fromTo(row, { opacity: 0 }, { opacity: 0.6, duration: 0.2, stagger: { each: 0.04, from: 'center' }, ...IR }, kw('z12', '那张表里'));
  tl.to(cell, { top: 705, scale: 0.5, duration: 0.8, ease: 'power3.inOut' }, kw('z12', '哪一格') + 0.6);

  // ---- e01..e03: easter egg — gap buffer cost, LinkBuffer, next episode ----
  const tE1 = vs('e01') - 0.3;
  hide(tE1, [end, cell, ...row]);
  const egg = tag(L, '彩蛋 · Easter egg', C.upd, 960, 150, { fs: 26, center: true });
  pop(kw('e01', '彩蛋'), egg, { s: 0.6, sfx: 'ding', g: 0.5 });
  // gap buffer: editing far from the gap shifts everything in between
  const GX0 = 300, CW = 33, NC = 40, GY = 330;
  const gLbl = div(L, 'lbl m', GX0, GY - 44, 'GapBuffer · groups 数组');
  const gStrip = div(L, 'strip', GX0, GY, '', NC * (CW + 2), 64);
  const gc = [];
  for (let i = 0; i < NC; i++) { const c = div(gStrip, 'ic', i * (CW + 2), 0, '', CW, 64); c.style.setProperty('--c', i >= 30 && i < 36 ? C.dim : C.a1); gc.push(c); }
  for (let i = 30; i < 36; i++) tl.set(gc[i], { opacity: 0.15 }, t0);
  const tG = kw('e01', 'gap buffer');
  show(tG, [gLbl, gStrip], { dy: 0 });
  const gapT = tag(L, 'gap', C.upd, GX0 + 30 * (CW + 2) + 70, GY + 76, { fs: 20 });
  show(tG + 0.2, gapT);
  const editAt = 4;
  const caret = div(L, 'caret', GX0 + editAt * (CW + 2) - 3, GY - 12, '', 4, 88);
  const tFar = kw('e01', '离 gap 越远');
  show(tFar, caret, { dy: 0, sfx: 'tick' });
  // cells 4..29 slide right by 6 to bring the gap to the caret
  const shiftT = kw('e01', '搬动');
  for (let i = editAt; i < 30; i++) tl.to(gc[i], { x: 6 * (CW + 2), backgroundColor: 'rgba(251,113,133,.35)', duration: 0.9, ease: 'power3.inOut' }, shiftT - 0.3);
  for (let i = 30; i < 36; i++) tl.to(gc[i], { x: -(30 - editAt) * (CW + 2), duration: 0.9, ease: 'power3.inOut' }, shiftT - 0.3);
  tl.to(gapT, { left: GX0 + editAt * (CW + 2) + 70, duration: 0.9, ease: 'power3.inOut' }, shiftT - 0.3);
  sfx(shiftT - 0.3, 'whoosh', 0.5);
  const costT = tag(L, '26 格整体后移', C.gone, GX0 + 14 * (CW + 2), GY + 76, { fs: 20 });
  show(shiftT + 0.5, costT, { sfx: 'remove', g: 0.4 });
  const moveT = kw('e01', '移动一段 group');
  const seg = [0, 1, 2].map((k) => gc[editAt + 6 + k]); // a run of groups being moved
  tl.fromTo(seg, { boxShadow: 'inset 0 0 0 1.5px transparent' }, { boxShadow: `inset 0 0 0 3px ${C.upd}`, duration: 0.25, ...IR }, moveT);
  const copyT = tag(L, '重排 = 整段复制', C.gone, GX0 + 30 * (CW + 2), GY - 48, { fs: 20 });
  show(kw('e01', '整段复制'), copyT, { sfx: 'tick' });

  // LinkBuffer: groups linked explicitly; a move rewires links
  const LY = 640;
  const lLbl = div(L, 'lbl m', GX0, LY - 60, 'LinkBuffer · 显式链接');
  const LN = ['Column', 'Card', 'Branch', 'Button', 'Text'];
  const LXs = [300, 560, 820, 1080, 1340];
  const lnodes = LN.map((t, i) => { const b = blk(L, t, LXs[i], LY, [C.col, C.a1, C.a2, C.a3, C.a1][i], { fs: 24, w: 200, cls: 'm' }); return b; });
  const lp = (a, b, bend = 0) => path(ov, `M${lnodes[a].bx + 200 + 6},${lnodes[a].cy} C${lnodes[a].bx + 230},${lnodes[a].cy + bend} ${lnodes[b].bx - 30},${lnodes[b].cy + bend} ${lnodes[b].bx - 12},${lnodes[b].cy}`, C.keep, { arrow: true, w: 3 });
  const links = [lp(0, 1), lp(1, 2), lp(2, 3), lp(3, 4)];
  const tLB = kw('e02', 'LinkBuffer');
  show(kw('e02', '另一套'), lLbl, { dy: 0 });
  show(tLB, lnodes, { st: 0.1, dy: 14, sfx: 'pop', g: 0.35 });
  links.forEach((p, i) => drawIn(kw('e02', '显式的链接') + i * 0.12, p, 0.3));
  // move "Branch" after "Button": only links change
  const tRe = kw('e02', '改的主要是链接');
  [links[1], links[2], links[3]].forEach((p) => tl.to(p, { opacity: 0, duration: 0.25 }, tRe - 0.3));
  tl.to(lnodes[2], { y: 120, duration: 0.6, ease: 'power3.inOut' }, tRe - 0.3);
  sfx(tRe - 0.3, 'swoosh', 0.4);
  const nl1 = path(ov, `M${LXs[1] + 206},${LY + 30} L${LXs[3] - 12},${LY + 30}`, C.upd, { arrow: true, w: 3 });
  const nl2 = path(ov, `M${LXs[3] + 100},${LY + 66} C${LXs[3] + 100},${LY + 130} ${LXs[2] + 260},${LY + 150} ${LXs[2] + 212},${LY + 150}`, C.upd, { arrow: true, w: 3 });
  const nl3 = path(ov, `M${LXs[2] + 100},${LY + 186} C${LXs[2] + 100},${LY + 240} ${LXs[4] + 100},${LY + 240} ${LXs[4] + 100},${LY + 72}`, C.upd, { arrow: true, w: 3 });
  [nl1, nl2, nl3].forEach((p, i) => drawIn(tRe + 0.3 + i * 0.2, p, 0.35));
  const onlyT = tag(L, '只改 3 个链接 · 数据不搬家', C.keep, 1300, LY + 250, { fs: 20 });
  show(kw('e02', '而不是大段复制'), onlyT, { sfx: 'ding', g: 0.35 });

  // e03: default off in 1.12.1, next episode
  const tE3 = vs('e03') - 0.2;
  const flag = codeBox(L, 'ComposeRuntimeFlags.isLinkBufferComposerEnabled = false  // 1.12.1 默认', { x: 330, y: 160, w: 1260, fs: 22, bar: false, ln: false });
  hide(tE3, [egg]);
  show(kw('e03', '默认还没有开启'), flag.el, { dy: -10, sfx: 'tick' });
  const tNext = kw('e03', '新的 SlotTable');
  hide(tNext - 0.3, [gLbl, gStrip, gapT, caret, costT, copyT, lLbl, ...lnodes, links[0], nl1, nl2, nl3, onlyT, flag.el]);
  const nextC = div(L, 'big', 0, 330, '<h1>下一期 · <em>LinkBuffer</em></h1><p>新的 SlotTable 为什么出现 · 和 gap buffer 有什么不同</p>');
  show(tNext, nextC, { s: 0.94, sfx: 'chapter', g: 0.6 });
});
