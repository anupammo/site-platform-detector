# Growth Strategy — Chrome Web Store (Month 3+)

Goal: reach and sustain **20,000+ monthly impressions by Month 3** by driving
algorithmic velocity — active engagement, steady review growth, and consistent
off-platform referral traffic. The CWS algorithm favors extensions with real
user engagement, rising ratings, and inbound clicks.

> ⚠️ **Read the compliance guardrails (bottom) before implementing Step 1.**
> Several common "growth hacks" violate the Chrome Web Store Developer Program
> Policies and can get a listing **suspended**. Everything below is written to
> stay on the right side of those rules.

---

## Step 1 — In-app "Review Engine" (Weeks 9–10)

High ratings are the strongest signal for category ranking and the
"Recommended" sidebar. Prompt happy users to review — **without** gating,
incentivizing, or nagging.

**Trigger:** track successful detections in `chrome.storage.local`. After the
user's **5th successful detection**, show a subtle one-time prompt:

> "Finding this useful? A quick rating helps us grow 🙌"

with two buttons: **Rate it** and **Not now**.

**Correct review URL** (the original plan's URL was malformed):

```
https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn/reviews
```

The extension ID is `ebkogcpaeaofidbegiadlfcfhlnaccnn`
([store listing](https://chromewebstore.google.com/detail/website-framework-detector/ebkogcpaeaofidbegiadlfcfhlnaccnn)).

**Rules for the prompt (policy-safe):**
- Show it **at most once**, then never again (persist a `reviewPrompted` flag).
- Optionally allow a single "remind me later" that re-arms after ~30 days.
- **Do not** require, reward, or pay for reviews. **Do not** route 1-star intent
  to a private form ("review gating") — that is prohibited.
- Keep it dismissible and non-blocking.

> **Prerequisite (code):** the extension currently has **no `storage` permission
> and no usage counter**. This step depends on adding `"storage"` to the manifest
> and a counter in `popup.js` — scheduled as part of Phase 3 of the
> [release plan](../README.md#roadmap). Implement that first.

---

## Step 2 — Localized metadata (Weeks 11–12)

Double the impression pool with **zero new features** by translating the listing.

- **Target locales:** Spanish (`es`), Portuguese (`pt_BR`), German (`de`),
  French (`fr`) — strong WordPress/Shopify developer regions.
- **What to translate:** title, short description, full description, and the
  most important search keywords.
- **Execution:** machine translation is fine for a first pass, but have a native
  speaker (or a careful review) sanity-check the **keywords and title** — those
  drive search ranking and literal translations often miss the terms developers
  actually search for.

---

## Step 3 — Programmatic external traffic (ongoing)

Inbound referral clicks signal relevance and boost in-store search ranking.

```
[Backlink / Blog / Article] ──► [Clicks to CWS listing] ──► [Higher store ranking]
```

- **"Alternatives" outreach:** find posts like *"Best Wappalyzer alternatives"*
  or *"How to find what platform a website uses"*; email authors with a short,
  honest pitch (privacy-first, open source, free) and ask to be added.
- **Content snippets:** publish 2–3 short technical posts on Dev.to / Medium —
  e.g. *"How to detect a Shopify site with JavaScript"* — linking the extension
  as the ready-made tool. This doubles as backlinks **and** SEO.
- **Lean into the differentiators** in every link: 100% local, no tracking,
  `activeTab`-only, open source. That is the angle competitors can't copy.

---

## Step 4 — Audit performance (end of Month 3)

Use the Developer Console analytics to tune:

- **Impression → Install conversion:** if impressions are high but installs are
  low, refresh the **icon and screenshots** (the most common culprit).
- **Search queries:** see which terms drive traffic. If e.g.
  *"Shopify theme checker"* drives a large share, move that exact phrase higher
  in the title/description.
- **Retention / weekly active users:** the engagement signal that sustains
  ranking after the initial spike — feeds back into Step 1.

---

## KPIs & cadence

| Metric | Target by Month 3 | Where |
|---|---|---|
| Monthly impressions | 20,000+ | Developer Console |
| Impression→Install | ≥ 3–5% | Developer Console |
| Rating | ≥ 4.5★ | Store listing |
| Review count growth | steady, week over week | Store listing |
| External referral clicks | rising trend | Console (referrers) |

Review these weekly; treat a stalled rating or dropping conversion as the
trigger to refresh assets or copy.

---

## ⚠️ Compliance guardrails (Chrome Web Store Developer Program Policies)

Violating these can get the extension **removed**. Non-negotiable:

1. **No incentivized reviews** — never offer features, money, or unlocks in
   exchange for a rating.
2. **No review gating** — never filter users by sentiment before sending them to
   the store (e.g. happy → store, unhappy → private form).
3. **No spammy prompting** — show the review ask sparingly (once), keep it
   dismissible, never block functionality behind it.
4. **No fake/purchased reviews or installs** — these are detectable and result
   in termination.
5. **Honest listing** — screenshots and description must match actual behavior.
6. **Permissions match reality** — only request `storage`/`scripting` if used,
   and justify each in the listing.

---

## Next actions

- [ ] Add `"storage"` permission + detection counter (Phase 3 dependency).
- [ ] Build the one-time, policy-safe review prompt in `popup.html` / `popup.js`.
- [x] Real review URL wired in (ID `ebkogcpaeaofidbegiadlfcfhlnaccnn`).
- [ ] Prepare translated listing metadata for `es`, `pt_BR`, `de`, `fr`.
- [ ] Draft the first "Wappalyzer alternative" outreach + one Dev.to article.
