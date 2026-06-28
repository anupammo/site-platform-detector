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
  // Analytics / tags
  'Google Tag Manager': 'googletagmanager', 'Meta Pixel': 'facebook', 'Hotjar': 'hotjar',
  'Cloudflare': 'cloudflare', 'HubSpot': 'hubspot', 'LinkedIn Insight': 'linkedin',
  'Twitter Pixel': 'x', 'Pinterest Tag': 'pinterest', 'TikTok Pixel': 'tiktok',
  'Intercom': 'intercom', 'Sitemap': 'sitemap'
};
function slugFor(name) {
  if (BRAND_SLUG[name]) return BRAND_SLUG[name];
  if (String(name).startsWith('Google Analytics')) return 'googleanalytics';
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
    'siteInfoRow', 'siteInfoBadges', 'pageInfoRow', 'pageInfoStats', 'pageInfoChecks',
    'errorBox', 'errorMsg', 'retryBtn', 'rescanBtn', 'copyBtn',
    'exportBtn', 'themeToggle', 'reviewPrompt', 'reviewYes', 'reviewLater', 'favicon', 'shareBtn'
  ].forEach(id => { els[id] = document.getElementById(id); });

  initTheme();
  els.themeToggle.addEventListener('click', toggleTheme);
  els.shareBtn.addEventListener('click', shareExtension);
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
    const ts = (typeof window.detectTechStack === 'function') ? window.detectTechStack() : { list: [], icons: [] };
    breakdown.techStack = ts.list;
  } catch (_) { breakdown.techStack = ['HTML', 'CSS', 'JavaScript']; }
  try {
    breakdown.siteInfo = (typeof window.detectSiteInfo === 'function') ? await window.detectSiteInfo() : null;
  } catch (_) { breakdown.siteInfo = null; }
  try {
    breakdown.pageInfo = (typeof window.detectPageInfo === 'function') ? window.detectPageInfo() : null;
  } catch (_) { breakdown.pageInfo = null; }
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
      files: ['themeDetector.js', 'techStackDetector.js', 'siteInfoDetector.js', 'pageInfoDetector.js', 'frameworkDetector.js']
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
  els.resultSubtitle.textContent = data.subtitle || '';

  // Confidence
  const pct = Math.max(0, Math.min(100, Number(data.confidence) || 0));
  els.confidenceValue.textContent = pct + '%';
  els.confidenceLevel.style.width = '0%';
  requestAnimationFrame(() => { els.confidenceLevel.style.width = pct + '%'; });

  // Theme
  const theme = data.breakdown && data.breakdown.theme;
  els.themeValue.textContent = theme || '';
  els.themeRow.classList.toggle('hidden', !theme);

  // Tech stack
  els.techStackChips.innerHTML = '';
  const tech = (data.breakdown && data.breakdown.techStack) || [];
  tech.forEach(name => els.techStackChips.appendChild(buildChip(name)));
  els.techStackRow.classList.toggle('hidden', tech.length === 0);

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
}

function buildHeroIcon(name) {
  const tile = buildIcon(name, 'hero');
  tile.id = 'resultIcon';
  return tile;
}
function buildChip(name) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.appendChild(buildIcon(name, 'chip'));
  const label = document.createElement('span');
  label.textContent = name;
  chip.appendChild(label);
  return chip;
}

function renderPageInfo(info) {
  els.pageInfoStats.innerHTML = '';
  els.pageInfoChecks.innerHTML = '';
  if (!info) { els.pageInfoRow.classList.add('hidden'); return; }

  const stats = [
    { label: 'Words', value: info.words.toLocaleString() },
    { label: 'Read time', value: info.readingTime + ' min' },
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

  const checks = [
    { label: 'HTTPS', ok: info.https },
    { label: 'Mobile-friendly', ok: info.mobileFriendly },
    { label: 'Meta description', ok: info.hasDescription },
    { label: 'Canonical', ok: info.canonical },
    { label: 'Social cards', ok: info.socialCards },
    { label: 'Structured data', ok: info.structuredData },
    { label: 'Single H1', ok: info.h1 === 1 }
  ];
  checks.forEach(c => {
    const chip = document.createElement('span');
    chip.className = 'check ' + (c.ok ? 'ok' : 'no');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', c.ok ? '#i-check' : '#i-x');
    svg.appendChild(use);
    chip.appendChild(svg);
    const label = document.createElement('span');
    label.textContent = c.label;
    chip.appendChild(label);
    els.pageInfoChecks.appendChild(chip);
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
    confidence: lastResult.confidence,
    theme: b.theme || null,
    techStack: b.techStack || [],
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
