#!/usr/bin/env bash
# Release the dev-server port reserved by setup. Setup does not start a process.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node "$ROOT/.paradev/port.mjs" release
