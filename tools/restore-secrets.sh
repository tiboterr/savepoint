#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCLAW_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
SECRETS_DIR="$ROOT/.secrets-backup"
ENCRYPTED_PATH="$SECRETS_DIR/openclaw-secrets.tar.gpg"
ARCHIVE_PATH="$SECRETS_DIR/openclaw-secrets.tar"
RESTORE_DIR="$SECRETS_DIR/restore"

if [ ! -f "$ENCRYPTED_PATH" ]; then
  echo "[restore-secrets] Missing encrypted archive: $ENCRYPTED_PATH" >&2
  exit 1
fi

rm -rf "$RESTORE_DIR"
mkdir -p "$RESTORE_DIR"

gpg --decrypt --output "$ARCHIVE_PATH" "$ENCRYPTED_PATH"
tar -xf "$ARCHIVE_PATH" -C "$RESTORE_DIR"

if [ -f "$RESTORE_DIR/openclaw/openclaw.json" ]; then
  mkdir -p "$OPENCLAW_HOME"
  cp -a "$RESTORE_DIR/openclaw/openclaw.json" "$OPENCLAW_HOME/openclaw.json"
fi

if [ -d "$RESTORE_DIR/openclaw/credentials" ]; then
  mkdir -p "$OPENCLAW_HOME"
  rm -rf "$OPENCLAW_HOME/credentials"
  cp -a "$RESTORE_DIR/openclaw/credentials" "$OPENCLAW_HOME/credentials"
fi

if [ -f "$RESTORE_DIR/mission-control/client_secret_google_calendar.json" ]; then
  mkdir -p "$ROOT/mission-control-arpagona"
  cp -a "$RESTORE_DIR/mission-control/client_secret_google_calendar.json" "$ROOT/mission-control-arpagona/client_secret_927532005604-vievvriirtf85gfr04rotaqnna60h9l6.apps.googleusercontent.com.json"
fi

if [ -f "$RESTORE_DIR/mission-control/.env" ]; then
  cp -a "$RESTORE_DIR/mission-control/.env" "$ROOT/mission-control-arpagona/.env"
fi

if [ -f "$RESTORE_DIR/mission-control/.env.local" ]; then
  cp -a "$RESTORE_DIR/mission-control/.env.local" "$ROOT/mission-control-arpagona/.env.local"
fi

rm -f "$ARCHIVE_PATH"

echo "[restore-secrets] Secrets restored. Restart OpenClaw/Mission Control as needed."
