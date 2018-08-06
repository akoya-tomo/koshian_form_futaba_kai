/* globals Encoding, content */

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
let time_out = DEFAULT_TIME_OUT;
let auto_scroll = DEFAULT_AUTO_SCROLL;
let use_comment_clear = DEFAULT_USE_COMMENT_CLEAR;
let use_sage = DEFAULT_USE_SAGE;
let expand_file_input = DEFAULT_EXPAND_FILE_INPUT;
let preview_max_size = DEFAULT_PREVIEW_MAX_SIZE;
let droparea_height = DEFAULT_DROPAREA_HEIGHT;
let video_autoplay = DEFAULT_VIDEO_AUTOPLAY;
let video_loop = DEFAULT_VIDEO_LOOP;
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

    setAlarmText(text) {
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
                this.notify.setAlarmText("添付ファイルの読み込みに失敗しました。もう一度ファイルを選択し直してください");
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
        this.notify.setAlarmText(text);
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
                this.notify.setAlarmText("スレは落ちています CODE:404");
                document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                break;
              default:  // eslint-disable-line indent
                this.notify.setAlarmText(`スレ更新失敗 CODE:${xhr.status} 返信は成功している可能性があります`);
            }
        }catch(e){
            this.notify.setAlarmText(`スレ更新失敗 CODE:${xhr.status} 返信は成功している可能性があります`);
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
            this.notify.setAlarmText("スレ更新失敗。スレが空です。返信は成功している可能性があります");
            return;
        }

        let thre = document.getElementsByClassName("thre")[0];
        let new_thre = new_document.getElementsByClassName("thre")[0];
        if(!thre || !new_thre){
            this.notify.setAlarmText("スレ更新失敗。スレがありません。返信は成功している可能性があります");
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
        this.notify.setAlarmText("通信失敗");
        fixFormPosition();
    }

    onTimeout() {
        this.loading = false;
        this.notify.setAlarmText("接続がタイムアウトしました");
        fixFormPosition();
    }

}

/**
 * バウンダリ文字列生成
 * @return {string} バウンダリ文字列
 */
function createBoundary() {
    // 27文字の"-"と最大15文字のランダムな数字で生成
    let boundary = "---------------------------";
    boundary += Math.floor(Math.random() * (10 ** 15));
    return boundary;
}

/**
 * Unicode文字列から指定文字コードのバッファに変換
 * @param {string} to_encoding 変換先文字コード
 * @param {string} str 対象のUnicode文字列
 * @return {ArrayBuffer} 変換したバッファ
 */
function convertUnicode2Buffer(to_encoding, str){
    let buffer = Encoding.convert(str, {
        to: to_encoding,
        from: "UNICODE",
        type: "arrayBuffer"
    });
    // 変換したバッファからUint8のビューを作成して、そのバッファを返す
    let uint8_buffer = new Uint8Array(buffer); 
    return uint8_buffer.buffer;
}

/**
 * バッファ結合
 * @param {ArrayBuffer} buf1 結合するバッファ
 * @param {ArrayBuffer} buf2 結合するバッファ
 * @return {ArrayBuffer} 結合したバッファ
 */
function appendBuffer(buf1, buf2) {
    let uint8_buffer = new Uint8Array(buf1.byteLength + buf2.byteLength);
    uint8_buffer.set(new Uint8Array(buf1),0);
    uint8_buffer.set(new Uint8Array(buf2),buf1.byteLength);
    return uint8_buffer.buffer;
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

/**
 * コメントクリアボタン配置
 * @param {Element} textarea 返信フォームのコメント入力textarea要素
 */
function makeCommentClearButton(textarea) {
    let button = document.getElementById("KOSHIAN_form_comment_clear_button");
    if (use_comment_clear) {
        if (!button) {
            button = document.createElement("div");
            button.id = "KOSHIAN_form_comment_clear_button";
            button.className = "KOSHIAN-form-button";
            button.textContent = "[クリア]";
            button.title = "コメントをクリアします";
            let comment_td = textarea.parentElement.previousElementSibling;
            if (comment_td) {
                comment_td.insertBefore(button, comment_td.firstChild.nextSibling);
            }
        }
        button.onclick = () => {
            textarea.value = "";
        };
    } else if (button) {
        button.parentElement.removeChild(button);
    }
}

/**
 * sageボタン配置
 * @param {Element} form 返信フォームform要素
 */
function makeSageButton(form) {
    let button = document.getElementById("KOSHIAN_form_sage_button");
    if (use_sage) {
        let email = form.querySelector("input[name='email']");
        if (!button) {
            button = document.createElement("span");
            button.id = "KOSHIAN_form_sage_button";
            button.className = "KOSHIAN-form-sage-button";
            button.textContent = "[sage]";
            button.title = "sageを切り替えます";
            if (email) {
                email.parentElement.insertBefore(button, email.nextSibling);
            }
        }
        button.onclick = () => {
            let match = email.value.match(/[\s　]*sage[\s　]*/);    // eslint-disable-line no-irregular-whitespace
            if (match) {
                email.value = email.value.replace(match, "");
            } else {
                email.value = "sage " + email.value;
            }
        };
    } else if (button) {
        button.parentElement.removeChild(button);
    }
}

/**
 * ファイル入力画面初期化
 * @param {Object} file 添付ファイルの情報を格納したオブジェクト
 */
function initInputButton(file) {
    if (file.dom.id) {
        if (document.getElementById("ffip_input_file")) return;
        file.dom.id = "";
        file.dom.className = "";
        file.dom.autocomplete = "nope";	// リロード時の添付ファイル復活を抑止

        for (let elm = file.dom.parentElement; elm; elm = elm.parentElement) {
            if (elm.tagName == "TD") {
                let label = document.createElement("label");
                let input = document.createElement("input");
                input.name = "textonly";
                input.value = "on";
                input.type = "checkbox";
                label.append(input, "画像無し");
                elm.innerHTML = "";
                elm.append(file.dom, "[", label, "]");
                break;
            }
        }
    }
}

/**
 * ファイル入力ボタン配置
 * @param {Object} file 添付ファイルの情報を格納したオブジェクト
 */
function makeInputButton(file) {
    if (file.dom.id != "KOSHIAN_form_upfile") {
        // ファイル入力全体
        let file_input = document.createElement("div");
        file_input.className = "KOSHIAN-form-file-input";
        // ファイル入力表示
        let file_input_view = document.createElement("div");
        file_input_view.className = "KOSHIAN-form-file-input-view";
        // ファイル入力欄
        let file_input_container = document.createElement("div");
        file_input_container.className = "KOSHIAN-form-file-input-container";
        // ファイル入力ボタン（ダミー）
        let file_input_button = document.createElement("div");
        file_input_button.className = "KOSHIAN-form-file-input-button";
        file_input_button.textContent = "参照...";
        // ファイル入力名
        let filename = document.createElement("div");
        filename.id = "KOSHIAN_form_filename";
        filename.className = "KOSHIAN-form-filename";
        filename.textContent = INPUT_FILE_TEXT;
        // ファイルプレビュー（ドロップエリア）
        let preview = document.createElement("div");
        preview.id = "KOSHIAN_form_preview";
        preview.className = "KOSHIAN-form-droparea";
        preview.textContent = droparea_text;
        // ファイル情報
        let file_info = document.createElement("div");
        file_info.id = "KOSHIAN_form_file_info";
        file_info.className = "KOSHIAN-form-file-info";
        // 貼り付けボタン
        let paste_button = document.createElement("div");
        paste_button.id = "KOSHIAN_form_paste_button";
        paste_button.className = "KOSHIAN-form-button";
        paste_button.textContent = "[貼り付け]";
        paste_button.title = "クリップボード内の画像を貼り付けます";
        paste_button.onclick = () => {
            pasteFromClipboard();
        };
        // クリアボタン
        let clear_button = document.createElement("div");
        clear_button.id = "KOSHIAN_form_clear_button";
        clear_button.className = "KOSHIAN-form-button";
        clear_button.textContent = "[クリア]";
        clear_button.title = "添付ファイルをクリアします";
        clear_button.onclick = () => {
            clearFile(file);
        };
        // 貼り付けエリア（透明）
        let pastearea = document.createElement("div");
        pastearea.id = "KOSHIAN_form_pastearea";
        pastearea.className = "KOSHIAN-form-pastearea";
        pastearea.contentEditable = "true";

        file_input_container.append(file_input_button, filename);
        file_input_view.append(file_input_container, paste_button, clear_button);
        file_input.append(file_input_view, preview, file_info);

        let td = file.dom.parentElement;
        td.innerHTML = "";
        td.append(file_input, pastearea);

        // ファイル入力本体（透明）
        file.dom.id = "KOSHIAN_form_upfile";
        file.dom.className = "KOSHIAN-form-upfile";
        file.dom.autocomplete = "nope";	// リロード時の添付ファイル復活を抑止
        file_input.append(file.dom);

    } else {
        // ファイル入力が配置済みならプレビューをクリアしてクリックイベントだけ再定義
        clearPreview();
        let paste_button = document.getElementById("KOSHIAN_form_paste_button");
        paste_button.onclick = () => {
            pasteFromClipboard();
        };

        let clear_button = document.getElementById("KOSHIAN_form_clear_button");
        clear_button.onclick = () => {
            clearFile(file);
        };
    }
}

/**
 * クリップボード貼り付け
 */
function pasteFromClipboard() {
    let pastearea = document.getElementById("KOSHIAN_form_pastearea");
    if (pastearea) {
        pastearea.focus();
        document.execCommand("paste");
    }
}

/**
 * 添付ファイルクリア
 * @param {Object} file 添付ファイルの情報を格納したオブジェクト
 */
function clearFile(file) {
    file.dom.value = "";
    file.buffer = null;
    file.obj = null;
    file.name = null;
    file.size = null;
    file.type = null;
    clearPreview();
}

/**
 * プレビュークリア
 */
function clearPreview() {
    let filename = document.getElementById("KOSHIAN_form_filename");
    if (filename) filename.textContent = INPUT_FILE_TEXT;
    // プレビュー初期化
    let preview = document.getElementById("KOSHIAN_form_preview");
    if (!preview) return;
    let droparea = document.createElement("div");
    droparea.id = "KOSHIAN_form_preview";
    droparea.className = "KOSHIAN-form-droparea";
    droparea.textContent = droparea_text;
    preview.parentElement.replaceChild(droparea, preview);
    let file_info = document.getElementById("KOSHIAN_form_file_info");
    if (file_info) file_info.innerHTML = "";
}

/**
 * プレビュー表示
 * @param {Object} file 添付ファイルの情報を格納したオブジェクト
 */
function previewFile(file) {
    let filename = document.getElementById("KOSHIAN_form_filename");
    if (filename) filename.textContent = file.name;
    if (preview_max_size == 0) return;

    let fileType = file.type.split("/");
    let preview, img_width, img_height;
    if (fileType[0] == "image") {
        preview = document.createElement("img");
        preview.id = "KOSHIAN_form_preview";
        preview.className = "KOSHIAN-form-preview";
    } else if (fileType[1] == "webm" || fileType[1] == "mp4") {
        preview = document.createElement("video");
        preview.id = "KOSHIAN_form_preview";
        preview.className = "KOSHIAN-form-preview";
        preview.muted = true;
        preview.autoplay = video_autoplay;
        preview.loop = video_loop;
    // 画像とWebM･mp4以外は処理を中止
    } else {
        return;
    }

    let droparea = document.getElementById("KOSHIAN_form_preview");
    droparea.parentElement.replaceChild(preview, droparea);

    // WebM･mp4の幅と高さ取得
    if (fileType[0] == "video") {
        // メタデータ読み込み完了
        preview.addEventListener("loadedmetadata", function (){
            img_width = preview.videoWidth;
            img_height = preview.videoHeight;
            dispFileInfo();
        });
    }

    // プレビュー表示
    let reader = new FileReader();
    reader.onload = () => {
        preview.src = reader.result;
    };
    reader.readAsDataURL(file.obj);

    // 画像の幅と高さ取得
    if (fileType[0] == "image") {
        let image = new Image();
        image.onload = function() {
            img_width = image.naturalWidth;
            img_height = image.naturalHeight;
            dispFileInfo();
        };
        image.src = URL.createObjectURL(file.obj);
    }

    /**
     * ファイル情報表示
     */
    function dispFileInfo() {
        let file_info = document.getElementById("KOSHIAN_form_file_info");
        if (!file_info) return;
        file_info.innerHTML = "";

        let img_size = document.createElement("span");
        img_size.textContent = `${img_width}×${img_height}／`;
    
        let file_size_sep = ("" + file.size).replace(/(\d)(?=(\d\d\d)+$)/g, "$1,");
        let file_size = document.createElement("span");
        file_size.textContent = `${file_size_sep}byte／`;

        let file_type = document.createElement("span");
        file_type.textContent = `${fileType[1]}`;

        file_info.append(img_size, file_size, file_type);
    }
}

/**
 * dataURI文字列からバッファに変換
 * @param {string} data_uri dataURI文字列
 * @return {ArrayBuffer} 変換したバッファ
 */
function convertDataURI2Buffer(data_uri) {
    // base64部をバイナリデータの文字列にデコード
    let base64 = data_uri.split(',')[1];
    if (!base64) return;
    let byte_string = atob(base64);

    // Uint8のビューを作成してデコードした文字列を格納し、そのバッファを返す
    let uint8_buffer = new Uint8Array(byte_string.length);
    for (let i = 0; i < byte_string.length; i++) {
        uint8_buffer[i] = byte_string.charCodeAt(i);  // Unicode値で格納
    }

    return uint8_buffer.buffer;
}

function main() {
    let form = new Form();

    let ftbl = document.getElementById("ftbl");
    if (!ftbl) {
        return;
    }

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
        droparea_border = "";
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
        droparea_border = "";
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
