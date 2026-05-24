#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <target-directory>" >&2
    exit 1
fi

TARGET="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$TARGET/docs" "$TARGET/skills"

echo "Copying docs..."
cp -r "$SCRIPT_DIR/docs/." "$TARGET/docs/"

echo "Copying skills..."
for domain_dir in "$SCRIPT_DIR/skills"/*/; do
    [ -d "$domain_dir" ] || continue
    for skill_dir in "$domain_dir"*/; do
        [ -d "$skill_dir" ] || continue
        skill_name="$(basename "$skill_dir")"
        cp -r "$skill_dir" "$TARGET/skills/$skill_name"
        echo "  $skill_name"
    done
done

echo "Done → $TARGET"
