#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Marginlight macOS release prerequisites"
echo

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Missing Xcode command line tools. Run: xcode-select --install"
  exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
  if [[ -f "$HOME/.cargo/env" ]]; then
    # shellcheck disable=SC1091
    source "$HOME/.cargo/env"
  fi
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "Missing Rust/Cargo. Install Rust from https://rustup.rs/"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Missing npm. Install Node.js first."
  exit 1
fi

identity_count="$(security find-identity -v -p codesigning | grep -c 'Developer ID Application' || true)"

if [[ "$identity_count" == "0" ]]; then
  echo "No Developer ID Application certificate was found in Keychain."
  echo
  echo "Open Xcode -> Settings -> Accounts -> Manage Certificates..."
  echo "Then add: Developer ID Application"
  echo
  echo "After that, run this check again."
  exit 1
fi

echo "Found Developer ID Application signing identity:"
security find-identity -v -p codesigning | grep 'Developer ID Application' || true
echo
echo "Prerequisites look ready."
