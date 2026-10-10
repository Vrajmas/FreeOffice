#!/bin/zsh
set -euo pipefail
cd "${0:A:h}/.."
ROOT="${PWD}"
WORK="${ROOT}/.build"
OUT="${ROOT}/releases"
CACHE="${ROOT}/.cache/electron"
ELECTRON_VERSION=$(node -p "require('./node_modules/electron/package.json').version")
mkdir -p "$WORK" "$CACHE" "$OUT"
npx tsc --noEmit
for KIND in doc sheet; do
  if [[ "$KIND" == doc ]]; then
    NAME='Personal Documents'
    BUNDLE='local.personaloffice.documents'
    EXT='docx'
    UTI='org.openxmlformats.wordprocessingml.document'
    LABEL='Word document'
  else
    NAME='Personal Spreadsheets'
    BUNDLE='local.personaloffice.spreadsheets'
    EXT='xlsx'
    UTI='org.openxmlformats.spreadsheetml.sheet'
    LABEL='Excel workbook'
  fi
  STAGE="$WORK/$KIND"
  rm -rf "$STAGE"
  mkdir -p "$STAGE/electron" "$STAGE/dist"
  VITE_APP_KIND="$KIND" npx vite build --outDir "$STAGE/dist"
  cp electron/main.cjs electron/preload.cjs "$STAGE/electron/"
  VERSION=$(node -p "require('./package.json').version")
  printf '{"name":"personal-%s","productName":"%s","version":"%s","main":"electron/main.cjs","officeKind":"%s"}\n' "$KIND" "$NAME" "$VERSION" "$KIND" > "$STAGE/package.json"
  python3 - "$STAGE/info.plist" "$EXT" "$UTI" "$LABEL" <<'PY'
import plistlib,sys
path,ext,uti,label=sys.argv[1:]
with open(path,'wb') as file:
    plistlib.dump({'CFBundleDocumentTypes':[{'CFBundleTypeName':label,'CFBundleTypeRole':'Editor','LSHandlerRank':'Owner','LSItemContentTypes':[uti],'CFBundleTypeExtensions':[ext]}]},file)
PY
  npx electron-packager "$STAGE" "$NAME" --platform=darwin --arch=arm64 --out="$WORK/package" --overwrite --electron-version="$ELECTRON_VERSION" --download.cacheRoot="$CACHE" --app-bundle-id="$BUNDLE" --extend-info="$STAGE/info.plist" --icon="assets/$KIND.icns"
  APP="$WORK/package/$NAME-darwin-arm64/$NAME.app"
  codesign --force --deep --sign - "$APP"
  codesign --verify --deep --strict "$APP"
  ditto -c -k --sequesterRsrc --keepParent "$APP" "$OUT/$NAME-macOS.zip"
done
