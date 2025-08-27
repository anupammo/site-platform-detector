# Chrome Extension Permissions

This extension requires the following permissions to function properly:

## Required Permissions

### 1. activeTab
- **Purpose**: Grants access to the currently active tab when the user interacts with the extension
- **Usage**: Allows the popup to query the current tab and send messages to content scripts
- **API calls**: `chrome.tabs.query()`, `chrome.tabs.sendMessage()`

### 2. scripting  
- **Purpose**: Allows the extension to inject and execute scripts programmatically
- **Usage**: Enables content script injection and execution
- **API calls**: Content script injection and messaging

### 3. host_permissions: ["*://*/*"]
- **Purpose**: Required for content scripts to run on all HTTP/HTTPS websites
- **Usage**: Enables content scripts with `<all_urls>` pattern to function properly
- **Scope**: All HTTP and HTTPS websites (excludes chrome://, file://, etc.)

## Why Host Permissions Are Required

In Chrome Manifest V3, content scripts that use broad host patterns like `<all_urls>` require explicit host permissions. The `activeTab` permission alone is insufficient for declarative content scripts.

**Without host permissions:**
- Content scripts may fail to inject on many websites
- Framework detection would not work reliably
- Users would see permission errors in the console

**With host permissions:**
- Content scripts can run on all supported websites
- Framework detection works consistently
- Better user experience with reliable functionality

## Privacy Considerations

The extension only analyzes publicly available webpage content (HTML, scripts, stylesheets) to detect frameworks. It does not:
- Collect or store personal information
- Send data to external servers  
- Access sensitive user data
- Monitor browsing behavior

All detection happens locally in the user's browser.