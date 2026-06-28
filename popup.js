document.addEventListener('DOMContentLoaded', function() {
  const detectBtn = document.getElementById('detectBtn');
  const currentUrl = document.getElementById('currentUrl');
  const resultContainer = document.getElementById('resultContainer');
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const resultIcon = document.getElementById('resultIcon');
  const loading = document.getElementById('loading');
  const confidenceLevel = document.getElementById('confidenceLevel');
  const confidenceValue = document.getElementById('confidenceValue');
  const themeRow = document.getElementById('themeRow');
  const themeValue = document.getElementById('themeValue');
  const techStackRow = document.getElementById('techStackRow');
  const techStackChips = document.getElementById('techStackChips');
  const siteInfoRow = document.getElementById('siteInfoRow');
  const siteInfoBadges = document.getElementById('siteInfoBadges');
  
  function isSupportedTabUrl(urlStr) {
    try {
      const u = new URL(urlStr);
      const unsupported = ['chrome:', 'edge:', 'about:', 'chrome-extension:', 'moz-extension:', 'view-source:', 'devtools:'];
      if (unsupported.some(p => urlStr.startsWith(p))) return false;
      return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'file:';
    } catch (_) {
      return false;
    }
  }
  
  function showFriendlyError(message) {
    resultTitle.textContent = 'Detection Failed';
    resultSubtitle.textContent = message || 'Could not analyze this page';
    resultIcon.className = 'result-icon fas fa-exclamation-triangle';
    confidenceLevel.style.width = '0%';
    confidenceValue.textContent = '0%';
    loading.style.display = 'none';
    resultContainer.style.display = 'block';
  }
  
  // Get current tab URL and pre-validate support
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length > 0) {
      const tab = tabs[0];
      try {
        const url = new URL(tab.url);
        currentUrl.textContent = url.hostname || tab.url;
      } catch {
        currentUrl.textContent = tab.url || '';
      }
      if (!isSupportedTabUrl(tab.url)) {
        detectBtn.disabled = true;
        detectBtn.style.opacity = '0.6';
        detectBtn.title = 'Unsupported page. Open a normal website tab (http/https) to use detection.';
      }
    }
  });
  
  
  // Orchestrator executed in the page's MAIN world after the detector files are
  // injected. It calls the global detector functions and returns one result
  // object. Async so the sitemap HEAD request inside detectSiteInfo is awaited.
  async function collectInPage() {
    const fw = (typeof detectFramework === 'function')
      ? detectFramework()
      : { framework: 'Custom/Unknown', iconClass: 'fas fa-question-circle', subtitle: '', colorClass: '', confidence: 0, details: [] };

    const breakdown = {};
    try {
      const t = (typeof detectTheme === 'function') ? detectTheme(fw.framework) : { theme: null, source: null };
      breakdown.theme = t.theme || null;
      breakdown.themeSource = t.source || null;
    } catch (_) { breakdown.theme = null; }

    try {
      const ts = (typeof detectTechStack === 'function') ? detectTechStack() : { list: [], icons: [] };
      breakdown.techStack = ts.list;
      breakdown.techStackIcons = ts.icons;
    } catch (_) { breakdown.techStack = ['HTML', 'CSS', 'JavaScript']; }

    try {
      breakdown.siteInfo = (typeof detectSiteInfo === 'function') ? await detectSiteInfo() : null;
    } catch (_) { breakdown.siteInfo = null; }

    return { ...fw, breakdown };
  }

  // Detect framework button click — inject detectors on demand (activeTab + scripting)
  detectBtn.addEventListener('click', async function() {
    loading.style.display = 'block';
    resultContainer.style.display = 'none';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !isSupportedTabUrl(tab.url)) {
        showFriendlyError('Unsupported page. Open a normal website tab (http/https) and try again.');
        return;
      }

      const target = { tabId: tab.id };

      // 1) Inject the detector helpers into the page's MAIN world.
      await chrome.scripting.executeScript({
        target,
        world: 'MAIN',
        files: ['themeDetector.js', 'techStackDetector.js', 'siteInfoDetector.js', 'frameworkDetector.js']
      });

      // 2) Run the orchestrator and read back the serialized result.
      const results = await chrome.scripting.executeScript({
        target,
        world: 'MAIN',
        func: collectInPage
      });

      const data = results && results[0] && results[0].result;
      if (data && !data.error) {
        displayResults(data);
      } else {
        showFriendlyError('Could not analyze this page.');
      }
    } catch (err) {
      showFriendlyError('Could not analyze this page. It may be a protected or unsupported tab.');
    }
  });
  
  // Display results
  function displayResults(data) {
    resultTitle.textContent = data.framework;
    resultTitle.className = `result-title ${data.colorClass}`;
    resultSubtitle.textContent = data.subtitle;
    resultIcon.className = `result-icon ${data.iconClass} ${data.colorClass}`;
    
    // Update confidence meter
    confidenceLevel.style.width = `${data.confidence}%`;
    confidenceValue.textContent = `${data.confidence}%`;
    
    
    // Theme info
    themeRow.style.display = 'none';
    themeValue.textContent = '';
    if (data.breakdown && data.breakdown.theme) {
      themeValue.textContent = data.breakdown.theme;
      themeRow.style.display = 'block';
    }

    // Tech stack chips
    techStackRow.style.display = 'none';
    techStackChips.innerHTML = '';
    if (data.breakdown && (data.breakdown.techStackIcons || data.breakdown.techStack)) {
      const items = (data.breakdown.techStackIcons || []).length ? data.breakdown.techStackIcons : (data.breakdown.techStack || []).map(n => ({name: n, icon: 'fa-solid fa-circle'}));
      items.forEach(item => {
        const chip = document.createElement('span');
        chip.style.cssText = 'background: rgba(255,255,255,0.15); border: 1px solid rgba(0,0,0,0.05); padding: 6px 8px; border-radius: 8px; display:inline-flex; align-items:center; gap:6px; color: var(--primary); font-size: 12px;';
        const i = document.createElement('i');
        i.className = item.icon || 'fa-solid fa-circle';
        chip.appendChild(i);
        const label = document.createElement('span');
        label.textContent = item.name;
        chip.appendChild(label);
        techStackChips.appendChild(chip);
      });
      techStackRow.style.display = 'block';
    }

    // Site info badges
    siteInfoRow.style.display = 'none';
    siteInfoBadges.innerHTML = '';
    if (data.breakdown && data.breakdown.siteInfo) {
      const info = data.breakdown.siteInfo;
      const badges = [];
      if (info.sitemap) badges.push({ name: 'Sitemap', icon: 'fa-solid fa-sitemap' });
      if (info.ga) badges.push({ name: `Google Analytics${info.gaType ? ' (' + info.gaType + ')' : ''}`, icon: 'fa-brands fa-google' });
      if (info.gtm) badges.push({ name: 'Google Tag Manager', icon: 'fa-brands fa-google' });
      if (info.fbPixel) badges.push({ name: 'Facebook Pixel', icon: 'fa-brands fa-facebook' });
      if (info.hotjar) badges.push({ name: 'Hotjar', icon: 'fa-solid fa-temperature-high' });
      if (info.cloudflare) badges.push({ name: 'Cloudflare', icon: 'fa-solid fa-cloud' });
      if (info.segment) badges.push({ name: 'Segment', icon: 'fa-solid fa-diagram-project' });
      if (info.mixpanel) badges.push({ name: 'Mixpanel', icon: 'fa-solid fa-chart-line' });
      if (info.hubspot) badges.push({ name: 'HubSpot', icon: 'fa-solid fa-bullseye' });
      if (info.linkedin) badges.push({ name: 'LinkedIn Insight', icon: 'fa-brands fa-linkedin' });
      if (info.twitter) badges.push({ name: 'Twitter Pixel', icon: 'fa-brands fa-x-twitter' });
      if (info.clarity) badges.push({ name: 'Microsoft Clarity', icon: 'fa-solid fa-eye' });
      if (info.pinterest) badges.push({ name: 'Pinterest Tag', icon: 'fa-brands fa-pinterest' });
      if (info.tiktok) badges.push({ name: 'TikTok Pixel', icon: 'fa-brands fa-tiktok' });
      if (info.bingUET) badges.push({ name: 'Bing UET', icon: 'fa-brands fa-microsoft' });
      if (info.intercom) badges.push({ name: 'Intercom', icon: 'fa-solid fa-message' });
      badges.forEach(b => {
        const chip = document.createElement('span');
        chip.style.cssText = 'background: rgba(255,255,255,0.15); border: 1px solid rgba(0,0,0,0.05); padding: 6px 8px; border-radius: 8px; display:inline-flex; align-items:center; gap:6px; color: var(--primary); font-size: 12px;';
        const i = document.createElement('i');
        i.className = b.icon;
        chip.appendChild(i);
        const label = document.createElement('span');
        label.textContent = b.name;
        chip.appendChild(label);
        siteInfoBadges.appendChild(chip);
      });
      if (badges.length) siteInfoRow.style.display = 'block';
    }
    
    // Show results
    loading.style.display = 'none';
    resultContainer.style.display = 'block';
  }
  
  // Display error
  function displayError() {
    showFriendlyError('Could not analyze this page');
  }
});
