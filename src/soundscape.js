// Browser glue for the Kerala soundscape. All synthesis lives in
// soundscape-dsp.js; this module only wires rendered buffers into WebAudio.
// Sound is opt-in: nothing is created until the Sound on button is pressed,
// and Sound off closes the AudioContext entirely.

import * as DSP from './soundscape-dsp.js';

// One parameter set per shore, matched to the place: sheltered crescents,
// cliff surf, backwater lap, calm working shore, fort above a long beach.
// Bird voices are species heard on this coast: koel in the palms, gulls over
// the sea; a far-off houseboat engine only on the backwaters.
export const SOUND_PLACES = [
  { id: 'kovalam', surf: { period: 8, lowpass: 950, swash: 0.5, swashFreq: 760 }, surfGain: 0.5, rustle: 0.11, koel: 0.7, birdGain: 0.055, putter: false },
  { id: 'varkala', surf: { period: 11, lowpass: 720, swash: 0.62, swashFreq: 560, power: 1.9 }, surfGain: 0.62, rustle: 0.07, koel: 0.55, birdGain: 0.06, putter: false },
  { id: 'alappuzha', surf: { period: 3.2, lowpass: 1300, swash: 0.38, swashFreq: 900, power: 1.2, tone: 2200 }, surfGain: 0.38, rustle: 0.14, koel: 0.8, birdGain: 0.05, putter: true, putterChance: 0.3, putterGain: 0.05 },
  { id: 'marari', surf: { period: 9.5, lowpass: 1000, swash: 0.42, swashFreq: 820 }, surfGain: 0.45, rustle: 0.15, koel: 0.75, birdGain: 0.05, putter: false },
  { id: 'bekal', surf: { period: 10, lowpass: 820, swash: 0.55, swashFreq: 640, power: 1.7 }, surfGain: 0.55, rustle: 0.09, koel: 0.6, birdGain: 0.055, putter: false },
];

export function createSoundscape() {
  const state = { ctx: null, on: false, gain: null, source: null };
  const rng = DSP.makeRng((Date.now() % 100000) + 1);
  const buffers = {};
  let master = null, surfGain = null, rustleGain = null, rustleSrc = null;
  let birdTimer = 0, place = 0;

  function surfBuffer(p) {
    if (buffers[p]) return buffers[p];
    const sr = state.ctx.sampleRate;
    const d = DSP.renderSurfLoop(sr, SOUND_PLACES[p].surf, rng);
    const b = state.ctx.createBuffer(2, d.left.length, sr);
    b.getChannelData(0).set(d.left);
    b.getChannelData(1).set(d.right);
    buffers[p] = b;
    return b;
  }

  function startSurf(p) {
    const t = state.ctx.currentTime;
    if (state.source) {
      const old = state.source, oldG = surfGain;
      oldG.gain.cancelScheduledValues(t);
      oldG.gain.setValueAtTime(oldG.gain.value, t);
      oldG.gain.linearRampToValueAtTime(0, t + 2);
      setTimeout(() => { try { old.stop(); } catch { } }, 2600);
    }
    const src = state.ctx.createBufferSource();
    src.buffer = surfBuffer(p);
    src.loop = true;
    const g = state.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(SOUND_PLACES[p].surfGain, t + 2);
    src.connect(g).connect(master);
    src.start();
    state.source = src;
    surfGain = g;
  }

  function startRustle(p) {
    const sr = state.ctx.sampleRate;
    const d = DSP.renderRustleLoop(sr, {}, rng);
    const b = state.ctx.createBuffer(2, d.left.length, sr);
    b.getChannelData(0).set(d.left);
    b.getChannelData(1).set(d.right);
    rustleSrc = state.ctx.createBufferSource();
    rustleSrc.buffer = b;
    rustleSrc.loop = true;
    rustleGain = state.ctx.createGain();
    rustleGain.gain.value = SOUND_PLACES[p].rustle;
    rustleSrc.connect(rustleGain).connect(master);
    rustleSrc.start();
  }

  function playOne() {
    const p = SOUND_PLACES[place];
    const r = rng();
    let data, gain;
    if (p.putter && r < p.putterChance) { data = DSP.renderPutter(state.ctx.sampleRate, rng); gain = p.putterGain; }
    else if (rng() < p.koel) { data = DSP.renderKoel(state.ctx.sampleRate, rng); gain = p.birdGain * (0.6 + rng() * 0.8); }
    else { data = DSP.renderGull(state.ctx.sampleRate, rng); gain = p.birdGain * (0.7 + rng() * 0.8); }
    const b = state.ctx.createBuffer(1, data.length, state.ctx.sampleRate);
    b.getChannelData(0).set(data);
    const src = state.ctx.createBufferSource();
    src.buffer = b;
    const g = state.ctx.createGain();
    g.gain.value = gain;
    if (state.ctx.createStereoPanner) {
      const pan = state.ctx.createStereoPanner();
      pan.pan.value = rng() * 1.6 - 0.8;
      src.connect(g).connect(pan).connect(master);
    } else src.connect(g).connect(master);
    src.start();
  }

  function scheduleOne() {
    if (!state.on) return;
    birdTimer = setTimeout(() => { playOne(); scheduleOne(); }, (18 + rng() * 32) * 1000);
  }

  function on(p) {
    place = p;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    state.ctx = ctx;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    state.gain = master;
    startSurf(place);
    startRustle(place);
    ctx.resume();
    state.on = true;
    scheduleOne();
  }

  function off() {
    clearTimeout(birdTimer);
    try { state.source?.stop(); rustleSrc?.stop(); } catch { }
    state.ctx?.close();
    state.ctx = null; state.source = null; state.gain = null;
    master = null; rustleSrc = null; rustleGain = null; surfGain = null;
    for (const k in buffers) delete buffers[k];
    state.on = false;
  }

  function setPlace(p) {
    place = p;
    if (!state.on) return;
    startSurf(p);
    const t = state.ctx.currentTime;
    rustleGain.gain.cancelScheduledValues(t);
    rustleGain.gain.setValueAtTime(rustleGain.gain.value, t);
    rustleGain.gain.linearRampToValueAtTime(SOUND_PLACES[p].rustle, t + 2);
  }

  return { state, toggle: p => { state.on ? off() : on(p); return state.on; }, setPlace };
}
