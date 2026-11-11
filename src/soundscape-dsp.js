// Procedural soundscape DSP for the worlds fleet.
// Pure JS: every function renders Float32Array sample data with no WebAudio
// dependency, so the same code builds AudioBuffers in the browser and renders
// WAV previews + runs structural verification in Node (scripts/render-preview.mjs,
// verification/audio-structure.cjs). All sound is synthesized; no samples,
// no field recordings, no voice.

export function makeRng(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// RBJ biquad, direct form 1. Returns a stateful sample processor.
export function biquad(type, f0, q, fs) {
  const w0 = 2 * Math.PI * f0 / fs, cw = Math.cos(w0), sw = Math.sin(w0), alpha = sw / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
  else if (type === 'highpass') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
  else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
  else throw new Error('unknown biquad ' + type);
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return x => { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}

export function normalize(a, peak = 1) {
  let m = 0;
  for (let i = 0; i < a.length; i++) { const v = Math.abs(a[i]); if (v > m) m = v; }
  if (m > 0) { const g = peak / m; for (let i = 0; i < a.length; i++) a[i] *= g; }
  return a;
}

function normalizePair(l, r, peak) {
  let m = 0;
  for (let i = 0; i < l.length; i++) {
    const a = Math.abs(l[i]), b = Math.abs(r[i]);
    if (a > m) m = a; if (b > m) m = b;
  }
  if (m > 0) { const g = peak / m; for (let i = 0; i < l.length; i++) { l[i] *= g; r[i] *= g; } }
}

// Irregular swell envelope in [0,1]: summed incommensurate sines, clipped and
// shaped so breakers arrive in groups like real surf rather than a metronome.
export function swellEnv(n, fs, period, rng, power = 1.6) {
  const a = new Float32Array(n);
  const ph1 = rng() * 6.2832, ph2 = rng() * 6.2832, ph3 = rng() * 6.2832;
  for (let i = 0; i < n; i++) {
    const t = i / fs;
    let s = Math.sin(2 * Math.PI * t / period + ph1)
      + 0.55 * Math.sin(2 * Math.PI * t / (period * 2.63) + ph2)
      + 0.3 * Math.sin(2 * Math.PI * t / (period * 0.414) + ph3);
    s = Math.max(0, s / 1.85);
    a[i] = Math.pow(s, power);
  }
  return a;
}

// Fold a longer render into a seamless loop of `seconds`: the tail beyond the
// loop length is crossfaded over the head so sample N-1 runs into sample 0.
function foldLoop(long, n, x) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (i < x) { const w = i / x; out[i] = (1 - w) * long[n + i] + w * long[i]; }
    else out[i] = long[i];
  }
  return out;
}

// Surf loop: deep brown-noise wash plus a breaking-swash band that follows the
// swell envelope. params: {seconds, crossfade, period, lowpass, swash,
// swashFreq, power}. Stereo channels share the envelope but use independent
// noise, giving natural width without any pan trick.
export function renderSurfLoop(sampleRate, params, rng) {
  const seconds = params.seconds ?? 18, crossfade = params.crossfade ?? 1.5;
  const period = params.period ?? 9, lowpass = params.lowpass ?? 900;
  const swash = params.swash ?? 0.5, swashFreq = params.swashFreq ?? 700;
  const n = Math.round(seconds * sampleRate), x = Math.round(crossfade * sampleRate), N = n + x;
  const env = swellEnv(N, sampleRate, period, rng, params.power ?? 1.6);
  const longL = new Float32Array(N), longR = new Float32Array(N);
  for (const long of [longL, longR]) {
    const lp = biquad('lowpass', lowpass, 0.7, sampleRate);
    const bp = biquad('bandpass', swashFreq, 1.4, sampleRate);
    const tone = biquad('lowpass', params.tone ?? 2600, 0.6, sampleRate);
    let brown = 0;
    for (let i = 0; i < N; i++) {
      const w = rng() * 2 - 1;
      brown = 0.985 * brown + 0.015 * w;
      const body = lp(brown * 22);
      const hiss = bp(w) * (0.3 + 0.7 * env[i]);
      long[i] = tone(body * (0.5 + 0.5 * env[i]) + hiss * swash * Math.pow(env[i], 1.3));
    }
  }
  const left = foldLoop(longL, n, x), right = foldLoop(longR, n, x);
  // Level to a consistent loudness, then a gentle tanh limiter so swells
  // crest softly instead of clipping; keeps crest factor low and the bed
  // audible without being loud.
  let sum = 0;
  for (let i = 0; i < n; i++) sum += left[i] * left[i] + right[i] * right[i];
  const rms = Math.sqrt(sum / (2 * n)) || 1;
  const g0 = 0.15 / rms;
  for (let i = 0; i < n; i++) {
    left[i] = Math.tanh(left[i] * g0 * 1.15) * 0.85;
    right[i] = Math.tanh(right[i] * g0 * 1.15) * 0.85;
  }
  return { left, right };
}

// Wind through palm fronds: band-limited hiss with slow gusts and a light
// leaf-flutter shimmer. Quieter and higher than the surf.
export function renderRustleLoop(sampleRate, params = {}, rng = makeRng(7)) {
  const seconds = params.seconds ?? 14, crossfade = params.crossfade ?? 1;
  const n = Math.round(seconds * sampleRate), x = Math.round(crossfade * sampleRate), N = n + x;
  const ph1 = rng() * 6.2832, ph2 = rng() * 6.2832;
  const longL = new Float32Array(N), longR = new Float32Array(N);
  for (const long of [longL, longR]) {
    const hp = biquad('highpass', 2000, 0.7, sampleRate);
    const lp = biquad('lowpass', 5200, 0.7, sampleRate);
    for (let i = 0; i < N; i++) {
      const t = i / sampleRate;
      let gust = Math.sin(2 * Math.PI * 0.061 * t + ph1) + 0.6 * Math.sin(2 * Math.PI * 0.113 * t + ph2);
      gust = Math.pow(Math.max(0, gust / 1.6), 2.4);
      const flutter = 0.85 + 0.15 * Math.sin(2 * Math.PI * 11 * t + ph2 * 3);
      long[i] = lp(hp(rng() * 2 - 1)) * gust * flutter;
    }
  }
  const left = foldLoop(longL, n, x), right = foldLoop(longR, n, x);
  normalizePair(left, right, 0.5);
  return { left, right };
}

// Asian koel: a rising two-note "ku-oo", repeated a few times, low-passed to
// sit far away in the mix. Mono; pan at runtime.
export function renderKoel(sampleRate, rng) {
  const calls = 2 + Math.floor(rng() * 2);
  const sr = sampleRate;
  const callLen = Math.round(1.05 * sr), gap = Math.round(0.35 * sr);
  const a = new Float32Array(calls * callLen + gap * (calls - 1) + Math.round(0.4 * sr));
  const base = 640 + rng() * 80;
  for (let c = 0; c < calls; c++) {
    const off = c * (callLen + gap);
    const notes = [
      { start: 0.0, dur: 0.28, f0: base, f1: base * 1.38 },
      { start: 0.36, dur: 0.34, f0: base * 1.16, f1: base * 1.6 },
    ];
    for (const nt of notes) {
      const s0 = off + Math.round(nt.start * sr), len = Math.round(nt.dur * sr);
      let ph = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len, f = nt.f0 + (nt.f1 - nt.f0) * t;
        ph += 2 * Math.PI * f / sr;
        const env = Math.min(1, i / (0.03 * sr)) * Math.pow(1 - t, 1.4);
        a[s0 + i] += (Math.sin(ph) + 0.22 * Math.sin(2 * ph)) * env * 0.5;
      }
    }
  }
  const lp = biquad('lowpass', 3200, 0.7, sr);
  for (let i = 0; i < a.length; i++) a[i] = lp(a[i]);
  return normalize(a, 0.5);
}

// Brown-headed / Heuglin's type gull: descending nasal "kyow", 1-3 cries.
export function renderGull(sampleRate, rng) {
  const cries = 1 + Math.floor(rng() * 2.4);
  const sr = sampleRate;
  const cryLen = Math.round(0.4 * sr), gap = Math.round(0.28 * sr);
  const a = new Float32Array(cries * cryLen + gap * (cries - 1) + Math.round(0.2 * sr));
  for (let c = 0; c < cries; c++) {
    const off = c * (cryLen + gap), len = Math.round(0.36 * sr);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len, f = 1380 - 560 * Math.pow(t, 0.8);
      ph += 2 * Math.PI * f / sr;
      const am = 0.7 + 0.3 * Math.sin(2 * Math.PI * 27 * i / sr);
      const env = Math.min(1, i / (0.02 * sr)) * Math.pow(1 - t, 1.1);
      a[off + i] += (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * env * am * 0.45;
    }
  }
  const hp = biquad('highpass', 500, 0.7, sr), lp = biquad('lowpass', 3400, 0.7, sr);
  for (let i = 0; i < a.length; i++) a[i] = lp(hp(a[i]));
  return normalize(a, 0.45);
}

// Distant houseboat diesel: a soft chug at ~6 Hz over a 55 Hz hum, very low in
// the mix. Used only for backwater scenes, fading in and out like a passing boat.
export function renderPutter(sampleRate, rng) {
  const sr = sampleRate, seconds = 7, n = seconds * sr;
  const a = new Float32Array(n);
  const chugRate = 5.5 + rng() * 1.5;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    ph += 2 * Math.PI * 55 / sr;
    const chug = Math.pow(Math.max(0, Math.sin(2 * Math.PI * chugRate * t)), 3);
    const fade = Math.min(1, t / 2.5) * Math.min(1, (seconds - t) / 2.5);
    a[i] = (Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.18 * Math.sin(3 * ph)) * (0.25 + 0.75 * chug) * fade;
  }
  const lp = biquad('lowpass', 240, 0.8, sr);
  for (let i = 0; i < n; i++) a[i] = lp(a[i]);
  return normalize(a, 0.4);
}
