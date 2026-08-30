const app = document.querySelector('#app');
app.innerHTML = `
  <canvas class="webgl" aria-label="Animated impressionist Kerala coastline"></canvas>
  <main>
    <section class="hero panel" id="hero"><div class="mist"></div><p class="eyebrow">Arabian Sea / Kerala</p><h1><span>Monsoon light</span><span>over golden shores</span></h1><p class="lede">A full-bleed drifting homage to Varkala cliffs, Kovalam coves, Marari sands and Alleppey backwaters—painted with broken tropical color.</p></section>
    <section class="story panel varkala"><div class="copy"><p class="kicker">Varkala</p><h2>Cliffs breathe rose and saffron through morning mist.</h2><p>Oversized type floats in like sea spray while coconut silhouettes sway above the tide.</p></div></section>
    <section class="liquid panel"><div class="ribbon"></div><h2>Liquid light dissolves each cove into the next.</h2></section>
    <section class="story panel kovalam"><div class="copy"><p class="kicker">Kovalam</p><h2>Turquoise waves fold into gold beneath leaning palms.</h2><p>Parallax tide bands move at different depths, echoing Monet's vibrating reflections.</p></div></section>
    <section class="story panel alleppey"><div class="copy"><p class="kicker">Alleppey</p><h2>Backwaters mirror the sky in dabs of blue, jade and pearl.</h2><p>The journey ends as sea, lagoon and light shimmer into one radiant waterscape.</p></div></section>
  </main>`;

const canvas = document.querySelector('.webgl');
const ctx = canvas.getContext('2d');
let width = 0, height = 0, scrollProgress = 0;
function resize(){ width = canvas.width = innerWidth * devicePixelRatio; height = canvas.height = innerHeight * devicePixelRatio; canvas.style.width = innerWidth+'px'; canvas.style.height = innerHeight+'px'; }
addEventListener('resize', resize); resize();

function dab(x,y,r,color,a=1){ ctx.globalAlpha=a; ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,r*1.9,r,Math.sin(x+y),0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
function paint(t){
  const s = scrollProgress, horizon = height*(.58 - s*.28);
  const sky = ctx.createLinearGradient(0,0,0,height); sky.addColorStop(0,'#ffc978'); sky.addColorStop(.42,'#ffe5a6'); sky.addColorStop(.75,'#40cddd'); sky.addColorStop(1,'#0a5271'); ctx.fillStyle=sky; ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#eab15b'; ctx.fillRect(0,horizon,width,height-horizon);
  const sea = ctx.createLinearGradient(0,horizon,0,height); sea.addColorStop(0,`rgba(67,210,216,${.7+s*.2})`); sea.addColorStop(1,'rgba(6,70,112,.92)'); ctx.fillStyle=sea; ctx.fillRect(0,horizon,width,height-horizon);
  for(let i=0;i<220;i++){ const x=((i*83 + t*.018*(i%7+1))%width); const y=(Math.sin(i*12.7+t*.001)*30+horizon+(i%90)/90*(height-horizon)); const hue=i%3===0?'255,236,177':i%3===1?'77,215,218':'20,112,129'; dab(x,y,18+(i%11)*2,`rgb(${hue})`,.13); }
  for(let i=0;i<22;i++){ const y=horizon+i*height*.028+Math.sin(t*.001+i)*14; ctx.strokeStyle=`rgba(255,245,207,${.28-i*.006})`; ctx.lineWidth=2+devicePixelRatio; ctx.beginPath(); for(let x=0;x<width;x+=40){ctx.lineTo(x,y+Math.sin(x*.012+t*.001+i)*10)} ctx.stroke(); }
  ctx.save(); ctx.translate(width*.13,height*.61); ctx.rotate(-.22+Math.sin(t*.001)*.035); ctx.fillStyle='rgba(8,61,42,.72)'; ctx.fillRect(-8,-height*.34,16,height*.38); for(let i=0;i<10;i++){ ctx.rotate((Math.PI*2)/10); ctx.beginPath(); ctx.ellipse(70,0,92,14,0,0,Math.PI*2); ctx.fill(); } ctx.restore();
  requestAnimationFrame(paint);
}
requestAnimationFrame(paint);

function update(){ scrollProgress = Math.min(1, scrollY / (innerHeight*1.8)); document.documentElement.style.setProperty('--scroll', scrollProgress.toFixed(3)); document.querySelectorAll('.panel').forEach(p=>{ const r=p.getBoundingClientRect(); p.style.setProperty('--reveal', Math.max(0, Math.min(1, 1-Math.abs(r.top-innerHeight*.25)/innerHeight)).toFixed(3)); }); }
addEventListener('scroll', update, {passive:true}); update();

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.to(':root',{ '--scroll': 1, ease:'none', scrollTrigger:{ trigger:'#hero', start:'top top', end:'+=180%', scrub:true, pin:true }});
  gsap.utils.toArray('.panel').forEach(panel => gsap.from(panel.querySelectorAll('h1 span,h2,p'), { y:80, opacity:0, filter:'blur(18px)', stagger:.08, scrollTrigger:{ trigger:panel, start:'top 70%', end:'center center', scrub:1 }}));
}
if (window.Lenis) { const lenis = new Lenis({lerp:.075,smoothWheel:true}); function raf(time){ lenis.raf(time); requestAnimationFrame(raf); } requestAnimationFrame(raf); }
