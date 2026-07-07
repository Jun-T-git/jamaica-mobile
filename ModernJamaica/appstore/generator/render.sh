#!/usr/bin/env bash
# App Store スクリーンショット生成スクリプト
# build.mjs で各スライドの HTML を生成し、ヘッドレス Chrome で
# 正確なピクセルサイズ(6.9" = 1290×2796)の PNG に書き出す。さらに sips で
# 6.5"(1284×2778)のフォールバックも生成する。
#
# 使い方:  cd appstore/generator && ./render.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/out"
DST_69="$HERE/../screenshots/iphone-6.9"
DST_65="$HERE/../screenshots/iphone-6.5"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$OUT" "$DST_69" "$DST_65"

echo "▶ HTML を生成..."
node "$HERE/build.mjs"

echo "▶ Chrome で PNG(6.9\" 1290×2796)にレンダリング..."
for f in "$OUT"/*.html; do
  b="$(basename "$f" .html)"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1290,2796 \
    --default-background-color=00000000 \
    --screenshot="$DST_69/$b.png" "$f" >/dev/null 2>&1
done

echo "▶ sips で 6.5\"(1284×2778)フォールバックを生成..."
for f in "$DST_69"/*.png; do
  b="$(basename "$f")"
  sips -z 2778 1284 "$f" --out "$DST_65/$b" >/dev/null 2>&1
done

echo "✅ 完了:"
echo "   6.9\" → $DST_69"
echo "   6.5\" → $DST_65"
