#!/bin/bash
set -Ceu
cd `dirname $0`

TARGET_DIR="./koshian_form_futaba"
OUTPUT_DIR=".."

script_dir=$(cd $(dirname $0); pwd)
echo "script_dir = $script_dir"
addon_name=${script_dir##*/}
echo "addon_name = $addon_name"
addon_ver=$(jq ".version" ${TARGET_DIR}/manifest.json)
echo "addon_ver = $addon_ver"
filename="${OUTPUT_DIR}/${addon_name}-${addon_ver:1:-1}.zip"
echo "filename = $filename"

cd ${TARGET_DIR}
zip -r -9 ${filename} * -x "*.bak" ".eslint*"
