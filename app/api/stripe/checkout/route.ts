import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/require-user"
import { stripe, HIREWIRE_PRO_PRICE_ID } from "@/lib/stripe"

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout session for Pro upgrade.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth

    const body = await request.json()
    const { plan } = body

    if (plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single()

    let customerId = userData?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL
    if (!origin) {
      return NextResponse.json(
        { error: "Missing application URL configuration" },
        { status: 500 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: HIREWIRE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/billing?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      allow_promotion_codes: true,
      metadata: { user_id: userId, plan: "pro" },
      subscription_data: {
        metadata: { user_id: userId, plan: "pro" },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[stripe/checkout] error:", error)
    if (error instanceof Error && error.message.includes("No such price")) {
      return NextResponse.json(
        { error: "Invalid price configuration. Please contact support." },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
