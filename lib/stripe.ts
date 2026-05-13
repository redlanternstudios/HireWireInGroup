import "server-only"

import Stripe from "stripe"

let stripeClient: Stripe | null = null

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
    typescript: true,
  })

  return stripeClient
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

// HireWire Pro subscription price ID
export const HIREWIRE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "price_1THcItD8NguWaPm7NyeP7qid"
