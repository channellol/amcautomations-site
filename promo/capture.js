const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 30;
const DURATION_S = 19;
const OUT_DIR = path.join(__dirname, 'frames');
const RESTART_EVERY = 150; // recycle the browser periodically to avoid resource buildup

async function newSession(virtualTimeAlreadyElapsedMs) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    protocolTimeout: 180000,
    args: ['--disable-lcd-text', '--font-render-hinting=none'],
    defaultViewport: { width: 540, height: 960, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await page.goto('file://' + path.join(__dirname, 'promo.html'), { waitUntil: 'load' });
  await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  // fast-forward this fresh page to where we left off, in one jump
  if (virtualTimeAlreadyElapsedMs > 0) {
    await new Promise(resolve => {
      client.once('Emulation.virtualTimeBudgetExpired', resolve);
      client.send('Emulation.setVirtualTimePolicy', {
        policy: 'advance',
        budget: virtualTimeAlreadyElapsedMs,
      });
    });
    await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  }
  return { browser, page, client };
}

(async () => {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR);

  const totalFrames = FPS * DURATION_S;
  const frameMs = 1000 / FPS;

  let { browser, page, client } = await newSession(0);

  for (let i = 0; i < totalFrames; i++) {
    if (i > 0 && i % RESTART_EVERY === 0) {
      await browser.close();
      ({ browser, page, client } = await newSession(i * frameMs));
      console.log(`recycled browser at frame ${i}`);
    }

    await new Promise(resolve => {
      client.once('Emulation.virtualTimeBudgetExpired', resolve);
      client.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: frameMs });
    });
    await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });

    const framePath = path.join(OUT_DIR, `f${String(i).padStart(5, '0')}.png`);
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        await page.screenshot({ path: framePath });
        ok = true;
      } catch (e) {
        console.log(`retry frame ${i} (attempt ${attempt + 1}): ${e.message}`);
      }
    }
    if (!ok) throw new Error(`frame ${i} failed after retries`);
    if (i % 30 === 0) console.log(`frame ${i}/${totalFrames}`);
  }

  await browser.close();
  console.log('done capturing', totalFrames, 'frames');
})();
