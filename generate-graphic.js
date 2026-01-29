import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 500 });
await page.goto(`file://${join(__dirname, 'feature-graphic.html')}`);
await page.screenshot({ 
  path: join(__dirname, 'feature-graphic.png'),
  type: 'png'
});

await browser.close();
console.log('Feature graphic saved: feature-graphic.png');
