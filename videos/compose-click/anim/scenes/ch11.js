/* 11 图层与绘制 —— layer 属性 vs 内容录制、DrawModifierNode、display list、对象分层、RenderThread */
H.scene('ch11', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, vs, ve, kw, show, pop, hide, fade, swap, path, drawIn, travel,
    blk, tag, makePhone, IR } = H;
  const ov = overlay(L);

  // ---- g01: a big tile being drawn ----
  const TX = 220, TY = 260, TW = 800, TH = 320;
  const stage = div(L, 'drawstage', TX, TY, '', TW, TH);
  show(body, stage, { s: 0.95 });
  const tile = div(stage, 'dtile', 0, 0, '', TW, TH);
  const tBg = div(tile, 'dbg', 0, 0, '', TW, TH);
  const tBd = div(tile, 'dbd', 0, 0, '', TW, TH);
  const tTx = div(tile, 'dtx', 48, 48, 'Even 0');
  tl.set(tBd, { opacity: 0 }, t0);

  // ---- g02/g03: layer properties ----
  const props = blk(L, 'graphicsLayer<small>alpha = 1 → <b>0.65</b>\nscale = 1 → <b>0.9</b></small>', 1120, 260, C.a2, { cls: 'm', fs: 28 });
  props.querySelector('small').style.whiteSpace = 'pre';
  show(vs('g02'), props, { sfx: 'tick' });
  const tA = kw('g02', '0.65');
  tl.to(tile, { opacity: 0.65, duration: 0.6, ease: 'power2.inOut' }, tA);
  const tS = kw('g02', '0.9');
  tl.to(tile, { scale: 0.9, duration: 0.6, ease: 'power2.inOut' }, tS);
  sfx(tA, 'swoosh', 0.4);
  const direct = tag(L, '属性直接设到图层上', C.a2, 1120, 430, { fs: 22 });
  show(kw('g03', '直接设到'), direct);
  const noRe = tag(L, '只改属性 → 内容不用重画', C.keep, 1120, 480, { fs: 22 });
  show(kw('g03', '不用重画'), noRe, { sfx: 'ding', g: 0.4 });

  // ---- g04: but content changed too ----
  const t4 = vs('g04');
  const chg = blk(L, '这次还变了：<b>边框</b> · <b>内边距</b> · <b>文字</b>', 1120, 560, C.upd, { fs: 26 });
  show(t4 + 0.1, chg, { sfx: 'tick' });
  const rer = tag(L, '→ 内容要重新录制', C.upd, 1120, 650, { fs: 24 });
  show(kw('g04', '重新录制'), rer, { sfx: 'pop', g: 0.4 });
  tl.to([tBg, tTx], { opacity: 0, duration: 0.4 }, kw('g04', '重新录制') + 0.2);

  // ---- g05/g06: record — draw nodes write commands into a display list ----
  const t5 = vs('g05') - 0.2;
  hide(t5, [direct, noRe, chg, rer]);
  const dl = div(L, 'panel', 1120, 200, '<div class="ph">display list · 录制的绘制指令</div>', 680, 520);
  show(t5 + 0.2, dl, { op: 1, sfx: 'whoosh', g: 0.4 });
  hide(t5, props);
  const cmds = [
    ['D · BorderNode', 'drawContent()', C.nw],
    ['T · TextNode', 'drawParagraph("Odd 1") @ (20, 20)', C.a1],
    ['D · BorderNode', 'drawPath(roundRect, stroke 2dp)', C.nw],
  ].map(([who, c, col], i) => {
    const e = div(L, 'cmd', 1150, 270 + i * 120, `<small>${who}</small><span>${c}</span>`);
    e.style.setProperty('--c', col);
    return e;
  });
  const tB = kw('g05', '边框节点'), tT = kw('g05', '文字节点');
  show(tB, cmds[0], { dx: 20, dy: 0, sfx: 'tick' });
  show(tT, cmds[1], { dx: 20, dy: 0, sfx: 'tick' });
  tl.fromTo(tTx, { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, tT + 0.2);
  H.setHtml(t0, tTx, 'Even 0');
  H.setHtml(tT + 0.1, tTx, 'Odd 1');
  tl.set(tTx, { left: 80, top: 80 }, tT + 0.1);
  show(tT + 0.9, cmds[2], { dx: 20, dy: 0, sfx: 'tick' });
  tl.fromTo(tBd, { opacity: 0 }, { opacity: 1, duration: 0.4, ...IR }, tT + 1.0);
  const t6 = vs('g06');
  const notPix = tag(L, '不是像素 · 是指令', C.upd, 1150, 640, { fs: 24 });
  show(kw('g06', '不会立刻'), notPix, { sfx: 'tick' });

  // ---- g07: object layering ----
  const t7 = vs('g07') - 0.2;
  hide(t7, [stage, dl, ...cmds, notPix]);
  const NEST = [
    ['OwnedLayer', 'GraphicsLayerOwnerLayer · CA.layer', C.a2],
    ['GraphicsLayer', 'Compose 图形 API', C.a1],
    ['RenderNode', 'GraphicsLayerV29 · 显示列表 + 属性', C.upd],
  ];
  const NX = 360, NY = 220;
  const nest = NEST.map(([t, s, c], i) => {
    const pad = i * 70;
    const e = div(L, 'ring', NX + pad, NY + pad, `<span>${t} <em>${s}</em></span>`, 1200 - pad * 2, 560 - pad * 2);
    e.style.setProperty('--c', c);
    return e;
  });
  pop(kw('g07', 'RenderNode'), nest[2], { s: 0.9 });
  pop(kw('g07', 'GraphicsLayer'), nest[1], { s: 0.94 });
  pop(kw('g07', 'OwnedLayer'), nest[0], { s: 0.96 });
  const api = tag(L, 'Android 10+ · API 29', C.ink2, NX, NY - 50, { fs: 20 });
  show(kw('g07', 'Android 10'), api);
  const dlist = blk(L, 'display list<small>Odd 1 · border · …</small>', NX + 240, NY + 270, C.upd, { cls: 'm', fs: 24 });
  show(kw('g07', '显示列表'), dlist);
  const notBmp = tag(L, '图层 ≠ Bitmap', C.gone, NX + 860, NY + 260, { fs: 22 });
  show(ve('g07') - 0.6, notBmp, { sfx: 'tick' });

  // ---- g08: properties on RenderNode, applied at composite time ----
  const t8 = vs('g08');
  const pr = blk(L, 'alpha 0.65 · scaleX/Y 0.9 · clip', NX + 600, NY + 330, C.a2, { cls: 'm', fs: 22 });
  show(kw('g08', '透明度'), pr, { sfx: 'tick' });
  const comp = tag(L, '合成时处理 · 不重跑我们的绘制代码', C.keep, NX + 240, NY + 420, { fs: 22 });
  show(kw('g08', '合成时'), comp, { sfx: 'ding', g: 0.4 });

  // ---- g09: RenderThread -> GPU -> screen ----
  const t9 = vs('g09') - 0.2;
  hide(t9, [...nest, api, dlist, notBmp, pr, comp]);
  const chain = [['RenderNode', C.upd], ['RenderThread', C.a1], ['GPU 合成', C.a2], ['屏幕', C.keep]].map(([t, c], i) =>
    blk(L, t, 260 + i * 400, 460, c, { fs: 32, cls: i === 3 ? 'solid' : '' }));
  const arr = chain.slice(0, 3).map((b, i) => path(ov, `M${b.bx + b.bw + 10},${b.cy} L${chain[i + 1].bx - 14},${chain[i + 1].cy}`, C.dim, { arrow: true, w: 4 }));
  const ws = ['渲染线程', 'GPU', '提交到屏幕'];
  chain.forEach((b, i) => {
    const t = i === 0 ? t9 + 0.3 : kw('g09', ws[i - 1]);
    show(t, b, { sfx: 'tick' });
    if (i > 0) { drawIn(t - 0.3, arr[i - 1], 0.3); travel(t - 0.3, arr[i - 1], 0.4, C.upd); }
  });
  const nb = div(L, 'disc', 260, 640, '⚠ applyChanges 返回、dispatchDraw 返回、GPU 完成、像素上屏 —— 不是同一个时刻');
  nb.style.width = '1400px';
  show(kw('g09', '合成之后'), nb);

  // ---- g10: Odd 1 on screen ----
  const t10 = vs('g10') - 0.3;
  hide(t10, [...chain, ...arr, nb]);
  const P = makePhone(L).place(710, 150, 1);
  P.setOdd(t0);
  pop(t10 + 0.2, P.el, { s: 0.85, sfx: 'whoosh' });
  const ol = P.outline(P.R.P, C.keep, 'Odd 1');
  pop(kw('g10', 'Odd 1'), ol, { s: 1.06, sfx: 'ding' });

  hide(t1 - 0.5, [...L.children]);
});
