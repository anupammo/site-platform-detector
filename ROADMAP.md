# Roadmap — from ~250 to 500+ users

**Starting point (Nov 2026, Chrome Web Store dashboard):** 243 users · 5.0★ from **2 ratings** · v1.3.0 live.
**Sister extensions:** SEO Checklist (222 users, 4.33★) · Meta Image Generator (15 users).
**Goal:** 500+ weekly users by **end of February 2027** (about 16 weeks), while staying 100% local and private.

> The user counts in this plan are targets, not forecasts. Check them weekly in the
> Developer Dashboard and move effort to whichever lever is actually working.

---

## What will move the number

Users come from **store search** (needs ranking signals: installs, ratings, retention),
from **outside links** (blogs, forums, sister extensions) and from **other stores**. In order of impact per hour:

| # | Lever | Why it matters here | Effort |
|---|---|---|---|
| 1 | **Ratings volume** | Only 2 ratings. Listings with under ~10 ratings convert poorly even at 5.0★. | Low (prompt already shipped) |
| 2 | **Cross-promotion from SEO Checklist** | 222 users with the same audience (SEO/web people) already exist one click away. | Low |
| 3 | **Microsoft Edge Add-ons** | Same package, no code changes, less competition. | Low |
| 4 | **Listing ASO refresh** | New 1.4 features (plugins, tracking IDs, site health) match high-intent searches. | Low |
| 5 | **Daily-use features (1.5)** | Weekly active users (not installs) sustain ranking. Tools people open every day keep the count up. | Medium |
| 6 | **Content & communities** | "Which WordPress theme is this site using" and "Shopify theme detector" are evergreen searches. | Medium |
| 7 | **Firefox + localization (1.6)** | New audiences without competing in the crowded English Chrome store. | Medium |

---

## Release plan

### v1.4 — "Accurate & useful" (this branch, ship in November)

Done in this release (see [CHANGELOG](CHANGELOG.md)):

- [x] Fixed the detection bugs found in the 1.3 audit: WordPress/Drupal reported as PrestaShop, HubSpot-form sites as HubSpot CMS, Django as Magento, Laravel as Rails, Underscore as Lodash, analytics false positives, sitemap misses, and the scan overwriting page functions.
- [x] 44 platforms (from 17), WordPress plugins with versions, page builders, Shopify apps.
- [x] Widgets & services: payments (incl. Razorpay, Cashfree, PhonePe), live chat, consent, captcha, maps, monitoring.
- [x] Tracking IDs (GA4 / GTM / Google Ads / Meta Pixel), click to copy.
- [x] Site health: noindex, robots.txt blocking, mixed content, title/description/H1, canonical, sitemap, end-of-life PHP.
- [x] Markdown report, "Report a wrong result" (pre-filled GitHub issue), friendlier errors.
- [x] Regression tests: 33 fixture pages + an end-to-end popup test.

Release checklist:

- [ ] Load unpacked, test on 10 real sites (2 WordPress, 2 Shopify, Wix, Webflow, a Next.js site, a Laravel app, a Drupal site, a site you know blocks crawlers).
- [ ] `npm run package` → upload `dist/website-framework-detector-1.4.0.zip`. Permissions are unchanged, so review should be quick.
- [ ] New screenshots (1280×800): ① WordPress result with theme + plugins, ② Shopify with theme + apps, ③ tracking IDs + site health, ④ hosting/security, ⑤ dark mode.
- [ ] Update the listing text from `marketing/store-listing.txt` (see the ASO section below).
- [ ] After approval: merge this branch into `main` and tag `v1.4.0`. **`main` is still on 1.2.1 while the store runs 1.3.0.** Keep `main` equal to what is live.
- [ ] Publish the same zip to **Microsoft Edge Add-ons** (partner.microsoft.com → Edge → new extension).

### v1.5 — "Open it every day" (December – January)

Features that bring people back (retention is what keeps search ranking up):

- [ ] **Clickable history.** Store the full result and reopen it from the history list without rescanning. **Export history as CSV** for agencies and freelancers building lead lists (for example, "WordPress sites on end-of-life PHP").
- [ ] **Outdated software warnings.** Bundle a small "latest version" table with each release: WordPress, PHP, jQuery < 3.5 (known XSS), Bootstrap 3, AngularJS (end-of-life). Show this in Site health.
- [ ] **Fonts & colors.** Fonts actually used (computed families) and the main color palette, so designers can use it too.
- [ ] **Core Web Vitals snapshot.** LCP, CLS and INP from the current tab using `PerformanceObserver`, measured locally.
- [ ] **Right-click → "Detect this site's tech".** The `contextMenus` permission shows no install warning.
- [ ] **Compare two sites** side by side from history.
- [ ] Brand icons for new technologies (Elementor, Klaviyo, Razorpay, Tawk.to…) from Simple Icons (CC0).
- [ ] Add each GitHub "wrong result" report as a fixture in `tests/fixtures.js`. Detection quality compounds.

### v1.6 — "New audiences" (February)

- [ ] **Firefox** (AMO). MV3 plus `scripting` with `world: "MAIN"` works in Firefox 128+. Needs `browser_specific_settings.gecko.id` and a background script fallback.
- [ ] **Localization** of UI and listing via `_locales`: Spanish, Portuguese (BR), German, French, Hindi. Have a human check the title and keywords.
- [ ] Optional **"Detect on page load" badge** (off by default). It needs a host permission, so offer it as an optional permission requested at runtime, never at install.

---

## Growth playbook (outside the code)

### Week 1–2 (with the 1.4 release)
- **SEO Checklist → Framework Detector cross-promo.** Add a footer link in the SEO Checklist popup, like the one this extension has back to it (`?utm_source=seo-checklist`). Do the same in Meta Image Generator.
- **Ratings.** The one-time prompt after 5 successful scans is live. Also ask in person: colleagues, clients and community members who actually use it. **Never** offer anything in exchange and never filter by sentiment (store policy; see `docs/growth-strategy.md`).
- **ASO.** Suggested title (max 75 characters): *"Website Framework Detector – CMS, Theme, Plugins & Tech Stack Checker"*. Put these phrases near the top of the description: *WordPress theme detector, Shopify theme detector, WordPress plugin checker, tech stack checker, Wappalyzer alternative, GA4/GTM tag checker*.
- **Edge Add-ons** submission.

### Week 3–8
- **Two how-to articles** on the product site and Dev.to/Medium, each ending with the extension:
  "How to find which WordPress theme and plugins a website uses" and "How to check whether GA4 and GTM are installed (and find the IDs)".
- **Listings:** AlternativeTo (as an alternative to Wappalyzer, BuiltWith and WhatRuns), Product Hunt launch for 1.5, GitHub topics (`wappalyzer-alternative`, `tech-stack`, `chrome-extension`) and relevant "awesome" lists.
- **Communities:** answer real "what is this site built with?" questions on Reddit (r/webdev, r/Wordpress, r/shopify, r/SEO), Stack Overflow and Facebook/WhatsApp web-dev groups. Lead with the answer and mention the tool second. Follow each community's self-promotion rules.

### Week 9–16
- Firefox + localized listings (v1.6).
- Re-shoot screenshots if impression→install conversion is below ~3%.
- Write one post from real data, e.g. "We scanned 100 Indian D2C stores: here's their stack", using your own scans.

---

## Targets and checkpoints

| Checkpoint | Users (weekly) | Ratings | Signal to watch |
|---|---|---|---|
| Today | 243 | 2 | — |
| End of Nov (1.4 + Edge + cross-promo) | 290 | 6+ | Installs from the SEO Checklist referrer |
| End of Dec (1.5) | 360 | 10+ | Uninstall rate after 1.5 |
| End of Jan (content + Product Hunt) | 430 | 15+ | Search impressions for "theme detector" |
| End of Feb (1.6 Firefox + locales) | **500+** (Chrome + Edge + Firefox) | 20+ | Store share by browser |

If a checkpoint is missed by more than 15%, look at the dashboard funnel first:
- **Low impressions** → ASO and backlinks.
- **Low impression→install** → screenshots, title and ratings.
- **High uninstalls** → accuracy (check the reported issues) and first-run experience.

---

## Housekeeping
- Keep `main` equal to the published version. Do feature work on `vX.Y` branches and merge after store approval.
- Every detection fix gets a fixture in `tests/fixtures.js` before it ships.
- Keep the privacy promise: no remote code, no analytics, no host permissions at install.
