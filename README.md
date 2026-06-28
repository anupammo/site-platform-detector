# Website Framework Detector

> Instantly reveal the CMS, website builder, and full tech stack behind any website — privately, in your browser, with zero tracking.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ebkogcpaeaofidbegiadlfcfhlnaccnn?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn)
[![Users](https://img.shields.io/chrome-web-store/users/ebkogcpaeaofidbegiadlfcfhlnaccnn)](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn)
[![Rating](https://img.shields.io/chrome-web-store/rating/ebkogcpaeaofidbegiadlfcfhlnaccnn)](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn/reviews)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Privacy: Local-only](https://img.shields.io/badge/Privacy-100%25%20Local-success)](marketing/privacy.html)

🔗 **[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn)** · **[Learn more](https://anupammondal.in/chrome-extension/website-framework-detector)**

Website Framework Detector is a lightweight Chrome extension that identifies which platform powers a site — **WordPress, WooCommerce, Shopify, Wix, Webflow, Squarespace, Joomla, Drupal, Magento** and more — along with its frontend libraries, theme, marketing/analytics tools, and key page-health facts. Everything runs **locally**: no account, no servers, no data collection.

![Detection result](screenshots/screenshot1.png)

---

## 🆕 What's new in v1.3

A major reliability + capability release:

- **Accurate detection engine** — rebuilt on on-demand `chrome.scripting` injection that reads the page's real runtime globals (`window.Shopify`, `wp`, `Webflow`, …); previous versions couldn't see these. Confidence is now a **real weighted score**, never random.
- **17 platforms** (up from 7) — added WooCommerce, Magento/Adobe Commerce, PrestaShop, BigCommerce, Ghost, Blogger, HubSpot CMS, Framer, Craft CMS, Duda — with a *prefer-the-specific-platform* rule (e.g. shows **WooCommerce**, not just WordPress).
- **Expanded tech stack** — Preact, SolidJS, Qwik, Ember, Remix, Three.js, GSAP, Stripe, Google Fonts, Font Awesome, plus SSGs (Astro, Hugo, Jekyll, Eleventy).
- **New Page info panel** — word count, reading time, images & missing-alt, plus health checks (HTTPS, mobile-friendly, meta description, canonical, social cards, structured data, single H1).
- **Redesigned UI** — auto-detect on open, real brand logos, light/dark mode, copy + export JSON, re-scan, **share** button, and the current site's favicon in the URL bar.
- **Privacy hardened** — removed the Font Awesome CDN; all icons/logos are now bundled locally.

See the full [changelog](CHANGELOG.md).

---

## Why this extension

Most "what is this site built with" tools either phone home, require an account, or quietly profile your browsing. This one doesn't. It is built around three principles:

- **Private by default** — detection happens entirely in your browser. Nothing is sent anywhere.
- **Lean by design** — only `activeTab`, `scripting`, and `storage`; **no host permissions, no browsing access**, and code runs **only when you click**, never silently on every page.
- **Honest results** — confidence scores reflect the actual signals found on the page, not a random number.

### How it compares

| | Framework Detector | Wappalyzer | BuiltWith | WhatRuns |
|---|:---:|:---:|:---:|:---:|
| 100% local, no servers | ✅ | ⚠️ (sends data) | ❌ | ⚠️ |
| No account required | ✅ | ✅ | ❌ | ⚠️ |
| Runs only on click (no passive scanning) | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ (GPLv3) | ⚠️ partial | ❌ | ❌ |
| Free, no paywall | ✅ | ⚠️ freemium | ⚠️ freemium | ✅ |
| Minimal permissions (no host/browsing access) | ✅ | ❌ | ❌ | ❌ |

---

## Features

- 🔎 **Platform detection (17)** — WordPress, WooCommerce, Shopify, Wix, Webflow, Squarespace, Joomla, Drupal, Magento/Adobe Commerce, PrestaShop, BigCommerce, Ghost, Blogger, HubSpot CMS, Framer, Craft CMS, Duda.
- 🧩 **Tech stack** — React, Preact, Vue, Angular, Svelte, Solid, Qwik, Ember, Next.js, Nuxt, Remix, Gatsby, Astro, Hugo, Jekyll, Eleventy, jQuery, Tailwind, Bootstrap, Three.js, GSAP, Stripe, and more.
- 🎨 **Theme detection** — extracts the active theme/template where the platform exposes it.
- 📈 **Marketing & analytics tags** — Google Analytics/GA4, GTM, Meta Pixel, Hotjar, Clarity, Segment, Mixpanel, HubSpot, TikTok, LinkedIn, Pinterest, Intercom, and more.
- 📄 **Page info & health** — word count, reading time, image/alt audit, plus HTTPS, mobile-friendly, meta description, canonical, social cards, structured data, and single-H1 checks.
- 📊 **Real confidence scoring** — score reflects how many independent signals matched (never a random number).
- 🖼️ **Real brand logos** — instantly recognizable, bundled locally.
- ⚡ **Auto-detect on open** — results appear the moment you open the popup; one click to re-scan.
- 📋 **Copy & export** — copy a summary or download the full result as JSON.
- 🔗 **Share** — share the extension via the native share sheet (or copy link).
- 🌙 **Dark mode** — follows your system theme, with a manual toggle.
- 🔒 **Zero external assets** — all icons and logos are bundled; nothing is loaded from a CDN.

---

## Install

### From the Chrome Web Store (recommended)
**[➜ Install Website Framework Detector](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn)**, then pin the icon to your toolbar.

### Manual / developer install
1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.

---

## Usage

1. Open any website.
2. Click the extension icon — detection runs **automatically**.

You'll see the detected platform, a confidence score, the theme, the tech stack, and any marketing/analytics tags present on the page. Use **Re-scan** to run again, **Copy**/**Export JSON** to grab the results, and the header toggle for dark mode.

![Tech stack and tags](screenshots/screenshot2.png)

---

## How it works

The extension inspects the live page using multiple independent signal types and scores the result:

- **DOM & meta signals** — `generator` meta tags, platform-specific classes, data attributes, asset paths (`/wp-content/`, `cdn.shopify.com`, …).
- **Script & stylesheet sources** — precise host/path matching (not loose substrings).
- **Page runtime globals** — probed safely in the page's own JavaScript context (e.g. `Shopify`, `wp`, `Webflow`, `React`) via a `MAIN`-world script, then passed back.
- **Scoring** — each match contributes to a confidence value; the platform with the strongest evidence wins.

Detection is **triggered on demand** from the popup using `chrome.scripting`, so no code runs on pages you don't ask about.

```
popup.html / popup.js     ← UI + triggers detection on click
  └─ chrome.scripting      ← injects detectors into the active tab (MAIN world)
       ├─ frameworkDetector ← CMS / builder / e-commerce platform
       ├─ techStackDetector ← frameworks & libraries
       ├─ themeDetector      ← active theme/template
       ├─ siteInfoDetector   ← analytics, pixels, sitemap
       └─ pageInfoDetector   ← page health: words, images, SEO checks
```

---

## Privacy

This extension does **not** collect, store, or transmit any personal data or browsing history. All analysis is performed locally on the page you explicitly choose to scan. See the full [Privacy Policy](marketing/privacy.html).

---

## Development

This is a vanilla JavaScript Manifest V3 extension — no build step required.

```bash
git clone https://github.com/anupammo/site-platform-detector.git
cd site-platform-detector
# Load unpacked in chrome://extensions
```

**Project layout**

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest (permissions, icons, popup) |
| `popup.html` / `popup.js` | Extension UI and result rendering |
| `frameworkDetector.js` | CMS / website-builder / e-commerce detection |
| `techStackDetector.js` | Frameworks & libraries |
| `themeDetector.js` | Active theme / template extraction |
| `siteInfoDetector.js` | Analytics, pixels, sitemap |
| `pageInfoDetector.js` | Page health: words, images, SEO checks |
| `background.js` | Service worker (lifecycle, install page) |
| `icons/brands/` | Bundled brand logos (recolored Simple Icons, CC0) |

### Project docs
- [Changelog](CHANGELOG.md)
- [Growth strategy (Chrome Web Store, Month 3+)](docs/growth-strategy.md)
- [SEO & ASO playbook](marketing/seo.md)

### Adding a new platform
1. Add a detector function (DOM/meta/script signals + optional `MAIN`-world global check).
2. Register it in the scoring pipeline with its signals.
3. Add an icon mapping and a sample fixture under `tests/fixtures/`.
4. Run the detection tests.

---

## Roadmap

### New detection categories (align engine with the product page)
- [ ] **Hosting & CDN** — Cloudflare (full), Netlify, Vercel, AWS/CloudFront, Google Cloud, Fastly
- [ ] **Server & backend** — Apache, Nginx, IIS; PHP, Node.js, ASP.NET (via response headers + asset hints)
- [ ] **SEO & meta** — canonical tag, robots/meta-robots, structured data (JSON-LD), Open Graph / Twitter cards, hreflang
- [x] **More platforms** — WooCommerce, Magento, PrestaShop, BigCommerce, Ghost, Blogger, HubSpot CMS, Framer, Craft CMS, Duda
- [x] **Page info panel** — word count, reading time, images/alt, mobile-friendly, HTTPS, canonical, social cards, structured data

### Engine & UX
- [x] Auto-detect on popup open
- [x] Copy results / export as JSON
- [x] Dark mode
- [ ] Response-header signals (enables hosting/server detection)
- [ ] Detection history (opt-in)
- [ ] Firefox / Edge builds

> Note: Hosting/CDN, server, and SEO/meta detection are advertised on the
> [product page](https://anupammondal.in/chrome-extension/website-framework-detector)
> and are tracked here to bring the shipped extension in line with that copy.

---

## Contributing

Issues and pull requests are welcome. Please include a sample URL or HTML fixture when reporting a detection miss so it can be added to the regression set.

## License

[GNU GPL v3](LICENSE) © [Anupam Mondal](https://anupammondal.in)

## Links & Support

- 🧩 **Chrome Web Store:** [Website Framework Detector](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn)
- 🌐 **Product page:** [anupammondal.in/chrome-extension/website-framework-detector](https://anupammondal.in/chrome-extension/website-framework-detector)
- ✍️ **Leave a review:** [Rate it on the Web Store](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn/reviews)
- 📧 **Questions / feature requests:** **a09051985@gmail.com** **anupam.wd@gmail.com**
