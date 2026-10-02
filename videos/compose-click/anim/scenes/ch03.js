/* 03 状态：count 从 0 变成 1 */
H.scene('ch03', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, seg, vs, ve, kw, show, pop, hide, fade, move, swap, path, drawIn, march, travel,
    blk, chip, tag, codeBox, makePhone, IR } = H;
  const ov = overlay(L);

  // ---- s01: the increment lambda ----
  const code = codeBox(L, `
val increment = remember(count) {
    { count.intValue += 1 }
}`, { x: 120, y: 190, w: 800, fs: 28, title: 'increment' });
  show(body, code.el, { dx: -30, dy: 0 });
  const hInc = code.hl(2, 2, C.upd);
  fade(kw('s01', 'count.intValue'), hInc, 1, 0.3);
  sfx(kw('s01', 'count.intValue'), 'tick', 0.5);

  // ---- s02: captures the object, not the number ----
  const obj = blk(L, '<b>count</b><small>状态对象</small>', 1040, 190, C.keep, { cls: 'm solid', fs: 30, w: 760 });
  const num = blk(L, '<b>n = 0</b><small>第一次组合时读到的数字</small>', 1040, 330, C.ink2, { cls: 'm', fs: 30, w: 420 });
  const capY = code.y(2);
  const cap = path(ov, `M${920},${capY} C${980},${capY} ${980},${obj.cy} ${obj.bx - 10},${obj.cy}`, C.keep, { arrow: true, w: 4 });
  const tObj = kw('s02', '状态对象');
  show(tObj - 0.3, obj, { dx: 20, dy: 0, sfx: 'pop' });
  drawIn(tObj, cap, 0.5);
  const capT = tag(L, '捕获', C.keep, 950, (capY + obj.cy) / 2 - 18, { fs: 18 });
  show(tObj + 0.3, capT);
  const tNum = kw('s02', '数字 n');
  show(tNum - 0.2, num, { dx: 20, dy: 0, sfx: 'tick' });
  const no = tag(L, '✗ 没有捕获', C.gone, 1480, 352, { fs: 20 });
  pop(tNum + 0.3, no, { sfx: 'remove' });

  // ---- s03: SnapshotMutableIntStateImpl + StateRecord ----
  const t3 = vs('s03');
  hide(t3, [num, no]);
  swap(kw('s03', 'SnapshotMutableIntStateImpl'), obj, '<b>count</b> = SnapshotMutableIntStateImpl<small>对象本身一直是同一个</small>');
  const rec = blk(L, 'StateRecord<small>当前快照可见的记录</small>', 1040, 420, C.a1, { cls: 'm', fs: 28, w: 460 });
  const val = blk(L, '<span class="v">0</span>', 1540, 412, C.a1, { cls: 'bigv', w: 150 });
  val.style.textAlign = 'center';
  const link = path(ov, `M1270,${obj.by + obj.bh + 4} L1270,${rec.by - 10}`, C.a1, { arrow: true });
  const tRec = kw('s03', 'StateRecord');
  drawIn(tRec - 0.2, link, 0.3);
  show(tRec, rec, { sfx: 'pop' });
  show(tRec + 0.25, val, { s: 0.7 });
  const valLbl = div(L, 'lbl', 1545, 512, 'value');
  show(tRec + 0.3, valLbl);

  // ---- s04: read & write ----
  const snap = tag(L, '当前快照', C.a2, 1040, 610, { fs: 22 });
  const rd = path(ov, `M1100,605 L1100,${rec.by + rec.bh + 8}`, C.a2, { arrow: true });
  const rdT = div(L, 'lbl m', 1120, 548, 'readable()');
  const tRd = kw('s04', '读的时候');
  show(tRd, snap, { sfx: 'tick' }); drawIn(tRd + 0.2, rd, 0.3); show(tRd + 0.3, rdT);
  const cmp = blk(L, 'intValue = 1<small>旧值 0 ≠ 新值 1 → 写入</small>', 1300, 600, C.upd, { cls: 'm', fs: 26, w: 480 });
  show(kw('s04', '比较'), cmp, { sfx: 'tick' });
  const tW = kw('s04', '写进');
  swap(tW, val.querySelector('.v'), '1', { color: C.upd });
  tl.fromTo(val, { scale: 1 }, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1, ...IR }, tW + 0.1);
  sfx(tW, 'ding', 0.4);

  // ---- s05: why records & snapshots ----
  const t5 = vs('s05');
  hide(t5 - 0.1, [snap, rd, rdT, cmp]);
  const box5 = div(L, 'panel', 1040, 590, '<div class="ph">示意 · 多版本</div>', 760, 290);
  show(t5 + 0.1, box5, { op: 1 });
  const vA = blk(L, '版本 · value = 0', 1080, 650, C.a1, { cls: 'm', fs: 24 });
  const vB = blk(L, '版本 · value = 1', 1080, 760, C.a1, { cls: 'm', fs: 24 });
  const sA = tag(L, '快照 A', C.a2, 1560, 664, { fs: 22 });
  const sB = tag(L, '快照 B', C.a3, 1560, 774, { fs: 22 });
  const pA = path(ov, `M1550,682 L${vA.bx + vA.bw + 10},${vA.cy}`, C.a2, { arrow: true });
  const pB = path(ov, `M1550,792 L${vB.bx + vB.bw + 10},${vB.cy}`, C.a3, { arrow: true });
  const tDiff = kw('s05', '隔离');
  show(tDiff - 0.6, [vA, vB], { st: 0.15, sfx: 'tick' });
  show(tDiff, [sA, sB], { st: 0.2 });
  drawIn(tDiff + 0.2, pA, 0.35); drawIn(tDiff + 0.4, pB, 0.35);
  const db = tag(L, '≈ 数据库事务', C.ink2, 1560, 840, { fs: 20 });
  show(kw('s05', '数据库'), db, { sfx: 'tick' });

  // ---- s06: nothing re-executed yet ----
  const t6 = vs('s06');
  const all5 = [box5, vA, vB, sA, sB, pA, pB, db];
  hide(t6 - 0.1, all5);
  const dimSet = [code.el, obj, rec, val, valLbl, link, cap, capT];
  fade(kw('s06', '可是'), dimSet, 0.18);
  const P = makePhone(L).place(760, 150, 0.85);
  P.setEven(t0);
  show(kw('s06', '屏幕'), P.el, { dy: 30, sfx: 'whoosh', g: 0.4 });
  const olT = P.outline(P.R.P, C.upd, '还是 Even 0');
  pop(kw('s06', 'Even 0'), olT, { s: 1.06 });
  const notRun = blk(L, 'Counter()<small>一行代码都还没有重新执行</small>', 1300, 420, C.gone, { cls: 'm', fs: 30 });
  show(kw('s06', 'Counter'), notRun, { sfx: 'tick' });

  // ---- s07: the state doesn't know its readers ----
  const t7 = vs('s07');
  hide(t7 - 0.1, [P.el, olT, notRun]);
  fade(t7, [obj, rec, val, valLbl, link], 1);
  const qs = [[1060, 140], [1500, 128], [1760, 150]].map(([x, y]) => {
    const q = div(L, 'qmark', x, y, '?'); q.style.fontSize = '54px'; return q;
  });
  qs.forEach((q, i) => pop(kw('s07', '谁在用') + i * 0.15, q, { sfx: i ? false : 'pop' }));
  const comp = blk(L, '依赖关系 ← 组合过程', 1040, 610, C.a2, { fs: 30, cls: 'solid' });
  show(kw('s07', '组合过程'), comp, { sfx: 'tick' });

  // ---- s08: back to the first composition ----
  const t8 = vs('s08') - 0.3;
  hide(t8, [code.el, cap, capT, rec, val, valLbl, link, comp, ...qs]);
  swap(t8 + 0.1, obj, '<b>count</b><small>S0 · value = 0（第一次组合时）</small>', { sfx: false });
  const cc = codeBox(L, `
@Composable
fun Counter() {
    val count = remember { mutableIntStateOf(0) }
    val n = count.intValue
    val even = n % 2 == 0
    val increment = remember(count) { … }
    Column {
        CounterTile(label = "$prefix $n", …)
        if (even) … else …
        IncrementControl(onClick = increment)
    }
}`, { x: 120, y: 170, w: 840, fs: 24, title: 'Counter.kt · 第一次组合' });
  show(t8 + 0.2, cc.el, { dx: -30, dy: 0, sfx: 'whoosh', g: 0.4 });
  const hN = cc.hl(4, 4, C.keep);
  const tN = kw('s08', 'val n');
  fade(tN, hN, 1, 0.3);
  const rp = path(ov, `M640,${cc.y(4)} C900,${cc.y(4)} 900,${obj.cy} ${obj.bx - 10},${obj.cy}`, C.keep, { arrow: true, w: 4 });
  drawIn(tN + 0.2, rp, 0.5);
  travel(tN + 0.2, rp, 0.6, C.keep, { sfx: 'swoosh', g: 0.3 });
  const obs = tag(L, '读取被观察到', C.keep, 905, (cc.y(4) + obj.cy) / 2 + 6, { fs: 20 });
  show(kw('s08', '观察'), obs);

  // ---- s09: RecomposeScope ----
  const hScope = cc.hl(2, 12, C.a2);
  const tSc = kw('s09', '重组作用域');
  fade(tSc, hScope, 0.6, 0.4);
  const rc = blk(L, 'RecomposeScope · <b>RC</b><small>= Counter 的函数体</small>', 120, cc.top(13) + 24, C.a2, { cls: 'm solid', fs: 26 });
  show(kw('s09', 'RecomposeScope'), rc, { sfx: 'pop' });

  // ---- s10: the observation record ----
  const ob = blk(L, 'observations<small>count  →  RC（Counter）</small>', 1040, 380, C.upd, { cls: 'm', fs: 30, w: 560 });
  const t10 = vs('s10');
  show(t10 + 0.2, ob, { sfx: 'ding', g: 0.4 });
  const o1 = path(ov, `M1320,${obj.by + obj.bh + 4} L1320,${ob.by - 10}`, C.upd, { arrow: true });
  const o2 = path(ov, `M${ob.bx - 8},${ob.cy + 20} C900,${ob.cy + 80} 760,${rc.cy} ${rc.bx + rc.bw + 10},${rc.cy}`, C.upd, { arrow: true });
  drawIn(t10 + 0.3, o1, 0.3); drawIn(t10 + 0.5, o2, 0.6);

  // ---- s11: children receive plain values ----
  const t11 = vs('s11');
  const kids = [
    ['CounterTile', 'label: String', C.a1], ['if (even)', 'Boolean', C.a2], ['IncrementControl', 'onClick: () → Unit', C.a3],
  ].map(([a, b, c], i) => blk(L, `${a}<small>${b}</small>`, 1040 + i * 280, 610, c, { cls: 'm', fs: 22, w: 260 }));
  show(kw('s11', '卡片'), kids, { st: 0.15, sfx: 'tick' });
  const nr = kids.map((k) => {
    const p = path(ov, `M${k.cx},${k.by - 6} L${k.cx},${ob.by + ob.bh + 18}`, C.gone, { dash: '6 8', w: 3 });
    return p;
  });
  const tNo = kw('s11', '没有直接读');
  nr.forEach((p, i) => drawIn(tNo + i * 0.1, p));
  const xs = kids.map((k) => { const x = div(L, 'qmark', k.cx, (k.by + ob.by + ob.bh) / 2 + 4, '✗'); x.style.fontSize = '38px'; x.style.color = C.gone; return x; });
  xs.forEach((x, i) => pop(tNo + 0.2 + i * 0.1, x, { sfx: i ? false : 'remove' }));
  const only = tag(L, '依赖只在这里', C.a2, rc.bx + rc.bw + 20, rc.by + 14, { fs: 22 });
  const tOnly = kw('s11', '依赖只登记');
  pop(tOnly, only);
  tl.fromTo(rc, { scale: 1 }, { scale: 1.05, duration: 0.18, yoyo: true, repeat: 1, ...IR }, tOnly);

  hide(t1 - 0.5, [...L.children]);
});
