/* FE Prep — app shell: state, spaced repetition, sessions, views. No dependencies. */
(function () {
  'use strict';
  const FE = window.FE, H = FE.H;
  const DAY = 864e5, KEY = 'feprep.v1', VERSION = '1.0.0';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TPL = Object.fromEntries(FE.TEMPLATES.map((t) => [t.id, t]));
  const DRL = Object.fromEntries(FE.DRILLS.map((t) => [t.id, t]));
  const REPORT = (FE.VERIFY_REPORT && FE.VERIFY_REPORT.items) || {};
  const AW = (a) => (a.lo + a.hi) / 2;
  const AVG_W = FE.AREAS.reduce((s, a) => s + AW(a), 0) / FE.AREAS.length;
  const MISTAKES = [['concept', 'Concept'], ['setup', 'Setup'], ['math', 'Math slip'], ['units', 'Units'], ['calc', 'Calculator'], ['lookup', 'Handbook lookup'], ['misread', 'Misread'], ['time', 'Ran out of time']];
  const LEVEL_NAMES = ['Untested', 'Started', 'Learning', 'Solid', 'Strong', 'Exam-ready'];
  const ymd = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const pct = (x) => Math.round(x * 100);

  // ================= state =================
  function fresh() {
    return { v: 1, created: Date.now(), settings: { goalMin: 10, newPerDay: 8, paceSec: 180, examDate: '', drillsInSessions: true, theme: 'auto' },
      cards: {}, log: [], verify: {}, keys: {}, bookCounts: {}, bookSkip: {}, reports: [], xp: 0, daily: {}, current: null, session: null, lastBackup: 0 };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) { const f = fresh(); return Object.assign(f, s, { settings: Object.assign(f.settings, s.settings || {}) }); }
    } catch (e) { /* ignore */ }
    return fresh();
  }
  let S = load();
  let storageOK = true;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; } catch (e) { storageOK = false; toast('Progress couldn’t be saved on this device. Export a backup from More.'); }
  }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ignore */ }

  // ================= item keys =================
  // g:<templateId>  d:<drillId>  b:<set>:<problemNumber>
  function P(k) {
    const [kind, a, b] = k.split(':');
    if (kind === 'g') return { kind: 'gen', id: a, t: TPL[a] };
    if (kind === 'd') return { kind: 'drill', id: a, t: DRL[a] };
    return { kind: 'book', set: a, num: +b };
  }
  const setOf = (k) => { const p = P(k); return p.kind === 'book' ? p.set : p.t ? p.t.set : null; };
  const areaOf = (k) => { const s = setOf(k); return s && FE.SET_BY_ID[s] ? FE.SET_BY_ID[s].area : null; };
  const vStatus = (k) => (S.verify[k] && S.verify[k].status) || 'new';
  function usable(k) {
    const p = P(k);
    if (p.kind === 'book') return true;
    return !!p.t && vStatus(k) === 'ok';
  }
  function bookUsed(set) {
    return new Set([...Object.keys(S.cards).filter((k) => k.startsWith('b:' + set + ':')).map((k) => +k.split(':')[2]), ...(S.bookSkip[set] || [])]);
  }
  function nextBookNum(set) {
    const used = bookUsed(set), max = S.bookCounts[set] || 99;
    for (let n = 1; n <= max; n++) if (!used.has(n)) return n;
    return null;
  }
  function itemTitle(k) {
    const p = P(k);
    if (p.kind === 'book') { const st = FE.SET_BY_ID[p.set]; return `Book ${p.set} #${p.num}`; }
    return p.t ? p.t.title : k;
  }

  // ================= spaced repetition =================
  function startOfDay(t) { const d = new Date(t); d.setHours(4, 0, 0, 0); if (d.getTime() > t) d.setDate(d.getDate() - 1); return d.getTime(); }
  function nextIvl(c, r) {
    c = c || { ivl: 0, ease: 2.5, reps: 0 };
    if (r === 1) return 0;
    if (!c.reps) return r === 2 ? 1 : r === 3 ? 2 : 4;
    const base = Math.max(1, c.ivl);
    const v = r === 2 ? base * 1.2 : r === 3 ? base * c.ease : base * c.ease * 1.3;
    return Math.min(365, Math.max(1, Math.round(v)));
  }
  function schedule(k, r, now = Date.now()) {
    const c = S.cards[k] || { ivl: 0, ease: 2.5, reps: 0, lapses: 0, first: now };
    if (r === 1) { c.lapses++; c.reps = 0; c.ivl = 0; c.due = now + 10 * 60000; c.ease = Math.max(1.3, c.ease - 0.2); }
    else {
      const iv = nextIvl(c, r);
      if (c.reps) { if (r === 2) c.ease = Math.max(1.3, c.ease - 0.15); if (r === 4) c.ease = Math.min(3.2, c.ease + 0.15); }
      c.ivl = iv; c.reps++; c.due = startOfDay(now) + iv * DAY;
    }
    c.last = now;
    S.cards[k] = c;
  }
  const ivlLabel = (d) => (d === 0 ? '10 min' : d === 1 ? '1 day' : d < 30 ? `${d} days` : d < 365 ? `${Math.round(d / 30)} mo` : '1 yr');

  // ================= mastery, readiness, xp =================
  function setStats(set, now = Date.now()) {
    const L = S.log.filter((e) => e.set === set);
    if (!L.length) return { m: 0, level: 0, n: 0, acc: 0 };
    const rec = L.slice(-12);
    let ws = 0, acc = 0;
    rec.forEach((e, i) => { const w = Math.pow(0.85, rec.length - 1 - i); ws += w; acc += w * (e.ok ? (e.conf === 'guess' ? 0.5 : 1) : 0); });
    acc /= ws;
    const okKeys = new Set(L.filter((e) => e.ok).map((e) => e.k));
    const coverage = Math.min(1, okKeys.size / 4 + L.length / 40);
    const cards = Object.entries(S.cards).filter(([k]) => setOf(k) === set);
    const ret = cards.length ? cards.filter(([, c]) => now - c.due < Math.max(1, c.ivl) * DAY).length / cards.length : 1;
    const m = acc * coverage * (0.6 + 0.4 * ret);
    const level = m >= 0.9 ? 5 : m >= 0.75 ? 4 : m >= 0.55 ? 3 : m >= 0.35 ? 2 : 1;
    return { m, level, n: L.length, acc: L.filter((e) => e.ok).length / L.length };
  }
  function areaStats(id) {
    const sets = FE.SETS.filter((s) => s.area === id).map((s) => setStats(s.id));
    const m = sets.reduce((a, s) => a + s.m, 0) / sets.length;
    const L = S.log.filter((e) => e.area === id);
    return { m, n: L.length, acc: L.length ? L.filter((e) => e.ok).length / L.length : 0, secs: L.length ? L.reduce((a, e) => a + e.secs, 0) / L.length : 0 };
  }
  function readiness() {
    let num = 0, den = 0;
    for (const a of FE.AREAS) { num += AW(a) * areaStats(a.id).m; den += AW(a); }
    return num / den;
  }
  const xpNeed = (L) => 50 * L * (L + 1);
  function level(xp = S.xp) { let L = 1; while (xp >= xpNeed(L)) L++; const lo = xpNeed(L - 1) * (L > 1 ? 1 : 0); return { L, into: xp - lo, span: xpNeed(L) - lo }; }
  function xpFor(e) {
    if (!e.ok) return 2;
    const a = FE.AREA_BY_ID[e.area];
    let x = 10 * Math.min(1.6, Math.max(0.6, AW(a) / AVG_W));
    if (e.conf === 'sure') x += 4;
    if (e.secs <= S.settings.paceSec) x += 4;
    if (!e.hints) x += 2;
    if (e.kind === 'drill') x *= 0.6;
    return Math.round(x);
  }
  const today = () => S.daily[ymd()] || { secs: 0, n: 0, fresh: 0 };
  const newToday = () => today().fresh || 0;
  const dueNow = () => Object.entries(S.cards).filter(([k, c]) => c.due <= Date.now() && usable(k)).length;

  // ================= variants =================
  const vcache = new Map();
  function variant(k, seed) {
    const id = k + '#' + seed;
    if (!vcache.has(id)) { const p = P(k); vcache.set(id, FE.makeVariant(p.t, seed)); }
    return vcache.get(id);
  }
  const newSeed = () => (Math.random() * 4294967296) >>> 0;

  // ================= sessions =================
  function startSession(o) {
    S.session = { mode: o.mode, limit: o.limit, scope: o.scope || null, kinds: o.kinds || null, start: Date.now(), secs: 0, n: 0, ok: 0, xp: 0, recent: [] };
    advance();
  }
  function inScope(k, s) {
    if (!usable(k)) return false;
    const p = P(k);
    if (s.kinds && !s.kinds.includes(p.kind)) return false;
    if (!s.kinds && p.kind === 'drill' && !S.settings.drillsInSessions) return false;
    if (s.scope && s.scope.set && setOf(k) !== s.scope.set) return false;
    if (s.scope && s.scope.area && areaOf(k) !== s.scope.area) return false;
    return true;
  }
  function pickW(opts) { const t = opts.reduce((a, o) => a + o.w, 0); let x = Math.random() * t; for (const o of opts) { x -= o.w; if (x <= 0) return o.k; } return opts[opts.length - 1].k; }
  function pickNew(s) {
    const kinds = s.kinds || ['book', 'gen', 'drill'].filter((x) => x !== 'drill' || S.settings.drillsInSessions);
    let areas = FE.AREAS;
    if (s.scope && s.scope.area) areas = areas.filter((a) => a.id === s.scope.area);
    if (s.scope && s.scope.set) areas = areas.filter((a) => a.id === FE.SET_BY_ID[s.scope.set].area);
    const cnt = (f) => S.log.filter(f).length;
    const order = areas.map((a) => ({ a, sc: (cnt((e) => e.area === a.id) + 1) / AW(a) + Math.random() * 0.05 })).sort((x, y) => x.sc - y.sc);
    for (const { a } of order) {
      let sets = FE.SETS.filter((st) => st.area === a.id);
      if (s.scope && s.scope.set) sets = sets.filter((st) => st.id === s.scope.set);
      sets = sets.map((st) => ({ st, sc: cnt((e) => e.set === st.id) + Math.random() * 0.5 })).sort((x, y) => x.sc - y.sc).map((x) => x.st);
      for (const st of sets) {
        const groups = [];
        if (kinds.includes('book')) { const n = nextBookNum(st.id); if (n) groups.push({ k: `b:${st.id}:${n}`, w: 0.5 }); }
        const gens = FE.TEMPLATES.filter((t) => t.set === st.id && vStatus('g:' + t.id) === 'ok' && !S.cards['g:' + t.id]);
        if (kinds.includes('gen') && gens.length) groups.push({ k: 'g:' + gens[Math.floor(Math.random() * gens.length)].id, w: 0.35 });
        const drs = FE.DRILLS.filter((t) => t.set === st.id && vStatus('d:' + t.id) === 'ok' && !S.cards['d:' + t.id]);
        if (kinds.includes('drill') && drs.length) groups.push({ k: 'd:' + drs[Math.floor(Math.random() * drs.length)].id, w: 0.15 });
        if (groups.length) return pickW(groups);
      }
    }
    return null;
  }
  function nextKey() {
    const s = S.session, now = Date.now(), recent = s.recent.slice(-3);
    const cand = (lim) => Object.entries(S.cards).filter(([k, c]) => c.due <= lim && !recent.includes(k) && inScope(k, s)).sort((a, b) => a[1].due - b[1].due);
    const due = cand(now);
    if (due.length) return due[0][0];
    if (newToday() < S.settings.newPerDay || s.scope || s.kinds || s.extra) { const k = pickNew(s); if (k) return k; }
    const soon = cand(now + 30 * 60000);
    if (soon.length) return soon[0][0];
    if (!s.extra) { s.extra = true; const k = pickNew(s); if (k) return k; }
    return null;
  }
  function makeCurrent(k, mode) {
    const p = P(k);
    return { key: k, mode, seed: p.kind === 'book' ? 0 : newSeed(), stage: 'ask', sel: null, conf: null, ok: null, hints: 0, secs: 0, tags: [], isNew: !S.cards[k], checks: {}, note: '' };
  }
  function advance() {
    const k = nextKey();
    if (!k) { S.current = null; save(); summary(true); return; }
    S.current = makeCurrent(k, 'study');
    S.session.recent.push(k);
    save();
    openSheet();
  }
  function sessionDone() { const s = S.session; return s.mode === 'count' ? s.n >= s.limit : s.secs >= s.limit; }

  // ================= recording an answer =================
  function record(rating) {
    const c = S.current, k = c.key, p = P(k);
    const e = { t: Date.now(), k, kind: p.kind, set: setOf(k), area: areaOf(k), ok: !!c.ok, conf: c.conf || 'sure', secs: Math.round(c.secs), rating, hints: c.hints, tags: c.tags.slice(), isNew: c.isNew };
    const before = setStats(e.set).level, lvBefore = level().L;
    e.xp = xpFor(e);
    S.log.push(e);
    S.xp += e.xp;
    schedule(k, rating);
    const d = S.daily[ymd()] || (S.daily[ymd()] = { secs: 0, n: 0, fresh: 0 });
    d.secs += e.secs; d.n++; if (e.isNew) d.fresh++;
    if (S.session) { S.session.n++; S.session.secs += e.secs; S.session.xp += e.xp; if (e.ok) S.session.ok++; }
    const after = setStats(e.set).level, lvAfter = level().L;
    S.current = null;
    save();
    let msg = `+${e.xp} XP`;
    if (lvAfter > lvBefore) msg = `Level ${lvAfter}! +${e.xp} XP`;
    else if (after > before && after >= 2) msg = `${e.set} ${FE.SET_BY_ID[e.set].title}: ${LEVEL_NAMES[after]} · +${e.xp} XP`;
    toast(msg, true);
    if (S.session && !sessionDone()) advance(); else summary(false);
  }

  // ================= timer =================
  let tick = null;
  function runTimer() {
    clearInterval(tick);
    tick = setInterval(() => {
      const c = S.current;
      if (!c || document.hidden || !document.querySelector('.sheet')) return;
      if (c.stage === 'ask' || c.stage === 'conf') {
        c.secs += 1;
        const m = document.querySelector('.meter');
        if (m) m.outerHTML = meterHTML(c.secs);
        if (c.secs % 5 === 0) save();
      }
    }, 1000);
  }

  // ================= icons =================
  const I = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M12 3v2"/></svg>',
    topics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
    book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 21V5"/></svg>',
    shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    calc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></svg>',
    save: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  };

  // ================= meters =================
  function meterHTML(secs) {
    const pace = S.settings.paceSec, max = pace * 1.5, f = Math.min(1, secs / max);
    const cx = 42, cy = 42, r = 34;
    const pt = (fr, rr = r) => { const a = Math.PI * (1 - fr); return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)]; };
    const arc = (a, b, rr = r) => { const [x1, y1] = pt(a, rr), [x2, y2] = pt(b, rr); return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${rr} ${rr} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
    const tgt = pace / max;
    const [nx, ny] = pt(f, r - 6);
    const over = secs > pace;
    const ticks = [0, 1 / 3, 2 / 3, 1].map((t) => { const [a, b] = pt(t, r + 3), [c, d] = pt(t, r - 4); return `<path d="M${a.toFixed(1)} ${b.toFixed(1)}L${c.toFixed(1)} ${d.toFixed(1)}" stroke="var(--ink-2)" stroke-width="1.2"/>`; }).join('');
    const [ta, tb] = pt(tgt, r + 5), [tc, td] = pt(tgt, r - 6);
    return `<div class="meter${over ? ' over' : ''}" role="timer" aria-label="Time on this problem ${mmss(secs)}, target ${mmss(pace)}">
      <svg viewBox="0 0 84 46" aria-hidden="true">
        <path d="${arc(0, 1)}" stroke="var(--rule)" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="${arc(tgt, 1)}" stroke="var(--bad)" stroke-opacity=".35" stroke-width="5" fill="none"/>
        ${ticks}
        <path d="M${ta.toFixed(1)} ${tb.toFixed(1)}L${tc.toFixed(1)} ${td.toFixed(1)}" stroke="var(--amber)" stroke-width="3" stroke-linecap="round"/>
        <path d="M${cx} ${cy}L${nx.toFixed(2)} ${ny.toFixed(2)}" stroke="${over ? 'var(--bad)' : 'var(--ink)'}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--ink)"/>
      </svg><div class="read num">${mmss(secs)}</div></div>`;
  }
  function ringHTML(frac, size = 104) {
    const r = size / 2 - 8, c = 2 * Math.PI * r, f = Math.min(1, frac);
    return `<svg class="goal-meter" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--rule)" stroke-width="10" fill="none"/>
      ${f <= 0 ? '' : ''}<circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--amber)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})" ${f <= 0 ? 'visibility="hidden"' : ''}/></svg>`;
  }
  const pips = (lv) => `<span class="pips" aria-label="Level ${lv} of 5: ${LEVEL_NAMES[lv]}">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('')}</span>`;
  const bar = (f, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, f * 100)).toFixed(1)}%"></i></div>`;

  // ================= routing / render =================
  let route = { tab: 'today' };
  const app = document.getElementById('app');
  function go(r) { route = r; render(); window.scrollTo(0, 0); }
  function render() {
    const views = { today: vToday, topics: vTopics, progress: vProgress, more: vMore };
    app.innerHTML = `<main class="view">${views[route.tab]()}</main>${tabsHTML()}`;
  }
  function tabsHTML() {
    const t = [['today', 'Today'], ['topics', 'Topics'], ['progress', 'Progress'], ['more', 'More']];
    const waiting = pendingVerify().length;
    return `<nav class="tabs" aria-label="Main"><div>${t.map(([id, n]) => `<button class="tab" data-act="tab" data-v="${id}" ${route.tab === id ? 'aria-current="page"' : ''}>${I[id]}<span>${n}</span>${id === 'more' && waiting ? '<i class="dot" aria-hidden="true"></i>' : ''}</button>`).join('')}</div></nav>`;
  }
  const pendingVerify = () => FE.TEMPLATES.filter((t) => vStatus('g:' + t.id) === 'new');
  const pendingDrills = () => FE.DRILLS.filter((t) => vStatus('d:' + t.id) === 'new');

  // ---------- Today ----------
  function vToday() {
    const d = today(), goal = S.settings.goalMin * 60, lv = level();
    const due = dueNow(), newLeft = Math.max(0, S.settings.newPerDay - newToday());
    const r = readiness();
    const exam = S.settings.examDate ? Math.ceil((new Date(S.settings.examDate + 'T08:00') - Date.now()) / DAY) : null;
    const resume = S.current && S.current.mode === 'study';
    const pv = pendingVerify().length, pd = pendingDrills().length;
    const needBackup = S.log.length >= 20 && Date.now() - (S.lastBackup || 0) > 14 * DAY;
    const first = !S.log.length;
    return `
      <header class="hello"><h1>FE Prep</h1><span class="muted small">${exam != null && exam >= 0 ? `${exam} days to exam` : new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span></header>
      ${resume ? `<button class="banner amber" data-act="resume">${I.play}<span><b>Pick up where you left off</b><br><span class="small">${esc(itemTitle(S.current.key))}</span></span>${I.chev}</button>` : ''}
      <section class="face">
        <div class="goal">
          <div style="position:relative">${ringHTML(d.secs / goal)}</div>
          <div class="stack">
            <div class="goal-read num">${Math.floor(d.secs / 60)}<small> / ${S.settings.goalMin} min today</small></div>
            <p class="muted small">${d.secs >= goal ? 'Goal met. Anything more is a bonus.' : first ? 'Your first sessions rotate through all 17 areas.' : `${due} due now · ${newLeft} new left today`}</p>
          </div>
        </div>
        <div style="margin-top:16px"><button class="btn primary block" data-act="start" data-v="goal">${I.play} Start ${S.settings.goalMin}-minute session</button></div>
        <div class="quick" style="margin-top:8px">
          <button class="btn" data-act="start" data-v="one">1 problem<small>quick hit</small></button>
          <button class="btn" data-act="start" data-v="5">5 min<small>short break</small></button>
          <button class="btn" data-act="start" data-v="15">15 min<small>sit-down</small></button>
        </div>
      </section>
      <section class="stats">
        <div class="stat"><b>${due}</b><span>due now</span></div>
        <div class="stat"><b>${newLeft}</b><span>new left today</span></div>
        <div class="stat"><b>${pct(r)}%</b><span>readiness</span></div>
      </section>
      ${pv ? `<button class="banner" data-act="nav" data-v="verify">${I.shield}<span><b>${pv} generated problem types to check</b><br><span class="small">They join your study rotation only after you verify them.</span></span>${I.chev}</button>` : ''}
      <button class="banner" data-act="nav" data-v="drills">${I.calc}<span><b>TI-36X Pro drills</b><br><span class="small">${pd ? `${pd} to confirm on your calculator` : 'Practice your confirmed drills'}</span></span>${I.chev}</button>
      ${needBackup ? `<button class="banner amber" data-act="nav" data-v="backup">${I.save}<span><b>Back up your progress</b><br><span class="small">Last backup: ${S.lastBackup ? new Date(S.lastBackup).toLocaleDateString() : 'never'}</span></span>${I.chev}</button>` : ''}
      <section class="face">
        <div class="lvl"><div class="lvl-badge">${lv.L}</div><div style="flex:1"><div class="row between"><h3>Level ${lv.L}</h3><span class="muted small num">${lv.into} / ${lv.span} XP</span></div><div style="margin-top:6px">${bar(lv.into / lv.span)}</div></div></div>
        <p class="muted small" style="margin-top:10px">XP pays most for correct, confident, on-pace answers in heavily weighted areas.</p>
      </section>
      ${first ? `<section class="face stack"><h3>How this works</h3><p class="small">Each session hands you the next thing to do. That’s a problem from your Asghar book (you solve it on paper, then grade yourself) or a verified generated problem. Rate how hard it was, and the app decides when it comes back.</p><p class="small muted">Generated problems and calculator drills stay out of study until you’ve checked them yourself.</p></section>` : ''}
    `;
  }

  // ---------- Topics ----------
  function vTopics() {
    if (route.area) return vArea(route.area);
    return `<header><h1>Topics</h1><p class="muted small" style="margin-top:4px">Ordered like the NCEES spec. Bars show mastery; the range is exam questions.</p></header>
      <section class="face flush"><div class="list">${FE.AREAS.map((a) => {
        const st = areaStats(a.id);
        return `<button class="area item" data-act="area" data-v="${a.id}"><span><b>${a.name}</b></span><span class="muted small num">${a.lo}–${a.hi} Q</span>
          <span class="meta">${bar(st.m)}<span class="muted small num" style="min-width:36px;text-align:right">${pct(st.m)}%</span></span></button>`;
      }).join('')}</div></section>`;
  }
  function vArea(id) {
    const a = FE.AREA_BY_ID[id], st = areaStats(id);
    const sets = FE.SETS.filter((s) => s.area === id);
    return `<button class="back" data-act="tab" data-v="topics">${I.back} Topics</button>
      <header><h1>${a.name}</h1><p class="muted small" style="margin-top:4px">${a.lo}–${a.hi} exam questions · ${st.n} attempts · ${st.n ? pct(st.acc) + '% right' : 'not started'}</p></header>
      <button class="btn primary block" data-act="start" data-v="area" data-a="${id}">${I.play} Practice this area (10 min)</button>
      <section class="face flush"><div class="list">${sets.map((s) => {
        const ss = setStats(s.id), used = bookUsed(s.id).size, cnt = S.bookCounts[s.id];
        const gens = FE.TEMPLATES.filter((t) => t.set === s.id), ok = gens.filter((t) => vStatus('g:' + t.id) === 'ok').length;
        const drs = FE.DRILLS.filter((t) => t.set === s.id);
        return `<div class="stack">
          <div class="row between"><b>${s.id} ${esc(s.title)}</b>${pips(ss.level)}</div>
          <div class="row" style="flex-wrap:wrap;gap:6px"><span class="tag">Book p. ${s.page} · ${used}${cnt ? ' of ' + cnt : ''} done</span>${gens.length ? `<span class="tag ${ok ? 'good' : 'blue'}">${ok} of ${gens.length} generated verified</span>` : ''}${drs.length ? `<span class="tag">${drs.length} calculator drill${drs.length > 1 ? 's' : ''}</span>` : ''}<span class="tag">${LEVEL_NAMES[ss.level]}</span></div>
          <div class="row"><button class="linkbtn" data-act="start" data-v="set" data-s="${s.id}">Practice this set</button></div>
        </div>`;
      }).join('')}</div></section>
      ${id === 3 ? '<p class="muted small">Ethics questions come from your book only. Generated ethics questions would be AI-written facts with no way to check them by calculation.</p>' : ''}`;
  }

  // ---------- Progress ----------
  function vProgress() {
    const r = readiness();
    const areas = FE.AREAS.map((a) => ({ a, st: areaStats(a.id) }));
    const cheap = areas.slice().sort((x, y) => AW(y.a) * (1 - y.st.m) - AW(x.a) * (1 - x.st.m)).slice(0, 3);
    const L = S.log;
    const tagCounts = MISTAKES.map(([id, n]) => [n, L.filter((e) => e.tags && e.tags.includes(id)).length]).filter(([, c]) => c).sort((a, b) => b[1] - a[1]);
    const maxTag = Math.max(1, ...tagCounts.map(([, c]) => c));
    const sure = L.filter((e) => e.conf === 'sure'), guess = L.filter((e) => e.conf === 'guess');
    const rate = (arr) => (arr.length ? pct(arr.filter((e) => e.ok).length / arr.length) + '%' : '—');
    const days = Array.from({ length: 14 }, (_, i) => { const t = Date.now() - (13 - i) * DAY; return (S.daily[ymd(t)] || { secs: 0 }).secs; });
    const maxD = Math.max(S.settings.goalMin * 60, ...days);
    const lvCount = [0, 1, 2, 3, 4, 5].map((l) => FE.SETS.filter((s) => setStats(s.id).level === l).length);
    return `<header><h1>Progress</h1></header>
      <section class="face stack">
        <div class="ready"><span class="big">${pct(r)}%</span><span class="muted small" style="padding-bottom:6px">exam readiness</span></div>
        <p class="muted small">Your mastery in each area, weighted by how many exam questions that area carries. Mastery blends recent accuracy, confidence, coverage, and whether reviews are on schedule.</p>
      </section>
      <section class="face stack"><h3>Where the next points are cheapest</h3>
        ${cheap.map(({ a, st }) => `<button class="banner" style="padding:10px 12px" data-act="area" data-v="${a.id}"><span style="flex:1"><b>${a.name}</b><br><span class="small muted">${a.lo}–${a.hi} questions · ${pct(st.m)}% mastery</span></span>${I.chev}</button>`).join('')}
      </section>
      <section class="face stack"><h3>Mastery by area</h3>
        ${areas.map(({ a, st }) => `<div class="hbar"><span>${a.name}</span><span class="num muted" style="text-align:right">${pct(st.m)}%</span>${bar(st.m)}</div>`).join('')}
      </section>
      <section class="face stack"><h3>Last 14 days</h3>
        <div class="days" aria-label="Minutes studied per day">${days.map((s) => `<i class="${s >= S.settings.goalMin * 60 ? 'met' : ''}" style="height:${Math.max(3, (s / maxD) * 100)}%" title="${Math.round(s / 60)} min"></i>`).join('')}</div>
        <p class="muted small">Amber bars met your ${S.settings.goalMin}-minute goal.</p>
      </section>
      <section class="face stack"><h3>Confidence check</h3>
        <div class="stats"><div class="stat"><b>${rate(sure)}</b><span>right when sure (${sure.length})</span></div><div class="stat"><b>${rate(guess)}</b><span>right when guessing (${guess.length})</span></div><div class="stat"><b>${L.filter((e) => e.conf === 'sure' && !e.ok).length}</b><span>confidently wrong</span></div></div>
        <p class="muted small">Confidently-wrong answers are the ones to fix first. They’re the mistakes you won’t catch on exam day.</p>
      </section>
      <section class="face stack"><h3>Why answers go wrong</h3>
        ${tagCounts.length ? tagCounts.map(([n, c]) => `<div class="hbar"><span>${n}</span><span class="num muted" style="text-align:right">${c}</span>${bar(c / maxTag, 'blue')}</div>`).join('') : '<p class="muted small">Tag a reason when you miss one, and patterns show up here.</p>'}
      </section>
      <section class="face"><h3 style="margin-bottom:8px">Pace and accuracy</h3>
        <table class="tbl"><thead><tr><th>Area</th><th class="r">Tries</th><th class="r">Right</th><th class="r">Avg time</th></tr></thead><tbody>
        ${areas.filter(({ st }) => st.n).map(({ a, st }) => `<tr><td>${a.name}</td><td class="r">${st.n}</td><td class="r">${pct(st.acc)}%</td><td class="r" style="color:${st.secs > S.settings.paceSec ? 'var(--bad)' : 'inherit'}">${mmss(st.secs)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No attempts yet.</td></tr>'}
        </tbody></table><p class="muted small" style="margin-top:8px">Exam pace is about ${mmss(S.settings.paceSec)} per question. Red means slower than that.</p>
      </section>
      <section class="face stack"><h3>Skill levels</h3>
        <p class="small">${[5, 4, 3, 2, 1].map((l) => `${lvCount[l]} ${LEVEL_NAMES[l].toLowerCase()}`).join(', ')}, ${lvCount[0]} untested (of ${FE.SETS.length} problem sets)</p>
        <p class="muted small">Each problem set levels up from steady accuracy over time, and slips back if its reviews go badly overdue.</p>
      </section>`;
  }

  // ---------- More ----------
  function vMore() {
    const sub = route.sub;
    if (sub === 'verify') return vVerifyList();
    if (sub === 'drills') return vDrillList();
    if (sub === 'book') return vBookSetup();
    if (sub === 'settings') return vSettings();
    if (sub === 'backup') return vBackup();
    if (sub === 'reports') return vReports();
    if (sub === 'about') return vAbout();
    const pv = pendingVerify().length, pd = pendingDrills().length;
    const okG = FE.TEMPLATES.filter((t) => vStatus('g:' + t.id) === 'ok').length, okD = FE.DRILLS.filter((t) => vStatus('d:' + t.id) === 'ok').length;
    const row = (v, t, d) => `<button class="item" data-act="nav" data-v="${v}"><span style="flex:1"><b>${t}</b><br><span class="muted small">${d}</span></span>${I.chev}</button>`;
    return `<header><h1>More</h1></header>
      <section class="face flush"><div class="list">
        ${row('verify', 'Verify generated problems', `${okG} of ${FE.TEMPLATES.length} approved${pv ? ` · ${pv} waiting` : ''}`)}
        ${row('drills', 'Calculator drills', `${okD} of ${FE.DRILLS.length} confirmed on your TI-36X Pro`)}
        ${row('book', 'Book setup', 'Problems per set, so the app knows when a set is finished')}
        ${row('reports', 'Reported problems', `${S.reports.length} report${S.reports.length === 1 ? '' : 's'}`)}
      </div></section>
      <section class="face flush"><div class="list">
        ${row('settings', 'Settings', `${S.settings.goalMin} min/day · ${S.settings.newPerDay} new/day · ${mmss(S.settings.paceSec)} pace`)}
        ${row('backup', 'Backup and restore', S.lastBackup ? `Last backup ${new Date(S.lastBackup).toLocaleDateString()}` : 'No backup yet')}
        ${row('about', 'Sources and verification', 'Where every problem comes from')}
      </div></section>
      ${storageOK ? '' : '<p class="small" style="color:var(--bad)">This browser blocked saving. Progress will be lost when the app closes. Export a backup now.</p>'}`;
  }
  const backTo = (label = 'More') => `<button class="back" data-act="nav" data-v="">${I.back} ${label}</button>`;

  function vVerifyList() {
    const show = route.showAll;
    const groups = FE.AREAS.map((a) => ({ a, ts: FE.TEMPLATES.filter((t) => FE.SET_BY_ID[t.set].area === a.id) })).filter((g) => g.ts.length);
    const okN = FE.TEMPLATES.filter((t) => vStatus('g:' + t.id) === 'ok').length;
    return `${backTo()}<header><h1>Verify generated problems</h1></header>
      <section class="face stack">
        <p class="small">Each template makes endless versions of one problem type. Before it can show up in study, you work one version yourself with your handbook and calculator, then approve it.</p>
        <p class="small muted">Each template has already been run through an independent auto-check, shown on each row. That’s a screen, not a substitute for your check.</p>
        <div class="row between"><span class="small"><b>${okN}</b> of ${FE.TEMPLATES.length} approved</span>${pendingVerify().length ? `<button class="btn primary" data-act="verify-next">Check the next one</button>` : ''}</div>
      </section>
      <div class="row"><label class="check" style="padding:0"><input type="checkbox" data-act="toggle-all" ${show ? 'checked' : ''}> <span class="small">Show approved and rejected too</span></label></div>
      ${groups.map(({ a, ts }) => {
        const list = ts.filter((t) => show || vStatus('g:' + t.id) === 'new');
        if (!list.length) return '';
        return `<section><h3 style="margin:0 0 8px">${a.name}</h3><div class="face flush"><div class="list">${list.map((t) => {
          const st = vStatus('g:' + t.id), rp = REPORT[t.id];
          const auto = rp ? (rp.pass === rp.n ? `<span class="tag good">${rp.pass}/${rp.n} auto-checks</span>` : `<span class="tag bad">${rp.pass}/${rp.n} auto-checks</span>`) : '<span class="tag">no auto-check</span>';
          const stTag = st === 'ok' ? '<span class="tag good">Approved</span>' : st === 'bad' ? '<span class="tag bad">Rejected</span>' : '<span class="tag blue">Needs your check</span>';
          return `<button class="item" data-act="verify" data-v="g:${t.id}"><span style="flex:1"><b>${esc(t.title)}</b><br><span class="row" style="gap:6px;flex-wrap:wrap;margin-top:4px"><span class="tag">Set ${t.set}</span>${auto}${stTag}</span></span>${I.chev}</button>`;
        }).join('')}</div></div></section>`;
      }).join('')}`;
  }
  function vDrillList() {
    const pd = pendingDrills().length, ok = FE.DRILLS.filter((t) => vStatus('d:' + t.id) === 'ok');
    return `${backTo()}<header><h1>Calculator drills</h1><p class="muted small" style="margin-top:4px">TI-36X Pro features you’ll lean on during the exam.</p></header>
      <section class="face stack">
        <p class="small">First run: do the drill on your calculator. If it matches, confirm and save your keystrokes. After that, the drill joins practice.</p>
        <button class="btn primary block" data-act="start" data-v="drills" ${ok.length ? '' : 'disabled'}>${I.play} Practice confirmed drills (${ok.length})</button>
      </section>
      <section class="face flush"><div class="list">${FE.DRILLS.map((t) => {
        const st = vStatus('d:' + t.id);
        return `<button class="item" data-act="verify" data-v="d:${t.id}"><span style="flex:1"><b>${esc(t.title)}</b><br><span class="muted small">${esc(t.feature)}</span>${S.keys[t.id] ? `<br><span class="small">Your keys: ${esc(S.keys[t.id])}</span>` : ''}</span>${st === 'ok' ? '<span class="tag good">Confirmed</span>' : st === 'bad' ? '<span class="tag bad">Rejected</span>' : '<span class="tag blue">First run</span>'}</button>`;
      }).join('')}</div></section>${pd ? '' : ''}`;
  }
  function vBookSetup() {
    return `${backTo()}<header><h1>Book setup</h1></header>
      <section class="face stack"><p class="small">${esc(FE.BOOK.title)}, ${esc(FE.BOOK.author)}.</p>
      <p class="small muted">The app numbers problems within each set starting at #1. You don’t have to fill these in. When you reach a number that doesn’t exist, tap “That set ends here” and the app records the count. You can set counts now if you like.</p></section>
      ${FE.AREAS.map((a) => `<section><h3 style="margin:0 0 8px">${a.id}. ${a.name} <span class="muted small">· solutions p. ${a.solPage}</span></h3><div class="face flush"><div class="list">
        ${FE.SETS.filter((s) => s.area === a.id).map((s) => `<div class="row between"><span class="small"><b>${s.id}</b> ${esc(s.title)} <span class="muted">p. ${s.page}</span></span><input type="number" inputmode="numeric" min="1" max="99" placeholder="?" aria-label="Problems in set ${s.id}" style="width:64px;text-align:center" data-act="bookcount" data-v="${s.id}" value="${S.bookCounts[s.id] || ''}"></div>`).join('')}
      </div></div></section>`).join('')}`;
  }
  function vSettings() {
    const s = S.settings;
    return `${backTo()}<header><h1>Settings</h1></header>
      <section class="face stack">
        <label class="field"><span>Daily goal (minutes)</span><input type="number" inputmode="numeric" min="1" max="240" data-act="set" data-v="goalMin" value="${s.goalMin}"></label>
        <label class="field"><span>New items per day</span><input type="number" inputmode="numeric" min="0" max="50" data-act="set" data-v="newPerDay" value="${s.newPerDay}"></label>
        <label class="field"><span>Pace target per problem (seconds)</span><input type="number" inputmode="numeric" min="60" max="600" data-act="set" data-v="paceSec" value="${s.paceSec}"></label>
        <label class="field"><span>Exam date (optional)</span><input type="date" data-act="set" data-v="examDate" value="${s.examDate}"></label>
        <label class="check"><input type="checkbox" data-act="set" data-v="drillsInSessions" ${s.drillsInSessions ? 'checked' : ''}><span>Mix confirmed calculator drills into regular sessions</span></label>
        <label class="field"><span>Appearance</span><select data-act="set" data-v="theme"><option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>Match the phone</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option></select></label>
      </section>
      <section class="face stack"><h3>Start over</h3><p class="small muted">Erases progress, verifications, and settings on this device. Export a backup first.</p><button class="btn stop" data-act="reset">Erase all progress</button></section>`;
  }
  function vBackup() {
    return `${backTo()}<header><h1>Backup and restore</h1></header>
      <section class="face stack"><p class="small">Your progress lives only on this phone. Export a backup now and then (to Files or iCloud Drive) so a cleared cache can’t wipe it.</p>
        <button class="btn primary block" data-act="export">${I.save} Export backup</button>
        <label class="btn block" style="cursor:pointer">Restore from a backup file<input type="file" accept="application/json,.json" data-act="import" class="hidden"></label>
        <p class="muted small">Last backup: ${S.lastBackup ? new Date(S.lastBackup).toLocaleString() : 'never'} · ${S.log.length} attempts on record</p></section>`;
  }
  function vReports() {
    const txt = S.reports.map((r) => `[${new Date(r.t).toLocaleString()}] ${r.key} seed ${r.seed}: ${r.note}`).join('\n');
    return `${backTo()}<header><h1>Reported problems</h1></header>
      <section class="face stack">${S.reports.length ? `<p class="small">Copy these and send them to whoever maintains the problem bank (or paste them back to Claude) to get the templates fixed.</p><textarea readonly rows="8">${esc(txt)}</textarea><button class="btn block" data-act="copy-reports">Copy all</button>` : '<p class="small muted">Nothing reported. Use “Report a problem” under any generated question.</p>'}</section>`;
  }
  function vAbout() {
    const rp = FE.VERIFY_REPORT;
    const tot = rp ? Object.values(rp.items).reduce((a, x) => a + x.n, 0) : 0, ok = rp ? Object.values(rp.items).reduce((a, x) => a + x.pass, 0) : 0;
    return `${backTo()}<header><h1>Sources and verification</h1></header>
      <section class="face stack"><h3>Topic map</h3><p class="small">The 17 areas and their question ranges come from the NCEES FE Electrical and Computer CBT exam specification (effective July 2020). Pace target: about 3 minutes per question.</p></section>
      <section class="face stack"><h3>Book problems</h3><p class="small">${esc(FE.BOOK.title)} by ${esc(FE.BOOK.author)} (${esc(FE.BOOK.edition)}). The app stores only set titles and page numbers. You work the problems in the book and grade yourself against its solutions.</p></section>
      <section class="face stack"><h3>Generated problems</h3><p class="small">${FE.TEMPLATES.length} templates written for this app. Every template is unverified until you approve it. Before shipping, each one was auto-checked: the app’s exact generator code produced variants, and separate tools recomputed every answer — lcapy (circuit solver), SciPy (ODEs, signal simulation, root finding, quadrature), SymPy, numpy-financial, Python’s ipaddress, and direct simulation. The check also confirmed every wrong choice is clearly wrong.</p>
        ${rp ? `<p class="small muted">Auto-check run ${esc(rp.generated)}: ${ok.toLocaleString()} of ${tot.toLocaleString()} variants passed. Tools: ${Object.entries(rp.tools).map(([k, v]) => `${k} ${v}`).join(', ')}.</p>` : ''}
        <p class="small muted">Handbook pointers are chapter names and search terms for the FE Reference Handbook. Confirm each one during your check.</p></section>
      <section class="face stack"><h3>Calculator drills</h3><p class="small">${FE.DRILLS.length} drills for the TI-36X Pro. Answers are auto-checked the same way. Keystrokes aren’t prescribed — you confirm each drill on your own calculator and save the keys that worked.</p></section>
      <p class="muted small">FE Prep ${VERSION}. Runs offline; nothing leaves your phone.</p>`;
  }

  // ================= problem sheet =================
  function openSheet() {
    let el = document.querySelector('.sheet');
    if (!el) { el = document.createElement('div'); el.className = 'sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
    el.innerHTML = `<div class="sheet-in">${sheetHTML()}</div>`;
    el.scrollTop = 0;
    document.body.classList.add('sheet-open');
    runTimer();
  }
  function closeSheet() { const el = document.querySelector('.sheet'); if (el) el.remove(); document.body.classList.remove('sheet-open'); clearInterval(tick); render(); }
  function sheetHTML() {
    const c = S.current, p = P(c.key), set = FE.SET_BY_ID[setOf(c.key)], s = S.session;
    const where = c.mode === 'verify' ? (p.kind === 'drill' ? 'Calculator drill · first run' : 'Verify a template') : p.kind === 'book' ? 'Book problem' : p.kind === 'drill' ? 'Calculator drill' : 'Generated problem';
    const prog = c.mode === 'study' && s ? (s.mode === 'count' ? `<div class="progress-dots">${Array.from({ length: s.limit }, (_, i) => `<i class="${i < s.n ? 'on' : ''}"></i>`).join('')}</div>` : `<div style="margin:4px 0 12px">${bar(s.secs / s.limit, 'good')}</div>`) : '<div style="height:12px"></div>';
    const timing = c.stage === 'ask' || c.stage === 'conf';
    return `<div class="topbar"><button class="iconbtn" data-act="close" aria-label="Close and save">${I.close}</button>
      <div class="where"><b>${set ? `${set.id} ${esc(set.title)}` : ''}</b><span>${where}${c.isNew && c.mode === 'study' ? ' · new' : ''}</span></div>${timing || c.secs ? meterHTML(c.secs) : ''}</div>${prog}
      ${p.kind === 'book' ? bookHTML(c, p, set) : mcHTML(c, p)}`;
  }
  const hbText = (t) => (t.hb ? `FE Reference Handbook → <b>${esc(t.hb.ch)}</b> chapter. Search for “${esc(t.hb.find)}”.` : '');
  function mcHTML(c, p) {
    const t = p.t, v = variant(c.key, c.seed), done = c.stage !== 'ask';
    const L = ['A', 'B', 'C', 'D'];
    let h = `<div class="qtext">${v.q}</div>`;
    if (p.kind === 'drill') h += `<div class="hb" style="margin-top:12px">${I.calc}<span><b>Feature:</b> ${esc(t.feature)}${S.keys[t.id] ? `<br><b>Your keys:</b> ${esc(S.keys[t.id])}` : ''}</span></div>`;
    if (!done && c.hints >= 1 && p.kind === 'gen') h += `<div class="hintbox">${hbText(t)}</div>`;
    if (!done && c.hints >= 2) h += `<div class="hintbox"><b>Setup:</b> ${esc(v.setup)}</div>`;
    h += `<div class="choices" role="group" aria-label="Answer choices">${v.choices.map((ch, i) => {
      let cls = '';
      if (done) { if (i === v.correct) cls = 'right'; else if (i === c.sel) cls = 'wrong'; }
      return `<button class="choice ${cls}" data-act="pick" data-v="${i}" aria-pressed="${c.sel === i}" ${done ? 'disabled' : ''}><span class="letter">${L[i]}</span><span class="val">${esc(ch.label)}</span></button>`;
    }).join('')}</div>`;
    if (!done) {
      const canHint = p.kind === 'gen' ? c.hints < 2 : c.hints < 1 && v.setup;
      const verify = c.mode === 'verify';
      h += `<div class="dock">${c.sel == null ? `<p class="hint-line">${verify ? 'Work it yourself first, then pick your answer.' : 'Pick an answer, then say how sure you are.'}</p>` : ''}
        ${verify ? `<button class="btn primary block" data-act="reveal" ${c.sel == null ? 'disabled' : ''}>Reveal the answer key</button>`
          : `<div class="btn-row"><button class="btn" data-act="submit" data-v="guess" ${c.sel == null ? 'disabled' : ''}>Guessing</button><button class="btn primary" data-act="submit" data-v="sure" ${c.sel == null ? 'disabled' : ''}>I’m sure</button></div>`}
        ${canHint && !verify ? `<div style="text-align:center;margin-top:6px"><button class="linkbtn" data-act="hint">${c.hints ? 'Show the setup' : p.kind === 'gen' ? 'Where in the handbook?' : 'Show the setup'}</button></div>` : ''}</div>`;
      return h;
    }
    const picked = v.choices[c.sel];
    h += `<div class="verdict ${c.ok ? 'good' : 'bad'}">${c.ok ? 'Correct' : 'Not quite'}${c.mode === 'study' && c.ok && c.conf === 'guess' ? '<span class="tag amber">guessed</span>' : ''}</div>`;
    if (!c.ok && picked.why) h += `<p class="why">You picked ${L[c.sel]}: ${esc(picked.why)}</p>`;
    h += `<ol class="steps">${v.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
    if (p.kind === 'gen') h += `<div class="hb" style="margin-top:12px">${I.book}<span>${hbText(t)}</span></div>`;
    if (c.mode === 'verify') return h + verifyHTML(c, p);
    if (!c.ok) h += tagsHTML(c);
    h += rateHTML(c);
    h += `<div style="text-align:center;margin-top:12px"><button class="linkbtn" data-act="report">Report a problem with this question</button></div>`;
    return h;
  }
  function tagsHTML(c) {
    return `<div style="margin-top:18px"><h3 style="margin-bottom:8px">What went wrong?</h3><div class="chips">${MISTAKES.map(([id, n]) => `<button class="chip" data-act="tag" data-v="${id}" aria-pressed="${c.tags.includes(id)}">${n}</button>`).join('')}</div></div>`;
  }
  function rateHTML(c) {
    const card = S.cards[c.key];
    if (!c.ok) return `<div class="dock"><p class="hint-line">It’ll come back in about 10 minutes.</p><button class="btn primary block" data-act="rate" data-v="1">Continue</button></div>`;
    const opt = (r, n, cls = '') => `<button class="btn ${cls}" data-act="rate" data-v="${r}" ${(r === 4 && c.hints) ? 'disabled' : ''}>${n}<small>${ivlLabel(nextIvl(card, r))}</small></button>`;
    if (c.conf === 'guess') return `<div class="dock"><p class="hint-line">Right, but a guess. It’ll come back soon.</p><div class="rate three">${opt(1, 'Again', 'again')}${opt(2, 'Hard')}<button class="btn" disabled>Good<small>after a sure answer</small></button></div></div>`;
    return `<div class="dock"><p class="hint-line">How hard was it? This sets when you see it again.</p><div class="rate">${opt(1, 'Again', 'again')}${opt(2, 'Hard')}${opt(3, 'Good', 'good-r')}${opt(4, 'Easy')}</div></div>`;
  }
  function verifyHTML(c, p) {
    const isDrill = p.kind === 'drill', rp = REPORT[p.id];
    const items = isDrill
      ? [['calc', 'My TI-36X Pro gives the marked answer.'], ['sense', 'The task is clear and uses a feature I’d actually use on the exam.']]
      : [['solved', 'I worked it on my own (handbook + calculator) and reached the marked answer.'], ['sense', 'The problem is physically sensible and clearly worded.'], ['hb', 'The handbook pointer leads to the right place.'], ['wrong', 'The wrong choices are actually wrong.']];
    const all = items.every(([id]) => c.checks[id]);
    return `<section class="face stack" style="margin-top:16px">
      <h3>Your check</h3>
      <p class="small muted">${rp ? `Auto-check: ${rp.pass} of ${rp.n} random versions matched an independent solver (${esc(rp.method)}).` : 'No auto-check on record for this one.'}${!c.ok ? ' Your answer didn’t match the key. Find out whether you or the key is wrong before approving.' : ''}</p>
      ${items.map(([id, t]) => `<label class="check"><input type="checkbox" data-act="check" data-v="${id}" ${c.checks[id] ? 'checked' : ''}><span class="small">${t}</span></label>`).join('')}
      ${isDrill ? `<label class="field"><span>Keystrokes that worked (optional)</span><textarea data-act="keys" placeholder="e.g. 2nd [complex] ▸ … enter">${esc(S.keys[p.id] || '')}</textarea></label>` : ''}
      <button class="btn go block" data-act="approve" ${all ? '' : 'disabled'}>${isDrill ? 'Confirm drill' : 'Approve for study'}</button>
      <div class="btn-row"><button class="btn" data-act="another">Try another version</button><button class="btn" data-act="reject">Reject…</button></div>
      <div class="hidden" id="reject-box"><label class="field"><span>What’s wrong? (saved to Reported problems)</span><textarea data-act="note"></textarea></label><button class="btn stop block" data-act="reject-confirm" style="margin-top:8px">Reject and keep out of study</button></div>
    </section>`;
  }
  function bookHTML(c, p, set) {
    const area = FE.AREA_BY_ID[set.area];
    if (c.stage === 'ask') return `<div class="book-card"><p class="muted">${esc(FE.BOOK.title)}</p><p style="margin-top:8px"><b>Problem set ${set.id}</b> · ${esc(set.title)}</p><div class="big">#${p.num}</div><p class="muted">Starts on page ${set.page}</p></div>
      <p class="small muted" style="margin-top:12px;text-align:center">Work it on paper with your handbook and TI-36X Pro. Don’t peek at the solution yet.</p>
      <div class="dock"><button class="btn primary block" data-act="book-done">I’ve got an answer</button>
      <div class="row between" style="margin-top:8px"><button class="linkbtn" data-act="book-none">Set ends before #${p.num}</button><button class="linkbtn" data-act="book-skip">Skip this one</button></div></div>`;
    if (c.stage === 'conf') return `<div class="book-card"><p><b>${set.id} #${p.num}</b></p><h2 style="margin-top:8px">How sure are you?</h2></div>
      <div class="dock"><div class="btn-row"><button class="btn" data-act="book-conf" data-v="guess">Guessing</button><button class="btn primary" data-act="book-conf" data-v="sure">I’m sure</button></div></div>`;
    if (c.stage === 'check') return `<div class="book-card"><p><b>${set.id} #${p.num}</b></p><h2 style="margin-top:8px">Check the solution</h2><p class="muted" style="margin-top:6px">Chapter ${area.id} solutions start on page ${area.solPage}.</p></div>
      <div class="dock"><div class="btn-row"><button class="btn" data-act="book-grade" data-v="0">I got it wrong</button><button class="btn go" data-act="book-grade" data-v="1">I got it right</button></div></div>`;
    return `<div class="verdict ${c.ok ? 'good' : 'bad'}">${c.ok ? 'Nice — right answer' : 'Missed this one'}${c.ok && c.conf === 'guess' ? '<span class="tag amber">guessed</span>' : ''}</div>
      <p class="muted small" style="margin-top:4px">${set.id} #${p.num}, page ${set.page}</p>${c.ok ? '' : tagsHTML(c)}${rateHTML(c)}`;
  }

  // ================= summary =================
  function summary(empty) {
    const s = S.session;
    S.session = null; save();
    let el = document.querySelector('.sheet');
    if (!el) { el = document.createElement('div'); el.className = 'sheet'; document.body.appendChild(el); }
    document.body.classList.add('sheet-open');
    clearInterval(tick);
    const n = s ? s.n : 0;
    el.innerHTML = `<div class="sheet-in"><div class="topbar"><button class="iconbtn" data-act="close" aria-label="Close">${I.close}</button></div>
      <section class="face stack" style="margin-top:24px;text-align:center">
        <h1>${n ? 'Session done' : empty ? 'All caught up' : 'Session done'}</h1>
        ${n ? `<p class="goal-read num" style="margin-top:8px">${s.ok}/${n}<small> right</small></p><p class="muted">${mmss(s.secs)} studied · +${s.xp} XP</p>`
          : `<p class="muted">${pendingVerify().length && !FE.TEMPLATES.some((t) => vStatus('g:' + t.id) === 'ok') ? 'Nothing is due. Verify some generated problems to add more variety.' : 'Nothing is due and today’s new items are used up.'}</p>`}
      </section>
      <div class="stack" style="margin-top:16px">
        <button class="btn primary block" data-act="more5">${empty ? 'Do 5 extra anyway' : 'Keep going: 5 more'}</button>
        <button class="btn block" data-act="close">Done for now</button>
      </div></div>`;
  }

  // ================= toast =================
  let toastT = null;
  function toast(msg, xp) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.remove('xp-pop'); void el.offsetWidth; if (xp) el.classList.add('xp-pop');
    clearTimeout(toastT); toastT = setTimeout(() => el.remove(), 2400);
  }

  // ================= events =================
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]');
    if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT' || b.tagName === 'TEXTAREA') return;
    const act = b.dataset.act, v = b.dataset.v, c = S.current;
    switch (act) {
      case 'tab': go({ tab: v }); break;
      case 'nav': go({ tab: v === '' || ['verify', 'drills', 'book', 'settings', 'backup', 'reports', 'about'].includes(v) ? 'more' : v, sub: v || undefined }); break;
      case 'area': go({ tab: 'topics', area: +v }); break;
      case 'resume': openSheet(); break;
      case 'start': {
        const g = S.settings.goalMin * 60;
        if (v === 'goal') startSession({ mode: 'time', limit: Math.max(60, g - today().secs) > 60 ? g - today().secs : g });
        else if (v === 'one') startSession({ mode: 'count', limit: 1 });
        else if (v === '5' || v === '15') startSession({ mode: 'time', limit: +v * 60 });
        else if (v === 'area') startSession({ mode: 'time', limit: 600, scope: { area: +b.dataset.a } });
        else if (v === 'set') startSession({ mode: 'count', limit: 5, scope: { set: b.dataset.s } });
        else if (v === 'drills') startSession({ mode: 'count', limit: 5, kinds: ['drill'] });
        break;
      }
      case 'more5': { startSession({ mode: 'count', limit: 5 }); S.session.extra = true; break; }
      case 'close': {
        const el = document.querySelector('.sheet');
        if (c && c.mode === 'verify') S.current = null;
        save(); if (el) el.remove(); document.body.classList.remove('sheet-open'); clearInterval(tick); render(); break;
      }
      case 'pick': if (c && c.stage === 'ask') { c.sel = +v; openSheet(); } break;
      case 'hint': c.hints++; save(); openSheet(); break;
      case 'submit': {
        const vv = variant(c.key, c.seed);
        c.conf = v; c.ok = c.sel === vv.correct; c.stage = 'result'; save(); openSheet(); break;
      }
      case 'reveal': { const vv = variant(c.key, c.seed); c.ok = c.sel === vv.correct; c.stage = 'result'; save(); openSheet(); break; }
      case 'tag': { const i = c.tags.indexOf(v); if (i >= 0) c.tags.splice(i, 1); else c.tags.push(v); b.setAttribute('aria-pressed', c.tags.includes(v)); save(); break; }
      case 'rate': record(+v); break;
      case 'report': {
        const note = prompt('What’s wrong with this question? (Saved to More → Reported problems)');
        if (note) {
          S.reports.push({ t: Date.now(), key: c.key, seed: c.seed, note });
          if (confirm('Pull this template from study until it’s fixed?')) S.verify[c.key] = { status: 'bad', t: Date.now(), note };
          save(); toast('Reported. Thanks.');
        }
        break;
      }
      case 'book-done': c.stage = 'conf'; save(); openSheet(); break;
      case 'book-conf': c.conf = v; c.stage = 'check'; save(); openSheet(); break;
      case 'book-grade': c.ok = v === '1'; c.stage = 'result'; save(); openSheet(); break;
      case 'book-none': {
        const p = P(c.key);
        S.bookCounts[p.set] = p.num - 1; S.current = null; save();
        toast(`Set ${p.set} has ${p.num - 1} problems.`);
        if (S.session) advance(); else closeSheet();
        break;
      }
      case 'book-skip': {
        const p = P(c.key);
        (S.bookSkip[p.set] = S.bookSkip[p.set] || []).push(p.num); S.current = null; save();
        if (S.session) advance(); else closeSheet();
        break;
      }
      case 'verify': { S.current = makeCurrent(v, 'verify'); S.session = null; save(); openSheet(); break; }
      case 'verify-next': {
        const order = FE.AREAS.map((a) => a.id);
        const t = pendingVerify().sort((x, y) => S.log.filter((e) => e.area === FE.SET_BY_ID[y.set].area).length - S.log.filter((e) => e.area === FE.SET_BY_ID[x.set].area).length || order.indexOf(FE.SET_BY_ID[x.set].area) - order.indexOf(FE.SET_BY_ID[y.set].area))[0];
        if (t) { S.current = makeCurrent('g:' + t.id, 'verify'); save(); openSheet(); }
        break;
      }
      case 'another': { c.seed = newSeed(); c.stage = 'ask'; c.sel = null; c.ok = null; c.checks = {}; c.secs = 0; save(); openSheet(); break; }
      case 'approve': {
        S.verify[c.key] = { status: 'ok', t: Date.now(), seed: c.seed };
        const kk = c.key; S.current = null; save();
        toast(P(kk).kind === 'drill' ? 'Drill confirmed. It joins practice now.' : 'Approved. It joins your study rotation now.');
        const el = document.querySelector('.sheet'); if (el) el.remove(); document.body.classList.remove('sheet-open'); clearInterval(tick); render();
        break;
      }
      case 'reject': document.getElementById('reject-box').classList.toggle('hidden'); break;
      case 'reject-confirm': {
        const note = (document.querySelector('[data-act="note"]') || {}).value || '(no note)';
        S.verify[c.key] = { status: 'bad', t: Date.now(), note };
        S.reports.push({ t: Date.now(), key: c.key, seed: c.seed, note });
        S.current = null; save(); toast('Rejected. It stays out of study.');
        const el = document.querySelector('.sheet'); if (el) el.remove(); document.body.classList.remove('sheet-open'); clearInterval(tick); render();
        break;
      }
      case 'export': exportBackup(); break;
      case 'copy-reports': { const t = document.querySelector('textarea[readonly]'); if (t) { navigator.clipboard && navigator.clipboard.writeText(t.value).then(() => toast('Copied.'), () => { t.select(); }); } break; }
      case 'reset': if (confirm('Erase all progress on this device? This can’t be undone.')) { localStorage.removeItem(KEY); S = fresh(); save(); go({ tab: 'today' }); toast('Progress erased.'); } break;
    }
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target, act = el.dataset.act, v = el.dataset.v;
    if (act === 'check') { S.current.checks[v] = el.checked; save(); const ap = document.querySelector('[data-act="approve"]'); if (ap) { const boxes = [...document.querySelectorAll('[data-act="check"]')]; ap.disabled = !boxes.every((x) => x.checked); } }
    else if (act === 'set') {
      const s = S.settings;
      if (el.type === 'checkbox') s[v] = el.checked;
      else if (el.type === 'number') { const n = Math.round(+el.value); if (n > 0 || (v === 'newPerDay' && n >= 0)) s[v] = n; }
      else s[v] = el.value;
      if (v === 'theme') applyTheme();
      save(); toast('Saved.');
    } else if (act === 'bookcount') { const n = Math.round(+el.value); if (n > 0) S.bookCounts[v] = n; else delete S.bookCounts[v]; save(); }
    else if (act === 'import') importBackup(el.files[0]);
    else if (act === 'toggle-all') { route.showAll = el.checked; render(); }
  });
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.act === 'keys' && S.current) { S.keys[P(S.current.key).id] = el.value.trim(); save(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  // ================= backup =================
  async function exportBackup() {
    const data = JSON.stringify({ app: 'FE Prep', version: VERSION, exported: new Date().toISOString(), state: S });
    const name = `fe-prep-backup-${ymd()}.json`;
    const file = new File([data], name, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'FE Prep backup' }); }
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
      S.lastBackup = Date.now(); save(); render(); toast('Backup exported.');
    } catch (e) { if (e && e.name !== 'AbortError') toast('Export failed: ' + e.message); }
  }
  function importBackup(f) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (!d || !d.state || d.state.v !== 1) throw new Error('not an FE Prep backup');
        if (!confirm(`Restore the backup from ${new Date(d.exported).toLocaleString()}? This replaces progress on this device.`)) return;
        const f2 = fresh(); S = Object.assign(f2, d.state, { settings: Object.assign(f2.settings, d.state.settings || {}) }); S.current = null; S.session = null;
        save(); applyTheme(); go({ tab: 'today' }); toast('Backup restored.');
      } catch (e) { toast('That file isn’t an FE Prep backup.'); }
    };
    rd.readAsText(f);
  }
  function applyTheme() { const t = S.settings.theme; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }

  // ================= boot =================
  applyTheme();
  if (S.current && S.current.mode === 'verify') S.current = null;
  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__FEPREP = { get S() { return S; }, render, variant };
})();
