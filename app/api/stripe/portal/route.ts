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
}
