// Page info detector — quick, useful facts about the current page (SEO basics,
// content stats, mixed content). All local, no network.
(function () {
  const W = window.__wfd = window.__wfd || {};

  W.detectPageInfo = function detectPageInfo() {
    const U = W.util;
    const attr = (sel, a) => U.safe(() => { const el = document.querySelector(sel); return el ? (el.getAttribute(a) || '').trim() : ''; }, '');
    const count = (sel) => U.safe(() => document.querySelectorAll(sel).length, 0);

    let words = 0;
    U.safe(() => { words = (document.body ? document.body.innerText || '' : '').split(/\s+/).filter(Boolean).length; });
    const imgs = U.qa('img');
    const imagesMissingAlt = imgs.filter(i => !i.hasAttribute('alt')).length;

    const title = (document.title || '').trim();
    const description = attr('meta[name="description" i]', 'content');
    const canonical = attr('link[rel="canonical"]', 'href');
    let canonicalOtherHost = false;
    if (canonical) U.safe(() => { canonicalOtherHost = new URL(canonical, location.href).host !== location.host; });

    // Insecure (http:) sub-resources on an https page.
    let mixedContent = 0;
    if (location.protocol === 'https:') {
      mixedContent = U.qa('script[src^="http:"], link[rel="stylesheet"][href^="http:"], img[src^="http:"], iframe[src^="http:"], video[src^="http:"], audio[src^="http:"], source[src^="http:"]').length;
    }

    return {
      title, titleLength: title.length,
      description, descriptionLength: description.length, hasDescription: !!description,
      lang: (document.documentElement && document.documentElement.lang) || '',
      https: location.protocol === 'https:',
      mobileFriendly: !!document.querySelector('meta[name="viewport"]'),
      canonical: !!canonical, canonicalUrl: canonical, canonicalOtherHost,
      robots: attr('meta[name="robots" i]', 'content'),
      socialCards: !!document.querySelector('meta[property^="og:"], meta[name^="twitter:"]'),
      structuredData: count('script[type="application/ld+json"]') > 0,
      favicon: !!document.querySelector('link[rel~="icon"]'),
      charset: document.characterSet || '',
      words, readingTime: Math.max(1, Math.round(words / 200)),
      images: imgs.length, imagesMissingAlt,
      headings: count('h1, h2, h3, h4, h5, h6'),
      h1: count('h1'),
      links: count('a[href]'),
      scripts: count('script'),
      stylesheets: count('link[rel="stylesheet"], style'),
      iframes: count('iframe'),
      mixedContent
    };
  };
})();
