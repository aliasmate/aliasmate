#!/usr/bin/env bash
# Build a standalone aliasmate executable (no Node.js needed on the target
# machine) using esbuild + Node SEA (Single Executable Applications).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="${1:-build}"
mkdir -p "$OUT"

# 1. Bundle the whole CLI (deps included) into one CommonJS file.
npx esbuild src/index.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=cjs \
  --minify \
  --outfile="$OUT/bundle.cjs"

# 2. Prepare the SEA blob.
cat > "$OUT/sea-config.json" <<JSON
{
  "main": "$OUT/bundle.cjs",
  "output": "$OUT/sea-prep.blob",
  "disableExperimentalSEAWarning": true
}
JSON
node --experimental-sea-config "$OUT/sea-config.json"

# 3. Copy the local node binary and inject the blob into it.
BIN="$OUT/aliasmate"
if [[ "${OS:-}" == "Windows_NT" ]]; then BIN="$BIN.exe"; fi
node -e "require('fs').copyFileSync(process.execPath, '$BIN')"
chmod +x "$BIN" 2>/dev/null || true

SENTINEL="NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"
case "$(uname -s)" in
  Darwin)
    codesign --remove-signature "$BIN"
    npx postject "$BIN" NODE_SEA_BLOB "$OUT/sea-prep.blob" \
      --sentinel-fuse "$SENTINEL" --macho-segment-name NODE_SEA
    codesign --sign - "$BIN"
    ;;
  *)
    npx postject "$BIN" NODE_SEA_BLOB "$OUT/sea-prep.blob" --sentinel-fuse "$SENTINEL"
    ;;
esac

echo "✓ built $BIN"
"$BIN" --version
