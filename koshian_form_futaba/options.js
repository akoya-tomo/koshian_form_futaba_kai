const DEFAULT_AUTO_SCROLL = true;
const DEFAULT_USE_COMMENT_CLEAR = true;
const DEFAULT_USE_SAGE = true;
const DEFAULT_EXPAND_FILE_INPUT = false;
const DEFAULT_PREVIEW_MAX_SIZE = 250;
const DEFAULT_DROPAREA_HEIGHT = 0;
const DEFAULT_VIDEO_AUTOPLAY = true;
const DEFAULT_VIDEO_LOOP = true;
const DEFAULT_POPUP_FILE_DIALOG = false;
const DEFAULT_OPEN_NEW_THREAD = false;

function setDisable() {
  if (document.getElementById("expand_file_input").checked) {
    document.getElementById("preview_max_size").disabled = false;
    document.getElementById("droparea_height").disabled = false;
    document.getElementById("video_autoplay").disabled = false;
    document.getElementById("video_loop").disabled = !document.getElementById("video_autoplay").checked;
    document.getElementById("popup_file_dialog").disabled = false;
  } else {
    document.getElementById("preview_max_size").disabled = true;
    document.getElementById("droparea_height").disabled = true;
    document.getElementById("video_autoplay").disabled = true;
    document.getElementById("video_loop").disabled = true;
    document.getElementById("popup_file_dialog").disabled = true;
  }
  if (!document.getElementById("video_autoplay").checked) document.getElementById("video_loop").checked = false;
}

function safeGetValue(value, default_value) {
  return value === undefined ? default_value : value;
}

function saveOptions(e) {
  browser.storage.local.set({
    auto_scroll: document.getElementById("auto_scroll").checked,
    use_comment_clear: document.getElementById("use_comment_clear").checked,
    use_sage: document.getElementById("use_sage").checked,
    expand_file_input: document.getElementById("expand_file_input").checked,
    preview_max_size: document.getElementById("preview_max_size").value,
    droparea_height: document.getElementById("droparea_height").value,
    video_autoplay: document.getElementById("video_autoplay").checked,
    video_loop: document.getElementById("video_loop").checked,
    popup_file_dialog: document.getElementById("popup_file_dialog").checked,
    open_new_thread: document.getElementById("open_new_thread").checked
  });
}

function setCurrentChoice(result) {
  document.getElementById("auto_scroll").checked = safeGetValue(result.auto_scroll, DEFAULT_AUTO_SCROLL);
  document.getElementById("use_comment_clear").checked = safeGetValue(result.use_comment_clear, DEFAULT_USE_COMMENT_CLEAR);
  document.getElementById("use_sage").checked = safeGetValue(result.use_sage, DEFAULT_USE_SAGE);
  document.getElementById("expand_file_input").checked = safeGetValue(result.expand_file_input, DEFAULT_EXPAND_FILE_INPUT);
  document.getElementById("preview_max_size").value = safeGetValue(result.preview_max_size, DEFAULT_PREVIEW_MAX_SIZE);
  document.getElementById("droparea_height").value = safeGetValue(result.droparea_height, DEFAULT_DROPAREA_HEIGHT);
  document.getElementById("video_autoplay").checked = safeGetValue(result.video_autoplay, DEFAULT_VIDEO_AUTOPLAY);
  document.getElementById("video_loop").checked = safeGetValue(result.video_loop, DEFAULT_VIDEO_LOOP);
  document.getElementById("popup_file_dialog").checked = safeGetValue(result.popup_file_dialog, DEFAULT_POPUP_FILE_DIALOG);
  document.getElementById("open_new_thread").checked = safeGetValue(result.open_new_thread, DEFAULT_OPEN_NEW_THREAD);
  document.getElementById("submit_button").addEventListener("click", saveOptions);

  setDisable();

  let input_list = document.getElementsByTagName("input");
  for (let input of input_list) {
    input.onchange = setDisable;
  }
}

function onError(error) {
  //  console.log(`Error: ${error}`);
}

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get().then(setCurrentChoice, onError);
});