# Security Policy

## Supported Versions

Security fixes are applied to the latest released version of the extension on
the Chrome Web Store. Please make sure you are running the most recent version
before reporting.

| Version | Supported          |
| ------- | ------------------ |
| Latest (Chrome Web Store) | ✅ |
| Older / unpacked builds   | ❌ |

## Reporting a Vulnerability

We take the security and privacy of our users seriously. This extension is
designed to run **100% locally** with no data collection, but if you discover a
vulnerability, we want to hear about it.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report privately using one of the following:

1. **Email:** **support@credifyfast.com** with the subject line
   `SECURITY: Website Framework Detector`.
2. **GitHub Private Vulnerability Reporting:** use the **"Report a vulnerability"**
   button under the repository's **Security** tab (if enabled).

### What to include

To help us triage quickly, please include:

- A clear description of the vulnerability and its impact.
- Steps to reproduce (a proof of concept, affected URL, or sample page).
- The extension version and browser version.
- Any suggested remediation, if known.

### What to expect

- **Acknowledgement** of your report within **72 hours**.
- An assessment and, where valid, a remediation plan with a target timeline.
- Credit for the discovery once a fix is released (unless you prefer to remain
  anonymous).

### Scope

In scope:
- The extension code in this repository (popup, detectors, service worker).
- Any handling of page content or data that could leak user information.

Out of scope:
- Vulnerabilities in third-party websites being analyzed.
- Issues requiring a physically compromised device or a malicious browser build.
- Social engineering of the maintainers or users.

## Disclosure Policy

We follow **coordinated disclosure**: please give us a reasonable opportunity to
release a fix before any public disclosure. We will keep you informed throughout
the process. Thank you for helping keep users safe. 🔒