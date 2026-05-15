import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, FileText, Play, Target, TrendingUp, Zap } from "lucide-react"

// Logo renders with width-controlled sizing and height:auto to preserve exact
// aspect ratio — never pass a fixed height or Next.js Image will compress it.
function Logo({ desktop = 230, mobile = 160, white = false }: { desktop?: number, mobile?: number, white?: boolean }) {
  const filter = white ? { filter: "brightness(0) invert(1)" } : {}
  return (
    <>
      {/* Desktop */}
      <Image
        src="/brand/hirewire-logo.png"
        alt="HireWire"
        width={desktop}
        height={Math.round(desktop * (1024 / 1536))}
        priority
        className="hidden md:block"
        style={{
          width: `${desktop}px`,
          height: "auto",
          imageRendering: "crisp-edges",
          ...(filter.filter ? { filter: filter.filter } : {}),
        }}
      />
      {/* Mobile */}
      <Image
        src="/brand/hirewire-logo.png"
        alt="HireWire"
        width={mobile}
        height={Math.round(mobile * (1024 / 1536))}
        priority
        className="md:hidden"
        style={{
          width: `${mobile}px`,
          height: "auto",
          imageRendering: "crisp-edges",
          ...(filter.filter ? { filter: filter.filter } : {}),
        }}
      />
    </>
  )
}

export default function SplashPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#F5F2EE", color: "#090909", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
    >
      {/* ─── NAV ─── */}
      <header style={{ backgroundColor: "#F5F2EE", borderBottom: "1px solid #DDD6CE" }}>
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 1440, margin: "0 auto", padding: "0 48px", height: 84 }}
        >
          {/* logo — subtle red ambient glow, width-controlled, height:auto */}
          <div
            className="flex-shrink-0"
            style={{
              filter: "drop-shadow(0 0 18px rgba(216, 0, 0, 0.08))",
              marginRight: 40,
            }}
          >
            <Logo desktop={230} mobile={160} />
          </div>

          {/* center nav */}
          <nav className="hidden md:flex items-center flex-1" style={{ gap: 28 }}>
            {[
              { label: "HOW IT WORKS", href: "#how-it-works" },
              { label: "WHY HIREWIRE", href: "#why-hirewire" },
              { label: "PRICING", href: "/billing" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#3A3835",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
            <span
              style={{
                width: 1,
                height: 16,
                backgroundColor: "#DDD6CE",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <Link
              href="/login"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#3A3835",
                whiteSpace: "nowrap",
              }}
            >
              SIGN IN
            </Link>
          </nav>

          {/* CTA */}
          <Link
            href="/signup"
            className="hidden md:inline-flex items-center gap-2 flex-shrink-0"
            style={{
              backgroundColor: "#D80000",
              color: "#fff",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.08em",
              padding: "11px 22px",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            GET STARTED <ArrowRight size={14} />
          </Link>

          {/* mobile: logo + hamburger in one row */}
          <div className="md:hidden flex items-center justify-between w-full" style={{ paddingLeft: 0 }}>
            <div style={{ filter: "drop-shadow(0 0 14px rgba(216, 0, 0, 0.08))" }}>
              <Logo desktop={230} mobile={160} />
            </div>
            <Link
              href="/signup"
              style={{
                backgroundColor: "#D80000",
                color: "#fff",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: "0.06em",
                padding: "9px 18px",
                borderRadius: 4,
              }}
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section
        className="relative"
        style={{ backgroundColor: "#F5F2EE", minHeight: 640, overflow: "hidden" }}
      >
        {/* diagonal stripe accent — far left edge */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 bottom-0 hidden md:block"
          style={{
            width: 64,
            background: "repeating-linear-gradient(135deg, #090909 0px, #090909 10px, transparent 10px, transparent 22px)",
            zIndex: 1,
          }}
        />
        {/* mobile stripe */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 bottom-0 md:hidden"
          style={{
            width: 34,
            background: "repeating-linear-gradient(135deg, #090909 0px, #090909 8px, transparent 8px, transparent 18px)",
            zIndex: 1,
          }}
        />

        {/* barbed wire — behind card, right side */}
        <div
          aria-hidden="true"
          className="absolute hidden md:block"
          style={{
            right: 48,
            top: "50%",
            transform: "translateY(-50%)",
            width: 560,
            height: 480,
            zIndex: 0,
            opacity: 0.06,
            backgroundImage: "radial-gradient(ellipse at 60% 50%, #D80000 0%, transparent 70%)",
          }}
        />

        {/* ─── hero inner ─── */}
        <div
          className="relative"
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 72px",
            display: "flex",
            alignItems: "center",
            minHeight: 640,
            gap: 48,
            zIndex: 2,
          }}
        >
          {/* LEFT COLUMN */}
          <div
            className="flex-shrink-0"
            style={{
              width: "42%",
              paddingLeft: 40,
              paddingTop: 48,
              paddingBottom: 48,
            }}
          >
            {/* eyebrow */}
            <div
              className="inline-flex items-center gap-2"
              style={{
                backgroundColor: "#D80000",
                color: "#fff",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.12em",
                padding: "4px 10px",
                marginBottom: 20,
              }}
            >
              CAREER OS
              <span style={{ display: "flex", gap: 2 }}>
                {[0,1,2,3].map(i => (
                  <span key={i} style={{ width: 2, height: 10, backgroundColor: "rgba(255,255,255,0.6)", display: "inline-block" }} />
                ))}
              </span>
            </div>

            {/* headline */}
            <h1
              style={{
                fontSize: "clamp(52px, 6.5vw, 88px)",
                fontWeight: 900,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                color: "#090909",
                marginBottom: 24,
              }}
            >
              KNOW BEFORE
              <br />
              YOU{" "}
              <span style={{ color: "#D80000" }}>APPLY.</span>
            </h1>

            {/* body */}
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: "#3A3835",
                marginBottom: 32,
                maxWidth: 400,
              }}
            >
              HireWire turns each job into a clear application strategy so you know what to fix, what to say, and when you are ready.
            </p>

            {/* buttons */}
            <div className="flex flex-col sm:flex-row" style={{ gap: 12, marginBottom: 28 }}>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#D80000",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  padding: "14px 24px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                }}
              >
                ANALYZE A JOB <ArrowRight size={15} />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "transparent",
                  color: "#090909",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  padding: "14px 24px",
                  borderRadius: 4,
                  border: "1.5px solid #090909",
                  textTransform: "uppercase",
                }}
              >
                <Play size={13} fill="#090909" /> SEE HOW IT WORKS
              </Link>
            </div>

            {/* trust row */}
            <div className="flex items-center flex-wrap" style={{ gap: 20 }}>
              {[
                { icon: <Target size={13} />, label: "No guesswork" },
                { icon: <FileText size={13} />, label: "No templates" },
                { icon: <Zap size={13} />, label: "Just clarity" },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: 12, color: "#3A3835", fontWeight: 500 }}
                >
                  <span style={{ color: "#D80000" }}>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — dashboard card */}
          <div
            className="hidden md:flex flex-1 items-center justify-center"
            style={{ paddingTop: 40, paddingBottom: 40 }}
          >
            <DashboardCard />
          </div>
        </div>

        {/* mobile dashboard card */}
        <div className="md:hidden px-5 pb-10">
          <DashboardCard />
        </div>
      </section>

      {/* ─── OUTCOME STRIP ─── */}
      <OutcomeStrip />

      {/* ─── FINAL CTA BAND ─── */}
      <CtaBand />

      {/* ─── FOOTER ─── */}
      <footer style={{ backgroundColor: "#F5F2EE", borderTop: "1px solid #DDD6CE", padding: "40px 72px 24px" }}>
        <div
          className="flex flex-col md:flex-row md:items-start justify-between gap-10"
          style={{ maxWidth: 1440, margin: "0 auto" }}
        >
          {/* brand */}
          <div style={{ maxWidth: 220 }}>
            <div style={{ filter: "drop-shadow(0 0 12px rgba(216,0,0,0.07))", marginBottom: 12 }}>
              <Logo desktop={140} mobile={120} />
            </div>
            <p style={{ fontSize: 11, color: "#3A3835", lineHeight: 1.6 }}>
              Built by RedLantern Studios™<br />By Red, LLC
            </p>
          </div>

          {/* nav columns */}
          <div className="flex flex-wrap gap-10">
            {[
              {
                heading: "PRODUCT",
                links: [
                  { label: "How it works", href: "#how-it-works" },
                  { label: "Why HireWire", href: "#why-hirewire" },
                  { label: "Pricing", href: "/billing" },
                ],
              },
              {
                heading: "ACCOUNT",
                links: [
                  { label: "Sign in", href: "/login" },
                  { label: "Get started", href: "/signup" },
                  { label: "Dashboard", href: "/dashboard" },
                ],
              },
              {
                heading: "COMPANY",
                links: [
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                ],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "#090909",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  {heading}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {links.map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      style={{ fontSize: 13, color: "#3A3835", textDecoration: "none" }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* bottom bar */}
        <div
          style={{
            maxWidth: 1440,
            margin: "28px auto 0",
            paddingTop: 16,
            borderTop: "1px solid #DDD6CE",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 11, color: "#999" }}>
            &copy; {new Date().getFullYear()} RedLantern Studios™. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ─── DASHBOARD PREVIEW CARD ─── */
function DashboardCard() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 560,
        backgroundColor: "#111010",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 0 80px rgba(216,0,0,0.28), 0 24px 64px rgba(0,0,0,0.6)",
        overflow: "hidden",
        color: "#fff",
      }}
    >
      {/* card top bar */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/brand/hirewire-logo.png"
            alt="HireWire"
            width={80}
            height={53}
            style={{ width: "80px", height: "auto", filter: "brightness(0) invert(1)" }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
            }}
          >
            ROLE INTELLIGENCE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} style={{ color: "#22c55e" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Saved</span>
          </div>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", lineHeight: 1 }}>⋮</span>
        </div>
      </div>

      {/* job title */}
      <div style={{ padding: "14px 18px 0" }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>Senior Product Manager</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Fintech · San Diego, CA</p>
      </div>

      {/* metrics row */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          margin: "14px 0 0",
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* readiness */}
        <div style={{ backgroundColor: "#111010", padding: "14px 18px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>
            JOB READINESS SCORE
          </p>
          <p style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 8 }}>74%</p>
          <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 6, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: "74%",
                borderRadius: 2,
                background: "linear-gradient(to right, #D80000, #f59e0b, #22c55e)",
              }}
            />
          </div>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.08em" }}>
            STRONG FIT
            <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500 }}> WITH MISSING PROOF</span>
          </p>
        </div>

        {/* resume match */}
        <div style={{ backgroundColor: "#111010", padding: "14px 18px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>
            RESUME MATCH
          </p>
          <p style={{ fontSize: 36, fontWeight: 900, color: "#22c55e", lineHeight: 1, marginBottom: 6 }}>82%</p>
          <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>Strong</p>
        </div>

        {/* cover letter */}
        <div style={{ backgroundColor: "#111010", padding: "14px 18px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>
            COVER LETTER STATUS
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>Not started</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Needs attention</p>
        </div>
      </div>

      {/* missing evidence + coach suggestion */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 1fr", gap: 1, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 1 }}
      >
        {/* missing evidence */}
        <div style={{ backgroundColor: "#111010", padding: "14px 18px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>
            MISSING EVIDENCE
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { color: "#D80000", label: "Leadership metrics" },
              { color: "#f59e0b", label: "Platform ownership" },
              { color: "#22c55e", label: "Revenue impact" },
              { color: "rgba(255,255,255,0.3)", label: "User research depth" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/signup"
            style={{
              marginTop: 14,
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
              textDecoration: "none",
            }}
          >
            View all gaps <ArrowRight size={11} />
          </Link>
        </div>

        {/* coach suggestion */}
        <div style={{ backgroundColor: "#111010", padding: "14px 18px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>
            COACH SUGGESTION
          </p>
          <span style={{ fontSize: 28, color: "#D80000", lineHeight: 1, display: "block", marginBottom: 6 }}>&quot;</span>
          <p style={{ fontSize: 13, color: "#fff", lineHeight: 1.45, fontWeight: 500 }}>
            Add one strong proof point about impact or ownership before applying.
          </p>
          <div className="flex items-center gap-2" style={{ marginTop: 14 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 11 }}>🤖</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>AI Coach</span>
          </div>
        </div>
      </div>

      {/* application package */}
      <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 12 }}>
          APPLICATION PACKAGE
        </p>
        <div className="flex items-center justify-between">
          <div className="flex" style={{ gap: 24 }}>
            {["Resume", "Cover Letter", "Follow Up Plan"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <FileText size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                <div>
                  <p style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{item}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Not started</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/signup"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "#D80000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            <ArrowRight size={13} color="#fff" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── OUTCOME STRIP ─── */
function OutcomeStrip() {
  const items = [
    {
      icon: <FileText size={22} />,
      title: "UNDERSTAND\nTHE ROLE",
      body: "Decode the posting and what really matters.",
      href: "/signup",
    },
    {
      icon: <Target size={22} />,
      title: "FIND\nRESUME GAPS",
      body: "See what's missing before you hit apply.",
      href: "/signup",
    },
    {
      icon: <Zap size={22} />,
      title: "GENERATE\nAPPLICATION ASSETS",
      body: "Create stronger resumes, letters, and follow ups.",
      href: "/signup",
    },
    {
      icon: <TrendingUp size={22} />,
      title: "TRACK\nWHAT WORKS",
      body: "Measure responses and improve over time.",
      href: "/signup",
    },
  ]

  return (
    <section
      id="how-it-works"
      style={{ borderTop: "1px solid #DDD6CE", borderBottom: "1px solid #DDD6CE", backgroundColor: "#FFFDF8" }}
    >
      {/* why-hirewire anchor target sits here — same section */}
      <span id="why-hirewire" style={{ display: "block", visibility: "hidden", height: 0 }} />

      <div
        className="grid"
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          gridTemplateColumns: "repeat(4, 1fr)",
          padding: "0 72px",
        }}
      >
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-start gap-4"
            style={{
              padding: "28px 24px 28px 0",
              borderRight: i < 3 ? "1px solid #DDD6CE" : "none",
              paddingLeft: i > 0 ? 24 : 0,
              textDecoration: "none",
              transition: "background-color 0.15s",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D80000",
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#090909",
                  textTransform: "uppercase",
                  lineHeight: 1.3,
                  whiteSpace: "pre-line",
                  marginBottom: 6,
                }}
              >
                {item.title}
              </p>
              <p style={{ fontSize: 13, color: "#3A3835", lineHeight: 1.5 }}>{item.body}</p>
            </div>
            <ArrowRight size={14} style={{ flexShrink: 0, color: "#3A3835", marginTop: 2 }} />
          </Link>
        ))}
      </div>

      {/* mobile outcome strip */}
      <div className="md:hidden" style={{ padding: "0 20px" }}>
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center gap-3"
            style={{
              padding: "16px 0",
              borderBottom: i < 3 ? "1px solid #DDD6CE" : "none",
              textDecoration: "none",
            }}
          >
            <span style={{ color: "#D80000" }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#090909" }}>
                {item.title.replace("\n", " ")}
              </p>
              <p style={{ fontSize: 12, color: "#3A3835", marginTop: 2 }}>{item.body}</p>
            </div>
            <ArrowRight size={14} style={{ color: "#3A3835", flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ─── CTA BAND ─── */
function CtaBand() {
  return (
    <section
      style={{
        backgroundColor: "#050505",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* diagonal stripe on right */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 bottom-0 hidden md:block"
        style={{
          width: 100,
          background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 10px, transparent 10px, transparent 22px)",
        }}
      />

      <div
        className="relative flex flex-col md:flex-row items-center justify-between gap-8"
        style={{ maxWidth: 1440, margin: "0 auto", padding: "52px 72px", zIndex: 1 }}
      >
        {/* left — logo */}
        <div className="flex-shrink-0">
          <Image
            src="/brand/hirewire-logo.png"
            alt="HireWire"
            width={160}
            height={107}
            style={{ width: "160px", height: "auto", filter: "brightness(0) saturate(100%) invert(13%) sepia(74%) saturate(3000%) hue-rotate(340deg) brightness(80%)" }}
          />
        </div>

        {/* center — copy */}
        <div style={{ flex: 1, maxWidth: 480 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 0.95,
              color: "#fff",
              marginBottom: 12,
            }}
          >
            STOP GUESSING.{" "}
            <span style={{ color: "#D80000" }}>APPLY WITH CLARITY.</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
            Build stronger applications from real job intelligence, not generic templates.
          </p>
        </div>

        {/* right — CTA */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2"
            style={{
              backgroundColor: "#D80000",
              color: "#fff",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.08em",
              padding: "16px 28px",
              borderRadius: 4,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            START YOUR FIRST JOB ANALYSIS <ArrowRight size={14} />
          </Link>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  )
}
