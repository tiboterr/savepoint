#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TIMESTAMP="$(date -Iseconds)"
BRANCH="$(git branch --show-current 2>/dev/null || echo master)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[backup] Not a git repository: $ROOT" >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "[backup] Missing git remote 'origin'. Configure a GitHub repo first." >&2
  exit 2
fi

git add -A

if git diff --cached --quiet; then
  echo "[backup] No changes to save."
  exit 0
fi

if ! git config user.name >/dev/null; then
  git config user.name "OpenClaw Backup"
fi

if ! git config user.email >/dev/null; then
  git config user.email "openclaw-backup@local"
fi

HOSTNAME_SHORT="$(hostname -s 2>/dev/null || hostname || echo unknown-host)"
COMMIT_MSG="backup: ${TIMESTAMP} (${HOSTNAME_SHORT})"

git commit -m "$COMMIT_MSG"
git push origin "$BRANCH"

echo "[backup] Pushed $COMMIT_MSG to origin/$BRANCH"
