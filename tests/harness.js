// Shared test harness: serves a fixture page from a fake origin in Chromium,
// injects the extension's detector files into the page (MAIN world, exactly
// like chrome.scripting does), and returns the collected result.
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');

function detectorFiles() {
  // Single source of truth: the file list used by popup.js
  const src = fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8');
  const m = src.match(/const DETECTOR_FILES = (\[[^\]]*\])/);
  if (m) return JSON.parse(m[1].replace(/'/g, '"'));
  return ['themeDetector.js', 'techStackDetector.js', 'siteInfoDetector.js', 'pageInfoDetector.js', 'headerDetector.js', 'frameworkDetector.js'];
}

async function scan(context, fx) {
  const origin = 'https://' + (fx.host || 'fixture.test');
  const files = fx.files || {};
  await context.unrouteAll({ behavior: 'ignoreErrors' });
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== origin) return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    if (u.pathname === (fx.path || '/')) {
      return route.fulfill({ status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...(fx.headers || {}) }, body: fx.html });
    }
    if (files[u.pathname]) {
      const f = files[u.pathname];
      return route.fulfill({ status: f.status || 200, headers: { 'content-type': f.type || 'text/plain' }, body: f.body || '' });
    }
    if (fx.softNotFound) return route.fulfill({ status: 200, contentType: 'text/html', body: '<html>app shell</html>' });
    return route.fulfill({ status: 404, contentType: 'text/html', body: 'not found' });
  });
  const page = await context.newPage();
  await page.goto(origin + (fx.path || '/'));
  // Evaluate like chrome.scripting does: no <script> element is added to the DOM.
  for (const f of detectorFiles()) await page.evaluate(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const res = await page.evaluate(async () => {
    if (window.__wfd && window.__wfd.collect) { try { return await window.__wfd.collect(); } finally { delete window.__wfd; } }
    // v1.3 fallback (orchestrator lived in popup.js)
    const fw = window.detectFramework();
    const b = {};
    const t = window.detectTheme(fw.framework); b.theme = t.theme;
    const ts = window.detectTechStack(); b.techStack = ts.list; b.techVersions = ts.versions;
    b.siteInfo = await window.detectSiteInfo(); b.pageInfo = window.detectPageInfo(); b.headers = await window.detectHeaders();
    return { ...fw, breakdown: b };
  });
  const pageState = await page.evaluate(() => ({ detectTheme: typeof window.detectTheme === 'function' ? String(window.detectTheme).slice(0, 60) : null }));
  await page.close();
  return { res, pageState };
}

module.exports = { scan, ROOT };
