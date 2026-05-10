import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/">Back to home</Link>
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
