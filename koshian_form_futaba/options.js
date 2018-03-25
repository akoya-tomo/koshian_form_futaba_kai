
function safeGetValue(value, default_value) {
  return value === undefined ? default_value : value;
}

function saveOptions(e) {
  browser.storage.local.set({
    auto_scroll:document.getElementById("auto_scroll").checked
  });
}

function setCurrentChoice(result) {
  document.getElementById("auto_scroll").checked = safeGetValue(result.auto_scroll, true);
  document.getElementById("submit_button").addEventListener("click", saveOptions);
}

function onError(error) {
  //  console.log(`Error: ${error}`);
}

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get().then(setCurrentChoice, onError);
});