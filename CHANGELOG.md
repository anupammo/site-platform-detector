# Changelog

All notable changes to **Website Framework Detector** are documented here.
This project adheres to [Semantic Versioning](https://semver.org/) and the
[Keep a Changelog](https://keepachangelog.com/) format.

## [1.3.0] — 2026-06-28

A major reliability and capability release.

### Added
- **9 new platforms** — WooCommerce, Magento/Adobe Commerce, PrestaShop, BigCommerce, Ghost, Blogger, HubSpot CMS, Framer, Craft CMS, Duda (now 17 total).
- **"Prefer the specific platform"** rule — e.g. a WooCommerce store is reported as WooCommerce rather than just WordPress.
- **Expanded tech stack** — Preact, SolidJS, Qwik, Ember, Remix, Three.js, GSAP, Stripe, Google Fonts, Font Awesome, and static-site generators (Astro, Hugo, Jekyll, Eleventy).
- **Page info panel** — word count, reading time, image & missing-alt audit, headings/links/scripts counts, plus health checks: HTTPS, mobile-friendly, meta description, canonical, social cards, structured data, single H1.
- **Real brand logos** bundled locally for platforms and tech.
- **Auto-detect on popup open**, **Re-scan**, **Copy summary**, **Export JSON**.
- **Share** button (Web Share API with copy-link fallback).
- **Dark mode** (system-aware + manual toggle).
- Current site's **favicon** shown in the URL bar.
- **Install-time** product page open; cross-promo link to the companion *SEO Checklist* extension.
- One-time, policy-safe **in-app review prompt** (after 5 successful detections).

### Changed
- **Detection rebuilt on `chrome.scripting` MAIN-world injection** — page runtime globals (`window.Shopify`, `wp`, `Webflow`, …) are now actually read; previously they were invisible to the isolated content script.
- **Confidence is now a real weighted score** based on matched signals (no more random numbers).
- Tightened detectors with higher-signal checks (WP REST API link, Shopify `/cdn/shop/`, Drupal `drupal-settings-json`, Magento `x-magento-init`, etc.).
- Precise asset/host matching for tech detection (removed false-positive-prone substring checks).
- Async-correct sitemap check (awaited before results render).
- Redesigned popup UI.

### Removed
- **Font Awesome CDN dependency** — all icons/logos are now bundled locally, so nothing loads from an external server.
- Passive `<all_urls>` content-script injection — detection runs only on demand.
- `update_url` from the manifest (not needed for a Web Store listing).

### Fixed
- Theme detector no longer reports a color (e.g. `#1e40af`) picked up from `<meta name="theme-color">`.
- Extension header now shows the real product logo.

### Security / Privacy
- Permissions: `activeTab`, `scripting`, `storage` — no host permissions, no browsing access.
- All analysis remains 100% local; no data collection.

## [1.2.2] — 2025

- Squarespace detection, theme/tech-stack/site-info helpers, friendly error states.

## [1.2.0] — 2025

- Initial public release: WordPress, Shopify, Wix, Webflow, Joomla, Drupal detection.

[1.3.0]: https://github.com/anupammo/site-platform-detector/releases/tag/v1.3.0
[1.2.2]: https://github.com/anupammo/site-platform-detector/releases/tag/v1.2.2
[1.2.0]: https://github.com/anupammo/site-platform-detector/releases/tag/v1.2.0
