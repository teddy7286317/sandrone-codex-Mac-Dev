#!/bin/zsh
# PR #6 static app: compile only; never launches or modifies ChatGPT.
set -eu
root="${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
node_path=$(command -v node) || { echo '需要 Node.js 24 或更新版本。'; exit 1; }
"$node_path" -e 'if (+process.versions.node.split(".")[0] < 24) process.exit(1)' || { echo '需要 Node.js 24 或更新版本。'; exit 1; }
target="$HOME/Applications/桑多涅 ChatGPT.app"
icon='/Applications/ChatGPT.app/Contents/Resources/electron.icns'
while (( $# )); do
  case "$1" in
    --output) (( $# >= 2 )) || { echo '缺少 --output 路径'; exit 1; }; target="${2:A}"; shift 2;;
    --icon) (( $# >= 2 )) || { echo '缺少 --icon 路径'; exit 1; }; icon="${2:A}"; shift 2;;
    *) echo '用法：zsh Build-Mac-Static.command [--output /path/Test.app] [--icon /path/Icon.icns]'; exit 1;;
  esac
done
[[ "$target" == *.app ]] || { echo '输出必须是 .app 路径。'; exit 1; }
[[ ! -e "$target" && ! -L "$target" ]] || { echo "目标已存在，不会覆盖：$target"; exit 1; }
[[ -f "$icon" ]] || { echo '未找到应用图标；可用 --icon 指定自己的 .icns。'; exit 1; }
stage=$(/usr/bin/mktemp -d /tmp/sandrone-build.XXXXXXXX)
trap '/bin/rm -rf -- "$stage"' EXIT
bundle="$stage/桑多涅 ChatGPT.app"
/usr/bin/osacompile -o "$bundle" "$root/macos/static/macos-launcher.applescript"
resources="$bundle/Contents/Resources"
for name in macos-skin.mjs macos-skin-utils.mjs renderer.mjs; do /bin/cp "$root/macos/static/$name" "$resources/$name"; done
/bin/cp "$root/themes/sandrone/background.png" "$resources/Sandrone-background.png"
/bin/cp "$icon" "$resources/applet.icns"
/bin/cp "$root/macos/static/README.txt" "$resources/README.txt"
for name in LICENSE ASSET-LICENSE.md THIRD-PARTY-NOTICES.md; do /bin/cp "$root/$name" "$resources/$name"; done
/bin/mkdir -p "$resources/macos" "$resources/docs"
/bin/cp "$root/macos/PR6-SOURCE.md" "$resources/macos/PR6-SOURCE.md"
/bin/cp "$root/docs/MACOS.zh-CN.md" "$resources/docs/MACOS.zh-CN.md"
/bin/cp "$root/macos/upstream.json" "$resources/macos/upstream.json"
/bin/mkdir -p "$resources/themes/sandrone" "$resources/assets"
/bin/cp "$root/themes/sandrone/LICENSE.txt" "$resources/themes/sandrone/LICENSE.txt"
/bin/cp "$root/assets/LICENSE.txt" "$resources/assets/LICENSE.txt"
printf '%s' "$node_path" > "$resources/node-path.txt"
version=$("$node_path" --input-type=module -e 'import {pathToFileURL} from "node:url";const {macVersion}=await import(pathToFileURL(process.argv[1]).href);console.log(macVersion)' "$root/macos/package-info.mjs")
set_plist() {
  local field="$1" type="$2" value="$3"
  /usr/libexec/PlistBuddy -c "Set :$field $value" "$bundle/Contents/Info.plist" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :$field $type $value" "$bundle/Contents/Info.plist"
}
set_plist CFBundleIdentifier string local.sandrone.launcher
set_plist CFBundleDisplayName string '桑多涅靜態背景（0.7.0 基準測試）'
set_plist CFBundleShortVersionString string "$version"
set_plist CFBundleVersion string "$version"
if /usr/libexec/PlistBuddy -c 'Print :CFBundleIconName' "$bundle/Contents/Info.plist" >/dev/null 2>&1; then /usr/libexec/PlistBuddy -c 'Delete :CFBundleIconName' "$bundle/Contents/Info.plist"; fi
"$node_path" "$root/macos/static/build-manifest.mjs" "$resources"
/usr/bin/codesign --force --deep --sign - "$bundle"
/usr/bin/codesign --verify --deep --strict "$bundle"
/bin/mkdir -p "${target:h}"
# Reserve only a new destination. A concurrent existing bundle is never merged.
/bin/mkdir "$target" || { echo "目标已存在，不会覆盖：$target"; exit 1; }
/usr/bin/ditto "$bundle" "$target"
/usr/bin/codesign --verify --deep --strict "$target"
echo "已生成静态版（未启动应用）：$target"
echo '保存工作并完全退出 ChatGPT 后，再从该启动器打开；不要与完整版同时运行。'
