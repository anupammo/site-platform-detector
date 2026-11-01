// Shared helpers for all detectors. Injected first, into the page's MAIN world,
// only when the user opens the popup. Everything lives under one namespace
// (window.__wfd) that the popup deletes after the scan, so we never overwrite
// or leave behind globals on the page.
(function () {
  const W = window.__wfd = window.__wfd || {};

  const safe = (fn, fallback) => { try { return fn(); } catch (_) { return fallback; } };

  // A snapshot of the page's assets, taken once per scan.
  let snap = null;
  function snapshot() {
    const scripts = safe(() => [...document.scripts], []);
    snap = {
      scriptSrcs: scripts.map(s => s.src).filter(Boolean),
      inline: safe(() => scripts.filter(s => !s.src).map(s => (s.textContent || '').slice(0, 60000)).join('\n'), ''),
      linkHrefs: safe(() => [...document.querySelectorAll('link[href]')].map(l => l.href), []),
      iframeSrcs: safe(() => [...document.querySelectorAll('iframe[src]')].map(f => f.src), []),
      generators: safe(() => [...document.querySelectorAll('meta[name="generator" i]')].map(m => m.content || ''), []),
      head: safe(() => (document.head ? document.head.innerHTML.slice(0, 300000) : ''), ''),
      cookies: safe(() => document.cookie || '', '')
    };
    snap.assets = snap.scriptSrcs.concat(snap.linkHrefs);
    return snap;
  }
  const S = () => snap || snapshot();

  // Resolve a dotted global path ("Shopify.theme.name") without throwing.
  function get(path) {
    return safe(() => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), window), undefined);
  }
  const has = (path) => { const v = get(path); return v !== undefined && v !== null; };
  const q = (sel) => safe(() => !!document.querySelector(sel), false);
  const qa = (sel) => safe(() => [...document.querySelectorAll(sel)], []);

  // Return the first matching URL (truthy) so callers can show it as evidence.
  const firstMatch = (list, re) => list.find(u => re.test(u)) || '';
  const src = (re) => firstMatch(S().scriptSrcs, re);
  const link = (re) => firstMatch(S().linkHrefs, re);
  const asset = (re) => firstMatch(S().assets, re);
  const iframe = (re) => firstMatch(S().iframeSrcs, re);
  const inline = (re) => safe(() => S().inline.match(re), null);
  const cookie = (re) => re.test(S().cookies);
  const headHtml = (re) => re.test(S().head);

  // Match a generator <meta>; returns the match array (group 1 = version) or null.
  function gen(re) {
    for (const g of S().generators) { const m = g.match(re); if (m) return m; }
    return null;
  }

  // Does any element expose a JS property whose name starts with one of the prefixes?
  // Used for React / Vue apps that don't expose a global.
  function expando(prefixes, selector) {
    const els = qa(selector || '#root, #app, #__next, #___gatsby, #__nuxt, [data-reactroot], body > div, body > main, body > section');
    for (const el of els.slice(0, 40)) {
      const keys = safe(() => Object.keys(el), []);
      if (keys.some(k => prefixes.some(p => k.startsWith(p)))) return el;
    }
    return null;
  }

  // Any element with an attribute whose name matches the regex (e.g. data-v-1a2b3c4d)?
  function attrName(re, limit = 600) {
    const els = qa('body *');
    for (const el of els.slice(0, limit)) {
      const attrs = el.attributes || [];
      for (let i = 0; i < attrs.length; i++) if (re.test(attrs[i].name)) return true;
    }
    return false;
  }

  // CSS custom property defined on <html> or <body> (e.g. Tailwind's --tw-*).
  function cssVar(name) {
    return safe(() => {
      const a = getComputedStyle(document.documentElement).getPropertyValue(name);
      const b = document.body ? getComputedStyle(document.body).getPropertyValue(name) : '';
      return (a || b || '').trim();
    }, '');
  }

  // fetch() with a timeout that never rejects. Returns Response or null.
  function fetchSoft(url, opts = {}, ms = 2500) {
    return new Promise((resolve) => {
      let done = false;
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t = setTimeout(() => { if (!done) { done = true; if (ctrl) ctrl.abort(); resolve(null); } }, ms);
      try {
        fetch(url, { credentials: 'same-origin', cache: 'no-store', redirect: 'follow', ...opts, ...(ctrl ? { signal: ctrl.signal } : {}) })
          .then(r => { if (!done) { done = true; clearTimeout(t); resolve(r); } })
          .catch(() => { if (!done) { done = true; clearTimeout(t); resolve(null); } });
      } catch (_) { clearTimeout(t); resolve(null); }
    });
  }

  // Read only the first few KB of a response body (sitemaps can be huge).
  async function readHead(res, max = 4096) {
    try {
      if (!res.body || !res.body.getReader) return (await res.text()).slice(0, max);
      const reader = res.body.getReader();
      let out = '';
      const dec = new TextDecoder();
      while (out.length < max) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
      }
      try { reader.cancel(); } catch (_) {}
      return out.slice(0, max);
    } catch (_) { return ''; }
  }

  const shortUrl = (u) => safe(() => { const x = new URL(u, location.href); return (x.host === location.host ? '' : x.host) + x.pathname.slice(0, 60); }, String(u).slice(0, 60));

  W.util = { safe, snapshot, get, has, q, qa, src, link, asset, iframe, inline, cookie, headHtml, gen, expando, attrName, cssVar, fetchSoft, readHead, shortUrl };
})();
