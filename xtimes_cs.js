// xtimes_cs.js
// Content script is injected into matched pages

if ( document.getElementById("puzzleiframe") != null ) {
  let oApp = document.getElementById("puzzleiframe").contentWindow.wrappedJSObject.oApp;
  browser.runtime.sendMessage({"data": oApp.puzzle.JSON.data});
}
