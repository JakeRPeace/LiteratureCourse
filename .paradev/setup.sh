#!/usr/bin/env bash
# Install site dependencies, copy local env files, and reserve a dev-server port.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to install site dependencies" >&2
  exit 1
fi

echo "Installing site dependencies"
npm ci --prefix "$ROOT/site"

copy_file() {
  local rel="$1"
  local src="${SUPERSET_ROOT_PATH%/}/$rel"
  local dest="$ROOT/$rel"
  if [[ ! -f "$src" ]]; then
    return 0
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo "Copied $rel"
}

# Copy untracked env files from the main checkout. Ignored files such as .env
# are included. node_modules and example templates are not.
if [[ -n "${SUPERSET_ROOT_PATH:-}" ]]; then
  src_root="$(cd "$SUPERSET_ROOT_PATH" && pwd)"
  if [[ "$src_root" != "$ROOT" && -e "$src_root/.git" ]]; then
    while IFS= read -r -d '' rel; do
      case "$rel" in
        node_modules/* | */node_modules/* | .git/* | */.git/*) continue ;;
        *.example | *.sample) continue ;;
        .env | .env.* | */.env | */.env.* | *.local | */*.local)
          copy_file "$rel"
          ;;
      esac
    done < <(
      git -C "$src_root" ls-files --others -z --exclude-standard
      git -C "$src_root" ls-files --others -z --ignored --exclude-standard
    )
  fi
fi

if [[ ! -f "$ROOT/site/.env" && -f "$ROOT/site/.env.example" ]]; then
  cp "$ROOT/site/.env.example" "$ROOT/site/.env"
  echo "Seeded site/.env from site/.env.example"
fi

node "$ROOT/.paradev/port.mjs" reserve >/dev/null
