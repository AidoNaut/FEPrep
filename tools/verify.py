#!/usr/bin/env python3
"""FE Prep — independent auto-verifier.

Reads variants exported from the app's own generator code (tools/export-variants.js) and
re-derives every answer with separate tools: lcapy (symbolic circuit solver), SciPy
(ODE integration, signal simulation, root finding, quadrature), SymPy, numpy-financial,
Python's ipaddress module, and direct simulation (FFT, loop execution, counters).

For each variant it checks:
  1. the marked answer matches the independent result (within the template's tolerance)
  2. every distractor is clearly different from the independent result
  3. all four labels are distinct, and numeric labels agree with their values

This is code written by the same assistant that wrote the problems, run through
independent solvers. It catches arithmetic and formula bugs, but it is NOT a substitute
for the user's own hand verification — which is why the app still requires that.

Usage: python3 tools/verify.py variants.jsonl js/verify-report.js
"""
import cmath, itertools, json, math, re, statistics, sys, time, ipaddress
from collections import defaultdict, deque

import numpy as np
import numpy_financial as npf
import scipy
import sympy
from scipy import constants as K, integrate, optimize, signal, stats
import lcapy
from lcapy import Circuit, R as LR, L as LL, C as LC, j as Lj

SQ2 = math.sqrt(2)
PI = math.pi
METHOD = {}
EXPECT = {}


def reg(tid, method):
    def deco(fn):
        EXPECT[tid] = fn
        METHOD[tid] = method
        return fn
    return deco


def lc_num(x):
    try:
        x = x.dc
    except Exception:
        pass
    e = getattr(x, 'expr', x)
    return complex(sympy.N(e))


def ckt(text):
    return Circuit(text.strip())


# ===================================================== 1 MATH
@reg('m-quad', 'numpy.roots')
def _(p):
    return max(np.roots([p['a'], p['b'], p['c']]).real)


@reg('m-cosines', 'coordinate geometry (distance between placed points)')
def _(p):
    a, b, Cd = p['a'], p['b'], p['Cd']
    P = np.array([a, 0.0]); Q = np.array([b * math.cos(math.radians(Cd)), b * math.sin(math.radians(Cd))])
    return float(np.linalg.norm(P - Q))


@reg('m-cmul', 'Python complex arithmetic (cmath)')
def _(p):
    return complex(p['a'], p['b']) * cmath.rect(p['m2'], math.radians(p['t2']))


@reg('m-cdiv', 'Python complex arithmetic')
def _(p):
    return complex(*p['z1']) / complex(*p['z2'])


@reg('m-geo', 'brute-force summation')
def _(p):
    return sum(p['a'] * p['q'] ** i for i in range(p['n']))


@reg('m-ptline', 'vector cross-product distance using two points on the line')
def _(p):
    A, B, C, x0, y0 = p['A'], p['B'], p['C'], p['x0'], p['y0']
    p1 = np.array([0.0, -C / B]); p2 = np.array([1.0, (-C - A) / B])
    d = p2 - p1; w = np.array([x0, y0]) - p1
    return abs(d[0] * w[1] - d[1] * w[0]) / np.linalg.norm(d)


@reg('m-deriv', 'SymPy symbolic differentiation')
def _(p):
    x = sympy.symbols('x')
    f = p['a'] * x ** 3 + p['b'] * sympy.sin(sympy.nsimplify(p['c']) * x)
    return float(sympy.diff(f, x).subs(x, sympy.nsimplify(p['x0'])))


@reg('m-integral', 'SciPy adaptive quadrature')
def _(p):
    return integrate.quad(lambda x: p['a'] * x * x + p['b'] * x + p['c'], p['p'], p['q'], epsabs=1e-13, epsrel=1e-13)[0]


@reg('m-ode1', 'SciPy ODE integration (solve_ivp)')
def _(p):
    sol = integrate.solve_ivp(lambda t, y: p['u'] - p['k'] * y, [0, p['t1']], [p['y0']], rtol=1e-12, atol=1e-12)
    return float(sol.y[0, -1])


@reg('m-det3', 'numpy.linalg.det')
def _(p):
    return round(float(np.linalg.det(np.array(p['M'], float))))


@reg('m-sys3', 'numpy.linalg.solve')
def _(p):
    return round(float(np.linalg.solve(np.array(p['A'], float), np.array(p['B'], float))[1]), 9)


@reg('m-vecang', 'atan2(|A×B|, A·B) — a different formula from the app')
def _(p):
    A, B = np.array(p['A'], float), np.array(p['B'], float)
    return math.degrees(math.atan2(np.linalg.norm(np.cross(A, B)), A @ B))


# ===================================================== 2 PROB/STATS
@reg('p-stdev', 'Python statistics.stdev')
def _(p):
    return statistics.stdev(p['xs'])


@reg('p-count', 'itertools enumeration (counts every arrangement)')
def _(p):
    n, k = p['n'], p['k']
    it = itertools.combinations if p['kind'] == 'comb' else itertools.permutations
    return sum(1 for _ in it(range(n), k))


@reg('p-atleast', 'enumeration of all 2ⁿ outcomes')
def _(p):
    n, q = p['n'], p['p']
    tot = 0.0
    for outcome in itertools.product([0, 1], repeat=n):
        if any(outcome):
            tot += math.prod(q if o else 1 - q for o in outcome)
    return tot


@reg('p-binom', 'scipy.stats.binom.pmf')
def _(p):
    return float(stats.binom.pmf(p['k'], p['n'], p['p']))


@reg('p-normal', 'scipy.stats.norm (exact CDF)')
def _(p):
    c = stats.norm.cdf(p['x'], p['mu'], p['s'])
    return float(c if p['dir'] == '<' else 1 - c)


@reg('p-ev', 'numpy dot product')
def _(p):
    return float(np.dot(p['ps'], p['xs']))


# ===================================================== 4 ECON
@reg('e-fp', 'numpy_financial.fv')
def _(p):
    return float(npf.fv(p['i'] / 100, p['n'], 0, -p['P']))


@reg('e-pa', 'numpy_financial.pv')
def _(p):
    return float(npf.pv(p['i'] / 100, p['n'], -p['A']))


@reg('e-ap', 'numpy_financial.pmt')
def _(p):
    return float(npf.pmt(p['i'] / 100, p['n'], -p['P']))


@reg('e-breakeven', 'SymPy solve of revenue = cost')
def _(p):
    Q = sympy.symbols('Q')
    return float(sympy.solve(sympy.Eq(p['p'] * Q, p['F'] + p['v'] * Q), Q)[0])


@reg('e-risk', 'expected-cost comparison of both alternatives')
def _(p):
    no_upgrade = p['p1'] * p['L']
    upgrade = p['p2'] * p['L'] + p['X']
    return no_upgrade - upgrade


# ===================================================== 5 MATERIALS
@reg('mat-wire', 'conductance G = σA/L with σ = 1/ρ (alternate route)')
def _(p):
    A = math.pi * (p['d'] * 1e-3) ** 2 / 4
    G = (1 / p['rho']) * A / p['L']
    return 1 / G


@reg('mat-tempco', 'recompute (linear model is a definition)')
def _(p):
    return p['R0'] + p['R0'] * p['a'] * (p['T'] - 20)


@reg('mat-cap', 'recompute with SI conversions done separately')
def _(p):
    return p['er'] * 8.854e-12 * (p['Acm'] / 1e4) / (p['dmm'] / 1e3)


@reg('mat-expand', 'numeric integration of α·L over temperature')
def _(p):
    return integrate.quad(lambda T: p['a'] * p['L'], 20, 20 + p['dT'])[0]


@reg('mat-cond', 'thermal-resistance route: q = ΔT / (L/kA)')
def _(p):
    return p['dT'] / (p['t'] / (p['k'] * p['A']))


# ===================================================== 6 CIRCUITS (lcapy)
@reg('c-req', 'lcapy: 1 V test source, measured current')
def _(p):
    c = ckt(f"""
Vt 1 0 1
R1 1 2 {p['R1']}
R2 2 0 {p['R2']}
R3 2 3 {p['R3']}
R4 3 0 {p['R4']}
""")
    return (1 / lc_num(c.R1.I)).real


@reg('c-div', 'lcapy nodal solve')
def _(p):
    c = ckt(f"""
Vs 1 0 {p['Vs']}
R1 1 2 {p['R1']}
R2 2 0 {p['R2']}
R3 2 0 {p['R3']}
""")
    return lc_num(c[2].V).real


@reg('c-node', 'lcapy nodal solve')
def _(p):
    c = ckt(f"""
V1 1 0 {p['V1']}
R1 1 a {p['R1']}
V2 2 0 {p['V2']}
R2 2 a {p['R2']}
R3 a 0 {p['R3']}
""")
    return lc_num(c['a'].V).real


@reg('c-kvl', 'lcapy loop solve')
def _(p):
    c = ckt(f"""
V1 1 0 {p['V1']}
R1 1 2 {p['R1']}
V2 2 3 {p['V2']}
R2 3 0 {p['R2']}
""")
    return lc_num(c.R1.I).real


def thev(p):
    c = ckt(f"""
Vs 1 0 {p['Vs']}
R1 1 x {p['R1']}
R2 x 0 {p['R2']}
R3 x a {p['R3']}
""")
    th = c.thevenin('a', 0)
    return lc_num(th.Voc).real, lc_num(th.Z).real, lc_num(c.norton('a', 0).Isc).real


@reg('c-thev', 'lcapy Thevenin reduction')
def _(p):
    V, Z, _ = thev(p)
    return {'Vth': V, 'Rth': Z, 'Pmax': V * V / (4 * Z)}[p['tgt']]


@reg('c-norton', 'lcapy Norton reduction')
def _(p):
    return thev(p)[2]


@reg('c-rms', 'numeric RMS over one sampled period')
def _(p):
    t = np.linspace(0, 1, 400000, endpoint=False)
    v = p['Vdc'] + p['Vm'] * np.sin(2 * PI * t)
    return float(np.sqrt(np.mean(v * v)))


@reg('c-pulse', 'numeric average/RMS over one sampled period')
def _(p):
    N = 1000000
    v = np.zeros(N); v[: int(round(p['D'] * N))] = p['A']
    return float(np.mean(v)) if p['tgt'] == 'avg' else float(np.sqrt(np.mean(v * v)))


@reg('c-phasor', 'time-domain sampling of the actual sum (peak value)')
def _(p):
    t = np.linspace(0, 2 * PI, 2000000, endpoint=False)
    v = p['A1'] * np.cos(t + math.radians(p['t1']))
    v = v + p['A2'] * (np.sin if p['useSin'] else np.cos)(t + math.radians(p['t2']))
    return float(np.max(np.abs(v)))


@reg('c-zrlc', 'lcapy network impedance at s = jω')
def _(p):
    w = 2 * sympy.pi * sympy.nsimplify(p['f'])
    n = LR(sympy.nsimplify(p['R'])) + LL(sympy.nsimplify(p['L'])) + LC(sympy.nsimplify(p['C']))
    return abs(lc_num(n.Z(Lj * w)))


@reg('c-parrc', 'lcapy network admittance at s = jω')
def _(p):
    w = 2 * sympy.pi * sympy.nsimplify(p['f'])
    n = LR(sympy.nsimplify(p['R'])) | LC(sympy.nsimplify(p['C']))
    return p['V'] * abs(lc_num(n.Y(Lj * w)))


# ===================================================== 7 LINEAR SYSTEMS
@reg('l-rc', 'SciPy ODE integration of the RC circuit')
def _(p):
    tau = p['R'] * p['C']
    sol = integrate.solve_ivp(lambda t, v: (p['Vs'] - v) / tau, [0, p['t1']], [p['V0']], rtol=1e-12, atol=1e-14)
    return float(sol.y[0, -1])


@reg('l-rl', 'SciPy ODE integration of the RL circuit')
def _(p):
    sol = integrate.solve_ivp(lambda t, i: (p['V'] - i * p['R']) / p['L'], [0, p['t1']], [0.0], rtol=1e-12, atol=1e-15)
    return float(sol.y[0, -1])


@reg('l-res', 'numeric root-finding on |Z(f)| (no resonance formulas)')
def _(p):
    R, L, C = p['R'], p['L'], p['C']
    X = lambda f: 2 * PI * f * L - 1 / (2 * PI * f * C)
    Z = lambda f: math.hypot(R, X(f))
    f0 = optimize.brentq(X, 1e-3, 1e12, xtol=1e-12, rtol=1e-14)
    g = lambda f: Z(f) - SQ2 * R
    fl = optimize.brentq(g, 1e-6, f0, xtol=1e-14, rtol=1e-14)
    fh = optimize.brentq(g, f0, 1e13, xtol=1e-14, rtol=1e-14)
    BW = fh - fl
    return {'f0': f0, 'Q': f0 / BW, 'BW': BW}[p['tgt']]


def poles_tend(den):
    r = np.roots(den)
    sig = min(abs(x.real) for x in r)
    return 40 / sig


@reg('l-final', 'scipy.signal step-response simulation (long run)')
def _(p):
    num, den = [p['K'], p['K'] * p['z']], [1, p['a'], p['b']]
    T = np.linspace(0, poles_tend(den), 20000)
    _, y = signal.step(signal.lti(num, den), T=T)
    return float(y[-1])


@reg('l-ilt', 'scipy.signal impulse-response simulation')
def _(p):
    den = np.polymul([1, p['p1']], [1, p['p2']])
    T = np.linspace(0, p['t'], 4001)
    _, y = signal.impulse(signal.lti([p['A']], den), T=T)
    return float(y[-1])


@reg('l-lpdb', 'scipy.signal.freqs')
def _(p):
    w = 2 * PI * p['f']
    _, h = signal.freqs([1], [p['R'] * p['C'], 1], worN=[w])
    return 20 * math.log10(abs(h[0]))


# ===================================================== 8 SIGNALS
@reg('s-alias', 'FFT of the actual sampled sequence (peak bin)')
def _(p):
    fs, f0 = int(p['fs']), int(p['f0'])
    n = np.arange(fs)
    X = np.abs(np.fft.rfft(np.cos(2 * PI * f0 * n / fs)))
    return float(np.argmax(X))


@reg('s-rcfc', 'root-finding on scipy.signal.freqs magnitude')
def _(p):
    C = p['C']
    if p['tgt'] == 'fc':
        RC = p['R'] * C
        mag = lambda f: abs(signal.freqs([1], [RC, 1], worN=[2 * PI * f])[1][0]) - 1 / SQ2
        return optimize.brentq(mag, 1e-3, 1e12, xtol=1e-12, rtol=1e-14)
    fc = p['fc']
    mag = lambda R: abs(signal.freqs([1], [R * C, 1], worN=[2 * PI * fc])[1][0]) - 1 / SQ2
    return optimize.brentq(mag, 1e-3, 1e12, xtol=1e-12, rtol=1e-14)


@reg('s-diffeq', 'scipy.signal.lfilter')
def _(p):
    y = signal.lfilter([p['b']], [1, -p['a']], np.ones(p['k'] + 1))
    return float(y[p['k']])


@reg('s-dconv', 'numpy.convolve')
def _(p):
    y = np.convolve(p['x'], p['h'])
    n = p['n']
    return float(y[n]) if n < len(y) else 0.0


@reg('s-cconv', 'SciPy quadrature of x(τ)·h(t₀ − τ)')
def _(p):
    A, B, T1, T2, t0 = p['A'], p['B'], p['T1'], p['T2'], p['t0']
    x = lambda t: A if 0 <= t <= T1 else 0.0
    h = lambda t: B if 0 <= t <= T2 else 0.0
    pts = sorted({0.0, T1, max(0.0, t0 - T2), t0})
    return integrate.quad(lambda tau: x(tau) * h(t0 - tau), -1, t0 + 1, points=pts, limit=200)[0]


# ===================================================== 9 ELECTRONICS
@reg('el-semi', 'σ = q·N_D·μₙ with CODATA q (scipy.constants)')
def _(p):
    return 1 / (K.e * p['ND'] * p['mn'])


@reg('el-diode', 'lcapy (diodes as fixed 0.7 V drops)')
def _(p):
    lines = [f"Vs 1 0 {p['Vs']}", "D1 1 2 0.7"]
    node = 2
    if p['n'] == 2:
        lines.append("D2 2 3 0.7"); node = 3
    lines.append(f"R1 {node} 0 {p['R']}")
    c = ckt('\n'.join(l.replace('D', 'VD', 1) if l.startswith('D') else l for l in lines))
    return lc_num(c.R1.I).real


@reg('el-bjt', 'lcapy with a β-controlled current source (CCCS) BJT model')
def _(p):
    c = ckt(f"""
VCC c0 0 {p['VCC']}
R1 c0 b {p['R1']}
R2 b 0 {p['R2']}
VBE b e 0.7
RE e 0 {p['RE']}
RC c0 c {p['RC']}
F1 c e VBE {p['beta']}
""")
    IC = lc_num(c.RC.I).real
    VCE = (lc_num(c['c'].V) - lc_num(c['e'].V)).real
    return IC if p['tgt'] == 'IC' else VCE


@reg('el-sum', 'lcapy op-amp model (open-loop gain 10⁹)')
def _(p):
    c = ckt(f"""
V1 1 0 {p['V1']}
V2 2 0 {p['V2']}
R1 1 n {p['R1']}
R2 2 n {p['R2']}
Rf n o {p['Rf']}
E1 o 0 opamp 0 n 1e9
""")
    return lc_num(c['o'].V).real


@reg('el-noninv', 'lcapy op-amp model (open-loop gain 10⁹)')
def _(p):
    c = ckt(f"""
Vi i 0 {p['Vin']}
R1 n 0 {p['R1']}
Rf o n {p['Rf']}
E1 o 0 opamp i n 1e9
""")
    return lc_num(c['o'].V).real


@reg('el-rect', 'numeric average of the rectified sampled waveform')
def _(p):
    t = np.linspace(0, 1, 1000000, endpoint=False)
    v = p['Vr'] * SQ2 * np.sin(2 * PI * t)
    out = np.abs(v) if p['full'] else np.maximum(v, 0)
    return float(np.mean(out))


@reg('el-dcdc', 'SymPy solve of inductor volt-second balance')
def _(p):
    Vo = sympy.symbols('Vo', positive=True)
    D, Vin = sympy.nsimplify(p['D']), p['Vin']
    eq = {'buck': D * (Vin - Vo) + (1 - D) * (-Vo),
          'boost': D * Vin + (1 - D) * (Vin - Vo),
          'buck-boost': D * Vin - (1 - D) * Vo}[p['kind']]
    return float(sympy.solve(sympy.Eq(eq, 0), Vo)[0])


@reg('el-bridge', 'lcapy bridge solve')
def _(p):
    R, dR = p['R'], p['dR']
    c = ckt(f"""
Vx 1 0 {p['Vex']}
Ra 1 2 {R}
Rb 2 0 {R}
Rc 1 3 {R}
Rs 3 0 {sympy.nsimplify(R + dR)}
""")
    return (lc_num(c[3].V) - lc_num(c[2].V)).real


# ===================================================== 10 POWER
@reg('pw-1ph', 'complex power S = V·I* with numpy complex')
def _(p):
    V = complex(p['V']); Z = complex(p['R'], p['X']); I = V / Z
    S = V * I.conjugate()
    return S.real if p['tgt'] == 'P' else abs(S)


@reg('pw-pfc', 'power-triangle via Pythagoras (Q = √(S² − P²))')
def _(p):
    P = p['P']
    Q = lambda pf: math.sqrt((P / pf) ** 2 - P ** 2)
    return Q(p['pf1']) - Q(p['pf2'])


@reg('pw-3ph', 'per-phase wye equivalent')
def _(p):
    Vph = p['VLL'] / math.sqrt(3)
    return (p['S'] * 1000 / 3) / Vph


@reg('pw-delta', 'per-phase complex power, summed over 3 phases')
def _(p):
    Z = complex(p['R'], p['X']); V = complex(p['VLL']); I = V / Z
    return 3 * (V * I.conjugate()).real


@reg('pw-vreg', 'phasor construction with cmath')
def _(p):
    I = cmath.rect(p['I'], -math.acos(p['pf']))
    VS = p['VR'] + I * complex(p['R'], p['X'])
    return (abs(VS) - p['VR']) / p['VR'] * 100


@reg('pw-xfmr', 'power balance P₁ = P₂ for an ideal transformer')
def _(p):
    V2 = p['V1'] / p['a']; P2 = V2 ** 2 / p['ZL']
    I1 = P2 / p['V1']
    return p['V1'] / I1 if p['tgt'] == 'Zr' else I1


@reg('pw-ind', 'recompute from pole pairs (rev/s → rpm)')
def _(p):
    ns = p['f'] / (p['P'] / 2) * 60
    return ns - ns * p['s']


@reg('pw-dcm', 'recompute (back-EMF proportional to speed)')
def _(p):
    E1 = p['V'] - p['I1'] * p['Ra']; E2 = p['V'] - p['I2'] * p['Ra']
    k = E1 / p['n1']
    return E2 / k


# ===================================================== 11 EM
@reg('em-coul', '3-D vector Coulomb force with CODATA ε₀')
def _(p):
    r = np.array([0.6, 0.0, 0.8]) * p['rc'] / 100
    F = p['q1'] * 1e-6 * p['q2'] * 1e-6 / (4 * PI * K.epsilon_0 * np.linalg.norm(r) ** 3) * r
    return float(np.linalg.norm(F))


@reg('em-line', 'numeric integration of Coulomb field along an infinite line')
def _(p):
    lam, r = p['lam'] * 1e-9, p['rc'] / 100
    f = lambda z: lam * r / (4 * PI * K.epsilon_0 * (r * r + z * z) ** 1.5)
    return 2 * integrate.quad(f, 0, np.inf, epsabs=0, epsrel=1e-12)[0]


@reg('em-wire', 'numeric Biot–Savart integration')
def _(p):
    I, r = p['I'], p['rc'] / 100
    f = lambda z: K.mu_0 * I * r / (4 * PI * (r * r + z * z) ** 1.5)
    return 2 * integrate.quad(f, 0, np.inf, epsabs=0, epsrel=1e-12)[0]


@reg('em-force', 'Biot–Savart field of wire 1 × current of wire 2')
def _(p):
    d = p['dc'] / 100
    f = lambda z: K.mu_0 * p['I1'] * d / (4 * PI * (d * d + z * z) ** 1.5)
    B = 2 * integrate.quad(f, 0, np.inf, epsabs=0, epsrel=1e-12)[0]
    return B * p['I2']


@reg('em-lambda', 'λ = 2π/β with β = ω√εᵣ/c (phase-constant route)')
def _(p):
    # The problem states c = 3e8 m/s, so use that (not CODATA c) for the phase constant.
    beta = 2 * PI * p['f'] * math.sqrt(p['er']) / 3e8
    return 2 * PI / beta


@reg('em-tline', 'sampled standing-wave pattern along the line (max/min)')
def _(p):
    Z0, ZL = p['Z0'], complex(p['RL'], p['XL'])
    G = (ZL - Z0) / (ZL + Z0)
    bz = np.linspace(0, PI, 400001)
    V = np.abs(np.exp(1j * bz) + G * np.exp(-1j * bz))
    S = V.max() / V.min()
    return (S - 1) / (S + 1) if p['tgt'] == 'G' else S


# ===================================================== 12 CONTROLS
@reg('ct-ess', 'closed-loop step simulation (scipy.signal)')
def _(p):
    den = [1, p['a'] + p['K']]
    T = np.linspace(0, 60 / (p['a'] + p['K']), 20000)
    _, y = signal.step(signal.lti([p['K']], den), T=T)
    return 1 - float(y[-1])


@reg('ct-ramp', 'closed-loop ramp simulation (scipy.signal.lsim)')
def _(p):
    den = [1, p['a'], p['K']]
    T = np.linspace(0, poles_tend(den) * 1.5, 200000)
    _, y, _ = signal.lsim(signal.lti([p['K']], den), U=T, T=T)
    return float(T[-1] - y[-1])


@reg('ct-2nd', 'step simulation: measured peak and time of peak')
def _(p):
    b, c = p['b'], p['c']
    wn = math.sqrt(c)
    T = np.linspace(0, 8 * PI / wn, 800001)
    _, y = signal.step(signal.lti([c], [1, b, c]), T=T)
    i = int(np.argmax(y))
    return (y[i] - 1) * 100 if p['tgt'] == 'os' else float(T[i])


@reg('ct-bode', 'scipy.signal.freqs (exact magnitude)')
def _(p):
    _, h = signal.freqs([p['K']], [1 / p['p'], 1], worN=[p['w']])
    return 20 * math.log10(abs(h[0]))


@reg('ct-routh', 'bisection on K using numpy.roots (largest real part)')
def _(p):
    a, b = p['a'], p['b']
    stable = lambda Kk: max(np.roots([1, a, b, Kk]).real) < 0
    lo, hi = 1e-9, 1e5
    for _ in range(200):
        m = (lo + hi) / 2
        lo, hi = (m, hi) if stable(m) else (lo, m)
    return (lo + hi) / 2


# ===================================================== 13 COMMS
@reg('cm-am', 'synthesized AM waveform: time-average power and FFT carrier bin')
def _(p):
    Pc, mu = p['Pc'], p['mu']
    Ac = math.sqrt(2 * Pc)
    N = 2 ** 16
    t = np.arange(N) / N           # one modulating period, fm = 1
    s = Ac * (1 + mu * np.cos(2 * PI * t)) * np.cos(2 * PI * 64 * t)
    Pt = float(np.mean(s * s))
    X = np.fft.rfft(s) / N
    Pcar = 2 * abs(X[64]) ** 2
    return Pt if p['tgt'] == 'Pt' else Pt - Pcar


@reg('cm-fm', 'formula recompute + check that ~98% of FM power lies inside Carson bandwidth')
def _(p):
    df, fm = p['df'], p['fm']
    if p['tgt'] == 'beta':
        return df / fm
    B = 2 * (df + fm)
    beta = df / fm
    n = int(B / 2 // fm)
    frac = sum((1 if k == 0 else 2) * scipy.special.jv(k, beta) ** 2 for k in range(0, n + 1))
    if not (0.9 <= frac <= 1.0 + 1e-9):
        return float('nan')
    return B


@reg('cm-shannon', 'recompute (Shannon–Hartley is a definition)')
def _(p):
    return p['B'] * math.log(1 + 10 ** (p['dB'] / 10), 2)


@reg('cm-pcm', 'loop to find bits per sample, then rate')
def _(p):
    n = 0
    while 2 ** n < p['L']:
        n += 1
    return 2 * p['fmax'] * n


@reg('cm-tdm', 'frame bit count × frame rate')
def _(p):
    bits = sum(p['n'] for _ in range(p['N'])) + 1
    return bits * p['fs']


@reg('cm-square', 'FFT of a sampled ±A square wave')
def _(p):
    N = 2 ** 18
    t = np.arange(N) / N
    x = np.where(t < 0.5, p['A'], -p['A']).astype(float)
    X = np.fft.rfft(x)
    return float(2 * abs(X[p['n']]) / N)


# ===================================================== 14 NETWORKS
@reg('n-ipv4', 'Python ipaddress module')
def _(p):
    net = ipaddress.ip_interface(f"{p['addr']}/{p['p']}").network
    tgt = p['tgt']
    if tgt == 'net': return str(net.network_address)
    if tgt == 'bcast': return str(net.broadcast_address)
    if tgt == 'last': return str(net.broadcast_address - 1)
    return net.num_addresses - 2


@reg('n-mask', 'Python ipaddress module, scanning prefixes')
def _(p):
    for pre in range(30, 0, -1):
        net = ipaddress.ip_network(f'0.0.0.0/{pre}')
        if net.num_addresses - 2 >= p['H']:
            return f"{net.netmask} (/{pre})"


@reg('n-delay', 'recompute (bits/rate + distance/speed)')
def _(p):
    return p['L'] * 8 / p['R'] + p['d'] / 2e8


# ===================================================== 15 DIGITAL
@reg('d-base', 'Python int/format conversions')
def _(p):
    n, k = p['n'], p['kind']
    return {'d2h': format(n, 'X'), 'd2o': format(n, 'o'), 'd2b': format(n, 'b'), 'h2d': str(n)}[k]


@reg('d-twos', 'Python bit arithmetic')
def _(p):
    if p['kind'] == 'read':
        u = p['u']
        return str(u - (1 << 8) if u & 0x80 else u).replace('-', '−')
    return format(p['v'] & 0xFF, '08b')


LIT = re.compile(r"([ABCD])(′?)")


def sop_tt(expr):
    if expr.strip() == '1':
        return (1 << 16) - 1
    terms = [t.strip() for t in expr.split('+')]
    tt = 0
    for m in range(16):
        bits = {'A': (m >> 3) & 1, 'B': (m >> 2) & 1, 'C': (m >> 1) & 1, 'D': m & 1}
        for t in terms:
            ok = all(bits[v] == (0 if neg else 1) for v, neg in LIT.findall(t))
            if ok:
                tt |= 1 << m
                break
    return tt


def sop_cost(expr):
    terms = [t.strip() for t in expr.split('+')]
    return len(terms), sum(len(LIT.findall(t)) for t in terms)


@reg('d-sop', 'truth-table equivalence + minimality vs SymPy SOPform')
def _(p):
    return {'_sop': p['ons']}


GATE = {'AND': lambda a, b: a & b, 'OR': lambda a, b: a | b, 'NAND': lambda a, b: 1 - (a & b),
        'NOR': lambda a, b: 1 - (a | b), 'XOR': lambda a, b: a ^ b, 'XNOR': lambda a, b: 1 - (a ^ b)}


@reg('d-tt', 'own parser/evaluator of the printed expression')
def _(p):
    m = re.fullmatch(r"\((\w)(′?) (\w+) (\w)(′?)\) (\w+) (\w)(′?)", p['expr'])
    v1, n1, o1, v2, n2, o2, v3, n3 = m.groups()
    out = ''
    for A, B, Cc in itertools.product([0, 1], repeat=3):
        val = {'A': A, 'B': B, 'C': Cc}
        lit = lambda v, n: 1 - val[v] if n else val[v]
        out += str(GATE[o2](GATE[o1](lit(v1, n1), lit(v2, n2)), lit(v3, n3)))
    return out


@reg('d-ripple', 'clock-by-clock simulation of a ripple counter')
def _(p):
    n, k, f = p['n'], p['k'], p['f']
    q = [0] * n
    rises, clocks = 0, 2 ** (n + 3)
    for _ in range(clocks):
        i = 0
        while i < n:                     # toggle chain on falling edges
            q[i] ^= 1
            if q[i] == 1:
                if i == k: rises += 1
                break
            i += 1
    return rises / (clocks / f)


@reg('d-fmax', 'recompute (critical path)')
def _(p):
    return 1 / ((p['tcq'] + p['tl'] + p['tsu']) * 1e-9)


@reg('d-states', 'loop for binary encoding, count for one-hot')
def _(p):
    if p['enc'] == 'one-hot':
        return p['N']
    b = 0
    while 2 ** b < p['N']:
        b += 1
    return b


# ===================================================== 16 COMPUTER SYSTEMS
@reg('cs-mem', 'recompute by counting')
def _(p):
    if p['tgt'] == 'chips':
        return (p['W'] // p['m']) * (p['wb'] // p['cb'])
    return (p['W'] - 1).bit_length()


@reg('cs-cache', 'bit_length arithmetic on block/set counts')
def _(p):
    off = (p['B'] - 1).bit_length(); sets = p['Cs'] // (p['B'] * p['k'])
    idx = (sets - 1).bit_length()
    return p['A'] - idx - off if p['tgt'] == 'tag' else idx


@reg('cs-cpi', 'numpy weighted average')
def _(p):
    avg = float(np.dot(p['mix'], p['cpi']))
    return avg if p['tgt'] == 'cpi' else p['IC'] * avg / p['f']


@reg('cs-amat', 'recompute')
def _(p):
    return (p['th'] + p['mr'] * p['P']) * 1e-9


# ===================================================== 17 SOFTWARE
def run_loop(key, n):
    count = 0
    if key == 'sq':
        for i in range(1, n + 1):
            for j in range(1, n + 1): count += 1
    elif key == 'tri':
        for i in range(1, n + 1):
            for j in range(i, n + 1): count += 1
    elif key == 'tri2':
        for i in range(1, n + 1):
            for j in range(1, i): count += 1
    elif key == 'dbl':
        i = 1
        while i < n: i *= 2; count += 1
    elif key == 'ndbl':
        for i in range(1, n + 1):
            j = 1
            while j < n: j *= 2; count += 1
    elif key == 'lin10':
        for i in range(1, n + 1):
            for j in range(10): count += 1
    elif key == 'cube':
        for i in range(n):
            for j in range(n):
                for k in range(n): count += 1
    elif key == 'half':
        for i in range(1, n + 1, 2):
            for j in range(1, n + 1): count += 1
    return count


@reg('sw-count', 'executes the loop')
def _(p):
    return run_loop(p['key'], p['n'])


@reg('sw-bigo', 'runs the loop at growing n and classifies the growth')
def _(p):
    key = p['key']
    ns = [16, 32, 64] if key == 'cube' else [256, 512, 1024, 2048]
    c = [run_loop(key, n) for n in ns]
    r = c[-1] / c[-2]
    if c[-1] - c[-2] == 1 and c[-2] - c[-3] == 1: return 'O(log n)'
    if abs(r - 8) < 0.5: return 'O(n³)'
    if abs(r - 4) < 0.3: return 'O(n²)'
    if abs(r - 2) < 0.02: return 'O(n)'
    if 2.05 < r < 2.4: return 'O(n log n)'
    return '?'


@reg('sw-bsearch', 'brute force: counts comparisons for every possible key')
def _(p):
    n = p['n']; arr = list(range(0, 2 * n, 2)); worst = 0
    for key in range(-1, 2 * n + 1):
        lo, hi, c = 0, n - 1, 0
        while lo <= hi:
            mid = (lo + hi) // 2; c += 1
            if arr[mid] == key: break
            if arr[mid] < key: lo = mid + 1
            else: hi = mid - 1
        worst = max(worst, c)
    return worst


@reg('sw-bubble', 'runs bubble sort and counts swaps')
def _(p):
    a = list(p['a']); sw = 0
    for i in range(len(a)):
        for j in range(len(a) - 1 - i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]; sw += 1
    return sw


@reg('sw-stack', 'simulates with list / collections.deque')
def _(p):
    s = [] if p['kind'] == 'stack' else deque()
    last = None
    for o in p['ops']:
        if len(o) == 2: s.append(o[1])
        else: last = s.pop() if p['kind'] == 'stack' else s.popleft()
    return last


@reg('sw-bst', 'builds the BST in Python and traverses it')
def _(p):
    root = None
    def ins(n, k):
        if n is None: return [k, None, None]
        if k < n[0]: n[1] = ins(n[1], k)
        else: n[2] = ins(n[2], k)
        return n
    for k in p['keys']: root = ins(root, k)
    def pre(n): return [] if n is None else [n[0]] + pre(n[1]) + pre(n[2])
    def post(n): return [] if n is None else post(n[1]) + post(n[2]) + [n[0]]
    seq = pre(root) if p['tgt'] == 'preorder' else post(root)
    return ', '.join(map(str, seq))


# ===================================================== CALCULATOR DRILLS
@reg('cd-r2p', 'cmath (identity — the drill tests display/conversion)')
def _(p):
    return complex(*p['z'])


@reg('cd-p2r', 'cmath.rect')
def _(p):
    return cmath.rect(p['m'], math.radians(p['a']))


@reg('cd-cdiv', 'cmath')
def _(p):
    return cmath.rect(p['vm'], math.radians(p['va'])) / complex(*p['z'])


@reg('cd-zpar', 'admittance sum 1/(1/Z₁ + 1/Z₂)')
def _(p):
    return 1 / (1 / complex(*p['z1']) + 1 / complex(*p['z2']))


@reg('cd-det', 'numpy.linalg.det')
def _(p):
    return float(np.linalg.det(np.array(p['M'])))


@reg('cd-sys', 'numpy.linalg.solve')
def _(p):
    return float(np.linalg.solve(np.array(p['A']), np.array(p['b']))[0])


@reg('cd-poly', 'numpy.roots (real root)')
def _(p):
    r = np.roots([1, p['b'], p['c'], p['d']])
    return float(r[np.argmin(np.abs(r.imag))].real)


@reg('cd-solve', 'scipy.optimize.brentq')
def _(p):
    return optimize.brentq(lambda x: x * math.exp(x) - p['K'], 0, 10, xtol=1e-14)


@reg('cd-int', 'scipy.integrate.quad')
def _(p):
    return integrate.quad(lambda x: x * x * math.exp(-p['k'] * x), p['a'], p['b'], epsabs=1e-14, epsrel=1e-13)[0]


@reg('cd-deriv', 'SymPy symbolic differentiation')
def _(p):
    x = sympy.symbols('x')
    f = sympy.log(x ** 2 + p['a']) * sympy.sin(x)
    return float(sympy.diff(f, x).subs(x, sympy.nsimplify(p['x0'])))


@reg('cd-stats', 'Python statistics.stdev')
def _(p):
    return statistics.stdev(p['xs'])


@reg('cd-base', 'Python bitwise operators')
def _(p):
    a, b = p['a'], p['b']
    return format({'AND': a & b, 'OR': a | b, 'XOR': a ^ b}[p['op']], 'X')


@reg('cd-db', 'Python math (log10 / pow)')
def _(p):
    k = p['kind']
    if k == 'v2db': return 20 * math.log10(p['x'])
    if k == 'p2db': return 10 * math.log10(p['x'])
    return math.pow(10, p['dB'] / 20)


@reg('cd-eng', 'recompute with SI prefixes applied separately')
def _(p):
    L = p['L'] * 1e-6; C = p['Cp'] * 1e-12
    return 1 / (2 * math.pi * math.sqrt(L * C))


@reg('cd-recip', 'conductance sum')
def _(p):
    return 1 / sum(1 / r for r in p['R'])


# ===================================================== checking
PREFIX = {'G': 1e9, 'M': 1e6, 'k': 1e3, 'm': 1e-3, 'µ': 1e-6, 'n': 1e-9, 'p': 1e-12}
UNITS = ['Ω·cm', 'kVAR', 'VAR', 'VA', 'b/s', 'N/m', 'V/m', 'Hz', 'rpm', 'units', 'Ω', 'V', 'A', 'W', 'F', 'H', 'm', 's', 'T', 'N', 'dB', '%', '°']


def parse_label(lab):
    """Return (value, display_step) for a numeric label, or None if not numeric."""
    s = lab.replace('−', '-').replace('$', '').replace(',', '').strip()
    for u in UNITS:
        if s.endswith(u):
            s = s[: -len(u)].strip()
            break
    mult = 1.0
    if s and s[-1] in PREFIX and not re.fullmatch(r'-?[\d.]+', s):
        mult = PREFIX[s[-1]]; s = s[:-1].strip()
    if not re.fullmatch(r'-?\d+(\.\d+)?', s):
        return None
    dec = len(s.split('.')[1]) if '.' in s else 0
    return float(s) * mult, 10 ** (-dec) * mult


def close(a, b, tol):
    tol = tol or {}
    if 'abs' in tol:
        return abs(a - b) <= tol['abs']
    rel = tol.get('rel', 1e-6)
    return abs(a - b) <= rel * max(abs(a), abs(b), 1e-300)


def check(v):
    issues = []
    tid, typ, ch, ci = v['tid'], v['type'], v['choices'], v['correct']
    labels = [c['label'] for c in ch]
    if len(set(l.replace(' ', '').lower() for l in labels)) != 4:
        issues.append(f'duplicate labels {labels}')
    exp = EXPECT[tid](v['params'])
    if isinstance(exp, dict) and '_sop' in exp:
        ons = exp['_sop']
        target = sum(1 << m for m in ons)
        A, B, Cs, D = sympy.symbols('A B C D')
        ref = sympy.SOPform([A, B, Cs, D], [[(m >> 3) & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1] for m in ons])
        ref_terms = ref.args if isinstance(ref, sympy.Or) else (ref,)
        ref_cost = (len(ref_terms), sum(len(t.args) if isinstance(t, sympy.And) else 1 for t in ref_terms))
        for i, c in enumerate(ch):
            eq = sop_tt(c['label']) == target
            if i == ci:
                if not eq: issues.append('marked SOP not equivalent to F')
                cost = sop_cost(c['label'])
                if cost > ref_cost: issues.append(f'marked SOP not minimal {cost} vs sympy {ref_cost}')
            elif eq:
                issues.append(f'distractor {c["label"]} is also equivalent to F')
        return issues
    tol = v.get('tol') or {}
    if typ == 'text' or isinstance(exp, str):
        norm = lambda s: str(s).replace(' ', '').replace('−', '-').lower()
        if norm(ch[ci]['label']) != norm(exp):
            issues.append(f'marked {ch[ci]["label"]!r} ≠ independent {exp!r}')
        for i, c in enumerate(ch):
            if i != ci and norm(c['label']) == norm(exp):
                issues.append(f'distractor equals answer {exp!r}')
        return issues
    if typ == 'cplx':
        e = complex(exp); got = complex(*ch[ci]['v'])
        if abs(e - got) > tol.get('rel', 1e-6) * max(abs(e), 1e-300):
            issues.append(f'marked {got} ≠ independent {e}')
        for i, c in enumerate(ch):
            if i == ci: continue
            d = complex(*c['v'])
            if abs(d - e) / max(abs(d), abs(e)) < 0.02:
                issues.append(f'distractor {c["label"]} too close to answer')
        return issues
    e = float(exp)
    if not math.isfinite(e):
        return [f'independent check returned {e}']
    got = float(ch[ci]['v'])
    if not close(e, got, tol):
        issues.append(f'marked {got:.9g} ≠ independent {e:.9g}')
    pl = parse_label(ch[ci]['label'])
    if pl is not None and abs(pl[0] - e) > 0.51 * pl[1] + 1e-9 * abs(e):
        issues.append(f'label {ch[ci]["label"]!r} disagrees with value {e:.6g}')
    sep = v.get('sep') or {}
    for i, c in enumerate(ch):
        if i == ci: continue
        d = float(c['v'])
        if sep.get('abs'):
            if abs(d - e) < 0.75 * sep['abs']: issues.append(f'distractor {c["label"]} within {sep["abs"]} of answer')
        elif abs(d - e) / max(abs(d), abs(e), 1e-300) < 0.02:
            issues.append(f'distractor {c["label"]} too close to answer')
    return issues


def main():
    src, dst = sys.argv[1], sys.argv[2]
    res = defaultdict(lambda: {'n': 0, 'pass': 0, 'issues': []})
    t0 = time.time()
    for line in open(src):
        v = json.loads(line)
        r = res[v['tid']]
        r['n'] += 1
        if 'error' in v:
            r['issues'].append(v['error']); continue
        if v['tid'] not in EXPECT:
            r['issues'].append('no independent checker'); continue
        try:
            iss = check(v)
        except Exception as ex:
            iss = [f'checker error: {type(ex).__name__}: {ex}']
        if iss:
            if len(r['issues']) < 4: r['issues'].append(f"seed {v['seed']}: " + '; '.join(iss))
        else:
            r['pass'] += 1
    report = {
        'generated': time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime()),
        'tools': {'python': sys.version.split()[0], 'numpy': np.__version__, 'scipy': scipy.__version__,
                  'sympy': sympy.__version__, 'lcapy': lcapy.__version__, 'numpy_financial': npf.__version__},
        'items': {tid: {'n': r['n'], 'pass': r['pass'], 'method': METHOD.get(tid, '—'), 'issues': r['issues']} for tid, r in sorted(res.items())},
    }
    bad = {k: x for k, x in report['items'].items() if x['pass'] != x['n']}
    with open(dst, 'w') as f:
        f.write('/* Generated by tools/verify.py — do not edit. */\n')
        f.write('(function (G) { G.FE = G.FE || {}; G.FE.VERIFY_REPORT = ' + json.dumps(report, ensure_ascii=False, indent=1) + '; })(typeof globalThis !== "undefined" ? globalThis : this);\n')
    tot = sum(x['n'] for x in report['items'].values()); ok = sum(x['pass'] for x in report['items'].values())
    print(f'{ok}/{tot} variants passed across {len(report["items"])} items in {time.time() - t0:.0f}s')
    for k, x in bad.items():
        print(f'  FAIL {k}: {x["pass"]}/{x["n"]}  ' + ' | '.join(x['issues'][:2]))
    missing = [t for t in EXPECT if t not in report['items']]
    if missing: print('  checkers with no variants:', missing)


if __name__ == '__main__':
    main()
