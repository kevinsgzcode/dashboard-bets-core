#!/usr/bin/env bash
set -e

curl -fsSL https://get.pnpm.io/install.sh | sh -

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

pnpm install --prod
