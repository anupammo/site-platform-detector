# Changelog

All notable changes to **Website Framework Detector** are documented here.
This project adheres to [Semantic Versioning](https://semver.org/) and the
[Keep a Changelog](https://keepachangelog.com/) format.

## [1.4.0] — 2026-11

Accuracy fixes for real-world sites, plus the everyday tools people asked for:
"which plugins/apps does this site use?", "is my tracking installed?", and
"is anything blocking Google?".

### Fixed (detection bugs found in a 1.3 audit — each now has a regression test)
- **WordPress and Drupal sites reported as PrestaShop.** Any theme with a `/themes/<name>/assets/` folder (Astra, Kadence, GeneratePress, most Drupal 8+ themes) matched a loose PrestaShop rule that also overrode the real platform.
- **WordPress/Webflow sites with a HubSpot form reported as "HubSpot CMS".** HubSpot forms/tracking no longer count as the CMS.
- **Django apps (`/static/frontend/`) and any site using RequireJS reported as Magento.**
- **Every Laravel site reported as Ruby on Rails** (both use a `csrf-token` meta tag).
- **WordPress's Underscore.js reported as Lodash.**
- **The scan overwrote page functions** with the same name (e.g. a site's own `detectTheme()` dark-mode toggle). All detector code now lives in one temporary namespace that is removed after the scan.
- **No theme shown for WooCommerce stores**; Shopify theme was never found (now read from `Shopify.theme`); Joomla 4 and Magento versioned asset paths returned wrong/empty themes.
- **Wrong version shown** — WooCommerce showed the WordPress version; WordPress version now also read from core asset `?ver=` when the generator tag is hidden.
- **Analytics false positives** — `cdnjs.cloudflare.com` shown as "Cloudflare", any `window.analytics` shown as Segment, Google Ads-only sites shown as GA4.
- **Sitemap check** missed sitemaps declared in `robots.txt` (Yoast's `sitemap_index.xml`, WordPress's `wp-sitemap.xml`) and reported a sitemap on single-page apps that answer every URL with HTML.
- Detection on modern React (18+) apps, compiled Tailwind CSS and Next.js App Router sites, which expose no globals.

### Added
- **44 platforms** (up from 17): OpenCart, Shopware, Salesforce Commerce Cloud, TYPO3, Concrete CMS, Sitecore, Adobe Experience Manager, Odoo, Weebly/Square Online, GoDaddy Website Builder, Tilda, Jimdo, Strikingly, Hostinger Website Builder, Kajabi, Teachable, Thinkific, Substack, Medium, Tumblr, Notion, Docusaurus, VitePress, MkDocs, GitBook, Sphinx, Mintlify.
- **Plugins & apps** — every WordPress plugin visible in the page's assets (with versions), page builders (Elementor, Divi, WPBakery, Beaver Builder, Bricks), SEO plugins (Yoast, Rank Math, AIOSEO), cache plugins, and Shopify apps (Judge.me, Yotpo, Loox, ReCharge, PageFly, GemPages…).
- **Widgets & services** — payments (Stripe, PayPal, Razorpay, Cashfree, PhonePe, Klarna…), live chat (Intercom, Tawk.to, Crisp, Zendesk, WhatsApp…), cookie consent, captcha, maps, video, monitoring, email marketing and A/B testing tools.
- **Tracking IDs** — GA4 (`G-…`), GTM (`GTM-…`), Google Ads (`AW-…`) and Meta Pixel IDs shown on the chips; click to copy. 30 analytics/ad tags (new: Google Ads, Plausible, Matomo, PostHog, Amplitude, Snap, Reddit, Vercel Analytics…).
- **Site health** — flags `noindex`, robots.txt blocking all crawlers, missing HTTPS, mixed content, missing title/description/H1, canonical pointing elsewhere, missing sitemap, end-of-life PHP and server version leaks.
- **27 hosting providers** — adds WP Engine, Kinsta, Pantheon, Acquia, Hostinger, Azure, Heroku, Render, Fly.io, Railway, Bunny CDN, Sucuri, Imperva, Varnish and more; server and PHP versions.
- **Framework fallback** — custom sites are named after their framework (e.g. "Next.js", "Laravel") instead of "Custom/Unknown".
- **Markdown report** — Copy now produces a full report that pastes cleanly into Slack, Notion, Jira or email.
- **"Wrong or missing result? Report it"** — opens a pre-filled GitHub issue (nothing is sent unless you submit it).
- Friendlier errors for Chrome Web Store pages, `file://` pages and protected pages.
- Automated tests: 33 fixture pages (`npm test`) plus an end-to-end popup test (`npm run test:e2e`).

### Privacy
- Permissions unchanged (`activeTab`, `scripting`, `storage`). The only extra requests go to the site's own `robots.txt` and sitemap, on click.

## [1.3.0] — 2026-06-28

A major reliability and capability release.

### Added
- **9 new platforms** — WooCommerce, Magento/Adobe Commerce, PrestaShop, BigCommerce, Ghost, Blogger, HubSpot CMS, Framer, Craft CMS, Duda (now 17 total).
- **"Prefer the specific platform"** rule — e.g. a WooCommerce store is reported as WooCommerce rather than just WordPress.
- **Expanded tech stack** — Preact, SolidJS, Qwik, Ember, Remix, Three.js, GSAP, Stripe, Google Fonts, Font Awesome, and static-site generators (Astro, Hugo, Jekyll, Eleventy).
- **Hosting / CDN / server / back-end detection** via response headers (Cloudflare, Vercel, Netlify, Fastly, CloudFront, GitHub Pages, Akamai, Nginx, Apache, PHP, ASP.NET) — read same-origin in the page context, so **no new permissions**.
- **Security headers panel** — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **Version detection** — platform version from the generator meta (e.g. WordPress 6.5) and library versions (jQuery, Angular, Bootstrap).
- **"Why this result"** expander showing the matched signals behind each detection.
- **Detection history** — recent scans stored locally, viewable and clearable from the popup (never uploaded).
- **Toolbar badge** with the detected platform, and an `Alt+Shift+D` keyboard shortcut to open the popup.
- **Page info panel** — word count, reading time, image & missing-alt audit, headings/links/scripts counts.
- **Real brand logos** bundled locally for platforms, tech, and hosting providers.
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

[1.4.0]: https://github.com/anupammo/site-platform-detector/releases/tag/v1.4.0
[1.3.0]: https://github.com/anupammo/site-platform-detector/releases/tag/v1.3.0
[1.2.2]: https://github.com/anupammo/site-platform-detector/releases/tag/v1.2.2
[1.2.0]: https://github.com/anupammo/site-platform-detector/releases/tag/v1.2.0
