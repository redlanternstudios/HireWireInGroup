"use client"

import { useState } from "react"

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: window.location.origin + "/billing" }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Unable to open billing portal")
        setLoading(false)
      }
    } catch {
      alert("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
    >
      {loading ? "Opening…" : "Manage Billing"}
    </button>
  )
}
