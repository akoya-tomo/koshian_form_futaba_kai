/* globals XMLHttpRequest */
/* globals SCRIPT_NAME */   //eslint-disable-line no-unused-vars
/* globals DEFAULT_TIME_OUT, DEFAULT_AUTO_SCROLL, DEFAULT_USE_COMMENT_CLEAR, DEFAULT_USE_SAGE, DEFAULT_ERASE_CANVAS_JS, DEFAULT_USE_IMAGE_RESIZE, DEFAULT_EXPAND_FILE_INPUT */
/* globals DEFAULT_PREVIEW_MAX_SIZE, DEFAULT_DROPAREA_HEIGHT, DEFAULT_VIDEO_AUTOPLAY, DEFAULT_VIDEO_LOOP, DEFAULT_POPUP_FILE_DIALOG, DEFAULT_DROPAREA_BORDER, DEFAULT_DROPAREA_TEXT */
/* globals DEFAULT_MAX_FILE_SIZE */
/* globals use_comment_clear, usa_sage, use_image_resize, expand_file_input, preview_max_size, video_autolay, video_loop, popup_file_dialog, droparea_text */    //eslint-disable-line no-unused-vars
/* globals 
    createBoundary,
    convertUnicode2Buffer,
    appendBuffer,
    makeCommentClearButton,
    makeSageButton,
    setFormFileInput,
    clearFile
*/

const SCRIPT_NAME = "KOSHIAN_form/res.js";
let time_out = DEFAULT_TIME_OUT;
let auto_scroll = DEFAULT_AUTO_SCROLL;
let use_comment_clear = DEFAULT_USE_COMMENT_CLEAR;  //eslint-disable-line no-unused-vars
let use_sage = DEFAULT_USE_SAGE;    //eslint-disable-line no-unused-vars
let erase_canvas_js = DEFAULT_ERASE_CANVAS_JS;
let use_image_resize = DEFAULT_USE_IMAGE_RESIZE;    //eslint-disable-line no-unused-vars
let expand_file_input = DEFAULT_EXPAND_FILE_INPUT;  //eslint-disable-line no-unused-vars
let preview_max_size = DEFAULT_PREVIEW_MAX_SIZE;
let droparea_height = DEFAULT_DROPAREA_HEIGHT;
let video_autoplay = DEFAULT_VIDEO_AUTOPLAY;    //eslint-disable-line no-unused-vars
let video_loop = DEFAULT_VIDEO_LOOP;    //eslint-disable-line no-unused-vars
let popup_file_dialog = DEFAULT_POPUP_FILE_DIALOG;  //eslint-disable-line no-unused-vars
let droparea_text = DEFAULT_DROPAREA_TEXT;

class Notify {
    constructor() {
        this.thre = document.getElementsByClassName("thre")[0];

        if (Notify.hasNotify()) {
            this.notify = document.getElementById("KOSHIAN_NOTIFY");
            this.text = (function (parent) {
                for (let node = parent.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType == Node.TEXT_NODE) {
                        return node;
                    }
                }

                return parent.appendChild(document.createTextNode(""));
            })(this.notify);

            this.separator = this.notify.getElementsByTagName("hr");
        } else {
            this.notify = document.createElement("span");
            this.text = document.createTextNode("");
            this.separator = document.createElement("hr");

            this.notify.id = "KOSHIAN_NOTIFY";
            this.notify.appendChild(this.separator);
            this.notify.appendChild(this.text);
            document.body.appendChild(this.notify);

            this.moveTo();
        }
    }

    setText(text) {
        this.text.textContent = text;
        this.notify.style.color = "";
        this.notify.style.fontWeight = "";
    }

    setAlertText(text) {
        this.text.textContent = text;
        this.notify.style.color = "red";
        this.notify.style.fontWeight = "bold";
    }

    moveTo(target = null) {
        if (target) {
            this.thre.insertBefore(this.notify, target.nextElementSibling);
        } else {
            this.thre.appendChild(this.notify);
        }
    }

    static hasNotify() {
        return document.getElementById("KOSHIAN_NOTIFY");
    }
}

class Form {
    constructor() {
        this.notify = new Notify();
        this.dom = null;
        this.textarea = null;
        this.loading = false;
        this.boundary = null;
        this.buffer = null;
        this.file = {
            dom : null,
            obj : null,
            reader : null,
            buffer : null,
            name : null,
            size : null,
            type : null,
            loading : false,
            max_size : DEFAULT_MAX_FILE_SIZE
        };
    }

    submit() {
        if (this.loading) {
            return;
        }

        // ファイルの読み込みが完了していないときは実行を遅延
        if (this.file.dom && !this.file.buffer && this.file.dom.files.length > 0) {
            if (this.file.reader.readyState === FileReader.LOADING) {
                setTimeout(this.submit.bind(this), 10);
            } else {
                this.notify.setAlertText("添付ファイルの読み込みに失敗しました。もう一度ファイルを選択し直してください");
                fixFormPosition();
            }
            return;
        }

        this.loading = true;
        this.buffer = new Uint8Array();

        let xhr = new XMLHttpRequest();
        xhr.timeout = time_out;
        xhr.addEventListener("load", () => { this.onResponseLoad(xhr); });
        xhr.addEventListener("error", () => { this.onError(); });
        xhr.addEventListener("timeout", () => { this.onTimeout(); });
        xhr.open("POST", this.dom.action);
        this.boundary = createBoundary();
        xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + this.boundary);

        // フォーム内の要素からマルチパートフォームデータ作成
        for (let elm of this.dom.elements) {
            if (elm.name) {
                if (elm.type == "file") {
                    // ファイル
                    this.setFile(elm.name);
                } else if (elm.type != "checkbox" || elm.checked) {
                    // パラメータ
                    this.setParam(elm.name, elm.value);
                }
            }
        }

        // 送信モード
        this.setParam("responsemode", "ajax");

        // フッタ
        this.buffer = appendBuffer(this.buffer, 
            convertUnicode2Buffer("UTF8",
                "--" + this.boundary + "--"
            )
        );

        xhr.send(this.buffer);
        this.notify.moveTo();
        this.notify.setText("返信中……");
    }

    setFile(name) {
        let filename = this.file.name ? `file.${this.file.type.split("/")[1]}` : "";    // UTF8固定なのでファイル名はASCIIのみ
        let type = this.file.type || "application/octet-stream";
        let buffer = convertUnicode2Buffer("UTF8",
            "--" + this.boundary + "\r\n" +
            `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n` +
            `Content-Type: ${type}\r\n` +
            "\r\n"
        );
        if (this.file.buffer) {
            buffer = appendBuffer(buffer, this.file.buffer);
        }
        buffer = appendBuffer(buffer, convertUnicode2Buffer("UTF8", "\r\n"));
        this.buffer = appendBuffer(this.buffer, buffer);
    }

    setParam(name, value) {
        let buffer = convertUnicode2Buffer("UTF8",
            "--" + this.boundary + "\r\n" +
            `Content-Disposition: form-data; name="${name}"\r\n` +
            "\r\n"
        );
        let utf8_buffer = convertUnicode2Buffer("UTF8", value);
        buffer = appendBuffer(buffer, utf8_buffer);
        buffer = appendBuffer(buffer, convertUnicode2Buffer("UTF8", "\r\n"));
        this.buffer = appendBuffer(this.buffer, buffer);
    }

    onResponseLoad(xhr){
        this.buffer = null;
        try{
            switch(xhr.status){
                case 200:
                    if (this.isSuccess(xhr.response)) {
                        this.reload();
                    } else {
                        this.onResponseError(xhr.response);
                    }
                    break;
                default:
                    this.notify.setText("返信結果取得失敗");
                    this.loading = false;
                    fixFormPosition();
            }
        } catch(e) {
            this.notify.setText("返信結果取得失敗");
            console.error(SCRIPT_NAME + " - onResponseLoad error:");
            console.dir(e);
            this.loading = false;
            fixFormPosition();
        }
    }

    isSuccess(res) {
        return res == "ok";
    }

    onResponseError(res) {
        let text = res;
        if (res.match(/<html[> ]|<body[> ]/i)) {
            text = res.match(/<title(?:| [^>]*)>(.*?)<\/title(?:| [^>]*)>/i)[1];
        }
        if (!text) {
            console.debug(SCRIPT_NAME + " - onResponse error: " + res);
            text = "返信処理でエラーが発生しました";
        }
        this.notify.setAlertText(text);
        this.loading = false;
        fixFormPosition();
    }

    reload() {
        let xhr = new XMLHttpRequest();
        xhr.responseType = "document";
        xhr.timeout = time_out;
        xhr.addEventListener("load", () => { this.onBodyLoad(xhr); });
        xhr.addEventListener("error", () => { this.onError(); });
        xhr.addEventListener("timeout", () => { this.onTimeout(); });
        xhr.open("GET", location.href);
        xhr.send();
        this.notify.setText("返信完了。スレ更新中……");
    }

    onBodyLoad(xhr){
        try{
            switch(xhr.status){
                case 200:
                    this.addNewResponses(xhr.responseXML);
                    break;
                case 404:
                    this.notify.setAlertText("スレは落ちています CODE:404");
                    document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                    break;
                default:
                    this.notify.setAlertText(`スレ更新失敗 CODE:${xhr.status} 返信は成功している可能性があります`);
            }
        } catch(e) {
            this.notify.setAlertText(`スレ更新失敗 CODE:${xhr.status} 返信は成功している可能性があります`);
            console.error(SCRIPT_NAME + " onBodyLoad error:");
            console.dir(e);
        }

        this.loading = false;
        fixFormPosition();
    }

    addNewResponses(new_document){
        // テキストクリア
        this.textarea.value = "";
        // 添付ファイルクリア
        let clear_button = document.getElementById("KOSHIAN_form_clear_button") || document.getElementById("ffip_file_clear");
        if (clear_button) {
            clear_button.click();
        } else if (this.file.dom) {
            clearFile(this.file);
        }
        // 手書きフォームデータクリア
        let baseform = document.getElementById("baseform");
        if (baseform) {
            // base4ajax.jsの動作に合わせる
            baseform.value = "";
        }
        // 手書きを閉じて文字入力に戻す
        let oebtnjm = document.getElementById("oebtnjm");   // 手書きjsモードの「文字入力」ボタン
        let oebtnfm = document.getElementById("oebtnfm");   // 手書き(flash)モードの「文字入力」ボタン
        if (oebtnjm && oebtnjm.style.display !== "none") {
            oebtnjm.click();
        } else if (oebtnfm && oebtnfm.style.display !== "none") {
            oebtnfm.click();
        }
        // 手書きjsのキャンバスを消去
        let oejs = document.getElementById("oejs");
        if (oejs && erase_canvas_js) {
            let oejs = document.getElementById("oejs");
            let ctx = oejs.getContext('2d');
            ctx.fillStyle = "#f0e0d6";
            ctx.fillRect(0, 0, oejs.width, oejs.height);
        }

        if (!new_document) {
            this.notify.setAlertText("スレ更新失敗。スレが空です。返信は成功している可能性があります");
            return;
        }

        let thre = document.getElementsByClassName("thre")[0];
        let new_thre = new_document.getElementsByClassName("thre")[0];
        if (!thre || !new_thre) {
            this.notify.setAlertText("スレ更新失敗。スレがありません。返信は成功している可能性があります");
            return;
        }

        let responses = thre.getElementsByTagName("table");
        let new_responses = new_thre.getElementsByTagName("table");
        let res_num = responses ? responses.length : 0;
        let new_res_num = new_responses ? new_responses.length : 0;

        // 削除されたレスの表示設定を取得
        let ddbut = document.getElementById("ddbut");
        let is_ddbut_shown = ddbut ? ddbut.textContent == "隠す" : false;

        // スクロール位置を保存
        let sy = document.documentElement.scrollTop;

        if (res_num == new_res_num) {
            //
        } else if (new_res_num == 0) {
            //
        } else {
            let fragment = document.createDocumentFragment();
            for (let i = res_num; i < new_res_num; ++i) {
                let inserted = fragment.appendChild(new_responses[res_num]);
                // 削除された新着レスへ削除レス表示設定を反映
                if (inserted.className == "deleted") {
                    inserted.style.display = is_ddbut_shown ? "table" : "none";
                }
            }
            thre.appendChild(fragment);
    
            this.notify.setText(`新着レス${new_res_num - res_num}`);
            fixFormPosition();

            if (auto_scroll && responses.length > res_num) {
                let ch = document.documentElement.clientHeight;
                let rect = responses[res_num].getBoundingClientRect();
                let to = rect.top + sy - ch / 2;
                document.documentElement.scrollTo(document.documentElement.scrollLeft, to);
            } else {
                // スクロール位置を新着レス挿入前に戻す(Fx66+ スクロールアンカー対策)
                document.documentElement.scrollTop = sy;
            }

            document.dispatchEvent(new CustomEvent("KOSHIAN_reload"));
        }
    }

    onError() {
        this.loading = false;
        this.buffer = null;
        this.notify.setAlertText("通信失敗");
        fixFormPosition();
    }

    onTimeout() {
        this.loading = false;
        this.buffer = null;
        this.notify.setAlertText("接続がタイムアウトしました");
        fixFormPosition();
    }

}

function fixFormPosition() {
    document.dispatchEvent(new CustomEvent("KOSHIAN_form_loaded"));

    let form = document.getElementById("ftbl");
    let uform = document.getElementById("ufm");

    if (!form || !uform) {
        return;
    }

    if (form.style.position != "absolute") {
        return;
    }

    let rect = uform.getBoundingClientRect();
    let top = rect.y + document.documentElement.scrollTop;
    form.style.top = `${top}px`;
}

function main() {
    let ftbl = document.getElementById("ftbl");
    if (!ftbl) {
        return;
    }

    let form = new Form();

    form.dom = document.getElementById("fm") || ftbl.parentElement;
    if (!form.dom) {
        return;
    }
    form.dom.id = "KOSHIAN_fm"; // base4ajax.jsからの送信を抑制

    form.textarea = form.dom.getElementsByTagName("textarea")[0];
    if (!form.textarea) {
        return;
    }

    form.dom.onsubmit = (e) => {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("KOSHIAN_form_submit"));
        form.submit();
    };

    makeCommentClearButton(form.textarea);
    makeSageButton(form.dom);
    setFormFileInput(form);
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

function onError(error) {   //eslint-disable-line no-unused-vars
}

function onSettingGot(result) {
    auto_scroll = safeGetValue(result.auto_scroll, DEFAULT_AUTO_SCROLL);
    use_comment_clear = safeGetValue(result.use_comment_clear, DEFAULT_USE_COMMENT_CLEAR);
    use_sage = safeGetValue(result.use_sage, DEFAULT_USE_SAGE);
    erase_canvas_js = safeGetValue(result.erase_canvas_js, DEFAULT_ERASE_CANVAS_JS);
    use_image_resize = safeGetValue(result.use_image_resize, DEFAULT_USE_IMAGE_RESIZE);
    expand_file_input = safeGetValue(result.expand_file_input, DEFAULT_EXPAND_FILE_INPUT);
    preview_max_size = safeGetValue(result.preview_max_size, DEFAULT_PREVIEW_MAX_SIZE);
    droparea_height = safeGetValue(result.droparea_height, DEFAULT_DROPAREA_HEIGHT);
    video_autoplay = safeGetValue(result.video_autoplay, DEFAULT_VIDEO_AUTOPLAY);
    video_loop = safeGetValue(result.video_loop, DEFAULT_VIDEO_LOOP);
    popup_file_dialog = safeGetValue(result.popup_file_dialog, DEFAULT_POPUP_FILE_DIALOG);

    droparea_text = DEFAULT_DROPAREA_TEXT;
    if (droparea_height < 12) {
        droparea_text = "";
    }
    let droparea_border = DEFAULT_DROPAREA_BORDER;
    if (droparea_height == 0) {
        droparea_border = "none";
    }

    document.documentElement.style.setProperty("--preview-max-size", preview_max_size + "px");
    document.documentElement.style.setProperty("--droparea-height", droparea_height + "px");
    document.documentElement.style.setProperty("--droparea-border", droparea_border);

    main();
}

function onSettingChanged(changes, areaName) {
    if (areaName != "local") {
        return;
    }

    auto_scroll = safeGetValue(changes.auto_scroll.newValue, true);
    use_comment_clear = safeGetValue(changes.use_comment_clear.newValue, DEFAULT_USE_COMMENT_CLEAR);
    use_sage = safeGetValue(changes.use_sage.newValue, DEFAULT_USE_SAGE);
    erase_canvas_js = safeGetValue(changes.erase_canvas_js.newValue, DEFAULT_ERASE_CANVAS_JS);
    use_image_resize = safeGetValue(changes.use_image_resize.newValue, DEFAULT_USE_IMAGE_RESIZE);
    expand_file_input = safeGetValue(changes.expand_file_input.newValue, DEFAULT_EXPAND_FILE_INPUT);
    preview_max_size = safeGetValue(changes.preview_max_size.newValue, DEFAULT_PREVIEW_MAX_SIZE);
    droparea_height = safeGetValue(changes.droparea_height.newValue, DEFAULT_DROPAREA_HEIGHT);
    video_autoplay = safeGetValue(changes.video_autoplay.newValue, DEFAULT_VIDEO_AUTOPLAY);
    video_loop = safeGetValue(changes.video_loop.newValue, DEFAULT_VIDEO_LOOP);
    popup_file_dialog = safeGetValue(changes.popup_file_dialog.newValue, DEFAULT_POPUP_FILE_DIALOG);

    droparea_text = DEFAULT_DROPAREA_TEXT;
    if (droparea_height < 12) {
        droparea_text = "";
    }
    let droparea_border = DEFAULT_DROPAREA_BORDER;
    if (droparea_height == 0) {
        droparea_border = "none";
    }

    document.documentElement.style.setProperty("--preview-max-size", preview_max_size + "px");
    document.documentElement.style.setProperty("--droparea-height", droparea_height + "px");
    document.documentElement.style.setProperty("--droparea-border", droparea_border);

    let form = document.getElementById("KOSHIAN_fm");
    if (form) {
        let textarea = form.getElementsByTagName("textarea")[0];
        if (textarea) {
            makeCommentClearButton(textarea);
        }
        makeSageButton(form);
    }
    let droparea = document.getElementById("KOSHIAN_form_preview");
    if (droparea && droparea.className == "KOSHIAN-form-droparea") {
        droparea.textContent = droparea_text;
    }
}

browser.storage.local.get().then(onSettingGot, onError);
browser.storage.onChanged.addListener(onSettingChanged);
