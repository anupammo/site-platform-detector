// End-to-end smoke test: loads the unpacked extension, opens popup.html against
// a fixture tab and checks the rendered result. Screenshots go to $SHOT_DIR.
// activeTab can't be granted without a real toolbar click, so the test copy of
// the extension gets a temporary host permission.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const fixtures = require('./fixtures');
const ROOT = path.join(__dirname, '..');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wfd-'));
  for (const f of fs.readdirSync(ROOT)) if (!['.git', 'tests', 'node_modules'].includes(f)) fs.cpSync(path.join(ROOT, f), path.join(tmp, f), { recursive: true });
  const m = JSON.parse(fs.readFileSync(path.join(tmp, 'manifest.json'), 'utf8'));
  m.host_permissions = ['<all_urls>'];
  fs.writeFileSync(path.join(tmp, 'manifest.json'), JSON.stringify(m));

  const ctx = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium', args: [`--disable-extensions-except=${tmp}`, `--load-extension=${tmp}`] });
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const extId = sw.url().split('/')[2];
  await new Promise(r => setTimeout(r, 800));
  for (const p of ctx.pages()) if (!p.url().startsWith('about:')) await p.close(); // onInstalled product page

  const pick = (process.argv[2] || 'Astra,Shopify,Noindex,Next.js').split(',');
  let failed = 0;
  for (const key of pick) {
    const fx = fixtures.find(f => f.name.includes(key));
    const origin = 'https://' + (fx.host || 'fixture.test');
    await ctx.route(origin + '/**', (route) => {
      const u = new URL(route.request().url());
      const file = (fx.files || {})[u.pathname];
      if (u.pathname === '/') return route.fulfill({ status: 200, headers: { 'content-type': 'text/html', ...(fx.headers || {}) }, body: fx.html });
      if (file) return route.fulfill({ status: 200, headers: { 'content-type': file.type || 'text/plain' }, body: file.body });
      return route.fulfill({ status: 404, body: '' });
    });
    const site = await ctx.newPage();
    await site.goto(origin + '/');
    const popup = await ctx.newPage();
    const errors = [];
    popup.on('pageerror', e => errors.push(e.message));
    popup.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    // Point the popup at the fixture tab instead of itself.
    await popup.addInitScript((url) => {
      const orig = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = (q, cb) => { const p = orig({ url: url + '*' }); return cb ? p.then(cb) : p; };
    }, origin + '/');
    await popup.setViewportSize({ width: 780, height: 580 });
    await popup.goto(`chrome-extension://${extId}/popup.html`);
    await popup.waitForSelector('#resultContainer:not(.hidden), #errorBox:not(.hidden)', { timeout: 15000 });
    const title = await popup.textContent('#resultTitle');
    const err = await popup.isVisible('#errorBox') ? await popup.textContent('#errorMsg') : '';
    const leaked = await site.evaluate(() => typeof window.__wfd);
    const ok = !err && fx.expect.framework ? title === fx.expect.framework : !err;
    if (!ok || errors.length || leaked !== 'undefined') failed++;
    console.log(`${ok && !errors.length && leaked === 'undefined' ? '✓' : '✗'} ${fx.name}: popup shows "${title}"${err ? ' ERROR ' + err : ''}${errors.length ? ' console: ' + errors.join(' | ') : ''}${leaked !== 'undefined' ? ' (window.__wfd left on page!)' : ''}`);
    if (process.env.SHOT_DIR) {
      const base = path.join(process.env.SHOT_DIR, key.replace(/\W/g, ''));
      await popup.waitForTimeout(1200);
      await popup.screenshot({ path: base + '-overview.png' });
      if (process.env.ALL_TABS) {
        for (const t of ['stack', 'marketing', 'health', 'security', 'history']) {
          await popup.click(`.nav-item[data-tab="${t}"]`);
          await popup.waitForTimeout(700);
          await popup.screenshot({ path: `${base}-${t}.png` });
        }
        // Open a saved scan from history.
        await popup.click('#historyList .row.click');
        await popup.waitForSelector('#savedBanner:not(.hidden)', { timeout: 3000 });
        console.log('   history → saved scan banner OK');
        // Full-tab report.
        const [full] = await Promise.all([ctx.waitForEvent('page'), popup.click('#popoutBtn')]);
        await full.setViewportSize({ width: 1280, height: 860 });
        await full.waitForSelector('#resultContainer:not(.hidden)', { timeout: 5000 });
        await full.waitForTimeout(1000);
        console.log('   full report tab shows', JSON.stringify(await full.textContent('#resultTitle')));
        await full.screenshot({ path: base + '-fulltab.png' });
        await full.close();
        await popup.click('.nav-item[data-tab="overview"]');
        await popup.click('#themeToggle');
        await popup.waitForTimeout(900);
        await popup.screenshot({ path: base + '-dark.png' });
        await popup.click('#themeToggle');
      }
    }
    await popup.close(); await site.close();
    await ctx.unrouteAll({ behavior: 'ignoreErrors' });
  }
  await ctx.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
})();
