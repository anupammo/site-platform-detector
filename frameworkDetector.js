// Framework / CMS detector — runs in the page's MAIN world (injected on demand),
// so page-runtime globals (window.Shopify, window.wp, window.Webflow, …) are
// accessible alongside the DOM. Confidence is computed from the weighted sum of
// matched signals — never a random number.
//
// Signal weights (additive, capped at 98):
//   70 = definitive  (generator meta tag, unique runtime global)
//   40 = strong+     (unique platform asset / init script)
//   30 = strong      (vendor CDN host / asset path)
//   12 = weak        (class-name / markup hints)
function detectFramework() {
  const q = (sel) => { try { return !!document.querySelector(sel); } catch (_) { return false; } };
  const hasGlobal = (name) => { try { return typeof window[name] !== 'undefined' && window[name] !== null; } catch (_) { return false; } };
  const scriptSrcMatch = (re) => { try { return [...document.scripts].some(s => s.src && re.test(s.src)); } catch (_) { return false; } };
  const linkHrefMatch = (re) => { try { return [...document.querySelectorAll('link[href]')].some(l => re.test(l.href)); } catch (_) { return false; } };
  const bodyClass = (c) => { try { return !!(document.body && document.body.classList.contains(c)); } catch (_) { return false; } };

  const detectors = [
    {
      framework: 'WooCommerce', specific: true,
      iconClass: 'woocommerce', subtitle: 'WordPress-powered e-commerce store',
      colorClass: 'woocommerce',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="WooCommerce"]') },
        { w: 40, label: 'WooCommerce plugin assets', test: () => q('link[href*="/plugins/woocommerce/"], script[src*="/plugins/woocommerce/"]') },
        { w: 40, label: 'woocommerce body class', test: () => bodyClass('woocommerce') || bodyClass('woocommerce-page') || q('.woocommerce') },
        { w: 40, label: 'wc runtime params', test: () => hasGlobal('woocommerce_params') || hasGlobal('wc_add_to_cart_params') || hasGlobal('wc') }
      ]
    },
    {
      framework: 'WordPress',
      iconClass: 'wordpress', subtitle: "The world's most popular content management system",
      colorClass: 'wordpress',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="WordPress"]') },
        { w: 40, label: 'WP REST API link', test: () => q('link[rel="https://api.w.org/"]') },
        { w: 30, label: 'wp-content / wp-includes assets', test: () => q('link[href*="/wp-content/"], link[href*="/wp-includes/"], script[src*="/wp-content/"], script[src*="/wp-includes/"]') },
        { w: 70, label: 'window.wp runtime', test: () => hasGlobal('wp') },
        { w: 12, label: 'wp- body class', test: () => !!(document.body && [...document.body.classList].some(c => c.startsWith('wp-'))) }
      ]
    },
    {
      framework: 'Shopify',
      iconClass: 'shopify', subtitle: 'Leading e-commerce platform for online stores',
      colorClass: 'shopify',
      signals: [
        { w: 70, label: 'window.Shopify runtime', test: () => hasGlobal('Shopify') },
        { w: 40, label: 'Shopify CDN assets', test: () => scriptSrcMatch(/cdn\.shopify\.com|\/cdn\/shop\//i) || linkHrefMatch(/cdn\.shopify\.com|\/cdn\/shop\//i) },
        { w: 30, label: 'shopify meta / monorail', test: () => q('meta[name="shopify-digital-wallet"], meta[name="shopify-checkout-api-token"]') || scriptSrcMatch(/monorail-edge\.shopifysvc\.com/i) }
      ]
    },
    {
      framework: 'Wix',
      iconClass: 'wix', subtitle: 'Popular drag-and-drop website builder',
      colorClass: 'wix',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Wix"]') },
        { w: 40, label: 'wixstatic / parastorage assets', test: () => scriptSrcMatch(/(wixstatic\.com|parastorage\.com)/i) || linkHrefMatch(/(wixstatic\.com|parastorage\.com)/i) },
        { w: 70, label: 'Wix runtime globals', test: () => hasGlobal('wixBiSession') || hasGlobal('wixPerformanceMeasurements') || hasGlobal('wixEmbedsAPI') }
      ]
    },
    {
      framework: 'Webflow',
      iconClass: 'webflow', subtitle: 'Design-focused website builder with CMS capabilities',
      colorClass: 'webflow',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Webflow"]') },
        { w: 70, label: 'window.Webflow runtime', test: () => hasGlobal('Webflow') },
        { w: 40, label: 'data-wf-* attributes', test: () => q('[data-wf-page], [data-wf-site], [data-wf-status]') },
        { w: 30, label: 'webflow assets', test: () => scriptSrcMatch(/webflow(\.min)?\.js|(assets|assets-global)\.website-files\.com/i) }
      ]
    },
    {
      framework: 'Squarespace',
      iconClass: 'squarespace', subtitle: 'All-in-one website builder and hosting platform',
      colorClass: 'squarespace',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Squarespace"]') },
        { w: 40, label: 'squarespace CDN assets', test: () => scriptSrcMatch(/static\.squarespace\.com|squarespace-cdn\.com/i) || linkHrefMatch(/static\.squarespace\.com|squarespace-cdn\.com/i) },
        { w: 70, label: 'Squarespace runtime context', test: () => { try { return !!(window.Static && window.Static.SQUARESPACE_CONTEXT); } catch (_) { return false; } } }
      ]
    },
    {
      framework: 'Joomla',
      iconClass: 'joomla', subtitle: 'Powerful open-source content management system',
      colorClass: 'joomla',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Joomla"]') },
        { w: 40, label: '/media/system or /media/jui assets', test: () => q('script[src*="/media/system/"], link[href*="/media/system/"], script[src*="/media/jui/"], link[href*="/media/jui/"]') },
        { w: 70, label: 'window.Joomla runtime', test: () => hasGlobal('Joomla') }
      ]
    },
    {
      framework: 'Drupal',
      iconClass: 'drupal', subtitle: 'Enterprise-level open-source CMS',
      colorClass: 'drupal',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Drupal"], meta[name="Generator"][content*="Drupal"]') },
        { w: 70, label: 'window.Drupal runtime', test: () => hasGlobal('Drupal') },
        { w: 40, label: 'drupal-settings-json', test: () => q('script[data-drupal-selector="drupal-settings-json"], #drupal-settings-json') },
        { w: 30, label: '/sites/default assets', test: () => q('script[src*="/sites/default/files/"], link[href*="/sites/default/files/"]') }
      ]
    },
    {
      framework: 'Magento', specific: true,
      iconClass: 'magento', subtitle: 'Adobe Commerce — enterprise e-commerce platform',
      colorClass: 'magento',
      signals: [
        { w: 70, label: 'x-magento-init script', test: () => q('script[type="text/x-magento-init"]') },
        { w: 40, label: 'Magento static assets', test: () => scriptSrcMatch(/\/static\/(frontend|version)\/|\/pub\/static\//i) || linkHrefMatch(/\/static\/(frontend|version)\//i) },
        { w: 30, label: 'mage/ requirejs', test: () => scriptSrcMatch(/\/mage\/|requirejs\/require\.js/i) }
      ]
    },
    {
      framework: 'PrestaShop', specific: true,
      iconClass: 'prestashop', subtitle: 'Open-source e-commerce platform',
      colorClass: 'prestashop',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="PrestaShop"]') },
        { w: 70, label: 'window.prestashop runtime', test: () => hasGlobal('prestashop') },
        { w: 30, label: 'prestashop assets', test: () => scriptSrcMatch(/\/themes\/.+\/assets\/|prestashop/i) }
      ]
    },
    {
      framework: 'BigCommerce', specific: true,
      iconClass: 'bigcommerce', subtitle: 'SaaS e-commerce platform (Stencil)',
      colorClass: 'bigcommerce',
      signals: [
        { w: 70, label: 'window.BCData runtime', test: () => hasGlobal('BCData') },
        { w: 40, label: 'bigcommerce CDN', test: () => scriptSrcMatch(/cdn\d*\.bigcommerce\.com/i) || linkHrefMatch(/cdn\d*\.bigcommerce\.com/i) },
        { w: 30, label: 'stencil-utils', test: () => scriptSrcMatch(/stencil-utils/i) }
      ]
    },
    {
      framework: 'Ghost',
      iconClass: 'ghost', subtitle: 'Modern publishing platform for blogs & newsletters',
      colorClass: 'ghost',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Ghost"]') },
        { w: 40, label: 'ghost assets / sodo-search', test: () => scriptSrcMatch(/\/ghost\/|sodo-search|ghost\.io/i) || linkHrefMatch(/\/ghost\//i) }
      ]
    },
    {
      framework: 'Blogger',
      iconClass: 'blogger', subtitle: "Google's free blog publishing service",
      colorClass: 'blogger',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Blogger"]') },
        { w: 70, label: 'window._WidgetManager runtime', test: () => hasGlobal('_WidgetManager') },
        { w: 30, label: 'blogger / blogspot assets', test: () => scriptSrcMatch(/(www\.blogger\.com|blogblog\.com|blogspot\.com)/i) }
      ]
    },
    {
      framework: 'HubSpot CMS', specific: true,
      iconClass: 'hubspot', subtitle: 'Marketing-focused CMS by HubSpot',
      colorClass: 'hubspot',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="HubSpot"]') },
        { w: 70, label: 'window.hbspt runtime', test: () => hasGlobal('hbspt') },
        { w: 40, label: 'hubspot CMS assets', test: () => scriptSrcMatch(/hs-sites\.com|hubspotusercontent|hscollectedforms/i) }
      ]
    },
    {
      framework: 'Framer',
      iconClass: 'framer', subtitle: 'Design-first website builder',
      colorClass: 'framer',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Framer"]') },
        { w: 70, label: 'Framer runtime / attributes', test: () => hasGlobal('__framer__') || q('[data-framer-name], [data-framer-component-type]') },
        { w: 40, label: 'framerusercontent assets', test: () => scriptSrcMatch(/framerusercontent\.com|framer\.com/i) || linkHrefMatch(/framerusercontent\.com/i) }
      ]
    },
    {
      framework: 'Craft CMS',
      iconClass: 'craftcms', subtitle: 'Flexible content management system',
      colorClass: 'craftcms',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Craft CMS"]') },
        { w: 40, label: 'cpresources assets', test: () => scriptSrcMatch(/\/cpresources\//i) || linkHrefMatch(/\/cpresources\//i) }
      ]
    },
    {
      framework: 'Duda',
      iconClass: '', subtitle: 'Website builder for agencies',
      colorClass: '',
      signals: [
        { w: 70, label: 'Duda runtime', test: () => hasGlobal('_dmAPI') || hasGlobal('dmAPI') },
        { w: 40, label: 'duda CDN assets', test: () => scriptSrcMatch(/irp\.cdn-website\.com|cdn-website\.com/i) || linkHrefMatch(/irp\.cdn-website\.com|cdn-website\.com/i) }
      ]
    }
  ];

  // Score every detector by the weighted sum of its matched signals.
  const scored = detectors.map(d => {
    let score = 0; const matched = [];
    for (const s of d.signals) {
      let ok = false;
      try { ok = !!s.test(); } catch (_) { ok = false; }
      if (ok) { score += s.w; matched.push(s.label); }
    }
    return { ...d, score, matched };
  });

  let best = null;
  for (const d of scored) {
    if (d.score > 0 && (!best || d.score > best.score)) best = d;
  }

  // Prefer the more specific platform when present (e.g. show WooCommerce, not
  // just WordPress; Magento/PrestaShop over a generic match) even if a base
  // platform scored higher.
  const specific = scored
    .filter(d => d.specific && d.score >= 30)
    .sort((a, b) => b.score - a.score)[0];
  if (specific) best = specific;

  const realStats = {
    scriptsFound: document.scripts.length,
    metaTags: document.querySelectorAll('meta').length,
    linksFound: document.querySelectorAll('link').length
  };

  // Best-effort version from the generator meta tag (WordPress, Drupal, …).
  const versionFromGenerator = () => {
    try {
      const m = document.querySelector('meta[name="generator"], meta[name="Generator"]');
      const c = (m && m.content) || '';
      const match = c.match(/(\d+(?:\.\d+){1,2})/);
      return match ? match[1] : '';
    } catch (_) { return ''; }
  };

  if (best && best.score >= 20) {
    return {
      framework: best.framework,
      iconClass: best.iconClass,
      subtitle: best.subtitle,
      colorClass: best.colorClass,
      confidence: Math.min(98, best.score),
      version: versionFromGenerator(),
      details: best.matched.map(m => `Matched: ${m}`),
      ...realStats
    };
  }

  return {
    framework: 'Custom/Unknown',
    iconClass: '', subtitle: 'This site appears to be custom-built or uses a less common framework',
    colorClass: '',
    confidence: best ? Math.min(98, best.score) : 0,
    details: [
      'No generator meta tag for a known platform',
      'No platform-specific runtime globals found',
      'No platform-specific asset paths identified'
    ],
    ...realStats
  };
}

// Expose for on-demand MAIN-world injection (chrome.scripting two-step call).
if (typeof window !== "undefined") window.detectFramework = detectFramework;
