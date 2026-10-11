// ============================================================================
// DATA & RESEARCH PAGE  (edit this file to add charts and tables)
//
// Each dataset becomes one section with a chart, a text summary, a table,
// notes and an optional CSV download.
//
// IMPORTANT: 'kind' tells visitors what the numbers are.
//   kind: 'illustrative'  calculated from a formula or made up as a demonstration
//   kind: 'measured'      real measurements or verified results from your work
// Never mark sample numbers as 'measured'.
//
// The three datasets below are ILLUSTRATIVE: every value is calculated from
// the textbook formulas written in "methodology". They are not measurements.
// Replace them with your own work (see the template at the bottom).
// ============================================================================

const round = (value, digits) => Number(value.toFixed(digits));
const sig = (value, digits) => Number(value.toPrecision(digits));

/* ---- 1. RC low-pass filter: first-order model ------------------------- */
const R = 1000; // ohms (1 kΩ)
const C = 100e-9; // farads (100 nF)
const cutoff = 1 / (2 * Math.PI * R * C); // about 1591.5 Hz
const frequencies = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
const gainDb = frequencies.map((f) => round(-10 * Math.log10(1 + (f / cutoff) ** 2), 2));
const phaseDeg = frequencies.map((f) => round(-(Math.atan(f / cutoff) * 180) / Math.PI, 1));

/* ---- 2 & 3. ADC resolution --------------------------------------------- */
const VREF = 3.3; // volts
const bits = [8, 10, 12, 14, 16];
const levels = bits.map((n) => 2 ** n);
const lsbMillivolts = bits.map((n) => sig((VREF * 1000) / 2 ** n, 4));

export const datasets = [
  {
    id: 'rc-lowpass-response',
    kind: 'illustrative',
    title: 'RC low-pass filter: gain versus frequency',
    description: 'Ideal first-order RC low-pass filter with R = 1 kΩ and C = 100 nF.',
    chart: {
      type: 'line',
      title: 'Gain of an ideal RC low-pass filter',
      x: { label: 'Frequency', unit: 'Hz', scale: 'log', values: frequencies },
      y: { label: 'Gain', unit: 'dB' },
      series: [{ name: 'Gain', values: gainDb }],
      summary:
        'Gain is close to 0 dB at low frequencies, falls to about −3 dB near 1.6 kHz, then drops by roughly 20 dB for every tenfold increase in frequency.',
    },
    columns: [
      { key: 'f', label: 'Frequency (Hz)', align: 'right' },
      { key: 'gain', label: 'Gain (dB)', align: 'right' },
      { key: 'phase', label: 'Phase (°)', align: 'right' },
    ],
    rows: frequencies.map((f, i) => ({ f, gain: gainDb[i], phase: phaseDeg[i] })),
    methodology: [
      'Gain: 20·log10 |H(f)| with |H(f)| = 1 / √(1 + (f / fc)²).',
      'Phase: −arctan(f / fc).',
      'Cutoff frequency: fc = 1 / (2πRC), which is about 1,592 Hz for R = 1 kΩ and C = 100 nF.',
    ],
    findings: [
      'At the cutoff frequency the gain is −3 dB and the phase is −45°.',
      'Above the cutoff, the gain falls by about 20 dB per decade.',
    ],
    limitations: [
      'Calculated from an ideal model: real components have tolerance, parasitic effects and loading.',
      'Not a measurement. Replace with your own measured response before drawing any conclusion.',
    ],
    sources: [], // add { label: 'Textbook or datasheet', url: 'https://...' } for real references
    csv: 'files/sample-rc-lowpass-response.csv',
  },
  {
    id: 'adc-levels',
    kind: 'illustrative',
    title: 'ADC resolution: number of quantisation levels',
    description: 'How many distinct output codes an ideal N-bit analogue-to-digital converter has.',
    chart: {
      type: 'bar',
      title: 'Quantisation levels by ADC resolution',
      x: { label: 'Resolution', unit: '', categories: bits.map((n) => `${n}-bit`) },
      y: { label: 'Levels', unit: 'codes' },
      series: [{ name: 'Levels', values: levels }],
      summary: 'The number of levels doubles with every added bit, from 256 at 8 bits to 65,536 at 16 bits.',
    },
    columns: [
      { key: 'bits', label: 'Resolution (bits)', align: 'right' },
      { key: 'levels', label: 'Levels (2^N)', align: 'right' },
    ],
    rows: bits.map((n, i) => ({ bits: n, levels: levels[i] })),
    methodology: ['Number of levels = 2^N for an ideal N-bit converter.'],
    findings: ['Each extra bit doubles the number of levels.'],
    limitations: ['Ideal converter: real ADCs have noise, offset and non-linearity, so effective resolution is lower.'],
    sources: [],
    csv: 'files/sample-adc-resolution.csv',
  },
  {
    id: 'adc-lsb',
    kind: 'illustrative',
    title: 'ADC resolution: step size (LSB)',
    description: 'Size of one least-significant bit for a 3.3 V reference voltage.',
    chart: {
      type: 'line',
      title: 'LSB size against ADC resolution (3.3 V reference)',
      x: { label: 'Resolution', unit: 'bits', scale: 'linear', values: bits },
      y: { label: 'LSB size', unit: 'mV', scale: 'log' },
      series: [{ name: 'LSB size', values: lsbMillivolts }],
      summary: 'The step size halves with each added bit: about 12.9 mV at 8 bits and about 0.05 mV at 16 bits. The vertical axis is logarithmic.',
    },
    columns: [
      { key: 'bits', label: 'Resolution (bits)', align: 'right' },
      { key: 'lsb', label: 'LSB size (mV)', align: 'right' },
    ],
    rows: bits.map((n, i) => ({ bits: n, lsb: lsbMillivolts[i] })),
    methodology: ['LSB = Vref / 2^N with Vref = 3.3 V, shown in millivolts and rounded to 4 significant digits.'],
    findings: ['Going from 8 to 12 bits makes the step 16 times smaller.'],
    limitations: ['Ideal converter with a perfect reference: real systems add noise and reference error.'],
    sources: [],
    csv: 'files/sample-adc-resolution.csv',
  },

  // ---- TEMPLATE for your own measured data (copy, uncomment and edit) ----
  // {
  //   id: 'my-measurements',            // unique, no spaces
  //   kind: 'measured',                 // real data only!
  //   title: 'Output voltage versus load current',
  //   description: 'Bench measurements of my power supply prototype.',
  //   chart: {
  //     type: 'line',                   // 'line' or 'bar'
  //     title: 'Output voltage versus load current',
  //     x: { label: 'Load current', unit: 'A', values: [0.1, 0.2, 0.5, 1.0] },
  //     y: { label: 'Output voltage', unit: 'V' },
  //     series: [{ name: 'Measured', values: [5.01, 5.00, 4.97, 4.92] }],
  //     summary: 'One or two sentences describing what the chart shows.',
  //   },
  //   columns: [
  //     { key: 'i', label: 'Load current (A)', align: 'right' },
  //     { key: 'v', label: 'Output voltage (V)', align: 'right' },
  //   ],
  //   rows: [{ i: 0.1, v: 5.01 }, { i: 0.2, v: 5.00 }, { i: 0.5, v: 4.97 }, { i: 1.0, v: 4.92 }],
  //   methodology: ['How you measured it: instruments, sample size, conditions.'],
  //   findings: ['What the data shows.'],
  //   limitations: ['Instrument accuracy, number of samples, anything that could bias the result.'],
  //   sources: [{ label: 'Lab report', url: 'files/lab-report.pdf' }],
  //   csv: 'files/my-measurements.csv',
  // },
];
