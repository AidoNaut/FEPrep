/* FE Prep — problem engine: seeded RNG, number formatting, multiple-choice assembly.
   Runs in the browser and in Node (tools/export-variants.js) so the verifier checks the
   exact same code the app runs. */
(function (G) {
  const FE = (G.FE = G.FE || {});
  FE.TEMPLATES = FE.TEMPLATES || [];
  FE.DRILLS = FE.DRILLS || [];

  // ---------- seeded RNG (mulberry32) ----------
  function rng(seed) {
    let a = seed >>> 0;
    const f = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
    const r = {
      f,
      int: (lo, hi) => lo + Math.floor(f() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      step: (lo, hi, st) => {
        const n = Math.round((hi - lo) / st);
        return +(lo + st * Math.floor(f() * (n + 1))).toFixed(10);
      },
      res: (lo, hi) => {
        const vals = [];
        for (let d = 0.1; d <= 1e8; d *= 10)
          for (const e of E12) {
            const v = +(e * d).toPrecision(2);
            if (v >= lo && v <= hi) vals.push(v);
          }
        return r.pick(vals);
      },
      shuffle: (arr) => {
        const a2 = arr.slice();
        for (let i = a2.length - 1; i > 0; i--) {
          const j = Math.floor(f() * (i + 1));
          [a2[i], a2[j]] = [a2[j], a2[i]];
        }
        return a2;
      },
      sign: () => (f() < 0.5 ? -1 : 1),
      nonzero: (lo, hi) => {
        let v = 0;
        while (v === 0) v = lo + Math.floor(f() * (hi - lo + 1));
        return v;
      },
    };
    return r;
  }

  // ---------- formatting ----------
  function sig(v, n = 3) {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    if (Math.abs(v) >= 10 ** n) return String(Math.round(v)).replace('-', '−'); // never hide integer digits
    const pv = Number(v.toPrecision(n));
    const d = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(pv))));
    return pv.toFixed(Math.min(d, 12)).replace('-', '−');
  }
  const PRE = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  function eng(x, unit = '', n = 3) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0 ' + unit;
    const ax = Math.abs(Number(x.toPrecision(n)));
    let i = PRE.findIndex(([m]) => ax >= m);
    if (i < 0) i = PRE.length - 1;
    let s = sig(x / PRE[i][0], n);
    if (Math.abs(parseFloat(s.replace('−', '-'))) >= 1000 && i > 0) {
      i -= 1;
      s = sig(x / PRE[i][0], n);
    }
    return (s + ' ' + PRE[i][1] + unit).trim();
  }
  const fix = (v, d) => {
    const s = v.toFixed(d);
    return (Number(s) === 0 ? s.replace('-', '') : s).replace('-', '−');
  };
  const money = (v) => (v < 0 ? '−$' : '$') + Math.round(Math.abs(v)).toLocaleString('en-US');
  const deg = (rad) => (rad * 180) / Math.PI;
  const rad = (d) => (d * Math.PI) / 180;
  const polar = ([re, im], n = 3) => {
    const m = Math.hypot(re, im);
    const a = deg(Math.atan2(im, re));
    return `${sig(m, n)} ∠ ${fix(a, 1)}°`;
  };
  const rect = ([re, im], n = 3) => {
    const s = im < 0 ? '−' : '+';
    return `${sig(re, n)} ${s} j${sig(Math.abs(im), n)}`;
  };
  const C = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => {
      const d = b[0] * b[0] + b[1] * b[1];
      return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
    },
    abs: (a) => Math.hypot(a[0], a[1]),
    ang: (a) => Math.atan2(a[1], a[0]),
    fromPolar: (m, dg) => [m * Math.cos(rad(dg)), m * Math.sin(rad(dg))],
    conj: (a) => [a[0], -a[1]],
  };
  // signed term helper for polynomials: term(3,'x²',true) → "3x²", term(-2,'x') → " − 2x"
  function term(c, v, first = false) {
    if (c === 0) return '';
    const a = Math.abs(c);
    const coef = a === 1 && v ? '' : String(a);
    if (first) return (c < 0 ? '−' : '') + coef + v;
    return (c < 0 ? ' − ' : ' + ') + coef + v;
  }

  // ---------- separation / choice building ----------
  function sepOK(type, list, v, sep) {
    sep = sep || {};
    const rel = sep.rel ?? 0.025;
    const abs = sep.abs ?? 0;
    for (const c of list) {
      const u = c.v;
      if (type === 'num') {
        if (!isFinite(v)) return false;
        const d = Math.abs(u - v);
        const m = Math.max(Math.abs(u), Math.abs(v));
        if (d < abs) return false;
        if (m > 0 && d / m < rel && !(abs > 0)) return false;
      } else if (type === 'cplx') {
        const d = Math.hypot(u[0] - v[0], u[1] - v[1]);
        const m = Math.max(Math.hypot(...u), Math.hypot(...v));
        if (!isFinite(d) || (m > 0 && d / m < rel)) return false;
      } else {
        if (norm(u) === norm(v)) return false;
      }
    }
    return true;
  }
  const norm = (s) => String(s).replace(/\s+/g, '').toLowerCase();

  function buildChoices(g, r) {
    const type = g.type || 'num';
    const fmt = g.fmt || (type === 'num' ? (v) => sig(v) : type === 'cplx' ? (v) => polar(v) : (v) => String(v));
    const cand = [{ v: g.ans, why: null }];
    for (const d of g.distract || []) {
      if (cand.length >= 4) break;
      if (d && sepOK(type, cand, d.v, g.sep)) cand.push({ v: d.v, why: d.why });
    }
    if (type === 'num' && !g.noFill) {
      for (const m of [1.5, 0.5, 2, 0.75, 1.25, 3, 0.25, 4]) {
        if (cand.length >= 4) break;
        const v = g.ans * m;
        if (sepOK(type, cand, v, g.sep)) cand.push({ v, why: 'Off by a factor — not tied to one specific slip.' });
      }
    }
    if (cand.length < 4) return null;
    cand.forEach((c) => (c.label = fmt(c.v)));
    if (new Set(cand.map((c) => norm(c.label))).size < 4) return null;
    const order = r.shuffle([0, 1, 2, 3]);
    return { list: order.map((i) => cand[i]), correct: order.indexOf(0) };
  }

  function makeVariant(t, seed) {
    for (let k = 0; k < 60; k++) {
      const s = (seed + k * 7919) >>> 0;
      const r = rng(s);
      let g;
      try {
        g = t.gen(r, FE.H);
      } catch (e) {
        g = null;
      }
      if (!g) continue;
      const ch = buildChoices(g, r);
      if (!ch) continue;
      return {
        tid: t.id, seed: s, baseSeed: seed, type: g.type || 'num',
        q: g.q, params: g.params || {}, ans: g.ans,
        choices: ch.list, correct: ch.correct,
        steps: g.steps || [], setup: g.setup || '', task: g.task || '', sep: g.sep || null,
      };
    }
    throw new Error('Could not build a valid variant for ' + t.id);
  }

  FE.H = { rng, sig, eng, fix, money, deg, rad, polar, rect, C, term };
  FE.makeVariant = makeVariant;
  FE.T = (t) => FE.TEMPLATES.push(t);
  FE.D = (t) => FE.DRILLS.push(Object.assign({ kind: 'drill' }, t));
})(typeof globalThis !== 'undefined' ? globalThis : this);
