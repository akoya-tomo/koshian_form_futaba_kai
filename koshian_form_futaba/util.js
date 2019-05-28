/* globals Encoding */
/* globals SCRIPT_NAME */
/* globals INPUT_FILE_TEXT */
/* globals use_comment_clear, use_sage, use_image_resize, expand_file_input, preview_max_size, video_autoplay, video_loop, popup_file_dialog, droparea_text */
/* eslint-disable no-unused-vars */
/* globals 
    createBoundary,
    convertUnicode2Buffer,
    appendBuffer,
    isAscii,
    makeCommentClearButton,
    makeSageButton,
    setFormFileInput,
    clearFile
*/
/* eslint-enable no-unused-vars */

/**
 * バウンダリ文字列生成
 * @return {string} バウンダリ文字列
 */
function createBoundary() { //eslint-disable-line no-unused-vars
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
function convertUnicode2Buffer(to_encoding, str){   //eslint-disable-line no-unused-vars
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
function appendBuffer(buf1, buf2) { //eslint-disable-line no-unused-vars
    let uint8_buffer = new Uint8Array(buf1.byteLength + buf2.byteLength);
    uint8_buffer.set(new Uint8Array(buf1),0);
    uint8_buffer.set(new Uint8Array(buf2),buf1.byteLength);
    return uint8_buffer.buffer;
}

/**
 * dataURI文字列からバッファに変換
 * @param {string} data_uri dataURI文字列
 * @return {ArrayBuffer} 変換したバッファ
 */
function convertDataURI2Buffer(data_uri) {
    // base64部をバイナリデータの文字列にデコード
    let base64 = data_uri.split(',')[1];
    if (!base64) {
        return;
    }
    let byte_string = atob(base64);

    // Uint8のビューを作成してデコードした文字列を格納し、そのバッファを返す
    let uint8_buffer = new Uint8Array(byte_string.length);
    for (let i = 0; i < byte_string.length; i++) {
        uint8_buffer[i] = byte_string.charCodeAt(i);  // Unicode値で格納
    }

    return uint8_buffer.buffer;
}

/**
 * 文字列が全てASCII文字か判定
 * @param {string} str 判定する文字列
 * @return {boolean} 全てASCII文字か
 */
function isAscii(str) { //eslint-disable-line no-unused-vars
    str = str || "";
    if (str.match(/^[\x20-\x7e]*$/)) {
        return true;
    } else {
        return false;
    }
}

/**
 * コメントクリアボタン配置
 * @param {Element} textarea 返信フォームのコメント入力textarea要素
 */
function makeCommentClearButton(textarea) { //eslint-disable-line no-unused-vars
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
 * @param {Element} form_dom 返信フォームform要素
 */
function makeSageButton(form_dom) { //eslint-disable-line no-unused-vars
    let button = document.getElementById("KOSHIAN_form_sage_button");
    if (use_sage) {
        let email = form_dom.querySelector("input[name='email']");
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
 * 返信フォームの添付ファイル入力設定
 * @param {Object} form 返信フォームの情報を格納したオブジェクト
 */
function setFormFileInput(form) {   //eslint-disable-line no-unused-vars
    form.file.dom = form.dom.querySelector('input[name="upfile"]');
    if (form.file.dom) {
        form.file.reader = new FileReader();

        form.file.reader.addEventListener("load", async () => {
            form.file.buffer = form.file.reader.result;
            form.file.obj = form.file.dom.files[0];
            form.file.name = form.file.obj.name;
            form.file.size = form.file.obj.size;
            form.file.type = form.file.obj.type;
            if (use_image_resize && form.file.size > form.file.max_size && form.file.type.match(/png|jpeg/)) {
                let result = await resizeImage(form.file.obj);
                if (!result) {
                    // サイズ変更例外エラーでもオリジナルサイズのままプレビュー表示する（ファイルがセット済みのため）
                }
                previewFile(form.file);
            } else {
                previewFile(form.file);
            }
        });

        // ページ読み込み時にファイルが既にあれば読み込む
        if (form.file.dom.files[0]) {
            form.file.loading = true;
            form.file.reader.readAsArrayBuffer(form.file.dom.files[0]);
        }

        form.file.dom.addEventListener("change", () => {
            if (form.file.reader.readyState === FileReader.LOADING) {
                form.file.reader.abort();
            }
            form.file.loading = true;
            form.file.reader.readAsArrayBuffer(form.file.dom.files[0]);
        });

        let input_max_file_size = form.dom.querySelector('input[name="MAX_FILE_SIZE"]');
        if (input_max_file_size) {
            let max_file_size = parseInt(input_max_file_size.value, 10);
            if (max_file_size > 0) {
                form.file.max_size = Math.max(max_file_size, 512000); // 500KB以下にはならないと想定
            }
        }
        console.debug(SCRIPT_NAME + "/setFormFileInput - max file size: " + form.file.max_size + "byte");

        if (expand_file_input) {
            makeInputButton(form.file);

            let pastearea = document.getElementById("KOSHIAN_form_pastearea");
            if (pastearea) {
                let timer = null;
                pastearea.addEventListener("input", async function() {
                    // pasteイベントのタイマーをクリア
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    // 貼り付けた内容にimgタグがあるか探す
                    let pasted_image = this.getElementsByTagName("img")[0];
                    if (pasted_image) {
                        //console.log(SCRIPT_NAME + "/setFormFileInput - pasted_image:");
                        //console.dir(pasted_image);
                        let data_uri = pasted_image.src.match(/^data:(image\/([^;]+));base64.+$/);
                        if (data_uri) {
                            // ファイルからの貼付
                            let result = await convertDataURI2FormFile(data_uri);
                            if (result) {
                                previewFile(form.file);
                            } else {
                                form.file.loading = false;
                                clearFile(form.file);
                                setFilenameText("貼付失敗(画像データ異常)");
                            }
                        } else {
                            let e_text = "貼付失敗";
                            try {
                                // Webからの貼付
                                let response = await fetch(pasted_image.src).catch((e) =>{
                                    e_text += "(通信異常)";
                                    throw new Error(e);
                                });
                                if (!response.ok) {
                                    e_text += `(通信異常): ${response.status}`;
                                    throw new Error(response.statusText);
                                }
                                let blob = await response.blob();
                                //console.log(SCRIPT_NAME + "/setFormFileInput - blob.type: " + blob.type);
                                if (blob.type.match(/^image\//)) {
                                    if (use_image_resize && blob.size > form.file.max_size && blob.type.match(/png|jpeg/)) {
                                        let result = await resizeImage(blob);
                                        if (result) {
                                            previewFile(form.file);
                                        } else {
                                            form.file.loading = false;
                                            clearFile(form.file);
                                            setFilenameText("サイズ変更失敗");
                                        }
                                    } else {
                                        let name = `clipboard_image.${blob.type.split("/")[1]}`;
                                        await convertBlob2FormFile(blob, name);
                                        previewFile(form.file);
                                    }
                                } else {
                                    console.debug(SCRIPT_NAME + "/setFormFileInput - blob type is not image: blob.type = " + blob.type);
                                    form.file.loading = false;
                                    clearFile(form.file);
                                    setFilenameText("貼付失敗(画像データ異常)");
                                }
                            } catch (e) {
                                console.error(SCRIPT_NAME + "/setFormFileInput - " + e.name + ": " + e.message);
                                console.dir(e);
                                form.file.loading = false;
                                clearFile(form.file);
                                setFilenameText(e_text);
                            }
                        }
                    } else {
                        //console.log(SCRIPT_NAME + "/setFormFileInput - No pasted image:");
                        //console.dir(this);
                        form.file.loading = false;
                        setFilenameText(form.file.name);
                    }
                    this.innerHTML = "";
                    this.blur();
                });

                pastearea.addEventListener("paste", function() {
                    form.file.loading = true;
                    timer = setTimeout(() => {
                        // クリップボードが画像ファイル以外（inputイベントが発生しない）
                        timer = null;
                        form.file.loading = false;
                        setFilenameText(form.file.name);
                        this.innerHTML = "";
                        this.blur();
                        if (popup_file_dialog) {
                            form.file.dom.click();
                        }
                    }, 200);
                });
            }
        } else {
            initInputButton(form.file);
        }
    }

    /**
     * DataURIをFileに変換して返信フォームファイルオブジェクト(form.file)にセット
     * @param {Array.<string>} data_uri 添付ファイルのDataURI文字列配列
     *     {string} data_uri[0] DataURI文字列
     *     {string} data_uri[1] ファイルタイプ文字列
     *     {string} data_uri[2] 拡張子文字列
     * @return {boolean} 正常にセットできたか
     */
    async function convertDataURI2FormFile(data_uri) {
        let file_type = data_uri[1];
        let file_ext = data_uri[2];
        if (data_uri[0] && file_type && file_ext) {
            let buffer = convertDataURI2Buffer(data_uri[0]);
            if (buffer) {
                let file_name = `clipboard_image.${file_ext}`;
                let file_obj = new File([buffer], file_name, { type: file_type } );
                let file_size = file_obj.size;
                if (use_image_resize && file_size > form.file.max_size && file_ext.match(/png|jpeg/)) {
                    let result = await resizeImage(file_obj);
                    return result;
                } else {
                    form.file.dom.value = "";
                    form.file.buffer = buffer;
                    form.file.name = file_name;
                    form.file.type = file_type;
                    form.file.obj = new File([buffer], form.file.name, { type: form.file.type } );
                    form.file.size = form.file.obj.size;
                    return true;
                }
            } else {
                console.debug(SCRIPT_NAME + "/convertDataURI2File - dataURI abnormal: " + data_uri[0]);
                return false;
            }
        } else {
            console.debug(SCRIPT_NAME + "/convertDataURI2File - dataURI abnormal: ");
            console.dir(data_uri);
            return false;
        }
    }

    /**
     * BlobからFileへ変換して返信フォームファイルオブジェクト(form.file)にセット
     * @param {Object} blob 添付ファイルのBlobオブジェクト
     * @param {string} name 添付ファイル名の文字列
     */
    async function convertBlob2FormFile(blob, name) {
        let result =  await new Promise((resolve) => {
            let file_reader = new FileReader();
            file_reader.addEventListener("load", () => {
                resolve(file_reader.resut);
            });
            file_reader.readAsArrayBuffer(blob);
        });

        form.file.dom.value = "";
        form.file.buffer = result;
        name = name || `file.${blob.type.split("/")[1]}`;
        form.file.name = name;
        form.file.type = blob.type;
        form.file.obj = new File([blob], name);
        form.file.size = form.file.obj.size;
    }

    /**
     * 画像ファイルをファイル制限サイズ以下へ変更して返信フォームファイルオブジェクト(form.file)にセット
     * @param {Object} obj 画像ファイルのオブジェクト(File or Blob)
     * @return {boolean} 正常にセットが完了したか
     */
    async function resizeImage(obj) {
        setFilenameText("ファイル変換中……");
        let result =  await new Promise((resolve) => {
            let img = new Image;
            img.onload = async () => {
                URL.revokeObjectURL(img.src);
                let blob = await getResizedBlob(img).catch((e) => {
                    console.error(SCRIPT_NAME + "/resizeImage - blob resize error");
                    console.error(e.name + ": " + e.message);
                    console.dir(e);
                    resolve(false);
                });
                if (blob) {
                    let name = "resized_image.jpeg";
                    if (obj.name) {
                        name = obj.type == "image/jpeg" ? `resized_${obj.name}` : `resized_${obj.name}.jpeg`;
                    }
                    await convertBlob2FormFile(blob, name);
                    resolve(true);
                } else {
                    let name = obj.name || `clipboard_image.${obj.type.split("/")[1]}`;
                    await convertBlob2FormFile(obj, name);
                    resolve(true);
                }
            };
            img.onerror = (e) => {
                console.error(SCRIPT_NAME + "/resizeImage - image load error");
                console.error(e.name + " : " + e.message);
                console.dir(e);
                resolve(false);
            };
            img.src = URL.createObjectURL(obj);
        });
        return result;

        /**
         * ファイル制限サイズ以下に変更した画像Blobオブジェクトの取得
         * @param {HTMLImageElement} img 変更する画像のHTMLImageElementオブジェクト
         * @return {Object|null} ファイルサイズ変更後の画像のBlobオブジェクト
         *     変更してもファイル制限サイズ以下にならないときはnullを返す
         */
        async function getResizedBlob(img) {
            let img_width = img.naturalWidth;
            let img_height = img.naturalHeight;
            let blob_opt = [
                // 変換オプションのリスト
                {quality: 0.92, scale: 1},
                {quality: 0.85, scale: 1},
                {quality: 0.80, scale: 1},
                {quality: 0.75, scale: 1},
                {quality: 0.75, scale: 0.9},
                {quality: 0.75, scale: 0.8},
                {quality: 0.75, scale: 0.7},
                {quality: 0.75, scale: 0.6},
                {quality: 0.75, scale: 0.5},
                {quality: 0.75, scale: 0.4},
                {quality: 0.75, scale: 0.3},
                {quality: 0.75, scale: 0.2},
            ];
            let cvs = document.createElement("canvas");
            let ctx = cvs.getContext("2d");
            for (let i = 0; i < blob_opt.length; ++i) {
                if (i == 0 || blob_opt[i].scale != blob_opt[i-1].scale) {
                    // 前回とscaleが異なるときはcanvasを再描画
                    cvs.width = Math.round(img_width * blob_opt[i].scale);
                    cvs.height = Math.round(img_height * blob_opt[i].scale);
                    ctx.drawImage(img, 0, 0, img_width, img_height, 0, 0, cvs.width, cvs.height);
                }
                // canvasをblob化
                let blob = await new Promise((resolve) => {
                    cvs.toBlob((blob) => {
                        resolve(blob);
                    }, "image/jpeg", blob_opt[i].quality);
                });
                //console.log(SCRIPT_NAME + "/getResizedBlob - blob quolity: " + blob_opt[i].quality + " scale:" + blob_opt[i].scale + " size: " + blob.size);
                if (blob.size <= form.file.max_size) {
                    return blob;
                }
            }
            return null;
        }
    }

    /**
     * ファイル入力画面初期化
     * @param {Object} file 添付ファイルの情報を格納したオブジェクト
     */
    function initInputButton(file) {
        if (file.dom.id) {
            if (document.getElementById("ffip_input_file")) {
                // futaba form image previewerが有効のときは初期化しない
                return;
            }

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
    /**
     * クリップボード貼り付け
     */
    function pasteFromClipboard() {
        if (file.loading) {
            return;
        }
        let pastearea = document.getElementById("KOSHIAN_form_pastearea");
        if (pastearea) {
            pastearea.focus();
            document.execCommand("paste");
        }
    }
}

/**
 * 添付ファイルクリア
 * @param {Object} file 添付ファイルの情報を格納したオブジェクト
 */
function clearFile(file) {
    if (file.loading) {
        return;
    }
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
 * @param {string} name 初期化するファイル名文字列
 */
function clearPreview(name) {
    // ファイル名初期化
    setFilenameText(name || INPUT_FILE_TEXT);
    // プレビュー初期化
    let preview = document.getElementById("KOSHIAN_form_preview");
    if (!preview) {
        return;
    }
    let droparea = document.createElement("div");
    droparea.id = "KOSHIAN_form_preview";
    droparea.className = "KOSHIAN-form-droparea";
    droparea.textContent = droparea_text;
    preview.parentElement.replaceChild(droparea, preview);
    let file_info = document.getElementById("KOSHIAN_form_file_info");
    if (file_info) {
        file_info.innerHTML = "";
    }
}

/**
 * プレビュー表示
 * @param {Object} file 添付ファイルの情報を格納したオブジェクト
 */
function previewFile(file) {
    setFilenameText(file.name);
    if (preview_max_size == 0) {
        file.loading = false;
        return;
    }

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
    } else {
        // 画像とWebM･mp4以外は処理を中止
        file.loading = false;
        return;
    }

    let droparea = document.getElementById("KOSHIAN_form_preview");
    droparea.parentElement.replaceChild(preview, droparea);

    // WebM･mp4の幅と高さ取得
    if (fileType[0] == "video") {
        // メタデータ読み込み完了
        preview.addEventListener("loadedmetadata", () => {
            img_width = preview.videoWidth;
            img_height = preview.videoHeight;
            dispFileInfo();
        });
    }

    // 画像の幅と高さ取得
    if (fileType[0] == "image") {
        preview.addEventListener("load", () => {
            img_width = preview.naturalWidth;
            img_height = preview.naturalHeight;
            dispFileInfo();
        });
    }

    // プレビュー表示
    let reader = new FileReader();
    reader.onload = () => {
        preview.src = reader.result;
    };
    reader.readAsDataURL(file.obj);

    /**
     * ファイル情報表示
     */
    function dispFileInfo() {
        let file_info = document.getElementById("KOSHIAN_form_file_info");
        if (!file_info) {
            return;
        }
        file_info.innerHTML = "";

        let img_size = document.createElement("span");
        img_size.textContent = `${img_width}×${img_height}／`;
    
        let file_size_sep = ("" + file.size).replace(/(\d)(?=(\d\d\d)+$)/g, "$1,");
        let file_size = document.createElement("span");
        file_size.textContent = `${file_size_sep}byte`;
        if (file.size > file.max_size) {
            file_size.style.backgroundColor = "#ff0";
        }

        let file_type = document.createElement("span");
        file_type.textContent = `／${fileType[1]}`;

        file_info.append(img_size, file_size, file_type);
        file.loading = false;
    }
}

/**
 * ファイル名表示セット
 */
function setFilenameText(text) {
    let filename = document.getElementById("KOSHIAN_form_filename");
    if (filename) {
        filename.textContent = text || INPUT_FILE_TEXT;
    }
}
