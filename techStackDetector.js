// Tech stack detection helper loaded before content.js via manifest
// Returns { list: string[], icons: {name: string, icon: string}[] }
function detectTechStack() {
  const stack = new Set(['HTML', 'CSS', 'JavaScript']);
  const icons = [];

  // Frontend libs
  try {
    if (window.React || document.querySelector('[data-reactroot], [data-reactid]') || [...document.scripts].some(s => s.src && s.src.includes('react'))) {
      stack.add('ReactJS');
    }
  } catch {}
  // Svelte
  try {
    if (document.querySelector('[data-svelte]') || [...document.scripts].some(s => s.src && s.src.includes('svelte'))) {
      stack.add('Svelte');
    }
  } catch {}
  // Alpine.js
  try {
    if (document.querySelector('[x-data]') || [...document.scripts].some(s => s.src && s.src.includes('alpine'))) {
      stack.add('Alpine.js');
    }
  } catch {}
  // Gatsby
  try {
    if (window.___gatsby || [...document.scripts].some(s => s.src && s.src.includes('gatsby'))) {
      stack.add('Gatsby');
    }
  } catch {}
  // NuxtJS
  try {
    if (window.__NUXT__ || [...document.scripts].some(s => s.src && s.src.includes('nuxt'))) {
      stack.add('NuxtJS');
    }
  } catch {}
  try {
    if (window.angular || document.querySelector('[ng-app], [ng-controller]') || [...document.scripts].some(s => s.src && s.src.includes('angular'))) {
      stack.add('Angular');
    }
  } catch {}
  try {
    if (window.Vue || document.querySelector('[data-vue]') || [...document.scripts].some(s => s.src && s.src.includes('vue'))) {
      stack.add('VueJS');
    }
  } catch {}

  // CSS frameworks
  try {
    if ([...document.styleSheets].some(s => s.href && s.href.includes('bootstrap'))) {
      stack.add('Bootstrap');
    }
  } catch {}
  try {
    if ([...document.styleSheets].some(s => s.href && s.href.includes('tailwind'))) {
      stack.add('Tailwind CSS');
    }
  } catch {}

  // Backend hints
  try { if ([...document.scripts].some(s => s.src && s.src.includes('php'))) stack.add('PHP'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('laravel'))) stack.add('Laravel'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('express'))) stack.add('ExpressJS'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('next'))) stack.add('NextJS'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('nestjs'))) stack.add('NestJS'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('strapi'))) stack.add('Strapi'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('symfony'))) stack.add('Symfony'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('yii'))) stack.add('Yii'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('cakephp'))) stack.add('CakePHP'); } catch {}
  // Python backends
  try { if (document.querySelector('script[src*="django"], link[href*="django"]')) stack.add('Django'); } catch {}
  try { if ([...document.scripts].some(s => s.textContent && s.textContent.includes('Flask'))) stack.add('Flask'); } catch {}
  // Ruby on Rails
  try { if (document.querySelector('meta[name="csrf-param"], meta[name="csrf-token"], [data-turbolinks]') || [...document.scripts].some(s => s.src && s.src.includes('/assets/'))) stack.add('Rails'); } catch {}
  // ASP.NET
  try { if (document.querySelector('input[name="__VIEWSTATE"]')) stack.add('ASP.NET'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('zend'))) stack.add('Zend'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('codeigniter'))) stack.add('CodeIgniter'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('mysql'))) stack.add('MySQL'); } catch {}

  // Common libraries
  try { if (window.jQuery || window.$ || [...document.scripts].some(s => s.src && s.src.includes('jquery'))) stack.add('jQuery'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('lodash'))) stack.add('Lodash'); } catch {}
  try { if ([...document.scripts].some(s => s.src && s.src.includes('moment'))) stack.add('Moment.js'); } catch {}

  const list = Array.from(stack);
  const faMap = {
    'HTML': 'fa-brands fa-html5',
    'CSS': 'fa-brands fa-css3-alt',
    'JavaScript': 'fa-brands fa-square-js',
    'ReactJS': 'fa-brands fa-react',
    'Angular': 'fa-brands fa-angular',
    'VueJS': 'fa-brands fa-vuejs',
  'Svelte': 'fa-solid fa-s',
  'Alpine.js': 'fa-solid fa-mountain-sun',
  'Gatsby': 'fa-solid fa-g',
  'NuxtJS': 'fa-solid fa-n',
    'Bootstrap': 'fa-brands fa-bootstrap',
    'Tailwind CSS': 'fa-solid fa-wind',
    'PHP': 'fa-brands fa-php',
    'Laravel': 'fa-brands fa-laravel',
    'ExpressJS': 'fa-brands fa-node-js',
    'NextJS': 'fa-solid fa-n',
  'NestJS': 'fa-solid fa-n',
  'Strapi': 'fa-solid fa-server',
  'Symfony': 'fa-solid fa-feather',
  'Yii': 'fa-solid fa-y',
  'CakePHP': 'fa-solid fa-cake-candles',
  'Django': 'fa-solid fa-python',
  'Flask': 'fa-solid fa-flask',
  'Rails': 'fa-solid fa-train',
  'ASP.NET': 'fa-brands fa-windows',
    'Zend': 'fa-solid fa-code',
    'CodeIgniter': 'fa-solid fa-fire',
    'MySQL': 'fa-solid fa-database',
    'jQuery': 'fa-solid fa-code',
    'Lodash': 'fa-solid fa-cubes',
    'Moment.js': 'fa-solid fa-clock'
  };

  const iconsList = list.map(name => ({ name, icon: faMap[name] || 'fa-solid fa-circle' }));
  return { list, icons: iconsList };
}
