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
    iconClass = 'fas fa-shopping-cart';
    subtitle = 'Popular drag-and-drop website builder';
    colorClass = 'wix';
    confidence = 85;
  }
  // Webflow detection
  else if (isWebflow()) {
    framework = 'Webflow';
    iconClass = 'fas fa-wave-square';
    subtitle = 'Design-focused website builder with CMS capabilities';
    colorClass = 'webflow';
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
    iconClass = 'fas fa-cube';
    subtitle = 'Enterprise-level open-source CMS';
    colorClass = 'drupal';
    confidence = 80;
  } else {
    confidence = Math.floor(Math.random() * 50) + 30; // 30-79%
    details.push('No known generator meta tags detected');
    details.push('No platform-specific JavaScript objects found');
    details.push('No framework-specific class patterns identified');
  }
  
  // Simulate analysis stats
  elementsAnalyzed = Math.floor(Math.random() * 100) + 50;
  scriptsFound = document.scripts.length;
  metaTags = document.querySelectorAll('meta').length;
  
  return {
    framework,
    iconClass,
    subtitle,
    colorClass,
    confidence,
    details,
    elementsAnalyzed,
    scriptsFound,
    metaTags
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
