// Background service-worker bootstrap for extension lifecycle events.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Spam Detector Assistant installed.");
});
