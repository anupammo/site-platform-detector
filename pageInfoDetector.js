// Page info detector — quick, genuinely useful facts about the current page.
// Runs in the page's MAIN world (injected on demand). All local, no network.
function detectPageInfo() {
  const txt = (sel, attr) => {
    try {
      const el = document.querySelector(sel);
      if (!el) return '';
      return (attr ? (el.getAttribute(attr) || '') : (el.textContent || '')).trim();
    } catch (_) { return ''; }
  };
  const count = (sel) => { try { return document.querySelectorAll(sel).length; } catch (_) { return 0; } };

  let words = 0, readingTime = 0;
  try {
    const body = document.body ? (document.body.innerText || '') : '';
    words = body.split(/\s+/).filter(Boolean).length;
    readingTime = Math.max(1, Math.round(words / 200)); // ~200 wpm
  } catch (_) {}

  const images = count('img');
  let imagesMissingAlt = 0;
  try { imagesMissingAlt = [...document.querySelectorAll('img')].filter(i => !i.getAttribute('alt')).length; } catch (_) {}

  const title = txt('title') || document.title || '';
  const description = txt('meta[name="description"]', 'content');

  return {
    title, titleLength: title.length,
    description, descriptionLength: description.length, hasDescription: !!description,
    lang: (document.documentElement && document.documentElement.lang) || '',
    https: location.protocol === 'https:',
    mobileFriendly: !!document.querySelector('meta[name="viewport"]'),
    canonical: !!document.querySelector('link[rel="canonical"]'),
    robots: txt('meta[name="robots"]', 'content'),
    socialCards: !!document.querySelector('meta[property^="og:"], meta[name^="twitter:"]'),
    structuredData: count('script[type="application/ld+json"]') > 0,
    favicon: !!document.querySelector('link[rel~="icon"]'),
    charset: (document.characterSet || ''),
    doctypeHtml5: !!(document.doctype && document.doctype.name === 'html' && !document.doctype.publicId),
    words, readingTime,
    images, imagesMissingAlt,
    headings: count('h1, h2, h3, h4, h5, h6'),
    h1: count('h1'),
    links: count('a[href]'),
    scripts: count('script'),
    stylesheets: count('link[rel="stylesheet"], style'),
    iframes: count('iframe')
  };
}

// Expose for on-demand MAIN-world injection.
if (typeof window !== "undefined") window.detectPageInfo = detectPageInfo;
