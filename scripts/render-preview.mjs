// Render offline WAV previews of the Kerala soundscape, one per shore, using
// the same DSP the browser runs. Output: /downloads/kerala-audio/<place>.wav
// (16-bit PCM stereo, 44.1 kHz, 45 s each). Usage: node scripts/render-preview.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import * as DSP from '../src/soundscape-dsp.js';
import { SOUND_PLACES } from '../src/soundscape.js';

const SR = 44100, SECONDS = 45, MASTER = 0.9;
const OUT = '/downloads/kerala-audio';
mkdirSync(OUT, { recursive: true });

function tile(loop, n) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = loop[i % loop.length];
  return out;
}

function panGains(pan) {
  // equal-power pan, pan in [-1,1]
  const a = (pan + 1) * Math.PI / 4;
  return [Math.cos(a), Math.sin(a)];
}

function writeWav(path, left, right, sr) {
  const n = left.length, data = n * 4;
  const buf = Buffer.alloc(44 + data);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(data, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i])), r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }
  writeFileSync(path, buf);
}

for (let p = 0; p < SOUND_PLACES.length; p++) {
  const place = SOUND_PLACES[p];
  const rng = DSP.makeRng(1000 + p); // deterministic previews
  const n = SECONDS * SR;
  const surf = DSP.renderSurfLoop(SR, place.surf, rng);
  const rustle = DSP.renderRustleLoop(SR, {}, rng);
  const L = new Float32Array(n), R = new Float32Array(n);
  const sL = tile(surf.left, n), sR = tile(surf.right, n);
  const rL = tile(rustle.left, n), rR = tile(rustle.right, n);
  for (let i = 0; i < n; i++) {
    L[i] = (sL[i] * place.surfGain + rL[i] * place.rustle) * MASTER;
    R[i] = (sR[i] * place.surfGain + rR[i] * place.rustle) * MASTER;
  }
  // Deterministic one-shots so the preview shows the bird layer: a koel at
  // ~4 s and a gull at ~24 s (a passing houseboat instead for the backwaters).
  const shots = place.putter
    ? [{ t: 4, kind: 'putter', gain: place.putterGain, pan: 0.2 }, { t: 26, kind: 'koel', gain: place.birdGain, pan: -0.4 }]
    : [{ t: 4, kind: 'koel', gain: place.birdGain, pan: -0.5 }, { t: 24, kind: 'gull', gain: place.birdGain, pan: 0.45 }];
  for (const s of shots) {
    const d = s.kind === 'koel' ? DSP.renderKoel(SR, rng) : s.kind === 'gull' ? DSP.renderGull(SR, rng) : DSP.renderPutter(SR, rng);
    const [gl, gr] = panGains(s.pan);
    const off = s.t * SR;
    for (let i = 0; i < d.length && off + i < n; i++) {
      L[off + i] += d[i] * s.gain * gl * MASTER;
      R[off + i] += d[i] * s.gain * gr * MASTER;
    }
  }
  const file = `${OUT}/kerala-${place.id}.wav`;
  writeWav(file, L, R, SR);
  console.log('wrote', file);
}
