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

  const requestedBudget = 1000; // ask for exactly 1000ms of virtual time
  await new Promise(resolve => {
    client.once('Emulation.virtualTimeBudgetExpired', resolve);
    client.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: requestedBudget });
  });
  await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });

  const actualDocTimeMs = await page.evaluate(() => performance.now());
  console.log('requested budget ms:', requestedBudget);
  console.log('actual document time ms:', actualDocTimeMs);
  console.log('ratio (actual/requested):', actualDocTimeMs / requestedBudget);

  await browser.close();
})();
