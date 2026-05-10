import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HireWireLogo } from '@/components/hirewire-logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-8 text-center bg-background">
      <HireWireLogo variant="color" size="sm" />
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          This page doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
import { ErrorCard } from '@/components/error/error-card'

export default function NotFound() {
  return (
  <ErrorCard
    title="Not found"
    message="We couldn't find that page or resource."
    actionLabel="Go to dashboard"
    onAction={() => (window.location.href = '/dashboard')}
    severity="info"
  />
  )
}
