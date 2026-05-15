#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PROFILE_NAME="${NOTARY_PROFILE:-MarginlightNotaryProfile}"
BUILT_APP_PATH="src-tauri/target/release/bundle/macos/Marginlight.app"
RELEASE_DIR="${MARGINLIGHT_RELEASE_DIR:-$HOME/Downloads/Marginlight Release}"
FINAL_DMG_PATH="$RELEASE_DIR/Marginlight_0.1.0_aarch64_notarized.dmg"
WORK_DIR="$(mktemp -d /private/tmp/marginlight-release.XXXXXX)"
APP_PATH="$WORK_DIR/Marginlight.app"
DMG_STAGING_DIR="$WORK_DIR/dmg-staging"
DMG_PATH="$WORK_DIR/Marginlight_0.1.0_aarch64_notarized.dmg"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

if ! command -v cargo >/dev/null 2>&1; then
  if [[ -f "$HOME/.cargo/env" ]]; then
    # shellcheck disable=SC1091
    source "$HOME/.cargo/env"
  fi
fi

IDENTITY="${SIGNING_IDENTITY:-}"
if [[ -z "$IDENTITY" ]]; then
  IDENTITY="$(security find-identity -v -p codesigning \
    | sed -n 's/.*"\(Developer ID Application:.*\)".*/\1/p' \
    | head -n 1)"
fi

if [[ -z "$IDENTITY" ]]; then
  echo "No Developer ID Application certificate found."
  echo "Run: npm run release:check"
  exit 1
fi

if ! xcrun notarytool history --keychain-profile "$PROFILE_NAME" >/dev/null 2>&1; then
  echo "No working notarization Keychain profile found: $PROFILE_NAME"
  echo "Run: npm run release:notary-setup"
  exit 1
fi

echo "Using signing identity:"
echo "$IDENTITY"
echo

echo "Building Marginlight..."
npm exec tauri -- build --bundles app

if [[ ! -d "$BUILT_APP_PATH" ]]; then
  echo "Built app was not found at $BUILT_APP_PATH"
  exit 1
fi

echo
echo "Copying app to a clean signing workspace..."
ditto --norsrc --noextattr "$BUILT_APP_PATH" "$APP_PATH"
dot_clean -m "$APP_PATH" 2>/dev/null || true
find "$APP_PATH" -name .DS_Store -delete
xattr -cr "$APP_PATH"
rm -rf "$APP_PATH/Contents/_CodeSignature"

echo
echo "Signing app with hardened runtime..."
codesign --force --timestamp --options runtime --sign "$IDENTITY" "$APP_PATH/Contents/MacOS/marginlight"
codesign --force --timestamp --options runtime --sign "$IDENTITY" "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

echo
echo "Creating public DMG..."
rm -rf "$DMG_STAGING_DIR"
mkdir -p "$DMG_STAGING_DIR"
cp -R "$APP_PATH" "$DMG_STAGING_DIR/"
ln -s /Applications "$DMG_STAGING_DIR/Applications"
hdiutil create \
  -volname "Marginlight" \
  -srcfolder "$DMG_STAGING_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

echo
echo "Signing DMG..."
codesign --force --timestamp --sign "$IDENTITY" "$DMG_PATH"
codesign --verify --verbose=2 "$DMG_PATH"

echo
echo "Submitting DMG for notarization using Keychain profile: $PROFILE_NAME"
xcrun notarytool submit "$DMG_PATH" --keychain-profile "$PROFILE_NAME" --wait

echo
echo "Stapling notarization ticket..."
xcrun stapler staple "$DMG_PATH"
xcrun stapler validate "$DMG_PATH"

echo
echo "Gatekeeper assessment..."
spctl --assess --type open --context context:primary-signature --verbose=4 "$DMG_PATH"

mkdir -p "$RELEASE_DIR"
ditto --norsrc --noextattr "$DMG_PATH" "$FINAL_DMG_PATH"
xattr -cr "$FINAL_DMG_PATH"

echo
echo "Final release validation..."
xcrun stapler validate "$FINAL_DMG_PATH"
spctl --assess --type open --context context:primary-signature --verbose=4 "$FINAL_DMG_PATH"

echo
echo "Release ready:"
echo "$FINAL_DMG_PATH"
