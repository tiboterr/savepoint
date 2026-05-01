#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCLAW_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
SECRETS_DIR="$ROOT/.secrets-backup"
STAGING_DIR="$SECRETS_DIR/staging"
ARCHIVE_PATH="$SECRETS_DIR/openclaw-secrets.tar"
ENCRYPTED_PATH="$SECRETS_DIR/openclaw-secrets.tar.gpg"
MANIFEST_PATH="$SECRETS_DIR/MANIFEST.txt"

mkdir -p "$STAGING_DIR"
rm -rf "$STAGING_DIR"/*

copy_if_exists() {
  local src="$1"
  local rel="$2"
  if [ -e "$src" ]; then
    mkdir -p "$STAGING_DIR/$(dirname "$rel")"
    cp -a "$src" "$STAGING_DIR/$rel"
    echo "$rel" >> "$MANIFEST_PATH"
  fi
}

: > "$MANIFEST_PATH"
copy_if_exists "$OPENCLAW_HOME/openclaw.json" "openclaw/openclaw.json"
copy_if_exists "$OPENCLAW_HOME/credentials" "openclaw/credentials"
copy_if_exists "$ROOT/mission-control-arpagona/client_secret_927532005604-vievvriirtf85gfr04rotaqnna60h9l6.apps.googleusercontent.com.json" "mission-control/client_secret_google_calendar.json"
copy_if_exists "$ROOT/mission-control-arpagona/.env" "mission-control/.env"
copy_if_exists "$ROOT/mission-control-arpagona/.env.local" "mission-control/.env.local"

if [ ! -s "$MANIFEST_PATH" ]; then
  echo "[secrets-backup] No secret files found to archive." >&2
  exit 1
fi

tar -cf "$ARCHIVE_PATH" -C "$STAGING_DIR" .
rm -f "$ENCRYPTED_PATH"

gpg --symmetric --cipher-algo AES256 --output "$ENCRYPTED_PATH" "$ARCHIVE_PATH"
rm -f "$ARCHIVE_PATH"
rm -rf "$STAGING_DIR"

echo "[secrets-backup] Encrypted archive created: $ENCRYPTED_PATH"
echo "[secrets-backup] Manifest: $MANIFEST_PATH"
