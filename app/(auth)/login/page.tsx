import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Card className="w-full max-w-lg border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in is temporarily disabled</CardTitle>
          <CardDescription>
            We are keeping the app open for testing while we finish the loop.
            New users can continue through the public flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you were sent here from an old link, use the start flow for now.
          </p>
          <Button asChild className="w-full">
            <Link href="/signup">Start free</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
