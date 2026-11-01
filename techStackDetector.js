// Tech stack detector — frameworks, libraries, CMS plugins/apps and third-party
// services. Every rule uses precise signals (runtime globals, exact asset hosts
// or paths, framework-specific markup) to avoid false positives.
// Returns { items: [{ name, cat, version }], list: string[], versions: {} }.
(function () {
  const W = window.__wfd = window.__wfd || {};

  // Category ids are grouped into popup sections (see popup.js TECH_SECTIONS).
  const C = {
    js: 'JavaScript framework', meta: 'Meta-framework / SSG', ui: 'UI & CSS', lib: 'Library',
    backend: 'Back-end', plugin: 'Plugins & apps', pay: 'Payments', chat: 'Live chat & support',
    consent: 'Cookie consent', security: 'Security', search: 'Search', media: 'Video & media',
    maps: 'Maps', monitor: 'Monitoring', marketing: 'Email & marketing', ab: 'A/B testing', font: 'Fonts'
  };

  const ver = (v) => (v == null ? '' : String(v).slice(0, 20));

  function rules(U) {
    const g = U.get, has = U.has, q = U.q, src = U.src, link = U.link, asset = U.asset, iframe = U.iframe;
    const verFrom = (url, re) => { const m = url && url.match(re); return m ? m[1] : ''; };
    return [
      // ---- JavaScript frameworks ----
      { name: 'React', cat: C.js,
        test: () => has('React.version') || q('[data-reactroot]') || U.expando(['__reactContainer$', '__reactFiber$', '_reactRootContainer']) ||
          src(/\/react(?:-dom)?(?:@[\d.]+)?\/|\/react(?:-dom)?(?:\.production|\.development)?(?:\.min)?\.js/i),
        version: () => g('React.version') },
      { name: 'Preact', cat: C.js, test: () => has('preact.render') || src(/\/preact(?:@[\d.]+)?\/|\/preact(?:\.min|\.umd)?\.js/i),
        version: () => verFrom(src(/preact@([\d.]+)/i), /preact@([\d.]+)/i) },
      { name: 'Vue.js', cat: C.js,
        test: () => has('Vue.version') || q('[data-v-app]') || U.expando(['__vue_app__', '__vue__']) || U.attrName(/^data-v-[0-9a-f]{8}$/),
        version: () => g('Vue.version') || U.safe(() => { const el = U.expando(['__vue_app__']); return el && el.__vue_app__.version; }, '') },
      { name: 'Angular', cat: C.js, test: () => q('[ng-version]'), version: () => U.safe(() => document.querySelector('[ng-version]').getAttribute('ng-version'), '') },
      { name: 'AngularJS', cat: C.js, test: () => has('angular.version.full') || q('[ng-app], [data-ng-app]'), version: () => g('angular.version.full') },
      { name: 'Svelte', cat: C.js, test: () => q('[class*="svelte-"]') },
      { name: 'SolidJS', cat: C.js, test: () => has('_$HY') || src(/solid-js/i) },
      { name: 'Qwik', cat: C.js, test: () => q('[q\\:container]'), version: () => U.safe(() => document.querySelector('[q\\:version]').getAttribute('q:version'), '') },
      { name: 'Ember.js', cat: C.js, test: () => has('Ember.VERSION') || q('.ember-application'), version: () => g('Ember.VERSION') },
      { name: 'Alpine.js', cat: C.js, test: () => has('Alpine') || q('[x-data]'), version: () => g('Alpine.version') },
      { name: 'htmx', cat: C.js, test: () => has('htmx.version') || q('[hx-get], [hx-post], [data-hx-get], [data-hx-post]'), version: () => g('htmx.version') },
      { name: 'Lit', cat: C.js, test: () => has('litElementVersions') || has('litHtmlVersions'), version: () => (g('litElementVersions') || [])[0] },
      { name: 'Hotwire Turbo', cat: C.js, test: () => has('Turbo.session') || q('turbo-frame, [data-turbo-track]') },
      { name: 'Stimulus', cat: C.js, test: () => has('Stimulus') },
      { name: 'Livewire', cat: C.js, test: () => has('Livewire') || U.attrName(/^wire:(id|model|click)/, 400) },

      // ---- Meta-frameworks / static site generators ----
      { name: 'Next.js', cat: C.meta,
        test: () => has('__NEXT_DATA__') || has('next.version') || has('__next_f') || q('#__next') || src(/\/_next\/static\//i),
        version: () => g('next.version') },
      { name: 'Nuxt', cat: C.meta, test: () => has('__NUXT__') || has('useNuxtApp') || q('#__nuxt') || src(/\/_nuxt\//i) },
      { name: 'Gatsby', cat: C.meta, test: () => has('___gatsby') || q('#___gatsby') || U.gen(/Gatsby/i), version: () => (U.gen(/Gatsby\s*([\d.]+)/i) || [])[1] },
      { name: 'Remix', cat: C.meta, test: () => has('__remixContext') || src(/\/build\/_shared\//i) },
      { name: 'React Router', cat: C.meta, test: () => has('__reactRouterContext') || has('__reactRouterVersion'), version: () => g('__reactRouterVersion') },
      { name: 'SvelteKit', cat: C.meta,
        test: () => U.safe(() => Object.keys(window).some(k => k.startsWith('__sveltekit_')), false) || q('[data-sveltekit-preload-data], [data-sveltekit-hydrate]') || src(/\/_app\/immutable\//i) },
      { name: 'Astro', cat: C.meta, test: () => q('astro-island, astro-slot') || U.gen(/Astro/i) || U.attrName(/^data-astro-(cid|source)/, 300),
        version: () => (U.gen(/Astro\s*v?([\d.]+)/i) || [])[1] },
      { name: 'Hugo', cat: C.meta, test: () => U.gen(/Hugo/i), version: () => (U.gen(/Hugo\s*([\d.]+)/i) || [])[1] },
      { name: 'Jekyll', cat: C.meta, test: () => U.gen(/Jekyll/i), version: () => (U.gen(/Jekyll\s*v?([\d.]+)/i) || [])[1] },
      { name: 'Eleventy', cat: C.meta, test: () => U.gen(/Eleventy/i), version: () => (U.gen(/Eleventy\s*v?([\d.]+)/i) || [])[1] },
      { name: 'Hexo', cat: C.meta, test: () => U.gen(/Hexo/i), version: () => (U.gen(/Hexo\s*([\d.]+)/i) || [])[1] },

      // ---- UI & CSS ----
      { name: 'Tailwind CSS', cat: C.ui, test: () => link(/tailwind/i) || U.cssVar('--tw-ring-offset-width') || U.cssVar('--tw-shadow') || U.cssVar('--tw-ring-color') },
      { name: 'Bootstrap', cat: C.ui,
        test: () => asset(/bootstrap(?:\.bundle)?(?:\.min)?\.(?:css|js)|\/bootstrap@[\d.]+\//i) || has('bootstrap.Tooltip.VERSION') || U.cssVar('--bs-blue') || U.cssVar('--bs-primary'),
        version: () => g('bootstrap.Tooltip.VERSION') || g('jQuery.fn.tooltip.Constructor.VERSION') || verFrom(asset(/bootstrap@([\d.]+)|bootstrap\/([\d.]+)\//i), /bootstrap[@\/]([\d.]+)/i) },
      { name: 'Bulma', cat: C.ui, test: () => link(/bulma(?:\.min)?\.css|\/bulma@/i) },
      { name: 'Foundation', cat: C.ui, test: () => has('Foundation.version') || link(/foundation(?:\.min)?\.css/i), version: () => g('Foundation.version') },
      { name: 'Material UI', cat: C.ui, test: () => q('[class*="MuiButton-root"], [class*="MuiBox-root"], [class*="MuiTypography-root"]') },
      { name: 'Chakra UI', cat: C.ui, test: () => q('.chakra-button, .chakra-stack, [class*="chakra-"]') && U.cssVar('--chakra-colors-blue-500') },
      { name: 'Ant Design', cat: C.ui, test: () => q('[class*="ant-btn"], [class*="ant-layout"]') },
      { name: 'Font Awesome', cat: C.ui, test: () => asset(/font-?awesome|kit\.fontawesome\.com/i) || q('i[class^="fa-"], i[class*=" fa-"], i.fa, i.fas, i.fab') },
      { name: 'Google Fonts', cat: C.font, test: () => link(/fonts\.googleapis\.com|fonts\.gstatic\.com/i) },
      { name: 'Adobe Fonts', cat: C.font, test: () => asset(/use\.typekit\.net|p\.typekit\.net/i) },

      // ---- Libraries ----
      { name: 'jQuery', cat: C.lib, test: () => has('jQuery.fn.jquery'), version: () => g('jQuery.fn.jquery') },
      { name: 'jQuery UI', cat: C.lib, test: () => has('jQuery.ui.version'), version: () => g('jQuery.ui.version') },
      { name: 'jQuery Migrate', cat: C.lib, test: () => has('jQuery.migrateVersion'), version: () => g('jQuery.migrateVersion') },
      // Lodash and Underscore both expose `_.VERSION`; only Lodash has cloneDeep.
      { name: 'Lodash', cat: C.lib, test: () => (typeof g('_.cloneDeep') === 'function' && has('_.VERSION')) || src(/\/lodash(?:\.min)?\.js|\/lodash@|lodash\.js\/[\d.]+\//i),
        version: () => typeof g('_.cloneDeep') === 'function' ? g('_.VERSION') : verFrom(src(/lodash\.js\/([\d.]+)\//i), /lodash\.js\/([\d.]+)\//i) },
      { name: 'Underscore.js', cat: C.lib, test: () => has('_.VERSION') && typeof g('_.cloneDeep') !== 'function', version: () => g('_.VERSION') },
      { name: 'Moment.js', cat: C.lib, test: () => has('moment.version') || src(/moment(?:\.min)?\.js/i), version: () => g('moment.version') },
      { name: 'Day.js', cat: C.lib, test: () => has('dayjs') || src(/dayjs(?:\.min)?\.js/i) },
      { name: 'Three.js', cat: C.lib, test: () => has('THREE.REVISION') || src(/three(?:\.min|\.module)?\.js/i), version: () => g('THREE.REVISION') ? 'r' + g('THREE.REVISION') : '' },
      { name: 'GSAP', cat: C.lib, test: () => has('gsap.version') || src(/gsap|TweenMax|TweenLite/i), version: () => g('gsap.version') },
      { name: 'Swiper', cat: C.lib, test: () => has('Swiper') || asset(/swiper(?:-bundle)?(?:\.min)?\.(?:js|css)/i) },
      { name: 'Slick', cat: C.lib, test: () => has('jQuery.fn.slick') || asset(/slick(?:\.min)?\.(?:js|css)/i) },
      { name: 'Owl Carousel', cat: C.lib, test: () => has('jQuery.fn.owlCarousel') || asset(/owl\.carousel/i) },
      { name: 'Lottie', cat: C.lib, test: () => has('lottie') || has('bodymovin') || q('lottie-player, dotlottie-player') },
      { name: 'Chart.js', cat: C.lib, test: () => has('Chart.version') || src(/chart(?:\.umd)?(?:\.min)?\.js/i), version: () => g('Chart.version') },
      { name: 'D3', cat: C.lib, test: () => has('d3.version'), version: () => g('d3.version') },
      { name: 'Modernizr', cat: C.lib, test: () => has('Modernizr'), version: () => g('Modernizr._version') },
      { name: 'core-js', cat: C.lib, test: () => has('__core-js_shared__'), version: () => U.safe(() => g('__core-js_shared__').versions[0].version, '') },
      { name: 'lazysizes', cat: C.lib, test: () => has('lazySizes') },

      // ---- Back-end (only reliable client-visible signals) ----
      { name: 'Laravel', cat: C.backend, test: () => (q('meta[name="csrf-token"]') && !q('meta[name="csrf-param"]') && U.cookie(/(?:^|;\s*)XSRF-TOKEN=/)) || has('Livewire') },
      { name: 'Ruby on Rails', cat: C.backend, test: () => q('meta[name="csrf-param"][content="authenticity_token"]') || q('[data-turbolinks-track]') || has('Rails.fire') },
      { name: 'Django', cat: C.backend, test: () => q('input[name="csrfmiddlewaretoken"]') || U.cookie(/(?:^|;\s*)csrftoken=/) || has('django.jQuery') },
      { name: 'ASP.NET', cat: C.backend, test: () => q('input[name="__VIEWSTATE"], input[name="__RequestVerificationToken"]') },
      { name: 'Blazor', cat: C.backend, test: () => src(/_framework\/blazor\.(?:web|server|webassembly)\.js/i) || has('Blazor') },
      { name: 'Phoenix', cat: C.backend, test: () => q('[data-phx-main], [data-phx-session]') },
      { name: 'Inertia.js', cat: C.backend, test: () => q('#app[data-page]') && U.safe(() => !!JSON.parse(document.querySelector('#app').dataset.page).component, false) },

      // ---- CMS plugins & e-commerce apps (WordPress plugins are also auto-listed from asset paths) ----
      { name: 'Elementor', cat: C.plugin, test: () => U.gen(/Elementor/i) || asset(/\/plugins\/elementor\//i) || q('.elementor[data-elementor-type], body.elementor-default'), version: () => (U.gen(/Elementor\s*([\d.]+)/i) || [])[1] },
      { name: 'Divi', cat: C.plugin, test: () => asset(/\/themes\/Divi\/|\/plugins\/divi-builder\//i) || q('body.et_divi_theme, #et-main-area, .et_pb_section') },
      { name: 'WPBakery', cat: C.plugin, test: () => U.gen(/WPBakery/i) || asset(/\/plugins\/js_composer\//i) || q('.vc_row.wpb_row') },
      { name: 'Beaver Builder', cat: C.plugin, test: () => asset(/\/plugins\/bb-plugin\//i) || q('.fl-builder-content') },
      { name: 'Bricks', cat: C.plugin, test: () => asset(/\/themes\/bricks\//i) || q('body.bricks-is-frontend') },
      { name: 'Yoast SEO', cat: C.plugin, test: () => q('script.yoast-schema-graph') || U.headHtml(/optimized with the Yoast SEO/i) || asset(/\/plugins\/wordpress-seo\//i) },
      { name: 'Rank Math', cat: C.plugin, test: () => q('script.rank-math-schema, script.rank-math-schema-pro') || U.headHtml(/Rank Math (?:PRO )?WordPress SEO/i) },
      { name: 'All in One SEO', cat: C.plugin, test: () => U.headHtml(/All in One SEO/i) || U.gen(/All in One SEO/i) },
      { name: 'WP Rocket', cat: C.plugin, test: () => U.headHtml(/wp-rocket|WP Rocket/i) || asset(/\/cache\/wp-rocket\//i) },
      { name: 'LiteSpeed Cache', cat: C.plugin, test: () => asset(/\/litespeed\/(?:css|js)\//i) || U.headHtml(/litespeed/i) },
      { name: 'W3 Total Cache', cat: C.plugin, test: () => U.headHtml(/W3 Total Cache/i) },
      { name: 'Site Kit by Google', cat: C.plugin, test: () => U.gen(/Site Kit by Google/i) },
      { name: 'Klaviyo', cat: C.marketing, test: () => has('klaviyo') || asset(/static\.klaviyo\.com|static-tracking\.klaviyo\.com/i) },
      { name: 'Judge.me', cat: C.plugin, test: () => asset(/judge\.me/i) || has('jdgm') },
      { name: 'Yotpo', cat: C.plugin, test: () => asset(/yotpo\.com/i) || has('yotpo') },
      { name: 'Loox', cat: C.plugin, test: () => asset(/loox\.io/i) },
      { name: 'Stamped.io', cat: C.plugin, test: () => asset(/stamped\.io/i) },
      { name: 'Okendo', cat: C.plugin, test: () => asset(/okendo\.io/i) },
      { name: 'ReCharge', cat: C.plugin, test: () => asset(/rechargecdn\.com|rechargepayments\.com/i) },
      { name: 'PageFly', cat: C.plugin, test: () => asset(/pagefly/i) || q('[data-pf-type]') },
      { name: 'GemPages', cat: C.plugin, test: () => asset(/gempages/i) || q('[data-gp-component], .gryffeditor') },
      { name: 'Smile.io', cat: C.plugin, test: () => asset(/smile\.io/i) },
      { name: 'Ecwid', cat: C.plugin, test: () => src(/app\.ecwid\.com\/script\.js/i) || has('Ecwid') },

      // ---- Payments ----
      { name: 'Stripe', cat: C.pay, test: () => has('Stripe') || src(/js\.stripe\.com/i) },
      { name: 'PayPal', cat: C.pay, test: () => src(/paypal\.com\/sdk\/js|paypalobjects\.com/i) || has('paypal.Buttons') },
      { name: 'Razorpay', cat: C.pay, test: () => has('Razorpay') || src(/checkout\.razorpay\.com/i) },
      { name: 'Square', cat: C.pay, test: () => src(/web\.squarecdn\.com|js\.squareup\.com/i) },
      { name: 'Klarna', cat: C.pay, test: () => src(/klarna(?:cdn|services)?\.(?:com|net)/i) || q('klarna-placement') },
      { name: 'Afterpay', cat: C.pay, test: () => src(/afterpay\.com|static\.afterpay/i) || q('afterpay-placement, square-placement') },
      { name: 'Shop Pay', cat: C.pay, test: () => q('shop-pay-wallet-button, [data-shopify="payment-button"], shopify-payment-terms') },
      { name: 'Braintree', cat: C.pay, test: () => src(/braintreegateway\.com|js\.braintreegateway/i) },
      { name: 'Paddle', cat: C.pay, test: () => has('Paddle') || src(/cdn\.paddle\.com/i) },
      { name: 'Lemon Squeezy', cat: C.pay, test: () => src(/lemonsqueezy/i) || has('LemonSqueezy') },
      { name: 'Paystack', cat: C.pay, test: () => src(/js\.paystack\.co/i) || has('PaystackPop') },
      { name: 'Cashfree', cat: C.pay, test: () => src(/sdk\.cashfree\.com/i) || has('Cashfree') },
      { name: 'PhonePe', cat: C.pay, test: () => src(/mercury\.phonepe\.com/i) },

      // ---- Live chat & support ----
      { name: 'Intercom', cat: C.chat, test: () => has('Intercom') || src(/widget\.intercom\.io|js\.intercomcdn\.com/i) },
      { name: 'Drift', cat: C.chat, test: () => has('drift.load') || src(/js\.driftt\.com/i) },
      { name: 'Crisp', cat: C.chat, test: () => has('$crisp') || src(/client\.crisp\.chat/i) },
      { name: 'Tawk.to', cat: C.chat, test: () => has('Tawk_API') || src(/embed\.tawk\.to/i) },
      { name: 'Zendesk', cat: C.chat, test: () => has('zE') || src(/static\.zdassets\.com/i) },
      { name: 'Freshchat', cat: C.chat, test: () => has('fcWidget') || src(/wchat\.freshchat\.com|freshworks/i) },
      { name: 'LiveChat', cat: C.chat, test: () => has('LiveChatWidget') || src(/cdn\.livechatinc\.com/i) },
      { name: 'Tidio', cat: C.chat, test: () => has('tidioChatApi') || src(/code\.tidio\.co/i) },
      { name: 'HubSpot Chat', cat: C.chat, test: () => src(/js\.usemessages\.com/i) || has('HubSpotConversations') },
      { name: 'Olark', cat: C.chat, test: () => src(/static\.olark\.com/i) },
      { name: 'Gorgias', cat: C.chat, test: () => src(/gorgias\.chat|gorgias\.io/i) },
      { name: 'WhatsApp chat', cat: C.chat, test: () => q('a[href*="wa.me/"], a[href*="api.whatsapp.com/send"], a[href*="web.whatsapp.com/send"]') },

      // ---- Cookie consent ----
      { name: 'Cookiebot', cat: C.consent, test: () => has('Cookiebot') || src(/consent\.cookiebot\.com/i) },
      { name: 'OneTrust', cat: C.consent, test: () => has('OneTrust') || src(/cdn\.cookielaw\.org|optanon/i) },
      { name: 'CookieYes', cat: C.consent, test: () => src(/cdn-cookieyes\.com/i) || q('.cky-consent-container') || asset(/\/plugins\/cookie-law-info\//i) },
      { name: 'Osano', cat: C.consent, test: () => has('Osano') || src(/cmp\.osano\.com/i) },
      { name: 'Termly', cat: C.consent, test: () => src(/app\.termly\.io/i) },
      { name: 'iubenda', cat: C.consent, test: () => has('_iub') || src(/cdn\.iubenda\.com|cs\.iubenda\.com/i) },
      { name: 'Usercentrics', cat: C.consent, test: () => has('UC_UI') || src(/usercentrics\.eu/i) },
      { name: 'Complianz', cat: C.consent, test: () => asset(/\/plugins\/complianz-gdpr/i) || q('#cmplz-cookiebanner-container') },

      // ---- Security ----
      { name: 'reCAPTCHA', cat: C.security, test: () => has('grecaptcha') || asset(/google\.com\/recaptcha|recaptcha\.net|gstatic\.com\/recaptcha/i) },
      { name: 'hCaptcha', cat: C.security, test: () => has('hcaptcha') || src(/hcaptcha\.com/i) },
      { name: 'Cloudflare Turnstile', cat: C.security, test: () => has('turnstile') || src(/challenges\.cloudflare\.com\/turnstile/i) },

      // ---- Search, media, maps ----
      { name: 'Algolia', cat: C.search, test: () => has('algoliasearch') || src(/algolia/i) || q('.DocSearch, .ais-SearchBox') },
      { name: 'YouTube embed', cat: C.media, test: () => iframe(/youtube(?:-nocookie)?\.com\/embed/i) || q('lite-youtube') },
      { name: 'Vimeo', cat: C.media, test: () => iframe(/player\.vimeo\.com/i) || src(/player\.vimeo\.com/i) },
      { name: 'Wistia', cat: C.media, test: () => src(/fast\.wistia\.(?:com|net)/i) || iframe(/wistia/i) },
      { name: 'Google Maps', cat: C.maps, test: () => src(/maps\.googleapis\.com\/maps\/api\/js/i) || iframe(/google\.[a-z.]+\/maps\/embed|maps\.google\./i) },
      { name: 'Mapbox', cat: C.maps, test: () => has('mapboxgl') || asset(/api\.mapbox\.com/i) },
      { name: 'Leaflet', cat: C.maps, test: () => has('L.version') && has('L.map'), version: () => g('L.version') },

      // ---- Monitoring ----
      { name: 'Sentry', cat: C.monitor, test: () => has('__SENTRY__') || has('Sentry') || src(/sentry-cdn\.com|js\.sentry-cdn/i) },
      { name: 'New Relic', cat: C.monitor, test: () => has('NREUM') || has('newrelic') },
      { name: 'Datadog RUM', cat: C.monitor, test: () => has('DD_RUM') || src(/datadoghq-browser-agent/i) },
      { name: 'LogRocket', cat: C.monitor, test: () => has('LogRocket') || src(/cdn\.logrocket\.io|cdn\.lr-ingest/i) },
      { name: 'Bugsnag', cat: C.monitor, test: () => has('Bugsnag') || src(/bugsnag/i) },

      // ---- Email & marketing ----
      { name: 'Mailchimp', cat: C.marketing, test: () => src(/chimpstatic\.com|list-manage\.com/i) || q('form[action*="list-manage.com"]') },
      { name: 'ConvertKit', cat: C.marketing, test: () => src(/convertkit\.com|ck\.page/i) || q('form[action*="convertkit.com"]') },
      { name: 'Brevo', cat: C.marketing, test: () => src(/sibautomation\.com|sendinblue|brevo\.com/i) || q('form[action*="sibforms.com"]') },
      { name: 'OptinMonster', cat: C.marketing, test: () => src(/a\.omappapi\.com|optinmonster/i) },
      { name: 'Omnisend', cat: C.marketing, test: () => src(/omnisnippet|omnisend\.com/i) },
      { name: 'Privy', cat: C.marketing, test: () => src(/privy\.com|widget\.privy/i) },

      // ---- A/B testing ----
      { name: 'Optimizely', cat: C.ab, test: () => has('optimizely') || src(/cdn\.optimizely\.com/i) },
      { name: 'VWO', cat: C.ab, test: () => has('_vwo_code') || src(/visualwebsiteoptimizer\.com/i) },
      { name: 'AB Tasty', cat: C.ab, test: () => has('ABTasty') || src(/abtasty\.com/i) }
    ];
  }

  // Friendly names for common WordPress plugin slugs (others are prettified).
  const WP_PLUGIN_NAMES = {
    'elementor': 'Elementor', 'elementor-pro': 'Elementor Pro', 'contact-form-7': 'Contact Form 7', 'wordpress-seo': 'Yoast SEO',
    'wordpress-seo-premium': 'Yoast SEO Premium', 'seo-by-rank-math': 'Rank Math', 'seo-by-rank-math-pro': 'Rank Math Pro',
    'all-in-one-seo-pack': 'All in One SEO', 'js_composer': 'WPBakery', 'bb-plugin': 'Beaver Builder', 'oxygen': 'Oxygen',
    'sitepress-multilingual-cms': 'WPML', 'polylang': 'Polylang', 'jetpack': 'Jetpack', 'wp-rocket': 'WP Rocket',
    'litespeed-cache': 'LiteSpeed Cache', 'w3-total-cache': 'W3 Total Cache', 'autoptimize': 'Autoptimize',
    'google-site-kit': 'Site Kit by Google', 'google-analytics-for-wordpress': 'MonsterInsights', 'revslider': 'Slider Revolution',
    'wpforms-lite': 'WPForms', 'wpforms': 'WPForms', 'gravityforms': 'Gravity Forms', 'ninja-forms': 'Ninja Forms',
    'formidable': 'Formidable Forms', 'fluentform': 'Fluent Forms', 'mailchimp-for-wp': 'MC4WP (Mailchimp)', 'wp-smushit': 'Smush',
    'wordfence': 'Wordfence', 'essential-addons-for-elementor-lite': 'Essential Addons', 'header-footer-elementor': 'Elementor Header & Footer',
    'ultimate-addons-for-gutenberg': 'Spectra', 'cookie-law-info': 'CookieYes', 'complianz-gdpr': 'Complianz', 'wp-optimize': 'WP-Optimize',
    'really-simple-ssl': 'Really Simple SSL', 'redirection': 'Redirection', 'tablepress': 'TablePress', 'the-events-calendar': 'The Events Calendar',
    'buddypress': 'BuddyPress', 'bbpress': 'bbPress', 'learnpress': 'LearnPress', 'sfwd-lms': 'LearnDash', 'memberpress': 'MemberPress',
    'easy-digital-downloads': 'Easy Digital Downloads', 'woocommerce-payments': 'WooPayments', 'woocommerce-gateway-stripe': 'WooCommerce Stripe Gateway',
    'woo-razorpay': 'Razorpay for WooCommerce', 'wp-super-cache': 'WP Super Cache', 'smart-slider-3': 'Smart Slider 3', 'instagram-feed': 'Smash Balloon Instagram Feed',
    'gutenberg': 'Gutenberg (plugin)', 'kadence-blocks': 'Kadence Blocks', 'generateblocks': 'GenerateBlocks', 'astra-addon': 'Astra Pro',
    'updraftplus': 'UpdraftPlus', 'akismet': 'Akismet', 'translatepress-multilingual': 'TranslatePress', 'weglot': 'Weglot', 'wp-fastest-cache': 'WP Fastest Cache',
    'perfmatters': 'Perfmatters', 'flying-press': 'FlyingPress', 'nitropack': 'NitroPack', 'insert-headers-and-footers': 'WPCode', 'popup-maker': 'Popup Maker',
    'woocommerce': null // shown as the platform itself
  };
  const prettySlug = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\bWp\b/g, 'WP').replace(/\bSeo\b/g, 'SEO');

  function wordpressPlugins(U) {
    const found = new Map();
    for (const u of U.snapshot().assets) {
      const m = u.match(/\/wp-content\/plugins\/([a-z0-9_.-]+)\//i);
      if (!m) continue;
      const slug = m[1].toLowerCase();
      if (found.has(slug)) continue;
      const v = (u.match(/[?&]ver=([\d.]+)/) || [])[1] || '';
      found.set(slug, v);
    }
    const out = [];
    for (const [slug, v] of found) {
      const name = slug in WP_PLUGIN_NAMES ? WP_PLUGIN_NAMES[slug] : prettySlug(slug);
      if (name) out.push({ name, cat: C.plugin, version: v });
      if (out.length >= 30) break;
    }
    return out;
  }

  W.techCategories = C;

  W.detectTechStack = function detectTechStack(headers) {
    const U = W.util;
    const items = [];
    const seen = new Set();
    const add = (name, cat, version) => {
      if (seen.has(name)) return;
      seen.add(name);
      items.push({ name, cat, version: ver(version) });
    };

    for (const r of rules(U)) {
      let ok = false;
      try { ok = !!r.test(); } catch (_) { ok = false; }
      if (!ok) continue;
      let v = '';
      if (r.version) { try { v = r.version() || ''; } catch (_) { v = ''; } }
      add(r.name, r.cat, v);
    }

    // Back-end hints from response headers (X-Powered-By).
    if (headers && headers.backend) {
      headers.backend.forEach(b => { if (b.name === 'Next.js' || b.name === 'Nuxt') add(b.name, C.meta, b.version); });
    }

    // WordPress plugins straight from /wp-content/plugins/<slug>/ asset paths.
    wordpressPlugins(U).forEach(p => {
      if (!seen.has(p.name)) add(p.name, p.cat, p.version);
      else if (p.version) { const it = items.find(i => i.name === p.name); if (it && !it.version) it.version = p.version; }
    });

    // Preact sites often alias React; don't report both from a URL match alone.
    if (seen.has('Preact') && seen.has('React') && !U.has('React.version') && !U.expando(['__reactContainer$', '__reactFiber$', '_reactRootContainer'])) {
      items.splice(items.findIndex(i => i.name === 'React'), 1);
    }

    const versions = {};
    items.forEach(i => { if (i.version) versions[i.name] = i.version; });
    return { items, list: items.map(i => i.name), versions };
  };
})();
