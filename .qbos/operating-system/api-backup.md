# api-backup.md — OpenAI API Fallback Setup
# By Red LLC · RedLantern Studios · Last updated: 2026-06-06

> When Claude usage runs low, builds should not stop.
> This doc sets up the OpenAI API as a parallel execution layer.
> Codex already runs on OpenAI. Claude Code can route to Anthropic API.
> Together: two independent build lanes that don't share a usage pool.

---

## THE TWO API KEYS

| Key | Used by | Pool | Cost model |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Claude Code (when configured) | Separate from Pro/Max account | Pay-per-token |
| `OPENAI_API_KEY` | Codex (always), ChatGPT fallback | OpenAI account | Pay-per-token |

**Default behavior:** Claude Code uses your Pro/Max account (shared 5-hour rolling pool).
**With API key:** Claude Code uses the Anthropic API directly, leaving your account pool untouched.

---

## STEP 1 — GET YOUR ANTHROPIC API KEY

1. Go to: https://console.anthropic.com/settings/keys
2. Create a new key named: `claude-code-build-[repo]`
3. Set a monthly budget cap: $50/month recommended
4. Copy the key — you only see it once

---

## STEP 2 — GET YOUR OPENAI API KEY

1. Go to: https://platform.openai.com/api-keys
2. Create a new key named: `codex-build-[repo]`
3. Set usage limits in billing: $30/month cap recommended
4. Copy the key

---

## STEP 3 — SET ENVIRONMENT VARIABLES

**In Codespace (persists across sessions):**
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-proj-..."

# Reload
source ~/.bashrc
```

**In local VS Code:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-proj-..."
```

**Verify both are set:**
```bash
echo $ANTHROPIC_API_KEY | head -c 20
echo $OPENAI_API_KEY | head -c 20
```

---

## STEP 4 — CONFIGURE CLAUDE CODE TO USE API KEY

Claude Code checks for `ANTHROPIC_API_KEY` in the environment automatically.
When set, it routes to the API instead of the Pro/Max account.

**Verify Claude Code is using the API:**
```bash
claude --version
# If authenticated via API key, usage does not count against your Pro/Max pool
```

To explicitly switch between account and API key:
```bash
# Use API key (does not consume Pro/Max pool)
ANTHROPIC_API_KEY="sk-ant-..." claude

# Use account (consumes Pro/Max pool — no key set)
unset ANTHROPIC_API_KEY
claude
```

---

## ROUTING RULES — WHEN TO USE WHICH

| Situation | Route to |
|---|---|
| Normal session, usage pool healthy | Pro/Max account (default) |
| Usage pool < 30% remaining | Claude Code → Anthropic API key |
| Usage pool empty | Claude Code → Anthropic API key + Codex for build work |
| Heavy Claude Code agentic loops | Anthropic API key (don't burn the account pool) |
| Architectural decisions, strategy | ChatGPT / Noor (OpenAI API) |
| UI component generation | v0 (no API key needed) |
| Implementation < 100 lines | Codex (OpenAI API) |
| Multi-file, complex architecture | Claude Code (Anthropic API key) |

---

## BUDGET CAPS (recommended)

Set these in your API dashboards to prevent surprise bills:

| Service | Monthly cap |
|---|---|
| Anthropic API | $50/month |
| OpenAI API | $30/month |
| Total max exposure | $80/month |

At ~$80/month you have essentially unlimited build capacity on top of your Pro/Max subscription.

---

## EMERGENCY LOW USAGE PROTOCOL

When Claude usage hits the floor mid-session:

```bash
# Step 1 — check remaining window
npx ccusage@latest

# Step 2 — switch Claude Code to API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Step 3 — continue building
claude  # now routes to API, not account pool

# Step 4 — Codex handles implementation
# Open Codex tab in VS Code — it's always on OpenAI API

# Step 5 — Strategy/architecture decisions
# Use ChatGPT or Noor — different pool entirely
```

---

## FALLBACK ROUTING TABLE (full)

| When Claude is limited | Use instead |
|---|---|
| Architecture decisions | ChatGPT (reasoning model) or Noor |
| Strategy, product direction | ChatGPT / Noor — decide before opening Claude |
| UI design, new component | v0 |
| Visual critique | v0 or screenshot to ChatGPT |
| Single-file implementation | Codex (VS Code) |
| Multi-file build | Claude Code on API key |
| Simple edits < 20 lines | VS Code directly |
| Debugging | VS Code debugger + search first |
| Docs | Claude Code on API key or ChatGPT |

---

## CODESPACE PERSISTENCE (set once, always available)

To make both keys persist across all Codespace sessions:

```bash
# Add to repo's .devcontainer/devcontainer.json
{
  "remoteEnv": {
    "ANTHROPIC_API_KEY": "${localEnv:ANTHROPIC_API_KEY}",
    "OPENAI_API_KEY": "${localEnv:OPENAI_API_KEY}"
  }
}
```

Then set both keys as Codespace secrets in GitHub:
Settings → Codespaces → Secrets → New secret

They'll be available automatically in every Codespace session.

---

## SECURITY RULES

- Never commit API keys to any repo
- Never put keys in .env files that are tracked by git
- Add `.env.local` and `.env` to .gitignore before storing keys there
- Rotate keys every 90 days (schedule this)
- Key rotation due: September 3, 2026 (already in scheduled tasks)
