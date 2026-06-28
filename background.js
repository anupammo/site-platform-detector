// Service worker — lifecycle only.
// On first install, open the product/onboarding page (drives traffic + helps
// users understand the extension). We intentionally do NOT force-open a tab on
// every update — that annoys users and hurts ratings. A subtle "What's new"
// hint lives in the popup instead.
const PRODUCT_URL = 'https://anupammondal.in/chrome-extension/website-framework-detector';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: PRODUCT_URL });
  }
});
