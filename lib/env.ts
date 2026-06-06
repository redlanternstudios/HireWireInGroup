/**
 * HireWire Environment Configuration
 *
 * This module validates required environment variables at startup
 * and provides typed access to configuration values.
 */

// Required environment variables
const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

type RequiredEnv = (typeof REQUIRED_ENV)[number]

export interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

/**
 * Validates environment variables and returns typed config
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = []

  // Check required vars — SUPABASE_SERVICE_ROLE_KEY accepts SUPABASE_SECRET_KEY as alias
  for (const key of REQUIRED_ENV) {
    const alias = key === "SUPABASE_SERVICE_ROLE_KEY" ? "SUPABASE_SECRET_KEY" : undefined
    if (!process.env[key] && !(alias && process.env[alias])) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `Please add these to your .env.local file or Vercel environment variables.`
    )
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Accept SUPABASE_SECRET_KEY as alias (set by Supabase integration under that name)
    SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!,
  }
}

/**
 * Get environment config (cached)
 */
let cachedConfig: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv()
  }
  return cachedConfig
}
