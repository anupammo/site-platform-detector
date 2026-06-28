// Site info detector: analytics tags, pixels, CDN hints, and sitemap presence.
// Runs in the page's MAIN world, so runtime globals (window.analytics,
// window.mixpanel, …) are reliably detectable. Returns a Promise so the sitemap
// HEAD request is awaited before results are shown (no race with the popup).
function detectSiteInfo() {
  const info = {
    sitemapUrl: location.origin + '/sitemap.xml',
    sitemap: false,
    ga: false,
    gaType: '',
    gtm: false,
    fbPixel: false,
    hotjar: false,
    cloudflare: false,
    segment: false,
    mixpanel: false,
    hubspot: false,
    linkedin: false,
    twitter: false,
    clarity: false,
    pinterest: false,
    tiktok: false,
    bingUET: false,
    intercom: false
  };

  const hasGlobal = (name) => { try { return typeof window[name] !== 'undefined' && window[name] !== null; } catch (_) { return false; } };
  const srcMatch = (re) => { try { return [...document.scripts].some(s => s.src && re.test(s.src)); } catch (_) { return false; } };
  const inlineMatch = (re) => { try { return [...document.scripts].some(s => s.textContent && re.test(s.textContent)); } catch (_) { return false; } };

  try {
    // Google Analytics / GA4
    info.ga = srcMatch(/google-analytics\.com\/ga\.js|googletagmanager\.com\/gtag\/js/i) || inlineMatch(/gtag\(|\bga\(/);
    if (info.ga) info.gaType = srcMatch(/gtag\/js/i) ? 'GA4' : 'Universal/Inline';

    // Google Tag Manager
    info.gtm = srcMatch(/googletagmanager\.com\/gtm\.js/i) || inlineMatch(/GTM-[A-Z0-9]+/);

    // Facebook / Meta Pixel
    info.fbPixel = hasGlobal('fbq') || inlineMatch(/fbq\(/) || srcMatch(/connect\.facebook\.net\/.*\/fbevents\.js/i);

    // Hotjar
    info.hotjar = hasGlobal('hj') || srcMatch(/static\.hotjar\.com/i);

    // Cloudflare
    info.cloudflare = hasGlobal('__cfBeacon') || srcMatch(/static\.cloudflareinsights\.com|cloudflare/i);

    // Segment
    info.segment = hasGlobal('analytics') || srcMatch(/cdn\.segment\.com\/analytics\.js/i);

    // Mixpanel
    info.mixpanel = hasGlobal('mixpanel') || srcMatch(/cdn\.mxpnl\.com|mixpanel\.com/i);

    // HubSpot
    info.hubspot = hasGlobal('_hsq') || srcMatch(/js\.hs-scripts\.com|hs-analytics\.net/i);

    // LinkedIn Insight
    info.linkedin = hasGlobal('_linkedin_partner_id') || srcMatch(/snap\.licdn\.com\/li\.lms-analytics\/insight\.min\.js/i);

    // Twitter / X UWT
    info.twitter = hasGlobal('twq') || srcMatch(/static\.ads-twitter\.com\/uwt\.js/i);

    // Microsoft Clarity
    info.clarity = hasGlobal('clarity') || srcMatch(/clarity\.ms/i);

    // Pinterest Tag
    info.pinterest = hasGlobal('pintrk') || srcMatch(/s\.pinimg\.com\/ct\/core\.js/i);

    // TikTok Pixel
    info.tiktok = hasGlobal('ttq') || srcMatch(/analytics\.tiktok\.com|tiktok\.com\/i18n\/pixel/i);

    // Bing / Microsoft UET
    info.bingUET = hasGlobal('uetq') || srcMatch(/bat\.bing\.com\/bat\.js/i);

    // Intercom
    info.intercom = hasGlobal('Intercom') || srcMatch(/widget\.intercom\.io/i);
  } catch (_) { /* ignore */ }

  // Await the sitemap HEAD request (with a timeout) so the result is accurate.
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(info); } };
    const timer = setTimeout(finish, 1500);
    try {
      fetch(info.sitemapUrl, { method: 'HEAD' })
        .then(r => { info.sitemap = r.ok; })
        .catch(() => { info.sitemap = false; })
        .finally(() => { clearTimeout(timer); finish(); });
    } catch (_) {
      clearTimeout(timer);
      finish();
    }
  });
}

// Expose for on-demand MAIN-world injection.
if (typeof window !== "undefined") window.detectSiteInfo = detectSiteInfo;
