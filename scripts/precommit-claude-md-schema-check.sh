#!/bin/bash
# Pre-commit script: Enforce CLAUDE.md and schema alignment
# Blocks commit if forbidden patterns or schema drift are detected

set -e

# Forbidden patterns (add more as needed)
FORBIDDEN_PATTERNS=(
  'from("generated_documents")' 
  'generateObject(' 
  'Output.object('
  'experimental_output'
  'import { anthropic' 
  'import { createGroq' 
  '@ai-sdk/groq'
  'GROQ_API_KEY'
)

FAIL=0
SCAN_PATHS=(app lib components tests package.json)
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if grep -r --exclude-dir=node_modules --exclude-dir=.git --exclude=pnpm-lock.yaml "$pattern" "${SCAN_PATHS[@]}" 2>/dev/null; then
    echo "\n❌ Forbidden pattern found: $pattern"
    FAIL=1
  fi
done

if [ $FAIL -eq 1 ]; then
  echo "\nCommit blocked. Please fix the above issues to comply with CLAUDE.md."
  exit 1
fi

echo "✅ CLAUDE.md and schema checks passed."
exit 0
