// Loads the static site, visits all five shores, and fails on page errors or missing depth UI.
const pp = require('puppeteer-core'), { spawn } = require('child_process'), assert = require('assert');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const PORT = 8765, W = +(process.env.WIDTH || 390), H = W < 700 ? 844 : 900;
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { stdio: 'ignore' });
  await sleep(800);
  const b = await pp.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    const p = await b.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await p.setViewport({ width: W, height: H, isMobile: W < 700, hasTouch: W < 700 });
    await p.goto('http://localhost:' + PORT + '/index.html');
    await p.waitForSelector('canvas[data-ready=true]', { timeout: 40000 });
    await sleep(1000);
    for (let i = 0; i < 5; i++) {
      await p.evaluate(i => kerala.select(i), i);
      await sleep(2500);
      const cue = await p.evaluate(() => (document.querySelector('#cue') || {}).textContent);
      assert(cue && cue.length > 3, 'shore ' + i + ' has a cue');
    }
    const found = await p.evaluate(() => (document.querySelector('#foundcount') || {}).textContent);
    assert(/of 30 found/.test(found), 'found counter present');
    assert.deepStrictEqual(errs, [], 'no page errors: ' + errs.join(' | '));
    console.log('static check ok at ' + W);
  } finally { await b.close(); srv.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
