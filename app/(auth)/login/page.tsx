'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Loader2, Mail } from 'lucide-react'
import dynamic from 'next/dynamic'

const EmailInput = dynamic(
  () => Promise.resolve(({ value, onChange, disabled }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean }) => (
    <Input
      id="email"
      type="email"
      placeholder="you@example.com"
      required
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )),
  { ssr: false, loading: () => <div className="h-10 w-full bg-muted rounded animate-pulse" /> }
)

const PasswordInput = dynamic(
  () => Promise.resolve(({ value, onChange, disabled }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean }) => (
    <Input
      id="password"
      type="password"
      required
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )),
  { ssr: false, loading: () => <div className="h-10 w-full bg-muted rounded animate-pulse" /> }
)

function LoginForm() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) throw error
      setIsMagicLinkSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (data.user) {
        router.push(redirectTo)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isMagicLinkSent) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center">
          <Mail className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
          <CardTitle className="text-xl font-semibold">Check your email</CardTitle>
          <CardDescription className="text-base">
            Sign-in link sent to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link to sign in. It expires in 1 hour.
          </p>
          <Button variant="outline" className="w-full" onClick={() => {
            setIsMagicLinkSent(false)
            setEmail('')
          }}>
            Use a different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">Sign in to HireWire</CardTitle>
        <CardDescription>Your career OS is waiting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={authMode === 'magic' ? handleMagicLink : handlePasswordLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <EmailInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {authMode === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {authMode === 'magic' ? 'Sending link...' : 'Signing in...'}
                </>
              ) : authMode === 'magic' ? (
                'Send magic link'
              ) : (
                'Log in'
              )}
            </Button>
          </div>
        </form>

        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setAuthMode(authMode === 'magic' ? 'password' : 'magic')}
        >
          {authMode === 'magic' ? 'Log in with password' : 'Log in with magic link'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="border-0 shadow-none lg:border lg:shadow-sm bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading login...</p>
        </CardContent>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  )
}
