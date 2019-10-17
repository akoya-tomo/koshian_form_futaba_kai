/* eslint-disable no-unused-vars */
/* globals XMLHttpRequest, content */
/* globals DEFAULT_TIME_OUT, DEFAULT_AUTO_SCROLL, DEFAULT_USE_COMMENT_CLEAR, DEFAULT_USE_SAGE, DEFAULT_ERASE_CANVAS_JS, DEFAULT_USE_IMAGE_RESIZE, DEFAULT_EXPAND_FILE_INPUT */
/* globals DEFAULT_PREVIEW_MAX_SIZE, DEFAULT_DROPAREA_HEIGHT, DEFAULT_VIDEO_AUTOPLAY, DEFAULT_VIDEO_LOOP, DEFAULT_POPUP_FILE_DIALOG, DEFAULT_DROPAREA_BORDER, DEFAULT_DROPAREA_TEXT */
/* globals DEFAULT_OPEN_NEW_THREAD, INPUT_FILE_TEXT, DEFAULT_MAX_FILE_SIZE, EMOJI_RANGE */

const XMLHttpRequest = ( typeof content != 'undefined' && typeof content.XMLHttpRequest == 'function' ) ? content.XMLHttpRequest  : window.XMLHttpRequest;
const DEFAULT_TIME_OUT = 60 * 1000;
const DEFAULT_AUTO_SCROLL = true;
const DEFAULT_USE_COMMENT_CLEAR = true;
const DEFAULT_USE_SAGE = true;
const DEFAULT_ERASE_CANVAS_JS = false;
const DEFAULT_USE_IMAGE_RESIZE = false;
const DEFAULT_EXPAND_FILE_INPUT = false;
const DEFAULT_PREVIEW_MAX_SIZE = 250;
const DEFAULT_DROPAREA_HEIGHT = 0;
const DEFAULT_VIDEO_AUTOPLAY = true;
const DEFAULT_VIDEO_LOOP = true;
const DEFAULT_POPUP_FILE_DIALOG = false;
const DEFAULT_DROPAREA_BORDER = "2px #eeaa88 solid";
const DEFAULT_DROPAREA_TEXT = "ここにドロップ";
const DEFAULT_OPEN_NEW_THREAD = false;
const INPUT_FILE_TEXT = "ファイルが選択されていません。";
const DEFAULT_MAX_FILE_SIZE = 2048000;
const EMOJI_RANGE = [
    [0x180B, 0x180D],   // FVS
    [0x200D, ],         // Zero Width Joiner
    [0x203C, ],
    [0x2049, ],
    [0x20E3, ],         // 囲み文字
    [0x2122, ],
    [0x2139, ],
    [0x2194, 0x2199],
    [0x21A9, 0x21AA],
    [0x231A, 0x231B],
    [0x2328, ],
    [0x23CF, ],
    [0x23E9, 0x23F3],
    [0x23F8, 0x23FA],
    [0x24C2, ],
    [0x25AA, 0x25AB],
    [0x25B6, ],
    [0x25C0, ],
    [0x25FB, 0x25FE],
    [0x2600, 0x27BF],
    [0x2934, 0x2935],
    [0x2B05, 0x2B07],
    [0x2B1B, 0x2B1C],
    [0x2B50, ],
    [0x2B55, ],
    [0x3030, ],
    [0x303D, ],
    [0x3297, ],
    [0x3299, ],
    [0xFE00, 0xFE0F]    // VS1～VS16
];
