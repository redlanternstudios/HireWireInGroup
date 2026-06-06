import { createHash } from "crypto"

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortForHash(value))
}

export function createVerificationHash(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex")
}

function sortForHash(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value

  if (Array.isArray(value)) {
    return value.map(sortForHash)
  }

  const record = value as Record<string, unknown>
  return Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((next, key) => {
      next[key] = sortForHash(record[key])
      return next
    }, {})
}
