import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { HireWireLogo } from "@/components/hirewire-logo"

// Virgil Abloh / Off-White diagonal stripe corner accent
function AblohStripeCorner({
  position,
}: {
  position: "top-left" | "bottom-right"
}) {
  const isTopLeft = position === "top-left"
  return (
    <div
      className={`absolute w-36 h-36 pointer-events-none ${
        isTopLeft ? "top-0 left-0" : "bottom-0 right-0"
      }`}
      style={{ opacity: 0.18 }}
    >
      <svg
        viewBox="0 0 144 144"
        fill="none"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Diagonal stripes — Abloh signature spacing */}
        {[-60, -40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160].map((offset) => (
          <line
            key={offset}
            x1={offset}
            y1={0}
            x2={offset + 144}
            y2={144}
            stroke="#ffffff"
            strokeWidth="10"
          />
        ))}
      </svg>
    </div>
  )
}

const STATS = [
  { value: "85%", label: "Match accuracy" },
  { value: "10x", label: "Faster prep" },
  { value: "100%", label: "Evidence-backed" },
]

export function LandingHero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#7B1212" }}>
      {/* Abloh corner stripes */}
      <AblohStripeCorner position="top-left" />
      <AblohStripeCorner position="bottom-right" />

      {/* Subtle inner vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28 flex flex-col items-center text-center">

        {/* HireWire logo image — barbed wire graffiti mark */}
        <div className="w-full max-w-sm md:max-w-xl">
          <HireWireLogo variant="light" size="xl" />
        </div>
        {/* Abloh-style quotation marks label — pulled tight against logo bottom */}
        <p className="text-white/60 text-sm tracking-[0.25em] uppercase -mt-3 mb-10 md:mb-14 font-mono text-center">
          {'"Career OS"'}
        </p>

        {/* Divider — barbed wire style thin rule */}
        <div className="w-24 h-px bg-white/20 mb-10" />

        {/* Headline */}
        <h2
          className="font-serif text-white text-4xl md:text-5xl font-medium tracking-tight text-balance mb-5 leading-[1.1]"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.2)" }}
        >
          Know Before You Apply
        </h2>

        {/* Body */}
        <p className="text-white/70 text-base md:text-lg max-w-lg leading-relaxed mb-10 text-balance">
          Stop guessing. HireWire scores your real fit against every job and
          generates evidence-backed materials — so you only invest time in
          roles worth pursuing.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-14">
          <Button
            size="lg"
            className="gap-2 text-base px-8 font-semibold"
            style={{
              backgroundColor: "#ffffff",
              color: "#7B1212",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            }}
            asChild
          >
            <Link href="/signup">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex flex-row gap-10 md:gap-16 justify-center">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p
                className="font-serif text-white text-2xl md:text-3xl font-bold leading-none mb-1"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.2)" }}
              >
                {value}
              </p>
              <p className="text-white/50 text-xs tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Bottom label — Abloh inspired */}
        <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase font-mono mt-10">
          Trusted by professionals who value their time.
        </p>
      </div>
    </section>
  )
}
