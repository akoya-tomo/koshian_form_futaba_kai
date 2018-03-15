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

function fixFormPosition() {
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

let auto_scroll = true;

function main() {
    let notify = new Notify();

    let ftbl = document.getElementById("ftbl");
    if (!ftbl) {
        return;
    }

    let form = ftbl.parentElement;
    if (!form) {
        return;
    }

    let textarea = form.getElementsByTagName("textarea")[0];
    if (!textarea) {
        return;
    }

    let dummy = document.createElement("iframe");
    dummy.name = "KOSHIAN_dummy_form_target";
    dummy.hidden = true;
    dummy.onload = (event) => {
        try {
            textarea.value = "";

            let new_document = dummy.contentDocument;
            if (!new_document) {
                return;
            }

            let thre = document.getElementsByClassName("thre")[0];
            let new_thre = new_document.getElementsByClassName("thre")[0];
            if (!new_thre || !thre) {
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

                notify.moveTo(res_num - 1);
                notify.setText(`新着レス${new_res_num - res_num}`);
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
        } catch (e) {
            //
        }
        
        dummy.src = "about:blank";
    };

    document.body.appendChild(dummy);
    form.target = dummy.name;
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