"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { CoachChat } from "@/components/coach-chat"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { Sparkles, X, Minimize2, Maximize2, GripVertical } from "lucide-react"

interface Position {
  x: number
  y: number
}

const STORAGE_KEY = "hw-coach-pos"
const DEFAULT_POS: Position = { x: 24, y: 24 }

export function CoachBubble() {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [position, setPosition] = useState<Position>(DEFAULT_POS)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPos: Position } | null>(null)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setPosition(JSON.parse(saved)) } catch { /* ignore */ }
    }

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
    }
  }, [position, isDragging])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    dragRef.current = { startX: clientX, startY: clientY, startPos: position }
    setIsDragging(true)
  }, [position])

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return
      const clientX = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      const clientY = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
      const deltaX = dragRef.current.startX - clientX
      const deltaY = dragRef.current.startY - clientY
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 64, dragRef.current.startPos.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 64, dragRef.current.startPos.y + deltaY)),
      })
    }

    const handleEnd = () => { setIsDragging(false); dragRef.current = null }

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleEnd)
    document.addEventListener("touchmove", handleMove, { passive: false })
    document.addEventListener("touchend", handleEnd)
    return () => {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchmove", handleMove)
      document.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsOpen(false); setIsMaximized(false) }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  if (!mounted) return null

  // ── Mobile: vaul Drawer ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* FAB */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed z-50 bottom-6 right-6 h-14 w-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
            aria-label="Open coach"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        )}

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[85vh] flex flex-col">
            <DrawerHeader className="border-b px-4 py-3 shrink-0 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <DrawerTitle className="text-sm font-medium">HireWire Coach</DrawerTitle>
                <p className="text-xs text-muted-foreground">Your AI career advisor</p>
              </div>
            </DrawerHeader>
            <CoachChat className="flex-1 min-h-0" compact />
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  // ── Desktop: floating draggable panel ───────────────────────────────────
  return (
    <div
      className={cn("fixed z-50", isMaximized ? "inset-4" : "")}
      style={!isMaximized ? { right: position.x, bottom: position.y } : undefined}
    >
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 hover:scale-105 transition-all duration-200"
          aria-label="Open coach"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className={cn(
          "flex flex-col bg-background border border-border shadow-2xl overflow-hidden",
          isMaximized
            ? "w-full h-full rounded-xl"
            : "w-96 h-[520px] rounded-2xl"
        )}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 shrink-0">
            {!isMaximized && (
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className={cn(
                  "cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted",
                  isDragging && "cursor-grabbing"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">HireWire Coach</p>
              <p className="text-xs text-muted-foreground">Your AI career advisor</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMaximized(!isMaximized)}
                aria-label={isMaximized ? "Restore" : "Maximise"}
              >
                {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setIsOpen(false); setIsMaximized(false) }}
                aria-label="Close coach"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <CoachChat className="flex-1 min-h-0" compact />
        </div>
      )}
    </div>
  )
}
