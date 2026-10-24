#!/usr/bin/env bash
# Starts a fresh E2E stack, runs the real-backend Playwright suite against it,
# saves the stack logs and removes everything. Extra arguments go to
# `playwright test` (e.g. --grep "sign up", --project chromium, --ui).
#
#   BACKEND_DIR=<path>  backend checkout to build (default: ../inshop-back-end)
#   KEEP_STACK=1        leave the stack running afterwards, for debugging
#   SKIP_BUILD=1        reuse the images from the previous run
set -euo pipefail

STACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$STACK_DIR/../.." && pwd)"
export BACKEND_DIR="${BACKEND_DIR:-$APP_DIR/../inshop-back-end}"
LOG_DIR="$APP_DIR/test-results/e2e-real-stack"

if [ ! -f "$BACKEND_DIR/Dockerfile" ]; then
  echo "Backend checkout not found at $BACKEND_DIR; set BACKEND_DIR." >&2
  exit 1
fi

compose() {
  docker compose -f "$STACK_DIR/docker-compose.e2e.yml" "$@"
}

cleanup() {
  mkdir -p "$LOG_DIR"
  compose logs --no-color >"$LOG_DIR/stack.log" 2>&1 || true
  echo "Stack logs: $LOG_DIR/stack.log"
  if [ "${KEEP_STACK:-0}" = 1 ]; then
    echo "Stack left running. Stop it with: docker compose -f $STACK_DIR/docker-compose.e2e.yml down -v"
  else
    compose down -v --remove-orphans >/dev/null 2>&1 || true
  fi
}

# Never reuse data from an earlier run
compose down -v --remove-orphans >/dev/null 2>&1 || true
trap cleanup EXIT

build_flag=--build
if [ "${SKIP_BUILD:-0}" = 1 ]; then
  build_flag=
fi
compose up -d --wait $build_flag

cd "$APP_DIR"
npx playwright test -c e2e-real/playwright.config.ts "$@"
