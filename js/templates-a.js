/* FE Prep — generated problem templates, areas 1–8.
   Every template here is UNVERIFIED until the user approves it in the Verify queue.
   Each id has an independent checker in tools/verify.py. */
(function (G) {
  const FE = G.FE;
  const T = FE.T;
  const { sig, eng, fix, money, deg, rad, polar, rect, C, term } = FE.H;
  const sq = (x) => x * x;
  const par = (a, b) => (a * b) / (a + b);
  const HB = (ch, find) => ({ ch, find });

  // ======================= 1 MATHEMATICS =======================
  T({ id: 'm-quad', set: '1.1', title: 'Quadratic roots', hb: HB('Mathematics', 'quadratic equation'),
    gen(r) {
      const a = r.int(1, 4), b = r.nonzero(-12, 12), c = r.int(-20, 20);
      const D = b * b - 4 * a * c;
      if (D <= 0) return null;
      const s = Math.sqrt(D), x1 = (-b + s) / (2 * a), x2 = (-b - s) / (2 * a);
      return {
        params: { a, b, c },
        q: `Find the larger root of ${term(a, 'x²', true)}${term(b, 'x')}${term(c, '')} = 0.`,
        ans: x1, fmt: (v) => sig(v, 4),
        distract: [
          { v: x2, why: 'That’s the smaller root.' },
          { v: (b + s) / (2 * a), why: 'Sign of b not flipped in −b.' },
          { v: (-b + s) / a, why: 'Divided by a instead of 2a.' },
        ],
        setup: 'x = (−b ± √(b² − 4ac)) / 2a',
        steps: [`D = b² − 4ac = (${b})² − 4(${a})(${c}) = ${D}`,
          `x = (${-b} ± ${sig(s, 5)}) / ${2 * a}`, `Larger root = ${sig(x1, 5)}`],
      };
    } });

  T({ id: 'm-cosines', set: '1.1', title: 'Law of cosines', hb: HB('Mathematics', 'Law of Cosines'),
    gen(r) {
      const a = r.int(3, 20), b = r.int(3, 20), Cd = r.pick([25, 35, 40, 50, 65, 70, 80, 100, 110, 120, 135, 150]);
      const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(Cd)));
      return {
        params: { a, b, Cd },
        q: `Two sides of a triangle are a = ${a} m and b = ${b} m, and the angle between them is C = ${Cd}°. Find the third side c.`,
        ans: c, fmt: (v) => sig(v) + ' m',
        distract: [
          { v: Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(rad(Cd))), why: 'Sign flipped on the 2ab·cos C term.' },
          { v: Math.sqrt(a * a + b * b), why: 'Treated it as a right triangle.' },
          { v: Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(Cd)), why: 'Calculator in radian mode.' },
        ],
        setup: 'c² = a² + b² − 2ab·cos C',
        steps: [`c² = ${a}² + ${b}² − 2(${a})(${b})cos ${Cd}° = ${sig(c * c, 5)}`, `c = ${sig(c, 4)} m`],
      };
    } });

  T({ id: 'm-cmul', set: '1.2', title: 'Complex multiplication (polar)', hb: HB('Mathematics', 'complex numbers'),
    gen(r) {
      const a = r.nonzero(-9, 9), b = r.nonzero(-9, 9), m2 = r.int(2, 12);
      const t2 = r.pick([-150, -120, -60, -45, -30, 30, 45, 60, 120, 150]);
      const z1 = [a, b], z2 = C.fromPolar(m2, t2), p = C.mul(z1, z2);
      const m1 = C.abs(z1), th1 = deg(C.ang(z1));
      return {
        type: 'cplx', params: { a, b, m2, t2 },
        q: `Evaluate (${rect(z1)}) × (${m2} ∠ ${t2}°). Give the result in polar form.`,
        ans: p, fmt: (v) => polar(v),
        distract: [
          { v: C.fromPolar(m1 * m2, deg(Math.atan(b / a)) + t2), why: 'Angle of the first number taken from atan(b/a) without fixing the quadrant.' },
          { v: C.fromPolar(m1 * m2, th1 - t2), why: 'Subtracted angles — that’s the rule for division.' },
          { v: C.fromPolar(m1 + m2, th1 + t2), why: 'Added magnitudes instead of multiplying them.' },
        ],
        setup: 'Multiply magnitudes, add angles.',
        steps: [`${rect(z1)} = ${sig(m1, 4)} ∠ ${fix(th1, 2)}°`,
          `Magnitude: ${sig(m1, 4)} × ${m2} = ${sig(m1 * m2, 4)}`,
          `Angle: ${fix(th1, 2)}° + (${t2}°) = ${fix(deg(C.ang(p)), 2)}° (wrapped to ±180°)`],
      };
    } });

  T({ id: 'm-cdiv', set: '1.2', title: 'Complex division (rectangular)', hb: HB('Mathematics', 'complex numbers'),
    gen(r) {
      const z1 = [r.nonzero(-9, 9), r.nonzero(-9, 9)], z2 = [r.nonzero(-6, 6), r.nonzero(-6, 6)];
      const q = C.div(z1, z2), d = sq(z2[0]) + sq(z2[1]);
      const num = C.mul(z1, C.conj(z2));
      if (Math.abs(q[1]) < 0.05 || Math.abs(q[0]) < 0.05) return null;
      return {
        type: 'cplx', params: { z1, z2 },
        q: `Evaluate (${rect(z1)}) ÷ (${rect(z2)}). Give the result in rectangular form.`,
        ans: q, fmt: (v) => rect(v),
        distract: [
          { v: C.conj(q), why: 'Sign error on the imaginary part.' },
          { v: [C.mul(z1, z2)[0] / d, C.mul(z1, z2)[1] / d], why: 'Multiplied by the denominator instead of its conjugate.' },
          { v: num, why: 'Forgot to divide by c² + d².' },
        ],
        setup: 'Multiply top and bottom by the conjugate of the denominator.',
        steps: [`Numerator × (${rect(C.conj(z2))}) = ${rect(num)}`, `Denominator: ${z2[0]}² + ${z2[1]}² = ${d}`,
          `Result = ${rect(q, 4)}`],
      };
    } });

  T({ id: 'm-geo', set: '1.3', title: 'Geometric series sum', hb: HB('Mathematics', 'geometric progression'),
    gen(r) {
      const a = r.int(1, 9), q = r.pick([0.5, 0.8, 1.5, 2, 3]), n = r.int(4, 9);
      const S = (k) => (a * (1 - Math.pow(q, k))) / (1 - q);
      return {
        params: { a, q, n },
        q: `A geometric progression has first term ${a} and common ratio ${q}. Find the sum of the first ${n} terms.`,
        ans: S(n), fmt: (v) => (Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v).toLocaleString('en-US') : sig(v, 4)),
        distract: [
          { v: S(n - 1), why: 'Summed one term too few (used n − 1).' },
          { v: a * Math.pow(q, n - 1), why: 'That’s the nth term, not the sum.' },
          q < 1 ? { v: a / (1 - q), why: 'Used the infinite-series formula.' } : { v: S(n + 1), why: 'Summed one term too many.' },
        ],
        setup: 'Sₙ = a(1 − rⁿ)/(1 − r)',
        steps: [`Sₙ = ${a}(1 − ${q}^${n}) / (1 − ${q}) = ${sig(S(n), 5)}`],
      };
    } });

  T({ id: 'm-ptline', set: '1.4', title: 'Point-to-line distance', hb: HB('Mathematics', 'straight line'),
    gen(r) {
      const A = r.nonzero(-6, 6), B = r.nonzero(-6, 6), Cc = r.int(-15, 15), x0 = r.int(-8, 8), y0 = r.int(-8, 8);
      const n = A * x0 + B * y0 + Cc;
      if (n === 0) return null;
      const d = Math.abs(n) / Math.hypot(A, B);
      return {
        params: { A, B, C: Cc, x0, y0 },
        q: `Find the perpendicular distance from the point (${x0}, ${y0}) to the line ${term(A, 'x', true)}${term(B, 'y')}${term(Cc, '')} = 0.`,
        ans: d, fmt: (v) => sig(v, 4),
        distract: [
          { v: Math.abs(n) / (A * A + B * B), why: 'Forgot the square root in the denominator.' },
          { v: Math.abs(A * x0 + B * y0) / Math.hypot(A, B), why: 'Dropped the constant term.' },
          { v: Math.abs(n) / (Math.abs(A) + Math.abs(B)), why: 'Added |A| + |B| instead of √(A² + B²).' },
        ],
        setup: 'd = |Ax₀ + By₀ + C| / √(A² + B²)',
        steps: [`|${A}(${x0}) + ${B}(${y0}) + ${Cc}| = ${Math.abs(n)}`, `√(${A}² + ${B}²) = ${sig(Math.hypot(A, B), 5)}`, `d = ${sig(d, 5)}`],
      };
    } });

  T({ id: 'm-deriv', set: '1.5', title: 'Derivative with chain rule', hb: HB('Mathematics', 'derivative'),
    gen(r) {
      const a = r.nonzero(-5, 5), b = r.int(2, 9), c = r.pick([0.5, 2, 3]), x0 = r.pick([0.5, 1, 1.5, 2]);
      const f1 = 3 * a * x0 * x0 + b * c * Math.cos(c * x0);
      return {
        params: { a, b, c, x0 },
        q: `f(x) = ${term(a, 'x³', true)}${term(b, ` sin(${c}x)`)}. Find f′(${x0}), with x in radians.`,
        ans: f1, fmt: (v) => sig(v, 4),
        distract: [
          { v: 3 * a * x0 * x0 + b * Math.cos(c * x0), why: 'Forgot the chain-rule factor c.' },
          { v: 3 * a * x0 * x0 - b * c * Math.cos(c * x0), why: 'Took d/dx sin as −cos.' },
          { v: 3 * a * x0 * x0 + b * c * Math.cos(rad(c * x0)), why: 'Calculator in degree mode.' },
        ],
        setup: 'd/dx[sin(cx)] = c·cos(cx)',
        steps: [`f′(x) = ${3 * a}x² + ${b * c}cos(${c}x)`, `f′(${x0}) = ${sig(3 * a * x0 * x0, 5)} + ${b * c}·cos(${c * x0}) = ${sig(f1, 5)}`],
      };
    } });

  T({ id: 'm-integral', set: '1.5', title: 'Definite integral of a polynomial', hb: HB('Mathematics', 'integral calculus'),
    gen(r) {
      const a = r.nonzero(-6, 6), b = r.int(-6, 6), c = r.int(-6, 6), p = r.int(0, 2), q = p + r.int(1, 3);
      const F = (x) => (a * x ** 3) / 3 + (b * x * x) / 2 + c * x, f = (x) => a * x * x + b * x + c;
      const I = F(q) - F(p);
      if (Math.abs(I) < 0.5) return null;
      return {
        params: { a, b, c, p, q },
        q: `Evaluate ∫ from ${p} to ${q} of (${term(a, 'x²', true)}${term(b, 'x')}${term(c, '')}) dx.`,
        ans: I, fmt: (v) => sig(v, 4),
        distract: [
          { v: f(q) - f(p), why: 'Evaluated the integrand, not the antiderivative.' },
          { v: a * (q ** 3 - p ** 3) + (b * (q * q - p * p)) / 2 + c * (q - p), why: 'Forgot to divide the x³ term by 3.' },
          { v: (a * (q ** 3 - p ** 3)) / 3 + (b * (q * q - p * p)) / 2 + c, why: 'Constant term not multiplied by x.' },
        ],
        setup: '∫xⁿ dx = xⁿ⁺¹/(n+1)',
        steps: [`F(x) = ${sig(a / 3, 4)}x³ + ${sig(b / 2, 4)}x² + ${c}x`, `F(${q}) − F(${p}) = ${sig(F(q), 5)} − ${sig(F(p), 5)} = ${sig(I, 5)}`],
      };
    } });

  T({ id: 'm-ode1', set: '1.6', title: 'First-order linear ODE', hb: HB('Mathematics', 'differential equations'), tol: { rel: 1e-6 },
    gen(r) {
      const k = r.pick([0.5, 1, 2, 4]), u = r.int(2, 20), y0 = r.int(0, 10), t1 = r.pick([0.25, 0.5, 1, 2]);
      const yf = u / k;
      if (Math.abs(y0 - yf) < 0.5) return null;
      const y = yf + (y0 - yf) * Math.exp(-k * t1);
      return {
        params: { k, u, y0, t1 },
        q: `Solve dy/dt + ${k}y = ${u} with y(0) = ${y0}. Find y(${t1}).`,
        ans: y, fmt: (v) => sig(v, 4),
        distract: [
          { v: yf * (1 - Math.exp(-k * t1)), why: 'Ignored the initial condition.' },
          { v: y0 * Math.exp(-k * t1), why: 'Ignored the forcing term.' },
          { v: yf + (y0 - yf) * Math.exp(-t1 / k), why: 'Used t/k in the exponent instead of kt.' },
        ],
        setup: 'y(t) = y_final + (y₀ − y_final)·e^(−kt), y_final = u/k',
        steps: [`y_final = ${u}/${k} = ${sig(yf, 4)}`, `y(${t1}) = ${sig(yf, 4)} + (${y0} − ${sig(yf, 4)})e^(−${k}·${t1}) = ${sig(y, 5)}`],
      };
    } });

  const matHTML = (M) => `<table class="mat">${M.map((row) => `<tr>${row.map((v) => `<td>${String(v).replace('-', '−')}</td>`).join('')}</tr>`).join('')}</table>`;
  const intFmt = (v) => String(Math.round(v)).replace('-', '−');

  T({ id: 'm-det3', set: '1.7', title: '3×3 determinant', hb: HB('Mathematics', 'determinant'),
    gen(r) {
      const M = [0, 1, 2].map(() => [0, 1, 2].map(() => r.int(-4, 6)));
      const [[a, b, c], [d, e, f], [g, h, i]] = M;
      const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      if (det === 0) return null;
      return {
        params: { M },
        q: `Find the determinant of ${matHTML(M)}`,
        ans: det, fmt: intFmt, noFill: true,
        distract: [
          { v: a * (e * i - f * h) + b * (d * i - f * g) + c * (d * h - e * g), why: 'Missed the minus sign on the middle cofactor.' },
          { v: a * e * i + b * f * g + c * d * h, why: 'Kept only the “down-right” diagonal products.' },
          { v: a * (e * i - f * h), why: 'Expanded only the first term.' },
        ],
        setup: 'Cofactor expansion along row 1 with signs + − +',
        steps: [`${a}(${e}·${i} − ${f}·${h}) − ${b}(${d}·${i} − ${f}·${g}) + ${c}(${d}·${h} − ${e}·${g})`, `= ${det}`],
      };
    } });

  T({ id: 'm-sys3', set: '1.7', title: '3×3 linear system', hb: HB('Mathematics', 'Cramer'),
    gen(r) {
      const X = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)];
      const A = [0, 1, 2].map(() => [0, 1, 2].map(() => r.int(-4, 5)));
      const [[a, b, c], [d, e, f], [g, h, i]] = A;
      const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      if (det === 0) return null;
      const B = A.map((row) => row[0] * X[0] + row[1] * X[1] + row[2] * X[2]);
      const eq = (row, k) => `${term(row[0], 'x', true) || ''}${row[0] === 0 ? term(row[1], 'y', true) : term(row[1], 'y')}${row[0] === 0 && row[1] === 0 ? term(row[2], 'z', true) : term(row[2], 'z')} = ${String(B[k]).replace('-', '−')}`;
      if (A.some((row) => row.every((v) => v === 0))) return null;
      return {
        params: { A, B },
        q: `Solve for y:<br>${A.map((row, k) => eq(row, k)).join('<br>')}`,
        ans: X[1], fmt: intFmt, noFill: true,
        distract: [
          { v: X[0], why: 'That’s x.' }, { v: X[2], why: 'That’s z.' }, { v: -X[1], why: 'Sign error.' },
          { v: X[1] + 1, why: 'Arithmetic slip.' }, { v: X[1] - 1, why: 'Arithmetic slip.' },
        ],
        setup: 'Cramer’s rule: y = det(A with column 2 replaced by b) / det(A)',
        steps: [`det(A) = ${det}`, `x = ${X[0]}, y = ${X[1]}, z = ${X[2]} (check by substitution)`],
      };
    } });

  T({ id: 'm-vecang', set: '1.7', title: 'Angle between vectors', hb: HB('Mathematics', 'dot product'),
    gen(r) {
      const A = [r.int(-6, 6), r.int(-6, 6), r.nonzero(-6, 6)], B = [r.int(-6, 6), r.nonzero(-6, 6), r.int(-6, 6)];
      const dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2], mA = Math.hypot(...A), mB = Math.hypot(...B);
      if (dot === 0) return null;
      const th = deg(Math.acos(dot / (mA * mB)));
      const dot2 = A[0] * B[0] + A[1] * B[1], m2 = Math.hypot(A[0], A[1]) * Math.hypot(B[0], B[1]);
      const v = (u) => `${u[0]}i ${u[1] < 0 ? '−' : '+'} ${Math.abs(u[1])}j ${u[2] < 0 ? '−' : '+'} ${Math.abs(u[2])}k`.replace(/^-/, '−');
      return {
        params: { A, B },
        q: `Find the angle between <b>A</b> = ${v(A)} and <b>B</b> = ${v(B)}.`,
        ans: th, fmt: (x) => fix(x, 1) + '°', noFill: true,
        distract: [
          { v: 180 - th, why: 'Sign error in the dot product.' },
          { v: m2 > 0 && Math.abs(dot2 / m2) <= 1 ? deg(Math.acos(dot2 / m2)) : NaN, why: 'Dropped the z-components.' },
          { v: deg(Math.acos(Math.max(-1, Math.min(1, dot / (mA * mA))))), why: 'Divided by |A|² instead of |A||B|.' },
          { v: Math.abs(90 - th), why: 'Took the complement (used sine instead of cosine).' },
          { v: deg(Math.acos(Math.max(-1, Math.min(1, dot / (mA * mB * 2))))), why: 'Extra factor of 2 in the denominator.' },
        ],
        setup: 'cos θ = (A·B) / (|A||B|)',
        steps: [`A·B = ${dot}`, `|A| = ${sig(mA, 4)}, |B| = ${sig(mB, 4)}`, `θ = acos(${sig(dot / (mA * mB), 4)}) = ${fix(th, 2)}°`],
      };
    } });

  // ======================= 2 PROBABILITY & STATISTICS =======================
  T({ id: 'p-stdev', set: '2.1', title: 'Sample standard deviation', hb: HB('Engineering Probability and Statistics', 'standard deviation'),
    gen(r) {
      const xs = [0, 1, 2, 3, 4, 5].map(() => r.int(2, 30));
      const n = xs.length, m = xs.reduce((a, b) => a + b) / n;
      const ss = xs.reduce((a, x) => a + sq(x - m), 0);
      if (ss === 0) return null;
      const s = Math.sqrt(ss / (n - 1));
      return {
        params: { xs },
        q: `Six readings: ${xs.join(', ')}. Find the sample standard deviation.`,
        ans: s, fmt: (v) => sig(v, 4),
        distract: [
          { v: Math.sqrt(ss / n), why: 'Divided by n — that’s the population formula.' },
          { v: ss / (n - 1), why: 'That’s the sample variance (no square root).' },
          { v: xs.reduce((a, x) => a + Math.abs(x - m), 0) / n, why: 'That’s the mean absolute deviation.' },
        ],
        setup: 's = √[Σ(xᵢ − x̄)² / (n − 1)]',
        steps: [`x̄ = ${sig(m, 5)}`, `Σ(xᵢ − x̄)² = ${sig(ss, 5)}`, `s = √(${sig(ss, 5)}/5) = ${sig(s, 5)}`],
      };
    } });

  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
  const nCr = (n, k) => fact(n) / (fact(k) * fact(n - k));
  const nPr = (n, k) => fact(n) / fact(n - k);
  const big = (v) => Math.round(v).toLocaleString('en-US');

  T({ id: 'p-count', set: '2.2', title: 'Permutations vs combinations', hb: HB('Engineering Probability and Statistics', 'permutations'),
    gen(r) {
      const n = r.int(6, 12), k = r.int(2, 5), kind = r.pick(['comb', 'perm']);
      const c = nCr(n, k), p = nPr(n, k);
      const roles = ['lead', 'second', 'third', 'fourth', 'fifth'].slice(0, k).join(', ');
      return {
        params: { n, k, kind },
        q: kind === 'comb'
          ? `A crew of ${k} technicians is picked from ${n} candidates. How many different crews are possible?`
          : `${k} of ${n} candidates are each given a different role (${roles}). How many different assignments are possible?`,
        ans: kind === 'comb' ? c : p, fmt: big, noFill: true,
        distract: [
          { v: kind === 'comb' ? p : c, why: kind === 'comb' ? 'Order doesn’t matter for a crew — that’s a permutation.' : 'Roles make order matter — that’s a combination.' },
          { v: n ** k, why: 'Allowed the same person twice.' },
          { v: fact(k), why: 'Only counted arrangements of the chosen people.' },
        ],
        setup: kind === 'comb' ? 'C(n, k) = n! / [k!(n − k)!]' : 'P(n, k) = n! / (n − k)!',
        steps: [kind === 'comb' ? `C(${n}, ${k}) = ${n}! / (${k}!·${n - k}!) = ${big(c)}` : `P(${n}, ${k}) = ${n}! / ${n - k}! = ${big(p)}`],
      };
    } });

  T({ id: 'p-atleast', set: '2.2', title: 'At least one event', hb: HB('Engineering Probability and Statistics', 'probability'),
    gen(r) {
      const n = r.int(3, 8), p = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3]);
      const ans = 1 - Math.pow(1 - p, n);
      return {
        params: { n, p },
        q: `Each of ${n} redundant sensors independently fails during a test with probability ${p}. What is the probability that at least one fails?`,
        ans, fmt: (v) => fix(v, 4),
        distract: [
          n * p < 1 ? { v: n * p, why: 'Added probabilities — only close when n·p is tiny.' } : null,
          { v: Math.pow(1 - p, n), why: 'That’s the probability none fail.' },
          { v: 1 - Math.pow(p, n), why: 'Complemented “all fail” instead of “none fail”.' },
        ],
        setup: 'P(at least one) = 1 − P(none) = 1 − (1 − p)ⁿ',
        steps: [`(1 − ${p})^${n} = ${fix(Math.pow(1 - p, n), 5)}`, `1 − ${fix(Math.pow(1 - p, n), 5)} = ${fix(ans, 5)}`],
      };
    } });

  T({ id: 'p-binom', set: '2.3', title: 'Binomial probability', hb: HB('Engineering Probability and Statistics', 'binomial distribution'),
    gen(r) {
      const n = r.int(5, 12), k = r.int(1, n - 1), p = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]);
      const pmf = (j) => nCr(n, j) * p ** j * (1 - p) ** (n - j);
      const ans = pmf(k);
      if (ans < 0.001) return null;
      let cdf = 0;
      for (let j = 0; j <= k; j++) cdf += pmf(j);
      return {
        params: { n, k, p },
        q: `A batch test has ${n} independent trials, each passing with probability ${p}. What is the probability of exactly ${k} passes?`,
        ans, fmt: (v) => fix(v, 4),
        distract: [
          { v: p ** k * (1 - p) ** (n - k), why: 'Forgot the C(n, k) factor.' },
          { v: nCr(n, k) * p ** k, why: 'Forgot the (1 − p)^(n−k) factor.' },
          { v: cdf, why: 'That’s P(X ≤ k), the cumulative probability.' },
        ],
        setup: 'P(X = k) = C(n, k)·pᵏ·(1 − p)ⁿ⁻ᵏ',
        steps: [`C(${n}, ${k}) = ${nCr(n, k)}`, `${nCr(n, k)} × ${p}^${k} × ${1 - p}^${n - k} = ${fix(ans, 5)}`],
      };
    } });

  function Phi(z) {
    // Normal CDF via erf (W. J. Cody rational approximation, |err| < 1e-14)
    return 0.5 * (1 + erf(z / Math.SQRT2));
  }
  function erf(x) {
    // high-accuracy series/continued fraction
    const t = Math.abs(x);
    let r;
    if (t < 2.5) {
      let sum = t, term1 = t;
      for (let n = 1; n < 80; n++) { term1 *= (-t * t) / n; sum += term1 / (2 * n + 1); }
      r = (2 / Math.sqrt(Math.PI)) * sum;
    } else {
      // continued fraction for erfc
      let f = 0;
      for (let n = 60; n >= 1; n--) f = n / 2 / (t + f);
      r = 1 - Math.exp(-t * t) / Math.sqrt(Math.PI) / (t + f);
    }
    return x < 0 ? -r : r;
  }
  FE.H.Phi = Phi;

  T({ id: 'p-normal', set: '2.3', title: 'Normal distribution', hb: HB('Engineering Probability and Statistics', 'unit normal distribution'), tol: { abs: 1e-7 },
    gen(r) {
      const mu = r.pick([50, 100, 120, 500]), s = r.pick([2, 4, 5, 10, 20, 25]);
      const z = r.pick([-2, -1.5, -1.2, -1, -0.8, -0.5, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5]);
      const x = mu + z * s, dir = r.pick(['<', '>']);
      const pl = Phi(z), ans = dir === '<' ? pl : 1 - pl;
      return {
        params: { mu, s, x, dir },
        q: `A resistance is normally distributed with mean ${mu} Ω and standard deviation ${s} Ω. What is P(R ${dir} ${sig(x, 4)} Ω)?`,
        ans, fmt: (v) => fix(v, 4),
        distract: [
          { v: 1 - ans, why: 'Took the wrong tail.' },
          { v: Math.abs(pl - 0.5), why: 'Used only the area between the mean and x.' },
          { v: dir === '<' ? Phi((x - mu) / (s * s)) : 1 - Phi((x - mu) / (s * s)), why: 'Divided by the variance instead of σ.' },
        ],
        setup: 'z = (x − μ)/σ, then read the unit normal table',
        steps: [`z = (${sig(x, 4)} − ${mu}) / ${s} = ${z}`, `F(${z}) = ${fix(pl, 4)}`, dir === '<' ? `P = ${fix(ans, 4)}` : `P = 1 − ${fix(pl, 4)} = ${fix(ans, 4)}`],
      };
    } });

  T({ id: 'p-ev', set: '2.4', title: 'Expected value', hb: HB('Engineering Probability and Statistics', 'expected value'),
    gen(r) {
      const ps = r.pick([[0.5, 0.3, 0.2], [0.6, 0.25, 0.15], [0.4, 0.35, 0.25], [0.7, 0.2, 0.1], [0.45, 0.3, 0.15, 0.1]]);
      const xs = ps.map(() => r.int(-20, 60) * 1000);
      if (!xs.some((x) => x < 0)) xs[xs.length - 1] = -r.int(5, 40) * 1000;
      const ev = ps.reduce((a, p, i) => a + p * xs[i], 0);
      if (Math.abs(ev) < 500) return null;
      return {
        params: { ps, xs },
        q: `A bid has these outcomes:<br>${ps.map((p, i) => `${money(xs[i])} with probability ${p}`).join('<br>')}<br>What is the expected value?`,
        ans: ev, fmt: money,
        distract: [
          { v: xs.reduce((a, b) => a + b) / xs.length, why: 'Unweighted average — ignored the probabilities.' },
          { v: ps.reduce((a, p, i) => a + p * Math.abs(xs[i]), 0), why: 'Treated the loss as a gain.' },
          { v: Math.max(...xs) * ps[xs.indexOf(Math.max(...xs))], why: 'Counted only the best outcome.' },
        ],
        setup: 'E[X] = Σ pᵢxᵢ',
        steps: [ps.map((p, i) => `${p}(${money(xs[i])})`).join(' + ') + ` = ${money(ev)}`],
      };
    } });

  // ======================= 4 ENGINEERING ECONOMICS =======================
  T({ id: 'e-fp', set: '4.1', title: 'Future worth (F/P)', hb: HB('Engineering Economics', 'single payment compound amount'),
    gen(r) {
      const P = r.step(1000, 50000, 500), i = r.pick([3, 4, 5, 6, 8, 10, 12]), n = r.int(3, 20), ii = i / 100;
      const F = P * (1 + ii) ** n;
      return {
        params: { P, i, n },
        q: `${money(P)} is deposited today at ${i}% interest compounded annually. What is it worth after ${n} years?`,
        ans: F, fmt: money,
        distract: [
          { v: P * (1 + n * ii), why: 'Used simple interest.' },
          { v: P * (1 + ii) ** (n - 1), why: 'One period short.' },
          { v: P / (1 + ii) ** n, why: 'Used P/F instead of F/P.' },
        ],
        setup: 'F = P(1 + i)ⁿ  [factor (F/P, i, n)]',
        steps: [`(F/P, ${i}%, ${n}) = ${fix((1 + ii) ** n, 4)}`, `F = ${money(P)} × ${fix((1 + ii) ** n, 4)} = ${money(F)}`],
      };
    } });

  T({ id: 'e-pa', set: '4.1', title: 'Present worth of an annuity (P/A)', hb: HB('Engineering Economics', 'uniform series present worth'),
    gen(r) {
      const A = r.step(500, 20000, 250), i = r.pick([3, 4, 5, 6, 8, 10, 12]), n = r.int(3, 20), ii = i / 100;
      const fac = ((1 + ii) ** n - 1) / (ii * (1 + ii) ** n);
      return {
        params: { A, i, n },
        q: `A retrofit saves ${money(A)} at the end of each year for ${n} years. At ${i}% interest, what is the present worth of the savings?`,
        ans: A * fac, fmt: money,
        distract: [
          { v: A * n, why: 'Ignored interest.' },
          { v: (A * ((1 + ii) ** n - 1)) / ii, why: 'Used F/A — that’s a future value.' },
          { v: A / ii, why: 'Used the perpetuity formula.' },
        ],
        setup: 'P = A[(1 + i)ⁿ − 1] / [i(1 + i)ⁿ]  [factor (P/A, i, n)]',
        steps: [`(P/A, ${i}%, ${n}) = ${fix(fac, 4)}`, `P = ${money(A)} × ${fix(fac, 4)} = ${money(A * fac)}`],
      };
    } });

  T({ id: 'e-ap', set: '4.1', title: 'Capital recovery (A/P)', hb: HB('Engineering Economics', 'capital recovery'),
    gen(r) {
      const P = r.step(5000, 250000, 1000), i = r.pick([3, 4, 5, 6, 8, 10, 12]), n = r.int(3, 20), ii = i / 100;
      const fac = (ii * (1 + ii) ** n) / ((1 + ii) ** n - 1);
      return {
        params: { P, i, n },
        q: `Equipment costing ${money(P)} is financed over ${n} years at ${i}%. What is the equal annual payment?`,
        ans: P * fac, fmt: money,
        distract: [
          { v: P / n, why: 'Ignored interest.' },
          { v: (P * (1 + ii) ** n) / n, why: 'Compounded the whole loan, then split it evenly.' },
          { v: P * ii, why: 'That’s the interest only.' },
        ],
        setup: 'A = P·i(1 + i)ⁿ / [(1 + i)ⁿ − 1]  [factor (A/P, i, n)]',
        steps: [`(A/P, ${i}%, ${n}) = ${fix(fac, 4)}`, `A = ${money(P)} × ${fix(fac, 4)} = ${money(P * fac)}`],
      };
    } });

  T({ id: 'e-breakeven', set: '4.2', title: 'Break-even quantity', hb: HB('Engineering Economics', 'break-even'),
    gen(r) {
      const p = r.int(20, 200), v = r.int(5, p - 5), Q = r.step(200, 5000, 50), F = Q * (p - v);
      const units = (x) => Math.round(x).toLocaleString('en-US') + ' units';
      return {
        params: { p, v, F },
        q: `A product sells for ${money(p)} per unit, costs ${money(v)} per unit to make, and carries fixed costs of ${money(F)}. How many units must sell to break even?`,
        ans: Q, fmt: units,
        distract: [
          { v: F / p, why: 'Ignored variable cost.' },
          { v: F / v, why: 'Divided by variable cost instead of the margin.' },
          { v: F / (p + v), why: 'Added price and cost.' },
        ],
        setup: 'Q = Fixed cost / (price − variable cost)',
        steps: [`Margin = ${p} − ${v} = ${money(p - v)} per unit`, `Q = ${money(F)} / ${money(p - v)} = ${units(Q)}`],
      };
    } });

  T({ id: 'e-risk', set: '4.3', title: 'Risk-reduction benefit', hb: HB('Engineering Economics', 'expected value'),
    gen(r) {
      const L = r.step(50000, 2000000, 50000), p1 = r.pick([0.05, 0.08, 0.1, 0.12, 0.15, 0.2]);
      const p2 = r.pick([0.01, 0.02, 0.03, 0.04]), X = r.step(2000, 60000, 1000);
      const net = (p1 - p2) * L - X;
      if (Math.abs(net) < 1000) return null;
      return {
        params: { L, p1, p2, X },
        q: `An unprotected panel has an annual failure probability of ${p1}, and a failure costs ${money(L)}. A protection upgrade costs ${money(X)} per year and cuts the failure probability to ${p2}. What is the net annual benefit of the upgrade (negative = not worth it)?`,
        ans: net, fmt: money,
        distract: [
          { v: p1 * L - X, why: 'Used the full risk instead of the reduction.' },
          { v: (p1 - p2) * L, why: 'Forgot the upgrade cost.' },
          { v: (p1 - p2) * L + X, why: 'Added the upgrade cost.' },
        ],
        setup: 'Benefit = (p₁ − p₂)·Loss − annual cost',
        steps: [`Expected loss avoided = (${p1} − ${p2}) × ${money(L)} = ${money((p1 - p2) * L)}`, `Net = ${money((p1 - p2) * L)} − ${money(X)} = ${money(net)}`],
      };
    } });

  // ======================= 5 MATERIALS =======================
  T({ id: 'mat-wire', set: '5.1', title: 'Wire resistance from resistivity', hb: HB('Electrical and Computer Engineering', 'resistivity'),
    gen(r) {
      const mat = r.pick([['copper', 1.72e-8, '1.72 × 10⁻⁸'], ['aluminum', 2.82e-8, '2.82 × 10⁻⁸']]), L = r.step(10, 500, 5);
      const d = r.pick([0.5, 0.8, 1, 1.29, 1.63, 2.05, 2.59]), dm = d / 1000;
      const R = (mat[1] * L) / (Math.PI * sq(dm / 2));
      return {
        params: { rho: mat[1], L, d },
        q: `A ${mat[0]} wire (ρ = ${mat[2]} Ω·m) is ${L} m long with a ${d} mm diameter. Find its resistance.`,
        ans: R, fmt: (v) => eng(v, 'Ω'),
        distract: [
          { v: (mat[1] * L) / (Math.PI * sq(dm)), why: 'Used the diameter as the radius.' },
          { v: (mat[1] * L) / sq(dm), why: 'Area taken as d² (forgot π/4).' },
          { v: (mat[1] * L) / (Math.PI * dm), why: 'Used πd (circumference) as the area.' },
        ],
        setup: 'R = ρL/A,  A = πd²/4',
        steps: [`A = π(${dm}/2)² = ${eng(Math.PI * sq(dm / 2), 'm²', 4)}`, `R = ${mat[1]} × ${L} / A = ${eng(R, 'Ω', 4)}`],
      };
    } });

  T({ id: 'mat-tempco', set: '5.1', title: 'Resistance vs temperature', hb: HB('Electrical and Computer Engineering', 'temperature coefficient'),
    gen(r) {
      const R0 = r.int(5, 200), a = r.pick([0.00393, 0.00403, 0.00385]), T = r.int(40, 150);
      const R = R0 * (1 + a * (T - 20));
      return {
        params: { R0, a, T },
        q: `A conductor measures ${R0} Ω at 20°C. Its temperature coefficient is α = ${a} /°C (referenced to 20°C). Find its resistance at ${T}°C.`,
        ans: R, fmt: (v) => sig(v, 4) + ' Ω',
        distract: [
          { v: R0 * (1 + a * T), why: 'Used T instead of ΔT = T − 20°C.' },
          { v: R0 * (1 - a * (T - 20)), why: 'Sign error — resistance rises with temperature.' },
          { v: R0 * a * (T - 20), why: 'That’s only the change in resistance.' },
        ],
        setup: 'R = R₀[1 + α(T − T₀)]',
        steps: [`ΔT = ${T} − 20 = ${T - 20}°C`, `R = ${R0}[1 + ${a}(${T - 20})] = ${sig(R, 5)} Ω`],
      };
    } });

  T({ id: 'mat-cap', set: '5.1', title: 'Parallel-plate capacitance', hb: HB('Electrical and Computer Engineering', 'capacitance'),
    gen(r) {
      const er = r.pick([2.2, 3.9, 4.5, 10]), Acm = r.pick([1, 2, 5, 10, 25]), dmm = r.pick([0.1, 0.2, 0.5, 1]);
      const e0 = 8.854e-12, A = Acm * 1e-4, d = dmm * 1e-3, Cc = (er * e0 * A) / d;
      return {
        params: { er, Acm, dmm },
        q: `Parallel plates of area ${Acm} cm² are separated by ${dmm} mm of dielectric with εᵣ = ${er}. Find the capacitance (ε₀ = 8.854 × 10⁻¹² F/m).`,
        ans: Cc, fmt: (v) => eng(v, 'F'),
        distract: [
          { v: (e0 * A) / d, why: 'Forgot εᵣ.' },
          { v: (er * e0 * Acm) / d, why: 'Left the area in cm².' },
          { v: (er * e0 * A) / dmm, why: 'Left the spacing in mm.' },
        ],
        setup: 'C = εᵣε₀A / d',
        steps: [`A = ${Acm} × 10⁻⁴ m², d = ${dmm} × 10⁻³ m`, `C = ${er} × 8.854e−12 × ${A} / ${d} = ${eng(Cc, 'F', 4)}`],
      };
    } });

  T({ id: 'mat-expand', set: '5.2', title: 'Thermal expansion', hb: HB('Materials Science', 'thermal expansion'),
    gen(r) {
      const L = r.step(10, 500, 10), dT = r.int(20, 80), a = r.pick([17e-6, 23e-6, 12e-6]);
      const name = { 17e-6: 'copper', 23e-6: 'aluminum', 12e-6: 'steel' }[a];
      const T1 = 20, T2 = T1 + dT, dL = a * L * dT;
      return {
        params: { L, dT, a },
        q: `A ${L} m ${name} bus run (α = ${a * 1e6} × 10⁻⁶ /°C) heats from ${T1}°C to ${T2}°C. How much does it lengthen?`,
        ans: dL, fmt: (v) => eng(v, 'm'),
        distract: [
          { v: a * L * T2, why: 'Used the final temperature instead of ΔT.' },
          { v: a * dT, why: 'Forgot to multiply by the length.' },
          { v: a * L * dT * 1000, why: 'Unit slip (mm vs m).' },
        ],
        setup: 'ΔL = αLΔT',
        steps: [`ΔL = ${a} × ${L} × ${dT} = ${eng(dL, 'm', 4)}`],
      };
    } });

  T({ id: 'mat-cond', set: '5.2', title: 'Heat conduction through a slab', hb: HB('Heat Transfer', 'conduction'),
    gen(r) {
      const k = r.pick([0.04, 0.17, 0.8, 1.4, 16, 205]), A = r.pick([0.01, 0.05, 0.1, 0.5, 1]);
      const dT = r.int(10, 80), t = r.pick([0.002, 0.005, 0.01, 0.02, 0.05]);
      const q = (k * A * dT) / t;
      return {
        params: { k, A, dT, t },
        q: `A ${t * 1000} mm thick insulating slab (k = ${k} W/m·K) has area ${A} m² and ${dT} K across it. Find the steady heat flow.`,
        ans: q, fmt: (v) => eng(v, 'W'),
        distract: [
          { v: k * A * dT * t, why: 'Multiplied by thickness instead of dividing.' },
          { v: (k * dT) / t, why: 'Forgot the area.' },
          { v: (k * A * dT) / (t * 1000), why: 'Left the thickness in mm.' },
        ],
        setup: 'q = kAΔT / L',
        steps: [`q = ${k} × ${A} × ${dT} / ${t} = ${eng(q, 'W', 4)}`],
      };
    } });

  // ======================= 6 CIRCUIT ANALYSIS =======================
  const ohm = (v) => eng(v, 'Ω');
  T({ id: 'c-req', set: '6.2', title: 'Equivalent resistance', hb: HB('Electrical and Computer Engineering', 'resistors in series and parallel'),
    gen(r) {
      const [R1, R2, R3, R4] = [0, 1, 2, 3].map(() => r.res(100, 10000));
      const Req = R1 + par(R2, R3 + R4);
      return {
        params: { R1, R2, R3, R4 },
        q: `R1 = ${ohm(R1)} is in series with a parallel pair of branches. Branch A is R2 = ${ohm(R2)}. Branch B is R3 = ${ohm(R3)} in series with R4 = ${ohm(R4)}. Find the total resistance.`,
        ans: Req, fmt: ohm,
        distract: [
          { v: R1 + R2 + R3 + R4, why: 'Put everything in series.' },
          { v: R1 + par(R2, R3) + R4, why: 'Put R4 outside the parallel branch.' },
          { v: par(R1 + R2, R3 + R4), why: 'Put R1 inside the parallel combination.' },
        ],
        setup: 'R_eq = R1 + R2 ∥ (R3 + R4)',
        steps: [`R3 + R4 = ${ohm(R3 + R4)}`, `R2 ∥ ${ohm(R3 + R4)} = ${ohm(par(R2, R3 + R4))}`, `R_eq = ${eng(Req, 'Ω', 4)}`],
      };
    } });

  T({ id: 'c-div', set: '6.2', title: 'Loaded voltage divider', hb: HB('Electrical and Computer Engineering', 'voltage divider'),
    gen(r) {
      const Vs = r.pick([5, 9, 12, 15, 24, 48]), [R1, R2, R3] = [0, 1, 2].map(() => r.res(100, 47000));
      const Rp = par(R2, R3), V = (Vs * Rp) / (R1 + Rp);
      return {
        params: { Vs, R1, R2, R3 },
        q: `A ${Vs} V source drives R1 = ${ohm(R1)} in series with R2 = ${ohm(R2)} ∥ R3 = ${ohm(R3)}. Find the voltage across R3.`,
        ans: V, fmt: (v) => eng(v, 'V'),
        distract: [
          { v: (Vs * R3) / (R1 + R3), why: 'Ignored R2.' },
          { v: (Vs * R2) / (R1 + R2), why: 'Ignored R3.' },
          { v: (Vs * R1) / (R1 + Rp), why: 'That’s the drop across R1.' },
        ],
        setup: 'V = Vs·R_p / (R1 + R_p),  R_p = R2 ∥ R3',
        steps: [`R_p = ${eng(Rp, 'Ω', 4)}`, `V = ${Vs} × ${eng(Rp, 'Ω', 4)} / (${ohm(R1)} + ${eng(Rp, 'Ω', 4)}) = ${eng(V, 'V', 4)}`],
      };
    } });

  T({ id: 'c-node', set: '6.1', title: 'Node voltage with two sources', hb: HB('Electrical and Computer Engineering', 'Kirchhoff'),
    gen(r) {
      const V1 = r.int(5, 24), V2 = r.sign() * r.int(3, 15), [R1, R2, R3] = [0, 1, 2].map(() => r.res(1000, 22000));
      const G = 1 / R1 + 1 / R2 + 1 / R3, VA = (V1 / R1 + V2 / R2) / G;
      if (Math.abs(VA) < 0.2) return null;
      return {
        params: { V1, V2, R1, R2, R3 },
        q: `Node A connects to source V1 = ${V1} V through R1 = ${ohm(R1)}, to source V2 = ${String(V2).replace('-', '−')} V through R2 = ${ohm(R2)}, and to ground through R3 = ${ohm(R3)}. Both sources are referenced to ground. Find V_A.`,
        ans: VA, fmt: (v) => eng(v, 'V'),
        distract: [
          { v: (V1 / R1 - V2 / R2) / G, why: 'Sign error on V2’s branch current.' },
          { v: (V1 / R1 + V2 / R2) / (1 / R1 + 1 / R2), why: 'Left R3 out of the KCL sum.' },
          { v: (V1 * R3) / (R1 + R3) + (V2 * R3) / (R2 + R3), why: 'Superposition without including the other source’s resistor.' },
        ],
        setup: 'KCL at A: (V_A − V1)/R1 + (V_A − V2)/R2 + V_A/R3 = 0',
        steps: [`V_A(1/R1 + 1/R2 + 1/R3) = V1/R1 + V2/R2`, `V_A = ${eng(V1 / R1 + V2 / R2, 'A', 4)} / ${eng(G, 'S', 4)} = ${eng(VA, 'V', 4)}`],
      };
    } });

  T({ id: 'c-kvl', set: '6.1', title: 'Loop current with opposing sources', hb: HB('Electrical and Computer Engineering', 'Kirchhoff'),
    gen(r) {
      const V1 = r.int(10, 48), V2 = r.int(2, V1 - 3), [R1, R2] = [r.res(10, 4700), r.res(10, 4700)];
      const I = (V1 - V2) / (R1 + R2);
      return {
        params: { V1, V2, R1, R2 },
        q: `A single loop contains V1 = ${V1} V, R1 = ${ohm(R1)}, V2 = ${V2} V, and R2 = ${ohm(R2)}. V2 opposes V1. Find the loop current.`,
        ans: I, fmt: (v) => eng(v, 'A'),
        distract: [
          { v: (V1 + V2) / (R1 + R2), why: 'Treated the sources as aiding.' },
          { v: (V1 - V2) / R1, why: 'Left R2 out of the loop.' },
          { v: (V1 - V2) / par(R1, R2), why: 'Treated R1 and R2 as parallel.' },
        ],
        setup: 'KVL: V1 − I·R1 − V2 − I·R2 = 0',
        steps: [`I = (${V1} − ${V2}) / (${ohm(R1)} + ${ohm(R2)}) = ${eng(I, 'A', 4)}`],
      };
    } });

  T({ id: 'c-thev', set: '6.3', title: 'Thevenin equivalent / max power', hb: HB('Electrical and Computer Engineering', 'Thevenin'),
    gen(r) {
      const Vs = r.pick([10, 12, 15, 20, 24, 30]), [R1, R2, R3] = [0, 1, 2].map(() => r.res(100, 10000));
      const Vth = (Vs * R2) / (R1 + R2), Rth = R3 + par(R1, R2), Pm = sq(Vth) / (4 * Rth);
      const tgt = r.pick(['Vth', 'Rth', 'Pmax']);
      const ckt = `A ${Vs} V source feeds R1 = ${ohm(R1)} to node X. R2 = ${ohm(R2)} runs from X to ground. R3 = ${ohm(R3)} runs from X to terminal a; terminal b is ground.`;
      const base = {
        params: { Vs, R1, R2, R3, tgt },
        setup: 'V_th = open-circuit voltage at a–b; R_th = resistance seen at a–b with the source shorted',
        steps: [`V_th = ${Vs} × R2/(R1 + R2) = ${eng(Vth, 'V', 4)}`, `R_th = R3 + R1 ∥ R2 = ${eng(Rth, 'Ω', 4)}`, `P_max = V_th² / 4R_th = ${eng(Pm, 'W', 4)}`],
      };
      if (tgt === 'Vth') return { ...base, q: ckt + ' Find the Thevenin voltage at a–b.', ans: Vth, fmt: (v) => eng(v, 'V'),
        distract: [{ v: (Vs * R2) / (R1 + R2 + R3), why: 'Included R3 in the divider — no current flows in R3 when a–b is open.' }, { v: Vs, why: 'Ignored the divider.' }, { v: (Vs * R1) / (R1 + R2), why: 'Took the voltage across R1.' }] };
      if (tgt === 'Rth') return { ...base, q: ckt + ' Find the Thevenin resistance at a–b.', ans: Rth, fmt: ohm,
        distract: [{ v: R1 + R2 + R3, why: 'Put all resistors in series.' }, { v: R3 + R1, why: 'Forgot R2 is in parallel with R1.' }, { v: par(par(R1, R2), R3), why: 'Put R3 in parallel too.' }] };
      return { ...base, q: ckt + ' What is the maximum power a load at a–b can receive?', ans: Pm, fmt: (v) => eng(v, 'W'),
        distract: [{ v: sq(Vth) / Rth, why: 'Forgot the factor of 4.' }, { v: sq(Vth) / (2 * Rth), why: 'Used 2R_th.' }, { v: sq(Vs) / (4 * Rth), why: 'Used Vs instead of V_th.' }] };
    } });

  T({ id: 'c-norton', set: '6.3', title: 'Norton current', hb: HB('Electrical and Computer Engineering', 'Norton'),
    gen(r) {
      const Vs = r.pick([10, 12, 15, 20, 24, 30]), [R1, R2, R3] = [0, 1, 2].map(() => r.res(100, 10000));
      const Vth = (Vs * R2) / (R1 + R2), Rth = R3 + par(R1, R2), In = Vth / Rth;
      return {
        params: { Vs, R1, R2, R3 },
        q: `A ${Vs} V source feeds R1 = ${ohm(R1)} to node X. R2 = ${ohm(R2)} runs from X to ground. R3 = ${ohm(R3)} runs from X to terminal a; terminal b is ground. Find the Norton (short-circuit) current at a–b.`,
        ans: In, fmt: (v) => eng(v, 'A'),
        distract: [
          { v: Vs / R1, why: 'Ignored R2 and R3.' },
          { v: Vs / (R1 + R3), why: 'Ignored R2’s shunt path.' },
          { v: Vth / R3, why: 'Used R3 alone as the Norton resistance.' },
        ],
        setup: 'I_N = V_th / R_th (or short a–b and solve)',
        steps: [`V_th = ${eng(Vth, 'V', 4)}, R_th = ${eng(Rth, 'Ω', 4)}`, `I_N = ${eng(In, 'A', 4)}`],
      };
    } });

  T({ id: 'c-rms', set: '6.4', title: 'RMS of a sine with DC offset', hb: HB('Electrical and Computer Engineering', 'RMS'),
    gen(r) {
      const Vdc = r.int(1, 10), Vm = r.int(2, 20), Vr = Math.sqrt(Vdc * Vdc + (Vm * Vm) / 2);
      return {
        params: { Vdc, Vm },
        q: `Find the RMS value of v(t) = ${Vdc} + ${Vm} sin(ωt) V.`,
        ans: Vr, fmt: (v) => sig(v, 4) + ' V',
        distract: [
          { v: Vdc + Vm / Math.SQRT2, why: 'Added DC and AC RMS values directly.' },
          { v: Vm / Math.SQRT2, why: 'Ignored the DC offset.' },
          { v: Math.sqrt(Vdc * Vdc + Vm * Vm), why: 'Used the peak instead of the RMS of the AC part.' },
        ],
        setup: 'V_rms = √(V_dc² + V_ac,rms²),  V_ac,rms = V_m/√2',
        steps: [`√(${Vdc}² + ${Vm}²/2) = ${sig(Vr, 5)} V`],
      };
    } });

  T({ id: 'c-pulse', set: '6.4', title: 'Pulse train average and RMS', hb: HB('Electrical and Computer Engineering', 'average value'),
    gen(r) {
      const A = r.int(2, 24), D = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.75]), tgt = r.pick(['avg', 'rms']);
      const avg = A * D, rms = A * Math.sqrt(D);
      return {
        params: { A, D, tgt },
        q: `A pulse train switches between ${A} V and 0 V with a duty cycle of ${D * 100}%. Find its ${tgt === 'avg' ? 'average' : 'RMS'} value.`,
        ans: tgt === 'avg' ? avg : rms, fmt: (v) => sig(v, 4) + ' V',
        distract: tgt === 'avg'
          ? [{ v: A * Math.sqrt(D), why: 'That’s the RMS value.' }, { v: A / 2, why: 'Assumed 50% duty.' }, { v: A * (1 - D), why: 'Used the off-time fraction.' }]
          : [{ v: A * D, why: 'That’s the average value.' }, { v: A / Math.SQRT2, why: 'Used the sine-wave rule.' }, { v: A * Math.sqrt(1 - D), why: 'Used the off-time fraction.' }],
        setup: tgt === 'avg' ? 'V_avg = A·D' : 'V_rms = A·√D',
        steps: [tgt === 'avg' ? `${A} × ${D} = ${sig(avg, 4)} V` : `${A} × √${D} = ${sig(rms, 4)} V`],
      };
    } });

  T({ id: 'c-phasor', set: '6.5', title: 'Adding sinusoids with phasors', hb: HB('Electrical and Computer Engineering', 'phasor'), tol: { rel: 1e-5 },
    gen(r) {
      const A1 = r.int(2, 20), A2 = r.int(2, 20);
      const angs = [-150, -120, -90, -60, -45, -30, 0, 30, 45, 60, 90, 120, 150];
      const t1 = r.pick(angs), t2 = r.pick(angs), useSin = r.f() < 0.5;
      const t2c = useSin ? t2 - 90 : t2;
      const P = C.add(C.fromPolar(A1, t1), C.fromPolar(A2, t2c));
      const M = C.abs(P);
      if (M < 1) return null;
      const s = (a) => (a < 0 ? ` − ${-a}°` : ` + ${a}°`);
      const ds = [
        { v: A1 + A2, why: 'Added amplitudes directly — only valid when in phase.' },
        { v: Math.sqrt(A1 * A1 + A2 * A2), why: 'Assumed they are 90° apart.' },
        { v: C.abs(C.sub(C.fromPolar(A1, t1), C.fromPolar(A2, t2c))), why: 'Subtracted the phasors.' },
      ];
      if (useSin) ds.unshift({ v: C.abs(C.add(C.fromPolar(A1, t1), C.fromPolar(A2, t2))), why: 'Didn’t convert sin to cos (sin θ = cos(θ − 90°)).' });
      return {
        params: { A1, A2, t1, t2, useSin },
        q: `v(t) = ${A1} cos(ωt${s(t1)}) + ${A2} ${useSin ? 'sin' : 'cos'}(ωt${s(t2)}) V. Find the amplitude of v(t).`,
        ans: M, fmt: (v) => sig(v, 4) + ' V',
        distract: ds,
        setup: 'Convert both to cosine phasors, add, take the magnitude',
        steps: [`${A1}∠${t1}° + ${A2}∠${t2c}°`, `= ${rect(P, 4)}`, `|V| = ${sig(M, 5)} V`],
      };
    } });

  const LmH = [1, 2.2, 4.7, 10, 22, 47, 100], CuF = [0.1, 0.22, 0.47, 1, 2.2, 4.7, 10];
  T({ id: 'c-zrlc', set: '6.6', title: 'Series RLC impedance', hb: HB('Electrical and Computer Engineering', 'impedance'),
    gen(r) {
      const R = r.res(10, 1000), L = r.pick(LmH) * 1e-3, Cc = r.pick(CuF) * 1e-6, f = r.pick([60, 100, 400, 1000, 5000]);
      const w = 2 * Math.PI * f, X = w * L - 1 / (w * Cc), Z = Math.hypot(R, X);
      return {
        params: { R, L, C: Cc, f },
        q: `Series circuit: R = ${ohm(R)}, L = ${eng(L, 'H')}, C = ${eng(Cc, 'F')}, at f = ${eng(f, 'Hz')}. Find |Z|.`,
        ans: Z, fmt: ohm,
        distract: [
          { v: Math.hypot(R, w * L + 1 / (w * Cc)), why: 'Added the reactances instead of subtracting.' },
          { v: R + Math.abs(X), why: 'Added R and |X| arithmetically.' },
          { v: Math.hypot(R, f * L - 1 / (f * Cc)), why: 'Used f instead of ω = 2πf.' },
        ],
        setup: '|Z| = √(R² + (ωL − 1/ωC)²)',
        steps: [`X_L = ${eng(w * L, 'Ω', 4)}, X_C = ${eng(1 / (w * Cc), 'Ω', 4)}`, `X = ${eng(X, 'Ω', 4)}`, `|Z| = ${eng(Z, 'Ω', 4)}`],
      };
    } });

  T({ id: 'c-parrc', set: '6.6', title: 'Current into parallel RC', hb: HB('Electrical and Computer Engineering', 'admittance'),
    gen(r) {
      const V = r.pick([12, 24, 120, 240]), R = r.res(50, 2000), Cc = r.pick(CuF) * 1e-6, f = r.pick([60, 400, 1000]);
      const w = 2 * Math.PI * f, I = V * Math.hypot(1 / R, w * Cc);
      return {
        params: { V, R, C: Cc, f },
        q: `${V} V RMS at ${f} Hz is applied across R = ${ohm(R)} in parallel with C = ${eng(Cc, 'F')}. Find the RMS source current.`,
        ans: I, fmt: (v) => eng(v, 'A'),
        distract: [
          { v: V / Math.hypot(R, 1 / (w * Cc)), why: 'Treated R and C as series.' },
          { v: V * (1 / R + w * Cc), why: 'Added branch currents arithmetically — they’re 90° apart.' },
          { v: V / R, why: 'Ignored the capacitor.' },
        ],
        setup: 'I = V·|Y|,  Y = 1/R + jωC',
        steps: [`I_R = ${eng(V / R, 'A', 4)}, I_C = ${eng(V * w * Cc, 'A', 4)}`, `I = √(I_R² + I_C²) = ${eng(I, 'A', 4)}`],
      };
    } });

  // ======================= 7 LINEAR SYSTEMS =======================
  T({ id: 'l-rc', set: '7.1', title: 'RC charging transient', hb: HB('Electrical and Computer Engineering', 'RC transients'), tol: { rel: 1e-6 },
    gen(r) {
      const Vs = r.pick([5, 10, 12, 24]), V0 = r.pick([0, 0, 2, -5, 3]), R = r.res(1000, 100000), Cc = r.pick(CuF) * 1e-6;
      const tau = R * Cc, t1 = Number((r.pick([0.5, 1, 1.5, 2, 3]) * tau).toPrecision(2));
      const v = Vs + (V0 - Vs) * Math.exp(-t1 / tau);
      const ds = [
        { v: Vs * Math.exp(-t1 / tau), why: 'Used the discharge form.' },
        { v: V0 + (Vs - V0) * Math.exp(-t1 / tau), why: 'Swapped the initial and final values.' },
      ];
      if (V0 !== 0) ds.unshift({ v: Vs * (1 - Math.exp(-t1 / tau)), why: 'Ignored the initial capacitor voltage.' });
      else ds.push({ v: Vs * (1 - Math.exp(-t1 / (2 * tau))), why: 'Used 2RC as the time constant.' });
      return {
        params: { Vs, V0, R, C: Cc, t1 },
        q: `A capacitor C = ${eng(Cc, 'F')} starts at ${String(V0).replace('-', '−')} V. At t = 0 it connects to a ${Vs} V source through R = ${ohm(R)}. Find v_C at t = ${eng(t1, 's')}.`,
        ans: v, fmt: (x) => eng(x, 'V'),
        distract: ds,
        setup: 'v(t) = V_final + (V₀ − V_final)e^(−t/RC)',
        steps: [`τ = RC = ${eng(tau, 's', 4)}`, `v = ${Vs} + (${V0} − ${Vs})e^(−${eng(t1, 's')}/${eng(tau, 's', 4)}) = ${eng(v, 'V', 4)}`],
      };
    } });

  T({ id: 'l-rl', set: '7.1', title: 'RL current rise', hb: HB('Electrical and Computer Engineering', 'RL transients'), tol: { rel: 1e-6 },
    gen(r) {
      const V = r.pick([5, 12, 24, 48]), R = r.res(10, 1000), L = r.pick(LmH) * 1e-3;
      const tau = L / R, t1 = Number((r.pick([0.5, 1, 1.5, 2]) * tau).toPrecision(2));
      const i = (V / R) * (1 - Math.exp(-t1 / tau));
      return {
        params: { V, R, L, t1 },
        q: `A ${V} V source is switched onto R = ${ohm(R)} in series with L = ${eng(L, 'H')} (zero initial current). Find the current at t = ${eng(t1, 's')}.`,
        ans: i, fmt: (x) => eng(x, 'A'),
        distract: [
          { v: (V / R) * (1 - Math.exp(-t1 / (L * R))), why: 'Used τ = LR instead of L/R.' },
          { v: (V / R) * Math.exp(-t1 / tau), why: 'Used the decay form.' },
          { v: V / R, why: 'Assumed steady state already.' },
        ],
        setup: 'i(t) = (V/R)(1 − e^(−tR/L))',
        steps: [`τ = L/R = ${eng(tau, 's', 4)}`, `i = ${eng(V / R, 'A', 4)} × (1 − e^(−${sig(t1 / tau, 4)})) = ${eng(i, 'A', 4)}`],
      };
    } });

  T({ id: 'l-res', set: '7.2', title: 'Series resonance: f₀, Q, bandwidth', hb: HB('Electrical and Computer Engineering', 'resonance'), tol: { rel: 1e-4 },
    gen(r) {
      const R = r.res(1, 100), L = r.pick(LmH) * 1e-3, Cc = r.pick([1, 2.2, 4.7, 10, 22, 47, 100, 220, 470]) * 1e-9;
      const f0 = 1 / (2 * Math.PI * Math.sqrt(L * Cc)), Q = Math.sqrt(L / Cc) / R, BW = R / (2 * Math.PI * L);
      if (Q < 2 || Q > 500) return null;
      const tgt = r.pick(['f0', 'Q', 'BW']);
      const base = { params: { R, L, C: Cc, tgt },
        setup: 'f₀ = 1/(2π√LC),  Q = (1/R)√(L/C),  BW = f₀/Q = R/(2πL)',
        steps: [`f₀ = ${eng(f0, 'Hz', 4)}`, `Q = ${sig(Q, 4)}`, `BW = ${eng(BW, 'Hz', 4)}`] };
      const ckt = `Series RLC: R = ${ohm(R)}, L = ${eng(L, 'H')}, C = ${eng(Cc, 'F')}.`;
      if (tgt === 'f0') return { ...base, q: ckt + ' Find the resonant frequency.', ans: f0, fmt: (v) => eng(v, 'Hz'),
        distract: [{ v: 1 / Math.sqrt(L * Cc), why: 'That’s ω₀ in rad/s.' }, { v: 1 / (2 * Math.PI * L * Cc), why: 'Forgot the square root.' }, { v: Math.sqrt(1 / (L * Cc)) / (4 * Math.PI), why: 'Used 4π.' }] };
      if (tgt === 'Q') return { ...base, q: ckt + ' Find the quality factor Q.', ans: Q, fmt: (v) => sig(v, 3),
        distract: [{ v: R * Math.sqrt(Cc / L), why: 'Inverted the ratio (that’s 1/Q).' }, { v: Math.sqrt(L / Cc), why: 'Forgot to divide by R.' }, { v: (2 * Math.PI * f0 * L) / (R * 2), why: 'Extra factor of 2.' }] };
      return { ...base, q: ckt + ' Find the half-power bandwidth in Hz.', ans: BW, fmt: (v) => eng(v, 'Hz'),
        distract: [{ v: R / L, why: 'That’s the bandwidth in rad/s.' }, { v: f0 * Q, why: 'Multiplied instead of dividing.' }, { v: R / (4 * Math.PI * L), why: 'Took only half the band.' }] };
    } });

  T({ id: 'l-final', set: '7.3', title: 'Final value theorem', hb: HB('Electrical and Computer Engineering', 'final value theorem'), tol: { rel: 2e-3 },
    gen(r) {
      const K = r.int(1, 20), z = r.int(1, 10), a = r.int(2, 12), b = r.int(2, 40);
      const yf = (K * z) / b;
      return {
        params: { K, z, a, b },
        q: `H(s) = ${K}(s + ${z}) / (s² + ${a}s + ${b}). A unit step is applied. Find the final value of the output.`,
        ans: yf, fmt: (v) => sig(v, 4),
        distract: [
          { v: K / b, why: 'Dropped the zero (s + z).' },
          { v: (K * z) / a, why: 'Used the s coefficient instead of the constant.' },
          { v: K, why: 'That’s the high-frequency gain, not s → 0.' },
        ],
        setup: 'y(∞) = lim s→0 of s·H(s)·(1/s) = H(0)',
        steps: [`H(0) = ${K}·${z} / ${b} = ${sig(yf, 5)}`],
      };
    } });

  T({ id: 'l-ilt', set: '7.3', title: 'Inverse Laplace by partial fractions', hb: HB('Electrical and Computer Engineering', 'Laplace transforms'), tol: { rel: 1e-5 },
    gen(r) {
      const p1 = r.int(1, 8), p2 = r.int(1, 8), A = r.int(2, 30), t = r.pick([0.1, 0.25, 0.5, 1]);
      if (p1 === p2) return null;
      const f = (A / (p2 - p1)) * (Math.exp(-p1 * t) - Math.exp(-p2 * t));
      return {
        params: { A, p1, p2, t },
        q: `F(s) = ${A} / [(s + ${p1})(s + ${p2})]. Find f(t) at t = ${t} s.`,
        ans: f, fmt: (v) => sig(v, 4),
        distract: [
          { v: A * (Math.exp(-p1 * t) - Math.exp(-p2 * t)) * Math.sign(p2 - p1), why: 'Forgot the 1/(p₂ − p₁) coefficient.' },
          { v: -f, why: 'Partial-fraction signs swapped.' },
          { v: (A / (p1 * p2)) * (1 - Math.exp(-Math.min(p1, p2) * t)), why: 'Treated it like a step response.' },
        ],
        setup: 'A/[(s+p₁)(s+p₂)] = [A/(p₂−p₁)]·[1/(s+p₁) − 1/(s+p₂)]',
        steps: [`f(t) = ${sig(A / (p2 - p1), 4)}(e^(−${p1}t) − e^(−${p2}t))`, `f(${t}) = ${sig(f, 5)}`],
      };
    } });

  T({ id: 'l-lpdb', set: '7.4', title: 'RC low-pass gain in dB', hb: HB('Electrical and Computer Engineering', 'transfer function'),
    gen(r) {
      const R = r.res(100, 100000), Cc = r.pick([1, 2.2, 4.7, 10, 22, 47, 100]) * 1e-9;
      const fc = 1 / (2 * Math.PI * R * Cc);
      const f = Number((fc * r.pick([0.3, 0.5, 2, 3, 5, 10])).toPrecision(2));
      const x = 2 * Math.PI * f * R * Cc, dB = 20 * Math.log10(1 / Math.sqrt(1 + x * x));
      return {
        params: { R, C: Cc, f }, sep: { abs: 0.6 },
        q: `An RC low-pass filter has R = ${ohm(R)} and C = ${eng(Cc, 'F')}. Find the gain |H| in dB at ${eng(f, 'Hz')}.`,
        ans: dB, fmt: (v) => fix(v, 1) + ' dB',
        distract: [
          { v: 10 * Math.log10(1 / Math.sqrt(1 + x * x)), why: 'Used 10·log for a voltage ratio.' },
          { v: 20 * Math.log10(1 / Math.sqrt(1 + sq(f * R * Cc))), why: 'Used f instead of ω.' },
          { v: 20 * Math.log10(x / Math.sqrt(1 + x * x)), why: 'That’s the high-pass response.' },
        ],
        setup: '|H| = 1/√(1 + (ωRC)²),  dB = 20 log₁₀|H|',
        steps: [`ωRC = ${sig(x, 4)}`, `|H| = ${sig(1 / Math.sqrt(1 + x * x), 4)}`, `${fix(dB, 2)} dB`],
      };
    } });

  // ======================= 8 SIGNAL PROCESSING =======================
  T({ id: 's-alias', set: '8.1', title: 'Aliased frequency', hb: HB('Electrical and Computer Engineering', 'sampling'),
    gen(r) {
      const fs = r.pick([8000, 10000, 16000, 20000]);
      const f0 = r.step(Math.ceil(0.55 * fs / 100) * 100, 2.4 * fs, 100);
      let fa = f0 % fs;
      if (fa > fs / 2) fa = fs - fa;
      if (fa === 0 || fa === fs / 2 || f0 <= fs / 2) return null;
      return {
        params: { f0, fs },
        q: `A ${eng(f0, 'Hz')} sinusoid is sampled at ${eng(fs, 'Hz')} with no anti-alias filter. What frequency appears in the sampled signal?`,
        ans: fa, fmt: (v) => eng(v, 'Hz'),
        distract: [
          { v: f0, why: 'Assumed no aliasing.' },
          { v: Math.abs(f0 - fs), why: 'Subtracted fs once without folding into 0 to fs/2.' },
          { v: fs / 2, why: 'That’s the Nyquist frequency.' },
          { v: fs - f0 % fs, why: 'Folded the wrong way.' },
        ],
        setup: 'f_alias = |f₀ − k·fs|, choosing k so the result is in 0…fs/2',
        steps: [`f₀ mod fs = ${eng(f0 % fs, 'Hz', 4)}`, (f0 % fs) > fs / 2 ? `> fs/2, so fold: ${eng(fs, 'Hz')} − ${eng(f0 % fs, 'Hz', 4)} = ${eng(fa, 'Hz', 4)}` : `≤ fs/2, so f_alias = ${eng(fa, 'Hz', 4)}`],
      };
    } });

  T({ id: 's-rcfc', set: '8.2', title: 'First-order RC cutoff', hb: HB('Electrical and Computer Engineering', 'filter'), tol: { rel: 1e-6 },
    gen(r) {
      const tgt = r.pick(['fc', 'R']), Cc = r.pick([1, 2.2, 4.7, 10, 22, 47, 100]) * 1e-9;
      if (tgt === 'fc') {
        const R = r.res(100, 100000), fc = 1 / (2 * Math.PI * R * Cc);
        return { params: { tgt, R, C: Cc },
          q: `A first-order RC filter uses R = ${ohm(R)} and C = ${eng(Cc, 'F')}. Find the −3 dB cutoff frequency.`,
          ans: fc, fmt: (v) => eng(v, 'Hz'),
          distract: [{ v: 1 / (R * Cc), why: 'That’s ω_c in rad/s.' }, { v: 1 / (4 * Math.PI * R * Cc), why: 'Used 4π.' }, { v: (2 * Math.PI) / (R * Cc), why: 'Multiplied by 2π instead of dividing.' }],
          setup: 'f_c = 1/(2πRC)', steps: [`f_c = 1/(2π × ${ohm(R)} × ${eng(Cc, 'F')}) = ${eng(fc, 'Hz', 4)}`] };
      }
      const fc = r.pick([100, 250, 500, 1000, 2000, 5000, 10000]), R = 1 / (2 * Math.PI * fc * Cc);
      if (R < 10 || R > 1e7) return null;
      return { params: { tgt, fc, C: Cc },
        q: `You need a first-order RC low-pass with a ${eng(fc, 'Hz')} cutoff using C = ${eng(Cc, 'F')}. What R is required?`,
        ans: R, fmt: ohm,
        distract: [{ v: 1 / (fc * Cc), why: 'Forgot the 2π.' }, { v: (2 * Math.PI) / (fc * Cc), why: 'Multiplied by 2π instead of dividing.' }, { v: 1 / (2 * Math.PI * fc * fc * Cc), why: 'Squared the frequency.' }],
        setup: 'R = 1/(2πf_cC)', steps: [`R = 1/(2π × ${fc} × ${eng(Cc, 'F')}) = ${eng(R, 'Ω', 4)}`] };
    } });

  T({ id: 's-diffeq', set: '8.3', title: 'Difference equation step response', hb: HB('Electrical and Computer Engineering', 'difference equation'), tol: { rel: 1e-9 },
    gen(r) {
      const a = r.pick([0.5, -0.5, 0.8, 0.25, -0.8]), b = r.int(1, 5), k = r.int(2, 5);
      const y = (n) => (b * (1 - Math.pow(a, n + 1))) / (1 - a);
      return {
        params: { a, b, k },
        q: `y[n] = ${String(a).replace('-', '−')}·y[n−1] + ${b}·x[n], with y[−1] = 0 and x[n] a unit step starting at n = 0. Find y[${k}].`,
        ans: y(k), fmt: (v) => sig(v, 5),
        distract: [
          { v: b * Math.pow(a, k), why: 'That’s the impulse response, not the step response.' },
          { v: y(k - 1), why: 'Off by one sample.' },
          { v: b / (1 - a), why: 'That’s the steady-state value.' },
        ],
        setup: 'Iterate from y[0] = b·x[0]',
        steps: [Array.from({ length: k + 1 }, (_, n) => `y[${n}] = ${sig(y(n), 5)}`).join(', ')],
      };
    } });

  T({ id: 's-dconv', set: '8.5', title: 'Discrete convolution value', hb: HB('Electrical and Computer Engineering', 'convolution'),
    gen(r) {
      const x = [r.nonzero(-3, 4), r.int(-3, 4), r.int(-3, 4)], h = [r.nonzero(-3, 4), r.int(-3, 4), r.int(-3, 4)];
      const y = (n) => { let s = 0; for (let k = 0; k <= 2; k++) if (n - k >= 0 && n - k <= 2) s += x[k] * h[n - k]; return s; };
      const n = r.int(1, 3);
      const fmtI = (v) => String(Math.round(v)).replace('-', '−');
      const seq = (a) => `{${a.map((v) => String(v).replace('-', '−')).join(', ')}}`;
      return {
        params: { x, h, n },
        q: `x[n] = ${seq(x)} and h[n] = ${seq(h)}, both starting at n = 0. Find y[${n}] where y = x ∗ h.`,
        ans: y(n), fmt: fmtI, noFill: true,
        distract: [
          { v: y(n - 1), why: 'Off by one index.' }, { v: y(n + 1), why: 'Off by one index.' },
          { v: x[0] * h[0] + x[1] * h[1] + x[2] * h[2], why: 'Multiplied aligned samples without flipping and shifting.' },
          { v: y(n) + 1, why: 'Arithmetic slip.' }, { v: y(n) - 1, why: 'Arithmetic slip.' },
        ],
        setup: 'y[n] = Σₖ x[k]·h[n − k]',
        steps: [`y[${n}] = ` + [0, 1, 2].filter((k) => n - k >= 0 && n - k <= 2).map((k) => `(${x[k]})(${h[n - k]})`).join(' + ') + ` = ${y(n)}`],
      };
    } });

  T({ id: 's-cconv', set: '8.4', title: 'Convolution of two pulses', hb: HB('Electrical and Computer Engineering', 'convolution'), tol: { rel: 2e-3 },
    gen(r) {
      const A = r.int(1, 5), B = r.int(1, 5), T1 = r.int(1, 5), T2 = r.int(1, 5);
      const t0 = r.step(0.5, T1 + T2 - 0.5, 0.5);
      const ov = Math.max(0, Math.min(t0, T1) - Math.max(0, t0 - T2));
      if (ov <= 0) return null;
      return {
        params: { A, B, T1, T2, t0 },
        q: `x(t) = ${A} for 0 ≤ t ≤ ${T1} s (zero elsewhere); h(t) = ${B} for 0 ≤ t ≤ ${T2} s (zero elsewhere). Find y(${t0}) for y = x ∗ h.`,
        ans: A * B * ov, fmt: (v) => sig(v, 4),
        distract: [
          { v: A * B * t0, why: 'Ignored where the pulses stop overlapping.' },
          { v: A * B * Math.min(T1, T2), why: 'That’s the peak value.' },
          { v: A * B, why: 'Forgot to multiply by the overlap width.' },
        ],
        setup: 'y(t₀) = A·B × (width of overlap of x(τ) and h(t₀ − τ))',
        steps: [`Overlap = ${sig(ov, 3)} s`, `y = ${A}·${B}·${sig(ov, 3)} = ${sig(A * B * ov, 4)}`],
      };
    } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
