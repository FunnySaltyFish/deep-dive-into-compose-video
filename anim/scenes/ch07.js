/* 07 比较：哪些留下，哪些替换 —— ReusableContent 回收、普通分支删除/插入、跳过 */
H.scene('ch07', (L, { t0, t1, body }) => {
  const { tl, C, div, overlay, sfx, vs, ve, kw, show, pop, hide, fade, swap, path, drawIn, travel, edgeD,
    blk, tag, nodeCard, badge, glow, codeBox, logicTable, IR } = H;
  const ov = overlay(L);

  // ---- left: code ; right: logical slot table with a reader cursor ----
  const code = codeBox(L, `
Column {
    ReusableContent(even) {
        val prefix = remember { if (even) "Even" else "Odd" }
        CounterTile(label = "$prefix $n", …)
    }
    if (even) {
        BasicText("Even branch")
    } else {
        Column { BasicText("Odd branch"); BasicText("Extra line") }
    }
    IncrementControl(onClick = increment)
}`, { x: 90, y: 150, w: 900, fs: 21, title: 'Counter.kt · 第二次执行（n = 1）' });
  show(body, code.el, { dx: -30, dy: 0 });

  const rows = [
    { id: 'G_Reuse', label: 'ReusableContent', col: C.a1, depth: 0, slots: ['key=true', '"Even"'] },
    { id: 'G_P', label: 'CounterTile', col: C.a1, depth: 1, node: true, slots: ['→ P'] },
    { id: 'G_T', label: 'BasicText', col: C.a1, depth: 2, node: true, slots: ['→ T'] },
    { id: 'G_Even', label: 'if (even)', col: C.a2, depth: 0, slots: [] },
    { id: 'G_E', label: 'BasicText', col: C.a2, depth: 1, node: true, slots: ['→ E'] },
    { id: 'G_I', label: 'IncrementControl', col: C.a3, depth: 0, node: true, slots: ['→ I'] },
    { id: 'G_IT', label: 'BasicText', col: C.a3, depth: 1, node: true, slots: ['→ IT'] },
  ];
  const TX = 1110, TY = 200, RH = 64;
  const T = logicTable(L, TX, TY, rows, { rh: RH, indent: 30 });
  const tblT = div(L, 'lbl m', TX, TY - 50, '旧 SlotTable · Column 内部');
  show(body + 0.2, tblT);
  rows.forEach((r, i) => show(body + 0.3 + i * 0.07, T[r.id].el, { dx: 20, dy: 0, d: 0.3 }));
  const cur = div(L, 'cursor', TX - 12, T.G_Reuse.cy, ''); cur.style.setProperty('--c', C.upd);
  const curTo = (t, id) => tl.to(cur, { top: T[id].cy, duration: 0.35, ease: 'power2.inOut' }, t);

  // ---- m01/m02 ----
  const rule = blk(L, '同一个位置 + 同一个 key = 同一个东西', 90, 820, C.keep, { fs: 30, cls: 'solid' });
  show(kw('m02', '同一个位置'), rule, { sfx: 'ding', g: 0.45 });
  pop(kw('m02', '对照旧表'), cur, { sfx: 'tick' });

  // ---- m03..m06: ReusableContent ----
  const t3 = vs('m03');
  hide(t3, rule);
  const hRe = code.hl(2, 5, C.a1);
  fade(t3 + 0.1, hRe, 1, 0.3);
  const keyCode = tag(L, 'key = even', C.a1, 560, code.top(2) + 2, { fs: 18 });
  show(kw('m03', 'key'), keyCode);
  const tOld = kw('m04', 'true');
  const kOld = T.G_Reuse.sl[0];
  tl.fromTo(kOld, { boxShadow: 'inset 0 0 0 1.5px #2b3850' }, { boxShadow: `inset 0 0 0 3px ${C.a1}`, duration: 0.2, ...IR }, tOld);
  const kNew = tag(L, '新 key = false', C.gone, TX + 470, T.G_Reuse.y + 6, { fs: 20 });
  pop(kw('m04', 'false'), kNew, { sfx: 'tick' });
  const tRec = kw('m04', '回收模式');
  const recMode = div(L, 'recycle', TX - 24, T.G_Reuse.y - 12, '<span>回收模式 · reusing</span>', 700, RH * 3 - 2);
  pop(tRec, recMode, { s: 1.03, sfx: 'whoosh', g: 0.5 });
  swap(tRec + 0.3, kOld, 'key=false', { sfx: false });
  hide(tRec + 0.5, kNew);
  // remember treated as empty -> "Odd"
  const hRem = code.hl(3, 3, C.upd);
  const tEmpty = kw('m05', '当作空的');
  fade(kw('m05', 'remember'), hRem, 1, 0.3);
  const pre = T.G_Reuse.sl[1];
  tl.to(pre, { opacity: 0.25, duration: 0.25 }, tEmpty);
  const empt = tag(L, 'Composer.Empty', C.ink2, TX + 470, T.G_Reuse.y + 6, { fs: 18 });
  empt.classList.add('m');
  show(tEmpty, empt);
  const tOdd = kw('m05', 'Odd');
  swap(tOdd - 0.2, pre, '"Odd"', { color: C.upd });
  tl.to(pre, { opacity: 1, duration: 0.2 }, tOdd - 0.06);
  hide(tOdd, empt);
  // nodes kept
  const t6 = vs('m06');
  curTo(t6, 'G_P');
  const keep = ['G_P', 'G_T'].map((k) => T[k].sl[0]);
  tl.fromTo(keep, { boxShadow: 'inset 0 0 0 1.5px #2b3850' }, { boxShadow: `inset 0 0 0 3px ${C.keep}`, duration: 0.25, stagger: 0.15, ...IR }, kw('m06', 'LayoutNode'));
  const kT = tag(L, '可复用 · P / T 保留', C.keep, TX + 340, T.G_P.y + 6, { fs: 20 });
  show(kw('m06', '复用'), kT, { sfx: 'ding', g: 0.4 });
  const life = tag(L, '重置生命周期 → onReuse', C.upd, TX + 340, T.G_T.y + 6, { fs: 20 });
  show(kw('m06', '生命周期'), life, { sfx: 'tick' });

  // ---- m07..m10: ordinary if/else ----
  const t7 = vs('m07');
  fade(t7, [hRe, hRem], 0);
  hide(t7, keyCode);
  const hIf = code.hl(6, 10, C.a2);
  fade(t7 + 0.1, hIf, 1, 0.3);
  curTo(t7 + 0.2, 'G_Even');
  const twoPos = [code.hl(7, 7, C.a2), code.hl(9, 9, C.a2)];
  const tDiff = kw('m07', '不同的位置');
  fade(tDiff, hIf, 0.2, 0.3); fade(tDiff, twoPos, 1, 0.3);
  const pA = tag(L, '位置 A', C.a2, 820, code.top(7) + 2, { fs: 18 }), pB = tag(L, '位置 B', C.a2, 860, code.top(9) + 2, { fs: 18 });
  show(tDiff, [pA, pB], { st: 0.2, sfx: 'tick' });
  // delete even group
  const tDel = kw('m08', '整段删除');
  const evRows = [T.G_Even.el, T.G_E.el];
  tl.to(evRows, { '--c': C.gone, duration: 0.2 }, tDel - 0.5);
  const delBox = div(L, 'delbox', TX - 14, T.G_Even.y - 6, '', 560, RH * 2 - 4);
  pop(tDel - 0.4, delBox, { s: 1.02, sfx: false });
  tl.to([...evRows, delBox], { opacity: 0, x: 60, duration: 0.5, ease: 'power2.in' }, tDel + 0.2);
  sfx(tDel + 0.2, 'remove', 0.7);
  const eGone = tag(L, '连同节点 E', C.gone, TX + 380, T.G_Even.y + 30, { fs: 20 });
  show(kw('m08', '节点 E'), eGone);
  hide(kw('m08', '节点 E') + 1.6, eGone);
  // move later rows down to make space for odd group (4 rows)
  const tIns = kw('m09', '全新的');
  tl.to([T.G_I.el, T.G_IT.el], { y: RH * 2, duration: 0.6, ease: 'power3.inOut' }, tIns - 0.6);
  const odd = logicTable(L, TX, TY + RH * 3, [
    { id: 'G_Odd', label: 'else', col: C.nw, depth: 0, slots: [] },
    { id: 'G_O', label: 'Column', col: C.nw, depth: 1, node: true, slots: ['→ O 新建'] },
    { id: 'G_O1', label: 'BasicText', col: C.nw, depth: 2, node: true, slots: ['→ O1 新建'] },
    { id: 'G_O2', label: 'BasicText', col: C.nw, depth: 2, node: true, slots: ['→ O2 新建'] },
  ], { rh: RH, indent: 30 });
  ['G_Odd', 'G_O', 'G_O1', 'G_O2'].forEach((k, i) => show(tIns + i * 0.18, odd[k].el, { dx: 30, dy: 0, d: 0.35, sfx: i ? false : 'pop' }));
  const insT = tag(L, 'insertTable · 待插入', C.nw, TX + 120, TY + RH * 3 + 6, { fs: 20 });
  show(tIns + 0.5, insT);
  // E is not O1
  const t10 = vs('m10');
  const eCard = nodeCard(L, { x: 140, y: 700, ty: 'BasicText', de: 'E · 位置 A', col: C.gone, sm: true });
  const oCard = nodeCard(L, { x: 560, y: 700, ty: 'BasicText', de: 'O1 · 位置 B', col: C.nw, sm: true });
  show(t10, [eCard.el, oCard.el], { st: 0.15, sfx: 'tick' });
  const neq = div(L, 'qmark', 450, 740, '≠'); neq.style.fontSize = '64px'; neq.style.color = C.gone;
  pop(kw('m10', '不会'), neq, { sfx: 'remove' });

  // ---- m11/m12: IncrementControl skipped ----
  const t11 = vs('m11');
  hide(t11 - 0.1, [eCard.el, oCard.el, neq, pA, pB, ...twoPos, hIf]);
  const hInc = code.hl(11, 11, C.a3);
  fade(t11, hInc, 1, 0.3);
  tl.to(cur, { top: T.G_I.cy + RH * 2, duration: 0.35 }, t11 + 0.2);
  const same = tag(L, 'increment 没变', C.a3, 140, 720, { fs: 22 });
  show(kw('m11', '没变'), same, { sfx: 'tick' });
  const skip = blk(L, 'skipToGroupEnd()<small>函数体整个跳过</small>', 140, 770, C.a3, { cls: 'm', fs: 26 });
  show(kw('m11', '跳过'), skip, { sfx: 'swoosh', g: 0.4 });
  const skipArrow = path(ov, `M${TX - 40},${T.G_I.cy + RH * 2} C${TX - 80},${T.G_I.cy + RH * 2 + 40} ${TX - 80},${T.G_IT.cy + RH * 2 + 30} ${TX - 30},${T.G_IT.cy + RH * 2 + 30}`, C.a3, { arrow: true, w: 4 });
  drawIn(kw('m11', '跳过'), skipArrow, 0.5);
  tl.to(cur, { top: T.G_IT.cy + RH * 2 + 40, duration: 0.5, ease: 'power2.in' }, kw('m11', '跳过') + 0.1);
  const mv = tag(L, '但它的位置，还得往下挪 ↓', C.upd, 140, 880, { fs: 24 });
  show(kw('m12', '往下挪'), mv, { sfx: 'tick' });
  tl.fromTo([T.G_I.el, T.G_IT.el], { boxShadow: '0 0 0 0 rgba(251,191,36,0)' }, { boxShadow: '0 0 0 3px rgba(251,191,36,.6)', duration: 0.3, yoyo: true, repeat: 1, ...IR }, kw('m12', '往下挪'));

  hide(t1 - 0.5, [...L.children]);
});
