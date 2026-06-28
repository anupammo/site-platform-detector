# SEO & ASO playbook — Website Framework Detector

Two surfaces drive organic installs: the **Chrome Web Store listing** (ASO) and your
**product page** (web SEO). This file covers both, plus ready-to-paste structured data.

---

## 1. Target keywords (search intent)

Rank for what people actually type when they want this tool:

| Intent | Keywords |
|---|---|
| Core | what is this website built with, website technology checker, tech stack detector |
| Platform | CMS detector, WordPress detector, Shopify detector, Wix / Webflow / Squarespace detector |
| Comparison | Wappalyzer alternative, BuiltWith alternative, WhatRuns alternative |
| Task | website builder checker, theme detector, framework finder, detect website framework |

Use these naturally in: store title, the **first line** of the short description (highest
weight), the detailed description, your product-page `<title>`, H1, and image alt text.

---

## 2. Chrome Web Store (ASO)

Ranking signals you control — see `store-listing.txt` for the optimized copy.

- **Title** packs the primary keyword: "Website Framework Detector – CMS & Tech Stack Checker".
- **Short description** (132 chars) leads with "what any website is built with" — front-load keywords.
- **Screenshots** (1280×800) with text overlays — captions double as keywords and lift CTR.
- **Category:** Developer Tools. **Update cadence:** ship small updates regularly (freshness signal).
- **Ratings velocity:** the in-app review prompt (already built) is the #1 lever — steady new 5★ reviews rank you higher.
- **Localized listings** (es, pt-BR, de, fr) multiply impressions — see `docs/growth-strategy.md`.
- **External clicks** to the listing (blog backlinks, Dev.to posts) boost in-store search rank.

---

## 3. Product page (web SEO)

For `https://anupammondal.in/chrome-extension/website-framework-detector`:

- **`<title>`** (≤60 chars): "Website Framework Detector — What Is This Site Built With?"
- **Meta description** (≤155 chars): the value prop + "free, private, one click".
- One **`<h1>`** with the primary keyword; `<h2>`s for Features / Supported platforms / FAQ.
- **Canonical** tag; **Open Graph** + **Twitter Card** for rich social previews.
- **FAQ section** targeting long-tail queries ("How do I tell what CMS a site uses?").
- Fast load (the page is the conversion gate — keep LCP < 2.5s), mobile-friendly.
- Internal links to the SEO Checklist page; **a real backlink campaign** (alternatives lists).
- Submit the URL in Search Console; include it in your sitemap.
- Add the **structured data** below (rich results + eligibility for badges).

---

## 4. Structured data (paste into the product page `<head>`)

`SoftwareApplication` + `FAQPage` JSON-LD. Fill `ratingValue`/`ratingCount` with the
**real** numbers from your store listing — never invent them; remove the block if you
have no ratings yet (fake ratings break rich-result eligibility and trust).

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Website Framework Detector",
  "operatingSystem": "Chrome",
  "applicationCategory": "BrowserApplication",
  "description": "Find out what any website is built with — CMS, website builder, theme, full tech stack, and analytics tags. 100% local, no tracking.",
  "url": "https://anupammondal.in/chrome-extension/website-framework-detector",
  "downloadUrl": "https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn",
  "image": "https://anupammondal.in/.../icon128.png",
  "author": { "@type": "Person", "name": "Anupam Mondal", "url": "https://anupammondal.in" },
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I find out what a website is built with?",
      "acceptedAnswer": { "@type": "Answer", "text": "Install Website Framework Detector, open any site, and click the icon. It detects the CMS or website builder, theme, tech stack, and analytics tags in one click — locally, with no data collection." }
    },
    {
      "@type": "Question",
      "name": "Is it a free Wappalyzer alternative?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. It's free, open source, requires no account, and runs entirely in your browser with no tracking — unlike tools that send your browsing data to their servers." }
    },
    {
      "@type": "Question",
      "name": "Can it detect WordPress, Shopify, Wix and Webflow?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes — plus Squarespace, Joomla, Drupal and more, each with a confidence score based on the real signals found on the page." }
    }
  ]
}
</script>
```

---

## 5. In-extension SEO value (feature → marketing flywheel)

Shipping the **SEO & meta audit panel** (roadmap) makes the listing legitimately rank for
"SEO checker"/"meta tag checker" queries *and* gives content to write about — every
"how to check a site's canonical/OG tags" article links back to the extension.
