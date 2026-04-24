#!/usr/bin/env bash
set -e

echo "→ biome check..."
bun run check --no-errors-on-unmatched
