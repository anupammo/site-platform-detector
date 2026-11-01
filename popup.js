// Popup controller — scan on open, render the dashboard, history & discoveries,
// copy/export/report, theme, keyboard shortcuts and a policy-safe review prompt.
// The same page also works as a full-tab report (popup.html?view=full).

const STORE_URL = 'https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn';
const REVIEW_URL = STORE_URL + '/reviews';
const REVIEW_AFTER = 5;                           // successful scans before asking once
const REVIEW_REARM_MS = 30 * 24 * 60 * 60 * 1000; // "Not now" re-asks after 30 days
const CACHE_MS = 2 * 60 * 1000;                   // reopening within 2 min shows the last scan instantly
const HISTORY_MAX = 50;

// Detector files, injected in this order into the page's MAIN world on demand.
// (tests/harness.js reads this list too.)
const DETECTOR_FILES = ['detectUtils.js', 'headerDetector.js', 'frameworkDetector.js', 'themeDetector.js', 'techStackDetector.js', 'siteInfoDetector.js', 'pageInfoDetector.js', 'collect.js'];

// Runs in the page: collect the result, then remove our namespace so the page
// is left exactly as it was.
async function runInPage() {
  try {
    return await window.__wfd.collect();
  } finally {
    try { delete window.__wfd; } catch (_) { window.__wfd = undefined; }
  }
}

// Every platform the engine knows (from frameworkDetector.js, loaded by popup.html).
const PLATFORMS = (window.__wfd && window.__wfd.platforms) || [];

// ---------- Brand logos ----------
// Detected name → bundled logo (icons/brands/<slug>.svg). Others get a colored monogram.
const BRAND_SLUG = {
  'WordPress': 'wordpress', 'WooCommerce': 'woocommerce', 'Shopify': 'shopify', 'Wix': 'wix',
  'Webflow': 'webflow', 'Squarespace': 'squarespace', 'Joomla': 'joomla', 'Drupal': 'drupal',
  'Magento': 'magento', 'PrestaShop': 'prestashop', 'BigCommerce': 'bigcommerce', 'Ghost': 'ghost',
  'Blogger': 'blogger', 'HubSpot CMS': 'hubspot', 'Framer': 'framer', 'Craft CMS': 'craftcms',
  'HTML': 'html5', 'CSS': 'css3', 'JavaScript': 'javascript',
  'React': 'react', 'ReactJS': 'react', 'Preact': 'preact', 'Vue.js': 'vuedotjs', 'VueJS': 'vuedotjs', 'Angular': 'angular',
  'AngularJS': 'angular', 'Svelte': 'svelte', 'SvelteKit': 'svelte', 'SolidJS': 'solid', 'Qwik': 'qwik', 'Ember.js': 'emberdotjs',
  'Alpine.js': 'alpinedotjs', 'Next.js': 'nextdotjs', 'NextJS': 'nextdotjs', 'Nuxt': 'nuxtdotjs', 'NuxtJS': 'nuxtdotjs', 'Remix': 'remix',
  'Gatsby': 'gatsby', 'Astro': 'astro', 'Hugo': 'hugo', 'Jekyll': 'jekyll', 'Eleventy': 'eleventy',
  'Bootstrap': 'bootstrap', 'Tailwind CSS': 'tailwindcss', 'Font Awesome': 'fontawesome',
  'Google Fonts': 'googlefonts', 'jQuery': 'jquery', 'jQuery UI': 'jquery', 'jQuery Migrate': 'jquery', 'Lodash': 'lodash',
  'Three.js': 'threedotjs', 'GSAP': 'greensock', 'Stripe': 'stripe',
  'ASP.NET': 'dotnet', 'Blazor': 'dotnet', 'Ruby on Rails': 'rubyonrails', 'PHP': 'php',
  'Cloudflare': 'cloudflare', 'Cloudflare Web Analytics': 'cloudflare', 'Cloudflare Turnstile': 'cloudflare', 'Vercel': 'vercel', 'Vercel Analytics': 'vercel',
  'Netlify': 'netlify', 'Fastly': 'fastly', 'CloudFront': 'amazonwebservices', 'AWS': 'amazonwebservices', 'GitHub Pages': 'github',
  'Akamai': 'akamai', 'Google Cloud': 'googlecloud', 'Nginx': 'nginx', 'Apache': 'apache',
  'Google Tag Manager': 'googletagmanager', 'Google Analytics 4': 'googleanalytics', 'Universal Analytics': 'googleanalytics',
  'Meta Pixel': 'facebook', 'Hotjar': 'hotjar', 'HubSpot': 'hubspot', 'HubSpot Chat': 'hubspot', 'LinkedIn Insight': 'linkedin',
  'X (Twitter) Pixel': 'x', 'Pinterest Tag': 'pinterest', 'TikTok Pixel': 'tiktok', 'Intercom': 'intercom'
};
function slugFor(name) {
  const base = String(name || '').replace(/\s+v?\d[\d.]*$/, '');
  if (BRAND_SLUG[base]) return BRAND_SLUG[base];
  if (/^nginx/i.test(base)) return 'nginx';
  if (/^apache/i.test(base)) return 'apache';
  if (/^php/i.test(base)) return 'php';
  return null;
}
function hueOf(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function initials(name) {
  const words = String(name).replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/);
  return ((words[0] || '?')[0] + (words[1] ? words[1][0] : (words[0] || '')[1] || '')).toUpperCase();
}
function monogram(tile, name) {
  tile.classList.add('mono');
  tile.textContent = initials(name);
  const h = hueOf(name);
  tile.style.background = `linear-gradient(135deg, hsl(${h} 70% 52%), hsl(${(h + 40) % 360} 72% 44%))`;
}
function buildIcon(name, variant) {
  const tile = document.createElement('span');
  tile.className = 'logo-tile ' + (variant === 'hero' ? 'logo-hero' : 'logo-chip');
  const slug = slugFor(name);
  if (!slug || name === 'Custom/Unknown') {
    if (name === 'Custom/Unknown') { tile.innerHTML = '<svg class="icon" style="width:45%;height:45%;color:var(--text-dim)"><use href="#i-search"></use></svg>'; }
    else monogram(tile, name);
    return tile;
  }
  const img = document.createElement('img');
  img.src = 'icons/brands/' + slug + '.svg';
  img.alt = '';
  img.addEventListener('error', () => { img.remove(); monogram(tile, name); }, { once: true });
  tile.appendChild(img);
  return tile;
}

// ---------- State ----------
const $ = (id) => document.getElementById(id);
const isFull = new URLSearchParams(location.search).get('view') === 'full';
let currentTab = null;       // the tab being analyzed
let liveResult = null;       // latest scan of the current tab
let shown = null;            // { data, host, url, ts, saved } — what is on screen
let activeTab = 'overview';

document.addEventListener('DOMContentLoaded', () => {
  if (isFull) { document.body.classList.add('full'); document.documentElement.classList.add('full'); $('popoutBtn').classList.add('hidden'); }
  initTheme();
  $('discTotal').textContent = PLATFORMS.length || 44;

  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => selectTab(b.dataset.tab)));
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => selectTab(b.dataset.go)));
  $('discMini').addEventListener('click', () => selectTab('history'));
  $('themeToggle').addEventListener('click', toggleTheme);
  $('shareBtn').addEventListener('click', shareExtension);
  $('whyToggle').addEventListener('click', toggleWhy);
  $('historyClear').addEventListener('click', clearHistory);
  $('csvBtn').addEventListener('click', exportCsv);
  $('rescanBtn').addEventListener('click', () => detect());
  $('retryBtn').addEventListener('click', () => detect());
  $('copyBtn').addEventListener('click', copyResult);
  $('exportBtn').addEventListener('click', exportResult);
  $('popoutBtn').addEventListener('click', popOut);
  $('reportBtn').addEventListener('click', reportResult);
  $('reviewYes').addEventListener('click', onReviewYes);
  $('reviewLater').addEventListener('click', onReviewLater);
  $('backLive').addEventListener('click', backToLive);
  $('stackSearch').addEventListener('input', () => shown && renderStack(shown.data));
  $('histSearch').addEventListener('input', renderHistory);
  document.addEventListener('keydown', onKey);

  refreshCounts();
  start();
});

// ---------- Theme ----------
function initTheme() {
  chrome.storage.local.get(['theme'], (s) => {
    if (s.theme === 'light' || s.theme === 'dark') document.documentElement.setAttribute('data-theme', s.theme);
    updateThemeIcon(currentTheme());
  });
}
function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  updateThemeIcon(next);
  chrome.storage.local.set({ theme: next });
}
function updateThemeIcon(theme) {
  $('themeToggle').querySelector('use').setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
}

// ---------- Navigation & keyboard ----------
const TABS = ['overview', 'stack', 'marketing', 'health', 'security', 'history'];
function selectTab(name) {
  activeTab = name;
  document.querySelectorAll('.nav-item').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  document.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== name));
  const isHistory = name === 'history';
  // History works without a result; other tabs need one.
  if (isHistory) {
    $('resultContainer').classList.add('hidden'); $('loading').classList.add('hidden'); $('errorBox').classList.add('hidden');
    renderHistory();
  } else if (shown) {
    $('resultContainer').classList.remove('hidden');
  } else if ($('loading').classList.contains('hidden') && $('errorBox').classList.contains('hidden')) {
    start(); // coming back from History before any result was shown
  }
  $('content').scrollTop = 0;
}
function onKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName);
  if (e.key === 'Escape' && typing) { document.activeElement.blur(); return; }
  if (typing) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= TABS.length) { selectTab(TABS[n - 1]); e.preventDefault(); return; }
  if (e.key === 'r' || e.key === 'R') { detect(); e.preventDefault(); }
  else if (e.key === 'c' || e.key === 'C') { copyResult(); e.preventDefault(); }
  else if (e.key === '/') {
    if (activeTab === 'history') $('histSearch').focus();
    else { selectTab('stack'); $('stackSearch').focus(); }
    e.preventDefault();
  }
}

// ---------- Lifecycle ----------
async function start() {
  try {
    if (isFull) {
      const s = await chrome.storage.session.get(['fullReport']);
      const r = s.fullReport;
      if (r && r.data) {
        currentTab = r.tabId ? { id: r.tabId, url: r.url, favIconUrl: r.favIconUrl } : null;
        setSite(r.url, r.favIconUrl);
        liveResult = r.data;
        show({ data: r.data, host: r.host, url: r.url, ts: r.ts });
      } else showError('Open the extension on a website first, then use “Open full report”.');
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    setSite(tab && tab.url, tab && tab.favIconUrl);
    if (!tab || !isSupportedTabUrl(tab.url)) {
      showError('Open a normal website tab (http/https) to run detection.');
      return;
    }
    // Instant reopen: reuse a very recent scan of the same URL.
    const key = 'scan:' + tab.id;
    const cached = (await chrome.storage.session.get([key]))[key];
    if (cached && cached.url === tab.url && Date.now() - cached.ts < CACHE_MS) {
      liveResult = cached.data;
      show({ data: cached.data, host: hostOf(tab.url), url: tab.url, ts: cached.ts });
      return;
    }
    detect();
  } catch (_) {
    showError('Could not read the current tab.');
  }
}

function hostOf(url) { try { return new URL(url).hostname || url; } catch { return url || ''; } }
function setSite(url, favUrl) {
  $('currentUrl').textContent = hostOf(url) || '—';
  try { const u = new URL(url); $('currentPath').textContent = (u.pathname + u.search).replace(/^\/$/, ''); } catch { $('currentPath').textContent = ''; }
  document.querySelector('.site').title = url || '';
  setFavicon(favUrl);
}
function setFavicon(favUrl) {
  const box = $('favicon');
  if (!box || !favUrl || !/^(https?:|data:)/.test(favUrl)) return;
  const img = document.createElement('img');
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('load', () => { box.innerHTML = ''; box.appendChild(img); });
  img.src = favUrl;
}
function isSupportedTabUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const blocked = ['chrome:', 'edge:', 'about:', 'chrome-extension:', 'moz-extension:', 'view-source:', 'devtools:'];
    if (blocked.some(p => urlStr.startsWith(p))) return false;
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'file:';
  } catch (_) { return false; }
}

const LOAD_STEPS = ['Reading page markup…', 'Checking runtime globals…', 'Fetching response headers…', 'Looking for robots.txt & sitemap…', 'Scoring the evidence…'];
let loadTimer = null;

async function detect() {
  if (!currentTab || (!isFull && !isSupportedTabUrl(currentTab.url))) {
    showError('Open a normal website tab (http/https) to run detection.');
    return;
  }
  if (activeTab === 'history') selectTab('overview');
  showLoading();
  const btn = $('rescanBtn');
  btn.classList.add('spin');
  try {
    const target = { tabId: currentTab.id };
    await chrome.scripting.executeScript({ target, world: 'MAIN', files: DETECTOR_FILES });
    const results = await chrome.scripting.executeScript({ target, world: 'MAIN', func: runInPage });
    const data = results && results[0] && results[0].result;
    if (!data || !data.framework) { showError('No result returned from the page.'); return; }
    const url = isFull ? currentTab.url : (await chrome.tabs.get(currentTab.id).catch(() => currentTab)).url || currentTab.url;
    const ts = Date.now();
    liveResult = data;
    chrome.storage.session.set({ ['scan:' + currentTab.id]: { url, ts, data } }).catch(() => {});
    show({ data, host: hostOf(url), url, ts });
    setBadge(data.framework);
    await saveHistory(data, hostOf(url), url, ts);
    await recordDiscoveries(data, hostOf(url));
    recordSuccessAndMaybePrompt();
  } catch (err) {
    console.error('[Framework Detector]', err);
    showError(friendlyError((err && err.message) ? err.message : String(err)));
  } finally {
    btn.classList.remove('spin');
    clearInterval(loadTimer);
  }
}

// Turn Chrome's injection errors into something a person can act on.
function friendlyError(msg) {
  if (/gallery cannot be scripted|chromewebstore|webstore/i.test(msg)) return 'Chrome does not allow extensions to read Chrome Web Store pages. Try any other website.';
  if (/file:\/\/|file url/i.test(msg)) return 'To scan local files, enable “Allow access to file URLs” for this extension in chrome://extensions.';
  if (isFull && /cannot access|permission/i.test(msg)) return 'Chrome only lets the extension re-read a tab right after you click its icon. Open the popup on that tab to rescan.';
  if (/cannot access|cannot be scripted|permission/i.test(msg)) return 'Chrome blocks extensions on this page (browser, PDF or policy-protected page). Try a normal website.';
  if (/no tab|frame|was removed/i.test(msg)) return 'The page changed while scanning. Press Try again.';
  return 'Could not analyze this page: ' + msg;
}

function showLoading() {
  $('loading').classList.remove('hidden');
  $('resultContainer').classList.add('hidden');
  $('errorBox').classList.add('hidden');
  $('reviewPrompt').classList.add('hidden');
  let i = 0;
  $('loadStep').textContent = LOAD_STEPS[0];
  clearInterval(loadTimer);
  loadTimer = setInterval(() => { i = Math.min(i + 1, LOAD_STEPS.length - 1); $('loadStep').textContent = LOAD_STEPS[i]; }, 550);
}
function showError(msg) {
  clearInterval(loadTimer);
  $('errorMsg').textContent = msg || 'Could not analyze this page.';
  $('loading').classList.add('hidden');
  $('resultContainer').classList.add('hidden');
  $('errorBox').classList.remove('hidden');
  if (activeTab === 'history') selectTab('overview');
}

// ---------- Rendering ----------
const PLUGIN_CATS = ['Plugins & apps'];
const SERVICE_CATS = ['Payments', 'Live chat & support', 'Cookie consent', 'Security', 'Search', 'Video & media', 'Maps', 'Monitoring', 'Email & marketing', 'A/B testing'];
const CAT_ORDER = ['Meta-framework / SSG', 'JavaScript framework', 'UI & CSS', 'Library', 'Back-end', 'Fonts', 'Plugins & apps', 'Payments',
  'Live chat & support', 'Email & marketing', 'Cookie consent', 'Security', 'Search', 'Video & media', 'Maps', 'Monitoring', 'A/B testing', ''];

function techItems(b) {
  const raw = (b && b.techStack) || [];
  // Older history/exports used plain strings.
  return raw.map(t => (typeof t === 'string' ? { name: t, cat: '', version: (b.techVersions || {})[t] || '' } : t));
}
function scoreClass(n) { return n >= 85 ? 'good' : n >= 60 ? 'mid' : 'bad'; }
function healthScore(b) {
  if (typeof b.healthScore === 'number') return b.healthScore;
  if (!Array.isArray(b.health)) return null;
  return Math.max(0, 100 - b.health.reduce((n, h) => n + (h.level === 'error' ? 15 : 6), 0));
}
function setRing(el, pct, cls) {
  const c = el.querySelector('.val');
  const r = 36, len = 2 * Math.PI * r;
  c.style.strokeDasharray = String(len);
  c.style.strokeDashoffset = String(len);
  el.classList.remove('good', 'mid', 'bad');
  if (cls) el.classList.add(cls);
  requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = String(len * (1 - Math.max(0, Math.min(100, pct)) / 100)); }));
}
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function svgIcon(id, cls) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#' + id);
  svg.appendChild(use);
  return svg;
}
function buildChip(name, version, title) {
  const chip = el('span', 'chip');
  if (title) chip.title = title;
  chip.appendChild(buildIcon(name, 'chip'));
  chip.appendChild(el('span', '', name));
  if (version) chip.appendChild(el('span', 'v', version));
  return chip;
}
function idPill(id) {
  const p = el('button', 'id-pill');
  p.title = 'Copy ' + id;
  p.appendChild(el('span', '', id));
  p.appendChild(svgIcon('i-copy'));
  p.addEventListener('click', (e) => { e.stopPropagation(); copyText(id, `Copied ${id}`); });
  return p;
}

function show(view) {
  shown = view;
  clearInterval(loadTimer);
  const { data } = view;
  const b = data.breakdown || {};
  $('savedBanner').classList.toggle('hidden', !view.saved);
  if (view.saved) $('savedText').textContent = `Saved scan of ${view.host} · ${timeAgo(view.ts)}`;
  $('scanAge').textContent = view.saved ? '' : (Date.now() - view.ts > 30000 ? 'scanned ' + timeAgo(view.ts) : '');

  renderOverview(data, b);
  renderStack(data);
  renderMarketing(b);
  renderHealth(b);
  renderSecurity(b);
  updateCounts(data, b);

  $('loading').classList.add('hidden');
  $('errorBox').classList.add('hidden');
  if (activeTab === 'history') selectTab('overview');
  else selectTab(activeTab);
}

function renderOverview(data, b) {
  const icon = buildIcon(data.framework, 'hero');
  icon.id = 'resultIcon';
  $('resultIcon').replaceWith(icon);
  $('heroEyebrow').textContent = data.framework === 'Custom/Unknown' ? 'No known platform' : (data.isFramework ? 'Built with' : 'Platform');
  $('resultTitle').textContent = data.framework === 'Custom/Unknown' ? 'Custom-built site' : data.framework;
  $('verPill').textContent = data.version ? 'v' + data.version : '';
  $('verPill').classList.toggle('hidden', !data.version);
  let subtitle = data.subtitle || '';
  if (data.parentPlatform) subtitle += ` · runs on ${data.parentPlatform.name}${data.parentPlatform.version ? ' ' + data.parentPlatform.version : ''}`;
  $('resultSubtitle').textContent = subtitle;

  const pct = Math.max(0, Math.min(100, Number(data.confidence) || 0));
  $('confidenceValue').textContent = pct + '%';
  setRing($('confRing'), pct, '');

  const why = (data.details || []).slice();
  if (data.alsoDetected && data.alsoDetected.length) why.push('Also found signals of: ' + data.alsoDetected.join(', '));
  $('whyList').innerHTML = '';
  why.forEach(d => $('whyList').appendChild(el('li', '', d)));
  $('whyToggle').style.display = why.length ? '' : 'none';

  // KPIs
  $('themeValue').textContent = b.theme || (b.themeDetail ? 'Not exposed' : '—');
  $('themeDetail').textContent = b.themeDetail || (b.theme ? 'active theme' : 'no theme info');
  const host = hostingToList(b.headers);
  $('kpiHost').textContent = host[0] || (b.headers && b.headers.available ? 'Not identified' : 'Unavailable');
  $('kpiHostHint').textContent = host.slice(1, 3).join(' · ') || 'from response headers';
  const hs = healthScore(b);
  $('kpiHealth').textContent = hs == null ? '—' : `${hs}/100`;
  $('kpiHealth').className = 'val num ' + (hs == null ? '' : scoreClass(hs));
  const errs = (b.health || []).filter(h => h.level === 'error').length;
  $('kpiHealthHint').textContent = hs == null ? '' : (errs ? `${errs} critical issue${errs > 1 ? 's' : ''}` : `${(b.health || []).length} to improve`);
  const items = techItems(b);
  $('kpiTech').textContent = items.length;
  const plugins = items.filter(t => PLUGIN_CATS.includes(t.cat)).length;
  $('kpiTechHint').textContent = plugins ? `incl. ${plugins} plugin${plugins > 1 ? 's' : ''}/app${plugins > 1 ? 's' : ''}` : 'frameworks, libraries, services';

  // Highlights — most interesting first.
  const hl = $('highlightChips');
  hl.innerHTML = '';
  const sorted = items.slice().sort((a, b2) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b2.cat));
  sorted.slice(0, 12).forEach(t => hl.appendChild(buildChip(t.name, t.version, t.cat)));
  if (!items.length) hl.appendChild(el('span', 'meta', 'No frameworks or libraries detected.'));

  // Tracking
  const tags = Array.isArray(b.tags) ? b.tags : [];
  const ov = $('ovTags');
  ov.innerHTML = '';
  tags.slice(0, 8).forEach(t => {
    const c = buildChip(t.name, t.ids && t.ids.length ? t.ids[0] : '', t.ids && t.ids.length ? 'Click to copy ' + t.ids.join(', ') : '');
    if (t.ids && t.ids.length) { c.classList.add('copyable'); c.addEventListener('click', () => copyText(t.ids.join(', '), `Copied ${t.ids.join(', ')}`)); }
    ov.appendChild(c);
  });
  if (!tags.length) ov.appendChild(el('span', 'meta', 'No analytics or ad tags found on this page.'));

  // Top issues
  const issues = (b.health || []).slice().sort((x, y) => (x.level === 'error' ? 0 : 1) - (y.level === 'error' ? 0 : 1));
  $('ovIssues').innerHTML = '';
  issues.slice(0, 3).forEach(h => $('ovIssues').appendChild(issueRow(h)));
  $('ovIssuesBlock').classList.toggle('hidden', issues.length === 0);
}

function renderStack(data) {
  const b = data.breakdown || {};
  const q = $('stackSearch').value.trim().toLowerCase();
  const items = techItems(b).filter(t => !q || t.name.toLowerCase().includes(q) || (t.cat || '').toLowerCase().includes(q));
  const groups = {};
  items.forEach(t => { (groups[t.cat || 'Other'] = groups[t.cat || 'Other'] || []).push(t); });
  const wrap = $('stackGroups');
  wrap.innerHTML = '';
  // Theme card at the top when known.
  if (b.theme && !q) {
    const g = el('div', 'card group');
    const h = el('div', 'group-head'); h.appendChild(svgIcon('i-palette')); h.appendChild(el('span', '', 'Theme'));
    g.appendChild(h);
    const chips = el('div', 'chips');
    chips.appendChild(buildChip(b.theme, '', b.themeDetail || ''));
    if (b.themeDetail) chips.appendChild(el('span', 'meta', b.themeDetail));
    g.appendChild(chips);
    wrap.appendChild(g);
  }
  const order = Object.keys(groups).sort((a, c) => CAT_ORDER.indexOf(a === 'Other' ? '' : a) - CAT_ORDER.indexOf(c === 'Other' ? '' : c));
  order.forEach(cat => {
    const g = el('div', 'card group');
    const h = el('div', 'group-head');
    h.appendChild(el('span', '', cat));
    h.appendChild(el('span', 'n', String(groups[cat].length)));
    g.appendChild(h);
    const chips = el('div', 'chips');
    groups[cat].forEach(t => chips.appendChild(buildChip(t.name, t.version, cat)));
    g.appendChild(chips);
    wrap.appendChild(g);
  });
  if (!items.length) {
    const e = el('div', 'card empty');
    e.appendChild(svgIcon('i-layers'));
    e.appendChild(el('b', '', q ? `Nothing matches “${q}”` : 'No technologies detected'));
    e.appendChild(el('span', '', q ? 'Try a different name or category.' : 'The page may be static HTML or load everything from a single bundle.'));
    wrap.appendChild(e);
  }
  $('stackSub').textContent = `${techItems(b).length} found`;
}

function renderMarketing(b) {
  const rows = $('tagRows');
  rows.innerHTML = '';
  const tags = Array.isArray(b.tags) ? b.tags : [];
  tags.forEach(t => {
    const r = el('div', 'row');
    r.appendChild(buildIcon(t.name, 'chip'));
    const g = el('div', 'grow');
    g.appendChild(el('div', 'name', t.name));
    g.appendChild(el('div', 'meta', TAG_HINT[t.name] || 'Tracking / analytics tag'));
    r.appendChild(g);
    const ids = el('div', 'ids');
    (t.ids || []).forEach(id => ids.appendChild(idPill(id)));
    r.appendChild(ids);
    rows.appendChild(r);
  });
  if (!tags.length) {
    const e = el('div', 'empty');
    e.appendChild(svgIcon('i-chart'));
    e.appendChild(el('b', '', 'No analytics or ad tags found'));
    e.appendChild(el('span', '', 'Nothing known is tracking visitors on this page — or tags load only after cookie consent.'));
    rows.appendChild(e);
  }
}
const TAG_HINT = {
  'Google Analytics 4': 'Web analytics — measurement ID', 'Google Tag Manager': 'Tag container — container ID', 'Google Ads': 'Ad conversion tracking',
  'Universal Analytics': 'Legacy Google Analytics (sunset in 2024)', 'Meta Pixel': 'Facebook / Instagram ads pixel', 'Hotjar': 'Heatmaps & session recordings',
  'Microsoft Clarity': 'Heatmaps & session recordings', 'TikTok Pixel': 'TikTok ads pixel', 'LinkedIn Insight': 'LinkedIn ads tracking',
  'X (Twitter) Pixel': 'X ads tracking', 'Pinterest Tag': 'Pinterest ads tracking', 'Microsoft UET': 'Bing / Microsoft ads tracking',
  'HubSpot': 'Marketing automation & CRM tracking', 'Segment': 'Customer data platform', 'Mixpanel': 'Product analytics', 'Amplitude': 'Product analytics',
  'PostHog': 'Product analytics', 'Heap': 'Product analytics', 'Plausible': 'Privacy-friendly analytics', 'Fathom': 'Privacy-friendly analytics',
  'Matomo': 'Open-source analytics', 'Cloudflare Web Analytics': 'Privacy-friendly analytics', 'Vercel Analytics': 'Web analytics',
  'FullStory': 'Session replay', 'Crazy Egg': 'Heatmaps', 'Lucky Orange': 'Heatmaps & recordings', 'Yandex Metrica': 'Web analytics',
  'Adobe Analytics': 'Enterprise analytics', 'Snap Pixel': 'Snapchat ads pixel', 'Reddit Pixel': 'Reddit ads pixel'
};

function issueRow(h) {
  const r = el('div', 'issue ' + h.level);
  r.appendChild(svgIcon(h.level === 'ok' ? 'i-check' : h.level === 'error' ? 'i-x' : 'i-alert'));
  const t = el('div');
  t.appendChild(el('div', 't', h.text));
  if (h.tip) t.appendChild(el('div', 'tip', h.tip));
  r.appendChild(t);
  return r;
}

function renderHealth(b) {
  const hs = healthScore(b);
  const issues = (b.health || []).slice().sort((x, y) => (x.level === 'error' ? 0 : 1) - (y.level === 'error' ? 0 : 1));
  const passed = b.healthPassed || [];
  const errors = issues.filter(i => i.level === 'error').length;
  const warns = issues.length - errors;
  $('healthScoreVal').textContent = hs == null ? '–' : hs;
  setRing($('healthRing'), hs || 0, hs == null ? '' : scoreClass(hs));
  $('healthHeadline').textContent = hs == null ? 'Site health' : hs >= 85 ? 'Looking healthy' : hs >= 60 ? 'Good, with room to improve' : 'Needs attention';
  $('healthSummary').textContent = errors
    ? `${errors} critical issue${errors > 1 ? 's' : ''} can hurt traffic or trust — fix ${errors > 1 ? 'these' : 'this'} first.`
    : (warns ? 'No critical problems. A few quick wins below.' : 'Every check passed. Nice work.');
  const sev = $('healthSev');
  sev.innerHTML = '';
  if (errors) sev.appendChild(el('span', 'e', `${errors} critical`));
  if (warns) sev.appendChild(el('span', 'w', `${warns} warning${warns > 1 ? 's' : ''}`));
  if (passed.length) sev.appendChild(el('span', 'o', `${passed.length} passed`));

  $('issueList').innerHTML = '';
  issues.forEach(h => $('issueList').appendChild(issueRow(h)));
  if (!issues.length) $('issueList').appendChild(issueRow({ level: 'ok', text: 'No issues found on this page' }));
  $('passedList').innerHTML = '';
  passed.forEach(p => $('passedList').appendChild(issueRow({ level: 'ok', text: p.text })));
  $('passedTitle').textContent = `${passed.length} passed check${passed.length === 1 ? '' : 's'}`;
  $('passedBox').classList.toggle('hidden', !passed.length);

  const info = b.pageInfo;
  const grid = $('pageInfoStats');
  grid.innerHTML = '';
  if (info) {
    [
      ['Words', (info.words || 0).toLocaleString()], ['Read time', (info.readingTime || 0) + ' min'],
      ['Images', info.images + (info.imagesMissingAlt ? ` (${info.imagesMissingAlt} no alt)` : '')], ['Links', info.links],
      ['Headings', info.headings], ['Scripts', info.scripts], ['Stylesheets', info.stylesheets], ['Title length', info.titleLength]
    ].forEach(([l, v]) => { const c = el('div', 'stat'); c.appendChild(el('div', 'stat-val num', String(v))); c.appendChild(el('div', 'stat-lbl', l)); grid.appendChild(c); });
  }
}

const SEC_INFO = [
  ['hsts', 'HSTS', 'Forces HTTPS on every visit'],
  ['csp', 'Content-Security-Policy', 'Limits which scripts can run (XSS defense)'],
  ['xfo', 'Clickjacking protection', 'X-Frame-Options or frame-ancestors'],
  ['xcto', 'X-Content-Type-Options', 'Stops MIME-type sniffing'],
  ['referrer', 'Referrer-Policy', 'Controls what URL data leaks to other sites'],
  ['permissions', 'Permissions-Policy', 'Restricts camera, mic, location…']
];
function renderSecurity(b) {
  const h = b.headers;
  const chips = $('hostingChips');
  chips.innerHTML = '';
  const host = hostingToList(h);
  host.forEach(n => chips.appendChild(buildChip(n)));
  if (!host.length) chips.appendChild(el('span', 'meta', h && h.available ? 'No hosting or CDN fingerprint in the response headers.' : 'Response headers could not be read for this page.'));

  const grid = $('securityChecks');
  grid.innerHTML = '';
  if (!h || !h.available) { $('secScore').textContent = ''; $('secSub').textContent = ''; return; }
  const s = h.security || {};
  let ok = 0;
  SEC_INFO.forEach(([k, t, d]) => {
    const pass = !!s[k];
    if (pass) ok++;
    const c = el('div', 'sec ' + (pass ? 'ok' : 'no'));
    const badge = el('span', 'badge'); badge.appendChild(svgIcon(pass ? 'i-check' : 'i-x'));
    c.appendChild(badge);
    const txt = el('div'); txt.appendChild(el('div', 't', t)); txt.appendChild(el('div', 'd', d));
    c.appendChild(txt);
    grid.appendChild(c);
  });
  $('secScore').textContent = `${ok}/6 present`;
  $('secSub').textContent = h.server ? `Server: ${h.server}` : '';
}

function hostingToList(h) {
  if (!h || !h.available) return [];
  const out = [...(h.hosting || [])];
  if (h.serverInfo) out.push(h.serverInfo.name + (h.serverInfo.version ? ' ' + h.serverInfo.version : ''));
  (h.backend || []).forEach(x => {
    if (typeof x === 'string') return;
    if (x.name === 'Next.js' || x.name === 'Nuxt') return; // shown in the tech stack
    out.push(x.name + (x.version ? ' ' + x.version : ''));
  });
  return [...new Set(out)];
}

function updateCounts(data, b) {
  $('cntStack').textContent = techItems(b).length;
  $('cntMarketing').textContent = (b.tags || []).length;
  const hs = healthScore(b);
  const ch = $('cntHealth');
  ch.textContent = hs == null ? '–' : hs;
  ch.className = 'count ' + (hs == null ? '' : scoreClass(hs));
  const h = b.headers;
  const sec = h && h.available ? Object.values(h.security || {}).filter(Boolean).length : null;
  const cs = $('cntSecurity');
  cs.textContent = sec == null ? '–' : `${sec}/6`;
  cs.className = 'count ' + (sec == null ? '' : sec >= 5 ? 'good' : sec >= 3 ? 'mid' : 'bad');
}

function toggleWhy() {
  const open = $('whyToggle').getAttribute('aria-expanded') === 'true';
  $('whyToggle').setAttribute('aria-expanded', String(!open));
  $('whyList').classList.toggle('hidden', open);
}

// ---------- Toasts ----------
function toast(msg, kind, iconId) {
  const t = el('div', 'toast' + (kind ? ' ' + kind : ''));
  t.appendChild(svgIcon(iconId || (kind === 'discovery' ? 'i-award' : 'i-check')));
  t.appendChild(el('span', '', msg));
  $('toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, kind === 'discovery' ? 3200 : 1800);
}
async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || 'Copied'); } catch (_) { toast('Copy failed', '', 'i-x'); }
}

// ---------- Copy / Export / Report ----------
function buildExport() {
  if (!shown) return null;
  const d = shown.data, b = d.breakdown || {};
  return {
    url: shown.url, host: shown.host,
    detectedAt: new Date(shown.ts || Date.now()).toISOString(),
    extensionVersion: chrome.runtime.getManifest().version,
    platform: d.framework, version: d.version || null, runsOn: d.parentPlatform || null,
    confidence: d.confidence, evidence: d.details || [],
    theme: b.theme || null, themeDetail: b.themeDetail || null,
    techStack: techItems(b), hosting: hostingToList(b.headers),
    securityHeaders: (b.headers && b.headers.available) ? b.headers.security : null,
    analyticsAndTags: Array.isArray(b.tags) ? b.tags : [], trackingIds: b.trackingIds || [],
    sitemap: b.siteInfo ? { found: b.siteInfo.sitemap, url: b.siteInfo.sitemapUrl || null } : null,
    robotsTxt: b.siteInfo ? b.siteInfo.robots : null,
    healthScore: healthScore(b), health: b.health || [], healthPassed: b.healthPassed || [],
    pageInfo: b.pageInfo || null
  };
}
// A Markdown report — pastes cleanly into Slack, Notion, GitHub, Jira or an email.
function buildMarkdown(d) {
  const L = [];
  const list = (title, arr) => { if (arr.length) L.push(`**${title}:** ${arr.join(', ')}`); };
  L.push(`### ${d.host} — tech report`);
  L.push(`**Platform:** ${d.platform}${d.version ? ' ' + d.version : ''}${d.runsOn ? ` (on ${d.runsOn.name}${d.runsOn.version ? ' ' + d.runsOn.version : ''})` : ''} — ${d.confidence}% confidence`);
  if (d.theme) L.push(`**Theme:** ${d.theme}${d.themeDetail ? ` (${d.themeDetail})` : ''}`);
  const fmt = (t) => t.version ? `${t.name} ${t.version}` : t.name;
  list('Tech stack', d.techStack.filter(t => !PLUGIN_CATS.includes(t.cat) && !SERVICE_CATS.includes(t.cat)).map(fmt));
  list('Plugins & apps', d.techStack.filter(t => PLUGIN_CATS.includes(t.cat)).map(fmt));
  list('Widgets & services', d.techStack.filter(t => SERVICE_CATS.includes(t.cat)).map(fmt));
  list('Hosting & server', d.hosting);
  list('Analytics & tags', d.analyticsAndTags.map(t => t.ids && t.ids.length ? `${t.name} (${t.ids.join(', ')})` : t.name));
  if (d.healthScore != null) L.push(`**Health score:** ${d.healthScore}/100`);
  d.health.forEach(h => L.push(`- ${h.level === 'error' ? '❌' : '⚠️'} ${h.text}`));
  L.push('', `_Scanned ${d.detectedAt.slice(0, 10)} with Website Framework Detector — ${STORE_URL}_`);
  return L.join('\n');
}
async function copyResult() {
  const data = buildExport();
  if (!data) return;
  try {
    await navigator.clipboard.writeText(buildMarkdown(data));
    const b = $('copyBtn');
    b.classList.add('copied'); b.querySelector('span').textContent = 'Copied!';
    setTimeout(() => { b.classList.remove('copied'); b.querySelector('span').textContent = 'Copy report'; }, 1400);
  } catch (_) { toast('Copy failed', '', 'i-x'); }
}
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportResult() {
  const data = buildExport();
  if (!data) return;
  download(`framework-detector-${(data.host || 'site').replace(/[^a-z0-9.-]/gi, '_')}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast('JSON exported');
}
// Open the current result in a full browser tab (bigger dashboard).
async function popOut() {
  if (!shown) { toast('Scan a site first', '', 'i-info'); return; }
  await chrome.storage.session.set({ fullReport: { data: shown.data, host: shown.host, url: shown.url, ts: shown.ts, tabId: currentTab && currentTab.id, favIconUrl: currentTab && currentTab.favIconUrl } });
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?view=full') });
}
// Opens a pre-filled GitHub issue. Nothing is sent unless the user submits it.
function reportResult() {
  const d = buildExport();
  const host = d ? d.host : hostOf(currentTab && currentTab.url);
  const title = `[Bug]: ${host || 'site'} detected as "${d ? d.platform : 'error'}"`;
  const what = d
    ? `Detected **${d.platform}** (${d.confidence}% confidence).` + (d.evidence.length ? `\n\nEvidence:\n- ${d.evidence.join('\n- ')}` : '')
    : 'Detection failed on this page.';
  // Field ids match .github/ISSUE_TEMPLATE/bug_report.yml (issue forms accept them as URL params).
  const params = new URLSearchParams({
    template: 'bug_report.yml', title,
    url: d ? d.url : (currentTab && currentTab.url) || '',
    'what-happened': what,
    expected: 'The site is actually built with: ',
    'extension-version': chrome.runtime.getManifest().version
  });
  chrome.tabs.create({ url: 'https://github.com/anupammo/site-platform-detector/issues/new?' + params.toString() });
}

// ---------- Toolbar badge ----------
function setBadge(framework) {
  try {
    if (!chrome.action || !chrome.action.setBadgeText || isFull) return;
    const map = {
      'WordPress': 'WP', 'WooCommerce': 'Woo', 'Shopify': 'Shop', 'Wix': 'Wix', 'Webflow': 'WF',
      'Squarespace': 'Sqs', 'Joomla': 'Joo', 'Drupal': 'Dru', 'Magento': 'Mag', 'PrestaShop': 'PS',
      'BigCommerce': 'BC', 'Ghost': 'Gh', 'Blogger': 'Bl', 'HubSpot CMS': 'HS', 'Framer': 'Fr',
      'Craft CMS': 'Cft', 'Duda': 'Dud', 'OpenCart': 'OC', 'Shopware': 'SW', 'TYPO3': 'T3',
      'Next.js': 'Nxt', 'Nuxt': 'Nux', 'React': 'Rct', 'Vue.js': 'Vue', 'Angular': 'Ng', 'Custom/Unknown': '?'
    };
    const text = map[framework] || framework.slice(0, 3);
    const tabId = currentTab && currentTab.id;
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5', ...(tabId ? { tabId } : {}) });
    chrome.action.setBadgeText({ text, ...(tabId ? { tabId } : {}) });
  } catch (_) {}
}

// ---------- History (local only) ----------
function compact(data) {
  const c = JSON.parse(JSON.stringify(data));
  if (c.breakdown && c.breakdown.headers) delete c.breakdown.headers.all; // raw headers aren't needed later
  return c;
}
async function saveHistory(data, host, url, ts) {
  const s = await chrome.storage.local.get(['history', 'historyOff']);
  if (s.historyOff) return;
  let list = Array.isArray(s.history) ? s.history : [];
  // Re-scanning the same site within 10 minutes replaces the entry instead of duplicating it.
  if (list[0] && list[0].host === host && ts - list[0].ts < 10 * 60 * 1000) list.shift();
  list.unshift({ host, url, framework: data.framework, version: data.version || '', ts, data: compact(data) });
  list = list.slice(0, HISTORY_MAX);
  await chrome.storage.local.set({ history: list });
  $('cntHistory').textContent = list.length;
}
function timeAgo(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString();
}
function renderHistory() {
  chrome.storage.local.get(['history', 'disc', 'scanCount'], (s) => {
    const list = Array.isArray(s.history) ? s.history : [];
    const q = $('histSearch').value.trim().toLowerCase();
    const box = $('historyList');
    box.innerHTML = '';
    const filtered = list.filter(i => !q || (i.host || '').toLowerCase().includes(q) || (i.framework || '').toLowerCase().includes(q));
    filtered.forEach(item => {
      const r = el('div', 'row' + (item.data ? ' click' : ''));
      r.appendChild(buildIcon(item.framework, 'chip'));
      const g = el('div', 'grow');
      g.appendChild(el('div', 'name', item.host));
      g.appendChild(el('div', 'meta', item.framework + (item.version ? ' ' + item.version : '') + (item.data && item.data.breakdown && item.data.breakdown.theme ? ' · ' + item.data.breakdown.theme : '')));
      r.appendChild(g);
      const hs = item.data ? healthScore(item.data.breakdown || {}) : null;
      if (hs != null) { const p = el('span', 'hist-score count ' + scoreClass(hs), String(hs)); p.title = 'Health score'; r.appendChild(p); }
      r.appendChild(el('span', 'time', timeAgo(item.ts)));
      if (item.data) {
        r.title = 'Open this saved scan';
        r.addEventListener('click', () => show({ data: item.data, host: item.host, url: item.url, ts: item.ts, saved: true }));
      }
      box.appendChild(r);
    });
    if (!filtered.length) {
      const e = el('div', 'empty');
      e.appendChild(svgIcon('i-clock'));
      e.appendChild(el('b', '', q ? 'No matching scans' : 'No scans yet'));
      e.appendChild(el('span', '', q ? 'Try a site name or platform.' : 'Every site you scan is saved here — privately, on this device only.'));
      box.appendChild(e);
    }
    $('cntHistory').textContent = list.length;
    renderDiscoveries(s.disc || {}, s.scanCount || 0);
  });
}
function clearHistory() {
  if (!confirm('Clear your scan history and discoveries on this device?')) return;
  chrome.storage.local.set({ history: [], disc: { platforms: {}, tech: {}, sites: {} } }, () => { renderHistory(); refreshCounts(); });
}
function backToLive() {
  if (liveResult && currentTab) show({ data: liveResult, host: hostOf(currentTab.url), url: currentTab.url, ts: Date.now() });
  else detect();
}
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function exportCsv() {
  chrome.storage.local.get(['history'], (s) => {
    const list = Array.isArray(s.history) ? s.history : [];
    if (!list.length) { toast('No history to export', '', 'i-info'); return; }
    const head = ['scanned_at', 'host', 'url', 'platform', 'version', 'theme', 'hosting', 'tech_stack', 'analytics', 'tracking_ids', 'health_score'];
    const rows = list.map(i => {
      const b = (i.data && i.data.breakdown) || {};
      return [new Date(i.ts).toISOString(), i.host, i.url || '', i.framework, i.version, b.theme || '', hostingToList(b.headers).join('; '),
        techItems(b).map(t => t.version ? `${t.name} ${t.version}` : t.name).join('; '),
        (b.tags || []).map(t => t.name).join('; '), (b.trackingIds || []).join('; '), healthScore(b) == null ? '' : healthScore(b)].map(csvCell).join(',');
    });
    download(`framework-detector-history-${new Date().toISOString().slice(0, 10)}.csv`, [head.join(',')].concat(rows).join('\n'), 'text/csv');
    toast(`Exported ${list.length} scans`);
  });
}

// ---------- Discoveries (a private, local collection of what you've found) ----------
async function recordDiscoveries(data, host) {
  const s = await chrome.storage.local.get(['disc', 'scanCount']);
  const disc = s.disc || {};
  disc.platforms = disc.platforms || {}; disc.tech = disc.tech || {}; disc.sites = disc.sites || {};
  const newOnes = [];
  if (PLATFORMS.includes(data.framework) && !disc.platforms[data.framework]) { disc.platforms[data.framework] = Date.now(); newOnes.push(data.framework); }
  techItems(data.breakdown || {}).forEach(t => { if (!disc.tech[t.name]) disc.tech[t.name] = Date.now(); });
  if (Object.keys(disc.sites).length < 5000) disc.sites[host] = 1;
  await chrome.storage.local.set({ disc, scanCount: (s.scanCount || 0) + 1 });
  refreshCounts(disc);
  const n = Object.keys(disc.platforms).length;
  newOnes.forEach(p => toast(`New platform discovered: ${p} · ${n}/${PLATFORMS.length}`, 'discovery'));
}
function refreshCounts(discArg) {
  const apply = (disc) => {
    const n = Object.keys((disc && disc.platforms) || {}).filter(p => PLATFORMS.includes(p)).length;
    $('discCount').textContent = n;
    $('discBar').style.width = (PLATFORMS.length ? Math.round(n / PLATFORMS.length * 100) : 0) + '%';
  };
  if (discArg) apply(discArg);
  else chrome.storage.local.get(['disc', 'history'], (s) => { apply(s.disc); $('cntHistory').textContent = (s.history || []).length; });
}
function renderDiscoveries(disc, scans) {
  const plats = disc.platforms || {};
  $('dScans').textContent = scans;
  $('dSites').textContent = Object.keys(disc.sites || {}).length;
  $('dPlatforms').textContent = `${Object.keys(plats).filter(p => PLATFORMS.includes(p)).length}/${PLATFORMS.length}`;
  $('dTech').textContent = Object.keys(disc.tech || {}).length;
  const box = $('collection');
  box.innerHTML = '';
  PLATFORMS.slice().sort((a, b) => (plats[b] ? 1 : 0) - (plats[a] ? 1 : 0)).forEach(p => {
    const t = buildIcon(p, 'chip');
    t.classList.remove('logo-chip');
    if (!plats[p]) t.classList.add('locked');
    t.title = plats[p] ? `${p} — discovered ${new Date(plats[p]).toLocaleDateString()}` : `${p} — not found yet`;
    box.appendChild(t);
  });
  refreshCounts(disc);
}

// ---------- Share ----------
async function shareExtension() {
  const shareData = { title: 'Website Framework Detector', text: 'See what any website is built with — CMS, theme, plugins, tech stack & SEO health. 100% local.', url: STORE_URL };
  try { if (navigator.share) { await navigator.share(shareData); return; } } catch (_) { return; }
  try { await navigator.clipboard.writeText(STORE_URL); toast('Store link copied — thanks for sharing!'); }
  catch (_) { chrome.tabs.create({ url: STORE_URL }); }
}

// ---------- Review prompt (policy-safe, one-time) ----------
function recordSuccessAndMaybePrompt() {
  chrome.storage.local.get(['detectCount', 'reviewPrompted', 'reviewLaterAt'], (s) => {
    const count = (s.detectCount || 0) + 1;
    chrome.storage.local.set({ detectCount: count });
    if (s.reviewPrompted || isFull) return;
    const laterOk = !s.reviewLaterAt || (Date.now() - s.reviewLaterAt > REVIEW_REARM_MS);
    if (count >= REVIEW_AFTER && laterOk) $('reviewPrompt').classList.remove('hidden');
  });
}
function onReviewYes() {
  chrome.storage.local.set({ reviewPrompted: true });
  chrome.tabs.create({ url: REVIEW_URL });
  $('reviewPrompt').classList.add('hidden');
}
function onReviewLater() {
  chrome.storage.local.set({ reviewLaterAt: Date.now() });
  $('reviewPrompt').classList.add('hidden');
}
