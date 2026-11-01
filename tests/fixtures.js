// Fixture pages modelled on real-world markup. Each entry lists what a correct
// detector must (and must not) report. Keep them small and realistic.
const page = (head, body = '', extra = '') => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Fixture page title here</title>${head}</head><body ${extra}>${body}</body></html>`;
const underscoreStub = `<script>window._={VERSION:'1.13.4',each:function(){},chunk:function(){}};</script>`;
const jq = (v = '3.7.1') => `<script>window.jQuery=function(){};window.jQuery.fn={jquery:'${v}'};</script>`;

module.exports = [
  // ---------- Existing platforms (regression: must keep working) ----------
  {
    name: 'WordPress + Astra theme + Elementor + Yoast',
    html: page(`
      <meta name="generator" content="WordPress 6.5.2">
      <meta name="generator" content="Elementor 3.21.0; features: e_optimized_assets_loading">
      <link rel="https://api.w.org/" href="https://fixture.test/wp-json/">
      <link rel="stylesheet" href="https://fixture.test/wp-content/themes/astra/assets/css/minified/main.min.css?ver=4.6.4">
      <link rel="stylesheet" href="https://fixture.test/wp-content/plugins/elementor/assets/css/frontend.min.css?ver=3.21.0">
      <script src="https://fixture.test/wp-includes/js/jquery/jquery.min.js?ver=3.7.1"></script>
      <script src="https://fixture.test/wp-includes/js/underscore.min.js?ver=1.13.4"></script>
      <script src="https://fixture.test/wp-content/themes/astra/assets/js/minified/frontend.min.js?ver=4.6.4"></script>
      ${jq()}${underscoreStub}
      <script type="application/ld+json" class="yoast-schema-graph">{"@context":"https://schema.org"}</script>`,
      '<div class="elementor elementor-12"><h1>Hello</h1></div>', 'class="home wp-singular wp-theme-astra elementor-default"'),
    expect: { framework: 'WordPress', theme: 'astra', version: '6.5.2', tech: ['jQuery', 'Elementor', 'Yoast SEO'], notTech: ['Lodash'], notFramework: ['PrestaShop'] }
  },
  {
    name: 'WordPress (generator hidden) — version from ?ver= assets',
    html: page(`
      <link rel="https://api.w.org/" href="https://fixture.test/wp-json/">
      <link rel="stylesheet" id="wp-block-library-css" href="https://fixture.test/wp-includes/css/dist/block-library/style.min.css?ver=6.4.3">
      <link rel="stylesheet" href="https://fixture.test/wp-content/themes/twentytwentyfour/style.css?ver=1.0">`),
    expect: { framework: 'WordPress', theme: 'twentytwentyfour', version: '6.4.3' }
  },
  {
    name: 'WordPress with an embedded HubSpot form',
    html: page(`
      <meta name="generator" content="WordPress 6.6">
      <link rel="stylesheet" href="https://fixture.test/wp-content/themes/kadence/assets/css/global.min.css?ver=1.2.3">
      <script src="https://js.hsforms.net/forms/embed/v2.js"></script>
      <script src="https://js.hs-scripts.com/123456.js"></script>
      <script>window.hbspt={forms:{create:function(){}}};window._hsq=[];</script>`),
    expect: { framework: 'WordPress', theme: 'kadence', tags: ['HubSpot'], notFramework: ['HubSpot CMS', 'PrestaShop'] }
  },
  {
    name: 'WooCommerce store (Storefront theme)',
    html: page(`
      <meta name="generator" content="WordPress 6.5">
      <meta name="generator" content="WooCommerce 8.9.1">
      <link rel="stylesheet" href="https://fixture.test/wp-content/themes/storefront/style.css?ver=4.5.5">
      <link rel="stylesheet" href="https://fixture.test/wp-content/plugins/woocommerce/assets/css/woocommerce.css?ver=8.9.1">
      <script>window.woocommerce_params={ajax_url:'/wp-admin/admin-ajax.php'};</script>`, '', 'class="home woocommerce-page woocommerce"'),
    expect: { framework: 'WooCommerce', theme: 'storefront', version: '8.9.1' }
  },
  {
    name: 'Shopify (Dawn theme) + Klaviyo + Judge.me',
    html: page(`
      <link rel="stylesheet" href="https://fixture.test/cdn/shop/t/12/assets/base.css?v=1234">
      <script src="https://fixture.test/cdn/shop/t/12/assets/global.js?v=1"></script>
      <script src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=AbC123"></script>
      <script src="https://cdn.judge.me/widget_preloader.js"></script>
      <script>window.Shopify={shop:'acme-store.myshopify.com',theme:{name:'Dawn',id:1,theme_store_id:887}};</script>`),
    expect: { framework: 'Shopify', theme: 'Dawn', tech: ['Klaviyo', 'Judge.me'] }
  },
  {
    name: 'Wix',
    html: page(`<meta name="generator" content="Wix.com Website Builder">
      <script src="https://static.parastorage.com/services/wix-thunderbolt/dist/main.js"></script>`),
    expect: { framework: 'Wix' }
  },
  {
    name: 'Webflow',
    html: page(`<meta name="generator" content="Webflow">
      <link href="https://cdn.prod.website-files.com/abc/css/site.webflow.css" rel="stylesheet">`, '', 'data-wf-page="1" data-wf-site="2"'),
    expect: { framework: 'Webflow' }
  },
  {
    name: 'Squarespace',
    html: page(`<script>window.Static={SQUARESPACE_CONTEXT:{templateId:'5c5a519771c10ba3470d8101'}};</script>
      <script src="https://static1.squarespace.com/static/vta/abc/scripts/site-bundle.js"></script>`),
    expect: { framework: 'Squarespace' }
  },
  {
    name: 'Joomla 4 (Cassiopeia)',
    html: page(`<meta name="generator" content="Joomla! - Open Source Content Management">
      <link href="/media/system/css/joomla-fontawesome.min.css" rel="stylesheet">
      <link href="/media/templates/site/cassiopeia/css/template.min.css" rel="stylesheet">
      <link href="/templates/system/css/general.css" rel="stylesheet">`),
    expect: { framework: 'Joomla', theme: 'cassiopeia' }
  },
  {
    name: 'Drupal 10 with a custom theme',
    html: page(`<meta name="Generator" content="Drupal 10 (https://www.drupal.org)">
      <script type="application/json" data-drupal-selector="drupal-settings-json">{"path":{}}</script>
      <link rel="stylesheet" href="/core/themes/olivero/css/base/fonts.css?s1">
      <link rel="stylesheet" href="/themes/custom/acme/assets/css/style.css?s1">
      <script src="/themes/custom/acme/assets/js/main.js?v=10"></script>`),
    expect: { framework: 'Drupal', theme: 'acme', notFramework: ['PrestaShop'] }
  },
  {
    name: 'Magento 2',
    html: page(`<script type="text/x-magento-init">{"*":{}}</script>
      <link rel="stylesheet" href="https://fixture.test/static/version1700000000/frontend/Magento/luma/en_US/css/styles-m.css">
      <script src="https://fixture.test/static/version1700000000/frontend/Magento/luma/en_US/requirejs/require.js"></script>`),
    expect: { framework: 'Magento', theme: 'Magento/luma' }
  },
  {
    name: 'PrestaShop 8',
    html: page(`<script>var prestashop={currency:{iso_code:'EUR'}};</script>
      <script src="https://fixture.test/themes/classic/assets/js/theme.js"></script>`),
    expect: { framework: 'PrestaShop' }
  },
  {
    name: 'Ghost blog',
    html: page(`<meta name="generator" content="Ghost 5.82">
      <script defer src="https://cdn.jsdelivr.net/ghost/sodo-search@~1.1/umd/sodo-search.min.js"></script>`),
    expect: { framework: 'Ghost', version: '5.82' }
  },

  // ---------- False-positive traps ----------
  {
    name: 'Django + React SPA (static/frontend) — not Magento',
    html: page(`<script src="https://fixture.test/static/frontend/main.4f2a.js"></script>
      <script src="https://fixture.test/static/js/require.js"></script>`,
      '<form><input type="hidden" name="csrfmiddlewaretoken" value="x"></form><div id="root"></div>'),
    expect: { notFramework: ['Magento'], tech: ['Django'] }
  },
  {
    name: 'Laravel app — not Ruby on Rails',
    headers: { 'set-cookie': 'XSRF-TOKEN=abc; Path=/' },
    html: page(`<meta name="csrf-token" content="abc123">`, '<div id="app"></div>'),
    expect: { tech: ['Laravel'], notTech: ['Ruby on Rails'] }
  },
  {
    name: 'Ruby on Rails app',
    html: page(`<meta name="csrf-param" content="authenticity_token"><meta name="csrf-token" content="abc">`),
    expect: { tech: ['Ruby on Rails'], notTech: ['Laravel'] }
  },
  {
    name: 'Plain site: cdnjs, Google Ads only, custom window.analytics',
    html: page(`<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>
      <script async src="https://www.googletagmanager.com/gtag/js?id=AW-123456789"></script>
      <script>window.dataLayer=[];function gtag(){dataLayer.push(arguments)}gtag('config','AW-123456789');window.analytics={track:function(){}};</script>
      <script>function detectTheme(){return 'page-own-function'}</script>`),
    expect: { notTags: ['Cloudflare Web Analytics', 'Segment', 'Google Analytics'], tags: ['Google Ads'], keepsPageGlobal: true, notFramework: ['Lodash'] }
  },
  {
    name: 'GA4 + GTM with IDs, sitemap declared in robots.txt',
    files: {
      '/robots.txt': { body: 'User-agent: *\nDisallow: /wp-admin/\nSitemap: https://fixture.test/sitemap_index.xml\n' },
      '/sitemap_index.xml': { type: 'application/xml', body: '<?xml version="1.0"?><sitemapindex></sitemapindex>' }
    },
    html: page(`<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABCD1234"></script>
      <script>(function(w,d,s,l,i){})(window,document,'script','dataLayer','GTM-K9XY7Z');</script>`),
    expect: { tags: ['Google Analytics', 'Google Tag Manager'], ids: ['G-ABCD1234', 'GTM-K9XY7Z'], sitemap: true }
  },
  {
    name: 'SPA that answers 200 for every path — no fake sitemap',
    softNotFound: true,
    html: page('', '<div id="root"></div>'),
    expect: { sitemap: false }
  },
  {
    name: 'Next.js (App Router) on Vercel',
    headers: { 'x-powered-by': 'Next.js', 'x-vercel-id': 'bom1::abc', server: 'Vercel' },
    html: page(`<script src="https://fixture.test/_next/static/chunks/webpack-1.js" async></script>
      <script>self.__next_f=self.__next_f||[];</script>`),
    expect: { framework: 'Next.js', tech: ['Next.js'], hosting: ['Vercel'] }
  },
  {
    name: 'Modern React SPA (no window.React)',
    html: page(`<script src="https://fixture.test/assets/index-abc.js"></script>`,
      `<div id="root"><div>app</div></div><script>document.getElementById('root')['__reactContainer$x1y2']={};</script>`),
    expect: { tech: ['React'] }
  },
  {
    name: 'Preact only — not React',
    html: page(`<script src="https://unpkg.com/preact@10.19.3/dist/preact.min.js"></script>`),
    expect: { tech: ['Preact'], notTech: ['React'] }
  },
  {
    name: 'Tailwind CSS compiled into app.css',
    html: page(`<style>*,::before,::after{--tw-ring-offset-width:0px;--tw-shadow:0 0 #0000}</style><link rel="stylesheet" href="/build/app.css">`),
    expect: { tech: ['Tailwind CSS'] }
  },
  {
    name: 'Vue 3 SPA',
    html: page('', `<div id="app" data-v-app=""><div data-v-7ba5bd90>hi</div></div>`),
    expect: { tech: ['Vue.js'] }
  },
  {
    name: 'Noindex page blocked in robots.txt',
    files: { '/robots.txt': { body: 'User-agent: *\nDisallow: /\n' } },
    html: page(`<meta name="robots" content="noindex, nofollow">`),
    expect: { health: ['noindex', 'robots-blocks-all'] }
  },

  // ---------- New platforms in 1.4 ----------
  { name: 'TYPO3', html: page(`<meta name="generator" content="TYPO3 CMS"><link rel="stylesheet" href="/typo3temp/assets/css/main.css">`), expect: { framework: 'TYPO3' } },
  { name: 'OpenCart', html: page(`<link href="catalog/view/theme/default/stylesheet/stylesheet.css" rel="stylesheet">`, '<a href="index.php?route=product/category&path=20">Desktops</a>'), expect: { framework: 'OpenCart', theme: 'default' } },
  { name: 'Salesforce Commerce Cloud', html: page(`<script src="/on/demandware.static/Sites-RefArch-Site/-/en_US/v1/js/main.js"></script>`), expect: { framework: 'Salesforce Commerce Cloud' } },
  { name: 'Adobe Experience Manager', html: page(`<link rel="stylesheet" href="/etc.clientlibs/acme/clientlibs/clientlib-site.min.css">`), expect: { framework: 'Adobe Experience Manager' } },
  { name: 'Docusaurus docs', html: page(`<meta name="generator" content="Docusaurus v3.1.1">`), expect: { framework: 'Docusaurus', version: '3.1.1' } },
  { name: 'GoDaddy Website Builder', html: page(`<meta name="generator" content="Starfield Technologies; Go Daddy Website Builder 8.0.0000">`), expect: { framework: 'GoDaddy Website Builder' } },
  { name: 'Tilda', html: page(`<script src="https://static.tildacdn.com/js/tilda-scripts-3.0.min.js"></script>`), expect: { framework: 'Tilda' } },
  { name: 'Weebly', html: page(`<script src="//cdn2.editmysite.com/js/site/main.js"></script>`), expect: { framework: 'Weebly / Square Online' } }
];
