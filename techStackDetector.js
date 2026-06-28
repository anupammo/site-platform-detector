// Tech stack detector — runs in the page's MAIN world (injected on demand).
// Page globals (window.React, window.Vue, window.jQuery, …) are reliable here.
// Uses precise asset patterns instead of loose substring matches to avoid
// false positives. Returns { list: string[], icons: {name, icon}[] }.
function detectTechStack() {
  const stack = new Set(['HTML', 'CSS', 'JavaScript']);

  const hasGlobal = (name) => { try { return typeof window[name] !== 'undefined' && window[name] !== null; } catch (_) { return false; } };
  const q = (sel) => { try { return !!document.querySelector(sel); } catch (_) { return false; } };
  const srcMatch = (re) => { try { return [...document.scripts].some(s => s.src && re.test(s.src)); } catch (_) { return false; } };
  const cssMatch = (re) => { try { return [...document.styleSheets].some(s => s.href && re.test(s.href)); } catch (_) { return false; } };
  const linkMatch = (re) => { try { return [...document.querySelectorAll('link[href]')].some(l => re.test(l.href)); } catch (_) { return false; } };
  const gen = (() => { try { const m = document.querySelector('meta[name="generator"]'); return (m && m.content) || ''; } catch (_) { return ''; } })();
  const add = (name, cond) => { try { if (cond) stack.add(name); } catch (_) {} };

  // JS frameworks / UI libraries (prefer runtime globals + precise asset paths)
  add('ReactJS', hasGlobal('React') || q('[data-reactroot], [data-reactid]') || srcMatch(/react(-dom)?[.@-]/i));
  add('Preact', hasGlobal('preact') || srcMatch(/preact(\.min)?\.js|preact@/i));
  add('VueJS', hasGlobal('Vue') || q('[data-v-app], [data-vue]') || srcMatch(/vue(@|\.runtime|\.global|\.min)?\.js/i));
  add('Angular', hasGlobal('ng') || q('[ng-version], [ng-app], [ng-controller]') || srcMatch(/@angular|angular(\.min)?\.js/i));
  add('Svelte', q('[class*="svelte-"]') || srcMatch(/svelte/i));
  add('SolidJS', srcMatch(/solid-js|\/solid@/i));
  add('Qwik', q('[q\\:container], [q\\:version]') || srcMatch(/qwik/i));
  add('Ember', hasGlobal('Ember') || q('.ember-application, [id^="ember"]'));
  add('Alpine.js', hasGlobal('Alpine') || q('[x-data]') || srcMatch(/alpine(js)?(\.min)?\.js/i));

  // Meta-frameworks / SSGs (globals, asset paths, or generator meta)
  add('NextJS', hasGlobal('__NEXT_DATA__') || q('#__next') || srcMatch(/\/_next\//i));
  add('NuxtJS', hasGlobal('__NUXT__') || q('#__nuxt') || srcMatch(/\/_nuxt\//i));
  add('Remix', hasGlobal('__remixContext') || srcMatch(/\/build\/_shared\/|remix/i));
  add('Gatsby', hasGlobal('___gatsby') || q('#___gatsby') || srcMatch(/\/page-data\//i));
  add('Astro', q('[data-astro-cid], astro-island') || /Astro/i.test(gen));
  add('Hugo', /Hugo/i.test(gen));
  add('Jekyll', /Jekyll/i.test(gen));
  add('Eleventy', /Eleventy/i.test(gen));

  // CSS frameworks
  add('Bootstrap', cssMatch(/bootstrap(\.min)?\.css/i) || srcMatch(/bootstrap(\.bundle)?(\.min)?\.js/i));
  add('Tailwind CSS', cssMatch(/tailwind/i));
  add('Font Awesome', cssMatch(/font-?awesome|fontawesome/i) || srcMatch(/fontawesome/i) || q('[class^="fa-"], [class*=" fa-"]'));
  add('Google Fonts', linkMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/i));

  // Popular libraries
  add('jQuery', hasGlobal('jQuery'));
  add('Lodash', (hasGlobal('_') && !!(window._ && window._.VERSION)) || srcMatch(/lodash(\.min)?\.js/i));
  add('Moment.js', hasGlobal('moment') || srcMatch(/moment(\.min)?\.js/i));
  add('Three.js', hasGlobal('THREE') || srcMatch(/three(\.min|\.module)?\.js/i));
  add('GSAP', hasGlobal('gsap') || srcMatch(/gsap|TweenMax|TweenLite/i));
  add('Stripe', hasGlobal('Stripe') || srcMatch(/js\.stripe\.com/i));

  // Back-ends with reliable client-visible signals only
  add('ASP.NET', q('input[name="__VIEWSTATE"]'));
  add('Ruby on Rails', q('meta[name="csrf-param"], meta[name="csrf-token"], [data-turbo], [data-turbolinks]'));

  // Best-effort versions (shown next to the chip when available).
  const versions = {};
  try { if (window.jQuery && window.jQuery.fn && window.jQuery.fn.jquery) versions['jQuery'] = window.jQuery.fn.jquery; } catch (_) {}
  try { const a = document.querySelector('[ng-version]'); if (a) versions['Angular'] = a.getAttribute('ng-version'); } catch (_) {}
  try { if (window.bootstrap && window.bootstrap.Tooltip && window.bootstrap.Tooltip.VERSION) versions['Bootstrap'] = window.bootstrap.Tooltip.VERSION; } catch (_) {}

  const list = Array.from(stack);
  return { list, versions };
}

// Expose for on-demand MAIN-world injection.
if (typeof window !== "undefined") window.detectTechStack = detectTechStack;
