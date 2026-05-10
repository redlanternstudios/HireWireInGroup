import Image from "next/image"

const SIZE_MAP: Record<string, number> = {
  sm: 80,
  md: 120,
  lg: 160,
  xl: 220,
}

// CSS filter variants for the logo on different backgrounds
const VARIANT_FILTER: Record<string, string | undefined> = {
  // Original full-color logo (red + black) — for light/warm backgrounds
  color: undefined,
  // White version — for dark backgrounds (auth dark mode, emails)
  white: "brightness(0) invert(1)",
  // "light" is an alias for "white" — kept for backwards compatibility
  light: "brightness(0) invert(1)",
  // Pure red — accent usage
  red: "brightness(0) saturate(100%) invert(13%) sepia(74%) saturate(3000%) hue-rotate(340deg) brightness(80%)",
  // Black/dark — for light backgrounds without red
  dark: "brightness(0)",
}

export function HireWireLogo({
  className,
  variant = "color",
  size = "md",
}: {
  className?: string
  variant?: "color" | "white" | "light" | "red" | "dark"
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const width = SIZE_MAP[size] ?? 120
  const height = Math.round(width * 0.45)

  return (
    <Image
      src="/brand/hirewire-logo.png"
      alt="HireWire"
      width={width}
      height={height}
      className={className}
      style={VARIANT_FILTER[variant] ? { filter: VARIANT_FILTER[variant] } : undefined}
      priority
    />
  )
}
