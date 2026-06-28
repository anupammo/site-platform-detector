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
  const add = (name, cond) => { try { if (cond) stack.add(name); } catch (_) {} };

  // Frameworks & libraries (prefer runtime globals + precise asset paths)
  add('ReactJS', hasGlobal('React') || q('[data-reactroot], [data-reactid]') || srcMatch(/react(-dom)?[.@-]/i));
  add('VueJS', hasGlobal('Vue') || q('[data-v-app], [data-vue]') || srcMatch(/vue(@|\.runtime|\.global|\.min)?\.js/i));
  add('Angular', hasGlobal('ng') || q('[ng-version], [ng-app], [ng-controller]') || srcMatch(/@angular|angular(\.min)?\.js/i));
  add('Svelte', q('[class*="svelte-"]') || srcMatch(/svelte/i));
  add('Alpine.js', hasGlobal('Alpine') || q('[x-data]') || srcMatch(/alpine(js)?(\.min)?\.js/i));
  add('NextJS', hasGlobal('__NEXT_DATA__') || q('#__next') || srcMatch(/\/_next\//i));
  add('NuxtJS', hasGlobal('__NUXT__') || q('#__nuxt') || srcMatch(/\/_nuxt\//i));
  add('Gatsby', hasGlobal('___gatsby') || q('#___gatsby') || srcMatch(/\/page-data\//i));
  add('Astro', q('[data-astro-cid], astro-island') || srcMatch(/astro/i));
  add('jQuery', hasGlobal('jQuery'));
  add('Lodash', (hasGlobal('_') && !!(window._ && window._.VERSION)) || srcMatch(/lodash(\.min)?\.js/i));
  add('Moment.js', hasGlobal('moment') || srcMatch(/moment(\.min)?\.js/i));

  // CSS frameworks
  add('Bootstrap', cssMatch(/bootstrap(\.min)?\.css/i) || srcMatch(/bootstrap(\.bundle)?(\.min)?\.js/i));
  add('Tailwind CSS', cssMatch(/tailwind/i));

  // Backends with reliable client-visible signals only
  add('ASP.NET', q('input[name="__VIEWSTATE"]'));
  add('Ruby on Rails', q('meta[name="csrf-param"], meta[name="csrf-token"], [data-turbo], [data-turbolinks]'));

  const list = Array.from(stack);
  const faMap = {
    'HTML': 'fa-brands fa-html5',
    'CSS': 'fa-brands fa-css3-alt',
    'JavaScript': 'fa-brands fa-square-js',
    'ReactJS': 'fa-brands fa-react',
    'Angular': 'fa-brands fa-angular',
    'VueJS': 'fa-brands fa-vuejs',
    'Svelte': 'fa-solid fa-bolt',
    'Alpine.js': 'fa-solid fa-mountain-sun',
    'Gatsby': 'fa-solid fa-rocket',
    'NuxtJS': 'fa-solid fa-mountain',
    'NextJS': 'fa-solid fa-n',
    'Astro': 'fa-solid fa-rocket',
    'Bootstrap': 'fa-brands fa-bootstrap',
    'Tailwind CSS': 'fa-solid fa-wind',
    'ASP.NET': 'fa-brands fa-windows',
    'Ruby on Rails': 'fa-solid fa-gem',
    'jQuery': 'fa-solid fa-code',
    'Lodash': 'fa-solid fa-cubes',
    'Moment.js': 'fa-solid fa-clock'
  };

  const icons = list.map(name => ({ name, icon: faMap[name] || 'fa-solid fa-circle' }));
  return { list, icons };
}
