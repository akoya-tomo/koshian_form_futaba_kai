/* eslint-disable no-unused-vars */
/* globals XMLHttpRequest, content */
/* globals DEFAULT_TIME_OUT, DEFAULT_AUTO_SCROLL, DEFAULT_USE_COMMENT_CLEAR, DEFAULT_USE_SAGE, DEFAULT_EXPAND_FILE_INPUT, DEFAULT_PREVIEW_MAX_SIZE, DEFAULT_DROPAREA_HEIGHT */
/* globals DEFAULT_VIDEO_AUTOPLAY, DEFAULT_VIDEO_LOOP, DEFAULT_POPUP_FILE_DIALOG, DEFAULT_DROPAREA_BORDER, DEFAULT_DROPAREA_TEXT, INPUT_FILE_TEXT */

const XMLHttpRequest = ( typeof content != 'undefined' && typeof content.XMLHttpRequest == 'function' ) ? content.XMLHttpRequest  : window.XMLHttpRequest;
const DEFAULT_TIME_OUT = 60 * 1000;
const DEFAULT_AUTO_SCROLL = true;
const DEFAULT_USE_COMMENT_CLEAR = true;
const DEFAULT_USE_SAGE = true;
const DEFAULT_EXPAND_FILE_INPUT = false;
const DEFAULT_PREVIEW_MAX_SIZE = 250;
const DEFAULT_DROPAREA_HEIGHT = 0;
const DEFAULT_VIDEO_AUTOPLAY = true;
const DEFAULT_VIDEO_LOOP = true;
const DEFAULT_POPUP_FILE_DIALOG = false;
const DEFAULT_DROPAREA_BORDER = "2px #eeaa88 solid";
const DEFAULT_DROPAREA_TEXT = "ここにドロップ";
const INPUT_FILE_TEXT = "ファイルが選択されていません。";