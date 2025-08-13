// Site info detector: sitemap, analytics tags, pixels, cdn hints
// Returns an object with booleans/strings that popup can render with icons.
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
  try {
    fetch(info.sitemapUrl, { method: 'HEAD' })
      .then(r => { info.sitemap = r.status === 200; })
      .catch(() => { info.sitemap = false; });
  } catch(_) {}

  try {
    const scripts = [...document.scripts];
    const bodyHTML = document.body ? document.body.innerHTML : '';

    // Google Analytics / GTM
    info.ga = scripts.some(s => s.src && (s.src.includes('google-analytics.com/ga.js') || s.src.includes('googletagmanager.com/gtag/js'))) || scripts.some(s => s.textContent && (s.textContent.includes('gtag(') || s.textContent.includes('ga(')));
    if (info.ga) {
      info.gaType = scripts.some(s => s.src && s.src.includes('gtag/js')) ? 'GA4' : 'Universal/Inline';
    }
    info.gtm = scripts.some(s => s.src && s.src.includes('www.googletagmanager.com/gtm.js')) || bodyHTML.includes('GTM-');

    // Facebook Pixel
    info.fbPixel = scripts.some(s => s.textContent && s.textContent.includes('fbq(')) || bodyHTML.includes('connect.facebook.net/en_US/fbevents.js');

    // Hotjar
    info.hotjar = scripts.some(s => s.src && s.src.includes('static.hotjar.com'));

    // Cloudflare
    info.cloudflare = !!(window.__cfBeacon) || scripts.some(s => s.src && s.src.includes('cloudflare'));

    // Segment
    info.segment = typeof window.analytics !== 'undefined' || scripts.some(s => s.src && s.src.includes('cdn.segment.com/analytics.js'));

    // Mixpanel
    info.mixpanel = typeof window.mixpanel !== 'undefined' || scripts.some(s => s.src && (s.src.includes('cdn.mxpnl.com') || s.src.includes('mixpanel.com')));

    // HubSpot
    info.hubspot = typeof window._hsq !== 'undefined' || scripts.some(s => s.src && (s.src.includes('js.hs-scripts.com') || s.src.includes('hs-analytics.net')));

    // LinkedIn Insight
    info.linkedin = typeof window._linkedin_partner_id !== 'undefined' || scripts.some(s => s.src && s.src.includes('snap.licdn.com/li.lms-analytics/insight.min.js'));

    // Twitter UWT
    info.twitter = typeof window.twq !== 'undefined' || scripts.some(s => s.src && s.src.includes('static.ads-twitter.com/uwt.js'));

    // Microsoft Clarity
    info.clarity = typeof window.clarity !== 'undefined' || scripts.some(s => s.src && (s.src.includes('clarity.ms') || s.src.includes('www.clarity.ms')));

    // Pinterest Tag
    info.pinterest = typeof window.pintrk !== 'undefined' || scripts.some(s => s.src && s.src.includes('s.pinimg.com/ct/core.js'));

    // TikTok Pixel
    info.tiktok = typeof window.ttq !== 'undefined' || scripts.some(s => s.src && (s.src.includes('analytics.tiktok.com') || s.src.includes('tiktok.com/i18n/pixel')));

    // Bing UET
    info.bingUET = typeof window.uetq !== 'undefined' || scripts.some(s => s.src && s.src.includes('bat.bing.com/bat.js'));

    // Intercom
    info.intercom = typeof window.Intercom !== 'undefined' || scripts.some(s => s.src && s.src.includes('widget.intercom.io'));
  } catch(_) {}

  return info;
}
