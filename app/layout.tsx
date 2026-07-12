import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { UserProvider } from '@/components/user-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'HireWire — AI-Powered Career OS',
    template: '%s | HireWire',
  },
  description: 'HireWire builds your application package from your real career evidence — resume, cover letter, and strategy, grounded in truth.',
  applicationName: 'HireWire',
  authors: [{ name: 'HireWire' }],
  keywords: ['career', 'job search', 'resume', 'cover letter', 'AI', 'job application'],
  openGraph: {
    type: 'website',
    siteName: 'HireWire',
    title: 'HireWire — AI-Powered Career OS',
    description: 'Your job search, grounded in real evidence. AI-generated materials that actually sound like you.',
  },
  icons: {
    icon: '/brand/hirewire-logo.png',
    apple: '/brand/hirewire-logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <UserProvider>
            {children}
          </UserProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
