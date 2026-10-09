#!/usr/bin/env bash
# Installs the owner portrait and points the environment at it.
#
# Each Next application serves its own public/ directory, so the file has to exist in
# both or it will render on one surface and 404 on the other. This does both copies and
# updates .env in one step.
#
#   scripts/set-owner-photo.sh ~/Downloads/my-photo.jpg
set -euo pipefail

src="${1:-}"
if [ -z "$src" ]; then
  echo "usage: $(basename "$0") <path-to-image>" >&2
  exit 64
fi
if [ ! -f "$src" ]; then
  echo "error: no such file: $src" >&2
  exit 66
fi

root="$(cd "$(dirname "$0")/.." && pwd)"

# Keep the real extension: it decides the Content-Type the browser is served.
ext="$(printf '%s' "${src##*.}" | tr '[:upper:]' '[:lower:]')"
case "$ext" in
  jpg | jpeg | png | webp | avif) ;;
  *)
    echo "error: unsupported image type '.$ext' (use jpg, jpeg, png, webp or avif)" >&2
    exit 65
    ;;
esac

filename="owner.${ext}"
for app in public admin; do
  dest="${root}/apps/${app}/public/brand/${filename}"
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo "installed ${dest#"${root}/"}"
done

# Point the env var at the new file, replacing any previous value.
env_file="${root}/.env"
if [ -f "$env_file" ]; then
  if grep -q '^NEXT_PUBLIC_OWNER_IMAGE=' "$env_file"; then
    sed -i "s|^NEXT_PUBLIC_OWNER_IMAGE=.*|NEXT_PUBLIC_OWNER_IMAGE=/brand/${filename}|" "$env_file"
  else
    printf 'NEXT_PUBLIC_OWNER_IMAGE=/brand/%s\n' "$filename" >>"$env_file"
  fi
  echo "set NEXT_PUBLIC_OWNER_IMAGE=/brand/${filename} in .env"
else
  echo "warning: no .env found - set NEXT_PUBLIC_OWNER_IMAGE=/brand/${filename} yourself" >&2
fi

cat <<'NEXT'

Next: NEXT_PUBLIC_* values are baked in at build time, so rebuild the images.

  docker compose up -d --build

Also set NEXT_PUBLIC_OWNER_NAME in .env to the name that should appear beside it.
NEXT
