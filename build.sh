#!/bin/bash
set -Ceu
cd `dirname $0`

TARGET_DIR="./koshian_form_futaba"
OUTPUT_DIR="./"

script_dir=$(cd $(dirname $0); pwd)
addon_name=${script_dir##*/}
addon_ver=$(jq ".version" ${TARGET_DIR}/manifest.json)
filename="${OUTPUT_DIR}/${addon_name}-${addon_ver:1:-1}.zip"

cd ${TARGET_DIR}
grep -v -e '^\s*//.\+' -e '^\s*/\*' -e '^\s*\*' res_body.js | sed -e 's/\s*\/\/.\+//g' >| res_body.min.js
cat res_header.js <(echo) encoding.min.js <(echo) res_body.min.js >| res.js

zip -q -r -9 ${filename} * -x "*.bak" "res_*.js" "encoding*.js" ".eslint*"