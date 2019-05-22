/* globals XMLHttpRequest */
/* globals DEFAULT_TIME_OUT, DEFAULT_USE_COMMENT_CLEAR, DEFAULT_USE_SAGE, DEFAULT_EXPAND_FILE_INPUT, DEFAULT_PREVIEW_MAX_SIZE, DEFAULT_DROPAREA_HEIGHT */
/* globals DEFAULT_VIDEO_AUTOPLAY, DEFAULT_VIDEO_LOOP, DEFAULT_POPUP_FILE_DIALOG, DEFAULT_DROPAREA_BORDER, DEFAULT_DROPAREA_TEXT, DEFAULT_OPEN_NEW_THREAD */
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
let use_comment_clear = DEFAULT_USE_COMMENT_CLEAR;      //eslint-disable-line no-unused-vars
let use_sage = DEFAULT_USE_SAGE;        //eslint-disable-line no-unused-vars
let expand_file_input = DEFAULT_EXPAND_FILE_INPUT;
let preview_max_size = DEFAULT_PREVIEW_MAX_SIZE;
let droparea_height = DEFAULT_DROPAREA_HEIGHT;
let video_autoplay = DEFAULT_VIDEO_AUTOPLAY;        //eslint-disable-line no-unused-vars
let video_loop = DEFAULT_VIDEO_LOOP;        //eslint-disable-line no-unused-vars
let popup_file_dialog = DEFAULT_POPUP_FILE_DIALOG;
let droparea_text = DEFAULT_DROPAREA_TEXT;
let open_new_thread = DEFAULT_OPEN_NEW_THREAD;

class Notify {
    constructor() {
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

        } else {
            this.notify = document.createElement("td");
            this.text = document.createTextNode("");
            let table_footer = document.createElement("tfoot");
            let table_row = document.createElement("tr");

            this.notify.id = "KOSHIAN_NOTIFY";
            this.notify.colSpan = 2;
            this.notify.appendChild(this.text);
            table_row.appendChild(this.notify);
            table_footer.appendChild(table_row);
            document.getElementById("ftbl").appendChild(table_footer);
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
                if (elm.tagName == "TEXTAREA" || elm.type == "text") {
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
        this.notify.setText("送信中……");
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
                    this.moveToNewThread(xhr.response);
                } else {
                    this.onResponseError(xhr.response);
                }
                break;
              default:  // eslint-disable-line indent
                this.notify.setAlertText(`スレ立て結果取得失敗 CODE:${xhr.status}`);
                this.loading = false;
            }
        }catch(e){
            this.notify.setAlertText("スレ立て結果取得失敗");
            console.error("KOSHIAN_form/board.js - onResponseLoad error: " + e);  // eslint-disable-line no-console
            this.loading = false;
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
            console.error("KOSHIAN_form/board.js - onResponse error: " + res);  // eslint-disable-line no-console
            text = "スレ立て処理でエラー発生";
        }
        this.notify.setAlertText(text);
        this.loading = false;
    }

    moveToNewThread(res) {
        if (open_new_thread) {
            this.notify.setText("送信完了。立てたスレを開きます……");
        } else {
            this.notify.setText("送信完了。立てたスレに移動します……");
        }

        this.textarea.value = "";
        let clear_button = document.getElementById("KOSHIAN_form_clear_button") || document.getElementById("ffip_file_clear");
        if (clear_button) {
            clear_button.click();
        } else if (this.file.dom) {
            clearFile(this.file);
        }

        let url_mes = /<META HTTP-EQUIV="refresh" content="1;URL=(res\/(\d+)\.htm)">/;
        let new_url = url_mes.exec(res);  // res内の新スレのアドレスを取得
        if (new_url) {
            let origin = location.origin;
            let path_name = location.pathname.match(/[^/]+/);
            let new_thre = origin + "/" + path_name + "/" + new_url[1];
            let url_match = /^https?:\/\/.+\.2chan\.net\/.+\/res\/(\d+)\.htm$/.test(new_thre);
            if (url_match) {
                if (open_new_thread) {
                    let new_window = window.open(new_thre);
                    if (new_window) {
                        this.notify.setText("立てたスレを開きました");
                    } else {
                        this.notify.setAlertText("立てたスレを開けませんでした。ポップアップブロックされている場合は許可してください");
                    }
                } else {
                    location.href = new_thre;
                }
            } else {
                console.error("KOSHIAN_form/board.js - new thread address abnormal:" + new_thre);   // eslint-disable-line no-console
                this.notify.setAlertText("立てたスレのアドレス取得失敗。スレ立ては成功");
            }
        } else {
            console.error("KOSHIAN_form/board.js - response abnormal:" + res);   // eslint-disable-line no-console
            this.notify.setAlertText("立てたスレに移動失敗。スレ立ては成功");
        }
        this.loading = false;
    }

    onError() {
        this.loading = false;
        this.buffer = null;
        this.notify.setAlertText("通信失敗");
    }

    onTimeout() {
        this.loading = false;
        this.buffer = null;
        this.notify.setAlertText("接続がタイムアウトしました");
    }

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
                        //console.log("KOSHIAN_form/board.js - pasted_image:");
                        //console.dir(pasted_image);
                        let data_uri = pasted_image.src.match(/^data:(image\/([^;]+));base64.+$/);
                        if (data_uri) {
                            setDataURI(data_uri);
                        } else {
                            try {
                                fetch(pasted_image.src).then(function(response) {
                                    return response.blob();
                                }).then(function(blob) {
                                    //console.log("KOSHIAN_form/board.js - blob.type: " + blob.type);
                                    if (blob.type.match(/^image\//)) {
                                        setBlob(blob);
                                    } else {
                                        console.log("KOSHIAN_form/board.js - blob type is not image");  // eslint-disable-line no-console
                                    }
                                });
                            } catch(e) {
                                console.error("KOSHIAN_form/board.js - fetch error: src=" + pasted_image.src + ", error=" );	// eslint-disable-line no-console
                                console.dir(e); // eslint-disable-line no-console
                                return;
                            }
                        }
                    } else {
                        //
                        //console.log("KOSHIAN_form/board.js - No pasted image:");
                        //console.dir(this);
                    }
                    this.innerHTML = "";
                    this.blur();

                    function setDataURI(data_uri) {
                        let file_ext = data_uri[2];
                        let file_type = data_uri[1];
                        if (data_uri[0] && file_ext && file_type) {
                            let buffer = convertDataURI2Buffer(data_uri[0]);
                            if (buffer) {
                                form.file.dom.value = "";
                                form.file.buffer = buffer;
                                form.file.name = `clipboard_image.${file_ext}`;
                                form.file.type = file_type;
                                form.file.obj = new File([buffer], form.file.name, { type: form.file.type } );
                                form.file.size = form.file.obj.size;
                                previewFile(form.file);
                            } else {
                                console.error("KOSHIAN_form/board.js - dataURI abnormal: " + data_uri[0]);    // eslint-disable-line no-console
                            }
                        } else {
                            console.error("KOSHIAN_form/board.js - dataURI abnormal: ");    // eslint-disable-line no-console
                            console.dir(data_uri);  // eslint-disable-line no-console
                        }
                    }

                    function setBlob(blob) {
                        let file_reader = new FileReader();
                        file_reader.addEventListener("load", () => {
                            let buffer = file_reader.result;
                            let file_ext = blob.type.split("/")[1];
                            let file_type = blob.type;
                            form.file.dom.value = "";
                            form.file.buffer = buffer;
                            form.file.name = `clipboard_image.${file_ext}`;
                            form.file.type = file_type;
                            form.file.obj = new File([blob], form.file.name);
                            form.file.size = form.file.obj.size;
                            previewFile(form.file);
                        });
                        file_reader.readAsArrayBuffer(blob);
                    }
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
    use_comment_clear = safeGetValue(result.use_comment_clear, DEFAULT_USE_COMMENT_CLEAR);
    use_sage = safeGetValue(result.use_sage, DEFAULT_USE_SAGE);
    expand_file_input = safeGetValue(result.expand_file_input, DEFAULT_EXPAND_FILE_INPUT);
    preview_max_size = safeGetValue(result.preview_max_size, DEFAULT_PREVIEW_MAX_SIZE);
    droparea_height = safeGetValue(result.droparea_height, DEFAULT_DROPAREA_HEIGHT);
    video_autoplay = safeGetValue(result.video_autoplay, DEFAULT_VIDEO_AUTOPLAY);
    video_loop = safeGetValue(result.video_loop, DEFAULT_VIDEO_LOOP);
    popup_file_dialog = safeGetValue(result.popup_file_dialog, DEFAULT_POPUP_FILE_DIALOG);
    open_new_thread = safeGetValue(result.open_new_thread, DEFAULT_OPEN_NEW_THREAD);

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

    use_comment_clear = safeGetValue(changes.use_comment_clear.newValue, DEFAULT_USE_COMMENT_CLEAR);
    use_sage = safeGetValue(changes.use_sage.newValue, DEFAULT_USE_SAGE);
    expand_file_input = safeGetValue(changes.expand_file_input.newValue, DEFAULT_EXPAND_FILE_INPUT);
    preview_max_size = safeGetValue(changes.preview_max_size.newValue, DEFAULT_PREVIEW_MAX_SIZE);
    droparea_height = safeGetValue(changes.droparea_height.newValue, DEFAULT_DROPAREA_HEIGHT);
    video_autoplay = safeGetValue(changes.video_autoplay.newValue, DEFAULT_VIDEO_AUTOPLAY);
    video_loop = safeGetValue(changes.video_loop.newValue, DEFAULT_VIDEO_LOOP);
    popup_file_dialog = safeGetValue(changes.popup_file_dialog.newValue, DEFAULT_POPUP_FILE_DIALOG);
    open_new_thread = safeGetValue(changes.open_new_thread.newValue, DEFAULT_OPEN_NEW_THREAD);

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
