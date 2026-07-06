#!/usr/bin/env sh
# AliasMate installer — no Node.js or npm required.
#   curl -fsSL https://raw.githubusercontent.com/aliasmate/aliasmate/main/install.sh | sh
set -eu

REPO="aliasmate/aliasmate"

os="$(uname -s)"
arch="$(uname -m)"
case "$os" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *)
    echo "Unsupported OS: $os"
    echo "On Windows, download aliasmate-win-x64.exe from:"
    echo "  https://github.com/$REPO/releases/latest"
    exit 1
    ;;
esac
case "$arch" in
  x86_64 | amd64) arch=x64 ;;
  arm64 | aarch64) arch=arm64 ;;
  *)
    echo "Unsupported architecture: $arch"
    exit 1
    ;;
esac

asset="aliasmate-$os-$arch"
url="https://github.com/$REPO/releases/latest/download/$asset"

# Prefer a user-writable bin dir; fall back to /usr/local/bin with sudo.
bin_dir="$HOME/.local/bin"
mkdir -p "$bin_dir"

echo "Downloading $asset ..."
tmp="$(mktemp)"
if command -v curl >/dev/null 2>&1; then
  curl -fSL --progress-bar "$url" -o "$tmp"
else
  wget -qO "$tmp" "$url"
fi
chmod +x "$tmp"
mv "$tmp" "$bin_dir/aliasmate"

echo "✓ installed to $bin_dir/aliasmate"
"$bin_dir/aliasmate" --version

case ":$PATH:" in
  *":$bin_dir:"*) ;;
  *)
    echo ""
    echo "Note: $bin_dir is not on your PATH. Add this to your shell config:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    ;;
esac

echo ""
echo "Get started:  aliasmate"
