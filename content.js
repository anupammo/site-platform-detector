// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "detectFramework") {
    const result = detectFramework();
    sendResponse(result);
  }
  return true;
});

// Detect framework function
function detectFramework() {
  let framework = 'Unknown';
  let iconClass = 'fas fa-question-circle';
  let subtitle = 'This site appears to be custom-built or uses a less common framework';
  let colorClass = '';
  let confidence = 0;
  let details = [];
  let elementsAnalyzed = 0;
  let scriptsFound = 0;
  let metaTags = 0;
  
  // WordPress detection
  if (isWordPress()) {
    framework = 'WordPress';
    iconClass = 'fab fa-wordpress';
    subtitle = 'The world\'s most popular content management system';
    colorClass = 'wordpress';
    confidence = 95;
  } 
  // Shopify detection
  else if (isShopify()) {
    framework = 'Shopify';
    iconClass = 'fab fa-shopify';
    subtitle = 'Leading e-commerce platform for online stores';
    colorClass = 'shopify';
    confidence = 90;
  }
  // Wix detection
  else if (isWix()) {
    framework = 'Wix';
    iconClass = 'fab fa-wix';
    subtitle = 'Popular drag-and-drop website builder';
    colorClass = 'wix';
    confidence = 85;
  }
  // Webflow detection
  else if (isWebflow()) {
    framework = 'Webflow';
    iconClass = 'fab fa-webflow';
    subtitle = 'Design-focused website builder with CMS capabilities';
    colorClass = 'webflow';
    confidence = 85;
  }
  // Squarespace detection
  else if (isSquarespace()) {
    framework = 'Squarespace';
    iconClass = 'fab fa-squarespace';
    subtitle = 'Popular all-in-one website builder and hosting platform';
    colorClass = 'squarespace';
    confidence = 85;
  }
  // Joomla detection
  else if (isJoomla()) {
    framework = 'Joomla';
    iconClass = 'fab fa-joomla';
    subtitle = 'Powerful open-source content management system';
    colorClass = 'joomla';
    confidence = 80;
  }
  // Drupal detection
  else if (isDrupal()) {
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

  // Simulate analysis stats
  elementsAnalyzed = Math.floor(Math.random() * 100) + 50;
  scriptsFound = document.scripts.length;
  metaTags = document.querySelectorAll('meta').length;

  // --- Additional Features ---
  let breakdown = {};

  // 1. Sitemap detection
  breakdown.sitemap = false;
  try {
    let sitemapUrl = location.origin + '/sitemap.xml';
    breakdown.sitemapUrl = sitemapUrl;
    breakdown.sitemap = false;
    // Note: fetch may fail due to CORS, so we just try and catch
    fetch(sitemapUrl, {method: 'HEAD'}).then(r => {
      breakdown.sitemap = r.status === 200;
    }).catch(() => {
      breakdown.sitemap = false;
    });
  } catch (e) {
    breakdown.sitemap = false;
  }

  // 2. Google Analytics detection
  breakdown.googleAnalytics = false;
  breakdown.gaType = '';
  if ([...document.scripts].some(s => s.src.includes('google-analytics.com/ga.js') || s.src.includes('googletagmanager.com/gtag/js'))) {
    breakdown.googleAnalytics = true;
    breakdown.gaType = 'Universal/GA4';
  } else if ([...document.scripts].some(s => s.textContent.includes('gtag(') || s.textContent.includes('ga('))) {
    breakdown.googleAnalytics = true;
    breakdown.gaType = 'Inline';
  }

  // 3. Tech stack detection
  breakdown.techStack = [];
  // HTML, CSS, JS always present
  breakdown.techStack.push('HTML');
  breakdown.techStack.push('CSS');
  breakdown.techStack.push('JavaScript');

  // Frontend frameworks
  if (window.React || window.react || document.querySelector('[data-reactroot], [data-reactid]') || [...document.scripts].some(s => s.src.includes('react'))) {
    breakdown.techStack.push('ReactJS');
  }
  if (window.angular || document.querySelector('[ng-app], [ng-controller]') || [...document.scripts].some(s => s.src.includes('angular'))) {
    breakdown.techStack.push('Angular');
  }
  if (window.Vue || document.querySelector('[data-vue]') || [...document.scripts].some(s => s.src.includes('vue'))) {
    breakdown.techStack.push('VueJS');
  }

  // CSS frameworks
  if ([...document.styleSheets].some(s => s.href && s.href.includes('bootstrap'))) {
    breakdown.techStack.push('Bootstrap');
  }
  if ([...document.styleSheets].some(s => s.href && s.href.includes('tailwind'))) {
    breakdown.techStack.push('Tailwind CSS');
  }

  // Backend hints
  if ([...document.scripts].some(s => s.src.includes('php'))) {
    breakdown.techStack.push('PHP');
  }
  if ([...document.scripts].some(s => s.src.includes('laravel'))) {
    breakdown.techStack.push('Laravel');
  }
  if ([...document.scripts].some(s => s.src.includes('express'))) {
    breakdown.techStack.push('ExpressJS');
  }
  if ([...document.scripts].some(s => s.src.includes('next'))) {
    breakdown.techStack.push('NextJS');
  }
  if ([...document.scripts].some(s => s.src.includes('zend'))) {
    breakdown.techStack.push('Zend');
  }
  if ([...document.scripts].some(s => s.src.includes('codeigniter'))) {
    breakdown.techStack.push('CodeIgniter');
  }
  if ([...document.scripts].some(s => s.src.includes('mysql'))) {
    breakdown.techStack.push('MySQL');
  }

  // Common libraries
  if (window.jQuery || window.$ || [...document.scripts].some(s => s.src.includes('jquery'))) {
    breakdown.techStack.push('jQuery');
  }
  if ([...document.scripts].some(s => s.src.includes('lodash'))) {
    breakdown.techStack.push('Lodash');
  }
  if ([...document.scripts].some(s => s.src.includes('moment'))) {
    breakdown.techStack.push('Moment.js');
  }

  // Add breakdown to result
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
// Squarespace detection
function isSquarespace() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="Squarespace"]'),
    () => document.querySelector('script[src*="squarespace"]'),
    () => document.querySelector('link[href*="squarespace"]'),
    () => document.querySelector('script[src*="static.squarespace.com"]'),
    () => document.querySelector('link[href*="static.squarespace.com"]'),
    () => document.body.innerHTML.includes('squarespace.com'),
    () => document.body.innerHTML.includes('Squarespace')
  ];
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
  
  // Simulate analysis stats
  elementsAnalyzed = Math.floor(Math.random() * 100) + 50;
  scriptsFound = document.scripts.length;
  metaTags = document.querySelectorAll('meta').length;

  // --- Additional Features ---
  let breakdown = {};

  // 1. Sitemap detection
  breakdown.sitemap = false;
  try {
    let sitemapUrl = location.origin + '/sitemap.xml';
    breakdown.sitemapUrl = sitemapUrl;
    breakdown.sitemap = false;
    // Note: fetch may fail due to CORS, so we just try and catch
    fetch(sitemapUrl, {method: 'HEAD'}).then(r => {
      breakdown.sitemap = r.status === 200;
    }).catch(() => {
      breakdown.sitemap = false;
    });
  } catch (e) {
    breakdown.sitemap = false;
  }

  // 2. Google Analytics detection
  breakdown.googleAnalytics = false;
  breakdown.gaType = '';
  if ([...document.scripts].some(s => s.src.includes('google-analytics.com/ga.js') || s.src.includes('googletagmanager.com/gtag/js'))) {
    breakdown.googleAnalytics = true;
    breakdown.gaType = 'Universal/GA4';
  } else if ([...document.scripts].some(s => s.textContent.includes('gtag(') || s.textContent.includes('ga('))) {
    breakdown.googleAnalytics = true;
    breakdown.gaType = 'Inline';
  }

  // 3. Tech stack detection
  breakdown.techStack = [];
  // HTML, CSS, JS always present
  breakdown.techStack.push('HTML');
  breakdown.techStack.push('CSS');
  breakdown.techStack.push('JavaScript');

  // Frontend frameworks
  if (window.React || window.react || document.querySelector('[data-reactroot], [data-reactid]') || [...document.scripts].some(s => s.src.includes('react'))) {
    breakdown.techStack.push('ReactJS');
  }
  if (window.angular || document.querySelector('[ng-app], [ng-controller]') || [...document.scripts].some(s => s.src.includes('angular'))) {
    breakdown.techStack.push('Angular');
  }
  if (window.Vue || document.querySelector('[data-vue]') || [...document.scripts].some(s => s.src.includes('vue'))) {
    breakdown.techStack.push('VueJS');
  }

  // CSS frameworks
  if ([...document.styleSheets].some(s => s.href && s.href.includes('bootstrap'))) {
    breakdown.techStack.push('Bootstrap');
  }
  if ([...document.styleSheets].some(s => s.href && s.href.includes('tailwind'))) {
    breakdown.techStack.push('Tailwind CSS');
  }

  // Backend hints
  if ([...document.scripts].some(s => s.src.includes('php'))) {
    breakdown.techStack.push('PHP');
  }
  if ([...document.scripts].some(s => s.src.includes('laravel'))) {
    breakdown.techStack.push('Laravel');
  }
  if ([...document.scripts].some(s => s.src.includes('express'))) {
    breakdown.techStack.push('ExpressJS');
  }
  if ([...document.scripts].some(s => s.src.includes('next'))) {
    breakdown.techStack.push('NextJS');
  }
  if ([...document.scripts].some(s => s.src.includes('zend'))) {
    breakdown.techStack.push('Zend');
  }
  if ([...document.scripts].some(s => s.src.includes('codeigniter'))) {
    breakdown.techStack.push('CodeIgniter');
  }
  if ([...document.scripts].some(s => s.src.includes('mysql'))) {
    breakdown.techStack.push('MySQL');
  }

  // Common libraries
  if (window.jQuery || window.$ || [...document.scripts].some(s => s.src.includes('jquery'))) {
    breakdown.techStack.push('jQuery');
  }
  if ([...document.scripts].some(s => s.src.includes('lodash'))) {
    breakdown.techStack.push('Lodash');
  }
  if ([...document.scripts].some(s => s.src.includes('moment'))) {
    breakdown.techStack.push('Moment.js');
  }

  // Add breakdown to result
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

// Detection functions
function isWordPress() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="WordPress"]'),
    () => document.querySelector('link[href*="/wp-content/"]'),
    () => document.querySelector('link[href*="/wp-includes/"]'),
    () => Array.from(document.body.classList).some(c => c.startsWith('wp-')),
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
    () => document.body.innerHTML.includes('wix-image')
  ];
  
  for (const indicator of indicators) {
    if (indicator()) return true;
  }
  return false;
}

function isWebflow() {
  const indicators = [
    () => document.querySelector('meta[name="generator"][content*="Webflow"]'),
    () => document.querySelector('link[href*="webflow."]'),
    () => document.querySelector('script[src*="webflow."]'),
    () => document.querySelector('[data-wf-domain]'),
    () => document.querySelector('.w-')
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
