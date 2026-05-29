export async function sendMcpEvent(eventType: string, payload: any) {
  const externalRelayUrl = process.env.MCP_RELAY_URL?.trim()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const mcpUrl = externalRelayUrl || (siteUrl ? `${siteUrl}/api/mcp/relay` : null)

  if (!mcpUrl) {
    return { status: 'skipped', received: false }
  }

  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(externalRelayUrl ? { 'x-mcp-secret': process.env.MCP_RELAY_SECRET || '' } : {}),
      },
      body: JSON.stringify({ eventType, payload }),
    });
    return await response.json();
  } catch (err) {
    console.error('[MCP] Failed to relay event:', err);
    return { status: 'error', received: false };
  }
}
