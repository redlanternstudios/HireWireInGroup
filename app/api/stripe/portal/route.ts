<<<<<<< HEAD
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  const stripeCustomerId = userData?.stripe_customer_id
  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer ID found' }, { status: 400 })
  }

  const { return_url } = await req.json()

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: return_url || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/billing',
  })

  return NextResponse.json({ url: session.url })
=======
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
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
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
}
