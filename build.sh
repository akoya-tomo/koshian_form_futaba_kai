#!/bin/bash
set -Ceu
cd `dirname $0`

TARGET_DIR="./koshian_form_futaba"
OUTPUT_DIR=".."

script_dir=$(cd $(dirname $0); pwd)
addon_name=${script_dir##*/}
addon_ver=$(jq ".version" ${TARGET_DIR}/manifest.json)
filename="${OUTPUT_DIR}/${addon_name}-${addon_ver:1:-1}.zip"

cd ${TARGET_DIR}
zip -q -r -9 ${filename} * -x "*.bak" ".eslint*"
