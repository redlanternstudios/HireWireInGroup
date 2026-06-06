#!/bin/bash
# Script: Check for schema drift between Supabase and local migration scripts.
# Requires either SUPABASE_DB_URL for direct pg_dump-style access, or a linked
# Supabase project plus Docker for `supabase db dump`.

set -e

LIVE_SCHEMA_FILE="${LIVE_SCHEMA_FILE:-live_schema.sql}"
LOCAL_SCHEMA_FILE="${LOCAL_SCHEMA_FILE:-local_schema.sql}"

if [ -n "$SUPABASE_DB_URL" ]; then
  supabase db dump --schema public --db-url "$SUPABASE_DB_URL" > "$LIVE_SCHEMA_FILE"
else
  supabase db dump --schema public --file "$LIVE_SCHEMA_FILE"
fi

# Concatenate canonical local migration scripts.
cat supabase/migrations/*.sql > "$LOCAL_SCHEMA_FILE"

# Compare schemas (ignoring whitespace and comments)
diff <(grep -vE '^--|^$' "$LIVE_SCHEMA_FILE" | sed 's/ //g') <(grep -vE '^--|^$' "$LOCAL_SCHEMA_FILE" | sed 's/ //g') || {
  echo "\n❌ Schema drift detected between Supabase and local migration scripts."
  exit 1
}

echo "✅ No schema drift detected."
exit 0
