chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detach') {
    chrome.windows.create({
      url: chrome.runtime.getURL("index.html?detached=true"),
      type: "popup",
      width: 400,
      height: 600
    }).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for the async response
  }
});
