// Theme detector — finds the theme/template of the detected platform.
// Returns { theme, source, detail }.
(function () {
  const W = window.__wfd = window.__wfd || {};

  // First capture group of the first asset URL that matches and isn't skipped.
  function fromAssets(re, skip) {
    const U = W.util;
    const urls = U.snapshot().assets;
    for (const u of urls) {
      if (skip && skip.test(u)) continue;
      const m = u.match(re);
      if (m && m[1] && !(skip && skip.test(m[1]))) return m.slice(1).filter(Boolean).join('/');
    }
    return null;
  }

  const prettify = (s) => { try { return decodeURIComponent(s); } catch (_) { return s; } };

  W.detectTheme = function detectTheme(framework) {
    const U = W.util;
    let theme = null, source = null, detail = '';

    try {
      if (framework === 'WordPress' || framework === 'WooCommerce') {
        // WP adds body classes for the active (child) theme; fall back to asset paths.
        const cls = document.body ? [...document.body.classList] : [];
        const child = cls.find(c => c.startsWith('wp-child-theme-'));
        const main = cls.find(c => c.startsWith('wp-theme-'));
        const fromPath = fromAssets(/\/wp-content\/themes\/([^\/?#]+)\//i);
        if (child) { theme = child.replace('wp-child-theme-', ''); source = 'body class'; if (main) detail = 'child theme of ' + main.replace('wp-theme-', ''); }
        else if (fromPath) { theme = fromPath; source = 'asset path'; }
        else if (main) { theme = main.replace('wp-theme-', ''); source = 'body class'; }
      } else if (framework === 'Shopify') {
        const name = U.get('Shopify.theme.name');
        if (name) {
          theme = String(name); source = 'Shopify.theme';
          const storeId = U.get('Shopify.theme.theme_store_id');
          detail = storeId ? `Theme Store #${storeId}` : 'custom or unlisted theme';
        }
        const shop = U.get('Shopify.shop');
        if (shop) detail = (detail ? detail + ' · ' : '') + shop;
      } else if (framework === 'Joomla') {
        theme = fromAssets(/\/media\/templates\/site\/([^\/]+)\//i) || fromAssets(/\/templates\/([^\/]+)\//i, /^system$|\/templates\/system\//i);
        if (theme) source = 'asset path';
      } else if (framework === 'Drupal') {
        theme = fromAssets(/\/themes\/(?:custom\/|contrib\/)?([^\/]+)\//i, /\/core\//i);
        if (theme) source = 'asset path';
      } else if (framework === 'Magento') {
        theme = fromAssets(/\/static\/(?:version\d+\/)?frontend\/([^\/]+)\/([^\/]+)\//i);
        if (theme) source = 'asset path';
      } else if (framework === 'PrestaShop') {
        theme = fromAssets(/\/themes\/([^\/]+)\/assets\//i);
        if (theme) source = 'asset path';
      } else if (framework === 'OpenCart') {
        theme = fromAssets(/\/catalog\/view\/theme\/([^\/]+)\//i);
        if (theme) source = 'asset path';
      } else if (framework === 'BigCommerce') {
        const t = U.get('BCData.theme_name') || null;
        if (t) { theme = String(t); source = 'BCData'; }
      }

      if (!theme) {
        // Only exact theme/template names — NOT theme-color / color-scheme.
        const meta = document.querySelector('meta[name="theme"], meta[name="template"]');
        if (meta && meta.content) { theme = meta.content; source = 'meta'; }
      }
    } catch (_) { /* ignore */ }

    if (theme) theme = prettify(theme);
    // Reject color-like values (e.g. "#1e40af", "rgb(...)", "light dark").
    if (theme && /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|(light|dark)( |$)|light dark)/i.test(String(theme).trim())) {
      theme = null; source = null;
    }
    return { theme, source, detail };
  };
})();
