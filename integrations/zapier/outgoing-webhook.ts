// Archived: Dead code from Pages Router era. See /archive/integrations/zapier/outgoing-webhook.ts
// Example outgoing webhook handler for Zapier integration
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Example: Send event to Zapier webhook
  const { eventType, payload } = req.body;
  const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  if (!zapierWebhookUrl) {
    return res.status(500).json({ error: "Zapier webhook URL not configured" });
  }

  try {
    const response = await fetch(zapierWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, payload }),
    });
    if (!response.ok) {
      throw new Error("Zapier webhook failed");
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
