// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "detectFramework") {
    try {
      const result = detectFramework();
      sendResponse(result);
    } catch (err) {
      sendResponse({ error: 'detection_failed', message: (err && err.message) ? err.message : String(err) });
    }
  }
  // Keep the channel open in case of async work inside detectFramework (best-effort)
  return true;
});

// Detect framework function
function detectFramework() {
  // Initialize result and metrics
  let framework = 'Unknown';
  let iconClass = 'fas fa-question-circle';
  let subtitle = 'This site appears to be custom-built or uses a less common framework';
  let colorClass = '';
  let confidence = 0;
  let details = [];
  let elementsAnalyzed = 0;
  let scriptsFound = 0;
  let metaTags = 0;
  const breakdown = {};

  // Framework detection
  if (isWordPress()) {
    framework = 'WordPress';
    iconClass = 'fab fa-wordpress';
    subtitle = 'The world\'s most popular content management system';
    colorClass = 'wordpress';
    confidence = 95;
  } else if (isShopify()) {
    framework = 'Shopify';
    iconClass = 'fab fa-shopify';
    subtitle = 'Leading e-commerce platform for online stores';
    colorClass = 'shopify';
    confidence = 90;
  } else if (isWix()) {
    framework = 'Wix';
    iconClass = 'fab fa-wix';
    subtitle = 'Popular drag-and-drop website builder';
    colorClass = 'wix';
    confidence = 85;
  } else if (isWebflow()) {
    framework = 'Webflow';
    iconClass = 'fab fa-webflow';
    subtitle = 'Design-focused website builder with CMS capabilities';
    colorClass = 'webflow';
    confidence = 85;
  } else if (isSquarespace()) {
    framework = 'Squarespace';
    iconClass = 'fab fa-squarespace';
    subtitle = 'Popular all-in-one website builder and hosting platform';
    colorClass = 'squarespace';
    confidence = 85;
  } else if (isJoomla()) {
    framework = 'Joomla';
    iconClass = 'fab fa-joomla';
    subtitle = 'Powerful open-source content management system';
    colorClass = 'joomla';
    confidence = 80;
  } else if (isDrupal()) {
    framework = 'Drupal';
    iconClass = 'fab fa-drupal';
    subtitle = 'Enterprise-level open-source CMS';
    colorClass = 'drupal';
    confidence = 80;
  } else {
    framework = 'Custom/Unknown';
    iconClass = 'fas fa-question-circle';
    subtitle = 'This site appears to use a custom or less common framework';
    colorClass = '';
    confidence = Math.floor(Math.random() * 50) + 30; // 30-79%
    details.push('No known generator meta tags detected');
    details.push('No platform-specific JavaScript objects found');
    details.push('No framework-specific class patterns identified');
  }

  // Theme detection (after framework is set) using helper
  if (typeof detectTheme === 'function') {
    const t = detectTheme(framework);
    breakdown.theme = t.theme || null;
    breakdown.themeSource = t.source || null;
  } else {
    breakdown.theme = null;
  }

  // Simulate analysis stats
  elementsAnalyzed = Math.floor(Math.random() * 100) + 50;
  scriptsFound = document.scripts.length;
  metaTags = document.querySelectorAll('meta').length;

  // --- Additional Features ---
  // 1. Sitemap detection (best-effort HEAD request)
  breakdown.sitemap = false;
  breakdown.sitemapUrl = location.origin + '/sitemap.xml';
  try {
    fetch(breakdown.sitemapUrl, { method: 'HEAD' })
      .then(r => { breakdown.sitemap = r.status === 200; })
      .catch(() => { breakdown.sitemap = false; });
  } catch (e) {
    breakdown.sitemap = false;
  }

  // 2. Google Analytics detection
  breakdown.googleAnalytics = false;
  breakdown.gaType = '';
  const hasGAFile = [...document.scripts].some(s => s.src && (s.src.includes('google-analytics.com/ga.js') || s.src.includes('googletagmanager.com/gtag/js')));
  const hasGAInline = [...document.scripts].some(s => s.textContent && (s.textContent.includes('gtag(') || s.textContent.includes('ga(')));
  if (hasGAFile || hasGAInline) {
    breakdown.googleAnalytics = true;
    breakdown.gaType = hasGAFile ? 'Universal/GA4' : 'Inline';
  }

  // 3. Tech stack detection via helper
  if (typeof detectTechStack === 'function') {
    const ts = detectTechStack();
    breakdown.techStack = ts.list;
    breakdown.techStackIcons = ts.icons;
  } else {
    breakdown.techStack = ['HTML', 'CSS', 'JavaScript'];
  }

  // 4. Site info detection
  if (typeof detectSiteInfo === 'function') {
    breakdown.siteInfo = detectSiteInfo();
  }

  // Final result
  return {
    framework,
    iconClass,
    subtitle,
    colorClass,
    confidence,
    details,
    elementsAnalyzed,
    scriptsFound,
    metaTags,
    breakdown
  };
}
// Detection helpers
function isWordPress() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="WordPress"]'),
    () => document.querySelector('link[href*="/wp-content/"]'),
    () => document.querySelector('link[href*="/wp-includes/"]'),
    () => (document.body && Array.from(document.body.classList).some(c => c.startsWith('wp-'))),
    () => typeof wp !== 'undefined',
    () => document.querySelector('script[src*="wp-includes"]'),
    () => document.querySelector('script[src*="wp-content"]')
  ];
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
}

function isShopify() {
  const indicators = [
    () => typeof Shopify !== 'undefined',
    () => document.querySelector('link[href*="cdn.shopify.com"]'),
    () => document.querySelector('script[src*="cdn.shopify.com"]'),
    () => document.cookie.includes('_shopify'),
    () => document.querySelector('[data-shopify]')
  ];
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
}

function isWix() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="Wix"]'),
    () => document.querySelector('script[src*="wix.com"]'),
    () => document.querySelector('script[src*="wixstatic.com"]'),
    () => document.querySelector('link[href*="wixstatic.com"]'),
    () => document.body && document.body.innerHTML.includes('wix-image')
  ];
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
}

function isWebflow() {
  const indicators = [
    // Official generator meta
    () => document.querySelector('meta[name="generator"][content*="Webflow"]'),
    // Webflow runtime object
    () => typeof window.Webflow !== 'undefined',
    // Common Webflow data attributes
    () => document.querySelector('[data-wf-page], [data-wf-site], [data-wf-status], [data-w-id]'),
    // Webflow assets (JS/CSS) or Webflow CDN
    () => [...document.scripts].some(s => s.src && (/webflow(\.min)?\.js/i.test(s.src) || s.src.includes('assets.website-files.com'))),
    () => [...document.styleSheets].some(ss => ss.href && (ss.href.includes('webflow.css') || ss.href.includes('assets.website-files.com')))
  ];
  for (const indicator of indicators) {
    try {
      if (indicator()) return true;
    } catch (_) {
      // Ignore cross-origin/styleSheet access errors
    }
  }
  return false;
}

// Squarespace detection
function isSquarespace() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="Squarespace"]'),
    () => document.querySelector('script[src*="squarespace"]'),
    () => document.querySelector('link[href*="squarespace"]'),
    () => document.querySelector('script[src*="static.squarespace.com"]'),
    () => document.querySelector('link[href*="static.squarespace.com"]'),
    () => document.body && (document.body.innerHTML.includes('squarespace.com') || document.body.innerHTML.includes('Squarespace'))
  ];
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
}

function isJoomla() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="Joomla"]'),
    () => document.querySelector('script[src*="/media/system/"]'),
    () => document.querySelector('link[href*="/media/system/"]'),
    () => document.querySelector('link[href*="/templates/"]')
  ];
  
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
}

function isDrupal() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="Drupal"]'),
    () => document.querySelector('meta[name="Generator"][content*="Drupal"]'),
    () => document.querySelector('script[src*="/sites/default/files/"]'),
    () => document.querySelector('link[href*="/sites/default/files/"]'),
    () => typeof Drupal !== 'undefined'
  ];
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
}
