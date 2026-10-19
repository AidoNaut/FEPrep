/* FE Prep — TI-36X Pro calculator drills.
   The math answer for every variant is checked by tools/verify.py. The feature names
   below describe WHAT to use, not exact keystrokes — those you confirm on your own
   calculator the first time and save in the app. Unconfirmed drills never enter study. */
(function (G) {
  const FE = G.FE;
  const D = FE.D;
  const { sig, eng, fix, deg, rad, polar, rect, C } = FE.H;
  const dec = (r, lo, hi, d = 1) => +(lo + (hi - lo) * r.f()).toFixed(d);
  const nz = (r, lo, hi, d = 1) => { let v = 0; while (Math.abs(v) < 0.5) v = dec(r, lo, hi, d); return v; };
  const s = (v) => String(v).replace('-', '−');

  D({ id: 'cd-r2p', set: '1.2', title: 'Rectangular → polar', feature: 'Complex menu: convert to polar (►Polar). Angle mode: DEG.',
    gen(r) {
      const z = [nz(r, -50, 50), nz(r, -50, 50)];
      return { type: 'cplx', params: { z }, q: `Convert ${rect(z, 4)} to polar form.`, ans: z, fmt: (v) => polar(v, 4),
        distract: [
          { v: C.fromPolar(C.abs(z), deg(Math.atan(z[1] / z[0]))), why: 'atan(b/a) without the quadrant fix — the calculator’s ►Polar handles this for you.' },
          { v: C.fromPolar(C.abs(z), -deg(C.ang(z))), why: 'Angle sign flipped.' },
          { v: C.fromPolar(Math.abs(z[0]) + Math.abs(z[1]), deg(C.ang(z))), why: 'Added the parts instead of √(a² + b²).' },
        ],
        steps: [`|z| = ${sig(C.abs(z), 5)}`, `θ = ${fix(deg(C.ang(z)), 2)}°`] };
    } });

  D({ id: 'cd-p2r', set: '1.2', title: 'Polar → rectangular', feature: 'Complex menu: convert to rectangular (►Rect), or type the value in polar form directly. Angle mode: DEG.',
    gen(r) {
      const m = dec(r, 2, 400, 1), a = r.pick([-162, -135, -118, -73, -41, -12, 17, 36, 58, 104, 127, 151]);
      const z = C.fromPolar(m, a);
      return { type: 'cplx', params: { m, a }, q: `Convert ${m} ∠ ${s(a)}° to rectangular form.`, ans: z, fmt: (v) => rect(v, 4),
        distract: [
          { v: [m * Math.sin(rad(a)), m * Math.cos(rad(a))], why: 'Swapped sine and cosine.' },
          { v: C.fromPolar(m, deg(a)), why: 'Calculator in radian mode.' },
          { v: C.conj(z), why: 'Sign error on the imaginary part.' },
        ],
        steps: [`${m}cos(${a}°) = ${sig(z[0], 5)}`, `${m}sin(${a}°) = ${sig(z[1], 5)}`] };
    } });

  D({ id: 'cd-cdiv', set: '6.5', title: 'Phasor division', feature: 'Complex entry: type one value in rectangular and the other in polar, divide, then ►Polar.',
    gen(r) {
      const v = C.fromPolar(dec(r, 10, 480, 0), r.pick([0, 15, 30, -20, 45])), z = [dec(r, 1, 60, 1), nz(r, -60, 60, 1)];
      const vm = C.abs(v), va = Math.round(deg(C.ang(v))), I = C.div(v, z);
      return { type: 'cplx', params: { vm, va, z }, q: `I = (${sig(vm, 3)} ∠ ${s(va)}°) / (${rect(z, 3)}). Give I in polar form.`, ans: C.div(C.fromPolar(vm, va), z), fmt: (x) => polar(x, 4),
        distract: [
          { v: C.fromPolar(vm / C.abs(z), va + deg(C.ang(z))), why: 'Added the angles — division subtracts them.' },
          { v: C.fromPolar(vm / (Math.abs(z[0]) + Math.abs(z[1])), va - deg(C.ang(z))), why: 'Used |R| + |X| as the magnitude.' },
          { v: C.mul(C.fromPolar(vm, va), z), why: 'Multiplied instead of dividing.' },
        ],
        steps: [`|Z| = ${sig(C.abs(z), 5)}, ∠Z = ${fix(deg(C.ang(z)), 2)}°`, `I = ${polar(I, 4)}`] };
    } });

  D({ id: 'cd-zpar', set: '6.6', title: 'Parallel impedances', feature: 'Complex math: Z₁Z₂/(Z₁ + Z₂), or (Z₁⁻¹ + Z₂⁻¹)⁻¹ with the x⁻¹ key.',
    gen(r) {
      const z1 = [dec(r, 1, 100, 1), dec(r, 1, 100, 1)], z2 = [dec(r, 1, 100, 1), -dec(r, 1, 100, 1)];
      const zp = C.div(C.mul(z1, z2), C.add(z1, z2));
      return { type: 'cplx', params: { z1, z2 }, q: `Z₁ = ${rect(z1, 3)} Ω and Z₂ = ${rect(z2, 3)} Ω are in parallel. Find Z_eq in rectangular form.`, ans: zp, fmt: (x) => rect(x, 4) + ' Ω',
        distract: [
          { v: [(z1[0] * z2[0]) / (z1[0] + z2[0]), (z1[1] * z2[1]) / (z1[1] + z2[1])], why: 'Combined real and imaginary parts separately.' },
          { v: C.add(z1, z2), why: 'That’s series.' },
          { v: C.conj(zp), why: 'Sign error on the reactance.' },
        ],
        steps: [`Z₁Z₂ = ${rect(C.mul(z1, z2), 5)}`, `Z₁ + Z₂ = ${rect(C.add(z1, z2), 5)}`, `Z_eq = ${rect(zp, 5)} Ω`] };
    } });

  const det3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const mat = (M) => `<table class="mat">${M.map((row) => `<tr>${row.map((v) => `<td>${s(v)}</td>`).join('')}</tr>`).join('')}</table>`;
  D({ id: 'cd-det', set: '1.7', title: 'Matrix determinant', feature: 'Matrix editor: enter a 3×3 matrix, then det( from the matrix math menu.',
    gen(r) {
      const M = [0, 1, 2].map(() => [0, 1, 2].map(() => dec(r, -9, 9, 1)));
      const d = det3(M);
      if (Math.abs(d) < 5) return null;
      return { params: { M }, q: `Find det ${mat(M)}`, ans: d, fmt: (v) => sig(v, 5),
        distract: [{ v: -d, why: 'Sign error (row order).' }, { v: M[0][0] * M[1][1] * M[2][2], why: 'Only the main diagonal product.' }, { v: d + 2 * M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]), why: 'Missed the minus on the middle cofactor.' }],
        steps: [`det = ${sig(d, 6)}`] };
    } });

  D({ id: 'cd-sys', set: '1.7', title: '3×3 linear system', feature: 'Linear-system solver (3×3), or matrix inverse × column vector.',
    gen(r) {
      const A = [0, 1, 2].map(() => [0, 1, 2].map(() => dec(r, -9, 9, 1))), b = [0, 1, 2].map(() => dec(r, -20, 20, 1));
      const d = det3(A);
      if (Math.abs(d) < 10) return null;
      const col = (k) => A.map((row, i) => row.map((v, j) => (j === k ? b[i] : v)));
      const x = [0, 1, 2].map((k) => det3(col(k)) / d);
      if (x.some((v) => Math.abs(v) < 0.05)) return null;
      const eq = (row, i) => `${s(row[0])}x ${row[1] < 0 ? '−' : '+'} ${Math.abs(row[1])}y ${row[2] < 0 ? '−' : '+'} ${Math.abs(row[2])}z = ${s(b[i])}`;
      return { params: { A, b }, q: `Solve for x:<br>${A.map(eq).join('<br>')}`, ans: x[0], fmt: (v) => sig(v, 4),
        distract: [{ v: x[1], why: 'That’s y.' }, { v: x[2], why: 'That’s z.' }, { v: -x[0], why: 'Sign slip entering a coefficient.' }],
        steps: [`x = ${sig(x[0], 6)}, y = ${sig(x[1], 6)}, z = ${sig(x[2], 6)}`] };
    } });

  D({ id: 'cd-poly', set: '1.1', title: 'Cubic root (polynomial solver)', feature: 'Polynomial solver: 3rd-order, enter a, b, c, d.',
    gen(r) {
      const b = r.int(-6, 6), c = r.int(1, 12), d = r.nonzero(-20, 20);
      const f = (x) => x ** 3 + b * x * x + c * x + d, fp = (x) => 3 * x * x + 2 * b * x + c;
      if (b * b - 3 * c >= 0) return null; // monotonic → exactly one real root
      let x = 0;
      for (let i = 0; i < 200; i++) x -= f(x) / fp(x);
      if (!isFinite(x) || Math.abs(f(x)) > 1e-9) return null;
      const T = (k, v, first) => (k === 0 ? '' : `${k < 0 ? (first ? '−' : ' − ') : first ? '' : ' + '}${Math.abs(k) === 1 && v ? '' : Math.abs(k)}${v}`);
      return { params: { b, c, d }, q: `Find the real root of x³${T(b, 'x²')}${T(c, 'x')}${T(d, '')} = 0.`, ans: x, fmt: (v) => sig(v, 5),
        distract: [{ v: -x, why: 'Sign error on d.' }, { v: x + 1, why: 'Not a root — check by substituting.' }, { v: -d / c, why: 'Ignored the higher-order terms.' }],
        steps: [`x ≈ ${sig(x, 7)}`, `Check: f(x) ≈ 0`] };
    } });

  D({ id: 'cd-solve', set: '1.1', title: 'Numeric equation solver', feature: 'Numeric solver (num-solv): enter the equation, a guess, solve.',
    gen(r) {
      const K = dec(r, 1.5, 40, 1);
      let lo = 0, hi = 10;
      for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (m * Math.exp(m) < K) lo = m; else hi = m; }
      const x = (lo + hi) / 2;
      return { params: { K }, q: `Solve x·eˣ = ${K} for x > 0.`, ans: x, fmt: (v) => sig(v, 5),
        distract: [{ v: Math.log(K), why: 'Dropped the x factor (solved eˣ = K).' }, { v: K / Math.E, why: 'Not a solution — substitute to check.' }, { v: Math.sqrt(K) / 2, why: 'Not a solution — substitute to check.' }],
        steps: [`x ≈ ${sig(x, 7)}`, `Check: ${sig(x, 5)}·e^${sig(x, 5)} ≈ ${K}`] };
    } });

  function simpson(f, a, b, n = 2000) {
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) sum += f(a + i * h) * (i % 2 ? 4 : 2);
    return (sum * h) / 3;
  }
  D({ id: 'cd-int', set: '1.5', title: 'Definite integral', feature: 'Numeric integral template (∫ from the math menu).',
    gen(r) {
      const a = r.pick([0, 0.5, 1]), b = a + r.pick([1, 1.5, 2, 3]), k = r.pick([0.5, 1, 2]);
      const f = (x) => x * x * Math.exp(-k * x), I = simpson(f, a, b);
      return { params: { a, b, k }, q: `Evaluate ∫ from ${a} to ${b} of x²·e^(−${k}x) dx.`, ans: I, fmt: (v) => sig(v, 5),
        distract: [{ v: f(b) - f(a), why: 'Evaluated the integrand at the limits.' }, { v: simpson((x) => x * x * Math.exp(-x / k), a, b), why: 'Typed the exponent as −x/k.' }, { v: simpson((x) => x * Math.exp(-k * x), a, b), why: 'Typed x instead of x².' }],
        steps: [`∫ ≈ ${sig(I, 7)}`] };
    } });

  D({ id: 'cd-deriv', set: '1.5', title: 'Numeric derivative', feature: 'Numeric derivative template (d/dx from the math menu). Angle mode: RAD.',
    gen(r) {
      const a = r.int(1, 5), x0 = r.pick([0.4, 0.7, 1.2, 1.9, 2.5]);
      const f = (x) => Math.log(x * x + a) * Math.sin(x), d = ((2 * x0) / (x0 * x0 + a)) * Math.sin(x0) + Math.log(x0 * x0 + a) * Math.cos(x0);
      return { params: { a, x0 }, q: `f(x) = ln(x² + ${a})·sin(x). Find f′(${x0}) (radians).`, ans: d, fmt: (v) => sig(v, 5),
        distract: [{ v: ((2 * x0) / (x0 * x0 + a)) * Math.cos(x0), why: 'Product rule missed a term.' }, { v: f(x0), why: 'That’s f(x₀), not the derivative.' }, { v: ((2 * x0) / (x0 * x0 + a)) * Math.sin(rad(x0)) + Math.log(x0 * x0 + a) * Math.cos(rad(x0)), why: 'Calculator in degree mode.' }],
        steps: [`f′(x) = [2x/(x² + ${a})]sin x + ln(x² + ${a})cos x`, `f′(${x0}) ≈ ${sig(d, 7)}`] };
    } });

  D({ id: 'cd-stats', set: '2.1', title: 'One-variable statistics', feature: 'Data editor → 1-Var Stats: read Sx (sample) vs σx (population).',
    gen(r) {
      const xs = Array.from({ length: 8 }, () => dec(r, 10, 40, 1));
      const n = xs.length, m = xs.reduce((a, b) => a + b) / n, ss = xs.reduce((a, x) => a + (x - m) ** 2, 0);
      const Sx = Math.sqrt(ss / (n - 1));
      return { params: { xs }, q: `Data: ${xs.join(', ')}. Find the sample standard deviation Sx.`, ans: Sx, fmt: (v) => sig(v, 5),
        distract: [{ v: Math.sqrt(ss / n), why: 'That’s σx (population).' }, { v: ss / (n - 1), why: 'That’s the sample variance.' }, { v: m, why: 'That’s the mean.' }],
        steps: [`x̄ = ${sig(m, 6)}`, `Sx = ${sig(Sx, 6)}, σx = ${sig(Math.sqrt(ss / n), 6)}`] };
    } });

  D({ id: 'cd-base', set: '15.2', title: 'Hex logic operations', feature: 'Base-n mode (HEX) with the logic menu (and, or, xor).',
    gen(r) {
      const a = r.int(0x100, 0xffff), b = r.int(0x100, 0xffff), op = r.pick(['AND', 'OR', 'XOR']);
      const f = { AND: (x, y) => x & y, OR: (x, y) => x | y, XOR: (x, y) => x ^ y };
      const H = (x) => x.toString(16).toUpperCase();
      return { type: 'text', params: { a, b, op }, q: `In hexadecimal: ${H(a)} ${op} ${H(b)} = ?`, ans: H(f[op](a, b)),
        distract: Object.keys(f).filter((o) => o !== op).map((o) => ({ v: H(f[o](a, b)), why: `That’s ${o}.` })).concat([{ v: H((a + b) & 0xffff), why: 'That’s addition.' }, { v: H(f[op](a, b) ^ 0x10), why: 'One digit off.' }]),
        steps: [`${H(a)} ${op} ${H(b)} = ${H(f[op](a, b))}`] };
    } });

  D({ id: 'cd-db', set: '7.4', title: 'Decibel conversions', feature: 'log and 10^x keys.',
    gen(r) {
      const kind = r.pick(['v2db', 'db2v', 'p2db']);
      if (kind === 'v2db') { const x = dec(r, 0.02, 80, 2); return { params: { kind, x }, q: `A voltage gain of ${x} is how many dB?`, ans: 20 * Math.log10(x), fmt: (v) => fix(v, 2) + ' dB', sep: { abs: 0.3 },
        distract: [{ v: 10 * Math.log10(x), why: 'Used 10·log — that’s for power.' }, { v: 20 * Math.log(x), why: 'Used ln instead of log₁₀.' }, { v: 20 * x, why: 'Forgot the log.' }], steps: [`20 log ${x} = ${fix(20 * Math.log10(x), 3)} dB`] }; }
      if (kind === 'p2db') { const x = dec(r, 0.02, 500, 2); return { params: { kind, x }, q: `A power ratio of ${x} is how many dB?`, ans: 10 * Math.log10(x), fmt: (v) => fix(v, 2) + ' dB', sep: { abs: 0.3 },
        distract: [{ v: 20 * Math.log10(x), why: 'Used 20·log — that’s for voltage.' }, { v: 10 * Math.log(x), why: 'Used ln instead of log₁₀.' }, { v: 10 * x, why: 'Forgot the log.' }], steps: [`10 log ${x} = ${fix(10 * Math.log10(x), 3)} dB`] }; }
      const dB = dec(r, -40, 46, 1);
      return { params: { kind, dB }, q: `${s(dB)} dB of voltage gain is what voltage ratio?`, ans: 10 ** (dB / 20), fmt: (v) => sig(v, 4),
        distract: [{ v: 10 ** (dB / 10), why: 'Divided by 10 — that’s a power ratio.' }, { v: Math.exp(dB / 20), why: 'Used eˣ instead of 10ˣ.' }, { v: dB / 20, why: 'Forgot to take 10 to the power.' }], steps: [`10^(${dB}/20) = ${sig(10 ** (dB / 20), 5)}`] };
    } });

  D({ id: 'cd-eng', set: '7.2', title: 'Engineering notation', feature: 'Mode → ENG display; enter powers of ten with the ×10ⁿ key.',
    gen(r) {
      const L = r.pick([0.47, 1, 2.2, 4.7, 10, 22, 47, 100]), Cp = r.pick([1, 4.7, 10, 22, 47, 100, 220, 470]);
      const f = 1 / (2 * Math.PI * Math.sqrt(L * 1e-6 * Cp * 1e-12));
      return { params: { L, Cp }, q: `L = ${L} µH, C = ${Cp} pF. Find f₀ = 1/(2π√(LC)).`, ans: f, fmt: (v) => eng(v, 'Hz', 4),
        distract: [{ v: f * 1000, why: 'Entered µ as 10⁻⁹ (power-of-ten slip).' }, { v: f / 1000, why: 'Entered p as 10⁻⁹ (power-of-ten slip).' }, { v: f * 2 * Math.PI, why: 'That’s ω₀ in rad/s.' }],
        steps: [`f₀ = ${eng(f, 'Hz', 5)}`] };
    } });

  D({ id: 'cd-recip', set: '6.2', title: 'Parallel resistors (reciprocals)', feature: 'x⁻¹ key, or store values in variables (sto→) and recall them.',
    gen(r) {
      const R = [0, 1, 2].map(() => r.res(10, 100000));
      const Rp = 1 / (1 / R[0] + 1 / R[1] + 1 / R[2]);
      return { params: { R }, q: `Find the parallel combination of ${R.map((x) => eng(x, 'Ω')).join(', ')}.`, ans: Rp, fmt: (v) => eng(v, 'Ω', 4),
        distract: [{ v: 1 / R[0] + 1 / R[1] + 1 / R[2], why: 'Forgot the final reciprocal (that’s conductance).' }, { v: (R[0] * R[1] * R[2]) / (R[0] + R[1] + R[2]), why: 'Product-over-sum only works for two resistors.' }, { v: (R[0] + R[1] + R[2]) / 3, why: 'Averaged them.' }],
        steps: [`R_p = ${eng(Rp, 'Ω', 5)}`] };
    } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
