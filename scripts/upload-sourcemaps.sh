#!/usr/bin/env bash
# =============================================================================
# GlitchTip Native Source Maps Inject & Upload Script
# =============================================================================
set -uo pipefail

AUTH_TOKEN="${1:-${GLITCHTIP_AUTH_TOKEN:-${SENTRY_AUTH_TOKEN:-}}}"
RELEASE="${2:-${SENTRY_RELEASE:-${NEXT_PUBLIC_SENTRY_RELEASE:-prod-$(git rev-parse HEAD 2>/dev/null || echo "local-test-$(date +%s)")}}}"
ORG="${GLITCHTIP_ORG:-${SENTRY_ORG:-inshop}}"
PROJECT="${3:-${GLITCHTIP_PROJECT:-${SENTRY_PROJECT:-inshop-app}}}"
URL="${GLITCHTIP_URL:-${SENTRY_URL:-https://errors.inshop.social}}"

echo "=========================================================="
echo "         GlitchTip Source Maps Upload (Native CLI)        "
echo "=========================================================="
echo "URL:          $URL"
echo "Org:          $ORG"
echo "Project:      $PROJECT"
echo "Release:      $RELEASE"
echo "=========================================================="

if [ -z "$AUTH_TOKEN" ]; then
  echo ""
  echo "❌ Error: GlitchTip API Auth Token is missing!"
  echo "Usage: ./scripts/upload-sourcemaps.sh <TOKEN> [RELEASE] [PROJECT]"
  exit 1
fi

if [ ! -d ".next" ]; then
  echo "❌ .next not found! Please run 'npm run build' first."
  exit 1
fi

if [ -x "./node_modules/.bin/sentry-cli" ]; then
  CLI="./node_modules/.bin/sentry-cli"
elif command -v sentry-cli >/dev/null 2>&1; then
  CLI="sentry-cli"
elif [ -x "./bin/glitchtip-cli" ]; then
  CLI="./bin/glitchtip-cli"
elif command -v glitchtip-cli >/dev/null 2>&1; then
  CLI="glitchtip-cli"
else
  CLI="npx @sentry/cli"
fi

export SENTRY_URL="$URL"
export SENTRY_AUTH_TOKEN="$AUTH_TOKEN"
export SENTRY_ORG="$ORG"
export SENTRY_PROJECT="$PROJECT"

echo ""
echo "--- 1. Creating Release: ${RELEASE} ---"
curl -s -X POST \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"version\": \"${RELEASE}\", \"projects\": [\"${PROJECT}\"]}" \
  "${URL}/api/0/organizations/${ORG}/releases/" || echo "Release create returned non-zero (may already exist)"

echo ""
echo "--- 2. Injecting Debug IDs into .next ---"
$CLI sourcemaps inject .next

echo ""
echo "--- 3. Uploading Client Static Source Maps (~/_next/static) ---"
$CLI sourcemaps upload .next/static \
  --release "$RELEASE" \
  --url-prefix "~/_next/static" \
  --org "$ORG" \
  --project "$PROJECT" || echo "Static upload warning (some chunks may have skipped)"

echo ""
echo "--- 4. Uploading Server Source Maps (~/_next/server) ---"
$CLI sourcemaps upload .next/server \
  --release "$RELEASE" \
  --url-prefix "~/_next/server" \
  --org "$ORG" \
  --project "$PROJECT" \
  --ignore "*.edge.js" || echo "Server upload warning (some chunks may have skipped)"

echo ""
echo "=========================================================="
echo "🎉 Done! Check your release and files in GlitchTip:"
echo "   ${URL}/${ORG}/releases/${RELEASE}"
echo "=========================================================="
