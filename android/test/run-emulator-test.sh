#!/usr/bin/env bash
# Installs the debug APK on a running emulator and runs the smoke test.
# Usage: run-emulator-test.sh <app-debug.apk> <output-dir>
set -euo pipefail
APK="$1"
OUT="$2"
PKG=io.github.wildcs.migraineease
HERE="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$OUT"
adb install -r "$APK"
adb shell am start -W -n "$PKG/.MainActivity"
sleep 6
status=0
node "$HERE/smoke.mjs" "$OUT" || status=$?
adb logcat -d > "$OUT/logcat.txt" || true
exit $status
