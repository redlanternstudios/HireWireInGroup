import Image from "next/image"

const SIZE_MAP: Record<string, number> = {
  sm: 80,
  md: 120,
  lg: 160,
  xl: 220,
}

const VARIANT_FILTER: Record<string, string | undefined> = {
  dark: undefined,
  light: "brightness(0) invert(1)",
  red: "brightness(0) saturate(100%) invert(13%) sepia(74%) saturate(3000%) hue-rotate(340deg) brightness(80%)",
}

export function HireWireLogo({
  className,
  variant = "dark",
  size = "md",
}: {
  className?: string
  variant?: "dark" | "light" | "red"
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const width = SIZE_MAP[size] ?? 120
  const height = Math.round(width * 0.45)

  return (
    <Image
      src="/images/hirewire-logo.png"
      alt="HireWire"
      width={width}
      height={height}
      className={className}
      style={VARIANT_FILTER[variant] ? { filter: VARIANT_FILTER[variant] } : undefined}
      priority
    />
  )
}
