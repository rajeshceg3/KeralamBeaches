const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const SOURCES = {
  kovalam: 'https://www.keralatourism.org/destination/kovalam-beach/236/',
  lighthouse: 'https://www.keralatourism.org/destination/lighthouse-beach-kovalam/432/',
  varkala: 'https://www.keralatourism.org/destination/varkala-beach/328/',
  alappuzha: 'https://www.keralatourism.org/destination/alappuzha-beach/60/',
  marari: 'https://www.keralatourism.org/destination/marari-beach/613/',
  bekal: 'https://www.keralatourism.org/destination/bekal-kasaragod/259/',
  bekalfort: 'https://www.keralatourism.org/destination/bekal-fort/303/'
};

const CHAPTERS = [
  {
    id: 'kovalam', place: 'Kovalam',
    headline: 'Three crescents cup the tide into stillness - a rocky headland breaks the swell, and the bay behind it turns to glass.',
    cue: 'Why the water stays calm',
    facts: [
      'Three crescent beaches in a row, their rocky headland taming the Arabian Sea into a sheltered bay.',
      'The red-and-white Vizhinjam lighthouse has stood here since 1972; climb its 36 metres for the full curve of the coast.',
      'Kindest from November to March.'
    ]
  },
  {
    id: 'varkala', place: 'Varkala',
    headline: 'Red cliffs lean over a sea that forgives - laterite walls holding the beach in a natural amphitheatre of wind and spray.',
    cue: 'The cliffs that shouldn\u2019t exist',
    facts: [
      'Kerala Tourism calls this the only place in southern Kerala where cliffs stand against the sea - a national geological monument known to geologists as the Varkala Formation.',
      'Below is Papanasam, "destruction of sins", where pilgrims have bathed for centuries beside the ancient Janardhana Swamy temple.',
      'Sunset from the cliff edge is the daily ceremony.'
    ]
  },
  {
    id: 'alappuzha', place: 'Alappuzha',
    headline: 'The sea steps back and the lagoons begin - water streets where the roads should be.',
    cue: 'Nine hundred kilometres of still water',
    facts: [
      'Behind the beach, one labyrinth of canals, lakes and inlets runs over 900 kilometres - the "Venice of the East".',
      'Drift it on a kettuvallam, a houseboat built by hand from bamboo, coir and wood, meals cooked on board as village life slides past.',
      'Snake boats race for the Nehru Trophy each August; the cruising season is October to March.'
    ]
  },
  {
    id: 'marari', place: 'Marari',
    headline: 'The beach that kept its quiet - palms, sand and time, named for the fishing village of Mararikulam.',
    cue: 'What the quiet is made of',
    facts: [
      'A working fishing shore: Kerala Tourism notes the beach has no shacks and no water sports, and that absence is the luxury.',
      'Cycle into the village and watch the fishermen at work; if they judge the sea safe, a conversation can end in a boat ride.',
      'The Alappuzha backwaters, Kumarakom Bird Sanctuary and the International Coir Museum sit within easy reach.'
    ]
  },
  {
    id: 'bekal', place: 'Bekal',
    headline: 'A stone giant stands watch over gold - history above, emptiness below.',
    cue: 'The fort that guards the beach',
    facts: [
      'Kerala\u2019s largest and best-preserved fort: laterite slabs in a unique polygonal plan, observation towers over the Arabian Sea.',
      'Below the ramparts, a beach so wide it rarely feels occupied.',
      'Come at sunset, when the sky runs orange and pink and the fort turns to silhouette.'
    ]
  }
];

const app = document.querySelector('#app');
app.innerHTML = `
  <canvas class="webgl" aria-label="Animated impressionist painting of the Kerala coastline"></canvas>
  <main>
    <section class="hero panel" id="hero">
      <div class="mist"></div>
      <h1><span>Five shores,</span><span>one long light</span></h1>
      <p class="lede">A painted journey up Kerala's coast - each beach rendered in broken tropical colour, each with its true story folded inside.</p>
    </section>
    ${CHAPTERS.map(c => `
    <section class="story panel ${c.id}" id="${c.id}">
      <div class="copy">
        <h2>${c.place}</h2>
        <p class="story-lede">${c.headline}</p>
        <div class="deeper-wrap">
          <button class="deeper" type="button" aria-expanded="false" aria-controls="deep-${c.id}"><span class="pulse" aria-hidden="true"></span>${c.cue}</button>
          <div class="deep" id="deep-${c.id}" hidden>
            ${c.facts.map(f => `<p>${f}</p>`).join('')}
          </div>
        </div>
      </div>
    </section>`).join('')}
    <section class="outro panel" id="outro">
      <div class="copy">
        <h2>Charted, not imagined.</h2>
        <p class="story-lede">Every fact folded into these shores was checked against Kerala Tourism's destination notes. The painting itself is made live in your browser - no photographs were used.</p>
        <ul class="sources">
          <li><a href="${SOURCES.kovalam}" target="_blank" rel="noopener">Kovalam</a> &amp; <a href="${SOURCES.lighthouse}" target="_blank" rel="noopener">Lighthouse Beach</a></li>
          <li><a href="${SOURCES.varkala}" target="_blank" rel="noopener">Varkala &amp; Papanasam</a></li>
          <li><a href="${SOURCES.alappuzha}" target="_blank" rel="noopener">Alappuzha</a> &amp; <a href="${SOURCES.marari}" target="_blank" rel="noopener">Marari</a></li>
          <li><a href="${SOURCES.bekal}" target="_blank" rel="noopener">Bekal</a> &amp; <a href="${SOURCES.bekalfort}" target="_blank" rel="noopener">Bekal Fort</a></li>
        </ul>
      </div>
    </section>
  </main>`;

// Progressive disclosure - clutter stays folded until invited.
document.querySelectorAll('.deeper').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
    if (!open && !reduceMotion) {
      panel.classList.remove('shown');
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('shown')));
    } else if (!open) {
      panel.classList.add('shown');
    }
  });
});

// --- The living painting: one canvas, a palette per shore ---
const PALETTES = [
  { sky0: '#ffc978', sky1: '#ffe5a6', sea0: '#40cddd', sea1: '#0a5271', sand: '#eab15b' }, // hero: monsoon gold
  { sky0: '#ffd98e', sky1: '#fff3c9', sea0: '#4fd8d2', sea1: '#0b5e78', sand: '#f0bc62' }, // kovalam: turquoise
  { sky0: '#ffb27a', sky1: '#ffe1b3', sea0: '#38b8c8', sea1: '#0a4a63', sand: '#c96b4a' }, // varkala: laterite rose
  { sky0: '#cfe8d8', sky1: '#fff6d8', sea0: '#3fbfae', sea1: '#0c5a63', sand: '#d9c489' }, // alappuzha: jade backwater
  { sky0: '#ffe9b8', sky1: '#fff8e2', sea0: '#57d3cc', sea1: '#14637c', sand: '#f2cd7d' }, // marari: pearl quiet
  { sky0: '#ff9e6b', sky1: '#ffd9a0', sea0: '#2ea8b8', sea1: '#0a4258', sand: '#e8a95c' }, // bekal: sunset ember
  { sky0: '#ffc978', sky1: '#ffe5a6', sea0: '#40cddd', sea1: '#0a5271', sand: '#eab15b' }  // outro: home gold
];
function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mix(a, b, t) { return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t)); }
const PALETTE_RGB = PALETTES.map(p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, hexRgb(v)])));
function lerpPalette(p) {
  const x = Math.max(0, Math.min(1, p)) * (PALETTE_RGB.length - 1);
  const i = Math.min(PALETTE_RGB.length - 2, Math.floor(x));
  const t = x - i, A = PALETTE_RGB[i], B = PALETTE_RGB[i + 1], out = {};
  for (const k of Object.keys(A)) out[k] = `rgb(${mix(A[k], B[k], t).join(',')})`;
  return out;
}

const canvas = document.querySelector('.webgl');
const ctx = canvas.getContext('2d');
let width = 0, height = 0, scrollProgress = 0, journey = 0;
function resize(){ width = canvas.width = innerWidth * devicePixelRatio; height = canvas.height = innerHeight * devicePixelRatio; canvas.style.width = innerWidth+'px'; canvas.style.height = innerHeight+'px'; }
addEventListener('resize', resize); resize();

function dab(x,y,r,color,a=1){ ctx.globalAlpha=a; ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,r*1.9,r,Math.sin(x+y),0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
function paint(t){
  const s = scrollProgress, pal = lerpPalette(journey), horizon = height*(.58 - s*.28);
  const sky = ctx.createLinearGradient(0,0,0,height); sky.addColorStop(0,pal.sky0); sky.addColorStop(.42,pal.sky1); sky.addColorStop(.75,pal.sea0); sky.addColorStop(1,pal.sea1); ctx.fillStyle=sky; ctx.fillRect(0,0,width,height);
  ctx.fillStyle=pal.sand; ctx.fillRect(0,horizon,width,height-horizon);
  const sea = ctx.createLinearGradient(0,horizon,0,height); sea.addColorStop(0,pal.sea0); sea.addColorStop(1,pal.sea1); ctx.fillStyle=sea; ctx.fillRect(0,horizon,width,height-horizon);
  for(let i=0;i<220;i++){ const x=((i*83 + t*.018*(i%7+1))%width); const y=(Math.sin(i*12.7+t*.001)*30+horizon+(i%90)/90*(height-horizon)); const hue=i%3===0?'255,236,177':i%3===1?'77,215,218':'20,112,129'; dab(x,y,18+(i%11)*2,`rgb(${hue})`,.13); }
  for(let i=0;i<22;i++){ const y=horizon+i*height*.028+Math.sin(t*.001+i)*14; ctx.strokeStyle=`rgba(255,245,207,${.28-i*.006})`; ctx.lineWidth=2+devicePixelRatio; ctx.beginPath(); for(let x=0;x<width;x+=40){ctx.lineTo(x,y+Math.sin(x*.012+t*.001+i)*10)} ctx.stroke(); }
  ctx.save(); ctx.translate(width*.13,height*.61); ctx.rotate(-.22+Math.sin(t*.001)*.035); ctx.fillStyle='rgba(8,61,42,.72)'; ctx.fillRect(-8,-height*.34,16,height*.38); for(let i=0;i<10;i++){ ctx.rotate((Math.PI*2)/10); ctx.beginPath(); ctx.ellipse(70,0,92,14,0,0,Math.PI*2); ctx.fill(); } ctx.restore();
  if (!reduceMotion) requestAnimationFrame(paint);
}
requestAnimationFrame(paint);

function update(){
  scrollProgress = Math.min(1, scrollY / (innerHeight*1.8));
  const range = document.documentElement.scrollHeight - innerHeight;
  journey = range > 0 ? Math.min(1, scrollY / range) : 0;
  document.documentElement.style.setProperty('--scroll', scrollProgress.toFixed(3));
  document.querySelectorAll('.panel').forEach(p=>{ const r=p.getBoundingClientRect(); p.style.setProperty('--reveal', Math.max(0, Math.min(1, 1-Math.abs(r.top-innerHeight*.25)/innerHeight)).toFixed(3)); });
  if (reduceMotion) paint(0);
}
addEventListener('scroll', update, {passive:true}); update();

if (!reduceMotion && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.to(':root',{ '--scroll': 1, ease:'none', scrollTrigger:{ trigger:'#hero', start:'top top', end:'+=180%', scrub:true, pin:true }});
  gsap.utils.toArray('.panel').forEach(panel => gsap.from(panel.querySelectorAll('h1 span,h2,.story-lede,.deeper'), { y:80, opacity:0, filter:'blur(18px)', stagger:.08, scrollTrigger:{ trigger:panel, start:'top 70%', end:'center center', scrub:1 }}));
}
if (!reduceMotion && window.Lenis) { const lenis = new Lenis({lerp:.075,smoothWheel:true}); function raf(time){ lenis.raf(time); requestAnimationFrame(raf); } requestAnimationFrame(raf); }
