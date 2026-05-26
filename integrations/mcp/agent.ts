export async function sendMcpEvent(eventType: string, payload: any) {
  // If MCP_RELAY_URL is set, send to external MCP server
  // Otherwise, relay through /api/mcp/relay for internal routing
  const mcpUrl = process.env.MCP_RELAY_URL || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/mcp/relay`;

  if (!mcpUrl || mcpUrl === '/api/mcp/relay') {
    // If no external MCP is configured, this will use the internal relay
    // which will route to any configured MCP receivers
    try {
      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, payload }),
      });
      return await response.json();
    } catch (err) {
      console.error('[MCP] Failed to relay event:', err);
      return { status: 'error', received: false };
    }
  }

  // If an external MCP URL is configured, send directly to it
  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mcp-secret': process.env.MCP_RELAY_SECRET || '',
      },
      body: JSON.stringify({ eventType, payload }),
    });
    return await response.json();
  } catch (err) {
    console.error('[MCP] Failed to send event to external MCP:', err);
    return { status: 'error', received: false };
  }
}
