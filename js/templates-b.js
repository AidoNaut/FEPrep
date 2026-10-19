/* FE Prep — generated problem templates, areas 9–17.
   Every template here is UNVERIFIED until the user approves it in the Verify queue.
   Each id has an independent checker in tools/verify.py. */
(function (G) {
  const FE = G.FE;
  const T = FE.T;
  const { sig, eng, fix, deg, rad, rect, C } = FE.H;
  const sq = (x) => x * x;
  const par = (a, b) => (a * b) / (a + b);
  const HB = (ch, find) => ({ ch, find });
  const EC = 'Electrical and Computer Engineering';
  const ohm = (v) => eng(v, 'Ω');
  const int = (v) => String(Math.round(v)).replace('-', '−');
  const big = (v) => Math.round(v).toLocaleString('en-US');

  // ======================= 9 ELECTRONICS =======================
  T({ id: 'el-semi', set: '9.1', title: 'Resistivity of doped silicon', hb: HB(EC, 'mobility'), tol: { rel: 3e-4 },
    gen(r) {
      const ND = r.pick([1e14, 5e14, 1e15, 5e15, 1e16]), mn = 1350, mp = 480, q = 1.602e-19;
      const rho = 1 / (q * ND * mn);
      const ex = (x) => { const e = Math.floor(Math.log10(x)); const m = x / 10 ** e; return `${m === 1 ? '' : m + ' × '}10${String(e).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')}`; };
      return {
        params: { ND, mn },
        q: `Silicon is doped n-type with N_D = ${ex(ND)} cm⁻³ (fully ionized, N_D ≫ nᵢ). With μₙ = ${mn} cm²/V·s, μₚ = ${mp} cm²/V·s, and q = 1.602 × 10⁻¹⁹ C, find the resistivity.`,
        ans: rho, fmt: (v) => eng(v, 'Ω·cm'),
        distract: [
          { v: 1 / (q * ND * mp), why: 'Used hole mobility for n-type material.' },
          { v: 1 / (q * ND * (mn + mp)), why: 'Added both mobilities — holes are negligible here.' },
          { v: (q * ND * mn) * 1, why: 'That’s the conductivity (S/cm), not resistivity.' },
        ],
        setup: 'σ = q·n·μₙ (n ≈ N_D),  ρ = 1/σ',
        steps: [`σ = 1.602e−19 × ${ND} × ${mn} = ${sig(q * ND * mn, 4)} S/cm`, `ρ = 1/σ = ${eng(rho, 'Ω·cm', 4)}`],
      };
    } });

  T({ id: 'el-diode', set: '9.2', title: 'Diode circuit (constant-drop model)', hb: HB(EC, 'diode'),
    gen(r) {
      const Vs = r.pick([5, 9, 12, 15, 24]), n = r.pick([1, 2]), R = r.res(100, 4700);
      const I = (Vs - 0.7 * n) / R;
      return {
        params: { Vs, n, R },
        q: `${Vs} V drives ${n === 1 ? 'one forward-biased silicon diode' : 'two forward-biased silicon diodes'} in series with R = ${ohm(R)}. Using the constant-voltage-drop model (V_D = 0.7 V), find the current.`,
        ans: I, fmt: (v) => eng(v, 'A'),
        distract: [
          { v: Vs / R, why: 'Ignored the diode drop.' },
          n === 2 ? { v: (Vs - 0.7) / R, why: 'Counted only one diode drop.' } : { v: (Vs - 1.4) / R, why: 'Counted two diode drops.' },
          { v: (Vs - 0.3 * n) / R, why: 'Used 0.3 V (germanium).' },
        ],
        setup: 'I = (Vs − n·V_D) / R',
        steps: [`I = (${Vs} − ${n} × 0.7) / ${ohm(R)} = ${eng(I, 'A', 4)}`],
      };
    } });

  T({ id: 'el-bjt', set: '9.3', title: 'BJT voltage-divider bias', hb: HB(EC, 'bipolar junction transistor'),
    gen(r) {
      const VCC = r.pick([9, 12, 15, 20]), R1 = r.res(10000, 220000), R2 = r.res(2200, 68000);
      const RC = r.res(470, 10000), RE = r.res(100, 4700), beta = r.pick([50, 80, 100, 150]);
      const VTH = (VCC * R2) / (R1 + R2), RTH = par(R1, R2);
      const IB = (VTH - 0.7) / (RTH + (beta + 1) * RE);
      if (IB <= 0) return null;
      const IC = beta * IB, IE = (beta + 1) * IB, VCE = VCC - IC * RC - IE * RE;
      if (VCE < 1) return null;
      const tgt = r.pick(['IC', 'VCE']);
      const ckt = `NPN, voltage-divider bias: V_CC = ${VCC} V, R1 (top) = ${ohm(R1)}, R2 (bottom) = ${ohm(R2)}, R_C = ${ohm(RC)}, R_E = ${ohm(RE)}, β = ${beta}, V_BE = 0.7 V.`;
      const base = { params: { VCC, R1, R2, RC, RE, beta, tgt },
        setup: 'Thevenin the base: V_TH = V_CC·R2/(R1+R2), R_TH = R1∥R2; I_B = (V_TH − 0.7)/(R_TH + (β+1)R_E)',
        steps: [`V_TH = ${eng(VTH, 'V', 4)}, R_TH = ${eng(RTH, 'Ω', 4)}`, `I_B = ${eng(IB, 'A', 4)}, I_C = ${eng(IC, 'A', 4)}`, `V_CE = V_CC − I_C·R_C − I_E·R_E = ${eng(VCE, 'V', 4)}`] };
      if (tgt === 'IC') return { ...base, q: ckt + ' Find I_C (do not neglect base current).', ans: IC, fmt: (v) => eng(v, 'A'),
        distract: [{ v: (VTH - 0.7) / RE, why: 'Stiff-divider approximation (neglected I_B).' }, { v: VTH / RE, why: 'Forgot V_BE.' }, { v: (beta * (VTH - 0.7)) / (RTH + RE), why: 'Left out the (β+1) factor on R_E.' }] };
      return { ...base, q: ckt + ' Find V_CE (do not neglect base current).', ans: VCE, fmt: (v) => eng(v, 'V'),
        distract: [{ v: VCC - IC * RC, why: 'Forgot the drop across R_E.' }, { v: VCC - ((VTH - 0.7) / RE) * (RC + RE), why: 'Stiff-divider approximation.' }, { v: VTH - 0.7, why: 'That’s the emitter voltage.' }] };
    } });

  T({ id: 'el-sum', set: '9.6', title: 'Inverting summing amplifier', hb: HB(EC, 'operational amplifier'), tol: { rel: 1e-5 },
    gen(r) {
      const V1 = r.nonzero(-10, 10) / 2, V2 = r.nonzero(-10, 10) / 2;
      const R1 = r.res(1000, 100000), R2 = r.res(1000, 100000), Rf = r.res(1000, 100000);
      const Vo = -Rf * (V1 / R1 + V2 / R2);
      if (Math.abs(Vo) > 13 || Math.abs(Vo) < 0.2) return null;
      const v = (x) => String(x).replace('-', '−');
      return {
        params: { V1, V2, R1, R2, Rf },
        q: `An ideal op-amp summing amplifier (±15 V supplies) has V1 = ${v(V1)} V through R1 = ${ohm(R1)} and V2 = ${v(V2)} V through R2 = ${ohm(R2)} into the inverting input, with R_f = ${ohm(Rf)}. The non-inverting input is grounded. Find V_out.`,
        ans: Vo, fmt: (x) => eng(x, 'V'),
        distract: [
          { v: -Vo, why: 'Dropped the inversion.' },
          { v: (-Rf * (V1 + V2)) / (R1 + R2), why: 'Combined the inputs through one resistor.' },
          { v: (-Rf / R1) * V1, why: 'Forgot the second input.' },
        ],
        setup: 'V_out = −R_f(V1/R1 + V2/R2)',
        steps: [`V1/R1 + V2/R2 = ${eng(V1 / R1 + V2 / R2, 'A', 4)}`, `V_out = −${ohm(Rf)} × that = ${eng(Vo, 'V', 4)}`],
      };
    } });

  T({ id: 'el-noninv', set: '9.6', title: 'Non-inverting amplifier', hb: HB(EC, 'operational amplifier'), tol: { rel: 1e-5 },
    gen(r) {
      const Vin = r.nonzero(-10, 10) / 4, R1 = r.res(1000, 47000), Rf = r.res(1000, 220000);
      const Vo = (1 + Rf / R1) * Vin;
      if (Math.abs(Vo) > 13) return null;
      return {
        params: { Vin, R1, Rf },
        q: `An ideal non-inverting amplifier has R1 = ${ohm(R1)} from the inverting input to ground and R_f = ${ohm(Rf)} from output to inverting input. V_in = ${String(Vin).replace('-', '−')} V. Find V_out.`,
        ans: Vo, fmt: (x) => eng(x, 'V'),
        distract: [
          { v: (-Rf / R1) * Vin, why: 'Used the inverting-amplifier formula.' },
          { v: (Rf / R1) * Vin, why: 'Forgot the “1 +”.' },
          { v: (1 + R1 / Rf) * Vin, why: 'Inverted the resistor ratio.' },
        ],
        setup: 'V_out = (1 + R_f/R1)·V_in',
        steps: [`Gain = 1 + ${ohm(Rf)}/${ohm(R1)} = ${sig(1 + Rf / R1, 4)}`, `V_out = ${eng(Vo, 'V', 4)}`],
      };
    } });

  T({ id: 'el-rect', set: '9.7', title: 'Rectifier average output', hb: HB(EC, 'rectifier'), tol: { rel: 1e-5 },
    gen(r) {
      const Vr = r.pick([6, 12, 24, 120]), full = r.f() < 0.5, Vm = Vr * Math.SQRT2;
      const avg = full ? (2 * Vm) / Math.PI : Vm / Math.PI;
      return {
        params: { Vr, full },
        q: `A ${full ? 'full-wave bridge' : 'half-wave'} rectifier with ideal diodes is fed ${Vr} V RMS. Find the average (DC) output voltage across a resistive load.`,
        ans: avg, fmt: (v) => sig(v, 4) + ' V',
        distract: [
          { v: full ? (2 * Vr) / Math.PI : Vr / Math.PI, why: 'Used the RMS value as the peak.' },
          { v: full ? Vm / Math.PI : (2 * Vm) / Math.PI, why: full ? 'That’s the half-wave result.' : 'That’s the full-wave result.' },
          { v: full ? Vm / Math.SQRT2 : Vm / 2, why: full ? 'That’s the RMS of the output, not the average.' : 'That’s the RMS of the output, not the average.' },
        ],
        setup: full ? 'V_dc = 2V_m/π,  V_m = √2·V_rms' : 'V_dc = V_m/π,  V_m = √2·V_rms',
        steps: [`V_m = √2 × ${Vr} = ${sig(Vm, 5)} V`, `V_dc = ${sig(avg, 5)} V`],
      };
    } });

  T({ id: 'el-dcdc', set: '9.7', title: 'Ideal DC-DC converter', hb: HB(EC, 'converter'),
    gen(r) {
      const Vin = r.pick([5, 12, 24, 48]), D = r.pick([0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75]), kind = r.pick(['buck', 'boost', 'buck-boost']);
      const f = { buck: D * Vin, boost: Vin / (1 - D), 'buck-boost': (D / (1 - D)) * Vin };
      return {
        params: { Vin, D, kind },
        q: `An ideal ${kind} converter in continuous conduction has V_in = ${Vin} V and duty cycle D = ${D}. Find the output voltage magnitude.`,
        ans: f[kind], fmt: (v) => sig(v, 4) + ' V',
        distract: [
          ...Object.entries(f).filter(([k]) => k !== kind).map(([k, v]) => ({ v, why: `That’s the ${k} relationship.` })),
          { v: Vin * (1 - D), why: 'Used (1 − D) as the gain.' },
        ],
        setup: 'Buck: D·V_in   Boost: V_in/(1 − D)   Buck-boost: D/(1 − D)·V_in',
        steps: [`${kind}: V_out = ${sig(f[kind], 5)} V`],
      };
    } });

  T({ id: 'el-bridge', set: '9.8', title: 'Wheatstone bridge output', hb: HB('Instrumentation, Measurement, and Controls', 'Wheatstone bridge'), tol: { rel: 1e-6 },
    gen(r) {
      const Vex = r.pick([5, 10, 12]), R = r.pick([120, 350, 1000]), fr = r.pick([0.08, 0.1, 0.15, 0.2, 0.25, 0.3]);
      const dR = R * fr, Vo = Vex * ((R + dR) / (2 * R + dR) - 0.5);
      return {
        params: { Vex, R, dR },
        q: `A bridge is excited with ${Vex} V. Three arms are ${R} Ω. The sensing arm is ${sig(R + dR, 4)} Ω, sitting on the bottom of one divider. The other divider is two ${R} Ω arms. Find the output voltage between the two divider midpoints.`,
        ans: Vo, fmt: (v) => eng(v, 'V'),
        distract: [
          { v: (Vex * dR) / (4 * R), why: 'Small-change approximation ΔR/4R — not valid for this large a change.' },
          { v: (Vex * dR) / (2 * R), why: 'Used ΔR/2R.' },
          { v: (Vex * (R + dR)) / (2 * R + dR), why: 'That’s one midpoint voltage, not the difference.' },
        ],
        setup: 'V_out = V_ex[(R + ΔR)/(2R + ΔR) − 1/2]',
        steps: [`Sensing midpoint = ${Vex} × ${sig(R + dR, 4)}/${sig(2 * R + dR, 4)} = ${eng((Vex * (R + dR)) / (2 * R + dR), 'V', 4)}`, `Reference midpoint = ${Vex / 2} V`, `V_out = ${eng(Vo, 'V', 4)}`],
      };
    } });

  // ======================= 10 POWER =======================
  T({ id: 'pw-1ph', set: '10.1', title: 'Single-phase real and apparent power', hb: HB(EC, 'complex power'),
    gen(r) {
      const V = r.pick([120, 208, 240, 480]), R = r.int(2, 40), X = r.sign() * r.int(2, 40);
      const Z = Math.hypot(R, X), I = V / Z, P = I * I * R, S = V * I, Q = I * I * X;
      const tgt = r.pick(['P', 'S']);
      const ld = `${V} V RMS supplies a load Z = ${R} ${X < 0 ? '−' : '+'} j${Math.abs(X)} Ω.`;
      const base = { params: { V, R, X, tgt }, setup: 'I = V/|Z|,  P = I²R,  S = V·I',
        steps: [`|Z| = ${sig(Z, 4)} Ω, I = ${eng(I, 'A', 4)}`, `P = ${eng(P, 'W', 4)}, Q = ${eng(Q, 'VAR', 4)}, S = ${eng(S, 'VA', 4)}`] };
      if (tgt === 'P') return { ...base, q: ld + ' Find the real power.', ans: P, fmt: (v) => eng(v, 'W'),
        distract: [{ v: (V * V) / R, why: 'Applied the full voltage across R.' }, { v: S, why: 'That’s apparent power.' }, { v: Math.abs(Q), why: 'That’s reactive power.' }] };
      return { ...base, q: ld + ' Find the apparent power.', ans: S, fmt: (v) => eng(v, 'VA'),
        distract: [{ v: P, why: 'That’s real power.' }, { v: (V * V) / R, why: 'Used R instead of |Z|.' }, { v: V * V * Z, why: 'Multiplied by |Z| instead of dividing.' }] };
    } });

  T({ id: 'pw-pfc', set: '10.3', title: 'Power-factor correction capacitor', hb: HB(EC, 'power factor'), tol: { rel: 1e-6 },
    gen(r) {
      const P = r.pick([10, 25, 50, 75, 100, 150, 250, 500]), pf1 = r.pick([0.6, 0.65, 0.7, 0.75, 0.8, 0.85]), pf2 = r.pick([0.9, 0.95, 0.98]);
      const tn = (pf) => Math.tan(Math.acos(pf)), Qc = P * (tn(pf1) - tn(pf2));
      return {
        params: { P, pf1, pf2 },
        q: `A ${P} kW load runs at ${pf1} power factor lagging. How many kVAR of capacitance raise it to ${pf2} lagging?`,
        ans: Qc, fmt: (v) => sig(v, 3) + ' kVAR',
        distract: [
          { v: P * tn(pf1), why: 'Corrected all the way to unity.' },
          { v: P * (Math.sin(Math.acos(pf1)) - Math.sin(Math.acos(pf2))), why: 'Used sin θ instead of tan θ.' },
          { v: P / pf1 - P / pf2, why: 'Subtracted apparent powers.' },
        ],
        setup: 'Q_c = P(tan θ₁ − tan θ₂),  θ = acos(pf)',
        steps: [`tan θ₁ = ${fix(tn(pf1), 4)}, tan θ₂ = ${fix(tn(pf2), 4)}`, `Q_c = ${P}(${fix(tn(pf1) - tn(pf2), 4)}) = ${sig(Qc, 4)} kVAR`],
      };
    } });

  T({ id: 'pw-3ph', set: '10.2', title: 'Three-phase line current', hb: HB(EC, 'three-phase'),
    gen(r) {
      const S = r.pick([15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1500]), VLL = r.pick([208, 480, 4160, 13800]);
      const IL = (S * 1000) / (Math.sqrt(3) * VLL);
      return {
        params: { S, VLL },
        q: `A balanced three-phase load draws ${S} kVA at ${big(VLL)} V line-to-line. Find the line current.`,
        ans: IL, fmt: (v) => eng(v, 'A'),
        distract: [
          { v: (S * 1000) / (3 * VLL), why: 'Used 3 instead of √3.' },
          { v: (S * 1000) / VLL, why: 'Single-phase formula.' },
          { v: (S * 1000 * Math.sqrt(3)) / VLL, why: 'Multiplied by √3 instead of dividing.' },
        ],
        setup: 'I_L = S / (√3·V_LL)',
        steps: [`I_L = ${S * 1000} / (√3 × ${VLL}) = ${eng(IL, 'A', 4)}`],
      };
    } });

  T({ id: 'pw-delta', set: '10.2', title: 'Delta load total power', hb: HB(EC, 'delta'),
    gen(r) {
      const VLL = r.pick([208, 240, 480]), R = r.int(5, 60), X = r.int(3, 50);
      const Z2 = R * R + X * X, P = (3 * VLL * VLL * R) / Z2;
      return {
        params: { VLL, R, X },
        q: `A balanced delta load has Z = ${R} + j${X} Ω per phase and is fed ${VLL} V line-to-line. Find the total real power.`,
        ans: P, fmt: (v) => eng(v, 'W'),
        distract: [
          { v: P / 3, why: 'Used phase-to-neutral voltage — delta phases see line voltage (or counted one phase).' },
          { v: (Math.sqrt(3) * VLL * VLL * R) / Z2, why: 'Multiplied by √3 instead of 3.' },
          { v: (3 * VLL * VLL) / R, why: 'Ignored the reactance.' },
        ],
        setup: 'Phase current = V_LL/|Z|;  P = 3·I_ph²·R',
        steps: [`I_ph = ${VLL}/${sig(Math.sqrt(Z2), 4)} = ${eng(VLL / Math.sqrt(Z2), 'A', 4)}`, `P = 3 × I_ph² × ${R} = ${eng(P, 'W', 4)}`],
      };
    } });

  T({ id: 'pw-vreg', set: '10.4', title: 'Feeder voltage regulation (exact phasors)', hb: HB(EC, 'voltage regulation'), tol: { rel: 1e-6 },
    gen(r) {
      const VR = r.pick([120, 240, 480, 2400]), pf = r.pick([0.7, 0.8, 0.85, 0.9, 0.95]);
      const I = r.pick([20, 40, 50, 80, 100, 150]), R = r.step(0.05, 1.5, 0.05), X = r.step(0.05, 2, 0.05);
      const th = Math.acos(pf), Iph = [I * pf, -I * Math.sin(th)], VS = C.abs(C.add([VR, 0], C.mul(Iph, [R, X])));
      const reg = ((VS - VR) / VR) * 100;
      if (reg < 1 || reg > 25) return null;
      return {
        params: { VR, pf, I, R, X },
        q: `A single-phase feeder (total impedance ${sig(R, 3)} + j${sig(X, 3)} Ω) delivers ${I} A at ${pf} pf lagging, with ${VR} V at the load. Using exact phasors, find the voltage regulation.`,
        ans: reg, fmt: (v) => fix(v, 2) + '%',
        distract: [
          { v: ((I * Math.hypot(R, X)) / VR) * 100, why: 'Used |I·Z| as the drop — ignores the phase angles.' },
          { v: ((I * (R * pf - X * Math.sin(th))) / VR) * 100, why: 'Sign error (treated the load as leading).' },
          { v: ((I * R) / VR) * 100, why: 'Ignored the reactance.' },
        ],
        setup: 'V_S = V_R + I∠(−θ)·(R + jX),  Reg = (|V_S| − V_R)/V_R',
        steps: [`I = ${I}∠${fix(-deg(th), 2)}° A`, `|V_S| = ${sig(VS, 5)} V`, `Reg = ${fix(reg, 3)}%`],
      };
    } });

  T({ id: 'pw-xfmr', set: '10.5', title: 'Ideal transformer: reflected load', hb: HB(EC, 'transformer'), tol: { rel: 1e-6 },
    gen(r) {
      const a = r.pick([2, 4, 5, 8, 10, 20]), ZL = r.res(1, 100), V1 = r.pick([120, 240, 480, 2400]);
      const Zr = a * a * ZL, I1 = V1 / Zr, tgt = r.pick(['Zr', 'I1']);
      const ckt = `An ideal ${a}:1 step-down transformer has a ${ohm(ZL)} resistive load on its secondary.`;
      const base = { params: { a, ZL, V1, tgt }, setup: 'Z_primary = a²·Z_L,  I₁ = I₂/a',
        steps: [`Z_primary = ${a}² × ${ohm(ZL)} = ${eng(Zr, 'Ω', 4)}`, `I₁ = ${V1}/${eng(Zr, 'Ω', 4)} = ${eng(I1, 'A', 4)}`] };
      if (tgt === 'Zr') return { ...base, q: ckt + ' What resistance does the primary source see?', ans: Zr, fmt: ohm,
        distract: [{ v: a * ZL, why: 'Used a instead of a².' }, { v: ZL / (a * a), why: 'Reflected the wrong direction.' }, { v: ZL, why: 'Ignored the transformer.' }] };
      return { ...base, q: ckt + ` The primary is fed ${V1} V. Find the primary current.`, ans: I1, fmt: (v) => eng(v, 'A'),
        distract: [{ v: V1 / (a * ZL), why: 'That’s the secondary current.' }, { v: V1 / ZL, why: 'Ignored the transformer.' }, { v: V1 / (a * ZL * a * a), why: 'Applied the turns ratio three times.' }] };
    } });

  T({ id: 'pw-ind', set: '10.6', title: 'Induction motor speed', hb: HB(EC, 'induction motor'),
    gen(r) {
      const f = r.pick([50, 60]), P = r.pick([2, 4, 6, 8]), s = r.pick([0.02, 0.03, 0.04, 0.05, 0.06]);
      const ns = (120 * f) / P, n = ns * (1 - s);
      return {
        params: { f, P, s },
        q: `A ${P}-pole, ${f} Hz induction motor runs at ${s * 100}% slip. Find the rotor speed.`,
        ans: n, fmt: (v) => sig(v, 4) + ' rpm',
        distract: [
          { v: ns, why: 'That’s synchronous speed.' },
          { v: ((60 * f) / P) * (1 - s), why: 'Used 60f/P with total poles (that formula needs pole pairs).' },
          { v: ns * s, why: 'That’s the slip speed.' },
        ],
        setup: 'n_s = 120f/P,  n = n_s(1 − s)',
        steps: [`n_s = 120 × ${f}/${P} = ${ns} rpm`, `n = ${ns} × (1 − ${s}) = ${sig(n, 5)} rpm`],
      };
    } });

  T({ id: 'pw-dcm', set: '10.6', title: 'DC shunt motor speed change', hb: HB(EC, 'DC machines'),
    gen(r) {
      const V = r.pick([120, 240, 500]), Ra = r.pick([0.1, 0.2, 0.25, 0.4, 0.5, 1]);
      const I1 = r.pick([10, 20, 30, 40, 50]), I2 = r.pick([60, 80, 100, 120]), n1 = r.pick([1150, 1200, 1750, 1800]);
      const E1 = V - I1 * Ra, E2 = V - I2 * Ra;
      if (E2 <= 0.6 * V) return null;
      const n2 = (n1 * E2) / E1;
      return {
        params: { V, Ra, I1, I2, n1 },
        q: `A ${V} V shunt motor (R_a = ${Ra} Ω) runs at ${n1} rpm with ${I1} A armature current. Load rises and armature current becomes ${I2} A. Field flux is constant. Find the new speed.`,
        ans: n2, fmt: (v) => sig(v, 4) + ' rpm',
        distract: [
          { v: n1, why: 'Assumed no speed change.' },
          { v: (n1 * E1) / E2, why: 'Inverted the EMF ratio.' },
          { v: (n1 * I1) / I2, why: 'Scaled speed by current.' },
        ],
        setup: 'E_b = V − I_a·R_a;  n ∝ E_b at constant flux',
        steps: [`E₁ = ${V} − ${I1}(${Ra}) = ${sig(E1, 5)} V`, `E₂ = ${V} − ${I2}(${Ra}) = ${sig(E2, 5)} V`, `n₂ = ${n1} × E₂/E₁ = ${sig(n2, 5)} rpm`],
      };
    } });

  // ======================= 11 ELECTROMAGNETICS =======================
  const e0 = 8.854e-12, k = 1 / (4 * Math.PI * e0), mu0 = 4 * Math.PI * 1e-7;
  T({ id: 'em-coul', set: '11.1', title: 'Coulomb force', hb: HB(EC, 'Coulomb'), tol: { rel: 1e-4 },
    gen(r) {
      const q1 = r.nonzero(-9, 9), q2 = r.nonzero(-9, 9), rc = r.pick([5, 10, 20, 30, 50]);
      const F = (k * Math.abs(q1 * q2) * 1e-12) / sq(rc / 100);
      return {
        params: { q1, q2, rc },
        q: `Point charges of ${String(q1).replace('-', '−')} µC and ${String(q2).replace('-', '−')} µC are ${rc} cm apart in air (ε₀ = 8.854 × 10⁻¹² F/m). Find the magnitude of the force between them.`,
        ans: F, fmt: (v) => eng(v, 'N'),
        distract: [
          { v: (k * Math.abs(q1 * q2) * 1e-12) / (rc / 100), why: 'Forgot to square the distance.' },
          { v: (k * Math.abs(q1 * q2) * 1e-12) / sq(rc), why: 'Left the distance in cm.' },
          { v: (Math.abs(q1 * q2) * 1e-12) / (e0 * sq(rc / 100)), why: 'Used 1/ε₀ instead of 1/(4πε₀).' },
        ],
        setup: 'F = q₁q₂ / (4πε₀r²)',
        steps: [`F = 8.988e9 × ${Math.abs(q1 * q2)}e−12 / ${sig(sq(rc / 100), 4)} = ${eng(F, 'N', 4)}`],
      };
    } });

  T({ id: 'em-line', set: '11.1', title: 'Field of an infinite line charge', hb: HB(EC, 'line charge'), tol: { rel: 1e-4 },
    gen(r) {
      const lam = r.int(1, 50), rc = r.pick([1, 2, 5, 10, 20, 50]);
      const E = (lam * 1e-9) / (2 * Math.PI * e0 * (rc / 100));
      return {
        params: { lam, rc },
        q: `A long straight wire carries ${lam} nC/m. Find the electric field ${rc} cm from it in air (ε₀ = 8.854 × 10⁻¹² F/m).`,
        ans: E, fmt: (v) => eng(v, 'V/m'),
        distract: [
          { v: (lam * 1e-9) / (4 * Math.PI * e0 * (rc / 100)), why: 'Used the point-charge constant 4πε₀.' },
          { v: (lam * 1e-9) / (2 * Math.PI * e0 * sq(rc / 100)), why: 'Squared the distance (that’s for a point charge).' },
          { v: (lam * 1e-9) / (e0 * (rc / 100)), why: 'Dropped the 2π.' },
        ],
        setup: 'E = ρ_L / (2πε₀r)',
        steps: [`E = ${lam}e−9 / (2π × 8.854e−12 × ${rc / 100}) = ${eng(E, 'V/m', 4)}`],
      };
    } });

  T({ id: 'em-wire', set: '11.2', title: 'B-field of a long wire', hb: HB(EC, 'magnetic field'), tol: { rel: 1e-4 },
    gen(r) {
      const I = r.pick([1, 5, 10, 25, 50, 100, 200, 500]), rc = r.pick([1, 2, 5, 10, 20, 50]);
      const B = (mu0 * I) / (2 * Math.PI * (rc / 100));
      return {
        params: { I, rc },
        q: `A long straight conductor carries ${I} A. Find the magnetic flux density ${rc} cm away in air (μ₀ = 4π × 10⁻⁷ H/m).`,
        ans: B, fmt: (v) => eng(v, 'T'),
        distract: [
          { v: (mu0 * I) / (4 * Math.PI * (rc / 100)), why: 'Used 4π instead of 2π.' },
          { v: (mu0 * I) / (2 * (rc / 100)), why: 'That’s the field at the center of a loop.' },
          { v: (mu0 * I) / (2 * Math.PI * sq(rc / 100)), why: 'Squared the distance.' },
        ],
        setup: 'B = μ₀I / (2πr)',
        steps: [`B = 4π×10⁻⁷ × ${I} / (2π × ${rc / 100}) = ${eng(B, 'T', 4)}`],
      };
    } });

  T({ id: 'em-force', set: '11.2', title: 'Force between parallel conductors', hb: HB(EC, 'force'), tol: { rel: 1e-4 },
    gen(r) {
      const I1 = r.pick([10, 50, 100, 500, 1000, 2000]), I2 = r.pick([10, 50, 100, 500, 1000, 2000]), dc = r.pick([2, 5, 10, 20, 30]);
      const F = (mu0 * I1 * I2) / (2 * Math.PI * (dc / 100));
      return {
        params: { I1, I2, dc },
        q: `Two long parallel bus bars ${dc} cm apart carry ${I1} A and ${I2} A. Find the force per meter between them (μ₀ = 4π × 10⁻⁷ H/m).`,
        ans: F, fmt: (v) => eng(v, 'N/m'),
        distract: [
          { v: (mu0 * I1 * I2) / (4 * Math.PI * (dc / 100)), why: 'Used 4π instead of 2π.' },
          { v: (mu0 * I1 * I2) / (2 * Math.PI * sq(dc / 100)), why: 'Squared the distance.' },
          { v: (mu0 * (I1 + I2)) / (2 * Math.PI * (dc / 100)), why: 'Added the currents instead of multiplying.' },
        ],
        setup: 'F/L = μ₀I₁I₂ / (2πd)',
        steps: [`F/L = 4π×10⁻⁷ × ${I1} × ${I2} / (2π × ${dc / 100}) = ${eng(F, 'N/m', 4)}`],
      };
    } });

  T({ id: 'em-lambda', set: '11.4', title: 'Wavelength in a dielectric', hb: HB(EC, 'wavelength'),
    gen(r) {
      const f = r.pick([1e6, 10e6, 100e6, 300e6, 900e6, 2.4e9, 5.8e9, 10e9]), er = r.pick([2.1, 2.25, 4, 9, 2.56]);
      const lam = 3e8 / (f * Math.sqrt(er));
      return {
        params: { f, er },
        q: `Find the wavelength of a ${eng(f, 'Hz')} wave in a lossless dielectric with εᵣ = ${er} (μᵣ = 1, c = 3 × 10⁸ m/s).`,
        ans: lam, fmt: (v) => eng(v, 'm'),
        distract: [
          { v: 3e8 / f, why: 'That’s the free-space wavelength.' },
          { v: 3e8 / (f * er), why: 'Divided by εᵣ instead of √εᵣ.' },
          { v: (3e8 * Math.sqrt(er)) / f, why: 'Multiplied by √εᵣ — waves slow down in a dielectric.' },
        ],
        setup: 'λ = c / (f√εᵣ)',
        steps: [`v = c/√εᵣ = ${eng(3e8 / Math.sqrt(er), 'm/s', 4)}`, `λ = v/f = ${eng(lam, 'm', 4)}`],
      };
    } });

  T({ id: 'em-tline', set: '11.5', title: 'Reflection coefficient and VSWR', hb: HB(EC, 'reflection coefficient'), tol: { rel: 1e-6 },
    gen(r) {
      const Z0 = r.pick([50, 75, 300]), RL = r.int(10, 300), XL = r.nonzero(-150, 150);
      const g = C.div([RL - Z0, XL], [RL + Z0, XL]), G = C.abs(g), S = (1 + G) / (1 - G);
      const tgt = r.pick(['G', 'S']), ZLm = Math.hypot(RL, XL);
      const qs = `A ${Z0} Ω line is terminated in Z_L = ${RL} ${XL < 0 ? '−' : '+'} j${Math.abs(XL)} Ω.`;
      const base = { params: { Z0, RL, XL, tgt }, setup: 'Γ = (Z_L − Z₀)/(Z_L + Z₀),  VSWR = (1 + |Γ|)/(1 − |Γ|)',
        steps: [`Γ = ${rect(g, 4)}`, `|Γ| = ${sig(G, 4)}`, `VSWR = ${sig(S, 4)}`] };
      if (tgt === 'G') return { ...base, q: qs + ' Find |Γ| at the load.', ans: G, fmt: (v) => sig(v, 3),
        distract: [{ v: C.abs([RL - Z0, XL]) / Z0, why: 'Divided by Z₀ instead of Z_L + Z₀.' }, { v: Math.abs(ZLm - Z0) / (ZLm + Z0), why: 'Used magnitudes instead of complex impedances.' }, { v: 1 / S, why: 'That’s 1/VSWR.' }] };
      return { ...base, q: qs + ' Find the VSWR.', ans: S, fmt: (v) => sig(v, 3),
        distract: [{ v: Math.max(ZLm / Z0, Z0 / ZLm), why: 'Used |Z_L|/Z₀ — only valid for a resistive load.' }, { v: 1 + G, why: 'Forgot the (1 − |Γ|) denominator.' }, { v: (1 + G) / (1 - G) / 2, why: 'Halved it.' }] };
    } });

  // ======================= 12 CONTROL SYSTEMS =======================
  T({ id: 'ct-ess', set: '12.1', title: 'Closed-loop steady-state step error', hb: HB('Instrumentation, Measurement, and Controls', 'steady-state error'), tol: { rel: 2e-3 },
    gen(r) {
      const K = r.int(2, 50), a = r.int(1, 20), e = a / (a + K);
      return {
        params: { K, a },
        q: `A unity-feedback loop has G(s) = ${K}/(s + ${a}). Find the steady-state error to a unit step.`,
        ans: e, fmt: (v) => sig(v, 3),
        distract: [
          { v: 1 / (1 + K), why: 'Used K as the position constant; actually K_p = G(0) = K/a.' },
          { v: K / (a + K), why: 'That’s the final output, not the error.' },
          { v: a / K, why: 'Used 1/K_p instead of 1/(1 + K_p).' },
        ],
        setup: 'e_ss = 1/(1 + K_p),  K_p = lim s→0 G(s)',
        steps: [`K_p = ${K}/${a} = ${sig(K / a, 4)}`, `e_ss = 1/(1 + ${sig(K / a, 4)}) = ${sig(e, 4)}`],
      };
    } });

  T({ id: 'ct-ramp', set: '12.4', title: 'Type-1 ramp error', hb: HB('Instrumentation, Measurement, and Controls', 'steady-state error'), tol: { rel: 3e-3 },
    gen(r) {
      const K = r.int(5, 100), a = r.int(1, 20);
      return {
        params: { K, a },
        q: `A unity-feedback loop has G(s) = ${K}/[s(s + ${a})]. Find the steady-state error to a unit ramp input.`,
        ans: a / K, fmt: (v) => sig(v, 3),
        distract: [
          { v: K / a, why: 'That’s K_v itself; the error is 1/K_v.' },
          { v: 1 / K, why: 'Forgot the pole at s = −a when finding K_v.' },
          { v: 0, why: 'Zero is the step error for a type-1 system.' },
        ],
        setup: 'e_ss = 1/K_v,  K_v = lim s→0 s·G(s)',
        steps: [`K_v = ${K}/${a} = ${sig(K / a, 4)}`, `e_ss = ${sig(a / K, 4)}`],
      };
    } });

  T({ id: 'ct-2nd', set: '12.4', title: 'Second-order overshoot and peak time', hb: HB('Instrumentation, Measurement, and Controls', 'overshoot'), tol: { rel: 2e-3 },
    gen(r) {
      const wn = r.int(2, 10), z = r.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7]);
      const b = +(2 * z * wn).toFixed(4), c = wn * wn, wd = wn * Math.sqrt(1 - z * z);
      const OS = 100 * Math.exp((-z * Math.PI) / Math.sqrt(1 - z * z)), tp = Math.PI / wd;
      const tgt = r.pick(['os', 'tp']);
      const qs = `T(s) = ${c} / (s² + ${b}s + ${c}). A unit step is applied.`;
      const base = { params: { b, c, tgt }, setup: 'ω_n = √c, ζ = b/(2ω_n);  %OS = 100·e^(−ζπ/√(1−ζ²)),  t_p = π/(ω_n√(1−ζ²))',
        steps: [`ω_n = ${wn} rad/s, ζ = ${b}/(2·${wn}) = ${z}`, `%OS = ${fix(OS, 2)}%`, `t_p = ${sig(tp, 4)} s`] };
      if (tgt === 'os') {
        const z2 = Math.min(0.95, b / wn);
        return { ...base, q: qs + ' Find the percent overshoot.', ans: OS, fmt: (v) => fix(v, 1) + '%',
          distract: [{ v: 100 * Math.exp(-z * Math.PI), why: 'Dropped the √(1 − ζ²).' }, { v: 100 * Math.exp((-z2 * Math.PI) / Math.sqrt(1 - z2 * z2)), why: 'Took ζ = b/ω_n (forgot the 2).' }, { v: 100 * Math.exp((-Math.min(0.95, b / (2 * c)) * Math.PI) / Math.sqrt(1 - Math.min(0.95, b / (2 * c)) ** 2)), why: 'Used c instead of ω_n = √c when finding ζ.' }] };
      }
      return { ...base, q: qs + ' Find the peak time.', ans: tp, fmt: (v) => sig(v, 3) + ' s',
        distract: [{ v: Math.PI / wn, why: 'Used ω_n instead of ω_d.' }, { v: (2 * Math.PI) / wd, why: 'That’s a full period of ringing.' }, { v: 4 / (z * wn), why: 'That’s the 2% settling time.' }] };
    } });

  T({ id: 'ct-bode', set: '12.2', title: 'Bode magnitude of a first-order lag', hb: HB('Instrumentation, Measurement, and Controls', 'Bode'),
    gen(r) {
      const K = r.pick([1, 2, 5, 10, 20, 50, 100]), p = r.pick([10, 100, 1000]), m = r.pick([0.5, 1, 2, 5, 10]);
      const w = p * m, dB = 20 * Math.log10(K) - 10 * Math.log10(1 + m * m);
      const asym = m <= 1 ? 20 * Math.log10(K) : 20 * Math.log10(K) - 20 * Math.log10(m);
      return {
        params: { K, p, w }, sep: { abs: 0.6 },
        q: `G(s) = ${K} / (1 + s/${p}). Find the exact magnitude in dB at ω = ${w} rad/s.`,
        ans: dB, fmt: (v) => fix(v, 1) + ' dB',
        distract: [
          { v: asym, why: 'Read the straight-line asymptote, not the exact value.' },
          { v: 10 * Math.log10(K) - 10 * Math.log10(1 + m * m), why: 'Used 10·log for the gain K.' },
          { v: 20 * Math.log10(K) - 20 * Math.log10(1 + m), why: 'Added ω/p instead of root-sum-square.' },
        ],
        setup: '|G|dB = 20log K − 10log(1 + (ω/p)²)',
        steps: [`20 log ${K} = ${fix(20 * Math.log10(K), 2)} dB`, `10 log(1 + ${m}²) = ${fix(10 * Math.log10(1 + m * m), 2)} dB`, `= ${fix(dB, 2)} dB`],
      };
    } });

  T({ id: 'ct-routh', set: '12.3', title: 'Routh stability limit', hb: HB('Instrumentation, Measurement, and Controls', 'Routh'), tol: { rel: 1e-3 },
    gen(r) {
      const a = r.int(2, 10), b = r.int(2, 20);
      return {
        params: { a, b },
        q: `The characteristic equation is s³ + ${a}s² + ${b}s + K = 0. What is the largest K for stability?`,
        ans: a * b, fmt: (v) => sig(v, 3),
        distract: [
          { v: a + b, why: 'Added the coefficients.' },
          { v: b / a, why: 'Divided instead of multiplied.' },
          { v: (a * b) / 2, why: 'Extra factor of ½.' },
        ],
        setup: 'Routh row s¹: (a·b − K)/a > 0',
        steps: [`Routh array: s³ [1, ${b}], s² [${a}, K], s¹ [(${a}·${b} − K)/${a}], s⁰ [K]`, `Stable for 0 < K < ${a * b}`],
      };
    } });

  // ======================= 13 COMMUNICATIONS =======================
  T({ id: 'cm-am', set: '13.2', title: 'AM power', hb: HB(EC, 'amplitude modulation'), tol: { rel: 1e-4 },
    gen(r) {
      const Pc = r.pick([100, 250, 500, 1000, 5000, 10000]), mu = r.pick([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
      const tgt = r.pick(['Pt', 'Psb']), Pt = Pc * (1 + (mu * mu) / 2), Psb = (Pc * mu * mu) / 2;
      const qs = `An AM transmitter has ${big(Pc)} W carrier power and modulation index ${mu}.`;
      const base = { params: { Pc, mu, tgt }, setup: 'P_t = P_c(1 + μ²/2);  both sidebands = P_c·μ²/2',
        steps: [`P_sidebands = ${big(Pc)} × ${mu}²/2 = ${eng(Psb, 'W', 4)}`, `P_t = ${eng(Pt, 'W', 4)}`] };
      if (tgt === 'Pt') return { ...base, q: qs + ' Find the total transmitted power.', ans: Pt, fmt: (v) => eng(v, 'W'),
        distract: [{ v: Pc * (1 + mu * mu), why: 'Forgot the ½.' }, { v: Pc * (1 + mu / 2), why: 'Forgot to square μ.' }, { v: Pc * (1 + (mu * mu) / 4), why: 'Counted only one sideband.' }] };
      return { ...base, q: qs + ' Find the total power in both sidebands.', ans: Psb, fmt: (v) => eng(v, 'W'),
        distract: [{ v: (Pc * mu * mu) / 4, why: 'That’s one sideband.' }, { v: Pc * mu * mu, why: 'Forgot the ½.' }, { v: (Pc * mu) / 2, why: 'Forgot to square μ.' }] };
    } });

  T({ id: 'cm-fm', set: '13.3', title: 'FM bandwidth (Carson’s rule)', hb: HB(EC, 'Carson'),
    gen(r) {
      const df = r.pick([5, 10, 15, 25, 50, 75]) * 1000, fm = r.pick([1, 2, 3, 5, 10, 15]) * 1000;
      const tgt = r.pick(['B', 'beta']);
      const qs = `An FM signal has peak deviation ${eng(df, 'Hz')} and a ${eng(fm, 'Hz')} modulating tone.`;
      const base = { params: { df, fm, tgt }, setup: 'β = Δf/f_m;  B ≈ 2(Δf + f_m)',
        steps: [`β = ${sig(df / fm, 4)}`, `B = 2(${eng(df, 'Hz')} + ${eng(fm, 'Hz')}) = ${eng(2 * (df + fm), 'Hz', 4)}`] };
      if (tgt === 'B') return { ...base, q: qs + ' Estimate the bandwidth with Carson’s rule.', ans: 2 * (df + fm), fmt: (v) => eng(v, 'Hz'),
        distract: [{ v: 2 * df, why: 'Forgot f_m.' }, { v: 2 * fm, why: 'That’s the AM bandwidth.' }, { v: df + fm, why: 'Forgot the factor of 2.' }] };
      return { ...base, q: qs + ' Find the modulation index β.', ans: df / fm, fmt: (v) => sig(v, 3),
        distract: [{ v: fm / df, why: 'Inverted the ratio.' }, { v: (2 * df) / fm, why: 'Used peak-to-peak deviation.' }, { v: df / fm + 1, why: 'Mixed in the Carson “+ f_m” term.' }] };
    } });

  T({ id: 'cm-shannon', set: '13.5', title: 'Shannon channel capacity', hb: HB(EC, 'Shannon'), tol: { rel: 1e-9 },
    gen(r) {
      const B = r.pick([3000, 4000, 1e4, 1e5, 1e6, 6e6]), dB = r.pick([10, 15, 20, 25, 30, 40]);
      const snr = 10 ** (dB / 10), Cap = B * Math.log2(1 + snr);
      return {
        params: { B, dB },
        q: `A channel has ${eng(B, 'Hz')} bandwidth and an SNR of ${dB} dB. Find the Shannon capacity.`,
        ans: Cap, fmt: (v) => eng(v, 'b/s'),
        distract: [
          { v: B * Math.log2(1 + dB), why: 'Used the dB number directly.' },
          { v: B * Math.log10(1 + snr), why: 'Used log₁₀ instead of log₂.' },
          { v: B * Math.log2(1 + 10 ** (dB / 20)), why: 'Converted dB as a voltage ratio (÷20).' },
        ],
        setup: 'C = B·log₂(1 + S/N),  S/N = 10^(dB/10)',
        steps: [`S/N = 10^(${dB}/10) = ${big(snr)}`, `C = ${eng(B, 'Hz')} × log₂(${big(1 + snr)}) = ${eng(Cap, 'b/s', 4)}`],
      };
    } });

  T({ id: 'cm-pcm', set: '13.5', title: 'PCM bit rate', hb: HB(EC, 'pulse code modulation'),
    gen(r) {
      const fmax = r.pick([3.4, 4, 5, 8, 10, 15, 20]) * 1000, L = r.pick([16, 50, 64, 100, 128, 200, 256, 1000]);
      const n = Math.ceil(Math.log2(L)), R = 2 * fmax * n;
      return {
        params: { fmax, L },
        q: `A signal band-limited to ${eng(fmax, 'Hz')} is sampled at the Nyquist rate and quantized to at least ${L} levels with binary code words. Find the minimum bit rate.`,
        ans: R, fmt: (v) => eng(v, 'b/s'),
        distract: [
          { v: fmax * n, why: 'Sampled at f_max instead of 2f_max.' },
          { v: 2 * fmax * L, why: 'Used levels instead of bits per sample.' },
          { v: 2 * fmax * (n - 1), why: 'Rounded bits per sample down.' },
          { v: 2 * fmax * Math.log2(L), why: 'Used a fractional number of bits.' },
        ],
        setup: 'n = ⌈log₂ L⌉ bits,  R = 2f_max·n',
        steps: [`n = ⌈log₂ ${L}⌉ = ${n} bits`, `R = 2 × ${eng(fmax, 'Hz')} × ${n} = ${eng(R, 'b/s', 4)}`],
      };
    } });

  T({ id: 'cm-tdm', set: '13.6', title: 'TDM line rate', hb: HB(EC, 'multiplexing'),
    gen(r) {
      const N = r.pick([4, 8, 12, 16, 24, 30, 32]), fs = 8000, n = r.pick([7, 8]);
      const R = (N * n + 1) * fs;
      return {
        params: { N, fs, n },
        q: `${N} voice channels are each sampled at ${eng(fs, 'Hz')} with ${n}-bit samples and time-division multiplexed. Each frame adds one framing bit. Find the line bit rate.`,
        ans: R, fmt: (v) => eng(v, 'b/s', 4),
        distract: [
          { v: N * n * fs, why: 'Forgot the framing bit.' },
          { v: (N * n + N) * fs, why: 'Added a framing bit per channel.' },
          { v: (N + 1) * fs, why: 'Forgot the bits per sample.' },
        ],
        setup: 'Bits/frame = N·n + 1;  frames/s = f_s',
        steps: [`Bits/frame = ${N}×${n} + 1 = ${N * n + 1}`, `R = ${N * n + 1} × ${fs} = ${eng(R, 'b/s', 4)}`],
      };
    } });

  T({ id: 'cm-square', set: '13.4', title: 'Square-wave harmonic amplitude', hb: HB(EC, 'Fourier series'), tol: { rel: 1e-3 },
    gen(r) {
      const A = r.int(1, 12), n = r.pick([3, 5, 7]);
      return {
        params: { A, n },
        q: `A ±${A} V square wave (zero average) is expanded in a Fourier series. Find the amplitude of harmonic ${n}.`,
        ans: (4 * A) / (n * Math.PI), fmt: (v) => sig(v, 3) + ' V',
        distract: [
          { v: (4 * A) / Math.PI, why: 'That’s the fundamental.' },
          { v: (2 * A) / (n * Math.PI), why: 'Used 2A/(nπ) — that’s for a 0-to-A square wave.' },
          { v: (4 * A) / (n * n * Math.PI), why: 'Divided by n² (that’s triangle-wave behavior).' },
        ],
        setup: 'bₙ = 4A/(nπ) for odd n',
        steps: [`b_${n} = 4 × ${A} / (${n}π) = ${sig((4 * A) / (n * Math.PI), 4)} V`],
      };
    } });

  // ======================= 14 NETWORKS =======================
  const ip2s = (x) => [24, 16, 8, 0].map((s) => (x >>> s) & 255).join('.');
  const maskOf = (p) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
  T({ id: 'n-ipv4', set: '14.3', title: 'IPv4 subnet arithmetic', hb: HB(EC, 'IPv4'),
    gen(r) {
      const p = r.int(18, 29), fam = r.pick(['10', '172', '192']);
      const o1 = +fam, o2 = fam === '10' ? r.int(0, 255) : fam === '172' ? r.int(16, 31) : 168;
      const addr = ((o1 << 24) | (o2 << 16) | (r.int(0, 255) << 8) | r.int(1, 254)) >>> 0;
      const m = maskOf(p), net = (addr & m) >>> 0, bc = (net | (~m >>> 0)) >>> 0;
      if (addr === net || addr === bc) return null;
      const tgt = r.pick(['net', 'bcast', 'hosts', 'last']);
      const qs = `A host is configured as ${ip2s(addr)}/${p}.`;
      const base = { params: { addr: ip2s(addr), p, tgt }, setup: 'Network = address AND mask; broadcast = network OR (NOT mask); usable hosts = 2^(32−p) − 2',
        steps: [`Mask /${p} = ${ip2s(m)}`, `Network = ${ip2s(net)}, broadcast = ${ip2s(bc)}`, `Usable hosts = 2^${32 - p} − 2 = ${2 ** (32 - p) - 2}`] };
      const mn = (pp) => ip2s((addr & maskOf(pp)) >>> 0), mb = (pp) => ip2s(((addr & maskOf(pp)) | (~maskOf(pp) >>> 0)) >>> 0);
      if (tgt === 'net') return { ...base, type: 'text', q: qs + ' What is its network address?', ans: ip2s(net),
        distract: [{ v: ip2s(bc), why: 'That’s the broadcast address.' }, { v: mn(p + 1), why: 'Used a /' + (p + 1) + ' mask.' }, { v: mn(p - 1), why: 'Used a /' + (p - 1) + ' mask.' }, { v: ip2s(net + 1), why: 'That’s the first usable host.' }] };
      if (tgt === 'bcast') return { ...base, type: 'text', q: qs + ' What is the broadcast address of its subnet?', ans: ip2s(bc),
        distract: [{ v: ip2s(net), why: 'That’s the network address.' }, { v: mb(p + 1), why: 'Used a /' + (p + 1) + ' mask.' }, { v: mb(p - 1), why: 'Used a /' + (p - 1) + ' mask.' }, { v: ip2s(bc - 1), why: 'That’s the last usable host.' }] };
      if (tgt === 'last') return { ...base, type: 'text', q: qs + ' What is the last usable host address in its subnet?', ans: ip2s(bc - 1),
        distract: [{ v: ip2s(bc), why: 'That’s the broadcast address.' }, { v: ip2s(((addr & maskOf(p + 1)) | (~maskOf(p + 1) >>> 0)) - 1 >>> 0), why: 'Used a /' + (p + 1) + ' mask.' }, { v: ip2s(((addr & maskOf(p - 1)) | (~maskOf(p - 1) >>> 0)) - 1 >>> 0), why: 'Used a /' + (p - 1) + ' mask.' }, { v: ip2s(net + 1), why: 'That’s the first usable host.' }] };
      return { ...base, q: qs + ' How many usable host addresses does its subnet have?', ans: 2 ** (32 - p) - 2, fmt: big, noFill: true,
        distract: [{ v: 2 ** (32 - p), why: 'Forgot to remove the network and broadcast addresses.' }, { v: 2 ** (32 - p) - 1, why: 'Removed only one reserved address.' }, { v: 2 ** (32 - p + 1) - 2, why: 'Off by one host bit.' }, { v: 2 ** (32 - p - 1) - 2, why: 'Off by one host bit.' }] };
    } });

  T({ id: 'n-mask', set: '14.3', title: 'Smallest subnet for N hosts', hb: HB(EC, 'subnet'),
    gen(r) {
      const H = r.int(5, 1000);
      let p = 30;
      while (2 ** (32 - p) - 2 < H) p--;
      if (2 ** (32 - p) - 2 === H) return null;
      const lab = (pp) => `${ip2s(maskOf(pp))} (/${pp})`;
      let p2 = 30;
      while (2 ** (32 - p2) < H) p2--;
      return {
        type: 'text', params: { H },
        q: `A subnet must hold ${H} usable hosts. What is the longest (smallest) mask that works?`,
        ans: lab(p),
        distract: [
          p2 !== p ? { v: lab(p2), why: 'Forgot the network and broadcast addresses.' } : null,
          { v: lab(p + 1), why: 'Too small — not enough hosts.' },
          { v: lab(p - 1), why: 'Works, but isn’t the smallest.' },
          { v: lab(p - 2), why: 'Works, but wastes addresses.' },
        ],
        setup: 'Find the largest p with 2^(32−p) − 2 ≥ hosts',
        steps: [`/${p} gives 2^${32 - p} − 2 = ${2 ** (32 - p) - 2} hosts ≥ ${H}`, `/${p + 1} gives only ${2 ** (32 - p - 1) - 2}`],
      };
    } });

  T({ id: 'n-delay', set: '14.1', title: 'Transmission + propagation delay', hb: HB(EC, 'propagation delay'), tol: { rel: 1e-9 },
    gen(r) {
      const L = r.pick([500, 1000, 1250, 1500]), R = r.pick([1, 10, 100]) * 1e6, d = r.pick([10, 100, 500, 1000, 2500, 5000]) * 1000;
      const tt = (8 * L) / R, tp = d / 2e8;
      return {
        params: { L, R, d },
        q: `A ${L}-byte packet is sent over a ${eng(R, 'b/s')} link ${big(d / 1000)} km long (propagation speed 2 × 10⁸ m/s). Find the time from the first bit sent to the last bit received.`,
        ans: tt + tp, fmt: (v) => eng(v, 's'),
        distract: [
          { v: L / R + tp, why: 'Forgot to convert bytes to bits.' },
          { v: tt, why: 'Transmission delay only.' },
          { v: tp, why: 'Propagation delay only.' },
        ],
        setup: 'Total = (bits / rate) + (distance / speed)',
        steps: [`Transmission = ${8 * L}/${eng(R, 'b/s')} = ${eng(tt, 's', 4)}`, `Propagation = ${d} m / 2e8 = ${eng(tp, 's', 4)}`, `Total = ${eng(tt + tp, 's', 4)}`],
      };
    } });

  // ======================= 15 DIGITAL =======================
  T({ id: 'd-base', set: '15.1', title: 'Number base conversion', hb: HB(EC, 'number systems'),
    gen(r) {
      const n = r.int(100, 4095), kind = r.pick(['d2h', 'd2b', 'h2d', 'd2o']);
      const H = (x) => x.toString(16).toUpperCase(), Bn = (x) => x.toString(2), O = (x) => x.toString(8);
      const rev = (s) => s.split('').reverse().join('');
      const flipBit = (s, i) => s.slice(0, i) + (s[i] === '0' ? '1' : '0') + s.slice(i + 1);
      if (kind === 'd2h') return { type: 'text', params: { n, kind }, q: `Convert ${n} (decimal) to hexadecimal.`, ans: H(n),
        distract: [{ v: rev(H(n)), why: 'Wrote the remainders in the wrong order.' }, { v: H(n + 16), why: 'Arithmetic slip in a middle digit.' }, { v: H(n - 1), why: 'Off by one.' }, { v: O(n), why: 'That’s octal.' }],
        setup: 'Repeated division by 16; read remainders bottom-up', steps: [`${n} = ${H(n)}₁₆`] };
      if (kind === 'd2o') return { type: 'text', params: { n, kind }, q: `Convert ${n} (decimal) to octal.`, ans: O(n),
        distract: [{ v: rev(O(n)), why: 'Wrote the remainders in the wrong order.' }, { v: O(n + 8), why: 'Arithmetic slip in a digit.' }, { v: H(n), why: 'That’s hexadecimal.' }, { v: O(n - 1), why: 'Off by one.' }],
        setup: 'Repeated division by 8; read remainders bottom-up', steps: [`${n} = ${O(n)}₈`] };
      if (kind === 'd2b') {
        const m = r.int(5, 255), b = Bn(m);
        return { type: 'text', params: { n: m, kind }, q: `Convert ${m} (decimal) to binary.`, ans: b,
          distract: [{ v: rev(b), why: 'Wrote the bits in the wrong order.' }, { v: flipBit(b, Math.floor(b.length / 2)), why: 'One bit wrong.' }, { v: Bn(m + 2), why: 'Off by two.' }, { v: Bn(m - 1), why: 'Off by one.' }],
          setup: 'Repeated division by 2, or subtract powers of 2', steps: [`${m} = ${b}₂`] };
      }
      return { type: 'text', params: { n, kind }, q: `Convert ${H(n)}₁₆ to decimal.`, ans: String(n),
        distract: [{ v: String(parseInt(rev(H(n)), 16)), why: 'Read the digits in the wrong order.' }, { v: String(n + 16), why: 'Arithmetic slip.' }, { v: String(n - 16), why: 'Arithmetic slip.' }, { v: /^[0-9]+$/.test(H(n)) ? String(+H(n) + 1) : String(n + 1), why: 'Off by one.' }],
        setup: 'Σ digit × 16^position', steps: [`${H(n).split('').map((d, i, a) => `${parseInt(d, 16)}×16^${a.length - 1 - i}`).join(' + ')} = ${n}`] };
    } });

  T({ id: 'd-twos', set: '15.1', title: 'Two’s complement', hb: HB(EC, 'two’s complement'),
    gen(r) {
      const kind = r.pick(['read', 'write']);
      const b8 = (x) => (x & 255).toString(2).padStart(8, '0');
      if (kind === 'read') {
        const u = r.int(129, 254), v = u - 256;
        return { type: 'text', params: { u, kind }, q: `The 8-bit two’s-complement value ${b8(u)} is stored in a register. What signed decimal value is it?`, ans: String(v).replace('-', '−'),
          distract: [{ v: String(u), why: 'Read it as unsigned.' }, { v: String(u - 255).replace('-', '−'), why: 'Used one’s complement.' }, { v: '−' + (u - 128), why: 'Read it as sign-magnitude.' }],
          setup: 'MSB = 1 means negative: value = unsigned − 256', steps: [`${b8(u)} = ${u} unsigned`, `${u} − 256 = ${v}`] };
      }
      const v = -r.int(2, 127);
      return { type: 'text', params: { v, kind }, q: `Write ${String(v).replace('-', '−')} as an 8-bit two’s-complement number.`, ans: b8(v),
        distract: [{ v: b8(~-v), why: 'That’s one’s complement (forgot to add 1).' }, { v: '1' + b8(-v).slice(1), why: 'That’s sign-magnitude.' }, { v: b8(-v), why: 'That’s the positive value.' }],
        setup: 'Invert the bits of |v|, then add 1', steps: [`|v| = ${b8(-v)}`, `invert → ${b8(~-v)}`, `+1 → ${b8(v)}`] };
    } });

  // ---- minimal SOP (Quine–McCluskey style, brute-force cover for 4 vars) ----
  const VARS = ['A', 'B', 'C', 'D'];
  function cubeTerm(val, mask) {
    let s = '';
    for (let b = 3; b >= 0; b--) {
      if (mask & (1 << b)) continue;
      s += VARS[3 - b] + ((val >> b) & 1 ? '' : '′');
    }
    return s || '1';
  }
  const cubeMins = (val, mask) => { const out = []; for (let m = 0; m < 16; m++) if ((m & ~mask) === val) out.push(m); return out; };
  function minimalSOP(ons) {
    const on = new Set(ons), imps = [];
    for (let mask = 0; mask < 16; mask++) for (let val = 0; val < 16; val++) {
      if (val & mask) continue;
      if (cubeMins(val, mask).every((m) => on.has(m))) imps.push([val, mask]);
    }
    const primes = imps.filter(([v, m]) => !imps.some(([v2, m2]) => m2 !== m && (m2 & m) === m && (v & ~m2) === v2));
    let best = null;
    const P = primes.length;
    for (let s = 1; s < 1 << P; s++) {
      const pick = primes.filter((_, i) => s & (1 << i));
      const cov = new Set(pick.flatMap(([v, m]) => cubeMins(v, m)));
      if (![...on].every((m) => cov.has(m))) continue;
      const lits = pick.reduce((a, [, m]) => a + 4 - popc(m), 0);
      if (!best || pick.length < best.n || (pick.length === best.n && lits < best.lits)) best = { n: pick.length, lits, pick };
    }
    return best.pick;
  }
  const popc = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const exprOf = (cubes) => cubes.map(([v, m]) => cubeTerm(v, m)).sort().join(' + ');
  const ttOf = (cubes) => { let t = 0; for (let m = 0; m < 16; m++) if (cubes.some(([v, mk]) => (m & ~mk) === v)) t |= 1 << m; return t; };
  FE.H.minimalSOP = minimalSOP;

  T({ id: 'd-sop', set: '15.4', title: 'Minimal SOP (K-map)', hb: HB(EC, 'Karnaugh'),
    gen(r) {
      const cnt = r.int(5, 9), ons = r.shuffle([...Array(16).keys()]).slice(0, cnt).sort((a, b) => a - b);
      const best = minimalSOP(ons), tt = ttOf(best);
      const cands = [];
      best.forEach(([v, m], i) => {
        for (let b = 0; b < 4; b++) {
          if (m & (1 << b)) continue;
          const drop = best.slice(); drop[i] = [v & ~(1 << b), m | (1 << b)];
          cands.push({ c: drop, why: 'A term is too big — it covers a 0 cell.' });
          const flip = best.slice(); flip[i] = [v ^ (1 << b), m];
          cands.push({ c: flip, why: 'A literal has the wrong polarity.' });
        }
        if (best.length > 1) cands.push({ c: best.filter((_, j) => j !== i), why: 'Missing a term — some 1 cells are uncovered.' });
        if (popc(m) > 0) for (let b = 0; b < 4; b++) if (m & (1 << b)) {
          const narrow = best.slice(); narrow[i] = [v, m & ~(1 << b)];
          if (ttOf(narrow) !== tt) cands.push({ c: narrow, why: 'A term is too small — some 1 cells are uncovered.' });
        }
      });
      const seen = new Set([exprOf(best)]), ds = [];
      for (const x of r.shuffle(cands)) {
        const e = exprOf(x.c);
        if (seen.has(e) || ttOf(x.c) === tt) continue;
        seen.add(e); ds.push({ v: e, why: x.why });
      }
      return {
        type: 'text', params: { ons },
        q: `F(A, B, C, D) = Σm(${ons.join(', ')}). Which is a minimal sum-of-products expression for F? (A is the MSB; ′ means NOT.)`,
        ans: exprOf(best), distract: ds,
        setup: 'Plot on a 4-variable K-map; circle the largest power-of-2 groups; cover every 1 with the fewest groups',
        steps: [`Prime-implicant cover: ${exprOf(best)}`, `${best.length} terms, ${best.reduce((a, [, m]) => a + 4 - popc(m), 0)} literals`],
      };
    } });

  const OPS = {
    AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b),
    XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b),
  };
  T({ id: 'd-tt', set: '15.3', title: 'Gate network truth table', hb: HB(EC, 'logic gates'),
    gen(r) {
      const vars = r.shuffle(['A', 'B', 'C']), neg = vars.map(() => r.f() < 0.3);
      const names = Object.keys(OPS), o1 = r.pick(names), o2 = r.pick(names);
      const lit = (i) => vars[i] + (neg[i] ? '′' : '');
      const col = (op1, op2, inv) => {
        let s = '';
        for (let m = 0; m < 8; m++) {
          const val = { A: (m >> 2) & 1, B: (m >> 1) & 1, C: m & 1 };
          const x = (i) => (neg[i] ? 1 - val[vars[i]] : val[vars[i]]);
          let f = OPS[op2](OPS[op1](x(0), x(1)), x(2));
          if (inv) f = 1 - f;
          s += f;
        }
        return s;
      };
      const ans = col(o1, o2, false);
      if (/^0+$|^1+$/.test(ans)) return null;
      const ds = [{ v: col(o1, o2, true), why: 'Output inverted — check the last gate.' }];
      for (const n of r.shuffle(names)) if (n !== o1) ds.push({ v: col(n, o2, false), why: `That’s what ${n} would give for the first gate.` });
      for (const n of r.shuffle(names)) if (n !== o2) ds.push({ v: col(o1, n, false), why: `That’s what ${n} would give for the second gate.` });
      return {
        type: 'text', params: { expr: `(${lit(0)} ${o1} ${lit(1)}) ${o2} ${lit(2)}` },
        q: `F = (${lit(0)} ${o1} ${lit(1)}) ${o2} ${lit(2)}. Which is F for ABC = 000, 001, 010, …, 111 (left to right)?`,
        ans, distract: r.shuffle(ds),
        setup: 'Evaluate the inner gate first for each row',
        steps: [`Row by row (ABC 000→111): ${ans.split('').join(' ')}`],
      };
    } });

  T({ id: 'd-ripple', set: '15.5', title: 'Ripple counter output frequency', hb: HB(EC, 'counter'),
    gen(r) {
      const n = r.int(3, 8), k = r.int(0, n - 1), f = r.pick([1, 2, 4, 8, 10, 16, 32]) * 1e6;
      const fk = f / 2 ** (k + 1);
      return {
        params: { n, k, f },
        q: `A ${n}-bit binary ripple counter is clocked at ${eng(f, 'Hz')}. What is the frequency of output Q${k} (Q0 is the LSB)?`,
        ans: fk, fmt: (v) => eng(v, 'Hz'),
        distract: [
          { v: f / 2 ** k, why: 'Off by one stage — Q0 already divides by 2.' },
          { v: f / 2 ** (k + 2), why: 'Off by one stage.' },
          { v: f / 2 ** n, why: 'That’s the MSB frequency.' },
          { v: f / (k + 1), why: 'Divided linearly instead of by powers of 2.' },
        ],
        setup: 'Each flip-flop divides by 2: f_Qk = f_clk / 2^(k+1)',
        steps: [`f_Q${k} = ${eng(f, 'Hz')} / 2^${k + 1} = ${eng(fk, 'Hz', 4)}`],
      };
    } });

  T({ id: 'd-fmax', set: '15.9', title: 'Maximum clock frequency', hb: HB(EC, 'setup time'), tol: { rel: 1e-9 },
    gen(r) {
      const tcq = r.int(2, 8), tl = r.int(5, 40), tsu = r.int(1, 6), th = r.int(1, 4);
      const per = (tcq + tl + tsu) * 1e-9;
      return {
        params: { tcq, tl, tsu, th },
        q: `A register-to-register path has clock-to-Q ${tcq} ns, combinational delay ${tl} ns, setup time ${tsu} ns, and hold time ${th} ns. Ignoring skew, find the maximum clock frequency.`,
        ans: 1 / per, fmt: (v) => eng(v, 'Hz'),
        distract: [
          { v: 1 / ((tl + tsu) * 1e-9), why: 'Forgot clock-to-Q.' },
          { v: 1 / ((tcq + tl) * 1e-9), why: 'Forgot setup time.' },
          { v: 1 / ((tcq + tl + tsu + th) * 1e-9), why: 'Added hold time — hold doesn’t limit f_max.' },
        ],
        setup: 'T_min = t_cq + t_logic + t_setup',
        steps: [`T_min = ${tcq} + ${tl} + ${tsu} = ${tcq + tl + tsu} ns`, `f_max = ${eng(1 / per, 'Hz', 4)}`],
      };
    } });

  T({ id: 'd-states', set: '15.8', title: 'Flip-flops for a state machine', hb: HB(EC, 'state'),
    gen(r) {
      const N = r.int(5, 40), enc = r.pick(['binary', 'one-hot']);
      const b = Math.ceil(Math.log2(N)), ans = enc === 'binary' ? b : N;
      return {
        params: { N, enc },
        q: `A state machine has ${N} states. How many flip-flops does ${enc} state encoding need?`,
        ans, fmt: (v) => String(v), noFill: true,
        distract: enc === 'binary'
          ? [{ v: N, why: 'That’s one-hot.' }, { v: Math.floor(Math.log2(N)), why: 'Rounded log₂ down.' }, { v: b + 1, why: 'One too many.' }, { v: N - 1, why: 'Not an encoding rule.' }]
          : [{ v: b, why: 'That’s binary encoding.' }, { v: N - 1, why: 'Every state needs its own flip-flop.' }, { v: 2 * b, why: 'Not an encoding rule.' }, { v: N + 1, why: 'One too many.' }],
        setup: enc === 'binary' ? 'n = ⌈log₂ N⌉' : 'One flip-flop per state',
        steps: [enc === 'binary' ? `⌈log₂ ${N}⌉ = ${b}` : `${N} states → ${N} flip-flops`],
      };
    } });

  // ======================= 16 COMPUTER SYSTEMS =======================
  const kb = (x) => (x >= 2 ** 20 ? x / 2 ** 20 + 'M' : x >= 1024 ? x / 1024 + 'K' : String(x));
  T({ id: 'cs-mem', set: '16.2', title: 'Memory organization', hb: HB(EC, 'memory'),
    gen(r) {
      const kW = r.int(12, 22), W = 2 ** kW, wb = r.pick([8, 16, 32]), km = r.int(10, kW - 1), m = 2 ** km, cb = r.pick([1, 4, 8].filter((c) => c <= wb));
      const tgt = r.pick(['chips', 'addr']);
      const chips = (W / m) * (wb / cb);
      if (tgt === 'chips') return {
        params: { W, wb, m, cb, tgt },
        q: `A ${kb(W)} × ${wb} memory is built from ${kb(m)} × ${cb} chips. How many chips are needed?`,
        ans: chips, fmt: big, noFill: true,
        distract: [{ v: W / m, why: 'Expanded depth only — forgot width.' }, { v: wb / cb, why: 'Expanded width only — forgot depth.' }, { v: (W * wb) / m, why: 'Mixed bits and words.' }, { v: chips * 2, why: 'Doubled it.' }],
        setup: 'Chips = (words needed / words per chip) × (bits needed / bits per chip)',
        steps: [`(${kb(W)}/${kb(m)}) × (${wb}/${cb}) = ${W / m} × ${wb / cb} = ${chips}`] };
      return {
        params: { W, wb, tgt },
        q: `A word-addressable memory holds ${kb(W)} words of ${wb} bits. How many address lines does it need?`,
        ans: kW, fmt: (v) => String(v), noFill: true,
        distract: [{ v: kW + Math.log2(wb), why: 'Counted bits instead of words.' }, { v: kW + 1, why: 'One too many.' }, { v: kW - 1, why: 'One too few.' }, { v: wb, why: 'That’s the data width.' }],
        setup: 'Address lines = log₂(number of words)', steps: [`log₂ ${W} = ${kW}`] };
    } });

  T({ id: 'cs-cache', set: '16.2', title: 'Cache address fields', hb: HB(EC, 'cache'),
    gen(r) {
      const A = r.pick([16, 24, 32]), Cs = 2 ** r.int(10, 16), B = 2 ** r.int(2, 6), k = r.pick([1, 2, 4]);
      const off = Math.log2(B), sets = Cs / (B * k);
      if (sets < 4) return null;
      const idx = Math.log2(sets), tag = A - idx - off, tgt = r.pick(['tag', 'index']);
      const way = k === 1 ? 'direct-mapped' : `${k}-way set-associative`;
      const qs = `A ${way} cache holds ${kb(Cs)} bytes in ${B}-byte blocks. Addresses are ${A}-bit byte addresses.`;
      const base = { params: { A, Cs, B, k, tgt }, setup: 'offset = log₂(block size); sets = size/(block × ways); index = log₂(sets); tag = rest',
        steps: [`offset = ${off} bits`, `sets = ${Cs}/(${B}×${k}) = ${sets} → index = ${idx} bits`, `tag = ${A} − ${idx} − ${off} = ${tag} bits`] };
      if (tgt === 'tag') return { ...base, q: qs + ' How many tag bits are there?', ans: tag, fmt: (v) => String(v), noFill: true,
        distract: [k > 1 ? { v: A - Math.log2(Cs / B) - off, why: 'Ignored associativity when counting sets.' } : null, { v: A - idx, why: 'Forgot the block offset.' }, { v: A - off, why: 'Forgot the index.' }, { v: tag + 1, why: 'Off by one.' }, { v: tag - 1, why: 'Off by one.' }] };
      return { ...base, q: qs + ' How many index bits are there?', ans: idx, fmt: (v) => String(v), noFill: true,
        distract: [k > 1 ? { v: Math.log2(Cs / B), why: 'Ignored associativity.' } : null, { v: Math.log2(Cs), why: 'Used total bytes, not sets.' }, { v: off, why: 'That’s the offset.' }, { v: idx + 1, why: 'Off by one.' }, { v: idx - 1, why: 'Off by one.' }] };
    } });

  T({ id: 'cs-cpi', set: '16.1', title: 'Average CPI and CPU time', hb: HB(EC, 'CPI'), tol: { rel: 1e-9 },
    gen(r) {
      const mix = r.pick([[0.5, 0.3, 0.2], [0.4, 0.4, 0.2], [0.6, 0.25, 0.15], [0.45, 0.35, 0.2]]);
      const cpi = [1, r.int(2, 3), r.int(3, 6)], f = r.pick([1, 1.5, 2, 2.5, 3]) * 1e9, IC = r.pick([1, 2, 5, 10]) * 1e9;
      const avg = mix.reduce((a, p, i) => a + p * cpi[i], 0), t = (IC * avg) / f;
      const tgt = r.pick(['cpi', 'time']);
      const qs = `A program runs ${IC / 1e9} × 10⁹ instructions: ${mix[0] * 100}% ALU (CPI ${cpi[0]}), ${mix[1] * 100}% load/store (CPI ${cpi[1]}), ${mix[2] * 100}% branch (CPI ${cpi[2]}). The clock is ${eng(f, 'Hz')}.`;
      const base = { params: { mix, cpi, f, IC, tgt }, setup: 'CPI_avg = Σ fᵢ·CPIᵢ;  time = IC × CPI_avg / f',
        steps: [`CPI_avg = ${mix.map((p, i) => `${p}×${cpi[i]}`).join(' + ')} = ${sig(avg, 4)}`, `time = ${eng(t, 's', 4)}`] };
      if (tgt === 'cpi') return { ...base, q: qs + ' Find the average CPI.', ans: avg, fmt: (v) => sig(v, 3),
        distract: [{ v: (cpi[0] + cpi[1] + cpi[2]) / 3, why: 'Unweighted average.' }, { v: Math.max(...cpi), why: 'Used the worst case.' }, { v: mix.reduce((a, p, i) => a + p / cpi[i], 0), why: 'Divided by CPI instead of multiplying.' }] };
      return { ...base, q: qs + ' Find the CPU time.', ans: t, fmt: (v) => eng(v, 's'),
        distract: [{ v: IC / f, why: 'Assumed CPI = 1.' }, { v: (IC * avg * f) / 1e18, why: 'Multiplied by the clock rate.' }, { v: (IC * ((cpi[0] + cpi[1] + cpi[2]) / 3)) / f, why: 'Used the unweighted CPI.' }] };
    } });

  T({ id: 'cs-amat', set: '16.2', title: 'Average memory access time', hb: HB(EC, 'cache'), tol: { rel: 1e-9 },
    gen(r) {
      const th = r.pick([1, 2, 3, 5]), mr = r.pick([0.01, 0.02, 0.03, 0.05, 0.08, 0.1]), P = r.pick([20, 50, 80, 100, 150, 200]);
      const amat = th + mr * P;
      return {
        params: { th, mr, P },
        q: `A cache has a ${th} ns hit time, ${mr * 100}% miss rate, and ${P} ns miss penalty. Find the average memory access time.`,
        ans: amat * 1e-9, fmt: (v) => eng(v, 's'),
        distract: [
          { v: mr * P * 1e-9, why: 'Forgot the hit time.' },
          { v: (th + (1 - mr) * P) * 1e-9, why: 'Weighted the penalty by the hit rate.' },
          { v: ((1 - mr) * th + mr * P) * 1e-9, why: 'Assumed hit time isn’t paid on a miss.' },
        ],
        setup: 'AMAT = hit time + miss rate × miss penalty',
        steps: [`${th} + ${mr} × ${P} = ${sig(amat, 4)} ns`],
      };
    } });

  // ======================= 17 SOFTWARE =======================
  const LOOPS = {
    sq: { code: 'for i = 1 to n\n  for j = 1 to n\n    count = count + 1', f: (n) => n * n, O: 'O(n²)' },
    tri: { code: 'for i = 1 to n\n  for j = i to n\n    count = count + 1', f: (n) => (n * (n + 1)) / 2, O: 'O(n²)' },
    tri2: { code: 'for i = 1 to n\n  for j = 1 to i − 1\n    count = count + 1', f: (n) => (n * (n - 1)) / 2, O: 'O(n²)' },
    dbl: { code: 'i = 1\nwhile i < n\n  i = 2 * i\n  count = count + 1', f: (n) => Math.ceil(Math.log2(n)), O: 'O(log n)' },
    ndbl: { code: 'for i = 1 to n\n  j = 1\n  while j < n\n    j = 2 * j\n    count = count + 1', f: (n) => n * Math.ceil(Math.log2(n)), O: 'O(n log n)' },
    lin10: { code: 'for i = 1 to n\n  for j = 1 to 10\n    count = count + 1', f: (n) => 10 * n, O: 'O(n)' },
    cube: { code: 'for i = 1 to n\n  for j = 1 to n\n    for k = 1 to n\n      count = count + 1', f: (n) => n ** 3, O: 'O(n³)' },
    half: { code: 'for i = 1 to n step 2\n  for j = 1 to n\n    count = count + 1', f: (n) => Math.ceil(n / 2) * n, O: 'O(n²)' },
  };
  const codeHTML = (s) => `<pre class="code">${s}</pre>`;
  T({ id: 'sw-count', set: '17.1', title: 'Count loop iterations', hb: HB(EC, 'algorithm'),
    gen(r) {
      const keys = ['sq', 'tri', 'tri2', 'dbl', 'ndbl', 'half'], key = r.pick(keys), n = r.pick([5, 6, 7, 8, 10, 12, 16, 20]);
      const L = LOOPS[key], ans = L.f(n);
      return {
        params: { key, n },
        q: `count starts at 0. After this runs with n = ${n}, what is count?${codeHTML(L.code)}`,
        ans, fmt: big, noFill: true,
        distract: keys.filter((k2) => k2 !== key).map((k2) => ({ v: LOOPS[k2].f(n), why: 'That’s the count for a different loop pattern — trace the bounds carefully.' })).concat([{ v: ans + n, why: 'Off by one on the outer loop.' }]),
        setup: 'Write the inner count for each i, then sum',
        steps: [`count = ${big(ans)}`],
      };
    } });

  T({ id: 'sw-bigo', set: '17.1', title: 'Time complexity', hb: HB(EC, 'Big-O'),
    gen(r) {
      const key = r.pick(Object.keys(LOOPS)), L = LOOPS[key];
      const all = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)'];
      return {
        type: 'text', params: { key },
        q: `What is the time complexity of this code as n grows?${codeHTML(L.code)}`,
        ans: L.O, distract: r.shuffle(all.filter((o) => o !== L.O)).map((o) => ({ v: o, why: 'Count how the work grows: how many times does the innermost line run?' })),
        setup: 'Multiply nested loop counts; a doubling loop runs log n times',
        steps: [`${L.O}`],
      };
    } });

  T({ id: 'sw-bsearch', set: '17.2', title: 'Binary search worst case', hb: HB(EC, 'binary search'),
    gen(r) {
      const n = r.pick([7, 15, 16, 31, 50, 64, 100, 128, 255, 500, 1000, 1024, 2000]);
      const w = Math.floor(Math.log2(n)) + 1;
      return {
        params: { n },
        q: `Binary search runs on a sorted array of ${n} elements. In the worst case, how many elements are compared against the key?`,
        ans: w, fmt: (v) => String(v), noFill: true,
        distract: [{ v: Math.ceil(n / 2), why: 'That’s the average for linear search.' }, { v: n, why: 'That’s linear search worst case.' }, { v: w - 1, why: 'One too few.' }, { v: w + 1, why: 'One too many.' }],
        setup: 'Worst case = ⌊log₂ n⌋ + 1',
        steps: [`⌊log₂ ${n}⌋ + 1 = ${w}`],
      };
    } });

  T({ id: 'sw-bubble', set: '17.2', title: 'Bubble sort swaps', hb: HB(EC, 'sorting'),
    gen(r) {
      const a = r.shuffle([...Array(30).keys()].map((x) => x + 1)).slice(0, 6);
      let inv = 0;
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (a[i] > a[j]) inv++;
      if (inv < 3 || inv > 13) return null;
      return {
        params: { a },
        q: `Bubble sort puts [${a.join(', ')}] in ascending order. How many swaps does it make?`,
        ans: inv, fmt: (v) => String(v), noFill: true,
        distract: [{ v: 15, why: 'That’s the worst case for 6 elements.' }, { v: inv - 1, why: 'Missed one.' }, { v: inv + 1, why: 'One too many.' }, { v: 5, why: 'That’s the number of passes, not swaps.' }],
        setup: 'Each swap removes exactly one inversion (pair out of order)',
        steps: [`Inversions in [${a.join(', ')}] = ${inv}`],
      };
    } });

  T({ id: 'sw-stack', set: '17.3', title: 'Stack and queue operations', hb: HB(EC, 'stack'),
    gen(r) {
      const kind = r.pick(['stack', 'queue']), ops = [], vals = r.shuffle([...Array(20).keys()].map((x) => x + 1));
      let vi = 0, size = 0;
      const add = kind === 'stack' ? 'push' : 'enqueue', rem = kind === 'stack' ? 'pop' : 'dequeue';
      for (let i = 0; i < 9; i++) {
        if (size === 0 || (r.f() < 0.6 && i < 7)) { ops.push([add, vals[vi++]]); size++; } else { ops.push([rem]); size--; }
      }
      if (ops[ops.length - 1][0] !== rem) { if (size === 0) return null; ops.push([rem]); }
      const sim = (lifo) => { const s = []; let last = null; for (const o of ops) { if (o.length === 2) s.push(o[1]); else last = lifo ? s.pop() : s.shift(); } return last; };
      const ans = sim(kind === 'stack');
      return {
        params: { kind, ops },
        q: `Starting from an empty ${kind}: ${ops.map((o) => (o.length === 2 ? `${o[0]}(${o[1]})` : `${o[0]}()`)).join(', ')}. What value does the final ${rem}() return?`,
        ans, fmt: (v) => String(v), noFill: true,
        distract: [{ v: sim(kind !== 'stack'), why: kind === 'stack' ? 'That’s FIFO (queue) behavior.' : 'That’s LIFO (stack) behavior.' }, { v: ops[0][1], why: 'That’s the first value added.' }, { v: ops.filter((o) => o.length === 2).slice(-1)[0][1], why: 'That’s the last value added.' }, { v: ans + 1, why: 'Not in the sequence.' }],
        setup: kind === 'stack' ? 'Stack = last in, first out' : 'Queue = first in, first out',
        steps: [`Trace → ${ans}`],
      };
    } });

  T({ id: 'sw-bst', set: '17.4', title: 'BST traversal', hb: HB(EC, 'binary tree'),
    gen(r) {
      const keys = r.shuffle([...Array(60).keys()].map((x) => x + 10)).slice(0, 7);
      const root = { k: keys[0] };
      for (const x of keys.slice(1)) { let n = root; for (;;) { const s = x < n.k ? 'l' : 'r'; if (!n[s]) { n[s] = { k: x }; break; } n = n[s]; } }
      const pre = (n) => (n ? [n.k, ...pre(n.l), ...pre(n.r)] : []), post = (n) => (n ? [...post(n.l), ...post(n.r), n.k] : []), ino = (n) => (n ? [...ino(n.l), n.k, ...ino(n.r)] : []);
      const tgt = r.pick(['preorder', 'postorder']), f = { preorder: pre, postorder: post };
      const s = (a) => a.join(', ');
      return {
        type: 'text', params: { keys, tgt },
        q: `Insert ${s(keys)} (in that order) into an empty binary search tree. What is the ${tgt} traversal?`,
        ans: s(f[tgt](root)),
        distract: [
          { v: s(f[tgt === 'preorder' ? 'postorder' : 'preorder'](root)), why: `That’s ${tgt === 'preorder' ? 'postorder' : 'preorder'}.` },
          { v: s(ino(root)), why: 'That’s inorder (sorted).' },
          { v: s(keys), why: 'That’s just the insertion order.' },
          { v: s(f[tgt](root).slice().reverse()), why: 'Reversed.' },
        ],
        setup: tgt === 'preorder' ? 'Preorder: node, left subtree, right subtree' : 'Postorder: left subtree, right subtree, node',
        steps: [`${tgt}: ${s(f[tgt](root))}`],
      };
    } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
