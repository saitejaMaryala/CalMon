#!/usr/bin/env bash
# Copy the release APK to a folder in Google Drive (via rclone).
#
# Usage:
#   ./scripts/upload-apk.sh                 # upload as CalMon.apk into the "CalMon" Drive folder (replaces the old one)
#   ./scripts/upload-apk.sh --build         # build the release APK first, then upload
#   ./scripts/upload-apk.sh --dated         # also keep a timestamped copy, e.g. CalMon-2026-11-02_1950.apk
#   ./scripts/upload-apk.sh "Apps/CalMon"   # upload into a different Drive folder
#
# Env overrides: RCLONE_REMOTE (default "gdrive"), APK_NAME (default "CalMon.apk").
#
# One-time setup:
#   1. Install rclone:     sudo apt install rclone
#   2. Connect Drive:      rclone config
#        n (new remote) → name: gdrive → storage: drive → leave client id/secret empty
#        → scope: 1 (full access) → defaults for the rest → "y" to log in with the browser.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
REMOTE="${RCLONE_REMOTE:-gdrive}"
NAME="${APK_NAME:-CalMon.apk}"
FOLDER="CalMon"
BUILD=false
DATED=false

for arg in "$@"; do
  case "$arg" in
    --build) BUILD=true ;;
    --dated) DATED=true ;;
    -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
    -*) echo "Unknown option: $arg (see --help)"; exit 1 ;;
    *) FOLDER="$arg" ;;
  esac
done

die() { printf '\033[1;31merror:\033[0m %s\n' "$*"; exit 1; }
step() { printf '\033[1;35m==> %s\033[0m\n' "$*"; }

# ---------- checks ----------

command -v rclone >/dev/null || die "rclone is not installed. Run: sudo apt install rclone   then: rclone config   (see the top of this script)."
rclone listremotes | grep -qx "${REMOTE}:" || die "No rclone remote named '${REMOTE}'. Run: rclone config   and create a Google Drive remote called '${REMOTE}' (see the top of this script)."

if $BUILD; then
  step "Building the release APK"
  "$ROOT/scripts/build-android.sh" release
fi

[[ -f "$APK" ]] || die "No APK at $APK. Build it first: ./scripts/build-android.sh release   (or run this script with --build)."

AGE_MIN=$(( ($(date +%s) - $(stat -c %Y "$APK")) / 60 ))
echo "APK: $APK ($(du -h "$APK" | cut -f1), built $(date -r "$APK" '+%Y-%m-%d %H:%M'), ${AGE_MIN} min ago)"

# ---------- upload ----------

# rclone (Go) can stall trying IPv6 on networks where only IPv4 works.
if ! curl -6 -s -o /dev/null --max-time 5 https://www.googleapis.com/ 2>/dev/null; then
  export RCLONE_BIND="0.0.0.0"
fi

step "Uploading to Google Drive: ${FOLDER}/${NAME}"
rclone copyto "$APK" "${REMOTE}:${FOLDER}/${NAME}" --progress

if $DATED; then
  DATED_NAME="${NAME%.apk}-$(date -r "$APK" '+%Y-%m-%d_%H%M').apk"
  step "Keeping a dated copy: ${FOLDER}/${DATED_NAME}"
  rclone copyto "$APK" "${REMOTE}:${FOLDER}/${DATED_NAME}" --progress
fi

step "Done"
rclone lsl "${REMOTE}:${FOLDER}" --include '*.apk' 2>/dev/null | sort -k2,3 | tail -5
