# MCP Integration Guide

This folder contains a scaffold for integrating with a Model Context Protocol (MCP) agent or service.

## Usage

- integrations/mcp/agent.ts: Example function to send events to an MCP agent/service.
- Replace the placeholder logic with your actual MCP SDK or API calls.

## Typical Integration Patterns

- HTTP POST to an MCP endpoint
- Use an official MCP SDK if available
- Wire MCP events to key application actions (job created, resume generated, etc.)

## Security

- Always validate outbound and inbound data.
- Do not expose secrets in code.

---

For advanced usage, provide your MCP agent details or SDK documentation.
