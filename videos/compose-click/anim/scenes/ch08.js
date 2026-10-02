/* 08 应用：真正动手改树 —— ChangeList、UiApplier 导航、reuse/remove/bottom-up insert、SlotTable 提交 */
H.scene('ch08', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, vs, ve, kw, show, pop, hide, fade, swap, path, drawIn, travel, edgeD,
    blk, tag, nodeCard, badge, glow, IR } = H;
  const ov = overlay(L);

  // ---- a01/a02: composer doesn't touch the tree; it writes a list ----
  const cmp = blk(L, 'Composer<small>重组中</small>', 140, 200, C.a2, { cls: 'm', fs: 30 });
  show(body, cmp, { dx: -20, dy: 0 });
  const treeHint = blk(L, 'LayoutNode 树', 140, 420, C.col, { fs: 28 });
  show(body + 0.2, treeHint);
  const noTouch = path(ov, `M${cmp.cx},${cmp.by + cmp.bh + 8} L${cmp.cx},${treeHint.by - 12}`, C.gone, { dash: '8 8', w: 3 });
  drawIn(kw('a01', '并没有'), noTouch);
  const xx = div(L, 'qmark', cmp.cx + 30, (cmp.by + cmp.bh + treeHint.by) / 2, '✗'); xx.style.fontSize = '44px'; xx.style.color = C.gone;
  pop(kw('a01', '直接去改'), xx, { sfx: 'remove' });
  const listP = div(L, 'panel', 560, 160, '<div class="ph">ChangeList · 示意（不是实测 operation 序列）</div>', 640, 620);
  show(kw('a02', 'ChangeList'), listP, { op: 1, sfx: 'whoosh', g: 0.4 });
  const wr = path(ov, `M${cmp.bx + cmp.bw + 8},${cmp.cy} L${552},${cmp.cy}`, C.a2, { arrow: true });
  drawIn(kw('a02', '记进'), wr, 0.3);

  // ---- a03: list items ----
  const OPS = [
    ['↘', 'down → P', C.col, 'nav'],
    ['♻', 'UseCurrentNode(P) · reuse', C.a1, 'reuse'],
    ['✎', 'UpdateNode(P, SetModifier…)', C.upd, 'upd'],
    ['↗', 'up', C.col, 'nav'],
    ['✕', 'remove(index = 1, count = 1)', C.gone, 'rm'],
    ['＋', 'insert O / O1 / O2', C.nw, 'ins'],
  ];
  const ops = OPS.map(([i, t, c], k) => {
    const e = div(L, 'op', 590, 220 + k * 88, `<i>${i}</i><span>${t}</span>`);
    e.style.setProperty('--c', c);
    return e;
  });
  const opAt = { reuse: kw('a03', '复用卡片'), upd: kw('a03', '更新'), rm: kw('a03', '移除'), ins: kw('a03', '插入') };
  ops.forEach((e, k) => {
    const kind = OPS[k][3];
    const t = kind === 'nav' ? opAt[k === 0 ? 'reuse' : 'rm'] - 0.25 : opAt[kind];
    show(t, e, { dx: 20, dy: 0, d: 0.3, sfx: kind === 'nav' ? false : 'tick', g: 0.4 });
  });

  // ---- a04/a05: Applier ----
  const t4 = vs('a04');
  hide(t4, [noTouch, xx, treeHint, wr]);
  tl.to(cmp, { opacity: 0.3, duration: 0.3 }, t4);
  const comp = blk(L, 'Composition<small>applyChanges()</small>', 140, 380, C.a2, { cls: 'm', fs: 26 });
  show(kw('a04', 'Composition'), comp, { sfx: 'tick' });
  const app = blk(L, 'Applier', 140, 560, C.keep, { cls: 'm solid', fs: 32 });
  pop(kw('a04', 'Applier'), app, { s: 0.8 });
  const ex = path(ov, `M${comp.cx},${comp.by + comp.bh + 6} L${comp.cx},${app.by - 10}`, C.dim, { arrow: true });
  drawIn(kw('a04', '执行'), ex, 0.3);
  const t5 = vs('a05');
  const adapt = tag(L, 'runtime ⇄ 具体 UI 的适配器', C.ink2, 140, 660, { fs: 20 });
  show(kw('a05', '适配器'), adapt);
  swap(kw('a05', 'UiApplier'), app, 'UiApplier<small>AbstractApplier&lt;LayoutNode&gt;</small>');

  // ---- tree on the right ----
  const t6 = vs('a06') - 0.3;
  tl.to(listP, { left: 520, top: 150, scale: 0.78, transformOrigin: '0 0', duration: 0.6, ease: 'power3.inOut' }, t6);
  ops.forEach((e, k) => tl.to(e, { left: 540, top: 205 + k * 68, scale: 0.78, transformOrigin: '0 0', duration: 0.6, ease: 'power3.inOut' }, t6));
  hide(t6, adapt);
  const NX = { P: 1050, E: 1400, I: 1700 };
  const n = {
    C: nodeCard(L, { x: 1400, y: 200, ty: 'Column', de: 'C', col: C.col, sm: true }),
    P: nodeCard(L, { x: 1040, y: 400, ty: 'Layout', de: 'P · CounterTile', col: C.a1, sm: true }),
    E: nodeCard(L, { x: 1360, y: 400, ty: 'BasicText', de: 'E', col: C.a2, sm: true }),
    I: nodeCard(L, { x: 1680, y: 400, ty: 'Box', de: 'I', col: C.a3, sm: true }),
    T: nodeCard(L, { x: 1040, y: 580, ty: 'BasicText', de: 'T', col: C.a1, sm: true }),
    IT: nodeCard(L, { x: 1680, y: 580, ty: 'BasicText', de: 'IT', col: C.a3, sm: true }),
    O: nodeCard(L, { x: 1360, y: 400, ty: 'Column', de: 'O', col: C.nw, sm: true }),
    O1: nodeCard(L, { x: 1250, y: 580, ty: 'BasicText', de: 'O1', col: C.nw, sm: true }),
    O2: nodeCard(L, { x: 1465, y: 580, ty: 'BasicText', de: 'O2', col: C.nw, sm: true }),
  };
  const tov = overlay(L);
  const e = (a, b) => path(tov, edgeD(n[a].B[0], n[a].B[1], n[b].T[0], n[b].T[1]), C.line);
  const E = { CP: e('C', 'P'), CE: e('C', 'E'), CI: e('C', 'I'), PT: e('P', 'T'), IIT: e('I', 'IT'), CO: e('C', 'O') };
  ['C', 'P', 'E', 'I', 'T', 'IT'].forEach((k, i) => show(t6 + 0.2 + i * 0.06, n[k].el, { d: 0.35 }));
  ['CP', 'CE', 'CI', 'PT', 'IIT'].forEach((k, i) => drawIn(t6 + 0.5 + i * 0.05, E[k], 0.4));
  // current pointer
  const curP = div(L, 'curptr', 0, 0, '<span>current</span>');
  const at = (t, k, d = 0.45) => tl.to(curP, { left: n[k].x - 8, top: n[k].y - 8, width: n[k].w + 16, height: n[k].h + 16, duration: d, ease: 'power3.inOut' }, t);
  tl.set(curP, { left: n.C.x - 8, top: n.C.y - 8, width: n.C.w + 16, height: n.C.h + 16 }, t0);
  const tCur = kw('a06', 'current');
  pop(tCur, curP, { s: 1.1, sfx: 'tick' });
  at(kw('a06', 'down'), 'P'); sfx(kw('a06', 'down'), 'swoosh', 0.3);
  at(kw('a06', 'up'), 'C'); sfx(kw('a06', 'up'), 'swoosh', 0.3);
  const cursorLike = tag(L, 'down ↓ / up ↑ · 像在树里移动光标', C.ink2, 1040, 140, { fs: 20 });
  show(kw('a06', '光标'), cursorLike);

  const doneOp = (t, k) => { tl.set(ops[k], { className: 'op done' }, t); };
  const activeOp = (t, k) => tl.fromTo(ops[k], { x: 0 }, { x: 14, duration: 0.2, yoyo: true, repeat: 1, ...IR }, t);

  // ---- a07: reuse P, onReuse before setters ----
  const t7 = vs('a07');
  hide(t7, cursorLike);
  at(kw('a07', '走到卡片'), 'P'); activeOp(kw('a07', '走到卡片'), 0); doneOp(kw('a07', 'reuse'), 0);
  activeOp(kw('a07', 'reuse'), 1);
  glow(kw('a07', 'reuse'), n.P, C.a1, 2.5);
  badge(kw('a07', 'onReuse'), n.P, 'onReuse()', C.a1);
  const order = tag(L, '① onReuse  →  ② setter', C.upd, 1040, 520, { fs: 20 });
  show(kw('a07', '然后才'), order, { sfx: 'tick' });
  doneOp(kw('a07', 'setter'), 1);
  activeOp(kw('a07', 'setter'), 2);
  doneOp(ve('a07'), 2);

  // ---- a08: remove at index 1 ----
  const t8 = vs('a08');
  hide(t8, order);
  at(t8, 'C'); doneOp(t8, 3);
  const idxs = ['P', 'E', 'I'].map((k, i) => { const tg = tag(L, `[${i}]`, C.ink2, n[k].x + 6, n[k].y - 34, { fs: 18 }); tg.classList.add('m'); return tg; });
  show(kw('a08', '下标'), idxs, { st: 0.1, dy: 0 });
  activeOp(kw('a08', 'remove'), 4);
  glow(kw('a08', 'remove'), n.E, C.gone, null);
  const tRm = kw('a08', '没了');
  tl.to([n.E.el, E.CE], { opacity: 0, y: 50, duration: 0.5, ease: 'power2.in' }, tRm - 0.5);
  sfx(tRm - 0.3, 'remove', 0.7);
  doneOp(tRm, 4);

  // ---- a09/a10: bottom-up insert ----
  const t9 = vs('a09');
  activeOp(t9, 5);
  const SY = 300; // staging offset below final position
  const staging = div(L, 'panel', 1220, 670, '<div class="ph">尚未接入 · 自底向上组装</div>', 520, 300);
  show(t9 + 0.1, staging, { op: 1 });
  tl.set([n.O.el, n.O1.el, n.O2.el], { y: SY }, t0);
  pop(t9 + 0.2, n.O.el, { s: 0.6 });
  const kidsT = kw('a09', '先把两行文字');
  const sE1 = path(tov, edgeD(n.O.B[0], n.O.B[1] + SY, n.O1.T[0], n.O1.T[1] + SY), C.nw);
  const sE2 = path(tov, edgeD(n.O.B[0], n.O.B[1] + SY, n.O2.T[0], n.O2.T[1] + SY), C.nw);
  pop(kidsT, [n.O1.el, n.O2.el], { st: 0.2 });
  drawIn(kidsT + 0.3, sE1, 0.4); drawIn(kidsT + 0.5, sE2, 0.4);
  const tJoin = kw('a09', '一次性接进');
  tl.to([n.O.el, n.O1.el, n.O2.el], { y: 0, duration: 0.7, ease: 'power3.inOut' }, tJoin - 0.3);
  tl.to([sE1, sE2], { opacity: 0, duration: 0.2 }, tJoin - 0.3);
  const fE1 = path(tov, edgeD(n.O.B[0], n.O.B[1], n.O1.T[0], n.O1.T[1]), C.nw);
  const fE2 = path(tov, edgeD(n.O.B[0], n.O.B[1], n.O2.T[0], n.O2.T[1]), C.nw);
  drawIn(tJoin + 0.4, fE1, 0.3); drawIn(tJoin + 0.4, fE2, 0.3);
  drawIn(tJoin + 0.3, E.CO, 0.4);
  hide(tJoin, staging);
  sfx(tJoin + 0.3, 'pop', 0.7);
  const ibu = tag(L, 'insertBottomUp(1, O)', C.nw, 1220, 340, { fs: 19 });
  ibu.classList.add('m');
  show(tJoin + 0.4, ibu);
  const t10 = vs('a10');
  glow(kw('a10', 'attach'), n.O, C.nw, 1.5); glow(kw('a10', 'attach'), n.O1, C.nw, 1.5); glow(kw('a10', 'attach'), n.O2, C.nw, 1.5);
  badge(kw('a10', 'attach'), n.O, 'attach ×1', C.nw);
  doneOp(ve('a10'), 5);

  // ---- a11: child count stays 3 ----
  const t11 = vs('a11');
  hide(t11, ibu);
  swap(kw('a11', '始终是 3'), idxs[1], '[1]', { sfx: false });
  tl.set(idxs[1], { left: n.O.x + 6 }, kw('a11', '始终是 3'));
  const three = blk(L, 'C.children.size = <b>3</b>', 1050, 140, C.col, { cls: 'm', fs: 26 });
  show(kw('a11', '孩子数'), three, { sfx: 'ding', g: 0.4 });
  const oneSlot = div(L, 'hlbox', n.O.x - 14, n.O.y - 14, '', n.O.w + 28, n.O.h + 28);
  oneSlot.style.setProperty('--c', C.nw);
  pop(kw('a11', '一个位置'), oneSlot, { s: 1.05, sfx: 'tick' });

  // ---- a12/a13: SlotTable rewritten; rows shift, identity kept ----
  const t12 = vs('a12') - 0.2;
  const left = [listP, ...ops, cmp, comp, app, ex];
  hide(t12, left);
  hide(t12, [oneSlot, three]);
  const rows0 = [['5', 'Even', C.a2], ['6', 'E node', C.a2], ['7', 'I node', C.a3], ['8', 'IT node', C.a3]];
  const RX = 140, RY = 250, RH = 62;
  const rowsEl = rows0.map(([i, nm, c], k) => {
    const r = div(L, 'trow sm', RX, RY + k * RH, `<span class="ri">${i}</span><span class="nm">${nm}</span><span class="da"></span>`);
    r.style.setProperty('--c', c);
    return r;
  });
  const DA = [21, 21, 26, 31];
  rowsEl.forEach((r, k) => H.setHtml(t0, r.querySelector('.da'), `data @ ${DA[k]}`));
  const hdr = div(L, 'lbl m', RX, RY - 46, 'SlotWriter · 正式表（缩减模型）');
  show(t12 + 0.3, hdr);
  show(t12 + 0.4, rowsEl, { st: 0.07, dx: -16, dy: 0, d: 0.3 });
  const tDelR = kw('a12', '删掉');
  tl.to(rowsEl.slice(0, 2), { opacity: 0, x: -60, duration: 0.45, ease: 'power2.in' }, tDelR);
  sfx(tDelR, 'remove', 0.6);
  const tShift = kw('a12', '整体后移');
  tl.to(rowsEl.slice(2), { y: RH * 2, duration: 0.7, ease: 'power3.inOut' }, kw('a12', '插进来') - 0.3);
  const newRows = [['5', 'Odd'], ['6', 'O node'], ['7', 'O1 node'], ['8', 'O2 node']].map(([i, nm], k) => {
    const r = div(L, 'trow sm', RX, RY + k * RH, `<span class="ri">${i}</span><span class="nm">${nm}</span><span class="da">data @ ${[21, 21, 26, 31][k]}</span>`);
    r.style.setProperty('--c', C.nw);
    return r;
  });
  show(kw('a12', '插进来'), newRows, { st: 0.12, dx: 30, dy: 0, d: 0.35, sfx: 'pop', g: 0.4 });
  // later rows: indexes change
  [[2, '9', 36], [3, '10', 41]].forEach(([k, ni, nd]) => {
    swap(tShift, rowsEl[k].querySelector('.ri'), ni, { color: C.upd, sfx: false });
    swap(tShift + 0.1, rowsEl[k].querySelector('.da'), `data @ ${nd}`, { color: C.upd, sfx: false });
  });
  sfx(tShift, 'swoosh', 0.4);
  const t13 = vs('a13');
  const iRow = rowsEl[2];
  const ref = path(ov, `M${RX + 560},${RY + 4 * RH + RH / 2 - 4} C${900},${RY + 4 * RH} ${1500},${560} ${n.I.L[0] - 10},${n.I.L[1]}`, C.keep, { arrow: true, w: 4 });
  drawIn(kw('a13', '引用'), ref, 0.6);
  glow(kw('a13', '原来那个'), n.I, C.keep, 2.5);
  badge(kw('a13', '原来那个'), n.I, '同一个对象', C.keep);
  const three2 = ['行号', '地址', '对象身份'].map((w, k) => tag(L, w, [C.upd, C.upd, C.keep][k], RX + k * 170, 820, { fs: 26 }));
  ['行号', '地址', '对象身份'].forEach((w, k) => show(kw('a13', w, w === '行号' ? 1 : 0), three2[k], { sfx: 'tick', g: 0.4 }));
  const neq = div(L, 'lbl', RX, 880, '三回事'); neq.style.fontSize = '28px'; neq.style.color = '#e6edf7';
  show(kw('a13', '三回事'), neq, { sfx: 'ding', g: 0.4 });

  hide(t1 - 0.5, [...L.children]);
});
