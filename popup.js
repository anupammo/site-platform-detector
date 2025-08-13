document.addEventListener('DOMContentLoaded', function() {
  const detectBtn = document.getElementById('detectBtn');
  const currentUrl = document.getElementById('currentUrl');
  const resultContainer = document.getElementById('resultContainer');
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const resultIcon = document.getElementById('resultIcon');
  const loading = document.getElementById('loading');
  const confidenceLevel = document.getElementById('confidenceLevel');
  const confidenceValue = document.getElementById('confidenceValue');
  
  // Get current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length > 0) {
      const url = new URL(tabs[0].url);
      currentUrl.textContent = url.hostname;
    }
  });
  
  
  // Detect framework button click
  detectBtn.addEventListener('click', function() {
    // Show loading, hide results
    loading.style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Send message to content script to detect framework
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        let didRespond = false;
        chrome.tabs.sendMessage(tabs[0].id, {action: "detectFramework"}, function(response) {
          didRespond = true;
          if (chrome.runtime.lastError) {
            // Show friendly error if content script is not available or port closed
            resultTitle.textContent = "Detection Failed";
            resultSubtitle.textContent = "Could not connect to page. This may be a browser page, unsupported tab, or the message port closed before a response was received.";
            resultIcon.className = "result-icon fas fa-exclamation-triangle";
            confidenceLevel.style.width = "0%";
            confidenceValue.textContent = "0%";
            loading.style.display = 'none';
            resultContainer.style.display = 'block';
            return;
          }
          if (response) {
            displayResults(response);
          } else {
            displayError();
          }
        });
        // Fallback in case callback is never called
        setTimeout(function() {
          if (!didRespond) {
            resultTitle.textContent = "Detection Failed";
            resultSubtitle.textContent = "No response from page. This may be a browser page, unsupported tab, or the message port closed before a response was received.";
            resultIcon.className = "result-icon fas fa-exclamation-triangle";
            confidenceLevel.style.width = "0%";
            confidenceValue.textContent = "0%";
            loading.style.display = 'none';
            resultContainer.style.display = 'block';
          }
        }, 1500);
      }
    });
  });
  
  // Display results
  function displayResults(data) {
    resultTitle.textContent = data.framework;
    resultTitle.className = `result-title ${data.colorClass}`;
    resultSubtitle.textContent = data.subtitle;
    resultIcon.className = `result-icon ${data.iconClass} ${data.colorClass}`;
    
    // Update confidence meter
    confidenceLevel.style.width = `${data.confidence}%`;
    confidenceValue.textContent = `${data.confidence}%`;
    
    
    // Add more details
    
    // Show results
    loading.style.display = 'none';
    resultContainer.style.display = 'block';
  }
  
  // Display error
  function displayError() {
    resultTitle.textContent = "Detection Failed";
    resultSubtitle.textContent = "Could not analyze this page";
    resultIcon.className = "result-icon fas fa-exclamation-triangle";
    confidenceLevel.style.width = "0%";
    confidenceValue.textContent = "0%";
    
    
    loading.style.display = 'none';
    resultContainer.style.display = 'block';
  }
});
