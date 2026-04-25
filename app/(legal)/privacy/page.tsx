export const metadata = {
  title: "Privacy Policy — HireWire",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground leading-relaxed">
          Our Privacy Policy is currently being finalized. Please check back shortly.
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
