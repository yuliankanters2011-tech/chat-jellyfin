// Runs against the same Jellyfin 12.4 container as docker-smoke.sh.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const base = process.argv[2];
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [], endpoints = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (path.includes('/ChatPlugin/')) endpoints.push(`${path}: ${response.status()}`);
  });
  try {
    await page.goto(base + '/web/index.html', { waitUntil: 'domcontentloaded' });
    // Jellyfin Web 12.4 uses the legacy sign-in screen within its modern app.
    const username = page.locator('#txtManualName');
    const manual = page.locator('.btnManual:visible');
    await page.waitForFunction(() => {
      const visible = element => element && element.getClientRects().length > 0;
      return visible(document.querySelector('#txtManualName')) || visible(document.querySelector('.btnManual'));
    }, null, { timeout: 40000 });
    if (!(await username.isVisible())) await manual.click();
    await username.fill('chat-test');
    await page.locator('#txtManualPassword').fill('chat-test-password');
    await page.locator('.manualLoginForm button[type=submit]').click();
    await page.waitForFunction(() => Boolean(window.ApiClient?.accessToken()), null, { timeout: 30000 });
    const button = page.locator('#jf-chat-button');
    await button.waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await button.count(), 1);
    await button.click();
    await page.locator('#jf-chat').waitFor({ state: 'visible' });
    await page.locator('[aria-label="Bericht"]').fill('Browser-test');
    await page.locator('[aria-label="Bericht versturen"]').click();
    await page.getByText('Browser-test', { exact: true }).waitFor({ state: 'visible' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await button.waitFor({ state: 'visible', timeout: 30000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.click();
    await page.locator('#jf-chat').waitFor({ state: 'visible' });
    console.log('Echte Jellyfin Web browser-test geslaagd.');
  } catch (error) {
    const state = await page.evaluate(() => {
      const button = document.querySelector('#jf-chat-button');
      const style = button && getComputedStyle(button);
      return { path: location.pathname + location.hash, scriptLoaded: !!window.__jellyfinChatLoaded,
        hasClient: !!window.ApiClient, signedIn: !!window.ApiClient?.accessToken(),
        button: button && { hidden: button.hidden, display: style.display, visibility: style.visibility, parent: button.parentElement?.className } };
    }).catch(() => null);
    console.error('Browserdiagnose:', JSON.stringify({ state, endpoints, errors, message: error.message }).slice(0, 3000));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
