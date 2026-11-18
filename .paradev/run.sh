#!/usr/bin/env bash
# Start the Astro dev server on this workspace's reserved port.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="$(node "$ROOT/.paradev/port.mjs" reserve)"

HOST="127.0.0.1"
if [[ "${SUPERSET_ENV:-local}" == "cloud" ]]; then
  HOST="0.0.0.0"
fi

cd "$ROOT/site"
echo "Starting Astro dev server at http://${HOST}:${PORT}"
exec npm run dev -- --host "$HOST" --port "$PORT"
