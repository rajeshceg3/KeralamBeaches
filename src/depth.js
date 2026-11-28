// The Long Coast: depth layer for the five shores.
// One small light at a time, found by turning the shore. Every find moves the
// sky from noon toward dusk. No counters, no lists, one card at a time.
const K = window.kerala, T = K.THREE, scene = K.scene, camera = K.camera, controls = K.controls, renderer = K.renderer, canvas = renderer.domElement;
const places = K.places, $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const V = a => new T.Vector3(a[0], a[1], a[2]);

/* ---------- content (every fact traced to a fetched source) ---------- */
const SHORES = [
  { // Kovalam
    dusk: 0xe9a98a,
    pearls: [
      { id: 'lamp', p: [-4, 11.6, -2], t: 'The lamp', b: 'Vizhinjam Lighthouse first shone on 30 June 1972. The tower is 36 metres tall, in red and white bands.' },
      { id: 'crescents', p: [-8, 2.6, -4.5], t: 'Three crescents', b: 'Rocky outcrops split Kovalam into Lighthouse, Hawah and Samudra beaches. Together they curve like one crescent.' },
      { id: 'fishers', p: [10, 2, 7], t: 'Fishers\u2019 shore', b: 'Hawah and Samudra beaches are still used by local fishermen. Hawah is also called Eve\u2019s Beach.' },
      { id: 'port', p: [-1, 1.7, 13], t: 'The old port', b: 'Vizhinjam was a busy seaport in the 18th and 19th centuries. Before the lighthouse, a flag mast on the hill may have marked it by day.' },
    ],
    hands: { p: [-4, 8.6, -2], t: 'The lamp', i: 'Drag to turn the beam. Find three boats.', done: 'The lamp sits 57 metres above the sea. Its lamps were changed to metal halide in 2003.' },
    secret: { p: [-11, 1.7, -3.6], r: 2.4, t: 'Halcyon Castle', b: 'The Regent Maharani Sethu Lakshmi Bayi built a beach resort here in the late 1920s. Kovalam\u2019s beach story began with it.' },
    lamps: [[-4, 10.9, -2]],
  },
  { // Varkala
    dusk: 0xd98466,
    pearls: [
      { id: 'cliff', p: [-6, 3.4, -1.2], t: 'The red cliff', b: 'The cliff runs 7.5 km along this coast. The Geological Survey of India declared it a National Geological Monument.' },
      { id: 'papanasam', p: [3, 1.3, 3], t: 'Papanasam', b: 'People say a dip in these waters washes away sins. It is a belief, and it gives the beach its other name.' },
      { id: 'temple', p: [12, 7, -5.5], t: 'Janardana Swami', b: 'The temple honours Vishnu. Local lore dates it to about 2,000 years ago and calls Varkala the Varanasi of the South.' },
      { id: 'balita', p: [-8, 2.4, 10], t: 'Balita', b: 'A first-century Greek sailing guide, the Periplus of the Erythraean Sea, names this place Balita.' },
    ],
    hands: { p: [4, 3, -1.4], t: 'Read the cliff', i: 'Drag up the face of the cliff.', done: 'Miocene to Pliocene. The cliff holds about 20 million years of coast.',
      layers: ['Sandstone beds of the Warkalli Formation, laid down 23 to 2.6 million years ago.', 'Tectonic movement lifted the beds. Erosion then cut them back into cliffs.', 'Laterite sits along with the beds. It is the rust red you see.'] },
    secret: { p: [-15.5, 1.3, -1.4], r: 2.6, t: 'The Varkala Tunnel', b: 'Two tunnels cut through the hills, 572 m and 720 m long, finished in 1877 and 1880. They carried goods along the waterway.' },
    lamps: [[12, 5.4, -5], [11, 5.4, -5.2]],
  },
  { // Alappuzha
    dusk: 0x9d8cb0,
    pearls: [
      { id: 'kettuvallam', follow: 'houseboat', p: [0, 2.7, 0], t: 'Kettuvallam', b: 'The hull is long wooden planks tied with coir, coconut fibre stuffed between. Bamboo and thatch make the roof.' },
      { id: 'paddy', p: [-10, 2, -17], t: 'Rice below the sea', b: 'Kuttanad grows rice 1.2 to 3 metres below sea level. People call it the Rice Bowl of Kerala.' },
      { id: 'lighthouse', p: [14, 9.6, -14.5], t: 'Lit in 1862', b: 'Alappuzha Lighthouse was first lit on 28 March 1862 with a coconut oil lamp. Its spiral staircase is teak.' },
      { id: 'snake', follow: 'snake', p: [0, 1.7, 0], t: 'Snake boat', b: 'The Nehru Trophy Boat Race has run on Punnamada Lake since 1952. Its stars are the chundan vallams, the snake boats.' },
    ],
    hands: { p: [0, 2.7, 0], follow: 'houseboat', t: 'Pole the houseboat', i: 'Drag sideways to push the pole.', done: 'A port and canals were built here under Raja Kesavadas. Spices travelled these waters.',
      stops: ['Planks lashed with coir. Fibre fills the gaps.', 'Long bamboo poles push the boat in shallow water.', 'Past the bank, rice grows below the sea.'] },
    secret: { p: [-11, 1.2, -4.6], r: 2.8, t: 'Pathiramanal', b: 'Sands of Night. Legend says a young Brahmin dived into Vembanad Lake and land rose from the water. Migratory birds visit the 10-acre island.' },
    lamps: [[14, 9.4, -14.5], [-8, 1.2, -14.5]],
  },
  { // Marari
    dusk: 0xe4a56a,
    pearls: [
      { id: 'canoe', p: [-6, 1.9, -2], t: 'Kamba and vala', b: 'Kambavala fishing is named for kamba, a canoe, and vala, a net.' },
      { id: 'floats', p: [7.3, 2.4, -3.5], t: 'Floats and sinkers', b: 'Floats on top and sinkers at the bottom hold the net upright in the water. Long coir ropes pull it in.' },
      { id: 'shoal', p: [0, 1.1, 7], t: 'The catch', b: 'Sardine, mackerel, anchovy, needlefish and pomfret are the usual catch.' },
      { id: 'village', p: [-12, 6.7, -9], t: 'Mararikulam', b: 'Marari takes its name from Mararikulam, a fishing village 11 km from Alappuzha.' },
    ],
    hands: { p: [0, 1.8, 3], t: 'Haul the net', i: 'Drag down, again and again, to pull the rope.', done: 'At least 30 fishers haul together, by hand, usually for two to four hours in the morning. The best season runs December to April.' },
    secret: { p: [-8, 5, -11], r: 2.6, t: 'From palm to rope', b: 'Coir is coconut fibre. The ropes that haul the net and the lashings on a houseboat come from the same palms.' },
    lamps: [[-6, 1.2, -2], [-1, 1.2, -2]],
  },
  { // Bekal
    dusk: 0xcf7f6a,
    pearls: [
      { id: 'gate', fort: [0, 2.3, 3.7], t: 'Finished in 1650', b: 'Hiriya Venkatappa Nayaka began the fort. Shivappa Nayaka of Keladi completed it in 1650.' },
      { id: 'bastion', fort: [8, 6.8, 3], t: 'Largest in Kerala', b: 'The fort spreads over 40 acres, the largest in Kerala. Round bastions jut from its laterite walls.' },
      { id: 'tank', fort: [-3, 4.5, -1], t: 'The water tank', b: 'Inside the walls sit a water tank, a magazine and a flight of steps up to an observation tower.' },
      { id: 'tower', fort: [0, 7.6, -1], t: 'The tower', b: 'Tipu Sultan built the observation tower. Mysore\u2019s hold ended in 1799, and the fort passed to the British East India Company.' },
    ],
    hands: { fort: [0, 2.2, 3.7], t: 'Climb the tower', i: 'Drag up to climb. At the top, drag sideways to turn.', done: 'From the top you can see Kanhangad, Pallikkara, Bekal, Mavval, Kottikkulam and Uduma.', towns: ['Kanhangad', 'Pallikkara', 'Bekal', 'Mavval', 'Kottikkulam', 'Uduma'] },
    secret: { fort: [0, 0.5, -4], r: 6, t: 'A keyhole', b: 'From above, the fort\u2019s plan is a keyhole, with a water tank and an observation tower. Kerala Tourism describes it so.' },
    lamps: [[8, 4.8, 3], [-8, 4.5, 3], [5, 4.4, 3.7]],
  },
];
const FINALE = { t: 'Five shores, one long light', b: 'Kovalam\u2019s lamp, Varkala\u2019s cliff, Alappuzha\u2019s water, Marari\u2019s net, Bekal\u2019s fort. Each shore keeps the light you gave it.' };

/* ---------- state ---------- */
let found = {}; try { found = JSON.parse(localStorage.getItem('kerala-depth-v1')) || {} } catch { }
const fset = i => new Set(found[places[i].id] || []);
const save = () => { try { localStorage.setItem('kerala-depth-v1', JSON.stringify(found)) } catch { } };
const total = () => places.reduce((n, _, i) => n + fset(i).size, 0);
let mode = 'orbit', G = null, refs = {}, proxies = [], lampSprites = [], anim = [], tweens = [];
let tLight = 0, tTarget = 0, override = null, idle = 0, glintOn = false, keyT = 0, pendingFinale = false, current = null, handsCtl = null, back = null;
const fortG = new T.Group(); fortG.position.set(0, .25, -3); fortG.rotation.y = -.2; fortG.updateMatrixWorld(true);

/* ---------- drawing helpers ---------- */
const mats = {};
const M = (c, o = {}) => { const k = c + JSON.stringify(o); return mats[k] || (mats[k] = new T.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...o })) };
function mesh(g, c, x, y, z, p) { const m = new T.Mesh(g, typeof c === 'number' ? M(c) : c); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (p || G).add(m); return m }
const box = (w, h, d, c, x, y, z, p) => mesh(new T.BoxGeometry(w, h, d), c, x, y, z, p);
const cyl = (r1, r2, h, c, x, y, z, p, n = 10) => mesh(new T.CylinderGeometry(r1, r2, h, n), c, x, y, z, p);
const sph = (r, c, x, y, z, p, sx = 1, sy = 1, sz = 1) => { const m = mesh(new T.IcosahedronGeometry(r, 2), c, x, y, z, p); m.scale.set(sx, sy, sz); return m };
const grp = (x, y, z, p) => { const g = new T.Group(); g.position.set(x, y, z); (p || G).add(g); return g };
function tex(draw) { const c = document.createElement('canvas'); c.width = c.height = 128; draw(c.getContext('2d')); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t }
function wob(x, cx, cy, r, seed, lw, col, sweep = .94) { x.beginPath(); for (let k = 0; k <= 44; k++) { const a = k / 44 * Math.PI * 2 * sweep + .5; const rr = r + Math.sin(a * 3 + seed) * 1.7 + Math.sin(a * 5 + seed * 2) * 1; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; k ? x.lineTo(px, py) : x.moveTo(px, py) } x.lineWidth = lw; x.strokeStyle = col; x.lineCap = 'round'; x.stroke() }
function glow(x, a) { const g = x.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, `rgba(255,240,190,${a})`); g.addColorStop(.5, `rgba(255,214,140,${a * .35})`); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128) }
const TEX = {
  pearl: tex(x => { glow(x, .8); wob(x, 64, 64, 24, 1, 8, 'rgba(70,45,25,.6)'); wob(x, 64, 64, 24, 1, 4, '#fffbe8'); wob(x, 64, 64, 16, 4, 2.5, 'rgba(255,255,255,.85)', .7); x.fillStyle = '#fffbe8'; x.beginPath(); x.arc(64, 64, 4, 0, 7); x.fill() }),
  hands: tex(x => { glow(x, .8); x.beginPath(); for (let k = 0; k < 60; k++) { const a = k * .28, r = 3 + k * .62; const px = 64 + Math.cos(a) * r, py = 64 + Math.sin(a) * r; k ? x.lineTo(px, py) : x.moveTo(px, py) } x.lineCap = 'round'; x.strokeStyle = 'rgba(70,45,25,.6)'; x.lineWidth = 8; x.stroke(); x.strokeStyle = '#fffbe8'; x.lineWidth = 4; x.stroke() }),
  glint: tex(x => { glow(x, .5); x.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? 7 : 30; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r) } x.closePath(); x.fillStyle = 'rgba(70,45,25,.5)'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#fffbe8'; x.stroke() }),
  lamp: tex(x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,236,170,1)'); g.addColorStop(.3, 'rgba(255,190,100,.55)'); g.addColorStop(1, 'rgba(255,160,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128) }),
};
const sprite = (t, s) => { const m = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, opacity: 0 })); m.scale.set(s, s, 1); m.renderOrder = 20; m.visible = false; scene.add(m); return m };
const pearlSp = sprite(TEX.pearl, .11), handsSp = sprite(TEX.hands, .12), glintSp = sprite(TEX.glint, .085);

/* ---------- shore models (only what depth needs) ---------- */
function kettuvallam() {
  const g = grp(1, .35, 4); g.rotation.y = -.3; g.scale.set(2.2, 1.5, 2.4);
  sph(1, 0x7e4a31, 0, 0, 0, g, 1.7, .22, .48); box(1.7, .1, .55, 0xcf9e58, 0, .12, 0, g);
  const roof = mesh(new T.CylinderGeometry(.7, .7, 2.5, 16, 1, false, 0, Math.PI), 0xbf9b61, 0, .7, 0, g); roof.rotation.z = Math.PI / 2;
  for (let i = 0; i < 12; i++)box(.035, .75, 1.2, 0x967340, -1.2 + i * .22, .55, 0, g);
  for (const x of [-.7, 0, .7])box(.5, .4, .04, 0x365d55, x, .55, .64, g);
  const pole = cyl(.025, .025, 2.4, 0xa9874f, .9, .6, .62, g, 6); pole.rotation.x = .5; refs.pole = pole;
  return g;
}
function lighthouseA() { const g = grp(14, 0, -14.5); for (let i = 0; i < 6; i++)cyl(.9 - i * .06, .96 - i * .06, 1.4, i % 2 ? 0xf6efe0 : 0xe9e1d0, 0, .9 + i * 1.4, 0, g, 18); cyl(.55, .55, .9, 0x4e7474, 0, 9.3, 0, g, 12); cyl(0, .8, .6, 0x934436, 0, 10.1, 0, g, 16); sph(1.8, 0x7b8170, 0, .2, 0, g, 1, .5, 1) }
function paddy() { for (let r = 0; r < 3; r++)for (let c = 0; c < 5; c++) { box(2.8, .12, 2, [0x8fb35e, 0x7ba350, 0x9bbb66][(r + c) % 3], -17 + c * 3.2, .22, -16.5 - r * 1.1 + 0, G) } }
function snakeBoat() { const g = grp(-6, .3, -3); box(9, .28, .62, 0x7c2f2a, 0, 0, 0, g); sph(.5, 0x7c2f2a, 4.5, .3, 0, g, 1, 1, .6); sph(.5, 0x7c2f2a, -4.5, .3, 0, g, 1, 1, .6); for (let i = 0; i < 14; i++) { box(.22, .34, .22, i % 2 ? 0xf2e4c6 : 0xd9b24c, -3.6 + i * .56, .3, .2 * (i % 2 ? 1 : -1), g) } refs.snake = g; anim.push((t) => { if (!K.motion) return; g.position.x = ((t * .7 + 16) % 36) - 18; g.position.y = .3 + Math.sin(t * 2) * .03 }); return g }
function dhow() { const g = grp(-8, .25, 10); g.rotation.y = .5; sph(1, 0x6b4630, 0, 0, 0, g, 2, .3, .55); cyl(.05, .05, 3.4, 0x5a3b28, 0, 1.6, 0, g, 6); const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(2.4, 0); sh.lineTo(0, 3); sh.closePath(); const s = mesh(new T.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }), 0xf1e3c2, 0, .3, 0, g); s.position.x = .1; refs.dhow = g }
function temple() { const g = grp(12, 4.7, -5.5); g.scale.setScalar(.9); box(3.4, 1.7, 3.2, 0xe6d3a8, 0, .85, 0, g); for (let i = 0; i < 4; i++)box(3 - i * .6, .55, 2.8 - i * .55, i % 2 ? 0xc1694a : 0xe6d3a8, 0, 2 + i * .55, 0, g); sph(.28, 0xe4b04a, 0, 4.4, 0, g); box(.5, .9, .08, 0x6e4a34, 0, .45, 1.62, g) }
function fishBoat(x, z, a) { const g = grp(x, .3, z); g.rotation.y = a; sph(1, 0x7e4a31, 0, 0, 0, g, 1.5, .22, .45); box(1.5, .1, .5, 0xcf9e58, 0, .1, 0, g); return g }
const BUILD = [
  () => { const L = [-4, 10.9, -2]; refs.lamp = L; },
  () => { temple(); dhow() },
  () => { refs.houseboat = kettuvallam(); lighthouseA(); paddy(); snakeBoat() },
  () => { const fish = []; for (let i = 0; i < 16; i++) { const f = sph(.28, 0x4b7f86, -3 + (i % 5) * 1.5, -.02, 6 + Math.floor(i / 5) * 1.3, G, 1.8, .08, .5); fish.push(f) } anim.push((t) => { if (!K.motion) return; fish.forEach((f, i) => { f.position.x += Math.sin(t * .6 + i) * .004; f.position.z += Math.cos(t * .5 + i * 2) * .004 }) }) },
  () => { },
];
function build(i) {
  if (G) { scene.remove(G); G.traverse(o => { if (o.geometry) o.geometry.dispose() }) }
  G = new T.Group(); scene.add(G); refs = {}; proxies = []; lampSprites = []; anim = []; BUILD[i]();
  const S = SHORES[i];
  const sp = new T.Mesh(new T.SphereGeometry(S.secret.r, 8, 6), new T.MeshBasicMaterial({ visible: false })); sp.position.copy(wpos(S.secret)); sp.userData.secret = true; G.add(sp); proxies.push(sp);
  for (const l of S.lamps) { const s = new T.Sprite(new T.SpriteMaterial({ map: TEX.lamp, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 })); s.scale.set(i === 4 ? 1.7 : 2.6, i === 4 ? 1.7 : 2.6, 1); s.position.set(...l); if (i === 4) { s.position.copy(fortG.localToWorld(V(l))) } G.add(s); lampSprites.push(s) }
  if (i === 2) { const s = new T.Sprite(new T.SpriteMaterial({ map: TEX.lamp, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 })); s.scale.set(2, 2, 1); refs.houseLamp = s; G.add(s); lampSprites.push(s) }
  glintOn = false; keyT = 0; idle = 0; tLight = tTarget = Math.min(1, fset(i).size / 6); override = null; current = null;
  pearlSp.material.opacity = handsSp.material.opacity = glintSp.material.opacity = 0; pearlSp.visible = handsSp.visible = glintSp.visible = false;
  grade(); K.invalidate();
}
function wpos(o) { if (o.fort) return fortG.localToWorld(V(o.fort)); const v = V(o.p || [0, 0, 0]); if (o.follow && refs[o.follow]) v.add(refs[o.follow].position); return v }

/* ---------- light: noon to dusk ---------- */
const DUSKH = new T.Color(0xffc9a0), NOONH = new T.Color(0xfff1d1), SUN0 = new T.Color(0xffdca2), SUN1 = new T.Color(0xff8f4a);
let seaMeshes = null;
function grade() {
  const i = K.selected, t = override ?? tLight, e = ease(clamp(t, 0, 1));
  const c = new T.Color(places[i].color).lerp(new T.Color(SHORES[i].dusk), e);
  const dk = document.body.classList.contains('dark');
  if (dk) c.set(0x1c2f40).lerp(new T.Color(0x3b3159), e * .9);
  scene.background = c; if (scene.fog) scene.fog.color.copy(c);
  K.sun.color.copy(SUN0).lerp(SUN1, e); K.sun.intensity = lerp(3.3, 2.9, e) * (dk ? .85 : 1);
  K.hemi.color.copy(NOONH).lerp(DUSKH, e); K.hemi.intensity = lerp(2, 1.7, e) * (dk ? .8 : 1);
  renderer.toneMappingExposure = lerp(1.18, 1.1, e) * (dk ? .82 : 1);
  const seen = new Set(), WAT = { '3d9294': 0x1f9fe0, '427f75': 0x2fb4cc };
  scene.traverse(o => { const m = o.isMesh && o.material; if (!m || !m.color || seen.has(m)) return; if (!m.userData.sea0 && WAT[m.color.getHexString()]) { m.userData.sea0 = m.color.clone(); m.userData.seaD = new T.Color(WAT[m.color.getHexString()]) } if (m.userData.sea0) { seen.add(m); m.color.copy(m.userData.sea0).lerp(m.userData.seaD, e); m.emissive.setRGB(0.0, 0.04, 0.05).multiplyScalar(e) } });
  const lamps = smooth(.7, 1, t); for (const s of lampSprites) s.material.opacity = lamps * .95;
  K.invalidate();
}

new MutationObserver(() => grade()).observe(document.body, { attributes: true, attributeFilter: ['class'] });

/* ---------- tweens ---------- */
function tween(ms, fn, done) { if (reduce) ms = 1; const tw = { t: 0, d: ms / 1000, fn, done }; tweens.push(tw); return tw }
function flyTo(pos, tgt, ms, done) { const p0 = camera.position.clone(), t0 = controls.target.clone(); return tween(ms, e => { camera.position.lerpVectors(p0, pos, e); controls.target.lerpVectors(t0, tgt, e); controls.update() }, done) }

/* ---------- card ---------- */
const ICON = {
  on: '<svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><path d="M2 11c4-3 8 2 12-1s5-3 8-1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M17 3l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  out: '<svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><path d="M9 4L3 10l6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 10c6-3 10 3 14 0s5-1 7-1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
const card = document.createElement('section'); card.id = 'moment'; card.hidden = true; card.setAttribute('aria-live', 'polite');
card.innerHTML = '<h2></h2><p></p><button type="button" id="m-btn"></button>'; document.querySelector('main').append(card);
const cue = document.createElement('div'); cue.id = 'cue'; cue.setAttribute('role', 'status'); document.body.append(cue);
const cH = card.querySelector('h2'), cP = card.querySelector('p'), cB = card.querySelector('button'); let cardAct = null;
function showCard(t, b, label, icon, act) { cH.textContent = t; cP.textContent = b; cB.innerHTML = ICON[icon] + '<span>' + label + '</span>'; cardAct = act; card.hidden = false; $('#story').style.visibility = 'hidden'; K.setLift(innerHeight <= 480 && innerWidth >= 480 ? .17 : 0); requestAnimationFrame(() => card.classList.add('in')); cB.focus({ preventScroll: true }) }
function setCardText(b) { cP.textContent = b }
function hideCard() { K.setLift(0); card.hidden = true; card.classList.remove('in'); $('#story').style.visibility = '' }
cB.addEventListener('click', () => cardAct && cardAct());
const foundChip = document.createElement('span'); foundChip.id = 'foundcount'; foundChip.setAttribute('aria-live', 'polite');
const posEl = document.querySelector('#position'); if (posEl) posEl.insertAdjacentElement('afterend', foundChip);
const paintFound = () => { foundChip.textContent = total() + ' of 30 found' };
paintFound();
const CUES = ['Turn the shore. Look for small lights.', 'Follow the red face of the cliff.', 'Drift along the channel.', 'Walk the shore where people work.', 'Circle the fort walls.'];
let cueTimer = 0; function say(text, ms = 5500) { cue.textContent = text; if (innerWidth <= 360) { const st = document.querySelector('#story'); if (st) cue.style.bottom = Math.round(innerHeight - st.getBoundingClientRect().top + 10) + 'px' } cue.classList.add('on'); clearTimeout(cueTimer); cueTimer = setTimeout(() => cue.classList.remove('on'), ms) }

/* ---------- finds ---------- */
function chime() { const s = K.sound; if (!s.on || !s.ctx) return; try { const c = s.ctx, t = c.currentTime; [660, 880, 1320].forEach((f, k) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t + k * .09); g.gain.linearRampToValueAtTime(.035, t + k * .09 + .03); g.gain.exponentialRampToValueAtTime(.0001, t + k * .09 + 1.1); o.connect(g).connect(c.destination); o.start(t + k * .09); o.stop(t + k * .09 + 1.2) }) } catch { } }
function markFound(i, id) {
  const s = fset(i); if (s.has(id)) return false; s.add(id); found[places[i].id] = [...s]; save();
  tTarget = Math.min(1, s.size / 6); paintFound(); chime(); idle = 0; glintOn = false;
  if (total() === 5 * 6) pendingFinale = true;
  if (s.size === 6 && !pendingFinale) setTimeout(() => say(i < 4 ? 'Dusk has come. The next shore is waiting.' : 'Dusk has come.', 6500), 1400);
  return true;
}
function openMoment(i, item, id, o = {}) {
  if (mode !== 'orbit' && !o.fromHands) return;
  mode = 'moment'; controls.enabled = false; current = null; pearlSp.visible = handsSp.visible = glintSp.visible = false;
  const fresh = markFound(i, id);
  if (!o.keepCam) { back = { p: camera.position.clone(), t: controls.target.clone() }; const P = o.at || wpos(item), dir = camera.position.clone().sub(controls.target); dir.y = Math.max(dir.y, 4); dir.normalize(); const tgt = P.clone(); tgt.y = Math.max(1.5, tgt.y); flyTo(tgt.clone().addScaledVector(dir, 26), tgt, 900) }
  showCard(item.t, item.b, 'Continue', 'on', () => closeMoment(i));
}
function closeMoment(i) {
  hideCard(); const done = () => { mode = 'orbit'; controls.enabled = true; canvas.focus({ preventScroll: true }); if (pendingFinale) { pendingFinale = false; mode = 'moment'; controls.enabled = false; showCard(FINALE.t, FINALE.b, 'Continue', 'on', () => { hideCard(); mode = 'orbit'; controls.enabled = true; canvas.focus({ preventScroll: true }) }) } };
  if (back) { const b = back; back = null; flyTo(b.p, b.t, 700, done) } else done();
}

/* ---------- surprises ---------- */
function reveal(i) {
  const S = SHORES[i].secret; if (fset(i).has('secret')) return;
  const g = grp(0, 0, 0), grow = (o, ms = 900) => { o.scale.setScalar(.001); tween(ms, e => { o.scale.setScalar(Math.max(.001, e)); K.invalidate() }) };
  if (i === 0) { const c = grp(-11.4, 1.1, -3.8, g); c.scale.setScalar(.7); box(2.6, 1.5, 1.7, 0xf0e2c0, 0, .75, 0, c); box(2.9, .2, 2, 0xd2b88a, 0, 1.55, 0, c); for (const x of [-1.2, 1.2]) { cyl(.45, .5, 2.1, 0xf0e2c0, x, 1.05, .9, c, 14); sph(.5, 0xe0b05a, x, 2.3, .9, c, 1, .8, 1) } for (const x of [-.6, 0, .6])box(.3, .5, .05, 0x365b60, x, .9, .9, c); grow(c) }
  if (i === 1) { const c = grp(-15.5, 0, -1.2, g); box(2.8, 2.9, .5, 0xb08c62, 0, 1.45, 0, c); cyl(1.1, 1.1, .3, 0x2a2420, 0, 1.6, .12, c, 16).rotation.x = Math.PI / 2; box(2.1, 1.6, .3, 0x2a2420, 0, .8, .14, c); grow(c) }
  if (i === 2) { const c = grp(-11, 0, -4.6, g); sph(2.4, 0x8cae62, 0, .0, 0, c, 1.4, .25, 1); for (const [x, z, s] of [[-1.2, .2, .9], [.6, -.4, 1.1], [1.5, .5, .8]]) { cyl(.07, .12, 2 * s, 0x916e45, x, .9 * s, z, c, 6); sph(.7 * s, 0x4f8a58, x, 2 * s, z, c, 1, .45, 1) } const birds = []; for (let k = 0; k < 7; k++) { const b = box(.5, .04, .16, 0xfdfaf0, 0, 0, 0, g); birds.push(b) } anim.push(t => { birds.forEach((b, k) => { const a = t * .8 + k * .9; b.position.set(-11 + Math.cos(a) * (3 + k % 3), 3 + Math.sin(t * 2 + k) * .3 + k * .12, -4.6 + Math.sin(a) * (3 + k % 3)); b.rotation.z = Math.sin(t * 9 + k) * .5; b.rotation.y = -a }) }); grow(c) }
  if (i === 3) { const nut = sph(.38, 0x6e4c2c, -8, 5, -10, g); const t0 = performance.now(); tween(1300, e => { const y = 5 - 4.7 * e * e; nut.position.y = Math.max(.35, y + (e > .85 ? Math.abs(Math.sin((e - .85) * 20)) * (1 - e) * 2 : 0)) }); const rope = cyl(.07, .07, 5, 0xb08a52, -6, .15, -8, g, 6); rope.rotation.z = Math.PI / 2; rope.rotation.y = .5; grow(rope, 1200) }
  if (i === 4) { const sh = new T.Shape(); const r = 6.2, w = 1.8, y0 = -Math.sqrt(r * r - w * w), a0 = Math.atan2(y0, w), a1 = Math.atan2(y0, -w); sh.moveTo(w, y0 - 7); sh.lineTo(w, y0); sh.absarc(0, 0, r, a0, a1 + Math.PI * 2, false); sh.lineTo(-w, y0 - 7); sh.closePath(); const r2 = 5.7, w2 = 1.3, yy = -Math.sqrt(r2 * r2 - w2 * w2), b0 = Math.atan2(yy, w2), b1 = Math.atan2(yy, -w2); const hole = new T.Path(); hole.moveTo(w2, yy - 7); hole.lineTo(w2, yy); hole.absarc(0, 0, r2, b0, b1 + Math.PI * 2, false); hole.lineTo(-w2, yy - 7); hole.closePath(); sh.holes.push(hole); const m = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: .9, depthWrite: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(0, .45, 0); const holder = new T.Group(); holder.add(m); holder.position.copy(fortG.localToWorld(V([0, 0, -2]))); holder.rotation.y = -.2; g.add(holder); m.renderOrder = 5; grow(holder, 1400) }
  openMoment(i, S, 'secret', { at: i === 4 ? wpos(S) : wpos(S), keepCam: i === 4 });
}

/* ---------- hands-on moments ---------- */
const HANDS = [
  // Kovalam: sweep the lamp's beam across three boats at dusk
  i => { let beam, boats = [], a = 0; const Lw = V(SHORES[0].lamps[0]);
    return {
      view: [[-3, 18, 30], [-3, 3, 6]], dusk: .9,
      enter() { const g = grp(Lw.x, Lw.y, Lw.z); const geo = new T.ConeGeometry(3.4, 26, 24, 1, true); geo.translate(0, -13, 0); geo.rotateX(-Math.PI / 2); const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: .34, depthWrite: false, side: T.DoubleSide })); g.add(m); beam = g; [[-.34, 12], [.05, 15], [.42, 12.5]].forEach(([ba, r]) => { const b = fishBoat(Lw.x + r * Math.sin(ba), Lw.z + r * Math.cos(ba), ba + 1.2); const l = new T.Sprite(new T.SpriteMaterial({ map: TEX.lamp, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 })); l.scale.set(3.4, 3.4, 1); l.position.y = 1; b.add(l); boats.push({ a: ba, hold: 0, lit: false, l, g: b }) }) },
      drag(dx) { a += dx * .006; beam.rotation.y = a },
      update(dt) { let n = 0; for (const b of boats) { const d = Math.abs(Math.atan2(Math.sin(a - b.a), Math.cos(a - b.a))); if (!b.lit && d < .1) { b.hold += dt; if (b.hold > .45) { b.lit = true; chime() } } else if (!b.lit) b.hold = Math.max(0, b.hold - dt); b.l.material.opacity = b.lit ? .95 : Math.min(.5, b.hold); if (b.lit) n++ } K.invalidate(); if (n === 3) this.finish() },
      exit() { G.remove(beam); beam.traverse(o => { if (o.geometry) o.geometry.dispose() }); boats.forEach(b => G.remove(b.g)) },
    } },
  // Varkala: scan up the cliff face
  i => { let band, y = .4, seen = new Set(), cps = [1, 2.6, 4.1], marks = []; const H = SHORES[1].hands;
    return {
      view: [[0, 5.2, 17], [0, 2.6, -3]],
      enter() { band = box(34, .5, .05, 0xffffff, 0, y, -1.0, G); band.material = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .92, depthWrite: false }); band.castShadow = false },
      drag(dx, dy) { y = clamp(y - dy * .02, .3, 4.9); for (const c of cps) { const d = c - y; if (Math.abs(d) < .5 && !seen.has(c)) y += d * .2 } band.position.y = y; K.invalidate() },
      update() { cps.forEach((c, k) => { if (!seen.has(c) && Math.abs(c - y) < .22) { seen.add(c); setCardText(H.layers[k]); chime(); const m = box(34, .1, .04, 0xffd978, 0, c, -1.0, G); m.material = new T.MeshBasicMaterial({ color: 0xffd978, transparent: true, opacity: .7, depthWrite: false }); marks.push(m) } }); if (seen.size === 3) this.finish() },
      exit() { [band, ...marks].forEach(m => G.remove(m)) },
    } },
  // Alappuzha: pole the kettuvallam along the canal
  i => { let x = -13, tot = 0, shown = new Set(), z0, p0, r0; const stops = [-5, 3, 10.5], H = SHORES[2].hands;
    return {
      view: [[-9, 8, 20], [-12, 1, 1]],
      enter() { const b = refs.houseboat; p0 = b.position.clone(); r0 = b.rotation.y; b.position.set(x, .35, 2); b.rotation.y = 0 },
      drag(dx) { tot += Math.abs(dx); x = clamp(-13 + tot * .028, -13, 11); const b = refs.houseboat; b.position.x = x; refs.pole.rotation.x = .5 + Math.sin(tot * .05) * .35; K.invalidate() },
      update(dt) { const b = refs.houseboat; if (!tweens.length) { camera.position.x += (x + 1 - camera.position.x) * .12; controls.target.x += (x - controls.target.x) * .12; camera.lookAt(controls.target) } b.position.y = .35 + Math.sin(performance.now() / 500) * .03; stops.forEach((s, k) => { if (!shown.has(k) && x >= s) { shown.add(k); setCardText(H.stops[k]); chime() } }); K.invalidate(); if (x >= 10.5 && shown.size === 3) this.finish() },
      exit() { const b = refs.houseboat, tg = p0, ro = r0; tween(700, e => { b.position.lerp(tg, e * .3 + .05); b.rotation.y = lerp(b.rotation.y, ro, .15) }, () => { b.position.copy(tg); b.rotation.y = ro; K.invalidate() }) },
    } },
  // Marari: haul the shore seine
  i => { let p = 0, floats = [], ropes = [], crew = [], tot = 0;
    const anchors = [[-5.5, 0], [5.5, 0]];
    return {
      view: [[0, 12, 24], [0, 0, 5]],
      enter() { for (let k = 0; k < 15; k++)floats.push(sph(.22, k % 2 ? 0xf2e4c6 : 0xd9704c, 0, .12, 0, G)); for (let k = 0; k < 2; k++) { const r = cyl(.06, .06, 1, 0xb08a52, 0, .15, 0, G, 5); ropes.push(r) } anchors.forEach(([ax], k) => { const cr = grp(ax, 0, 1.2); for (let m = 0; m < 4; m++) { const f = grp((k ? -1 : 1) * m * .9, 0, 0, cr); cyl(.16, .2, 1.1, [0x365d55, 0xb55a3c, 0x3a4f7a, 0xd1aa61][m], 0, .75, 0, f, 7); sph(.22, 0xb98660, 0, 1.45, 0, f) } crew.push(cr) }); this.layout() },
      layout() { const zc = lerp(11, 3, ease(p)), w = lerp(5, 2, ease(p)), d = lerp(3, 1.3, ease(p)); floats.forEach((f, k) => { const t = k / (floats.length - 1); f.position.set(-w + 2 * w * t, .12, zc + d * Math.sin(Math.PI * t)) }); ropes.forEach((r, k) => { const a = V([anchors[k][0], .2, .6]), b = V([k ? w : -w, .15, zc]), len = a.distanceTo(b); r.scale.y = len; r.position.copy(a.clone().add(b).multiplyScalar(.5)); r.quaternion.setFromUnitVectors(V([0, 1, 0]), b.clone().sub(a).normalize()) }); crew.forEach((c, k) => { c.rotation.z = (k ? 1 : -1) * Math.sin(tot * .05) * .08 }) },
      drag(dx, dy) { if (dy > 0) { tot += dy; p = clamp(p + dy * .0011, 0, 1) } this.layout(); K.invalidate() },
      update() { if (p >= 1) this.finish() },
      exit() { [...floats, ...ropes, ...crew].forEach(o => G.remove(o)) },
    } },
  // Bekal: climb to the tower, then turn through the towns
  i => { let p = 0, yaw = 0, seen = new Set(), top, start; const H = SHORES[4].hands;
    return {
      view: [[0, 6, 19], [0, 3, -3]],
      enter() { top = fortG.localToWorld(V([0, 8.2, -1])); start = { p: camera.position.clone(), t: controls.target.clone() } },
      place() { const e = ease(p), pos = start.p.clone().lerp(top, e), look = start.t.clone().lerp(top.clone().add(V([Math.sin(yaw) * 10, -1.1, Math.cos(yaw) * 10])), e); camera.position.copy(pos); controls.target.copy(look); camera.lookAt(look); K.invalidate() },
      drag(dx, dy) { if (p < 1) { p = clamp(p - dy * .0022, 0, 1); if (p >= 1) setCardText('Drag sideways to turn.') } else yaw -= dx * .006; this.place(); if (p >= 1) { const k = ((Math.floor(((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * 6)) + 6) % 6; if (!seen.has(k)) { seen.add(k); cH.textContent = H.towns[k]; chime() } } },
      update() { if (seen.size === 6) this.finish() },
      exit() { },
    } },
];
function enterHands(i) {
  if (mode !== 'orbit') return; const S = SHORES[i], H = S.hands, ctl = HANDS[i](i);
  mode = 'hands'; handsCtl = ctl; controls.enabled = false; pearlSp.visible = handsSp.visible = glintSp.visible = false; current = null;
  back = { p: camera.position.clone(), t: controls.target.clone() };
  if (ctl.dusk) override = ctl.dusk;
  ctl.finish = () => { if (handsCtl !== ctl) return; handsCtl = null; ctl.exit(); override = null; mode = 'moment'; hideCard(); const b = back; back = null; const proceed = () => { openMoment(i, { t: H.t, b: H.done }, 'hands', { fromHands: true, keepCam: true }); back = b; }; proceed() };
  ctl.enter();
  showCard(H.t, H.i, 'Leave', 'out', () => leaveHands(i));
  if (ctl.view) flyTo(V(ctl.view[0]), V(ctl.view[1]), 900, () => { grade() });
  grade();
}
function leaveHands(i) { const c = handsCtl; if (!c) return; handsCtl = null; c.exit(); override = null; hideCard(); mode = 'moment'; const b = back; back = null; grade(); const fin = () => { mode = 'orbit'; controls.enabled = true; canvas.focus({ preventScroll: true }) }; if (b) flyTo(b.p, b.t, 700, fin); else fin() }

/* ---------- input ---------- */
let down = null, last = null, multi = false;
canvas.addEventListener('pointerdown', e => { idle = 0; tweens = tweens.filter(t => !t.nudge); if (down && performance.now() - down.t < 1500 && e.pointerId !== down.id) { multi = true; return } multi = false; down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; if (mode === 'hands') { try { canvas.setPointerCapture(e.pointerId) } catch { } } last = { x: e.clientX, y: e.clientY } }, true);
canvas.addEventListener('pointermove', e => { if (!down || e.pointerId !== down.id) return; if (mode === 'hands' && handsCtl) { handsCtl.drag(e.clientX - last.x, e.clientY - last.y); } last = { x: e.clientX, y: e.clientY } }, true);
const endPtr = e => { if (!down || e.pointerId !== down.id) { if (e.type === 'pointercancel') { down = null } return } const d = down; down = null; if (multi || e.type === 'pointercancel') return; if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 12 && performance.now() - d.t < 700) tap(e.clientX, e.clientY) };
canvas.addEventListener('pointerup', endPtr, true); canvas.addEventListener('pointercancel', endPtr, true);
canvas.addEventListener('wheel', () => { idle = 0 }, { passive: true });
canvas.addEventListener('keydown', e => {
  idle = 0;
  if (mode === 'hands' && handsCtl) { const k = { ArrowLeft: [-26, 0], ArrowRight: [26, 0], ArrowUp: [0, -26], ArrowDown: [0, 26] }[e.key]; if (k) { e.preventDefault(); e.stopImmediatePropagation(); handsCtl.drag(...k) } return }
  if ((e.key === 'Enter' || e.key === ' ') && mode === 'orbit') { e.preventDefault(); const c = current || nearest(); if (c) activate(c) }
}, true);
document.addEventListener('keydown', e => {
  if ((e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
  const t = e.target; if (t && /^(SELECT|INPUT|TEXTAREA)$/.test(t.tagName)) return;
  if (mode === 'hands') return;
  if (mode === 'moment') { if (e.key === 'ArrowRight' && !card.hidden) { e.preventDefault(); document.querySelector('#m-btn').click() } return }
  if (mode === 'orbit') { e.preventDefault(); document.querySelector(e.key === 'ArrowRight' ? '#next' : '#prev').click() }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); cardAct && cardAct() } });
function activate(c) { const i = K.selected; if (c.kind === 'hands') enterHands(i); else openMoment(i, c.item, c.item.id) }
const ray = new T.Raycaster(), pt = new T.Vector2();
function tap(x, y) {
  if (mode !== 'orbit' || document.querySelector('dialog[open]')) return;
  const r = canvas.getBoundingClientRect();
  if (current) { const v = current.pos.clone().project(camera), sx = (v.x + 1) / 2 * r.width + r.left, sy = (1 - v.y) / 2 * r.height + r.top; if (Math.hypot(sx - x, sy - y) < 46) { activate(current); return } }
  if (glintSp.visible) { const v = wpos(SHORES[K.selected].secret).project(camera), sx = (v.x + 1) / 2 * r.width + r.left, sy = (1 - v.y) / 2 * r.height + r.top; if (Math.hypot(sx - x, sy - y) < 46) { reveal(K.selected); return } }
  pt.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, camera);
  if (ray.intersectObjects(proxies, false).length && !fset(K.selected).has('secret')) reveal(K.selected);
}
function candidates() { const i = K.selected, S = SHORES[i], s = fset(i), out = []; for (const p of S.pearls) if (!s.has(p.id)) out.push({ kind: 'pearl', item: p, pos: wpos(p) }); if (!s.has('hands')) out.push({ kind: 'hands', item: { id: 'hands' }, pos: wpos(S.hands) }); return out }
function nearest() { let best = null, bd = 9; for (const c of candidates()) { const v = c.pos.clone().project(camera); const d = Math.hypot(v.x, v.y); if (d < bd) { bd = d; best = c } } return best }

/* ---------- frame ---------- */
let clock = 0;
let lastNow = 0;
K.hooks.push((dt0, now) => {
  const dt = lastNow ? Math.min(.3, (now - lastNow) / 1000) : dt0; lastNow = now;
  clock += dt; for (const f of anim) f(clock, dt); if (anim.length && K.motion) K.invalidate();
  let busy = tweens.length > 0 || mode === 'hands';
  for (let k = tweens.length - 1; k >= 0; k--) { const tw = tweens[k]; tw.t += dt; const e = ease(clamp(tw.t / tw.d, 0, 1)); tw.fn(e); if (tw.t >= tw.d) { tweens.splice(k, 1); tw.done && tw.done() } }
  if (tLight !== tTarget) { tLight += clamp(tTarget - tLight, -dt / 2.2, dt / 2.2); if (Math.abs(tLight - tTarget) < .002) tLight = tTarget; grade(); busy = true } else if (override != null) grade();
  if (mode === 'hands' && handsCtl) handsCtl.update(dt);
  if (refs.houseLamp && refs.houseboat) { refs.houseLamp.position.copy(refs.houseboat.position); refs.houseLamp.position.y += 1.6 }
  // lights found by turning
  const i = K.selected;
  if (mode === 'orbit' && !document.querySelector('dialog[open]')) {
    idle += dt;
    const cands = candidates(); let best = null, bd = 9;
    for (const c of cands) { const v = c.pos.clone().project(camera); if (v.z > 1) continue; const lim = current && current.item === c.item ? .75 : .6; if (Math.abs(v.x) < lim && Math.abs(v.y) < lim - .05) { const d = Math.hypot(v.x, v.y); if (d < bd) { bd = d; best = c } } }
    current = best;
    const sp = best ? (best.kind === 'hands' ? handsSp : pearlSp) : null;
    for (const s of [pearlSp, handsSp]) { const want = s === sp ? 1 : 0; s.material.opacity += (want - s.material.opacity) * Math.min(1, dt * 7); if (s === sp) { s.visible = true; s.position.copy(best.pos); const pulse = K.motion ? 1 + Math.sin(clock * 3) * .08 : 1; s.scale.setScalar((s === handsSp ? .12 : .11) * pulse) } else if (s.material.opacity < .02) s.visible = false }
    if (sp || pearlSp.visible || handsSp.visible) K.invalidate();
    // the surprise glint appears only when the shore has little else left
    const rest = cands.length;
    if (rest === 0 && idle > 12 && !fset(i).has('secret')) glintOn = true;
    if (glintOn && !fset(i).has('secret')) { const P = wpos(SHORES[i].secret); glintSp.position.copy(P); const v = P.clone().project(camera); const vis = v.z < 1 && Math.abs(v.x) < .8 && Math.abs(v.y) < .8; glintSp.visible = vis; glintSp.material.opacity += ((vis ? .9 : 0) - glintSp.material.opacity) * Math.min(1, dt * 6); glintSp.scale.setScalar(.085 * (K.motion ? 1 + Math.sin(clock * 4) * .12 : 1)); K.invalidate() } else glintSp.visible = false;
    // keyhole: look straight down at Bekal from afar
    if (i === 4 && !fset(i).has('secret')) { const off = camera.position.clone().sub(controls.target), pol = Math.acos(off.y / off.length()); if (pol < .5 && off.length() > 22) { keyT += dt; if (keyT > 1.4) { keyT = 0; reveal(4) } } else keyT = 0 }
    // gentle nudge toward the next light after a long pause
    const need = cands.length > 0 || !fset(i).has('secret');
    if (need && !K.depth.noNudge && !tweens.length && idle > (cands.length ? 28 : 16) && !reduce) { idle = -12; nudge(cands) }
  } else { for (const s of [pearlSp, handsSp, glintSp]) if (s.visible && mode !== 'orbit') { s.material.opacity = Math.max(0, s.material.opacity - dt * 8); if (s.material.opacity < .02) s.visible = false } }
  K.fast = busy;
});
function nudge(cands) {
  const i = K.selected; let P, tilt = false;
  if (cands.length) { const c = cands.find(c => { const v = c.pos.clone().project(camera); return !(Math.abs(v.x) < .5 && Math.abs(v.y) < .5) }) || cands[0]; P = c.pos } else { P = wpos(SHORES[i].secret); if (i === 4) tilt = true }
  const off = camera.position.clone().sub(controls.target), sph = new T.Spherical().setFromVector3(off);
  const T0 = controls.target.clone(), tgt = T0.clone().lerp(P, .4); tgt.y = lerp(T0.y, Math.max(2, P.y * .5), .4);
  const az = Math.atan2(P.x - T0.x, P.z - T0.z); sph.theta = az + .35; if (tilt) { sph.phi = .45; sph.radius = Math.max(sph.radius, 30) }
  const pos = tgt.clone().add(new T.Vector3().setFromSpherical(sph)); flyTo(pos, tgt, 2600).nudge = true;
}
window.addEventListener('shore-built', e => { tweens.length = 0; handsCtl = null; mode = 'orbit'; back = null; controls.enabled = true; hideCard(); build(e.detail.index); const i = e.detail.index; K.fitZoom = (i === 4 && innerWidth <= 480) ? .86 : (i === 2 && innerWidth > 768 ? .88 : (i === 4 && innerHeight <= 480 && innerWidth >= 480 ? 1.3 : ((i === 0 || i === 2) && innerHeight <= 480 && innerWidth >= 480 ? .93 : 1))); K.landOff = (i === 4) ? .06 : i === 0 ? -.11 : i === 2 ? .08 : .1; K.refit(); if (fset(i).size === 0) setTimeout(() => { if (K.selected === i && fset(i).size === 0) say(CUES[i] || '') }, 1800) });
build(K.selected);
if (fset(K.selected).size === 0) setTimeout(() => say(CUES[K.selected] || ''), 1800);
window.kerala.depth = { setOverride(v) { override = v; grade() }, setIdle(v) { idle = v }, get idleNow() { return idle }, SHORES, fset, found: () => found, reveal, enterHands, activate, candidates, get mode() { return mode }, get tw() { return tweens.length + ":" + !!back + ":" + K.fast },  get light() { return tLight }, total, wpos, markFound, nudge, get current() { return current }, fortG };
