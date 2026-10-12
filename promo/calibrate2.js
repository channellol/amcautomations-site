const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    protocolTimeout: 120000,
    defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await page.goto('file://' + path.join(__dirname, 'promo.html'), { waitUntil: 'load' });
  await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });

  const frameMs = 1000 / 30;
  const steps = 90; // should total 3000ms
  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => {
      client.once('Emulation.virtualTimeBudgetExpired', resolve);
      client.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: frameMs });
    });
    await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
    await page.screenshot({ path: '/tmp/calib_frame.png' }); // simulate real workload
  }

  const actualDocTimeMs = await page.evaluate(() => performance.now());
  console.log('requested total ms:', steps * frameMs);
  console.log('actual document time ms:', actualDocTimeMs);
  console.log('ratio:', actualDocTimeMs / (steps * frameMs));

  await browser.close();
})();
