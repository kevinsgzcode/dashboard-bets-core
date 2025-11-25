#!/usr/bin/env bash
set -o errexit

# Install pnpm
corepack enable
corepack prepare pnpm@10.17.1 --activate

# Install dependencies
pnpm install --frozen-lockfile
