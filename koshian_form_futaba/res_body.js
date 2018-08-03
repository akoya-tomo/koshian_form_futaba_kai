/* globals Encoding, content */

const XMLHttpRequest = ( typeof content != 'undefined' && typeof content.XMLHttpRequest == 'function' ) ? content.XMLHttpRequest  : window.XMLHttpRequest;
const DEFAULT_TIME_OUT = 60 * 1000;
let time_out = DEFAULT_TIME_OUT;

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

let auto_scroll = true;

class Form {
    constructor() {
        this.notify = new Notify();
        this.dom = null;
        this.textarea = null;
        this.loading = false;
        this.boundary = null;
        this.buffer = new Uint8Array();
        this.file = {};
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

        this.buffer = appendBuffer(this.buffer, 
            unicode2buffer("UTF8",
                "--" + this.boundary + "--"
            )
        );

        xhr.send(this.buffer);
        this.notify.moveTo(10000);
        this.notify.setText("返信中……");
    }

    setText(name, value) {
        let buffer = unicode2buffer("UTF8", 
            "--" + this.boundary + "\r\n" +
            `Content-Disposition: form-data; name="${name}"\r\n` +
            "Content-Type: text/plain; charset=Shift_JIS\r\n" +
            "\r\n"
        );
        let sjis_buffer = unicode2buffer("Shift_JIS", value);
        buffer = appendBuffer(buffer, sjis_buffer);
        buffer = appendBuffer(buffer, unicode2buffer("UTF8", "\r\n"));
        this.buffer = appendBuffer(this.buffer, buffer);
    }

    setFile(name) {
        let filename = this.file.name ? "filename" : "";
        let type = this.file.type ? this.file.type : "application/octet-stream";
        let buffer = unicode2buffer("UTF8",
            "--" + this.boundary + "\r\n" +
            `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n` +
            `Content-Type: ${type}\r\n` +
            "\r\n"
        );
        if (this.file.buffer) buffer = appendBuffer(buffer, this.file.buffer);
        buffer = appendBuffer(buffer, unicode2buffer("UTF8", "\r\n"));
        this.buffer = appendBuffer(this.buffer, buffer);
    }

    setParam(name, value) {
        let buffer = unicode2buffer("UTF8",
            "--" + this.boundary + "\r\n" +
            `Content-Disposition: form-data; name="${name}"\r\n` +
            "\r\n"
        );
        let utf8_buffer = unicode2buffer("UTF8", value);
        buffer = appendBuffer(buffer, utf8_buffer);
        buffer = appendBuffer(buffer, unicode2buffer("UTF8", "\r\n"));
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
        this.file.buffer = null;
        this.file.name = null;
        this.file.type = null;
        let clear_button = document.getElementById("ffip_file_clear");
        if (clear_button) {
            clear_button.click();
        } else {
            if (this.file.dom) {
                this.file.dom.value = "";
            }
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

function createBoundary() {
    let boundary = "---------------------------";
    boundary += Math.floor(Math.random() * (10 ** 15));
    return boundary;
}

function unicode2buffer(to_encoding, str){
    let buffer = Encoding.convert(str, {
        to: to_encoding,
        from: "UNICODE",
        type: "arrayBuffer"
    });
    // bufferはUint16なのでUint8に変換
    let uint8buffer = new Uint8Array(buffer); 
    return uint8buffer.buffer;
}

function appendBuffer(buf1,buf2) {
    var uint8array = new Uint8Array(buf1.byteLength + buf2.byteLength);
    uint8array.set(new Uint8Array(buf1),0);
    uint8array.set(new Uint8Array(buf2),buf1.byteLength);
    return uint8array.buffer;
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

    form.file = {
        dom    : form.dom.querySelector('input[name="upfile"]'),
        reader : null,
        buffer : null,
        name : null,
        type : null
    };

    if (form.file.dom) {
        form.file.reader = new FileReader();

        form.file.reader.addEventListener("load", () => {
            form.file.buffer = form.file.reader.result;
            form.file.name = form.file.dom.files[0].name;
            form.file.type = form.file.dom.files[0].type;
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
    }
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

function onError(error) {
}

function onSettingGot(result) {
    auto_scroll = safeGetValue(result.auto_scroll, true);

    main();
}

function onSettingChanged(changes, areaName) {
    if (areaName != "local") {
        return;
    }

    auto_scroll = safeGetValue(changes.auto_scroll.newValue, true);
}

browser.storage.local.get().then(onSettingGot, onError);
browser.storage.onChanged.addListener(onSettingChanged);
