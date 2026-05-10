// Coach deterministic renderer stub
import { CoachOutput, Claim, ArtifactType } from "./types"

export function renderArtifact(claims: Claim[], artifact_type: ArtifactType, version: string): CoachOutput {
  // TODO: Implement deterministic rendering logic per RENDERING_RULES.md
  // For now, return a stub with joined claim text
  const rendered = claims.map(c => `- ${c.text}`).join("\n")
  return {
    claims,
    artifact_type,
    version,
    rendered,
    quality: { passed: true, hardFails: [], warnings: [] },
  }
}
