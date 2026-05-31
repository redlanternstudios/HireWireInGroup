// One-off: grant lifetime Pro (premium) access to a test account.
// Mirrors the canonical Stripe-webhook fulfillment shape (users + subscriptions).
// Run: node --env-file-if-exists=/vercel/share/.env.project scripts/grant-premium-test-user.mjs
import { createClient } from "@supabase/supabase-js"

const EMAIL = "Johnnytestone@yopmail.com"
const FALLBACK_USER_ID = "57c76a77-7780-47d8-9583-95509149372c"
const LIFETIME_END = "2099-12-31T00:00:00.000Z" // "lifetime" period end

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !serviceKey) {
  throw new Error("Missing Supabase URL or service role key in env")
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

// Resolve the auth user id by email (fall back to known id from logs).
let userId = FALLBACK_USER_ID
try {
  // listUsers is paginated; search a few pages for the email.
  let page = 1
  let found = null
  while (page <= 10 && !found) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) break
    found = data.users.find((u) => (u.email || "").toLowerCase() === EMAIL.toLowerCase())
    if (data.users.length < 200) break
    page++
  }
  if (found) userId = found.id
} catch (e) {
  console.warn("Could not resolve user by email, using fallback id:", e?.message)
}

console.log("[grant] Target user id:", userId)

const now = new Date().toISOString()

// Ensure a row exists in public.users, then set premium fields.
const { error: upsertErr } = await admin
  .from("users")
  .upsert(
    {
      id: userId,
      email: EMAIL,
      plan_type: "pro",
      subscription_status: "active",
      current_period_end: LIFETIME_END,
      updated_at: now,
    },
    { onConflict: "id" },
  )
if (upsertErr) throw upsertErr
console.log("[grant] users row set to pro/active")

// Mirror into subscriptions (matches webhook fulfillment).
const { error: subErr } = await admin
  .from("subscriptions")
  .upsert(
    {
      user_id: userId,
      plan_type: "pro",
      status: "active",
      current_period_end: LIFETIME_END,
      metadata: { source: "manual_test_grant", note: "lifetime premium for QA" },
    },
    { onConflict: "user_id" },
  )
if (subErr) console.warn("[grant] subscriptions upsert warning:", subErr.message)
else console.log("[grant] subscriptions row set to pro/active")

// Verify
const { data: verify } = await admin
  .from("users")
  .select("id, email, plan_type, subscription_status, current_period_end")
  .eq("id", userId)
  .maybeSingle()
console.log("[grant] Verified users row:", verify)
console.log("[grant] Done.")
