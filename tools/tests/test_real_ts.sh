#!/usr/bin/env bash
# Compile the real frontend toUserPreferences.ts to JS, run it via Node, and
# feed its output through the Python integration tests in test_real_ts.py.
#
# This catches drift between the Python sim in wizard_sim.py and the actual
# compiled TypeScript.
#
# Run from repo root:
#     bash tools/tests/test_real_ts.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
FRONTEND="$REPO_ROOT/frontend"
COMPILED="$HERE/_compiled"
OUTPUT_JSON="$HERE/_compiled/wizard_outputs.json"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found in PATH"
  exit 2
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx not found in PATH"
  exit 2
fi

# Clean and recompile
rm -rf "$COMPILED"
mkdir -p "$COMPILED"

# Compile from outside the frontend dir so tsc doesn't pick up tsconfig.json.
# --moduleResolution Bundler strips .js extensions, so we patch them back in.
cd /tmp
npx --prefix "$FRONTEND" tsc \
  --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck \
  --strict false --outDir "$COMPILED" \
  "$FRONTEND/src/lib/toUserPreferences.ts" \
  "$FRONTEND/src/types/preferences.ts" > /dev/null

# Add .js to the relative import so Node ESM can resolve it.
# BSD sed (macOS) needs the -i.bak idiom; we delete the backup right after.
sed -i.bak 's|from "\(\.\./types/preferences\)"|from "\1.js"|g' "$COMPILED/lib/toUserPreferences.js"
rm -f "$COMPILED/lib/toUserPreferences.js.bak"

# Run the Node driver with cwd = tools/tests so the import path '_compiled/...' resolves.
cd "$HERE"
node "$HERE/wizard_driver.mjs" > "$OUTPUT_JSON"

if [ ! -s "$OUTPUT_JSON" ]; then
  echo "ERROR: wizard_driver.mjs produced no output"
  exit 1
fi

# Hand off to the Python comparator
exec python3 "$HERE/test_real_ts.py" "$OUTPUT_JSON"
