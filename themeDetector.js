// Theme detection helper loaded before content.js via manifest
// Returns { theme: string|null, source: string|null }
function detectTheme(framework) {
  let theme = null;
  let source = null;

  try {
    if (framework === 'WordPress') {
      const themeLink = document.querySelector('link[href*="/wp-content/themes/"]');
      if (themeLink && themeLink.href) {
        const match = themeLink.href.match(/\/wp-content\/themes\/([^\/]+)\//);
        if (match && match[1]) { theme = match[1]; source = 'link'; }
      }
      if (!theme) {
        const themeMeta = document.querySelector('meta[name="theme"], meta[name="template"]');
        if (themeMeta && themeMeta.content) { theme = themeMeta.content; source = 'meta'; }
      }
    } else if (framework === 'Shopify') {
      const themeMeta = document.querySelector('meta[name="shopify-checkout-authorization-theme"], meta[name="shopify-theme"]');
      if (themeMeta && themeMeta.content) { theme = themeMeta.content; source = 'meta'; }
      if (!theme) {
        const themeScript = document.querySelector('script[src*="/shopify/"]');
        if (themeScript && themeScript.src) {
          const match = themeScript.src.match(/themes\/([^\/]+)\//);
          if (match && match[1]) { theme = match[1]; source = 'script'; }
        }
      }
    } else if (framework === 'Wix') {
      const themeMeta = document.querySelector('meta[name*="wix-theme"]');
      if (themeMeta && themeMeta.content) { theme = themeMeta.content; source = 'meta'; }
    } else if (framework === 'Squarespace') {
      const themeMeta = document.querySelector('meta[name*="squarespace-theme"]');
      if (themeMeta && themeMeta.content) { theme = themeMeta.content; source = 'meta'; }
      if (!theme) {
        try {
          const sq = (window.Static && window.Static.SQUARESPACE_CONTEXT) || window.Squarespace || {};
          const tid = sq.templateId || (sq.template && (sq.template.id || sq.template.identifier));
          if (tid) { theme = String(tid); source = 'js'; }
        } catch(_){}
      }
    } else if (framework === 'Joomla') {
      const link = document.querySelector('link[href*="/templates/"]');
      if (link && link.href) {
        const m = link.href.match(/\/templates\/([^\/]+)\//);
        if (m && m[1]) { theme = m[1]; source = 'link'; }
      }
    } else if (framework === 'Drupal') {
      const link = document.querySelector('link[href*="/themes/"]') || document.querySelector('link[href*="/sites/"]');
      if (link && link.href) {
        let m = link.href.match(/\/themes\/([^\/]+)\//);
        if (!m) m = link.href.match(/\/sites\/[^\/]+\/themes\/([^\/]+)\//);
        if (m && m[1]) { theme = m[1]; source = 'link'; }
      }
    } else if (framework === 'Magento' || framework === 'Adobe Commerce') {
      // Magento 2 static asset path: /static/frontend/Vendor/theme/
      const link = Array.from(document.querySelectorAll('link[href]')).find(l => /\/static\/frontend\//.test(l.href));
      if (link && link.href) {
        const m = link.href.match(/\/static\/frontend\/([^\/]+)\/([^\/]+)\//);
        if (m && m[1] && m[2]) { theme = `${m[1]}/${m[2]}`; source = 'link'; }
      }
    }

    if (!theme) {
      const genericThemeMeta = document.querySelector('meta[name="theme"], meta[name*="theme"]');
      if (genericThemeMeta && genericThemeMeta.content) { theme = genericThemeMeta.content; source = 'meta'; }
    }
  } catch (_) {
    // ignore
  }

  return { theme, source };
}
