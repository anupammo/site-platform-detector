<<<<<<< HEAD
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, caste, color, religion, or sexual
identity and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment for our
community include:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes,
  and learning from the experience
* Focusing on what is best not just for us as individuals, but for the overall
  community

Examples of unacceptable behavior include:

* The use of sexualized language or imagery, and sexual attention or advances of
  any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or email address,
  without their explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

Community leaders have the right and responsibility to remove, edit, or reject
comments, commits, code, wiki edits, issues, and other contributions that are
not aligned to this Code of Conduct, and will communicate reasons for moderation
decisions when appropriate.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.
Examples of representing our community include using an official email address,
posting via an official social media account, or acting as an appointed
representative at an online or offline event.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
**support@credifyfast.com**.

All complaints will be reviewed and investigated promptly and fairly.

All community leaders are obligated to respect the privacy and security of the
reporter of any incident.

## Enforcement Guidelines

Community leaders will follow these Community Impact Guidelines in determining
the consequences for any action they deem in violation of this Code of Conduct:

### 1. Correction

**Community Impact**: Use of inappropriate language or other behavior deemed
unprofessional or unwelcome in the community.

**Consequence**: A private, written warning from community leaders, providing
clarity around the nature of the violation and an explanation of why the
behavior was inappropriate. A public apology may be requested.

### 2. Warning

**Community Impact**: A violation through a single incident or series of
actions.

**Consequence**: A warning with consequences for continued behavior. No
interaction with the people involved, including unsolicited interaction with
those enforcing the Code of Conduct, for a specified period of time. This
includes avoiding interactions in community spaces as well as external channels
like social media. Violating these terms may lead to a temporary or permanent
ban.

### 3. Temporary Ban

**Community Impact**: A serious violation of community standards, including
sustained inappropriate behavior.

**Consequence**: A temporary ban from any sort of interaction or public
communication with the community for a specified period of time. No public or
private interaction with the people involved, including unsolicited interaction
with those enforcing the Code of Conduct, is allowed during this period.
Violating these terms may lead to a permanent ban.

### 4. Permanent Ban

**Community Impact**: Demonstrating a pattern of violation of community
standards, including sustained inappropriate behavior, harassment of an
individual, or aggression toward or disparagement of classes of individuals.

**Consequence**: A permanent ban from any sort of public interaction within the
community.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
[https://www.contributor-covenant.org/version/2/1/code_of_conduct.html][v2.1].

Community Impact Guidelines were inspired by
[Mozilla's code of conduct enforcement ladder][Mozilla CoC].

For answers to common questions about this code of conduct, see the FAQ at
[https://www.contributor-covenant.org/faq][FAQ]. Translations are available at
[https://www.contributor-covenant.org/translations][translations].

[homepage]: https://www.contributor-covenant.org
[v2.1]: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
[Mozilla CoC]: https://github.com/mozilla/diversity
[FAQ]: https://www.contributor-covenant.org/faq
[translations]: https://www.contributor-covenant.org/translations
=======
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
[Security Policy](SECURITY.md) and report privately to **support@credifyfast.com**.
>>>>>>> 2f7be1fbe98762e0ed803377809f292517720734
