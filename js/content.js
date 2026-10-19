/* FE Prep — content map.
   Areas + question ranges: NCEES FE Electrical and Computer CBT exam specification
   (effective July 2020). Book sets: problem-set titles and page numbers from the table of
   contents of Asghar, "Study Guide for FE Electrical & Computer CBT Exam" (Handbook 10.0.1
   edition). Only titles/page numbers are stored — no problem text. */
(function (G) {
  const FE = (G.FE = G.FE || {});

  FE.AREAS = [
    { id: 1, name: 'Mathematics', lo: 11, hi: 17, solPage: 175 },
    { id: 2, name: 'Probability and Statistics', lo: 4, hi: 6, solPage: 199 },
    { id: 3, name: 'Ethics and Professional Practice', lo: 4, hi: 6, solPage: 209 },
    { id: 4, name: 'Engineering Economics', lo: 5, hi: 8, solPage: 213 },
    { id: 5, name: 'Properties of Electrical Materials', lo: 4, hi: 6, solPage: 219 },
    { id: 6, name: 'Circuit Analysis', lo: 11, hi: 17, solPage: 224 },
    { id: 7, name: 'Linear Systems', lo: 5, hi: 8, solPage: 236 },
    { id: 8, name: 'Signal Processing', lo: 5, hi: 8, solPage: 245 },
    { id: 9, name: 'Electronics', lo: 7, hi: 11, solPage: 256 },
    { id: 10, name: 'Power Systems', lo: 8, hi: 12, solPage: 279 },
    { id: 11, name: 'Electromagnetics', lo: 4, hi: 6, solPage: 294 },
    { id: 12, name: 'Control Systems', lo: 6, hi: 9, solPage: 306 },
    { id: 13, name: 'Communications', lo: 5, hi: 8, solPage: 319 },
    { id: 14, name: 'Computer Networks', lo: 4, hi: 6, solPage: 331 },
    { id: 15, name: 'Digital Systems', lo: 8, hi: 12, solPage: 340 },
    { id: 16, name: 'Computer Systems', lo: 5, hi: 8, solPage: 354 },
    { id: 17, name: 'Software Engineering', lo: 4, hi: 6, solPage: 360 },
  ];

  const S = (id, title, page) => ({ id, title, page, area: +id.split('.')[0] });
  FE.SETS = [
    S('1.1', 'Algebra and trigonometry', 5), S('1.2', 'Complex numbers', 7),
    S('1.3', 'Discrete math and progressions', 8), S('1.4', 'Analytic geometry', 10),
    S('1.5', 'Calculus', 12), S('1.6', 'Differential equations', 15),
    S('1.7', 'Matrix and vector analysis', 16),
    S('2.1', 'Measures of central tendency', 19), S('2.2', 'Permutations, combinations, probability laws', 20),
    S('2.3', 'Probability distributions', 22), S('2.4', 'Expected values', 23),
    S('3.1', 'Code of ethics, NCEES Model Law and Rules', 25), S('3.2', 'Intellectual property', 28),
    S('3.3', 'Safety', 29),
    S('4.1', 'Time value of money', 31), S('4.2', 'Cost estimation', 32), S('4.3', 'Risk identification and analysis', 33),
    S('5.1', 'Electrical properties', 35), S('5.2', 'Thermal properties', 38),
    S('6.1', 'Kirchhoff’s laws (KCL, KVL)', 40), S('6.2', 'Series/parallel equivalent circuits', 42),
    S('6.3', 'Thevenin and Norton theorems', 44), S('6.4', 'Waveform analysis', 46),
    S('6.5', 'Phasors', 48), S('6.6', 'Impedance', 49),
    S('7.1', 'Frequency and transient response', 53), S('7.2', 'Resonance', 55),
    S('7.3', 'Laplace transform', 57), S('7.4', 'Transfer functions', 59),
    S('8.1', 'Sampling', 62), S('8.2', 'Analog filters', 63),
    S('8.3', 'Digital filters, Z-transforms, difference equations', 64),
    S('8.4', 'Continuous-time convolution', 66), S('8.5', 'Discrete-time convolution', 69),
    S('9.1', 'Semiconductor materials', 71), S('9.2', 'Diodes and thyristors', 72),
    S('9.3', 'Bipolar junction transistors', 75), S('9.4', 'JFETs', 78), S('9.5', 'MOSFETs', 79),
    S('9.6', 'Operational amplifiers', 82), S('9.7', 'Power electronics', 84), S('9.8', 'Instrumentation', 85),
    S('10.1', 'Power theory, single-phase power', 88), S('10.2', 'Transmission, distribution, 3-phase power', 90),
    S('10.3', 'Power factor', 93), S('10.4', 'Voltage regulation and voltage drop', 94),
    S('10.5', 'Transformers', 95), S('10.6', 'Motors and generators', 97),
    S('11.1', 'Electrostatics', 100), S('11.2', 'Magnetostatics', 102),
    S('11.3', 'Maxwell’s equations', 103), S('11.4', 'Wave propagation', 105), S('11.5', 'Transmission lines', 106),
    S('12.1', 'Block diagrams, closed/open-loop response', 108), S('12.2', 'Bode plots', 110),
    S('12.3', 'Stability and frequency response', 112), S('12.4', 'Controller performance', 114),
    S('13.1', 'Communication theory', 117), S('13.2', 'Amplitude modulation', 118),
    S('13.3', 'Angle modulation', 120), S('13.4', 'Fourier transforms', 122),
    S('13.5', 'Digital communications', 123), S('13.6', 'Multiplexing', 124),
    S('14.1', 'Routing and switching', 126), S('14.2', 'Topologies, network types, models', 127),
    S('14.3', 'IP addressing (IPv4/IPv6)', 129), S('14.4', 'Protocols: TCP, UDP, ICMP', 131),
    S('14.5', 'Network security, intrusion detection, encryption', 132),
    S('15.1', 'Number systems', 135), S('15.2', 'Boolean logic', 136), S('15.3', 'Logic gates and circuits', 137),
    S('15.4', 'Logic minimization (K-maps, SOP, POS)', 139), S('15.5', 'Flip-flops and counters', 141),
    S('15.6', 'Combinational circuits', 144), S('15.7', 'Programmable logic and gate arrays', 147),
    S('15.8', 'State machine design', 149), S('15.9', 'Timing', 151),
    S('16.1', 'Microprocessors', 154), S('16.2', 'Memory technology and systems', 156),
    S('16.3', 'Architecture and interfacing', 158),
    S('17.1', 'Complexity and Big-O', 160), S('17.2', 'Sorting and searching', 162),
    S('17.3', 'Arrays, linked lists, stacks, queues', 164), S('17.4', 'Trees and graphs', 166),
    S('17.5', 'Software design, implementation, testing', 168),
  ];
  FE.SET_BY_ID = Object.fromEntries(FE.SETS.map((s) => [s.id, s]));
  FE.AREA_BY_ID = Object.fromEntries(FE.AREAS.map((a) => [a.id, a]));
  FE.BOOK = {
    title: 'Study Guide for FE Electrical & Computer CBT Exam',
    author: 'Wasim Asghar',
    edition: 'Handbook 10.0.1 edition (700+ problems)',
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
