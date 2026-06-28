// Framework / CMS detector — runs in the page's MAIN world (injected on demand),
// so page-runtime globals (window.Shopify, window.wp, window.Webflow, …) are
// accessible alongside the DOM. Confidence is computed from the weighted sum of
// matched signals — never a random number.
//
// Signal weights (additive, capped at 98):
//   70 = definitive  (generator meta tag, unique runtime global)
//   30 = strong      (unique first-party asset path / vendor CDN host)
//   12 = weak        (class-name / markup hints)
function detectFramework() {
  const q = (sel) => { try { return !!document.querySelector(sel); } catch (_) { return false; } };
  const hasGlobal = (name) => { try { return typeof window[name] !== 'undefined' && window[name] !== null; } catch (_) { return false; } };
  const scriptSrcMatch = (re) => { try { return [...document.scripts].some(s => s.src && re.test(s.src)); } catch (_) { return false; } };
  const linkHrefMatch = (re) => { try { return [...document.querySelectorAll('link[href]')].some(l => re.test(l.href)); } catch (_) { return false; } };

  const detectors = [
    {
      framework: 'WordPress',
      iconClass: 'fab fa-wordpress',
      subtitle: "The world's most popular content management system",
      colorClass: 'wordpress',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="WordPress"]') },
        { w: 30, label: 'wp-content / wp-includes assets', test: () => q('link[href*="/wp-content/"], link[href*="/wp-includes/"], script[src*="/wp-content/"], script[src*="/wp-includes/"]') },
        { w: 70, label: 'window.wp runtime', test: () => hasGlobal('wp') },
        { w: 12, label: 'wp- body class', test: () => !!(document.body && [...document.body.classList].some(c => c.startsWith('wp-'))) }
      ]
    },
    {
      framework: 'Shopify',
      iconClass: 'fab fa-shopify',
      subtitle: 'Leading e-commerce platform for online stores',
      colorClass: 'shopify',
      signals: [
        { w: 70, label: 'window.Shopify runtime', test: () => hasGlobal('Shopify') },
        { w: 30, label: 'cdn.shopify.com assets', test: () => scriptSrcMatch(/cdn\.shopify\.com/i) || linkHrefMatch(/cdn\.shopify\.com/i) },
        { w: 12, label: '[data-shopify] markup', test: () => q('[data-shopify]') }
      ]
    },
    {
      framework: 'Wix',
      iconClass: 'fab fa-wix',
      subtitle: 'Popular drag-and-drop website builder',
      colorClass: 'wix',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Wix"]') },
        { w: 30, label: 'wixstatic / parastorage assets', test: () => scriptSrcMatch(/(wixstatic\.com|parastorage\.com|static\.wixstatic)/i) || linkHrefMatch(/wixstatic\.com/i) },
        { w: 30, label: 'window.wixBiSession / wixPerformanceMeasurements', test: () => hasGlobal('wixBiSession') || hasGlobal('wixPerformanceMeasurements') }
      ]
    },
    {
      framework: 'Webflow',
      iconClass: 'fab fa-webflow',
      subtitle: 'Design-focused website builder with CMS capabilities',
      colorClass: 'webflow',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Webflow"]') },
        { w: 70, label: 'window.Webflow runtime', test: () => hasGlobal('Webflow') },
        { w: 30, label: 'data-wf-* attributes', test: () => q('[data-wf-page], [data-wf-site], [data-wf-status]') },
        { w: 30, label: 'webflow assets', test: () => scriptSrcMatch(/webflow(\.min)?\.js|assets\.website-files\.com|assets-global\.website-files\.com/i) }
      ]
    },
    {
      framework: 'Squarespace',
      iconClass: 'fab fa-squarespace',
      subtitle: 'Popular all-in-one website builder and hosting platform',
      colorClass: 'squarespace',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Squarespace"]') },
        { w: 30, label: 'static.squarespace assets', test: () => scriptSrcMatch(/static\.squarespace\.com|squarespace-cdn\.com/i) || linkHrefMatch(/static\.squarespace\.com|squarespace-cdn\.com/i) },
        { w: 30, label: 'Squarespace runtime context', test: () => { try { return !!(window.Static && window.Static.SQUARESPACE_CONTEXT); } catch (_) { return false; } } }
      ]
    },
    {
      framework: 'Joomla',
      iconClass: 'fab fa-joomla',
      subtitle: 'Powerful open-source content management system',
      colorClass: 'joomla',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Joomla"]') },
        { w: 30, label: '/media/system assets', test: () => q('script[src*="/media/system/"], link[href*="/media/system/"]') },
        { w: 30, label: 'window.Joomla runtime', test: () => hasGlobal('Joomla') }
      ]
    },
    {
      framework: 'Drupal',
      iconClass: 'fab fa-drupal',
      subtitle: 'Enterprise-level open-source CMS',
      colorClass: 'drupal',
      signals: [
        { w: 70, label: 'generator meta', test: () => q('meta[name="generator"][content*="Drupal"], meta[name="Generator"][content*="Drupal"]') },
        { w: 70, label: 'window.Drupal runtime', test: () => hasGlobal('Drupal') },
        { w: 30, label: '/sites/default assets', test: () => q('script[src*="/sites/default/files/"], link[href*="/sites/default/files/"]') }
      ]
    }
  ];

  // Score every detector by the weighted sum of its matched signals.
  let best = null;
  for (const d of detectors) {
    let score = 0;
    const matched = [];
    for (const s of d.signals) {
      let ok = false;
      try { ok = !!s.test(); } catch (_) { ok = false; }
      if (ok) { score += s.w; matched.push(s.label); }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { ...d, score, matched };
    }
  }

  const realStats = {
    scriptsFound: document.scripts.length,
    metaTags: document.querySelectorAll('meta').length,
    linksFound: document.querySelectorAll('link').length
  };

  if (best && best.score >= 20) {
    return {
      framework: best.framework,
      iconClass: best.iconClass,
      subtitle: best.subtitle,
      colorClass: best.colorClass,
      confidence: Math.min(98, best.score),
      details: best.matched.map(m => `Matched: ${m}`),
      ...realStats
    };
  }

  return {
    framework: 'Custom/Unknown',
    iconClass: 'fas fa-question-circle',
    subtitle: 'This site appears to be custom-built or uses a less common framework',
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
