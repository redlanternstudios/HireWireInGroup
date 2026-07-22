# HireWire Career Command Plugin

This is a skill-only Codex plugin package intended to appear in the Codex Plugins/Skills popup menu.

## Included skills
- **Resume** — `/resume`
- **HireWire Subagents** — `/hwsubs`

## Installation intent
Install or publish this repository package through Codex/ChatGPT Plugins > Skills. Set the installation policy to **Installed** for the intended workspace role so both skills appear in the popup menu.

## Conflict rule
`/hwsubs` orchestrates the application workflow. `/resume` exclusively owns resume generation, formatting, audit, rebuild, and verification. Resume output must pass `/resume verify` before `/hwsubs` may assemble or release an application pack.

## Canonical source
The full resume standard remains in `.claudex/skills/resume/SKILL.md`; the Codex skill delegates to it to prevent formula drift between Claudex, Codex, and HireWire.
