import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/require-user"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth

    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    if (!userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please upgrade first." },
        { status: 400 }
      )
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${origin}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[hirewire] Stripe portal error:", error)
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 })
  }
}
