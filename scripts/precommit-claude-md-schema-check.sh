#!/bin/bash
# Pre-commit script: Enforce CLAUDE.md and schema alignment
# Blocks commit if forbidden patterns or schema drift are detected

set -e

# Forbidden patterns (add more as needed)
FORBIDDEN_PATTERNS=(
  'getSession()' 
  'createAdminClient()' 
  'from("profiles")' 
  'from("resumes")' 
  'from("jobs_deprecated")' 
  'from("generated_documents")' 
  'from("user_profile.links")' 
  'from("byred_' 
  'from("os_' 
  'status: "ready"' 
  'generateObject(' 
  'import { anthropic' 
  'import { createGroq' 
)

FAIL=0
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if grep -r --exclude-dir=node_modules --exclude-dir=.git --exclude=pnpm-lock.yaml "$pattern" .; then
    echo "\n❌ Forbidden pattern found: $pattern"
    FAIL=1
  fi
done

# Check for missing tenant isolation/soft delete in queries
if grep -r --include=*.ts --exclude-dir=node_modules --exclude-dir=.git '.from("jobs")' . | grep -vE '\.eq\("user_id",|\.is\("deleted_at", null\)'; then
  echo "\n❌ jobs queries missing tenant isolation or soft delete filter"
  FAIL=1
fi

# Check for missing requireUser in API routes
if grep -r --include=route.ts --exclude-dir=node_modules --exclude-dir=.git 'export async function' app/api | grep -v 'requireUser'; then
  echo "\n❌ API route missing requireUser auth guard"
  FAIL=1
fi

if [ $FAIL -eq 1 ]; then
  echo "\nCommit blocked. Please fix the above issues to comply with CLAUDE.md."
  exit 1
fi

echo "✅ CLAUDE.md and schema checks passed."
exit 0
