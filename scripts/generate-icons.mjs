// Renders public/icon.svg to the PNG sizes the PWA manifest needs (uses Playwright's Chromium).
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: fileURLToPath(new URL(`../public/icon-${size}.png`, import.meta.url)), omitBackground: true });
}
await browser.close();
console.log('icons written');
