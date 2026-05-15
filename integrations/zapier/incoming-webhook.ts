// Example incoming webhook endpoint for Zapier to call into your app
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Handle incoming data from Zapier
  const { eventType, payload } = req.body

  // TODO: Route eventType/payload to your app logic

  return res.status(200).json({ received: true, eventType, payload })
}
