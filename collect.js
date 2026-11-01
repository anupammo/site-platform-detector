// Orchestrator — runs all detectors in the page and returns one plain object.
// Injected last; the popup calls window.__wfd.collect() and then deletes
// window.__wfd so nothing is left behind on the page.
(function () {
  const W = window.__wfd = window.__wfd || {};

  // When no CMS/builder is found, name the site after its main framework
  // instead of a bare "Unknown" (most custom sites are built on one of these).
  const FALLBACK = [
    ['Next.js', 'React framework (custom-built site)'], ['Nuxt', 'Vue framework (custom-built site)'],
    ['Gatsby', 'React static site generator'], ['Remix', 'React full-stack framework'], ['React Router', 'React full-stack framework'],
    ['SvelteKit', 'Svelte framework (custom-built site)'], ['Astro', 'Content-focused web framework'],
    ['Hugo', 'Static site generator (Go)'], ['Jekyll', 'Static site generator (Ruby)'], ['Eleventy', 'Static site generator (JavaScript)'],
    ['Hexo', 'Static site generator (Node.js)'], ['Angular', 'Custom app built with Angular'], ['React', 'Custom app built with React'],
    ['Vue.js', 'Custom app built with Vue'], ['Svelte', 'Custom app built with Svelte'], ['AngularJS', 'Custom app built with AngularJS (legacy)'],
    ['Laravel', 'Custom PHP app (Laravel)'], ['Ruby on Rails', 'Custom Ruby on Rails app'], ['Django', 'Custom Python app (Django)'],
    ['ASP.NET', 'Custom .NET app']
  ];

  // PHP branches and the date their security support ends (php.net/supported-versions).
  const PHP_EOL = { '5': '2018-12-31', '7': '2022-11-28', '8.0': '2023-11-26', '8.1': '2025-12-31', '8.2': '2026-12-31', '8.3': '2027-12-31', '8.4': '2028-12-31' };

  function phpEol(version) {
    if (!version) return '';
    const [maj, min] = version.split('.');
    const key = maj === '8' ? `8.${min || 0}` : maj;
    const d = PHP_EOL[key];
    return d && Date.now() > Date.parse(d) ? d : '';
  }

  // Every check: [id, level-if-failing, failed?, fail text, pass text, how to fix].
  // Returns { failed: [...], passed: [...] }.
  function healthChecks(pi, si, hd) {
    const C = [];
    const add = (id, level, failed, text, okText, tip) => C.push({ id, level, failed: !!failed, text, okText, tip });
    if (pi) {
      add('noindex', 'error', /noindex/i.test(pi.robots) || (hd && /noindex/i.test(hd.xRobotsTag || '')),
        'Page is set to noindex — search engines will not show it', 'Page can be indexed',
        'Remove "noindex" from the robots meta tag / X-Robots-Tag header (WordPress: Settings → Reading).');
      add('no-https', 'error', !pi.https, 'Page is not served over HTTPS', 'Served over HTTPS',
        'Install a TLS certificate (free with Let\'s Encrypt or Cloudflare) and redirect http → https.');
      add('mixed-content', 'error', pi.mixedContent > 0, `${pi.mixedContent} insecure http:// resource(s) on an https page`, 'No mixed content',
        'Change the listed resource URLs to https:// so browsers don\'t block them.');
      add('no-title', 'error', !pi.titleLength, 'Missing <title>', 'Has a page title', 'Add a unique, descriptive <title> (50–60 characters).');
      if (pi.titleLength) add('title-long', 'warn', pi.titleLength > 65, `Title is ${pi.titleLength} characters (aim for under 60)`, `Title length OK (${pi.titleLength} chars)`,
        'Google truncates titles around 60 characters — put the key phrase first.');
      add('no-description', 'warn', !pi.hasDescription, 'Missing meta description', 'Has a meta description',
        'Add a 120–155 character meta description; it is the snippet people read in search results.');
      add('h1', 'warn', pi.h1 !== 1, pi.h1 === 0 ? 'No H1 heading' : `${pi.h1} H1 headings (use one)`, 'One H1 heading',
        'Use exactly one H1 that describes the page topic.');
      add('canonical-elsewhere', 'warn', pi.canonicalOtherHost, 'Canonical URL points to another domain', pi.canonical ? 'Canonical tag set' : 'No conflicting canonical',
        'A cross-domain canonical tells Google to index the other site instead — check it is intentional.');
      add('no-viewport', 'warn', !pi.mobileFriendly, 'No mobile viewport meta tag', 'Mobile viewport set',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">.');
      add('no-lang', 'warn', !pi.lang, 'No lang attribute on <html>', `Language declared (${pi.lang})`,
        'Add lang="en" (or your language) to the <html> tag for accessibility and SEO.');
      add('img-alt', 'warn', pi.imagesMissingAlt > 0, `${pi.imagesMissingAlt} image(s) without alt text`, 'All images have alt text',
        'Describe each meaningful image in its alt attribute; use alt="" for decorative ones.');
      add('no-social', 'warn', !pi.socialCards, 'No Open Graph / social share tags', 'Social share tags present',
        'Add og:title, og:description and og:image so links look good on WhatsApp, LinkedIn and X.');
      add('no-schema', 'warn', !pi.structuredData, 'No structured data (JSON-LD)', 'Structured data present',
        'Add schema.org JSON-LD (Organization, Product, Article…) to qualify for rich results.');
    }
    if (si && /^https?:$/.test(location.protocol)) {
      add('robots-blocks-all', 'error', si.robots && si.robots.blocksAll, 'robots.txt blocks all crawlers (Disallow: /)',
        si.robots && si.robots.found ? 'robots.txt allows crawling' : 'No robots.txt block',
        'Remove "Disallow: /" under "User-agent: *" — common after launching from a staging site.');
      add('no-sitemap', 'warn', !si.sitemap, 'No XML sitemap found', 'XML sitemap found' + (si.sitemapUrl ? ` (${si.sitemapUrl.replace(/^https?:\/\/[^/]+/, '') || si.sitemapUrl})` : ''),
        'Publish /sitemap.xml and list it in robots.txt and Google Search Console.');
    }
    if (hd && hd.available) {
      const php = (hd.backend || []).find(b => b.name === 'PHP');
      if (php && php.version) {
        const eol = phpEol(php.version);
        add('php-eol', 'error', !!eol, `PHP ${php.version} is end-of-life (no security fixes since ${eol})`, `PHP ${php.version} is supported`,
          'Ask your host to upgrade to a supported PHP version (8.3+).');
      }
      add('server-version', 'warn', hd.serverInfo && hd.serverInfo.version, `Server reveals its version (${hd.serverInfo ? hd.serverInfo.name + ' ' + hd.serverInfo.version : ''})`, 'Server version hidden',
        'Hide version numbers (nginx: server_tokens off; Apache: ServerTokens Prod) so attackers can\'t target known bugs.');
    }
    const failed = C.filter(c => c.failed).map(c => ({ id: c.id, level: c.level, text: c.text, tip: c.tip }));
    const passed = C.filter(c => !c.failed).map(c => ({ id: c.id, text: c.okText }));
    return { failed, passed };
  }

  W.collect = async function collect() {
    const U = W.util;
    U.snapshot();

    // Network checks run in parallel with the DOM work.
    const headersP = W.detectHeaders().catch(() => null);
    const siteInfoP = W.detectSiteInfo().catch(() => null);

    const headers = await headersP;
    const fw = W.detectFramework(headers);
    let tech = { items: [], list: [], versions: {} };
    try { tech = W.detectTechStack(headers); } catch (_) {}

    if (fw.framework === 'Custom/Unknown') {
      const hit = FALLBACK.find(([n]) => tech.list.includes(n));
      if (hit) {
        fw.framework = hit[0];
        fw.subtitle = hit[1];
        fw.confidence = 60;
        fw.version = tech.versions[hit[0]] || '';
        fw.details = [`No CMS or site builder found; ${hit[0]} detected in the tech stack`];
        fw.isFramework = true;
      }
    }

    let theme = { theme: null, source: null, detail: '' };
    try { theme = W.detectTheme(fw.framework); } catch (_) {}
    let pageInfo = null;
    try { pageInfo = W.detectPageInfo(); } catch (_) {}
    const siteInfo = await siteInfoP;
    const hc = healthChecks(pageInfo, siteInfo, headers);

    return {
      ...fw,
      breakdown: {
        theme: theme.theme, themeSource: theme.source, themeDetail: theme.detail,
        techStack: tech.items, techVersions: tech.versions,
        tags: siteInfo ? siteInfo.tags : [],
        trackingIds: siteInfo ? siteInfo.trackingIds : [],
        siteInfo: siteInfo ? { sitemap: siteInfo.sitemap, sitemapUrl: siteInfo.sitemapUrl, robots: siteInfo.robots } : null,
        pageInfo,
        headers,
        health: hc.failed,
        healthPassed: hc.passed,
        healthScore: Math.max(0, 100 - hc.failed.reduce((n, h) => n + (h.level === 'error' ? 15 : 6), 0))
      }
    };
  };
})();
