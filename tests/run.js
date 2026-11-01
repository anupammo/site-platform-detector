// Run: node tests/run.js   (needs Playwright + Chromium installed)
const { chromium } = require('playwright');
const { scan } = require('./harness');
const fixtures = require('./fixtures');

const names = (arr) => (arr || []).map(x => (typeof x === 'string' ? x : x.name));
const norm = (s) => String(s).toLowerCase().replace(/[\s.]/g, '').replace(/js$/, '');
const has = (list, want) => list.some(n => norm(n) === norm(want) || norm(n).startsWith(norm(want)));

function view(res) {
  const b = res.breakdown || {};
  const si = b.siteInfo || {};
  const tags = b.tags ? names(b.tags) : [
    si.ga && 'Google Analytics', si.gtm && 'Google Tag Manager', si.cloudflare && 'Cloudflare Web Analytics',
    si.segment && 'Segment', si.hubspot && 'HubSpot'].filter(Boolean);
  return {
    framework: res.framework, version: res.version || '', theme: b.theme || '',
    tech: names(b.techStack), tags, ids: b.trackingIds || [],
    hosting: (b.headers && b.headers.hosting) || [],
    sitemap: !!(si.sitemap), health: (b.health || []).map(h => h.id)
  };
}

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch();
  const context = await browser.newContext();
  let fail = 0, pass = 0;
  for (const fx of fixtures) {
    if (only && !fx.name.toLowerCase().includes(only.toLowerCase())) continue;
    const errs = [];
    let v;
    try {
      const { res, pageState } = await scan(context, fx);
      v = view(res);
      const e = fx.expect;
      if (e.framework && v.framework !== e.framework) errs.push(`framework: got "${v.framework}", want "${e.framework}"`);
      (e.notFramework || []).forEach(f => { if (v.framework === f) errs.push(`framework must not be "${f}"`); });
      if (e.theme && v.theme !== e.theme) errs.push(`theme: got "${v.theme}", want "${e.theme}"`);
      if (e.version && v.version !== e.version) errs.push(`version: got "${v.version}", want "${e.version}"`);
      (e.tech || []).forEach(t => { if (!has(v.tech, t)) errs.push(`missing tech "${t}"`); });
      (e.notTech || []).forEach(t => { if (has(v.tech, t)) errs.push(`false tech "${t}"`); });
      (e.tags || []).forEach(t => { if (!has(v.tags, t)) errs.push(`missing tag "${t}"`); });
      (e.notTags || []).forEach(t => { if (has(v.tags, t)) errs.push(`false tag "${t}"`); });
      (e.ids || []).forEach(t => { if (!v.ids.includes(t)) errs.push(`missing tracking id "${t}"`); });
      (e.hosting || []).forEach(t => { if (!v.hosting.includes(t)) errs.push(`missing hosting "${t}"`); });
      if ('sitemap' in e && v.sitemap !== e.sitemap) errs.push(`sitemap: got ${v.sitemap}, want ${e.sitemap}`);
      (e.health || []).forEach(t => { if (!v.health.includes(t)) errs.push(`missing health warning "${t}"`); });
      if (e.keepsPageGlobal && pageState.detectTheme !== null && !/page-own-function/.test(pageState.detectTheme)) errs.push(`clobbered the page's own detectTheme() function`);
    } catch (err) { errs.push('crash: ' + err.message.split('\n')[0]); }
    if (errs.length) { fail++; console.log(`✗ ${fx.name}\n    - ${errs.join('\n    - ')}`); }
    else { pass++; console.log(`✓ ${fx.name}`); }
    if (process.env.VERBOSE && v) console.log('   ', JSON.stringify(v));
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
