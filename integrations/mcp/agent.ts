export async function sendMcpEvent(eventType: string, payload: any) {
  console.log(
    "[MCP scaffold] Receiver not configured; event recorded locally only:",
    eventType,
    payload,
  );
  return {
    status: "scaffold" as const,
    message: "MCP receiver is not configured yet",
    received: true,
  };
}
