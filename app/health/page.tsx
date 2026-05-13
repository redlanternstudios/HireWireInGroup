export const dynamic = "force-dynamic"

export default function HealthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="text-center rounded-3xl border border-border bg-card p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-600">System is running</h1>
        <p className="text-muted-foreground mt-2">Health check passed.</p>
        <p className="text-xs text-muted-foreground mt-4">
          {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}
