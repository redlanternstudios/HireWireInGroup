#!/bin/bash
# Script: Check for schema drift between Supabase and local migration scripts
# Requires: supabase CLI, jq

set -e

# Export live schema from Supabase
supabase db dump --schema public --db-url $SUPABASE_DB_URL > live_schema.sql

# Concatenate all local migration scripts
cat scripts/*.sql > local_schema.sql

# Compare schemas (ignoring whitespace and comments)
diff <(grep -vE '^--|^$' live_schema.sql | sed 's/ //g') <(grep -vE '^--|^$' local_schema.sql | sed 's/ //g') || {
  echo "\n❌ Schema drift detected between Supabase and local migration scripts."
  exit 1
}

echo "✅ No schema drift detected."
exit 0
