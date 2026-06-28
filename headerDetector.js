// Header detector — reads HTTP response headers of the current page to identify
// hosting/CDN, server software, back-end, and security headers.
//
// Runs in the page's MAIN world and fetches the page's OWN url (same-origin), so
// all response headers are readable and NO host permission is required. It's a
// request the page could make itself, runs only on demand, and sends nothing
// anywhere. Returns a Promise.
function detectHeaders() {
  const result = {
    available: false,
    hosting: [],      // CDN / hosting providers
    server: '',       // Server header (nginx, Apache, …)
    backend: '',      // language/runtime (PHP, ASP.NET, Express …)
    security: {}      // presence of common security headers
  };

  const finish = (h) => {
    if (!h) return result;
    result.available = true;
    const has = (k) => h.has(k);
    const get = (k) => (h.get(k) || '');
    const server = get('server');
    const via = get('via');

    const cdn = [];
    if (has('cf-ray') || has('cf-cache-status') || /cloudflare/i.test(server)) cdn.push('Cloudflare');
    if (has('x-vercel-id') || has('x-vercel-cache') || /vercel/i.test(server)) cdn.push('Vercel');
    if (has('x-nf-request-id') || /netlify/i.test(server)) cdn.push('Netlify');
    if (has('x-amz-cf-id') || /cloudfront/i.test(via)) cdn.push('CloudFront');
    if (/fastly/i.test(get('x-served-by')) || /fastly/i.test(via) || has('fastly-debug-digest')) cdn.push('Fastly');
    if (has('x-github-request-id')) cdn.push('GitHub Pages');
    if (has('x-akamai-transformed') || /akamai/i.test(server)) cdn.push('Akamai');
    if (/google frontend|gws|gse/i.test(server)) cdn.push('Google Cloud');
    if (has('x-amz-request-id') && !cdn.includes('CloudFront')) cdn.push('AWS');
    result.hosting = [...new Set(cdn)];

    // Server software (strip version into a clean label, keep raw too)
    if (server) result.server = server;

    // Back-end / runtime
    const xp = get('x-powered-by');
    if (xp) result.backend = xp;
    if (get('x-aspnet-version')) result.backend = 'ASP.NET ' + get('x-aspnet-version');

    result.security = {
      hsts: has('strict-transport-security'),
      csp: has('content-security-policy') || !!document.querySelector('meta[http-equiv="Content-Security-Policy" i]'),
      xfo: has('x-frame-options'),
      xcto: has('x-content-type-options'),
      referrer: has('referrer-policy'),
      permissions: has('permissions-policy')
    };
    return result;
  };

  return new Promise((resolve) => {
    let settled = false;
    const done = (h) => { if (!settled) { settled = true; resolve(finish(h)); } };
    const timer = setTimeout(() => done(null), 2500);
    try {
      fetch(location.href, { method: 'HEAD' })
        .then(r => { clearTimeout(timer); done(r.headers); })
        .catch(() => { clearTimeout(timer); done(null); });
    } catch (_) {
      clearTimeout(timer);
      done(null);
    }
  });
}

// Expose for on-demand MAIN-world injection.
if (typeof window !== "undefined") window.detectHeaders = detectHeaders;
