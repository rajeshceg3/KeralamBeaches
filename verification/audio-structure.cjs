// Structural audio verification for the Kerala soundscape. Proves measurable
// properties of the synthesized signal; it does NOT judge whether it sounds
// good - that call stays with a human listener.
// Checks per shore loop + one-shots: no clipping, sane loudness, no DC,
// seamless loop wrap, low-mid spectral weight (moody, not harsh).
const DSP = require('../src/soundscape-dsp.js');
const { SOUND_PLACES } = require('../src/soundscape.js');
const fs = require('fs');

const SR = 44100, MASTER = 0.9;
const failures = [];
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' (' + detail + ')' : ''));
  if (!ok) failures.push(name);
}

function stats(a) {
  let peak = 0, sum = 0, dc = 0;
  for (let i = 0; i < a.length; i++) { const v = Math.abs(a[i]); if (v > peak) peak = v; sum += a[i] * a[i]; dc += a[i]; }
  return { peak, rms: Math.sqrt(sum / a.length), dc: dc / a.length };
}

// radix-2 FFT magnitude spectrum (averaged over windows), for spectral centroid
function fftMag(frame) {
  const n = frame.length, re = Float64Array.from(frame), im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j];
        const vr = re[i + j + len / 2] * cwr - im[i + j + len / 2] * cwi;
        const vi = re[i + j + len / 2] * cwi + im[i + j + len / 2] * cwr;
        re[i + j] = ur + vr; im[i + j] = ui + vi;
        re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const twr = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = twr;
      }
    }
  }
  const mag = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

function spectralCentroid(a, sr) {
  const W = 8192, hop = W * 2, hann = [];
  for (let i = 0; i < W; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / W);
  let num = 0, den = 0, count = 0;
  for (let off = 0; off + W <= a.length && count < 20; off += hop, count++) {
    const frame = new Float64Array(W);
    for (let i = 0; i < W; i++) frame[i] = a[off + i] * hann[i];
    const mag = fftMag(frame);
    for (let k = 1; k < mag.length; k++) { const f = k * sr / W; num += f * mag[k]; den += mag[k]; }
  }
  return den > 0 ? num / den : 0;
}

function seamMetric(loop) {
  // largest step across the wrap point vs the 99th percentile step elsewhere
  const n = loop.length;
  let wrapMax = 0;
  const around = [];
  for (let i = n - 25; i < n + 25; i++) around.push(Math.abs(loop[i % n] - loop[(i + 1) % n]));
  wrapMax = Math.max(...around);
  const steps = [];
  for (let i = 0; i < n - 1; i += 97) steps.push(Math.abs(loop[i] - loop[i + 1]));
  steps.sort((a, b) => a - b);
  const p99 = steps[Math.floor(steps.length * 0.99)];
  return { wrapMax, p99 };
}

const report = { sr: SR, places: {}, oneShots: {}, limits: 'structural only; no aesthetic judgment' };

for (let p = 0; p < SOUND_PLACES.length; p++) {
  const place = SOUND_PLACES[p];
  const rng = DSP.makeRng(1000 + p);
  const surf = DSP.renderSurfLoop(SR, place.surf, rng);
  const rustle = DSP.renderRustleLoop(SR, {}, rng);
  // mixdown as heard: surf at place gain + rustle, at master
  const n = surf.left.length, mix = new Float32Array(n);
  const rn = rustle.left.length;
  for (let i = 0; i < n; i++) { const j = i % rn; mix[i] = ((surf.left[i] + surf.right[i]) / 2 * place.surfGain + (rustle.left[j] + rustle.right[j]) / 2 * place.rustle) * MASTER; }
  const s = stats(mix);
  const db = 20 * Math.log10(s.rms || 1e-9);
  check(place.id + ' no clipping', s.peak <= 0.98, 'peak ' + s.peak.toFixed(3));
  check(place.id + ' loudness in quiet-ambient band', db > -30 && db < -14, db.toFixed(1) + ' dBFS RMS');
  check(place.id + ' no DC offset', Math.abs(s.dc) < 0.01, 'dc ' + s.dc.toExponential(1));
  const seam = seamMetric(surf.left), seamR = seamMetric(surf.right);
  check(place.id + ' loop seam L', seam.wrapMax <= seam.p99 * 1.5, 'wrap ' + seam.wrapMax.toFixed(4) + ' vs p99 ' + seam.p99.toFixed(4));
  check(place.id + ' loop seam R', seamR.wrapMax <= seamR.p99 * 1.5, 'wrap ' + seamR.wrapMax.toFixed(4) + ' vs p99 ' + seamR.p99.toFixed(4));
  const cent = spectralCentroid(mix, SR);
  check(place.id + ' low-mid spectral weight', cent > 120 && cent < 1600, 'centroid ' + cent.toFixed(0) + ' Hz');
  report.places[place.id] = { peak: +s.peak.toFixed(3), rmsDb: +db.toFixed(1), dc: +s.dc.toExponential(1), centroidHz: +cent.toFixed(0), seamWrapL: +seam.wrapMax.toFixed(4), seamP99L: +seam.p99.toFixed(4) };
}

for (const [kind, render] of [['koel', DSP.renderKoel], ['gull', DSP.renderGull], ['putter', DSP.renderPutter]]) {
  const d = render(SR, DSP.makeRng(42));
  const s = stats(d);
  check(kind + ' one-shot renders', d.length > SR * 0.5 && s.peak <= 0.98 && s.rms > 0.001, 'dur ' + (d.length / SR).toFixed(2) + 's peak ' + s.peak.toFixed(2));
  check(kind + ' no DC offset', Math.abs(s.dc) < 0.01, 'dc ' + s.dc.toExponential(1));
  report.oneShots[kind] = { durS: +(d.length / SR).toFixed(2), peak: +s.peak.toFixed(2) };
}

fs.mkdirSync('verification/output', { recursive: true });
fs.writeFileSync('verification/output/audio-structure.json', JSON.stringify(report, null, 2));
if (failures.length) { console.error('AUDIO STRUCTURE FAILURES:', failures.join('; ')); process.exit(1); }
console.log('PASS audio-structure: loops seamless, no clipping, quiet-ambient loudness, low-mid weight, no DC. Not a listening judgment.');
