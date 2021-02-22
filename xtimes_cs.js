// xtimes_cs.js
// Content script is injected into matched pages

console.log("injected");

// Listen for pageAction click and return puzzle
browser.runtime.onMessage.addListener(request => {
  if (wrappedJSObject.oApp != null) {
    return Promise.resolve({data: wrappedJSObject.oApp.puzzle.JSON.data});
  }
});
