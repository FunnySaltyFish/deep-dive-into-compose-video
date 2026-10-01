/* 10 测量与放置 —— 失效标记、约束向内、尺寸向外、border/scale 不影响布局、Column placement、缓存 */
H.scene('ch10', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, vs, ve, kw, show, pop, hide, fade, swap, path, drawIn, travel,
    blk, tag, makePhone, IR } = H;
  const ov = overlay(L);

  // ---- l01/l02: requests ----
  const P = makePhone(L).place(110, 170, 0.8);
  P.setEven(t0);
  show(body, P.el, { dx: -30, dy: 0 });
  const reasons = [blk(L, 'padding 12 → 20', 760, 220, C.a3, { cls: 'm', fs: 26 }), blk(L, '分支 1 行 → 2 行', 760, 320, C.a2, { fs: 26 })];
  show(kw('l01', '内边距'), reasons[0], { sfx: 'tick' });
  show(kw('l01', '分支'), reasons[1], { sfx: 'tick' });
  const flags = [['P', 'measurePending'], ['C', 'measurePending'], ['O', 'measurePending']].map(([n, f], i) =>
    blk(L, `${n} · <b>${f}</b>`, 1150, 200 + i * 80, C.upd, { cls: 'm', fs: 22 }));
  show(kw('l02', '标记'), flags, { st: 0.15, sfx: 'tick', g: 0.4 });
  const mld = blk(L, 'MeasureAndLayoutDelegate<small>收集 · 绘制之前统一处理</small>', 1150, 460, C.keep, { cls: 'm solid', fs: 26 });
  show(kw('l02', 'MeasureAndLayoutDelegate'), mld, { sfx: 'pop' });
  flags.forEach((f, i) => tl.to(f, { left: 1170 + i * 20, top: 470 + i * 6, opacity: 0, scale: 0.6, duration: 0.5, ease: 'power2.in' }, kw('l02', '统一处理') + i * 0.08));

  // ---- l03..l06: constraints in, sizes out ----
  const t3 = vs('l03') - 0.3;
  hide(t3, [P.el, ...reasons, mld]);
  const CX = 960, CY = 560;
  const W0 = 1000, H0 = 400; // 200x80 at 5px/dp
  const box = (w, h, color, label, cls = '') => {
    const e = div(L, 'mbox ' + cls, CX - w / 2, CY - h / 2, `<span>${label}</span>`, w, h);
    e.style.setProperty('--c', color);
    return e;
  };
  const outer = box(W0, H0, C.a1, 'width / height → 200 × 80');
  const inner = box(W0 - 2 * 60, H0 - 2 * 60, C.a3, '176 × 56');
  const scaleNote = div(L, 'lbl', CX - W0 / 2, CY - H0 / 2 - 70, '示意比例 · 1dp = 5px · 示意密度 1');
  show(t3 + 0.2, scaleNote);
  const cin = div(L, 'clbl', CX - W0 / 2 - 260, CY - 120, '约束 ↓ 由外向内');
  const cout = div(L, 'clbl out', CX + W0 / 2 + 30, CY - 120, '尺寸 ↑ 由内向外');
  show(kw('l03', '从外往内'), cin, { sfx: 'tick' });
  pop(kw('l03', '200×80'), outer, { s: 0.9, sfx: 'pop' });
  // l04
  const gl = tag(L, 'graphicsLayer · 原样传递', C.a2, CX - W0 / 2 + 20, CY - H0 / 2 + 50, { fs: 20 });
  show(kw('l04', '原样'), gl);
  pop(kw('l04', '176×56'), inner, { s: 0.95, sfx: 'pop' });
  const pd = tag(L, 'padding 12', C.a3, CX - W0 / 2 + 6, CY - 18, { fs: 18 });
  show(kw('l04', '176×56'), pd);
  const tShrink = kw('l04', '160×40');
  tl.to(inner, { left: CX - (W0 - 200) / 2, top: CY - (H0 - 200) / 2, width: W0 - 200, height: H0 - 200, duration: 0.8, ease: 'power3.inOut' }, tShrink - 0.5);
  swap(tShrink - 0.1, inner.querySelector('span'), '160 × 40', { color: C.upd });
  swap(tShrink - 0.4, pd, 'padding 20', { sfx: false });
  sfx(tShrink - 0.5, 'whoosh', 0.4);
  // l05: text lays out, size reports outward
  const txt = div(L, 'mtxt', CX - (W0 - 200) / 2 + 10, CY - (H0 - 200) / 2 + 10, 'Odd 1');
  show(kw('l05', '排版'), txt, { sfx: 'tick' });
  const tUp = kw('l05', '往外报告');
  const ups = [0, 1, 2].map((i) => {
    const a = path(ov, `M${CX + 200},${CY - 60 - i * 60} L${CX + W0 / 2 + 20},${CY - 60 - i * 60}`, C.keep, { arrow: true, w: 3 });
    return a;
  });
  ups.forEach((a, i) => { drawIn(tUp + i * 0.15, a, 0.35); });
  show(tUp, cout, { sfx: 'swoosh', g: 0.4 });
  const res = tag(L, '卡片对外：200 × 80（不变）', C.keep, CX + W0 / 2 - 360, CY + H0 / 2 + 24, { fs: 24 });
  show(kw('l05', '仍然是'), res, { sfx: 'ding', g: 0.4 });
  // l06: border & scale don't change layout
  const t6 = vs('l06');
  const bd = div(L, 'mborder', CX - W0 / 2, CY - H0 / 2, '', W0, H0);
  pop(kw('l06', '边框'), bd, { s: 1, sfx: 'tick' });
  const bdT = tag(L, 'border：只是画上去的', C.a1, CX - W0 / 2, CY + H0 / 2 + 24, { fs: 22 });
  show(kw('l06', '画上去'), bdT);
  const ghost = div(L, 'mghost', CX - W0 * 0.45, CY - H0 * 0.45, '', W0 * 0.9, H0 * 0.9);
  pop(kw('l06', '缩放'), ghost, { s: 1.1, sfx: 'tick' });
  const scT = tag(L, 'scale 0.9：只影响绘制', C.upd, CX - W0 / 2 + 340, CY - H0 / 2 - 34, { fs: 22 });
  show(kw('l06', '缩放'), scT);
  const same = tag(L, '布局尺寸 200 × 80 · 始终没变', C.keep, CX - 200, CY + H0 / 2 + 70, { fs: 24 });
  show(kw('l06', '始终没变'), same, { sfx: 'ding', g: 0.4 });

  // ---- l07..l09: Column placement ----
  const t7 = vs('l07') - 0.3;
  hide(t7, [outer, inner, txt, cin, cout, ...ups, res, bd, bdT, ghost, scT, same, gl, pd, scaleNote]);
  const P2 = makePhone(L).place(160, 140, 0.95);
  P2.setEven(t0);
  show(t7 + 0.2, P2.el, { dx: -20, dy: 0, sfx: 'whoosh', g: 0.4 });
  const pos = (r) => P2.pt(r[0], r[1]);
  const coords = [
    ['P', P2.R.P, '(16, 16)', C.a1], ['E', P2.R.E, '(16, 104)', C.a2], ['I', P2.R.I, '(16, 112 + H_E)', C.a3],
  ].map(([k, r, t, c]) => {
    const [x, y] = P2.pt(r[0] + r[2] + 14, r[1] + r[3] / 2);
    const e = tag(L, `${k} ${t}`, c, x, y - 16, { fs: 20 });
    e.classList.add('m');
    return e;
  });
  show(t7 + 0.4, coords, { st: 0.12 });
  const sameTile = tag(L, '卡片尺寸没变 → 位置不变', C.keep, 820, 220, { fs: 24 });
  show(kw('l07', '卡片尺寸没变'), sameTile, { sfx: 'tick' });
  const tOdd = kw('l07', '两行');
  P2.setOdd(tOdd);
  sfx(tOdd, 'pop', 0.5);
  swap(tOdd, coords[1], 'O (16, 104)', { sfx: false });
  const hc = tag(L, 'Column 内容高度变了', C.a2, 820, 290, { fs: 24 });
  show(kw('l07', '内容高度'), hc, { sfx: 'tick' });
  // l08: move I down; tween the button for emphasis (rewind then animate)
  const t8 = kw('l08', '往下挪');
  const I0 = 208 + H.LINE + 16, I1 = 208 + 2 * H.LINE + 16;
  tl.set(P2.btn, { top: I0 }, tOdd + 0.01);
  tl.to(P2.btn, { top: I1, duration: 0.7, ease: 'power3.inOut' }, t8 - 0.2);
  const [ix0, iy0] = P2.pt(P2.R.I[0] + P2.R.I[2] + 14, P2.R.I[1] + P2.R.I[3] / 2);
  tl.to(coords[2], { top: iy0 - 16 + H.LINE * 0.95, duration: 0.7, ease: 'power3.inOut' }, t8 - 0.2);
  swap(t8 + 0.4, coords[2], 'I (16, 112 + H_O)', { color: C.upd });
  sfx(t8 - 0.2, 'whoosh', 0.5);
  const pl = blk(L, 'placement<small>Column 的 placeRelative 重新执行</small>', 820, 380, C.a3, { cls: 'm', fs: 26 });
  show(kw('l08', '放置阶段'), pl, { sfx: 'tick' });
  const sk = tag(L, '组合被跳过 ≠ 布局被跳过', C.upd, 820, 500, { fs: 26 });
  show(kw('l08', '照样更新'), sk, { sfx: 'ding', g: 0.4 });
  // l09: text offset 12 -> 20
  const off = blk(L, '文字偏移  (12, 12) → <b style="color:var(--upd)">(20, 20)</b>', 820, 580, C.a1, { cls: 'm', fs: 26 });
  show(kw('l09', '偏移'), off, { sfx: 'tick' });
  const olT = P2.outline(P2.R.T, C.upd);
  pop(kw('l09', '20'), olT, { s: 1.1, sfx: false });

  // ---- l10: cache ----
  const t10 = vs('l10');
  hide(t10, olT);
  const cache = blk(L, '约束没变 + 没有 pending → 直接用缓存', 820, 700, C.keep, { fs: 26, cls: 'solid' });
  show(kw('l10', '缓存'), cache, { sfx: 'ding', g: 0.4 });
  const kept = ['I', 'IT'].map((k, i) => {
    const e = tag(L, `${k} · cached ✓`, C.keep, 820 + i * 230, 790, { fs: 20 });
    e.classList.add('m');
    return e;
  });
  show(kw('l10', '不必'), kept, { st: 0.15 });

  hide(t1 - 0.5, [...L.children]);
});
