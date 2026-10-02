/* 05 重组：Counter 再执行一遍 —— 编译器改写、SlotTable 初见、按位置对照 */
H.scene('ch05', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, seg, vs, ve, kw, show, pop, hide, fade, move, swap, path, drawIn, travel,
    blk, tag, chip, codeBox, logicTable, IR } = H;
  const ov = overlay(L);

  // ---- r01: the question ----
  const src = codeBox(L, `
@Composable
fun Counter() {
    val count = remember { mutableIntStateOf(0) }
    val n = count.intValue
    …
}`, { x: 140, y: 200, w: 760, fs: 26, title: '你写的' });
  show(body, src.el, { dx: -30, dy: 0 });
  const hR = src.hl(3, 3, C.keep);
  fade(kw('r01', 'remember'), hR, 1, 0.3);
  const same = blk(L, '同一个 count？', 1040, 230, C.keep, { fs: 32 });
  const fresh = blk(L, '新建一个，又从 0 开始？', 1040, 340, C.gone, { fs: 32 });
  show(kw('r01', '同一个'), same, { sfx: 'tick' });
  show(kw('r01', '新建'), fresh, { sfx: 'tick' });

  // ---- r02/r03: compiler rewrite ----
  const t2 = vs('r02');
  hide(t2, [same, fresh]);
  const comp = div(L, 'compiler', 960, 360, '<span>Compose 编译器</span>');
  pop(kw('r02', '编译器'), comp, { sfx: 'whoosh', g: 0.5 });
  const low = codeBox(L, `
fun Counter(composer: Composer, changed: Int) {
    composer.startRestartGroup(K_COUNTER)
    val count = composer.cache { mutableIntStateOf(0) }
    val n = count.intValue
    …
    composer.endRestartGroup()?.updateScope { c, _ ->
        Counter(c, changed or 1)
    }
}`, { x: 1080, y: 200, w: 780, fs: 21, title: '编译后 · 示意，不是反编译结果' });
  show(kw('r02', '改写') - 0.1, low.el, { dx: 30, dy: 0, sfx: 'swoosh', g: 0.4 });
  const flow = path(ov, `M905,${src.y(2)} C990,${src.y(2)} 990,${low.y(1)} 1074,${low.y(1)}`, C.upd, { arrow: true, w: 4 });
  drawIn(kw('r02', '改写'), flow, 0.6);
  const hP = low.hl(1, 1, C.upd);
  fade(kw('r02', 'Composer'), hP, 1, 0.3);
  const hG = [low.hl(2, 2, C.a2), low.hl(6, 6, C.a2)];
  const tG = kw('r03', 'startRestartGroup');
  fade(tG, hG, 1, 0.3); sfx(tG, 'tick', 0.4);
  const hC = low.hl(3, 3, C.keep);
  fade(kw('r03', 'remember'), hC, 1, 0.3);
  const cacheT = tag(L, 'remember → 读写缓存', C.keep, 1500, low.top(3) - 2, { fs: 18 });
  show(kw('r03', '读写缓存'), cacheT);

  // ---- r04/r05: SlotTable appears ----
  const t4 = vs('r04') - 0.2;
  hide(t4, [src.el, hR, comp, flow, cacheT, hP, ...hG, hC]);
  tl.to([low.el], { left: 100, top: 170, scale: 0.86, duration: 0.7, ease: 'power3.inOut', transformOrigin: '0 0' }, t4);
  const tblTitle = blk(L, 'SlotTable<small>组合的记忆</small>', 1100, 160, C.keep, { cls: 'm solid', fs: 30 });
  const tST = kw('r04', 'SlotTable');
  pop(tST, tblTitle, { s: 0.8 });
  const gL = tag(L, 'group · 执行到了哪个位置', C.a2, 1100, 270, { fs: 22 });
  const sL = tag(L, 'slot · 这个位置记住的数据', C.ink2, 1440, 270, { fs: 22 });
  show(kw('r05', 'group'), gL, { sfx: 'tick' });
  show(kw('r05', 'slot'), sL, { sfx: 'tick' });

  // ---- r06/r07: first composition fills the table ----
  const rows = [
    { id: 'G_Counter', label: 'Counter', col: C.a2, depth: 0, slots: ['RC', 'S0 = count', 'increment'] },
    { id: 'G_Column', label: 'Column', col: C.col, depth: 1, node: true, slots: ['→ C'] },
    { id: 'G_Reuse', label: 'ReusableContent', col: C.a1, depth: 2, slots: ['key=true', '"Even"'] },
    { id: 'G_P', label: 'CounterTile', col: C.a1, depth: 3, node: true, slots: ['→ P'] },
    { id: 'G_T', label: 'BasicText', col: C.a1, depth: 4, node: true, slots: ['→ T'] },
    { id: 'G_Even', label: 'if (even)', col: C.a2, depth: 2, slots: [] },
    { id: 'G_E', label: 'BasicText', col: C.a2, depth: 3, node: true, slots: ['→ E'] },
    { id: 'G_I', label: 'IncrementControl', col: C.a3, depth: 2, node: true, slots: ['→ I'] },
    { id: 'G_IT', label: 'BasicText', col: C.a3, depth: 3, node: true, slots: ['→ IT'] },
  ];
  const TX = 1100, TY = 340;
  const T = logicTable(L, TX, TY, rows, { rh: 58, indent: 30 });
  const tFill = vs('r06');
  show(tFill + 0.1, T.G_Counter.el, { dx: -20, dy: 0, sfx: 'pop', g: 0.4 });
  const sl0 = T.G_Counter.sl;
  tl.set(sl0, { opacity: 0 }, t0);
  [['作用域', 0], ['count', 1], ['increment', 2]].forEach(([w, i]) => {
    const t = kw('r06', w);
    tl.fromTo(sl0[i], { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)', ...IR }, t);
    sfx(t, 'tick', 0.45);
  });
  const t7 = vs('r07');
  rows.slice(1).forEach((r, i) => show(t7 + 0.15 + i * 0.22, T[r.id].el, { dx: -20, dy: 0, d: 0.35, sfx: i % 2 ? false : 'tick', g: 0.3 }));
  const nodeRef = tag(L, '→ LayoutNode 引用', C.keep, TX + 560, T.G_P.y + 6, { fs: 20 });
  show(kw('r07', 'LayoutNode'), nodeRef);
  const nodeSlots = ['G_Column', 'G_P', 'G_T', 'G_E', 'G_I', 'G_IT'].map((k) => T[k].sl[0]);
  tl.fromTo(nodeSlots, { boxShadow: 'inset 0 0 0 1.5px #2b3850' }, { boxShadow: `inset 0 0 0 2.5px ${C.keep}`, duration: 0.3, stagger: 0.08, ...IR }, kw('r07', 'LayoutNode'));

  // ---- r08..r11: second execution with a reader cursor ----
  const t8 = vs('r08') - 0.2;
  hide(t8, [nodeRef, gL, sL]);
  const cur = div(L, 'cursor', TX - 10, T.G_Counter.cy, '');
  cur.style.setProperty('--c', C.upd);
  const curL = tag(L, 'SlotReader', C.upd, TX - 200, T.G_Counter.cy - 18, { fs: 18 });
  curL.classList.add('m');
  const tCur = kw('r08', '读取游标');
  pop(tCur, [cur, curL], { sfx: 'tick' });
  const exec = tag(L, '第二次执行 · n 将读到 1', C.upd, 100, 610, { fs: 22 });
  show(t8 + 0.3, exec);
  const hl1 = low.hl(2, 2, C.upd);
  tl.set(hl1, { opacity: 0 }, t0);
  // remember hit
  const t9 = kw('r09', 'remember');
  tl.to(hl1, { opacity: 1, duration: 0.2 }, t8 + 0.4);
  tl.to(hl1, { top: low.pt + 2 * low.lh, duration: 0.3 }, t9 - 0.1);
  const s0 = sl0[1];
  const hit = tag(L, '命中 ✓', C.nw, 0, 0, { fs: 20 });
  const tHit = kw('r09', '直接取回');
  tl.set(hit, { left: TX + 400, top: T.G_Counter.y - 34 }, t0);
  pop(tHit, hit, { sfx: 'ding', g: 0.45 });
  tl.fromTo(s0, { boxShadow: 'inset 0 0 0 1.5px #2b3850' }, { boxShadow: `inset 0 0 0 3px ${C.nw}`, duration: 0.25, ...IR }, tHit);
  const same2 = tag(L, '还是原来那个 S0', C.keep, 100, 660, { fs: 22 });
  show(kw('r09', '原来那个'), same2);
  // n = 1, even = false
  const t10 = vs('r10');
  tl.to(hl1, { top: low.pt + 3 * low.lh, duration: 0.3 }, t10);
  const nv = blk(L, 'n = <b>1</b>   even = <b style="color:var(--gone)">false</b>', 100, 720, C.upd, { cls: 'm', fs: 28 });
  show(kw('r10', 'n'), nv, { sfx: 'tick' });
  // increment key hit
  const t11 = kw('r11', 'increment');
  const inc = sl0[2];
  const hit2 = tag(L, 'key = count 没变 ✓', C.nw, 0, 0, { fs: 18 });
  tl.set(hit2, { left: TX + 400, top: T.G_Counter.y - 66 }, t0);
  pop(kw('r11', '命中'), hit2, { sfx: 'ding', g: 0.4 });
  tl.fromTo(inc, { boxShadow: 'inset 0 0 0 1.5px #2b3850' }, { boxShadow: `inset 0 0 0 3px ${C.nw}`, duration: 0.25, ...IR }, kw('r11', '命中'));
  tl.to(cur, { top: T.G_Counter.cy, duration: 0.2 }, t11);

  // ---- r12: position = identity ----
  const t12 = vs('r12');
  hide(t12 - 0.1, [hit, hit2, exec, same2, nv, hl1, curL, cur]);
  tl.to([low.el], { opacity: 0.2, duration: 0.4 }, t12);
  const pos = div(L, 'stmt', 0, 0, '代码的<em>位置</em>，就是身份');
  pos.style.width = '900px'; pos.style.left = '100px'; pos.style.top = '520px'; pos.style.textAlign = 'left';
  show(kw('r12', '代码的位置'), pos, { sfx: 'ding', g: 0.5 });
  // ripple of row index tags
  const idx = rows.map((r, i) => { const e = tag(L, `#${i}`, C.ink2, TX - 64, T[r.id].y + 8, { fs: 16 }); e.classList.add('m'); return e; });
  show(kw('r12', '调用位置'), idx, { st: 0.05, dy: 0, d: 0.3 });

  hide(t1 - 0.5, [...L.children]);
});
