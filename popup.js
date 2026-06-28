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
  'ReactJS': 'react', 'Preact': 'preact', 'VueJS': 'vuedotjs', 'Angular': 'angular',
  'Svelte': 'svelte', 'SolidJS': 'solid', 'Qwik': 'qwik', 'Ember': 'emberdotjs',
  'Alpine.js': 'alpinedotjs', 'NextJS': 'nextdotjs', 'NuxtJS': 'nuxtdotjs', 'Remix': 'remix',
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
  'HubSpot': 'hubspot', 'LinkedIn Insight': 'linkedin',
  'Twitter Pixel': 'x', 'Pinterest Tag': 'pinterest', 'TikTok Pixel': 'tiktok',
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
    'exportBtn', 'themeToggle', 'reviewPrompt', 'reviewYes', 'reviewLater', 'favicon', 'shareBtn'
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

// Orchestrator executed in the page's MAIN world after detector files inject.
async function collectInPage() {
  const fw = (typeof window.detectFramework === 'function')
    ? window.detectFramework()
    : { framework: 'Custom/Unknown', colorClass: '', subtitle: 'Detector script did not load on this page', confidence: 0, details: [] };
  const breakdown = {};
  try {
    const t = (typeof window.detectTheme === 'function') ? window.detectTheme(fw.framework) : { theme: null, source: null };
    breakdown.theme = t.theme || null; breakdown.themeSource = t.source || null;
  } catch (_) { breakdown.theme = null; }
  try {
    const ts = (typeof window.detectTechStack === 'function') ? window.detectTechStack() : { list: [], versions: {} };
    breakdown.techStack = ts.list;
    breakdown.techVersions = ts.versions || {};
  } catch (_) { breakdown.techStack = ['HTML', 'CSS', 'JavaScript']; breakdown.techVersions = {}; }
  try {
    breakdown.siteInfo = (typeof window.detectSiteInfo === 'function') ? await window.detectSiteInfo() : null;
  } catch (_) { breakdown.siteInfo = null; }
  try {
    breakdown.pageInfo = (typeof window.detectPageInfo === 'function') ? window.detectPageInfo() : null;
  } catch (_) { breakdown.pageInfo = null; }
  try {
    breakdown.headers = (typeof window.detectHeaders === 'function') ? await window.detectHeaders() : null;
  } catch (_) { breakdown.headers = null; }
  return { ...fw, breakdown };
}

async function detect() {
  if (!currentTab || !isSupportedTabUrl(currentTab.url)) {
    showError('Open a normal website tab (http/https) to run detection.');
    return;
  }
  showLoading();
  try {
    const target = { tabId: currentTab.id };
    await chrome.scripting.executeScript({
      target, world: 'MAIN',
      files: ['themeDetector.js', 'techStackDetector.js', 'siteInfoDetector.js', 'pageInfoDetector.js', 'headerDetector.js', 'frameworkDetector.js']
    });
    const results = await chrome.scripting.executeScript({ target, world: 'MAIN', func: collectInPage });
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
    const msg = (err && err.message) ? err.message : String(err);
    showError('Could not analyze this page: ' + msg);
  }
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

function displayResults(data) {
  // Hero
  els.resultIcon.replaceWith(buildHeroIcon(data.framework));
  els.resultIcon = document.getElementById('resultIcon');
  els.resultTitle.textContent = data.framework;
  // Version pill next to the platform name
  const verEl = els.resultTitle.parentNode.querySelector('.ver-pill');
  if (verEl) verEl.remove();
  if (data.version) {
    const pill = document.createElement('span');
    pill.className = 'ver-pill';
    pill.textContent = 'v' + data.version;
    els.resultTitle.insertAdjacentElement('afterend', pill);
  }
  els.resultSubtitle.textContent = data.subtitle || '';

  // Confidence
  const pct = Math.max(0, Math.min(100, Number(data.confidence) || 0));
  els.confidenceValue.textContent = pct + '%';
  els.confidenceLevel.style.width = '0%';
  requestAnimationFrame(() => { els.confidenceLevel.style.width = pct + '%'; });

  // Why this result (matched signals)
  els.whyList.innerHTML = '';
  const why = (data.details || []).map(d => d.replace(/^Matched:\s*/, ''));
  why.forEach(d => { const li = document.createElement('li'); li.textContent = d; els.whyList.appendChild(li); });
  els.whyToggle.style.display = why.length ? '' : 'none';

  // Theme
  const theme = data.breakdown && data.breakdown.theme;
  els.themeValue.textContent = theme || '';
  els.themeRow.classList.toggle('hidden', !theme);

  // Tech stack (with versions where known)
  els.techStackChips.innerHTML = '';
  const tech = (data.breakdown && data.breakdown.techStack) || [];
  const versions = (data.breakdown && data.breakdown.techVersions) || {};
  tech.forEach(name => {
    const label = versions[name] ? `${name} ${versions[name]}` : name;
    els.techStackChips.appendChild(buildChip(label, name));
  });
  els.techStackRow.classList.toggle('hidden', tech.length === 0);

  // Hosting & server
  els.hostingChips.innerHTML = '';
  const host = hostingToList(data.breakdown && data.breakdown.headers);
  host.forEach(name => els.hostingChips.appendChild(buildChip(name)));
  els.hostingRow.classList.toggle('hidden', host.length === 0);

  // Security headers
  renderSecurity(data.breakdown && data.breakdown.headers);

  // Analytics & tags
  els.siteInfoBadges.innerHTML = '';
  const tags = siteInfoToList(data.breakdown && data.breakdown.siteInfo);
  tags.forEach(name => els.siteInfoBadges.appendChild(buildChip(name)));
  els.siteInfoRow.classList.toggle('hidden', tags.length === 0);

  // Page info
  renderPageInfo(data.breakdown && data.breakdown.pageInfo);

  els.loading.classList.add('hidden');
  els.errorBox.classList.add('hidden');
  els.resultContainer.classList.remove('hidden');

  setBadge(data.framework);
  saveHistory(data);
}

function hostingToList(h) {
  if (!h || !h.available) return [];
  const out = [...(h.hosting || [])];
  if (h.server) {
    if (/nginx/i.test(h.server)) out.push('Nginx');
    else if (/apache/i.test(h.server)) out.push('Apache');
    else if (/iis|microsoft/i.test(h.server)) out.push('IIS');
    else if (/litespeed/i.test(h.server)) out.push('LiteSpeed');
  }
  if (h.backend) {
    if (/php/i.test(h.backend)) out.push('PHP');
    else if (/asp\.net|aspnet/i.test(h.backend)) out.push('ASP.NET');
    else if (/express/i.test(h.backend)) out.push('Express');
  }
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
function buildChip(label, logoName) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.appendChild(buildIcon(logoName || label, 'chip'));
  const span = document.createElement('span');
  span.textContent = label;
  chip.appendChild(span);
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

function siteInfoToList(info) {
  if (!info) return [];
  const out = [];
  if (info.sitemap) out.push('Sitemap');
  if (info.ga) out.push('Google Analytics' + (info.gaType ? ' (' + info.gaType + ')' : ''));
  if (info.gtm) out.push('Google Tag Manager');
  if (info.fbPixel) out.push('Meta Pixel');
  if (info.hotjar) out.push('Hotjar');
  if (info.cloudflare) out.push('Cloudflare');
  if (info.segment) out.push('Segment');
  if (info.mixpanel) out.push('Mixpanel');
  if (info.hubspot) out.push('HubSpot');
  if (info.linkedin) out.push('LinkedIn Insight');
  if (info.twitter) out.push('Twitter Pixel');
  if (info.clarity) out.push('Microsoft Clarity');
  if (info.pinterest) out.push('Pinterest Tag');
  if (info.tiktok) out.push('TikTok Pixel');
  if (info.bingUET) out.push('Bing UET');
  if (info.intercom) out.push('Intercom');
  return out;
}

// ---------- Copy / Export ----------
function buildExport() {
  if (!lastResult) return null;
  const b = lastResult.breakdown || {};
  return {
    url: currentHost,
    detectedAt: new Date().toISOString(),
    framework: lastResult.framework,
    version: lastResult.version || null,
    confidence: lastResult.confidence,
    theme: b.theme || null,
    techStack: b.techStack || [],
    techVersions: b.techVersions || {},
    hosting: hostingToList(b.headers),
    securityHeaders: (b.headers && b.headers.available) ? b.headers.security : null,
    analyticsAndTags: siteInfoToList(b.siteInfo),
    pageInfo: b.pageInfo || null,
    stats: { scripts: lastResult.scriptsFound, metaTags: lastResult.metaTags, links: lastResult.linksFound }
  };
}
async function copyResult() {
  const data = buildExport();
  if (!data) return;
  const text =
    `Website Framework Detector\n` +
    `URL: ${data.url}\n` +
    `Platform: ${data.framework} (${data.confidence}% confidence)\n` +
    (data.theme ? `Theme: ${data.theme}\n` : '') +
    (data.techStack.length ? `Tech stack: ${data.techStack.join(', ')}\n` : '') +
    (data.analyticsAndTags.length ? `Analytics & tags: ${data.analyticsAndTags.join(', ')}\n` : '');
  try {
    await navigator.clipboard.writeText(text.trim());
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
      'Craft CMS': 'Cft', 'Duda': 'Dud', 'Custom/Unknown': '?'
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
