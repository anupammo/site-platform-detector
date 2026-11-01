// Popup controller: auto-detect on open, render results, copy/export,
// dark-mode toggle, and a policy-safe one-time review prompt.

const STORE_URL = 'https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn';
const REVIEW_URL = STORE_URL + '/reviews';
const REVIEW_AFTER = 5;            // successful detections before prompting
const REVIEW_REARM_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for "Not now"

// Map a detected name to its bundled brand logo (icons/brands/<slug>.svg).
// Anything without a brand logo falls back to a neutral generic icon.
const BRAND_SLUG = {
  // Platforms / CMS / e-commerce
  'WordPress': 'wordpress', 'WooCommerce': 'woocommerce', 'Shopify': 'shopify', 'Wix': 'wix',
  'Webflow': 'webflow', 'Squarespace': 'squarespace', 'Joomla': 'joomla', 'Drupal': 'drupal',
  'Magento': 'magento', 'PrestaShop': 'prestashop', 'BigCommerce': 'bigcommerce', 'Ghost': 'ghost',
  'Blogger': 'blogger', 'HubSpot CMS': 'hubspot', 'Framer': 'framer', 'Craft CMS': 'craftcms',
  // Languages & frameworks
  'HTML': 'html5', 'CSS': 'css3', 'JavaScript': 'javascript',
  'React': 'react', 'ReactJS': 'react', 'Preact': 'preact', 'Vue.js': 'vuedotjs', 'VueJS': 'vuedotjs', 'Angular': 'angular',
  'AngularJS': 'angular', 'Svelte': 'svelte', 'SvelteKit': 'svelte', 'SolidJS': 'solid', 'Qwik': 'qwik', 'Ember.js': 'emberdotjs',
  'Alpine.js': 'alpinedotjs', 'Next.js': 'nextdotjs', 'NextJS': 'nextdotjs', 'Nuxt': 'nuxtdotjs', 'NuxtJS': 'nuxtdotjs', 'Remix': 'remix',
  'Gatsby': 'gatsby', 'Astro': 'astro', 'Hugo': 'hugo', 'Jekyll': 'jekyll', 'Eleventy': 'eleventy',
  // CSS / libraries
  'Bootstrap': 'bootstrap', 'Tailwind CSS': 'tailwindcss', 'Font Awesome': 'fontawesome',
  'Google Fonts': 'googlefonts', 'jQuery': 'jquery', 'Lodash': 'lodash',
  'Three.js': 'threedotjs', 'GSAP': 'greensock', 'Stripe': 'stripe',
  'ASP.NET': 'dotnet', 'Ruby on Rails': 'rubyonrails',
  // Hosting / CDN / server / backend
  'Cloudflare': 'cloudflare', 'Vercel': 'vercel', 'Netlify': 'netlify', 'Fastly': 'fastly',
  'CloudFront': 'amazonwebservices', 'AWS': 'amazonwebservices', 'GitHub Pages': 'github',
  'Akamai': 'akamai', 'Google Cloud': 'googlecloud', 'Nginx': 'nginx', 'Apache': 'apache',
  'PHP': 'php',
  // Analytics / tags
  'Google Tag Manager': 'googletagmanager', 'Meta Pixel': 'facebook', 'Hotjar': 'hotjar',
  'Google Analytics 4': 'googleanalytics', 'Universal Analytics': 'googleanalytics',
  'HubSpot': 'hubspot', 'HubSpot Chat': 'hubspot', 'LinkedIn Insight': 'linkedin', 'Laravel': 'php',
  'X (Twitter) Pixel': 'x', 'Twitter Pixel': 'x', 'Pinterest Tag': 'pinterest', 'TikTok Pixel': 'tiktok',
  'Intercom': 'intercom', 'Sitemap': 'sitemap'
};
function slugFor(name) {
  if (BRAND_SLUG[name]) return BRAND_SLUG[name];
  // strip a trailing version (e.g. "jQuery 3.7.1" -> "jQuery")
  const base = String(name).replace(/\s+v?\d[\d.]*$/, '');
  if (BRAND_SLUG[base]) return BRAND_SLUG[base];
  if (base.startsWith('Google Analytics')) return 'googleanalytics';
  if (/^nginx/i.test(base)) return 'nginx';
  if (/^apache/i.test(base)) return 'apache';
  return '_generic';
}
function buildIcon(name, variant) {
  const tile = document.createElement('span');
  tile.className = 'logo-tile ' + (variant === 'hero' ? 'logo-hero' : 'logo-chip');
  const img = document.createElement('img');
  img.src = 'icons/brands/' + slugFor(name) + '.svg';
  img.alt = name;
  img.addEventListener('error', () => { img.src = 'icons/brands/_generic.svg'; }, { once: true });
  tile.appendChild(img);
  return tile;
}

const els = {};
let lastResult = null;
let currentHost = '';
let currentTab = null;

document.addEventListener('DOMContentLoaded', () => {
  [
    'currentUrl', 'loading', 'resultContainer', 'resultTitle', 'resultSubtitle', 'resultIcon',
    'confidenceLevel', 'confidenceValue', 'themeRow', 'themeValue', 'techStackRow', 'techStackChips',
    'siteInfoRow', 'siteInfoBadges', 'pageInfoRow', 'pageInfoStats',
    'whyToggle', 'whyChev', 'whyList', 'hostingRow', 'hostingChips', 'securityRow', 'securityChecks',
    'historyBtn', 'historyPanel', 'historyList', 'historyClear',
    'errorBox', 'errorMsg', 'retryBtn', 'rescanBtn', 'copyBtn',
    'exportBtn', 'themeToggle', 'reviewPrompt', 'reviewYes', 'reviewLater', 'favicon', 'shareBtn',
    'themeDetail', 'pluginsRow', 'pluginsChips', 'servicesRow', 'servicesChips',
    'healthRow', 'healthList', 'healthScore', 'reportBtn'
  ].forEach(id => { els[id] = document.getElementById(id); });

  initTheme();
  els.themeToggle.addEventListener('click', toggleTheme);
  els.shareBtn.addEventListener('click', shareExtension);
  els.whyToggle.addEventListener('click', toggleWhy);
  els.historyBtn.addEventListener('click', toggleHistory);
  els.historyClear.addEventListener('click', clearHistory);
  els.rescanBtn.addEventListener('click', () => detect());
  els.retryBtn.addEventListener('click', () => detect());
  els.copyBtn.addEventListener('click', copyResult);
  els.exportBtn.addEventListener('click', exportResult);
  els.reportBtn.addEventListener('click', reportResult);
  els.reviewYes.addEventListener('click', onReviewYes);
  els.reviewLater.addEventListener('click', onReviewLater);

  start();
});

// ---------- Theme ----------
function initTheme() {
  chrome.storage.local.get(['theme'], (s) => {
    if (s.theme === 'light' || s.theme === 'dark') {
      document.body.setAttribute('data-theme', s.theme);
      updateThemeIcon(s.theme);
    } else {
      updateThemeIcon(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  });
}
function toggleTheme() {
  const current = document.body.getAttribute('data-theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  updateThemeIcon(next);
  chrome.storage.local.set({ theme: next });
}
function updateThemeIcon(theme) {
  els.themeToggle.querySelector('use').setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
}

// ---------- Lifecycle ----------
async function start() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    try { currentHost = new URL(tab.url).hostname || tab.url; } catch { currentHost = tab.url || ''; }
    els.currentUrl.textContent = currentHost;
    setFavicon(tab.favIconUrl);

    if (!tab || !isSupportedTabUrl(tab.url)) {
      showError('Open a normal website tab (http/https) to run detection.');
      return;
    }
    detect();
  } catch (_) {
    showError('Could not read the current tab.');
  }
}

// Show the page's own favicon in the URL bar; fall back to the globe icon.
function setFavicon(favUrl) {
  if (!els.favicon || !favUrl || !/^(https?:|data:)/.test(favUrl)) return;
  const img = document.createElement('img');
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('load', () => { els.favicon.innerHTML = ''; els.favicon.appendChild(img); });
  img.addEventListener('error', () => { /* keep globe fallback */ });
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

async function detect() {
  if (!currentTab || !isSupportedTabUrl(currentTab.url)) {
    showError('Open a normal website tab (http/https) to run detection.');
    return;
  }
  showLoading();
  try {
    const target = { tabId: currentTab.id };
    await chrome.scripting.executeScript({ target, world: 'MAIN', files: DETECTOR_FILES });
    const results = await chrome.scripting.executeScript({ target, world: 'MAIN', func: runInPage });
    const data = results && results[0] && results[0].result;
    if (data && data.framework) {
      lastResult = data;
      displayResults(data);
      recordSuccessAndMaybePrompt();
    } else {
      showError('No result returned from the page.');
    }
  } catch (err) {
    console.error('[Framework Detector]', err);
    showError(friendlyError((err && err.message) ? err.message : String(err)));
  }
}

// Turn Chrome's injection errors into something a person can act on.
function friendlyError(msg) {
  if (/gallery cannot be scripted|chromewebstore|webstore/i.test(msg)) return 'Chrome does not allow extensions to read Chrome Web Store pages. Try any other website.';
  if (/file:\/\/|file url/i.test(msg)) return 'To scan local files, enable "Allow access to file URLs" for this extension in chrome://extensions.';
  if (/cannot access|cannot be scripted|permission/i.test(msg)) return 'Chrome blocks extensions on this page (browser, PDF or policy-protected page). Try a normal website.';
  if (/no tab|frame|was removed/i.test(msg)) return 'The page changed while scanning. Press Try again.';
  return 'Could not analyze this page: ' + msg;
}

// ---------- Rendering ----------
function showLoading() {
  els.loading.classList.remove('hidden');
  els.resultContainer.classList.add('hidden');
  els.errorBox.classList.add('hidden');
  els.reviewPrompt.classList.add('hidden');
}
function showError(msg) {
  els.errorMsg.textContent = msg || 'Could not analyze this page.';
  els.loading.classList.add('hidden');
  els.resultContainer.classList.add('hidden');
  els.errorBox.classList.remove('hidden');
}

// Which tech categories go in which popup section.
const PLUGIN_CATS = ['Plugins & apps'];
const SERVICE_CATS = ['Payments', 'Live chat & support', 'Cookie consent', 'Security', 'Search', 'Video & media', 'Maps', 'Monitoring', 'Email & marketing', 'A/B testing'];

function techItems(b) {
  const raw = (b && b.techStack) || [];
  // Older history/exports used plain strings.
  return raw.map(t => (typeof t === 'string' ? { name: t, cat: '', version: (b.techVersions || {})[t] || '' } : t));
}

function fillChips(container, row, items) {
  container.innerHTML = '';
  items.forEach(t => container.appendChild(buildChip(t.version ? `${t.name} ${t.version}` : t.name, t.name, t.cat)));
  row.classList.toggle('hidden', items.length === 0);
}

function displayResults(data) {
  const b = data.breakdown || {};
  // Hero
  els.resultIcon.replaceWith(buildHeroIcon(data.framework));
  els.resultIcon = document.getElementById('resultIcon');
  els.resultTitle.textContent = data.framework;
  const verEl = els.resultTitle.parentNode.querySelector('.ver-pill');
  if (verEl) verEl.remove();
  if (data.version) {
    const pill = document.createElement('span');
    pill.className = 'ver-pill';
    pill.textContent = 'v' + data.version;
    els.resultTitle.insertAdjacentElement('afterend', pill);
  }
  let subtitle = data.subtitle || '';
  if (data.parentPlatform) subtitle += ` · on ${data.parentPlatform.name}${data.parentPlatform.version ? ' ' + data.parentPlatform.version : ''}`;
  els.resultSubtitle.textContent = subtitle;

  // Confidence
  const pct = Math.max(0, Math.min(100, Number(data.confidence) || 0));
  els.confidenceValue.textContent = pct + '%';
  els.confidenceLevel.style.width = '0%';
  requestAnimationFrame(() => { els.confidenceLevel.style.width = pct + '%'; });

  // Why this result (matched evidence)
  els.whyList.innerHTML = '';
  const why = (data.details || []).slice();
  if (data.alsoDetected && data.alsoDetected.length) why.push('Also found signals of: ' + data.alsoDetected.join(', '));
  why.forEach(d => { const li = document.createElement('li'); li.textContent = d; els.whyList.appendChild(li); });
  els.whyToggle.style.display = why.length ? '' : 'none';

  // Theme
  els.themeValue.textContent = b.theme || '';
  els.themeDetail.textContent = b.themeDetail || '';
  els.themeRow.classList.toggle('hidden', !b.theme && !b.themeDetail);
  if (!b.theme && b.themeDetail) els.themeValue.textContent = 'Theme name not exposed';

  // Tech stack / plugins & apps / widgets & services
  const items = techItems(b);
  const plugins = items.filter(t => PLUGIN_CATS.includes(t.cat));
  const services = items.filter(t => SERVICE_CATS.includes(t.cat));
  const core = items.filter(t => !plugins.includes(t) && !services.includes(t));
  fillChips(els.techStackChips, els.techStackRow, core);
  fillChips(els.pluginsChips, els.pluginsRow, plugins);
  fillChips(els.servicesChips, els.servicesRow, services);

  // Hosting & server
  els.hostingChips.innerHTML = '';
  const host = hostingToList(b.headers);
  host.forEach(name => els.hostingChips.appendChild(buildChip(name)));
  els.hostingRow.classList.toggle('hidden', host.length === 0);

  // Security headers
  renderSecurity(b.headers);

  // Analytics & tags (with tracking IDs)
  els.siteInfoBadges.innerHTML = '';
  const tags = tagsToList(b);
  tags.forEach(t => els.siteInfoBadges.appendChild(buildChip(t.name, t.name, '', t.ids)));
  els.siteInfoRow.classList.toggle('hidden', tags.length === 0);

  // Site health + page info
  renderHealth(b.health, b.siteInfo);
  renderPageInfo(b.pageInfo);

  els.loading.classList.add('hidden');
  els.errorBox.classList.add('hidden');
  els.resultContainer.classList.remove('hidden');

  setBadge(data.framework);
  saveHistory(data);
}

function renderHealth(health, siteInfo) {
  els.healthList.innerHTML = '';
  if (!Array.isArray(health)) { els.healthRow.classList.add('hidden'); return; }
  const errors = health.filter(h => h.level === 'error').length;
  const warns = health.length - errors;
  els.healthScore.textContent = errors ? `${errors} critical` : (warns ? `${warns} to improve` : 'All good');
  const rows = health.slice().sort((a, b) => (a.level === 'error' ? 0 : 1) - (b.level === 'error' ? 0 : 1));
  if (siteInfo && siteInfo.sitemap) rows.push({ level: 'ok', text: 'XML sitemap found' + (siteInfo.sitemapUrl ? ` (${siteInfo.sitemapUrl.replace(/^https?:\/\/[^/]+/, '')})` : '') });
  if (siteInfo && siteInfo.robots && siteInfo.robots.found && !siteInfo.robots.blocksAll) rows.push({ level: 'ok', text: 'robots.txt allows crawling' });
  rows.forEach(h => {
    const li = document.createElement('li');
    li.className = h.level;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', h.level === 'ok' ? '#i-check' : (h.level === 'error' ? '#i-x' : '#i-alert'));
    svg.appendChild(use);
    const span = document.createElement('span');
    span.textContent = h.text;
    li.appendChild(svg); li.appendChild(span);
    els.healthList.appendChild(li);
  });
  els.healthRow.classList.toggle('hidden', rows.length === 0);
}

function hostingToList(h) {
  if (!h || !h.available) return [];
  const out = [...(h.hosting || [])];
  if (h.serverInfo) out.push(h.serverInfo.name + (h.serverInfo.version ? ' ' + h.serverInfo.version : ''));
  (h.backend || []).forEach(b => {
    if (typeof b === 'string') return;
    if (b.name === 'Next.js' || b.name === 'Nuxt') return; // shown in the tech stack
    out.push(b.name + (b.version ? ' ' + b.version : ''));
  });
  return [...new Set(out)];
}

function renderSecurity(h) {
  els.securityChecks.innerHTML = '';
  if (!h || !h.available) { els.securityRow.classList.add('hidden'); return; }
  const s = h.security || {};
  const items = [
    { label: 'HTTPS strict (HSTS)', ok: s.hsts },
    { label: 'CSP', ok: s.csp },
    { label: 'X-Frame-Options', ok: s.xfo },
    { label: 'X-Content-Type-Options', ok: s.xcto },
    { label: 'Referrer-Policy', ok: s.referrer },
    { label: 'Permissions-Policy', ok: s.permissions }
  ];
  items.forEach(c => els.securityChecks.appendChild(buildCheck(c.label, c.ok)));
  els.securityRow.classList.remove('hidden');
}

function buildCheck(label, ok) {
  const chip = document.createElement('span');
  chip.className = 'check ' + (ok ? 'ok' : 'no');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', ok ? '#i-check' : '#i-x');
  svg.appendChild(use);
  chip.appendChild(svg);
  const span = document.createElement('span');
  span.textContent = label;
  chip.appendChild(span);
  return chip;
}

function buildHeroIcon(name) {
  const tile = buildIcon(name, 'hero');
  tile.id = 'resultIcon';
  return tile;
}
function buildChip(label, logoName, category, ids) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  if (category) chip.title = category;
  chip.appendChild(buildIcon(logoName || label, 'chip'));
  const span = document.createElement('span');
  span.textContent = label;
  chip.appendChild(span);
  if (ids && ids.length) {
    const id = document.createElement('span');
    id.className = 'chip-id';
    id.textContent = ids.join(', ');
    chip.appendChild(id);
    chip.title = 'Tracking ID — click to copy';
    chip.style.cursor = 'copy';
    chip.addEventListener('click', () => { navigator.clipboard.writeText(ids.join(', ')).then(() => { id.textContent = 'copied'; setTimeout(() => { id.textContent = ids.join(', '); }, 1200); }).catch(() => {}); });
  }
  return chip;
}

function renderPageInfo(info) {
  els.pageInfoStats.innerHTML = '';
  if (!info) { els.pageInfoRow.classList.add('hidden'); return; }

  const stats = [
    { label: 'Words', value: (info.words || 0).toLocaleString() },
    { label: 'Read time', value: (info.readingTime || 0) + ' min' },
    { label: 'Images', value: info.images + (info.imagesMissingAlt ? ' (' + info.imagesMissingAlt + ' no alt)' : '') },
    { label: 'Links', value: info.links },
    { label: 'Scripts', value: info.scripts },
    { label: 'Headings', value: info.headings }
  ];
  stats.forEach(s => {
    const cell = document.createElement('div');
    cell.className = 'stat';
    const v = document.createElement('div'); v.className = 'stat-val'; v.textContent = s.value;
    const l = document.createElement('div'); l.className = 'stat-lbl'; l.textContent = s.label;
    cell.appendChild(v); cell.appendChild(l);
    els.pageInfoStats.appendChild(cell);
  });

  els.pageInfoRow.classList.remove('hidden');
}

function tagsToList(b) {
  if (Array.isArray(b.tags)) return b.tags;
  return [];
}

// ---------- Copy / Export / Report ----------
function buildExport() {
  if (!lastResult) return null;
  const b = lastResult.breakdown || {};
  const items = techItems(b);
  return {
    url: currentTab ? currentTab.url : currentHost,
    host: currentHost,
    detectedAt: new Date().toISOString(),
    extensionVersion: chrome.runtime.getManifest().version,
    platform: lastResult.framework,
    version: lastResult.version || null,
    runsOn: lastResult.parentPlatform || null,
    confidence: lastResult.confidence,
    evidence: lastResult.details || [],
    theme: b.theme || null,
    themeDetail: b.themeDetail || null,
    techStack: items,
    hosting: hostingToList(b.headers),
    securityHeaders: (b.headers && b.headers.available) ? b.headers.security : null,
    analyticsAndTags: tagsToList(b),
    trackingIds: b.trackingIds || [],
    sitemap: b.siteInfo ? { found: b.siteInfo.sitemap, url: b.siteInfo.sitemapUrl || null } : null,
    robotsTxt: b.siteInfo ? b.siteInfo.robots : null,
    health: b.health || [],
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
  if (d.health.length) {
    L.push('**Site health:**');
    d.health.forEach(h => L.push(`- ${h.level === 'error' ? '❌' : '⚠️'} ${h.text}`));
  }
  L.push('', `_Scanned ${d.detectedAt.slice(0, 10)} with Website Framework Detector — ${STORE_URL}_`);
  return L.join('\n');
}

async function copyResult() {
  const data = buildExport();
  if (!data) return;
  try {
    await navigator.clipboard.writeText(buildMarkdown(data));
    flash(els.copyBtn, 'Copied!');
  } catch (_) { flash(els.copyBtn, 'Copy failed'); }
}
function exportResult() {
  const data = buildExport();
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `framework-detector-${(currentHost || 'site').replace(/[^a-z0-9.-]/gi, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash(els.exportBtn, 'Saved!');
}

// Opens a pre-filled GitHub issue. Nothing is sent unless the user submits it.
function reportResult() {
  const d = buildExport();
  const title = `[Bug]: ${currentHost || 'site'} detected as "${d ? d.platform : 'error'}"`;
  const what = d
    ? `Detected **${d.platform}** (${d.confidence}% confidence).` + (d.evidence.length ? `\n\nEvidence:\n- ${d.evidence.join('\n- ')}` : '')
    : 'Detection failed on this page.';
  // Field ids match .github/ISSUE_TEMPLATE/bug_report.yml (issue forms accept them as URL params).
  const params = new URLSearchParams({
    template: 'bug_report.yml', title,
    url: d ? d.url : currentHost,
    'what-happened': what,
    expected: 'The site is actually built with: ',
    'extension-version': chrome.runtime.getManifest().version
  });
  const url = 'https://github.com/anupammo/site-platform-detector/issues/new?' + params.toString();
  chrome.tabs.create({ url });
}
function flash(btn, msg) {
  const label = btn.childNodes[btn.childNodes.length - 1];
  const original = label.textContent;
  label.textContent = ' ' + msg;
  btn.classList.add('copied');
  setTimeout(() => { label.textContent = original; btn.classList.remove('copied'); }, 1400);
}

// ---------- Why expander ----------
function toggleWhy() {
  const open = els.whyToggle.getAttribute('aria-expanded') === 'true';
  els.whyToggle.setAttribute('aria-expanded', String(!open));
  els.whyList.classList.toggle('hidden', open);
}

// ---------- Toolbar badge ----------
function setBadge(framework) {
  try {
    if (!chrome.action || !chrome.action.setBadgeText) return;
    const map = {
      'WordPress': 'WP', 'WooCommerce': 'Woo', 'Shopify': 'Shop', 'Wix': 'Wix', 'Webflow': 'WF',
      'Squarespace': 'Sqs', 'Joomla': 'Joo', 'Drupal': 'Dru', 'Magento': 'Mag', 'PrestaShop': 'PS',
      'BigCommerce': 'BC', 'Ghost': 'Gh', 'Blogger': 'Bl', 'HubSpot CMS': 'HS', 'Framer': 'Fr',
      'Craft CMS': 'Cft', 'Duda': 'Dud', 'OpenCart': 'OC', 'Shopware': 'SW', 'TYPO3': 'T3',
      'Next.js': 'Nxt', 'Nuxt': 'Nux', 'React': 'Rct', 'Vue.js': 'Vue', 'Angular': 'Ng', 'Custom/Unknown': '?'
    };
    const text = map[framework] || framework.slice(0, 3);
    const tabId = currentTab && currentTab.id;
    chrome.action.setBadgeBackgroundColor({ color: '#06038D', ...(tabId ? { tabId } : {}) });
    chrome.action.setBadgeText({ text, ...(tabId ? { tabId } : {}) });
  } catch (_) {}
}

// ---------- Detection history (local, private) ----------
const HISTORY_MAX = 25;
function saveHistory(data) {
  try {
    chrome.storage.local.get(['history', 'historyOff'], (s) => {
      if (s.historyOff) return;
      const list = Array.isArray(s.history) ? s.history : [];
      list.unshift({ host: currentHost, framework: data.framework, version: data.version || '', ts: Date.now() });
      chrome.storage.local.set({ history: list.slice(0, HISTORY_MAX) });
    });
  } catch (_) {}
}
function toggleHistory() {
  const willShow = els.historyPanel.classList.contains('hidden');
  if (willShow) renderHistory();
  els.historyPanel.classList.toggle('hidden', !willShow);
}
function renderHistory() {
  chrome.storage.local.get(['history'], (s) => {
    const list = Array.isArray(s.history) ? s.history : [];
    els.historyList.innerHTML = '';
    if (!list.length) {
      const p = document.createElement('div'); p.className = 'hist-empty';
      p.textContent = 'No scans yet. Detected sites will appear here.';
      els.historyList.appendChild(p);
      return;
    }
    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'hist-item';
      const tile = document.createElement('span');
      tile.className = 'mono-mini';
      const img = document.createElement('img');
      img.src = 'icons/brands/' + slugFor(item.framework) + '.svg';
      img.alt = '';
      img.addEventListener('error', () => { img.src = 'icons/brands/_generic.svg'; }, { once: true });
      tile.appendChild(img);
      const name = document.createElement('span');
      name.textContent = item.framework + (item.version ? ' ' + item.version : '');
      const host = document.createElement('span');
      host.className = 'hist-host';
      host.textContent = item.host;
      row.appendChild(tile); row.appendChild(name); row.appendChild(host);
      els.historyList.appendChild(row);
    });
  });
}
function clearHistory() {
  chrome.storage.local.set({ history: [] }, renderHistory);
}

// ---------- Share (outreach) ----------
async function shareExtension() {
  const shareData = {
    title: 'Website Framework Detector',
    text: 'Find out what any website is built with — CMS, builder, and tech stack. 100% local, no tracking.',
    url: STORE_URL
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
  } catch (_) { return; } // user cancelled the native sheet
  // Fallback: copy the store link and confirm on the button.
  try {
    await navigator.clipboard.writeText(STORE_URL);
    flashIcon(els.shareBtn, '#i-check');
  } catch (_) {
    chrome.tabs.create({ url: STORE_URL });
  }
}
function flashIcon(btn, tempHref) {
  const use = btn.querySelector('use');
  const original = use.getAttribute('href');
  use.setAttribute('href', tempHref);
  btn.classList.add('ok');
  setTimeout(() => { use.setAttribute('href', original); btn.classList.remove('ok'); }, 1400);
}

// ---------- Review prompt (policy-safe, one-time) ----------
function recordSuccessAndMaybePrompt() {
  chrome.storage.local.get(['detectCount', 'reviewPrompted', 'reviewLaterAt'], (s) => {
    const count = (s.detectCount || 0) + 1;
    chrome.storage.local.set({ detectCount: count });

    if (s.reviewPrompted) return;
    const laterOk = !s.reviewLaterAt || (Date.now() - s.reviewLaterAt > REVIEW_REARM_MS);
    if (count >= REVIEW_AFTER && laterOk) {
      els.reviewPrompt.classList.remove('hidden');
    }
  });
}
function onReviewYes() {
  chrome.storage.local.set({ reviewPrompted: true });
  chrome.tabs.create({ url: REVIEW_URL });
  els.reviewPrompt.classList.add('hidden');
}
function onReviewLater() {
  chrome.storage.local.set({ reviewLaterAt: Date.now() });
  els.reviewPrompt.classList.add('hidden');
}
