document.addEventListener('DOMContentLoaded', function() {
  const detectBtn = document.getElementById('detectBtn');
  const currentUrl = document.getElementById('currentUrl');
  const resultContainer = document.getElementById('resultContainer');
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const resultIcon = document.getElementById('resultIcon');
  const detectionDetails = document.getElementById('detectionDetails');
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
  
  // Add detail message
  function addDetail(message) {
    const li = document.createElement('li');
    li.textContent = message;
    detectionDetails.appendChild(li);
  }
  
  // Detect framework button click
  detectBtn.addEventListener('click', function() {
    // Show loading, hide results
    loading.style.display = 'block';
    resultContainer.style.display = 'none';
    detectionDetails.innerHTML = '';
    
    // Send message to content script to detect framework
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "detectFramework"}, function(response) {
          if (response) {
            displayResults(response);
          } else {
            displayError();
          }
        });
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
    
    // Add detection details
    data.details.forEach(detail => {
      addDetail(detail);
    });
    
    // Add more details
    addDetail(`Analyzed ${data.elementsAnalyzed} page elements`);
    addDetail(`Scanned ${data.scriptsFound} scripts`);
    addDetail(`Checked ${data.metaTags} meta tags`);
    
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
    
    addDetail("Error: Could not access page content");
    addDetail("Please try again or visit a different page");
    
    loading.style.display = 'none';
    resultContainer.style.display = 'block';
  }
});
