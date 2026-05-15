#!/usr/bin/env bash
set -euo pipefail

PROFILE_NAME="${1:-MarginlightNotaryProfile}"

echo "This stores Apple notarization credentials in your Mac Keychain."
echo "Codex will not see your app-specific password."
echo
read -r -p "Apple ID email: " APPLE_ID
read -r -p "Apple Developer Team ID: " TEAM_ID
echo
echo "Paste your Apple app-specific password below."
echo "This is NOT your normal Apple ID password."
echo "Create one at https://account.apple.com/account/manage if you do not have it yet."
echo
read -r -s -p "App-specific password: " APP_PASSWORD
echo
echo

xcrun notarytool store-credentials "$PROFILE_NAME" \
  --apple-id "$APPLE_ID" \
  --team-id "$TEAM_ID" \
  --password "$APP_PASSWORD" \
  --validate

echo
echo "Saved Keychain profile: $PROFILE_NAME"
echo "You can now run: npm run release:mac"
