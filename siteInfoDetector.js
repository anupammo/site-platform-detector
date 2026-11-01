// Site info detector — analytics & ad tags (with their tracking IDs), plus
// robots.txt and sitemap checks. All local: the only requests go to the
// site's own robots.txt / sitemap, exactly as a crawler would see them.
(function () {
  const W = window.__wfd = window.__wfd || {};

  // [name, test(U)] — precise signals only (no generic globals like window.analytics).
  const TAGS = [
    ['Google Tag Manager', U => U.src(/googletagmanager\.com\/gtm\.js/i) || U.inline(/\bGTM-[A-Z0-9]{4,10}\b/)],
    ['Google Analytics 4', (U, ids) => ids.some(i => i.startsWith('G-'))],
    ['Universal Analytics', (U, ids) => ids.some(i => i.startsWith('UA-')) || U.src(/google-analytics\.com\/(?:analytics|ga)\.js/i) || U.inline(/\bga\(\s*['"]create['"]/)],
    ['Google Ads', (U, ids) => ids.some(i => i.startsWith('AW-')) || U.src(/googleadservices\.com\/pagead\/conversion/i)],
    ['Meta Pixel', U => U.has('fbq.callMethod') || U.has('fbq.queue') || U.src(/connect\.facebook\.net\/[^/]+\/fbevents\.js/i) || U.inline(/fbq\(\s*['"]init['"]/)],
    ['Hotjar', U => U.has('hj') && U.has('_hjSettings') || U.src(/static\.hotjar\.com/i)],
    ['Microsoft Clarity', U => U.src(/clarity\.ms\/tag\//i) || (typeof U.get('clarity') === 'function' && U.inline(/clarity\.ms/))],
    ['Cloudflare Web Analytics', U => U.has('__cfBeacon') || U.src(/static\.cloudflareinsights\.com/i)],
    ['Segment', U => U.src(/cdn\.segment\.com\/analytics/i) || U.has('analytics.SNIPPET_VERSION') || U.has('analytics._writeKey')],
    ['Mixpanel', U => U.has('mixpanel.__SV') || U.src(/cdn\.mxpnl\.com|cdn4\.mxpnl\.com/i)],
    ['Amplitude', U => U.src(/cdn\.amplitude\.com/i) || U.has('amplitude.getInstance')],
    ['Heap', U => U.src(/cdn\.heapanalytics\.com/i) || U.has('heap.appid')],
    ['PostHog', U => U.has('posthog.__loaded') || U.src(/posthog\.com|i\.posthog/i)],
    ['Plausible', U => U.src(/plausible\.io\/js|\/js\/plausible/i) || U.has('plausible')],
    ['Fathom', U => U.src(/cdn\.usefathom\.com/i)],
    ['Matomo', U => U.has('Matomo') || U.has('Piwik') || U.src(/matomo\.js|piwik\.js/i) || U.inline(/_paq\.push/)],
    ['Vercel Analytics', U => U.src(/\/_vercel\/insights\/script\.js|va\.vercel-scripts\.com/i)],
    ['HubSpot', U => U.src(/js\.hs-scripts\.com|js\.hs-analytics\.net|js\.hsforms\.net/i) || U.has('_hsq')],
    ['LinkedIn Insight', U => U.has('_linkedin_partner_id') || U.src(/snap\.licdn\.com\/li\.lms-analytics/i)],
    ['X (Twitter) Pixel', U => U.has('twq') || U.src(/static\.ads-twitter\.com\/uwt\.js/i)],
    ['Pinterest Tag', U => U.has('pintrk') || U.src(/s\.pinimg\.com\/ct\/core\.js/i)],
    ['TikTok Pixel', U => U.has('ttq') || U.src(/analytics\.tiktok\.com/i)],
    ['Snap Pixel', U => U.has('snaptr') || U.src(/sc-static\.net\/scevent/i)],
    ['Reddit Pixel', U => U.has('rdt') || U.src(/redditstatic\.com\/ads\/pixel\.js/i)],
    ['Microsoft UET', U => U.has('uetq') || U.src(/bat\.bing\.com\/bat\.js/i)],
    ['Yandex Metrica', U => U.has('ym') && U.src(/mc\.yandex\.ru/i) || U.src(/mc\.yandex\.ru\/metrika/i)],
    ['Adobe Analytics', U => U.has('s_gi') || U.src(/AppMeasurement|omtrdc\.net|assets\.adobedtm\.com/i)],
    ['FullStory', U => U.has('FS.identify') || U.src(/fullstory\.com\/s\/fs\.js|edge\.fullstory\.com/i)],
    ['Crazy Egg', U => U.src(/script\.crazyegg\.com/i)],
    ['Lucky Orange', U => U.src(/luckyorange\.(?:com|net)/i)]
  ];

  // Measurement / container IDs found in script URLs, inline snippets and GTM's runtime.
  function trackingIds(U) {
    const ids = new Set();
    const text = U.snapshot().scriptSrcs.join(' ') + '\n' + U.snapshot().inline;
    const add = (re) => { (text.match(re) || []).forEach(i => ids.add(i)); };
    add(/\bG-[A-Z0-9]{8,12}\b/g);
    add(/\bGTM-[A-Z0-9]{4,10}\b/g);
    add(/\bAW-\d{6,12}\b/g);
    add(/\bUA-\d{4,10}-\d{1,4}\b/g);
    // Tags loaded by GTM register themselves on window.google_tag_manager.
    U.safe(() => Object.keys(window.google_tag_manager || {}).forEach(k => { if (/^(G|GTM|AW)-[A-Z0-9]{4,12}$/.test(k)) ids.add(k); }));
    // Meta Pixel ID from fbq('init', '123…')
    const fb = text.match(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{8,20})['"]/);
    const out = [...ids];
    return { ids: out.slice(0, 12), fbPixelId: fb ? fb[1] : '' };
  }

  // ---- robots.txt ----
  function parseRobots(txt) {
    const lines = txt.split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
    const sitemaps = [];
    let agents = [], inRules = false, blocksAll = false;
    for (const line of lines) {
      const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
      if (!m) continue;
      const key = m[1].toLowerCase(), val = m[2].trim();
      if (key === 'sitemap') { if (val) sitemaps.push(val); continue; }
      if (key === 'user-agent') {
        if (inRules) { agents = []; inRules = false; }
        agents.push(val.toLowerCase());
        continue;
      }
      if (key === 'disallow' || key === 'allow') {
        inRules = true;
        if (key === 'disallow' && val === '/' && agents.includes('*')) blocksAll = true;
        if (key === 'allow' && val === '/' && agents.includes('*')) blocksAll = false;
      }
    }
    return { sitemaps, blocksAll };
  }

  const isXml = (ct, body) => /xml/i.test(ct) || /^\s*(<\?xml|<urlset|<sitemapindex)/i.test(body);

  async function probeSitemap(U, url) {
    let same = false;
    try { same = new URL(url, location.href).origin === location.origin; } catch (_) { return false; }
    if (!same) return true; // Declared in robots.txt on another host (e.g. a CDN): trust the declaration.
    const r = await U.fetchSoft(url, { method: 'GET' }, 2500);
    if (!r || !r.ok) return false;
    const ct = r.headers.get('content-type') || '';
    if (/gzip|x-gzip/i.test(ct) || /\.gz$/i.test(url)) return true;
    if (/text\/html/i.test(ct)) { try { r.body && r.body.cancel(); } catch (_) {} return false; } // SPA "soft 404"
    const head = await U.readHead(r, 2048);
    return isXml(ct, head);
  }

  W.detectSiteInfo = async function detectSiteInfo() {
    const U = W.util;
    const { ids, fbPixelId } = trackingIds(U);
    const tags = [];
    for (const [name, test] of TAGS) {
      let ok = false;
      try { ok = !!test(U, ids); } catch (_) { ok = false; }
      if (!ok) continue;
      let tagIds = [];
      if (name === 'Google Analytics 4') tagIds = ids.filter(i => i.startsWith('G-'));
      else if (name === 'Google Tag Manager') tagIds = ids.filter(i => i.startsWith('GTM-'));
      else if (name === 'Google Ads') tagIds = ids.filter(i => i.startsWith('AW-'));
      else if (name === 'Universal Analytics') tagIds = ids.filter(i => i.startsWith('UA-'));
      else if (name === 'Meta Pixel' && fbPixelId) tagIds = [fbPixelId];
      tags.push({ name, ids: tagIds });
    }

    // robots.txt + sitemap (sitemap URLs from robots.txt first, then common paths).
    const info = { tags, trackingIds: ids.concat(fbPixelId ? [fbPixelId] : []), sitemap: false, sitemapUrl: '', robots: { found: false, blocksAll: false, sitemaps: [] } };
    const isHttp = /^https?:$/.test(location.protocol);
    if (!isHttp) return info;

    const rr = await U.fetchSoft(location.origin + '/robots.txt', { method: 'GET' }, 2500);
    if (rr && rr.ok && !/text\/html/i.test(rr.headers.get('content-type') || '')) {
      const txt = (await U.readHead(rr, 64000)) || '';
      if (!/^\s*</.test(txt)) info.robots = { found: true, ...parseRobots(txt) };
    }

    const candidates = [...new Set(info.robots.sitemaps.concat(['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml'].map(p => location.origin + p)))].slice(0, 5);
    const results = await Promise.all(candidates.map(u => probeSitemap(U, u).catch(() => false)));
    const idx = results.findIndex(Boolean);
    if (idx >= 0) { info.sitemap = true; info.sitemapUrl = candidates[idx]; }
    return info;
  };
})();
