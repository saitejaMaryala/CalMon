#!/usr/bin/env bash
# Build the CalMon Android app.
#
# The first run downloads ~2-2.5 GB (Gradle, Android NDK + CMake, Maven libraries),
# so run it on a fast network. Later builds reuse the cache and need almost no network.
#
# Usage:
#   ./scripts/build-android.sh                 # debug build for the emulator (needs `npx expo start` to run)
#   ./scripts/build-android.sh release         # standalone APK for phones + emulator, no dev server needed
#   ./scripts/build-android.sh debug --install # build, then install on the connected emulator/phone
#
# Env overrides: ANDROID_HOME (default ~/Android/Sdk), ARCHS (e.g. "arm64-v8a,x86_64").

set -euo pipefail

MODE="${1:-debug}"
INSTALL=false
for arg in "$@"; do [[ "$arg" == "--install" ]] && INSTALL=true; done
if [[ "$MODE" != "debug" && "$MODE" != "release" ]]; then
  [[ "$MODE" == "--install" ]] && MODE=debug || { echo "Usage: $0 [debug|release] [--install]"; exit 1; }
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/build-android.log"
: > "$LOG"

step() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*"; exit 1; }

# ---------- checks ----------

step "Checking tools"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
[[ -d "$ANDROID_HOME" ]] || die "Android SDK not found at $ANDROID_HOME (set ANDROID_HOME)."
command -v java >/dev/null || die "Java not found. Install JDK 17+ (e.g. sudo apt install openjdk-17-jdk)."
JAVA_MAJOR=$(java -version 2>&1 | sed -nE 's/.*version "([0-9]+).*/\1/p' | head -1)
(( JAVA_MAJOR >= 17 )) || die "Java $JAVA_MAJOR found; JDK 17+ is required."
command -v node >/dev/null || die "Node.js not found."
echo "Android SDK: $ANDROID_HOME | Java $JAVA_MAJOR | Node $(node -v)"

step "Checking disk space"
FREE_GB=$(df -BG --output=avail "$HOME" | tail -1 | tr -dc '0-9')
echo "${FREE_GB} GB free in $HOME"
(( FREE_GB >= 10 )) || warn "Less than 10 GB free; the first build may run out of space."

step "Checking network"
# On some networks IPv6 is broken while IPv4 works; Java and Node then hang trying IPv6 first.
if ! curl -6 -s -o /dev/null --max-time 5 https://services.gradle.org/; then
  echo "IPv6 unavailable: forcing Java and Node to use IPv4."
  export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Djava.net.preferIPv4Stack=true"
  export NODE_OPTIONS="${NODE_OPTIONS:-} --dns-result-order=ipv4first"
fi
for host in services.gradle.org dl.google.com repo.maven.apache.org; do
  curl -4 -s -o /dev/null --max-time 10 "https://$host/" || die "Cannot reach $host. Check your internet connection."
done
SPEED=$(curl -4 -sL -o /dev/null --max-time 8 -w '%{speed_download}' \
  https://services.gradle.org/distributions/gradle-9.3.1-bin.zip || true)
SPEED=${SPEED:-0}; SPEED_KB=$(( ${SPEED%.*} / 1024 ))
echo "Download speed: ~${SPEED_KB} KB/s"
(( SPEED_KB >= 500 )) || warn "Slow connection. The first build downloads ~2 GB and may take a long time."

# ---------- project setup ----------

if [[ ! -d node_modules ]]; then
  step "Installing npm packages"
  npm install 2>&1 | tee -a "$LOG"
fi

if [[ ! -f android/gradlew ]]; then
  step "Generating the android/ project (expo prebuild)"
  npx expo prebuild --platform android --no-install 2>&1 | tee -a "$LOG"
fi

# A download interrupted earlier leaves a .part file behind; clear it so Gradle starts clean.
find "$HOME/.gradle/wrapper/dists" -maxdepth 3 -name '*.zip.part' -print -delete 2>/dev/null || true

# ---------- build ----------

if [[ "$MODE" == "debug" ]]; then
  TASK="app:assembleDebug"; ARCHS="${ARCHS:-x86_64}"; APK_DIR="android/app/build/outputs/apk/debug"
else
  TASK="app:assembleRelease"; ARCHS="${ARCHS:-arm64-v8a,x86_64}"; APK_DIR="android/app/build/outputs/apk/release"
fi

step "Building $MODE APK for $ARCHS (log: $LOG)"
ok=false
for attempt in 1 2 3; do
  if (cd android && ./gradlew "$TASK" -PreactNativeArchitectures="$ARCHS" --console=plain) 2>&1 | tee -a "$LOG"; then
    ok=true; break
  fi
  warn "Build attempt $attempt failed; retrying (downloads resume from the cache)..."
  sleep 5
done
$ok || die "Build failed after 3 attempts. See $LOG"

APK=$(ls -t "$APK_DIR"/*.apk 2>/dev/null | head -1)
[[ -n "$APK" ]] || die "Build finished but no APK found in $APK_DIR"
step "Built: $APK ($(du -h "$APK" | cut -f1))"

# ---------- install ----------

if $INSTALL; then
  ADB="$ANDROID_HOME/platform-tools/adb"
  [[ -x "$ADB" ]] || ADB=adb
  if "$ADB" devices | grep -qE '\s(device)$'; then
    step "Installing on device"
    "$ADB" install -r "$APK"
    [[ "$MODE" == "debug" ]] && echo "Now run: npx expo start --dev-client   (then open CalMon on the device)"
  else
    warn "No emulator/phone connected; skipping install. Start one and run: adb install -r $APK"
  fi
fi

echo
echo "Done. Later builds reuse the downloaded cache and are much faster."
