// Header detector — reads the HTTP response headers of the current page to find
// hosting/CDN, web server, back-end language and security headers.
//
// It re-requests the page's OWN url (same-origin, HEAD), so every header is
// readable without any host permission. Runs only on demand, sends nothing anywhere.
(function () {
  const W = window.__wfd = window.__wfd || {};

  // [label, test(get, has)] — first-party hosting / CDN / proxy signals.
  const HOSTS = [
    ['Cloudflare', (g, h) => h('cf-ray') || h('cf-cache-status') || /cloudflare/i.test(g('server'))],
    ['Vercel', (g, h) => h('x-vercel-id') || h('x-vercel-cache') || /vercel/i.test(g('server'))],
    ['Netlify', (g, h) => h('x-nf-request-id') || /netlify/i.test(g('server'))],
    ['CloudFront', (g, h) => h('x-amz-cf-id') || /cloudfront/i.test(g('via')) || /cloudfront/i.test(g('x-cache'))],
    ['AWS', (g, h) => (h('x-amz-request-id') || h('x-amzn-requestid') || /AmazonS3|awselb/i.test(g('server')))],
    ['Fastly', (g, h) => /fastly/i.test(g('x-served-by') + g('via')) || h('fastly-debug-digest') || h('x-fastly-request-id')],
    ['GitHub Pages', (g, h) => h('x-github-request-id') || /github\.com/i.test(g('server'))],
    ['Akamai', (g, h) => h('x-akamai-transformed') || h('akamai-grn') || /akamai/i.test(g('server'))],
    ['Google Cloud', (g) => /google frontend|gws|gse|esf/i.test(g('server')) || /google/i.test(g('via'))],
    ['Azure', (g, h) => h('x-azure-ref') || h('x-msedge-ref') || /azure/i.test(g('server'))],
    ['Heroku', (g) => /vegur/i.test(g('via'))],
    ['Render', (g, h) => h('rndr-id') || h('x-render-origin-server')],
    ['Fly.io', (g, h) => h('fly-request-id') || /^fly\//i.test(g('server'))],
    ['Railway', (g, h) => h('x-railway-request-id') || /railway/i.test(g('server'))],
    ['WP Engine', (g, h) => /wp engine/i.test(g('x-powered-by')) || h('wpe-backend') || h('x-wpe-request-id')],
    ['Kinsta', (g, h) => h('x-kinsta-cache') || h('ki-cache-type')],
    ['Pantheon', (g, h) => h('x-pantheon-styx-hostname')],
    ['Acquia', (g, h) => h('x-ah-environment')],
    ['Hostinger', (g, h) => /hostinger/i.test(g('platform') + g('server')) || h('x-hcdn-request-id')],
    ['Bunny CDN', (g, h) => /bunnycdn/i.test(g('server')) || h('cdn-pullzone')],
    ['KeyCDN', (g) => /keycdn/i.test(g('server'))],
    ['Sucuri', (g, h) => h('x-sucuri-id') || /sucuri/i.test(g('server'))],
    ['Imperva', (g, h) => h('x-iinfo') || /imperva|incapsula/i.test(g('x-cdn'))],
    ['Shopify', (g, h) => h('x-shopid') || h('x-shopify-stage') || /shopify/i.test(g('powered-by'))],
    ['Wix', (g, h) => h('x-wix-request-id')],
    ['Squarespace', (g) => /squarespace/i.test(g('server'))],
    ['Varnish', (g, h) => h('x-varnish') || /varnish/i.test(g('via'))]
  ];

  // Web server name + version from the Server header.
  function parseServer(raw) {
    if (!raw) return null;
    const known = [
      [/nginx(?:\/([\d.]+))?/i, 'Nginx'], [/openresty(?:\/([\d.]+))?/i, 'OpenResty'], [/apache(?:\/([\d.]+))?/i, 'Apache'],
      [/litespeed/i, 'LiteSpeed'], [/microsoft-iis(?:\/([\d.]+))?/i, 'IIS'], [/caddy/i, 'Caddy'],
      [/kestrel/i, 'Kestrel'], [/envoy/i, 'Envoy'], [/gunicorn(?:\/([\d.]+))?/i, 'Gunicorn'], [/cowboy/i, 'Cowboy']
    ];
    for (const [re, name] of known) {
      const m = raw.match(re);
      if (m) return { name, version: m[1] || '' };
    }
    return null;
  }

  // Back-end language / framework from X-Powered-By and friends.
  function parseBackend(get) {
    const out = [];
    const xp = get('x-powered-by');
    const php = xp.match(/PHP\/?\s*([\d.]+)?/i);
    if (php) out.push({ name: 'PHP', version: php[1] || '' });
    if (/ASP\.NET/i.test(xp) || get('x-aspnet-version') || get('x-aspnetmvc-version')) out.push({ name: 'ASP.NET', version: get('x-aspnet-version') });
    if (/express/i.test(xp)) out.push({ name: 'Express', version: '' });
    if (/next\.js/i.test(xp)) out.push({ name: 'Next.js', version: (xp.match(/next\.js\s*([\d.]+)/i) || [])[1] || '' });
    if (/nuxt/i.test(xp)) out.push({ name: 'Nuxt', version: '' });
    if (/servlet|jsp|jboss|tomcat/i.test(xp)) out.push({ name: 'Java', version: '' });
    if (/phusion passenger/i.test(xp + get('server'))) out.push({ name: 'Phusion Passenger', version: '' });
    return out;
  }

  W.detectHeaders = async function detectHeaders() {
    const result = { available: false, hosting: [], server: '', serverInfo: null, backend: [], security: {}, all: {} };
    const U = W.util;
    let res = await U.fetchSoft(location.href, { method: 'HEAD' }, 2500);
    // Some servers reject HEAD; retry with GET (body is not read).
    if (res && (res.status === 405 || res.status === 501)) res = await U.fetchSoft(location.href, { method: 'GET' }, 2500);
    if (!res) return result;

    const h = res.headers;
    const get = (k) => (h.get(k) || '');
    const has = (k) => h.has(k);
    result.available = true;
    try { h.forEach((v, k) => { if (Object.keys(result.all).length < 80) result.all[k] = String(v).slice(0, 300); }); } catch (_) {}

    result.hosting = HOSTS.filter(([, test]) => { try { return test(get, has); } catch (_) { return false; } }).map(([n]) => n);
    // A generic AWS hit is redundant next to CloudFront.
    if (result.hosting.includes('CloudFront')) result.hosting = result.hosting.filter(x => x !== 'AWS');

    result.server = get('server');
    result.serverInfo = parseServer(result.server);
    result.backend = parseBackend(get);

    result.security = {
      hsts: has('strict-transport-security'),
      csp: has('content-security-policy') || W.util.q('meta[http-equiv="Content-Security-Policy" i]'),
      xfo: has('x-frame-options') || /frame-ancestors/i.test(get('content-security-policy')),
      xcto: has('x-content-type-options'),
      referrer: has('referrer-policy') || W.util.q('meta[name="referrer"]'),
      permissions: has('permissions-policy')
    };
    result.xRobotsTag = get('x-robots-tag');
    return result;
  };
})();
