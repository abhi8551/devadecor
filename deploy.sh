#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if [ -z "$(git status --porcelain)" ]; then
    echo "Nothing to deploy — no changes detected."
    exit 0
fi

git add -A
git commit -m "Update products $(date +%Y-%m-%d_%H:%M)"
git push origin main

echo "Deployed successfully."
