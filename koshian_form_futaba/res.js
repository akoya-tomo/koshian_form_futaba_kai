/* globals XMLHttpRequest */
/* globals DEFAULT_TIME_OUT, DEFAULT_AUTO_SCROLL, DEFAULT_USE_COMMENT_CLEAR, DEFAULT_USE_SAGE, DEFAULT_EXPAND_FILE_INPUT, DEFAULT_PREVIEW_MAX_SIZE, DEFAULT_DROPAREA_HEIGHT */
/* globals DEFAULT_VIDEO_AUTOPLAY, DEFAULT_VIDEO_LOOP, DEFAULT_POPUP_FILE_DIALOG, DEFAULT_DROPAREA_BORDER, DEFAULT_DROPAREA_TEXT */
/* globals use_comment_clear, usa_sage, video_autolay, video_loop */    //eslint-disable-line no-unused-vars
/* globals 
    createBoundary,
    convertUnicode2Buffer,
    appendBuffer,
    makeCommentClearButton,
    makeSageButton,
    initInputButton,
    makeInputButton,
    clearFile,
    previewFile,
    convertDataURI2Buffer
*/

let time_out = DEFAULT_TIME_OUT;
let auto_scroll = DEFAULT_AUTO_SCROLL;
let use_comment_clear = DEFAULT_USE_COMMENT_CLEAR;  //eslint-disable-line no-unused-vars
let use_sage = DEFAULT_USE_SAGE;    //eslint-disable-line no-unused-vars
let expand_file_input = DEFAULT_EXPAND_FILE_INPUT;
let preview_max_size = DEFAULT_PREVIEW_MAX_SIZE;
let droparea_height = DEFAULT_DROPAREA_HEIGHT;
let video_autoplay = DEFAULT_VIDEO_AUTOPLAY;    //eslint-disable-line no-unused-vars
let video_loop = DEFAULT_VIDEO_LOOP;    //eslint-disable-line no-unused-vars
let popup_file_dialog = DEFAULT_POPUP_FILE_DIALOG;
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

            this.moveTo(10000);
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

    moveTo(index) {
        let tables = this.thre.getElementsByTagName("table");

        if (tables.length == 0 || index == -1) { // 0レス
            let blockquotes = this.thre.getElementsByTagName("blockquote");
            this.thre.insertBefore(this.notify, blockquotes[0].nextElementSibling);
        } else {
            index = Math.min(index, tables.length - 1);
            this.thre.insertBefore(this.notify, tables[index].nextElementSibling);
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
            type : null
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
                if (elm.tagName == "TEXTAREA" || elm.type == "text" || elm.name == "chrenc") {
                    // テキスト
                    this.setText(elm.name, elm.value);
                } else if (elm.type == "file") {
                    // ファイル
                    this.setFile(elm.name);
                } else if (elm.type != "checkbox" || elm.checked) {
                    // パラメータ
                    this.setParam(elm.name, elm.value);
                }
            }
        }

        // フッタ
        this.buffer = appendBuffer(this.buffer, 
            convertUnicode2Buffer("UTF8",
                "--" + this.boundary + "--"
            )
        );

        xhr.send(this.buffer);
        this.notify.moveTo(10000);
        this.notify.setText("返信中……");
    }

    setText(name, value) {
        let buffer = convertUnicode2Buffer("UTF8", 
            "--" + this.boundary + "\r\n" +
            `Content-Disposition: form-data; name="${name}"\r\n` +
            "Content-Type: text/plain; charset=Shift_JIS\r\n" +
            "\r\n"
        );
        let sjis_buffer = convertUnicode2Buffer("Shift_JIS", value);
        buffer = appendBuffer(buffer, sjis_buffer);
        buffer = appendBuffer(buffer, convertUnicode2Buffer("UTF8", "\r\n"));
        this.buffer = appendBuffer(this.buffer, buffer);
    }

    setFile(name) {
        let filename = this.file.name ? "filename" : "";
        let type = this.file.type ? this.file.type : "application/octet-stream";
        let buffer = convertUnicode2Buffer("UTF8",
            "--" + this.boundary + "\r\n" +
            `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n` +
            `Content-Type: ${type}\r\n` +
            "\r\n"
        );
        if (this.file.buffer) buffer = appendBuffer(buffer, this.file.buffer);
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
              case 200:  // eslint-disable-line indent
                if (this.isSuccess(xhr.response)) {
                    this.reload();
                } else {
                    this.onResponseError(xhr.response);
                }
                break;
              default:  // eslint-disable-line indent
                this.notify.setText("返信結果取得失敗");
                this.loading = false;
                fixFormPosition();
            }
        }catch(e){
            this.notify.setText("返信結果取得失敗");
            console.error("KOSHIAN_form/res.js - onResponseLoad error: " + e);  // eslint-disable-line no-console
            this.loading = false;
            fixFormPosition();
        }
    }

    isSuccess(res) {
        let success_mes = /スレッド.+に切り替えます/;
        return success_mes.test(res);
    }

    onResponseError(res) {
        let error_mes = /<font color=red size=5><b>(.+?)<br><br>/;
        let mes = error_mes.exec(res);  // res内のエラーメッセージを取得
        let text;
        if (mes) {
            text = mes[1].replace(/<br>/ig, "。");    // mes内の<br>を。に置換
        } else {
            console.error("KOSHIAN_form/res.js - onResponse error: " + res);  // eslint-disable-line no-console
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
              case 200:  // eslint-disable-line indent
                this.addNewResponses(xhr.responseXML);
                break;
              case 404:  // eslint-disable-line indent
                this.notify.setAlertText("スレは落ちています CODE:404");
                document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                break;
              default:  // eslint-disable-line indent
                this.notify.setAlertText(`スレ更新失敗 CODE:${xhr.status} 返信は成功している可能性があります`);
            }
        }catch(e){
            this.notify.setAlertText(`スレ更新失敗 CODE:${xhr.status} 返信は成功している可能性があります`);
            console.error("KOSHIAN_form/res.js onBodyLoad error: " + e);  // eslint-disable-line no-console
        }

        this.loading = false;
        fixFormPosition();
    }

    addNewResponses(new_document){
        this.textarea.value = "";
        let clear_button = document.getElementById("KOSHIAN_form_clear_button") || document.getElementById("ffip_file_clear");
        if (clear_button) {
            clear_button.click();
        } else if (this.file.dom) {
            clearFile(this.file);
        }

        if(!new_document){
            this.notify.setAlertText("スレ更新失敗。スレが空です。返信は成功している可能性があります");
            return;
        }

        let thre = document.getElementsByClassName("thre")[0];
        let new_thre = new_document.getElementsByClassName("thre")[0];
        if(!thre || !new_thre){
            this.notify.setAlertText("スレ更新失敗。スレがありません。返信は成功している可能性があります");
            return;
        }

        let responses = thre.getElementsByTagName("table");
        let new_responses = new_thre.getElementsByTagName("table");
        let res_num = responses ? responses.length : 0;
        let new_res_num = new_responses ? new_responses.length : 0;

        if (res_num == new_res_num) {
            //
        } else if (new_res_num == 0) {
            //
        } else {
            for (let i = res_num, inserted = res_num == 0 ? thre.getElementsByTagName("blockquote")[0] : responses[res_num - 1]; i < new_res_num; ++i) {
                inserted = thre.insertBefore(new_responses[res_num], inserted.nextElementSibling);
            }

            this.notify.moveTo(res_num - 1);
            this.notify.setText(`新着レス${new_res_num - res_num}`);
            fixFormPosition();

            if (auto_scroll && responses.length > res_num) {
                let ch = document.documentElement.clientHeight;
                let sy = document.documentElement.scrollTop;
                let rect = responses[res_num].getBoundingClientRect();
                let to = rect.top + sy - ch / 2;
                document.documentElement.scrollTo(document.documentElement.scrollLeft, to);
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

    form.dom = ftbl.parentElement;
    if (!form.dom) {
        return;
    }

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

    form.file.dom = form.dom.querySelector('input[name="upfile"]');
    if (form.file.dom) {
        form.file.reader = new FileReader();

        form.file.reader.addEventListener("load", () => {
            form.file.buffer = form.file.reader.result;
            form.file.obj = form.file.dom.files[0];
            form.file.name = form.file.obj.name;
            form.file.size = form.file.obj.size;
            form.file.type = form.file.obj.type;
            previewFile(form.file);
        });

        // ページ読み込み時にファイルが既にあれば読み込む
        if (form.file.dom.files[0]) {
            form.file.reader.readAsArrayBuffer(form.file.dom.files[0]);
        }

        form.file.dom.addEventListener("change", () => {
            if (form.file.reader.readyState === FileReader.LOADING) {
                form.file.reader.abort();
            }

            form.file.reader.readAsArrayBuffer(form.file.dom.files[0]);
        });

        if (expand_file_input) {
            makeInputButton(form.file);

            let pastearea = document.getElementById("KOSHIAN_form_pastearea");
            if (pastearea) {
                let timer = null;
                pastearea.addEventListener("input", function() {
                    // pasteイベントのタイマーをクリア
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    // 貼り付けた内容にimgタグがあるか探す
                    let pasted_image = this.getElementsByTagName("img")[0];
                    if (pasted_image) {
                        //console.log("KOSHIAN_form/res.js - pasted_image:");
                        //console.dir(pasted_image);
                        let data_uri = pasted_image.src;
                        let file_type = data_uri.match(/data:(image\/(.*));base64/);
                        if (file_type) {
                            let buffer = convertDataURI2Buffer(data_uri);
                            if (buffer) {
                                form.file.dom.value = "";
                                form.file.buffer = buffer;
                                form.file.name = `clipboard_image.${file_type[2]}`;
                                form.file.type = file_type[1];
                                form.file.obj = new File([buffer], form.file.name, { type: form.file.type } );
                                form.file.size = form.file.obj.size;
                                previewFile(form.file);
                            } else {
                                console.error("KOSHIAN_form/res.js - dataURI abnormal:" + data_uri);    // eslint-disable-line no-console
                            }
                        } else {
                            console.error("KOSHIAN_form/res.js - dataURI abnormal:" + data_uri);    // eslint-disable-line no-console
                        }
                    } else {
                        //
                        //console.log("KOSHIAN_form/res.js - No pasted image:");
                        //console.dir(this);
                    }
                    this.innerHTML = "";
                    this.blur();
                });

                pastearea.addEventListener("paste", function() {
                    timer = setTimeout(() => {
                        // クリップボードが画像ファイル以外（inputイベントが発生しない）
                        this.innerHTML = "";
                        this.blur();
                        if (popup_file_dialog) form.file.dom.click();
                    }, 200);
                });
            }
        } else {
            initInputButton(form.file);
        }
    }
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

function onError(error) {
}

function onSettingGot(result) {
    auto_scroll = safeGetValue(result.auto_scroll, DEFAULT_AUTO_SCROLL);
    use_comment_clear = safeGetValue(result.use_comment_clear, DEFAULT_USE_COMMENT_CLEAR);
    use_sage = safeGetValue(result.use_sage, DEFAULT_USE_SAGE);
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

    let form = document.getElementById("fm");
    if (form) {
        let textarea = form.getElementsByTagName("textarea")[0];
        if (textarea) makeCommentClearButton(textarea);
        makeSageButton(form);
    }
    let droparea = document.getElementById("KOSHIAN_form_preview");
    if (droparea && droparea.className == "KOSHIAN-form-droparea") {
        droparea.textContent = droparea_text;
    }
}

browser.storage.local.get().then(onSettingGot, onError);
browser.storage.onChanged.addListener(onSettingChanged);
