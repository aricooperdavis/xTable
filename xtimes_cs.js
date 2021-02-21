// xtimes_cs.js
// Content script is injected into matched pages

// Get puzzle data if available
let oApp = wrappedJSObject.oApp;
let message = null;

if (oApp != null){
  message = wrappedJSObject.oApp.puzzle.JSON.data;
}

// Listen for pageAction click and return puzzle
browser.runtime.onMessage.addListener(request => {
  return Promise.resolve({data: message});
});
