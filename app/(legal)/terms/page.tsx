export const metadata = {
  title: "Terms of Service — HireWire",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground leading-relaxed">
          Our Terms of Service is currently being finalized. Please check back shortly.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Questions?{" "}
          <a
            href="mailto:hello@hirewire.app"
            className="text-primary hover:underline"
          >
            Email hello@hirewire.app
          </a>
        </p>
      </div>
    </div>
  )
}
