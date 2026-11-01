// Platform detector — identifies the CMS / site builder / e-commerce platform.
//
// Each platform has a list of signals. A signal is [type, pattern, weight?]:
//   gen    — <meta name="generator"> regex (group 1 = version)      default 70
//   js     — page runtime global, dotted path ("Shopify.shop")      default 70
//   dom    — CSS selector present in the page                        default 40
//   asset  — regex on <script src> / <link href> URLs                default 40
//   hdr    — [headerName, regex] on the page's response headers      default 60
//   cookie — regex on document.cookie                                default 40
//   head   — regex on <head> HTML (comments, inline markup)          default 40
//   host   — regex on location.hostname                              default 70
// Confidence = sum of matched weights, capped at 98. A platform needs >= 40 to
// count, so one weak hint is never enough on its own.
(function () {
  const W = window.__wfd = window.__wfd || {};

  const P = [
    // `parent` = this is a more specific flavour of another platform (shown instead of it).
    { name: 'WooCommerce', parent: 'WordPress', sub: 'WordPress-powered e-commerce store', signals: [
      ['gen', /WooCommerce\s*([\d.]+)?/i], ['asset', /\/wp-content\/plugins\/woocommerce\//i, 50],
      ['dom', 'body.woocommerce, body.woocommerce-page, body.woocommerce-js', 40],
      ['js', 'woocommerce_params', 50], ['js', 'wc_add_to_cart_params', 50]] },
    { name: 'WordPress', sub: "The world's most popular content management system", signals: [
      ['gen', /WordPress\s*([\d.]+)?/i], ['dom', 'link[rel="https://api.w.org/"]', 60],
      ['asset', /\/wp-(?:content|includes)\//i, 50], ['js', '_wpemojiSettings', 60], ['js', 'wp.i18n', 40],
      ['hdr', ['link', /api\.w\.org/i]], ['hdr', ['x-pingback', /xmlrpc\.php/i]]],
      version: () => {
        // The block-library / emoji asset ?ver= equals the core version even when the generator tag is removed.
        const u = W.util.asset(/\/wp-includes\/(?:css\/dist\/block-library\/style(?:\.min)?\.css|js\/wp-emoji-release\.min\.js|css\/dashicons(?:\.min)?\.css)\?ver=\d/i);
        const m = u && u.match(/\?ver=(\d+\.\d+(?:\.\d+)?)/);
        return m ? m[1] : '';
      } },
    { name: 'Shopify', sub: 'Leading e-commerce platform for online stores', signals: [
      ['js', 'Shopify.shop'], ['js', 'Shopify.theme', 40], ['asset', /cdn\.shopify\.com|\/cdn\/shop\//i, 50],
      ['dom', 'meta[name="shopify-digital-wallet"], meta[name="shopify-checkout-api-token"], link[href*="monorail-edge.shopifysvc.com"]', 50],
      ['hdr', ['x-shopid', /./]], ['hdr', ['powered-by', /shopify/i]]] },
    { name: 'Wix', sub: 'Popular drag-and-drop website builder', signals: [
      ['gen', /Wix\.com/i], ['asset', /static\.parastorage\.com|static\.wixstatic\.com/i, 50],
      ['js', 'wixBiSession'], ['js', 'wixPerformanceMeasurements'], ['hdr', ['x-wix-request-id', /./]]] },
    { name: 'Webflow', sub: 'Design-focused website builder with CMS capabilities', signals: [
      ['gen', /Webflow/i], ['js', 'Webflow'], ['dom', 'html[data-wf-page], html[data-wf-site], [data-wf-page], [data-wf-site]', 50],
      ['asset', /website-files\.com|webflow(?:\.[a-f0-9]+)?(?:\.min)?\.js/i, 40]] },
    { name: 'Squarespace', sub: 'All-in-one website builder and hosting platform', signals: [
      ['gen', /Squarespace/i], ['js', 'Static.SQUARESPACE_CONTEXT'], ['asset', /static\d*\.squarespace\.com|squarespace-cdn\.com/i, 50],
      ['hdr', ['server', /squarespace/i]]] },
    { name: 'Joomla', sub: 'Powerful open-source content management system', signals: [
      ['gen', /Joomla/i], ['js', 'Joomla'], ['dom', 'script.joomla-script-options', 60],
      ['asset', /\/media\/(?:system|jui|vendor\/joomla|templates\/site)\//i, 40]] },
    { name: 'Drupal', sub: 'Enterprise-level open-source CMS', signals: [
      ['gen', /Drupal\s*(\d+(?:\.\d+)*)?/i], ['js', 'Drupal'], ['js', 'drupalSettings', 60],
      ['dom', 'script[data-drupal-selector="drupal-settings-json"]', 60],
      ['asset', /\/sites\/(?:default|all)\/(?:files|modules|themes)\/|\/core\/misc\/drupal(?:\.init)?\.js/i, 40],
      ['hdr', ['x-generator', /drupal/i]], ['hdr', ['x-drupal-cache', /./]], ['hdr', ['x-drupal-dynamic-cache', /./]]] },
    { name: 'Magento', sub: 'Adobe Commerce — enterprise e-commerce platform', signals: [
      ['dom', 'script[type="text/x-magento-init"]', 70],
      ['asset', /\/static\/(?:version\d+\/)?frontend\/[^/]+\/[^/]+\/[a-z]{2}_[A-Z]{2}\//, 50],
      ['js', 'Mage.Cookies', 50], ['hdr', ['x-magento-tags', /./]], ['hdr', ['x-magento-cache-debug', /./]]] },
    { name: 'PrestaShop', sub: 'Open-source e-commerce platform', signals: [
      ['gen', /PrestaShop/i], ['js', 'prestashop.currency'], ['js', 'prestashop', 50],
      ['asset', /\/modules\/ps_[a-z_]+\//i, 40], ['cookie', /PrestaShop-[a-f0-9]{20,}/i, 50],
      ['hdr', ['powered-by', /prestashop/i]]] },
    { name: 'BigCommerce', sub: 'SaaS e-commerce platform (Stencil)', signals: [
      ['js', 'BCData'], ['asset', /cdn\d+\.bigcommerce\.com/i, 50], ['asset', /stencil-utils/i, 30]] },
    { name: 'OpenCart', sub: 'Open-source PHP e-commerce platform', signals: [
      ['gen', /OpenCart/i], ['asset', /\/catalog\/view\/(?:theme|javascript)\//i, 50],
      ['dom', 'a[href*="index.php?route="], form[action*="index.php?route="]', 30], ['cookie', /OCSESSID=/, 40]] },
    { name: 'Shopware', sub: 'German open-source e-commerce platform', signals: [
      ['gen', /Shopware/i], ['asset', /\/bundles\/storefront\/|\/theme\/[a-f0-9]{32}\/(?:css|js)\//i, 50],
      ['dom', '[data-shopware], meta[name="shopware"]', 50]] },
    { name: 'Salesforce Commerce Cloud', sub: 'Enterprise e-commerce (Demandware)', signals: [
      ['asset', /\/on\/demandware\.(?:static|store)\//i, 70], ['dom', 'img[src*="/on/demandware.static/"]', 50]] },
    { name: 'Ghost', sub: 'Modern publishing platform for blogs & newsletters', signals: [
      ['gen', /Ghost\s*([\d.]+)?/i], ['asset', /sodo-search|\/ghost\/(?:api|assets)\/|@tryghost\/portal/i, 40],
      ['hdr', ['x-ghost-cache-status', /./]]] },
    { name: 'Blogger', sub: "Google's free blog publishing service", signals: [
      ['gen', /Blogger/i], ['js', '_WidgetManager'], ['asset', /www\.blogger\.com\/static|blogblog\.com/i, 40]] },
    { name: 'HubSpot CMS', sub: 'Marketing-focused CMS by HubSpot', signals: [
      ['gen', /HubSpot/i], ['asset', /\/_hcms\/|\/hs\/hsstatic\//i, 60], ['hdr', ['x-hs-hub-id', /./]]] },
    { name: 'Framer', sub: 'Design-first website builder', signals: [
      ['gen', /Framer\s*([a-f0-9.]+)?/i], ['dom', '[data-framer-name], [data-framer-component-type], #__framer-badge-container', 60],
      ['asset', /framerusercontent\.com/i, 40]] },
    { name: 'Craft CMS', sub: 'Flexible content management system', signals: [
      ['gen', /Craft CMS/i], ['asset', /\/cpresources\//i, 40], ['cookie', /CraftSessionId=/, 50],
      ['hdr', ['x-powered-by', /craft cms/i]]] },
    { name: 'Duda', sub: 'Website builder for agencies', signals: [
      ['js', 'dmAPI'], ['js', '_dmAPI'], ['asset', /irp\.cdn-website\.com|cdn-website\.com/i, 50]] },
    { name: 'TYPO3', sub: 'Enterprise open-source CMS', signals: [
      ['gen', /TYPO3\s*(?:CMS)?\s*([\d.]+)?/i], ['asset', /\/typo3(?:temp|conf)\/|\/_assets\/[a-f0-9]{32}\//i, 50]] },
    { name: 'Concrete CMS', sub: 'Open-source CMS (formerly concrete5)', signals: [
      ['gen', /concrete5|Concrete CMS/i], ['js', 'CCM_DISPATCHER_FILENAME'], ['asset', /\/concrete\/(?:js|css)\//i, 40]] },
    { name: 'Sitecore', sub: 'Enterprise digital experience platform', signals: [
      ['dom', 'img[src*="/-/media/"], link[href*="/-/media/"], source[srcset*="/-/media/"]', 40],
      ['cookie', /SC_ANALYTICS_GLOBAL_COOKIE|sxa_site=/i, 60], ['asset', /\/sitecore\//i, 30]] },
    { name: 'Adobe Experience Manager', sub: 'Enterprise CMS by Adobe', signals: [
      ['asset', /\/etc\.clientlibs\/|\/etc\/designs\//i, 60], ['dom', 'img[src*="/content/dam/"], [data-cmp-is]', 30]] },
    { name: 'Odoo', sub: 'Open-source business apps with website builder', signals: [
      ['gen', /Odoo/i], ['asset', /\/web\/assets\//i, 40], ['js', 'odoo.define', 60]] },
    { name: 'Weebly / Square Online', sub: 'Website builder by Square', signals: [
      ['asset', /editmysite\.com/i, 60], ['js', '_W.configDomain', 50]] },
    { name: 'GoDaddy Website Builder', sub: 'Website builder by GoDaddy', signals: [
      ['gen', /Go ?Daddy Website Builder|Starfield Technologies/i], ['asset', /img\d*\.wsimg\.com/i, 40]] },
    { name: 'Tilda', sub: 'Block-based website builder', signals: [
      ['gen', /Tilda/i], ['asset', /tildacdn\.com|static\.tildacdn/i, 60]] },
    { name: 'Jimdo', sub: 'Website builder for small businesses', signals: [
      ['asset', /jimstatic\.com|jimcdn\.com/i, 60], ['js', 'jimdoData', 60]] },
    { name: 'Strikingly', sub: 'Simple one-page website builder', signals: [
      ['asset', /strikinglycdn\.com/i, 60]] },
    { name: 'Hostinger Website Builder', sub: 'Website builder by Hostinger (Zyro)', signals: [
      ['gen', /Hostinger|Zyro/i], ['asset', /zyrosite\.com|userapp\.zyrosite/i, 50]] },
    { name: 'Kajabi', sub: 'Platform for courses & digital products', signals: [
      ['js', 'Kajabi'], ['asset', /kajabi-cdn\.com|kajabi-storefronts/i, 60]] },
    { name: 'Teachable', sub: 'Online course platform', signals: [
      ['asset', /teachablecdn\.com/i, 60], ['js', 'Teachable', 60]] },
    { name: 'Thinkific', sub: 'Online course platform', signals: [
      ['asset', /thinkific\.com|thinkific-assets/i, 50], ['js', 'Thinkific', 60]] },
    { name: 'Substack', sub: 'Newsletter & publishing platform', signals: [
      ['asset', /substackcdn\.com/i, 60], ['host', /\.substack\.com$/i]] },
    { name: 'Medium', sub: 'Online publishing platform', signals: [
      ['dom', 'meta[property="al:android:package"][content="com.medium.reader"]', 70], ['asset', /cdn-client\.medium\.com/i, 50]] },
    { name: 'Tumblr', sub: 'Microblogging platform', signals: [
      ['asset', /assets\.tumblr\.com/i, 50], ['host', /\.tumblr\.com$/i]] },
    { name: 'Notion', sub: 'Page published from Notion', signals: [
      ['host', /\.notion\.site$/i], ['asset', /notion\.so\/|notion-static\.com/i, 40]] },
    { name: 'Docusaurus', sub: 'Documentation site generator (React)', signals: [
      ['gen', /Docusaurus\s*v?([\d.]+)?/i], ['js', '__docusaurus', 60]] },
    { name: 'VitePress', sub: 'Documentation site generator (Vue)', signals: [
      ['gen', /VitePress\s*v?([\d.]+)?/i], ['js', '__VP_HASH_MAP__', 60]] },
    { name: 'MkDocs', sub: 'Documentation site generator (Python)', signals: [
      ['gen', /mkdocs-([\d.]+)/i]] },
    { name: 'GitBook', sub: 'Documentation platform', signals: [
      ['gen', /GitBook\s*([\d.]+)?/i], ['asset', /gitbook\.(?:io|com)\/|static\.gitbook/i, 40]] },
    { name: 'Sphinx', sub: 'Documentation generator (Python)', signals: [
      ['gen', /Sphinx\s*([\d.]+)?/i], ['dom', 'script[src*="documentation_options.js"]', 50]] },
    { name: 'Mintlify', sub: 'Documentation platform', signals: [
      ['gen', /Mintlify/i], ['asset', /mintlify/i, 40]] }
  ];

  function test(sig, hdrs) {
    const U = W.util;
    const [type, pat] = sig;
    switch (type) {
      case 'gen': { const m = U.gen(pat); return m ? { label: `generator meta "${m[0].slice(0, 40)}"`, version: m[1] || '' } : null; }
      case 'js': return U.has(pat) ? { label: `runtime global window.${pat}` } : null;
      case 'dom': return U.q(pat) ? { label: `page markup (${pat.split(',')[0].trim()})` } : null;
      case 'asset': { const u = U.asset(pat); return u ? { label: `asset ${U.shortUrl(u)}` } : null; }
      case 'cookie': return U.cookie(pat) ? { label: 'platform cookie' } : null;
      case 'head': return U.headHtml(pat) ? { label: 'page <head> markup' } : null;
      case 'host': return pat.test(location.hostname) ? { label: `hosted on ${location.hostname}` } : null;
      case 'hdr': {
        const [name, re] = pat;
        const v = hdrs && hdrs[name];
        return v && re.test(v) ? { label: `response header ${name}` } : null;
      }
    }
    return null;
  }

  const DEFAULT_W = { gen: 70, js: 70, dom: 40, asset: 40, hdr: 60, cookie: 40, head: 40, host: 70 };

  W.platforms = P.map(p => p.name);

  W.detectFramework = function detectFramework(headers) {
    const hdrs = (headers && headers.all) || {};
    const scored = P.map((p, order) => {
      let score = 0, version = '';
      const matched = [];
      for (const sig of p.signals) {
        let r = null;
        try { r = test(sig, hdrs); } catch (_) { r = null; }
        if (!r) continue;
        score += sig[2] || DEFAULT_W[sig[0]];
        matched.push(r.label);
        if (r.version && !version) version = r.version;
      }
      if (score && !version && p.version) { try { version = p.version() || ''; } catch (_) {} }
      return { p, order, score, matched, version };
    }).filter(s => s.score >= 40);

    scored.sort((a, b) => (b.score - a.score) || (a.order - b.order));
    let best = scored[0] || null;

    // Show the specific flavour (WooCommerce) instead of its parent (WordPress).
    if (best) {
      const child = scored.find(s => s.p.parent === best.p.name);
      if (child) best = child;
    }

    const stats = {
      scriptsFound: document.scripts.length,
      metaTags: document.querySelectorAll('meta').length,
      linksFound: document.querySelectorAll('link').length
    };

    if (best) {
      const others = scored.filter(s => s !== best && s.p.name !== best.p.parent).map(s => s.p.name);
      // A child platform inherits its parent's evidence (WooCommerce runs on WordPress).
      const parent = best.p.parent ? scored.find(s => s.p.name === best.p.parent) : null;
      const score = best.score + (parent ? Math.min(parent.score, 40) : 0);
      return {
        framework: best.p.name,
        subtitle: best.p.sub,
        confidence: Math.min(98, score),
        version: best.version,
        parentPlatform: parent ? { name: parent.p.name, version: parent.version } : null,
        alsoDetected: others,
        details: best.matched.concat(parent ? parent.matched.slice(0, 2).map(m => `${parent.p.name}: ${m}`) : []),
        ...stats
      };
    }
    return {
      framework: 'Custom/Unknown',
      subtitle: 'No known CMS or site builder found — likely custom-built',
      confidence: 0, version: '', alsoDetected: [],
      details: [],
      ...stats
    };
  };
})();
