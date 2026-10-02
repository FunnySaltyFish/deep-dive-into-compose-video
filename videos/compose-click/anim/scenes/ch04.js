/* 04 调度：等到下一帧 */
H.scene('ch04', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, vs, ve, kw, show, pop, hide, fade, swap, path, drawIn, march, travel, blk, tag, chip, IR } = H;
  const ov = overlay(L);

  // ---- d01: who tells Counter? ----
  const wr = blk(L, 'count.intValue = 1<small>写入完成</small>', 160, 200, C.upd, { cls: 'm', fs: 28 });
  const ctr = blk(L, 'Counter 的作用域 RC', 1440, 200, C.a2, { cls: 'm', fs: 28 });
  show(body, wr, { dx: -20, dy: 0 });
  show(body + 0.2, ctr, { dx: 20, dy: 0 });
  const gapP = path(ov, `M${wr.bx + wr.bw + 14},${wr.cy} L${ctr.bx - 14},${ctr.cy}`, C.dim, { dash: '12 12', w: 3 });
  drawIn(body + 0.4, gapP);
  const q = div(L, 'qmark', 960, 236, '?'); q.style.fontSize = '64px';
  pop(kw('d01', '谁来'), q);

  // ---- d02: GlobalSnapshotManager + channel(1) ----
  const t2 = vs('d02');
  hide(t2, q);
  const gsm = blk(L, 'GlobalSnapshotManager<small>全局写入观察者</small>', 160, 360, C.a1, { cls: 'm', fs: 26 });
  show(kw('d02', 'GlobalSnapshotManager'), gsm, { sfx: 'tick' });
  const w1 = path(ov, `M${wr.bx + 120},${wr.by + wr.bh + 6} L${wr.bx + 120},${gsm.by - 10}`, C.upd, { arrow: true });
  drawIn(kw('d02', '观察者') - 0.2, w1, 0.3);
  // channel with capacity 1
  const ch = div(L, 'chan', 640, 370, '<div class="slot"></div><span>Channel · 容量 1</span>');
  show(kw('d02', '通道'), ch, { sfx: 'tick' });
  const sig = div(L, 'sig', 0, 0, '');
  const tSig = kw('d02', '信号');
  tl.fromTo(sig, { left: 520, top: 404, opacity: 0, scale: 0.4 }, { left: 663, top: 404, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', ...IR }, tSig - 0.2);
  sfx(tSig, 'pop', 0.5);

  // ---- d03: main-thread coroutine -> sendApplyNotifications, many writes merge ----
  const t3 = vs('d03');
  const co = blk(L, '主线程协程<small>AndroidUiDispatcher.Main</small>', 1000, 360, C.a3, { fs: 26 });
  show(t3, co, { sfx: 'tick' });
  const c2 = path(ov, `M${840},${404} L${co.bx - 10},${co.cy}`, C.dim, { arrow: true });
  drawIn(t3 + 0.2, c2, 0.3);
  tl.to(sig, { left: 990, opacity: 0, duration: 0.5, ease: 'power2.in' }, kw('d03', '收到'));
  const san = blk(L, 'Snapshot.sendApplyNotifications()', 1000, 500, C.a3, { cls: 'm solid', fs: 24 });
  show(kw('d03', 'sendApplyNotifications'), san, { sfx: 'pop' });
  // many writes collapse into one signal
  const tMany = kw('d03', '连续写');
  const ws = [0, 1, 2, 3, 4].map((i) => { const c = chip(L, 'write', C.upd, 300 + i * 44, 560 + (i % 2) * 14, { fs: 16 }); return c; });
  ws.forEach((w, i) => pop(tMany + i * 0.1, w, { sfx: i === 0 ? 'tick' : false }));
  ws.forEach((w, i) => tl.to(w, { left: 663, top: 400, opacity: i === 0 ? 1 : 0, scale: i === 0 ? 0.9 : 0.5, duration: 0.5, ease: 'power2.in' }, kw('d03', '合并') + i * 0.05));
  const one = tag(L, '合并成 1 次通知', C.keep, 620, 470, { fs: 22 });
  show(kw('d03', '合并') + 0.4, one, { sfx: 'ding', g: 0.35 });

  // ---- d04: Recomposer -> Composition ----
  const t4 = vs('d04') - 0.2;
  hide(t4, [...ws, one, ch, sig, c2, w1]);
  tl.to([gsm, co], { opacity: 0.3, duration: 0.4 }, t4);
  const rec = blk(L, 'Recomposer<small>一直在监听</small>', 1000, 660, C.keep, { cls: 'm', fs: 30 });
  const comp = blk(L, 'Composition', 1460, 660, C.a2, { cls: 'm', fs: 30 });
  const s1 = path(ov, `M${san.cx},${san.by + san.bh + 6} L${san.cx},${rec.by - 10}`, C.a3, { arrow: true });
  drawIn(kw('d04', 'Recomposer') - 0.2, s1, 0.3);
  show(kw('d04', 'Recomposer'), rec, { sfx: 'tick' });
  const s2 = path(ov, `M${rec.bx + rec.bw + 8},${rec.cy} L${comp.bx - 12},${comp.cy}`, C.dim, { arrow: true });
  const tC = kw('d04', 'Composition');
  drawIn(tC - 0.2, s2, 0.3); travel(tC - 0.2, s2, 0.4, C.upd);
  show(tC, comp, { sfx: 'tick' });
  const changed = tag(L, 'changed = { count }', C.upd, rec.bx + rec.bw + 18, rec.by - 40, { fs: 18 });
  changed.classList.add('m');
  show(tC - 0.1, changed);

  // ---- d05: lookup observations, invalidate RC ----
  const t5 = vs('d05');
  const look = blk(L, 'observations<small>count → RC</small>', 1460, 820, C.upd, { cls: 'm', fs: 24 });
  const l1 = path(ov, `M${comp.cx},${comp.by + comp.bh + 6} L${comp.cx - 50},${look.by - 10}`, C.dim, { arrow: true });
  drawIn(kw('d05', '查表'), l1, 0.3);
  show(kw('d05', '查表') + 0.1, look, { sfx: 'tick' });
  const inv = path(ov, `M${look.bx + look.bw + 8},${look.cy} C1880,${look.cy} 1880,${ctr.cy} ${ctr.bx + ctr.bw + 10},${ctr.cy}`, C.gone, { arrow: true, w: 4 });
  const tInv = kw('d05', '失效');
  drawIn(tInv - 0.6, inv, 0.6); travel(tInv - 0.6, inv, 0.6, C.gone);
  swap(tInv, ctr, 'Counter 的作用域 RC · <b style="color:var(--gone)">失效</b>', { sfx: false });
  sfx(tInv, 'remove', 0.6);
  tl.set(ctr, { '--c': C.gone }, tInv);

  // ---- d06: still only bookkeeping ----
  const t6 = vs('d06');
  const ledger = tag(L, '只是记账 · 屏幕和 UI 树都没动', C.ink2, 160, 900, { fs: 26 });
  show(t6, ledger, { sfx: 'tick' });

  // ---- d07..d09: frame timeline ----
  const t7 = vs('d07') - 0.3;
  hide(t7, [wr, gsm, co, san, rec, comp, look, s1, s2, l1, inv, changed, ledger, gapP]);
  tl.to(ctr, { left: 160, top: 220, duration: 0.6, ease: 'power3.inOut' }, t7);
  const fy = 520, fx0 = 160, fw = 1600, fN = 6, step = fw / fN;
  const axis = path(ov, `M${fx0},${fy} L${fx0 + fw},${fy}`, C.dim, { w: 3 });
  drawIn(t7 + 0.3, axis, 0.6);
  const ticks = [];
  for (let i = 0; i <= fN; i++) {
    const x = fx0 + i * step;
    const tk = div(L, 'vtick', x, fy - 16, '', 2, 32);
    const lb = div(L, 'lbl m', x - 26, fy + 26, `帧 ${i}`); lb.style.fontSize = '18px';
    ticks.push(tk, lb);
  }
  show(t7 + 0.4, ticks, { st: 0.03, dy: 0, d: 0.3 });
  const vs1 = div(L, 'lbl', fx0 + fw - 260, fy - 70, 'Choreographer 帧回调'); vs1.style.color = C.a1;
  show(t7 + 0.6, vs1);
  const fc = blk(L, 'Recomposer<small>withFrameNanos { … }</small>', 760, 220, C.keep, { cls: 'm', fs: 26 });
  const tFc = kw('d07', '帧时钟');
  show(tFc, fc, { sfx: 'tick' });
  const book = path(ov, `M${fc.cx},${fc.by + fc.bh + 6} C${fc.cx},${fy - 80} ${fx0 + step * 2},${fy - 120} ${fx0 + step * 2},${fy - 22}`, C.keep, { arrow: true, w: 4 });
  const tBook = kw('d07', '预约');
  drawIn(tBook, book, 0.6);
  const mark = div(L, 'fmark', fx0 + step * 2 - 18, fy - 18, '', 36, 36);
  pop(tBook + 0.5, mark, { sfx: 'ding', g: 0.35 });

  // d08: no periodic scanning
  const t8 = vs('d08');
  const scans = [0, 1].map((i) => div(L, 'scan', fx0 + i * step + 18, fy - 60, '全量扫描？', step - 36, 40));
  show(t8 + 0.2, scans, { st: 0.12, sfx: 'tick' });
  const tNo = kw('d08', '不会');
  scans.forEach((s, i) => tl.to(s, { opacity: 0.25, duration: 0.3 }, tNo + 0.4 + i * 0.1));
  const xx = scans.map((s, i) => { const x = div(L, 'qmark', fx0 + i * step + step / 2, fy - 40, '✗'); x.style.fontSize = '44px'; x.style.color = C.gone; return x; });
  xx.forEach((x, i) => pop(tNo + 0.4 + i * 0.1, x, { sfx: i ? false : 'remove' }));
  const idle = tag(L, '没有失效 → 什么也不做', C.ink2, fx0 + 10, fy + 80, { fs: 22 });
  show(kw('d08', '没有失效'), idle);

  // d09: next frame -> mutable snapshot -> recompose
  const t9 = vs('d09');
  const ph = div(L, 'playhead', fx0, fy - 40, '', 4, 80);
  tl.fromTo(ph, { left: fx0, opacity: 1 }, { left: fx0 + step * 2, duration: 1.2, ease: 'power2.inOut', ...IR }, t9 - 0.6);
  tl.set(ph, { opacity: 0 }, t1);
  sfx(t9 + 0.6, 'tick', 0.6);
  hide(t9 + 0.4, [...scans, ...xx, idle]);
  const snap = div(L, 'snapbox', fx0 + step * 2 + 30, fy + 90, '<div class="ph">可变快照 · MutableSnapshot</div>', 760, 230);
  show(kw('d09', '可变快照'), snap, { op: 1, sfx: 'whoosh', g: 0.5 });
  const rcIn = blk(L, 'Counter 的作用域 RC<small>重新执行</small>', fx0 + step * 2 + 80, fy + 160, C.a2, { cls: 'm solid', fs: 26 });
  const tRe = kw('d09', '重新执行');
  tl.to(ctr, { opacity: 0, duration: 0.3 }, tRe - 0.2);
  pop(tRe, rcIn, { s: 0.8 });
  const word = blk(L, '重组 · Recomposition', fx0 + step * 2 + 470, fy + 166, C.keep, { cls: 'solid', fs: 30 });
  pop(kw('d09', '这，就是重组'), word, { sfx: 'ding', g: 0.6 });

  hide(t1 - 0.5, [...L.children]);
});
