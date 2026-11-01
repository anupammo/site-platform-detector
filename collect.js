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

  // Practical problems worth fixing. level: 'error' | 'warn'.
  function healthChecks(pi, si, hd) {
    const out = [];
    const add = (id, level, text) => out.push({ id, level, text });
    if (pi) {
      if (/noindex/i.test(pi.robots) || (hd && /noindex/i.test(hd.xRobotsTag || ''))) add('noindex', 'error', 'Page is set to noindex — search engines will not show it');
      if (!pi.https) add('no-https', 'error', 'Page is not served over HTTPS');
      if (pi.mixedContent) add('mixed-content', 'error', `${pi.mixedContent} insecure http:// resource(s) on an https page`);
      if (!pi.titleLength) add('no-title', 'error', 'Missing <title>');
      else if (pi.titleLength > 65) add('title-long', 'warn', `Title is ${pi.titleLength} characters (aim for under 60)`);
      if (!pi.hasDescription) add('no-description', 'warn', 'Missing meta description');
      if (pi.h1 === 0) add('no-h1', 'warn', 'No H1 heading');
      else if (pi.h1 > 1) add('multiple-h1', 'warn', `${pi.h1} H1 headings (use one)`);
      if (pi.canonicalOtherHost) add('canonical-elsewhere', 'warn', 'Canonical URL points to another domain');
      if (!pi.mobileFriendly) add('no-viewport', 'warn', 'No mobile viewport meta tag');
      if (!pi.lang) add('no-lang', 'warn', 'No lang attribute on <html>');
      if (pi.imagesMissingAlt) add('img-alt', 'warn', `${pi.imagesMissingAlt} image(s) without alt text`);
      if (!pi.socialCards) add('no-social', 'warn', 'No Open Graph / social share tags');
    }
    if (si) {
      if (si.robots && si.robots.blocksAll) add('robots-blocks-all', 'error', 'robots.txt blocks all crawlers (Disallow: /)');
      if (!si.sitemap && /^https?:$/.test(location.protocol)) add('no-sitemap', 'warn', 'No XML sitemap found');
    }
    if (hd && hd.available) {
      const php = (hd.backend || []).find(b => b.name === 'PHP');
      const eol = php && phpEol(php.version);
      if (eol) add('php-eol', 'error', `PHP ${php.version} is end-of-life (no security fixes since ${eol})`);
      if (hd.serverInfo && hd.serverInfo.version) add('server-version', 'warn', `Server reveals its version (${hd.serverInfo.name} ${hd.serverInfo.version})`);
    }
    return out;
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
        health: healthChecks(pageInfo, siteInfo, headers)
      }
    };
  };
})();
