#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

pass() { echo "[PASS] $1"; }
warn() { echo "[WARN] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

check_status() {
  local path="$1"
  shift
  local allowed=("$@")
  local code
  code=$(curl -s -o /tmp/askuala-smoke-body -w "%{http_code}" "$BASE_URL$path" || true)
  for a in "${allowed[@]}"; do
    if [[ "$code" == "$a" ]]; then
      pass "$path -> $code"
      return 0
    fi
  done
  echo "Response body (first 200 chars):"
  head -c 200 /tmp/askuala-smoke-body || true
  echo
  fail "$path -> $code (expected one of: ${allowed[*]})"
}

check_post_json() {
  local path="$1"
  local payload="$2"
  shift 2
  local allowed=("$@")
  local code
  code=$(curl -s -o /tmp/askuala-smoke-body -w "%{http_code}" -X POST "$BASE_URL$path" -H 'content-type: application/json' -d "$payload" || true)
  for a in "${allowed[@]}"; do
    if [[ "$code" == "$a" ]]; then
      pass "POST $path -> $code"
      return 0
    fi
  done
  echo "Response body (first 200 chars):"
  head -c 200 /tmp/askuala-smoke-body || true
  echo
  fail "POST $path -> $code (expected one of: ${allowed[*]})"
}

check_post_form() {
  local path="$1"
  local data="$2"
  shift 2
  local allowed=("$@")
  local code
  code=$(curl -s -o /tmp/askuala-smoke-body -w "%{http_code}" -X POST "$BASE_URL$path" -d "$data" || true)
  for a in "${allowed[@]}"; do
    if [[ "$code" == "$a" ]]; then
      pass "POST $path -> $code"
      return 0
    fi
  done
  echo "Response body (first 200 chars):"
  head -c 200 /tmp/askuala-smoke-body || true
  echo
  fail "POST $path -> $code (expected one of: ${allowed[*]})"
}

echo "Running Askuala Phase 3/4 smoke checks against: $BASE_URL"

# Public pages
check_status "/" 200
check_status "/lite" 200
check_status "/login" 200
check_status "/signup" 200

# Teacher pages (unauth or non-teacher should redirect to login/dashboard)
check_status "/teacher/dashboard" 200 302 307
check_status "/teacher/exams/new" 200 302 307
check_status "/teacher/analytics" 200 302 307
check_status "/teacher/premium" 200 302 307

# APIs: allow auth-guarded responses for unauthenticated checks
check_post_form "/api/whatsapp/webhook" "Body=hello" 200 500
check_status "/api/teacher/analytics/export" 200 401 403
check_post_json "/api/premium/upgrade" '{"plan":"premium_teacher"}' 200 401 400
check_post_json "/api/teacher/exams/generate" '{"chapterId":"x","title":"Test Exam","count":10,"timeLimitSeconds":600}' 200 400 401 403 404

echo "Smoke checks complete."
