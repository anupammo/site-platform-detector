// Popup controller: auto-detect on open, render results, copy/export,
// dark-mode toggle, and a policy-safe one-time review prompt.

const REVIEW_URL = 'https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn/reviews';
const REVIEW_AFTER = 5;            // successful detections before prompting
const REVIEW_REARM_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for "Not now"

// Brand / category colors for the monogram badges.
const COLORS = {
  WordPress: '#21759b', Shopify: '#95BF47', Wix: '#0c6efc', Webflow: '#4353ff',
  Squarespace: '#111111', Joomla: '#5091cd', Drupal: '#0077C0', 'Custom/Unknown': '#6b7280',
  ReactJS: '#61dafb', VueJS: '#42b883', Angular: '#dd0031', Svelte: '#ff3e00',
  'Alpine.js': '#77c1d2', NextJS: '#111111', NuxtJS: '#00dc82', Gatsby: '#663399',
  Astro: '#ff5d01', Bootstrap: '#7952b3', 'Tailwind CSS': '#38bdf8', jQuery: '#0769ad',
  'ASP.NET': '#512bd4', 'Ruby on Rails': '#cc0000', Lodash: '#3492ff', 'Moment.js': '#777777',
  HTML: '#e34f26', CSS: '#1572b6', JavaScript: '#f7df1e'
};
const TAG_COLOR = '#4361ee';

function colorFor(name) { return COLORS[name] || TAG_COLOR; }
function initials(name) {
  const clean = String(name).replace(/\(.*?\)/g, '').trim();
  const words = clean.split(/[\s/.-]+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase().replace(/[^A-Z0-9]/g, '') || words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
function makeMono(name, cls) {
  const span = document.createElement('span');
  span.className = 'mono' + (cls ? ' ' + cls : '');
  span.style.background = colorFor(name);
  span.textContent = initials(name);
  // Pick readable text color for light backgrounds (e.g. JS yellow).
  span.style.color = isLight(colorFor(name)) ? '#111' : '#fff';
  return span;
}
function isLight(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
}

const els = {};
let lastResult = null;
let currentHost = '';
let currentTab = null;

document.addEventListener('DOMContentLoaded', () => {
  [
    'currentUrl', 'loading', 'resultContainer', 'resultTitle', 'resultSubtitle', 'resultIcon',
    'confidenceLevel', 'confidenceValue', 'themeRow', 'themeValue', 'techStackRow', 'techStackChips',
    'siteInfoRow', 'siteInfoBadges', 'errorBox', 'errorMsg', 'retryBtn', 'rescanBtn', 'copyBtn',
    'exportBtn', 'themeToggle', 'reviewPrompt', 'reviewYes', 'reviewLater'
  ].forEach(id => { els[id] = document.getElementById(id); });

  initTheme();
  els.themeToggle.addEventListener('click', toggleTheme);
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

    if (!tab || !isSupportedTabUrl(tab.url)) {
      showError('Open a normal website tab (http/https) to run detection.');
      return;
    }
    detect();
  } catch (_) {
    showError('Could not read the current tab.');
  }
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
  const fw = (typeof detectFramework === 'function')
    ? detectFramework()
    : { framework: 'Custom/Unknown', colorClass: '', subtitle: '', confidence: 0, details: [] };
  const breakdown = {};
  try {
    const t = (typeof detectTheme === 'function') ? detectTheme(fw.framework) : { theme: null, source: null };
    breakdown.theme = t.theme || null; breakdown.themeSource = t.source || null;
  } catch (_) { breakdown.theme = null; }
  try {
    const ts = (typeof detectTechStack === 'function') ? detectTechStack() : { list: [], icons: [] };
    breakdown.techStack = ts.list;
  } catch (_) { breakdown.techStack = ['HTML', 'CSS', 'JavaScript']; }
  try {
    breakdown.siteInfo = (typeof detectSiteInfo === 'function') ? await detectSiteInfo() : null;
  } catch (_) { breakdown.siteInfo = null; }
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
      files: ['themeDetector.js', 'techStackDetector.js', 'siteInfoDetector.js', 'frameworkDetector.js']
    });
    const results = await chrome.scripting.executeScript({ target, world: 'MAIN', func: collectInPage });
    const data = results && results[0] && results[0].result;
    if (data && data.framework) {
      lastResult = data;
      displayResults(data);
      recordSuccessAndMaybePrompt();
    } else {
      showError('Could not analyze this page.');
    }
  } catch (_) {
    showError('Could not analyze this page. It may be a protected or unsupported tab.');
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

  els.loading.classList.add('hidden');
  els.errorBox.classList.add('hidden');
  els.resultContainer.classList.remove('hidden');
}

function buildHeroIcon(name) {
  const m = makeMono(name);
  m.id = 'resultIcon';
  return m;
}
function buildChip(name) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.appendChild(makeMono(name));
  const label = document.createElement('span');
  label.textContent = name;
  chip.appendChild(label);
  return chip;
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
