/* 02 点击：事件如何找到按钮 */
H.scene('ch02', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, seg, segEnd, vs, ve, kw, show, pop, hide, fade, move, swap, path, drawIn, march, travel, edgeD,
    blk, chip, tag, nodeCard, badge, glow, codeBox, makePhone, makeFinger, IR } = H;

  const P = makePhone(L).place(110, 150, 1);
  const finger = makeFinger(L);
  P.setEven(t0);
  show(body, P.el, { dx: -40, dy: 0, d: 0.7 });
  const ov = overlay(L);
  const tap = P.center(P.R.I);

  // ---- p01: touch -> Android -> View ----
  const sys = blk(L, 'Android 系统', 760, 230, C.col, { fs: 28 });
  const view = blk(L, '窗口里的 View', 1180, 230, C.a1, { fs: 28 });
  const pSys = path(ov, `M${tap[0] + 30},${tap[1] - 20} C640,${tap[1] - 120} 660,${sys.cy} ${sys.bx - 12},${sys.cy}`, C.upd, { dash: '10 10', w: 3 });
  const pView = path(ov, `M${sys.bx + sys.bw + 8},${sys.cy} L${view.bx - 12},${view.cy}`, C.dim, { arrow: true });
  const tDown = vs('p01') + 0.6;
  finger.down(tDown, tap[0], tap[1]);
  show(kw('p01', 'Android'), sys, { sfx: 'tick' });
  drawIn(kw('p01', 'Android'), pSys);
  march(kw('p01', 'Android'), pSys, 30);
  const me = chip(L, 'MotionEvent', C.upd, 0, 0, { fs: 20 });
  gsap.set(me, { left: sys.bx, top: sys.by - 52 });
  pop(kw('p01', '触摸事件'), me);
  drawIn(kw('p01', '交给'), pView);
  travel(kw('p01', '交给'), pView, 0.6, C.upd, { sfx: 'swoosh' });
  show(kw('p01', '窗口'), view, { sfx: 'tick' });
  tl.to(finger.el, { opacity: 0, duration: 0.4 }, ve('p01') + 0.2);

  // ---- p02: only one View ----
  const big = P.outline(P.R.screen, C.a1, 'AndroidComposeView');
  const olT = P.outline(P.R.P, C.gone), olE = P.outline(P.R.E, C.gone), olI = P.outline(P.R.I, C.gone);
  const t2 = kw('p02', '只有一个');
  swap(t2, view, 'AndroidComposeView');
  pop(t2 + 0.1, big, { s: 1.06, sfx: 'tick' });
  const one = tag(L, '唯一的 View', C.a1, 1200, 320, { fs: 22 });
  show(t2 + 0.4, one);
  const notView = [olT, olE, olI];
  const tNot = kw('p02', '按钮');
  notView.forEach((o, i) => pop(tNot + i * 0.22, o, { s: 1.1, sfx: 'tick', g: 0.35 }));
  const nv = [P.R.P, P.R.E, P.R.I].map((r, i) => {
    const [x, y] = P.pt(r[0] + r[2] - 4, r[1] - 4);
    const tg = tag(L, '不是 View', C.gone, x, y, { fs: 18 });
    gsap.set(tg, { xPercent: -100, yPercent: -50 });
    show(tNot + i * 0.22 + 0.1, tg, { dy: 0 });
    return tg;
  });
  const tEndP2 = ve('p02') + 0.3;
  hide(tEndP2, [olT, olE, olI, ...nv, one]);
  fade(tEndP2, big, 0.35);

  // ---- p03: MotionEvent -> PointerInputEvent -> processor ----
  const X3 = view.bx;
  const d1 = blk(L, 'dispatchTouchEvent()', X3, 380, C.a1, { cls: 'm', fs: 24 });
  const d2 = blk(L, 'PointerInputEvent<small>Compose 自己的指针事件</small>', X3, 520, C.upd, { cls: 'm', fs: 24 });
  const d3 = blk(L, 'PointerInputEventProcessor<small>.process()</small>', X3, 690, C.keep, { cls: 'm', fs: 24 });
  const a1 = path(ov, `M${view.cx},${view.by + view.bh + 6} L${view.cx},${d1.by - 10}`, C.dim, { arrow: true });
  const a2 = path(ov, `M${view.cx},${d1.by + d1.bh + 6} L${view.cx},${d2.by - 10}`, C.dim, { arrow: true });
  const a3 = path(ov, `M${view.cx},${d2.by + d2.bh + 6} L${view.cx},${d3.by - 10}`, C.dim, { arrow: true });
  const t3 = kw('p03', 'dispatchTouchEvent');
  drawIn(t3 - 0.2, a1, 0.3); show(t3, d1, { sfx: 'tick' });
  const t3b = kw('p03', '转换成');
  drawIn(t3b, a2, 0.3); travel(t3b, a2, 0.5, C.upd);
  show(t3b + 0.2, d2, { sfx: 'tick' });
  swap(t3b, me, 'MotionEvent → PointerInputEvent', { sfx: false });
  const t3c = kw('p03', 'PointerInputEventProcessor');
  drawIn(t3c - 0.3, a3, 0.3); travel(t3c - 0.3, a3, 0.5, C.upd);
  show(t3c, d3, { sfx: 'pop' });
  const pipe = [sys, view, d1, d2, d3, pSys, pView, a1, a2, a3, me];

  // ---- p04/p05: hit test down the LayoutNode tree ----
  const t4 = vs('p04');
  tl.to(pipe, { opacity: 0, x: -30, duration: 0.45, ease: 'power2.in' }, t4 - 0.3);
  hide(t4 - 0.3, big);
  const NX = { P: 760, E: 1150, I: 1540 };
  const n = {
    C: nodeCard(L, { x: 1150, y: 250, ty: 'Column', de: '外层布局', col: C.col, sm: true }),
    P: nodeCard(L, { x: NX.P, y: 440, ty: 'Layout', de: 'CounterTile', col: C.a1, sm: true }),
    E: nodeCard(L, { x: NX.E, y: 440, ty: 'BasicText', de: '"Even branch"', col: C.a2, sm: true }),
    I: nodeCard(L, { x: NX.I, y: 440, ty: 'Box', de: 'IncrementControl', col: C.a3, sm: true }),
    T: nodeCard(L, { x: NX.P, y: 620, ty: 'BasicText', de: '"Even 0"', col: C.a1, sm: true }),
    IT: nodeCard(L, { x: NX.I, y: 620, ty: 'BasicText', de: '"+1"', col: C.a3, sm: true }),
  };
  const tov = overlay(L);
  const e = (a, b) => path(tov, edgeD(n[a].B[0], n[a].B[1], n[b].T[0], n[b].T[1]), C.line);
  const E = { CP: e('C', 'P'), CE: e('C', 'E'), CI: e('C', 'I'), PT: e('P', 'T'), IIT: e('I', 'IT') };
  ['C', 'P', 'E', 'I', 'T', 'IT'].forEach((k, i) => show(t4 + 0.1 + i * 0.07, n[k].el, { d: 0.4 }));
  Object.values(E).forEach((p, i) => drawIn(t4 + 0.4 + i * 0.05, p, 0.4));
  sfx(t4, 'whoosh', 0.5);
  // the touch point on the phone
  const cross = div(L, 'xhair', tap[0], tap[1]);
  pop(kw('p04', '坐标'), cross, { s: 2 });
  const lbl = tag(L, `(${Math.round((tap[0] - P.base[0] - 14) / 2)}dp, ${Math.round((tap[1] - P.base[1] - 62) / 2)}dp)`, C.upd, tap[0] + 26, tap[1] - 52, { fs: 18 });
  lbl.classList.add('m');
  show(kw('p04', '坐标') + 0.2, lbl);

  const test = (t, k, rect, hit) => {
    const o = P.outline(rect, hit ? C.nw : C.gone);
    pop(t, o, { s: 1.05, sfx: false });
    hide(t + (hit ? 1.6 : 0.9), o);
    glow(t, n[k], hit ? C.nw : C.gone, hit ? null : 0.9);
    badge(t + 0.05, n[k], hit ? '包含' : '不包含', hit ? C.nw : C.gone);
    sfx(t, hit ? 'ding' : 'remove', hit ? 0.35 : 0.4);
  };
  test(kw('p04', '一层层'), 'C', P.R.C, true);
  test(kw('p05', '卡片'), 'P', P.R.P, false);
  test(kw('p05', '分支'), 'E', P.R.E, false);
  test(kw('p05', '命中'), 'I', P.R.I, true);
  test(kw('p05', 'Box'), 'IT', P.R.IT, false);
  tl.to([n.P.el, n.E.el, n.T.el, n.IT.el, E.CP, E.CE, E.PT, E.IIT], { opacity: 0.3, duration: 0.5 }, ve('p05'));

  // ---- p06: HitPathTracker remembers the path ----
  const t6 = vs('p06');
  const hp = path(tov, edgeD(n.C.B[0], n.C.B[1], n.I.T[0], n.I.T[1]), C.upd, { w: 7 });
  drawIn(t6 + 0.1, hp, 0.6);
  glow(t6 + 0.1, n.C, C.upd, null); glow(t6 + 0.3, n.I, C.upd, null);
  const hpt = blk(L, 'HitPathTracker<small>命中路径：Column → Box</small>', 1450, 250, C.upd, { cls: 'm', fs: 24 });
  show(kw('p06', 'HitPathTracker'), hpt, { sfx: 'tick' });
  const tUp = kw('p06', '抬起');
  finger.up(tUp, tap[0], tap[1]);
  tl.fromTo(finger.el, { x: tap[0], y: tap[1], opacity: 1 }, { x: tap[0], y: tap[1], opacity: 1, duration: 0.01, ...IR }, tUp - 0.02);
  const upChip = chip(L, 'up', C.upd, 1040, 300, { fs: 20 });
  pop(tUp, upChip, { sfx: false });
  travel(tUp + 0.2, hp, 0.8, C.upd, { r: 11, sfx: 'swoosh' });
  const noScan = tag(L, '不用从头再找', C.keep, 1450, 340, { fs: 20 });
  show(kw('p06', '不用'), noScan);

  // ---- p07: ClickableNode lives on the Box ----
  const t7 = vs('p07');
  hide(t7, [upChip, noScan, hpt]);
  const mods = ['width', 'height', 'background', 'clickable', 'padding'];
  const mx0 = 1290, my = 780;
  const mChips = mods.map((m, i) => {
    const c = tag(L, '.' + m + '()', m === 'clickable' ? C.upd : C.ink2, mx0 + i * 0, my, { fs: 19 });
    c.classList.add('m');
    return c;
  });
  let xx = 990;
  mChips.forEach((c) => { c.style.left = xx + 'px'; xx += c.offsetWidth + 10; });
  const modLbl = div(L, 'lbl', 990, my - 40, 'Box 的修饰符');
  const brace = path(tov, `M${n.I.cx},${n.I.y + n.I.h + 4} C${n.I.cx},${my - 50} ${1240},${my - 70} ${1180},${my - 8}`, C.dim, { dash: '6 8' });
  show(kw('p07', 'clickable'), modLbl, { dy: 0 });
  drawIn(kw('p07', 'clickable'), brace);
  mChips.forEach((c, i) => show(kw('p07', 'clickable') + i * 0.06, c, { d: 0.3 }));
  sfx(kw('p07', 'clickable'), 'tick', 0.5);
  const cn = blk(L, 'ClickableNode<small>行为对象 · 不是 LayoutNode</small>', 1430, 640, C.upd, { cls: 'm solid', fs: 26 });
  const cc = mChips[3];
  const toCn = path(ov, `M${cc.offsetLeft + cc.offsetWidth / 2},${my - 4} C${cc.offsetLeft + 40},${700} ${1380},${690} ${cn.bx - 10},${cn.cy}`, C.upd, { arrow: true });
  const tCN = kw('p07', 'ClickableNode');
  drawIn(tCN - 0.3, toCn, 0.4);
  pop(tCN, cn, { s: 0.8 });
  const later = tag(L, 'Modifier 详解 → 第 09 章', C.ink2, 1430, 740, { fs: 18 });
  show(kw('p07', '后面'), later);

  // ---- p08: three passes ----
  const t8 = vs('p08') - 0.2;
  const tree = [n.C.el, n.P.el, n.E.el, n.I.el, n.T.el, n.IT.el, ...Object.values(E), hp, cross, lbl, toCn, cn, later, brace, modLbl, ...mChips];
  tl.to(tree, { opacity: 0, duration: 0.4 }, t8);
  const px = 860, pys = [270, 460, 650];
  const pn = [
    blk(L, 'Column', px, pys[0], C.col, { cls: 'm', w: 300, fs: 26 }),
    blk(L, 'Box', px, pys[1], C.a3, { cls: 'm', w: 300, fs: 26 }),
    blk(L, 'ClickableNode', px, pys[2], C.upd, { cls: 'm solid', w: 300, fs: 26 }),
  ];
  pn.forEach((b, i) => show(t8 + 0.2 + i * 0.1, b, { dx: -20, dy: 0 }));
  const lane = (x, down, label, col, sub) => {
    const yA = pys[0] + 30, yB = pys[2] + 30;
    const p = path(ov, down ? `M${x},${yA} L${x},${yB}` : `M${x},${yB} L${x},${yA}`, col, { w: 5, arrow: true });
    const lb = div(L, 'lbl m', x - 70, pys[2] + 100, `<b style="color:${col}">${label}</b><br><span style="font-size:19px">${sub}</span>`);
    lb.style.textAlign = 'center'; lb.style.width = '140px';
    return { p, lb };
  };
  const lanes = [lane(1290, true, 'Initial', C.a1, '父 → 子'), lane(1490, false, 'Main', C.upd, '子 → 父'), lane(1690, true, 'Final', C.a2, '父 → 子')];
  ['Initial', 'Main', 'Final'].forEach((w, i) => {
    const t = kw('p08', w);
    drawIn(t, lanes[i].p, 0.5);
    show(t, lanes[i].lb);
    travel(t + 0.1, lanes[i].p, 0.7, [C.a1, C.upd, C.a2][i], { sfx: 'swoosh', g: 0.3 });
  });
  const tMain = kw('p08', 'Main', 1);
  const mainBox = div(L, 'hlbox', 1430, 220, '', 120, 560);
  mainBox.style.setProperty('--c', C.upd);
  pop(tMain, mainBox, { s: 1.04 });
  glow(tMain, pn[2], C.upd, null);
  const tMainArrow = path(ov, `M1430,${pys[2] + 30} L${px + 310},${pys[2] + 30}`, C.upd, { arrow: true, w: 4 });
  drawIn(tMain + 0.2, tMainArrow, 0.4);

  // ---- p09: down -> up -> performClick -> onClick ----
  const t9 = vs('p09') - 0.2;
  tl.to([...pn, ...lanes.flatMap((l) => [l.p, l.lb]), mainBox, tMainArrow], { opacity: 0, duration: 0.4 }, t9);
  const Y9 = 330;
  const s1 = blk(L, '<b>down</b><small>消费事件 · 记住按下位置</small>', 760, Y9, C.a1, { fs: 26, w: 300 });
  const s2 = blk(L, '<b>up</b><small>确认是一次有效点击</small>', 1120, Y9, C.a1, { fs: 26, w: 280 });
  const s3 = blk(L, 'performClick()', 1120, Y9 + 200, C.upd, { cls: 'm', fs: 26, w: 280 });
  const s4 = blk(L, 'onClick()', 1480, Y9 + 200, C.keep, { cls: 'm solid', fs: 30, w: 260 });
  const ar = (A, B, horiz) => path(ov, horiz ? `M${A.bx + A.bw + 8},${A.cy} L${B.bx - 12},${B.cy}` : `M${A.cx},${A.by + A.bh + 8} L${B.cx},${B.by - 12}`, C.dim, { arrow: true });
  const r12 = ar(s1, s2, true), r23 = ar(s2, s3, false), r34 = ar(s3, s4, true);
  const tD = kw('p09', '按下');
  finger.down(tD, tap[0], tap[1]);
  show(tD, s1, { sfx: 'tick' });
  const tU = kw('p09', '抬起');
  finger.up(tU, tap[0], tap[1]);
  drawIn(tU - 0.2, r12, 0.3); show(tU, s2, { sfx: 'tick' });
  const tPC = kw('p09', 'performClick');
  drawIn(tPC - 0.3, r23, 0.3); travel(tPC - 0.3, r23, 0.4, C.upd); show(tPC, s3, { sfx: 'tick' });
  const tOC = kw('p09', 'onClick');
  drawIn(tOC - 0.3, r34, 0.3); travel(tOC - 0.3, r34, 0.4, C.upd); pop(tOC, s4, { s: 0.8 });

  // ---- p10: onClick is our increment ----
  const t10 = vs('p10');
  const code = codeBox(L, `
val increment = remember(count) {
    { count.intValue += 1 }
}
…
IncrementControl(onClick = increment)`, { x: 760, y: 680, w: 1000, fs: 24, title: 'Counter.kt' });
  show(t10 - 0.1, code.el, { dy: 20 });
  const h1 = code.hl(5, 5, C.keep), h2 = code.hl(1, 3, C.upd);
  fade(kw('p10', 'onClick'), h1, 1, 0.3);
  fade(kw('p10', 'increment'), h2, 1, 0.3);
  const back = path(ov, `M${s4.cx},${s4.by + s4.bh + 6} C${s4.cx},${640} ${1500},${650} ${1300},${code.y(1) - 18}`, C.keep, { arrow: true, w: 4 });
  drawIn(kw('p10', 'increment'), back, 0.5);
  sfx(kw('p10', 'increment'), 'ding', 0.5);

  hide(t1 - 0.5, [...L.children]);
});
