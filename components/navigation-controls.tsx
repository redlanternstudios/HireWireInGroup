"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface NavigationControlsProps {
  fallbackHref?: string
  className?: string
}

export function NavigationControls({ 
  fallbackHref = "/dashboard",
  className = ""
}: NavigationControlsProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  const handleForward = () => {
    router.forward()
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Go back"
        title="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleForward}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Go forward"
        title="Go forward"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
