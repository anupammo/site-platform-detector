# Contributing to Website Framework Detector

First off — thank you for taking the time to contribute! 🎉
This project is a privacy-first, open-source Chrome extension, and contributions
of all kinds are welcome: bug reports, detection improvements, new platform
support, docs, and ideas.

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Project setup](#project-setup)
- [Development workflow](#development-workflow)
- [Adding a new platform or signal](#adding-a-new-platform-or-signal)
- [Coding guidelines](#coding-guidelines)
- [Commit messages](#commit-messages)
- [Submitting a pull request](#submitting-a-pull-request)
- [Reporting bugs & requesting features](#reporting-bugs--requesting-features)
- [Security issues](#security-issues)

---

## Ways to contribute

- 🐛 **Report a detection miss** — tell us a site that's detected wrong (include the URL).
- 🧩 **Add platform/library support** — WooCommerce, Framer, Astro, etc.
- 🎨 **Improve the UI/UX** of the popup.
- 📖 **Improve docs** — README, this guide, code comments.
- 🌍 **Localization** — help translate the store listing.

## Project setup

This is a vanilla JavaScript **Manifest V3** extension — no build step required.

```bash
git clone https://github.com/anupammo/site-platform-detector.git
cd site-platform-detector
```

Load it unpacked:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and select the project folder
4. After edits, click the **reload** icon on the extension card

## Development workflow

1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/short-description
   ```
2. Make your change, keeping it focused and small.
3. **Test manually** against a real site for each platform your change affects
   (and add a fixture if applicable — see below).
4. Make sure the popup shows no console errors.
5. Open a pull request using the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

Branch name prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`.

## Adding a new platform or signal

Detection is signal-based. To add a platform:

1. Add a detector with **independent signals** (meta `generator`, asset paths,
   data attributes, script/stylesheet hosts, and optional page-runtime globals
   probed in the `MAIN` world).
2. Register it in the scoring pipeline with appropriate weights — prefer
   **precise host/path matches** over loose substring checks to avoid false
   positives.
3. Add an icon mapping in `techStackDetector.js` / `popup.js`.
4. Add a sample HTML fixture under `tests/fixtures/` so detection is
   regression-checked.
5. Update the **Supported platforms** list in the README.

## Coding guidelines

- **Vanilla JS**, MV3-compliant — no remote code, no external runtime assets.
- Wrap detectors in `try/catch`; one failing signal must never break a run.
- Render results with `textContent` / DOM nodes — **never** `innerHTML` with
  untrusted data (avoid XSS).
- Keep permissions minimal; justify any new permission in the PR.
- Prefer targeted selectors over serializing `document.body.innerHTML`.
- Match the existing code style (2-space indent, semicolons).

## Commit messages

Use clear, imperative messages. [Conventional Commits](https://www.conventionalcommits.org/)
are encouraged:

```
feat: add WooCommerce detection
fix: correct async sitemap check
docs: clarify install steps
```

## Submitting a pull request

- Keep PRs focused — one logical change per PR.
- Fill out the PR template, including how you tested.
- Link any related issue (`Closes #123`).
- Add screenshots/GIFs for UI changes.
- Be responsive to review feedback. 🙌

## Reporting bugs & requesting features

Please use the issue templates:
- 🐛 [Bug report](.github/ISSUE_TEMPLATE/bug_report.yml)
- ✨ [Feature request](.github/ISSUE_TEMPLATE/feature_request.yml)

For detection misses, **always include the site URL** and what was expected vs.
what was detected.

## Security issues

**Do not** open a public issue for security vulnerabilities. Follow our
<<<<<<< HEAD
[Security Policy](SECURITY.md) and report privately to **support@credifyfast.com**.
=======
[Security Policy](SECURITY.md) and report privately to **support@credifyfast.com**.
>>>>>>> 2f7be1fbe98762e0ed803377809f292517720734
