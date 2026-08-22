'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Split, Columns, Eye, Maximize2, Minimize2, Sparkles, ZoomIn } from 'lucide-react'

interface BeforeAfterSliderProps {
  before: string // Watermarked image URL
  after: string // Clean inpainted image URL
  className?: string
  altText?: string
}

type ViewMode = 'slider' | 'side-by-side' | 'toggle'

export function BeforeAfterSlider({
  before,
  after,
  className = '',
  altText = 'Before and After comparison',
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const [viewMode, setViewMode] = useState<ViewMode>('slider')
  const [isHoldingBefore, setIsHoldingBefore] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoupeActive, setIsLoupeActive] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || viewMode !== 'slider') return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(pct)
  }, [viewMode])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode !== 'slider') return
    isDragging.current = true
    handleMove(e.clientX)
  }

  useEffect(() => {
    const handlePointerMoveGlobal = (e: PointerEvent) => {
      if (isDragging.current) {
        handleMove(e.clientX)
      }
      if (containerRef.current && isLoupeActive) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    const handlePointerUpGlobal = () => {
      isDragging.current = false
    }

    window.addEventListener('pointermove', handlePointerMoveGlobal)
    window.addEventListener('pointerup', handlePointerUpGlobal)
    return () => {
      window.removeEventListener('pointermove', handlePointerMoveGlobal)
      window.removeEventListener('pointerup', handlePointerUpGlobal)
    }
  }, [handleMove, isLoupeActive])

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'slider'
                ? 'bg-primary/20 text-primary-light font-medium border border-primary/40'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-primary/20 text-primary-light font-medium border border-primary/40'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>

          <button
            onClick={() => setViewMode('toggle')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'toggle'
                ? 'bg-primary/20 text-primary-light font-medium border border-primary/40'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hold to Compare</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsLoupeActive(!isLoupeActive)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLoupeActive
                ? 'bg-accent/20 border-accent text-accent-light'
                : 'border-border bg-surface text-text-muted hover:text-white'
            }`}
            title="Inspect with zoom loupe"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-white transition-all cursor-pointer"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Comparison Container */}
      <div
        ref={containerRef}
        className={`relative select-none overflow-hidden rounded-2xl border border-border bg-surface-subtle shadow-2xl ${
          isFullscreen
            ? 'fixed inset-4 z-50 bg-background/95 backdrop-blur-2xl flex items-center justify-center p-6'
            : 'w-full aspect-[4/3] max-h-[560px]'
        }`}
        onPointerDown={handlePointerDown}
      >
        {viewMode === 'slider' && (
          <div className="relative w-full h-full cursor-ew-resize">
            {/* After Image (AI Cleaned — Base layer) */}
            <img
              src={after}
              alt="Clean Result"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Before Image (Watermarked — Clipped layer on left) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: `inset(0 ${100 - position}% 0 0)`,
              }}
            >
              <img
                src={before}
                alt="Original Watermarked"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>

            {/* Draggable Divider Line & Knob */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-white to-accent shadow-[0_0_12px_rgba(59,130,246,0.8)] z-20 pointer-events-none"
              style={{ left: `${position}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-surface border-2 border-primary shadow-xl flex items-center justify-center text-white backdrop-blur-md">
                <span className="text-xs font-bold font-mono tracking-tighter">⇔</span>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-red-400">
              Original Watermark
            </div>
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-emerald-400">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>AI Cleaned</span>
            </div>
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
            <div className="relative rounded-xl overflow-hidden border border-border bg-black/30 flex items-center justify-center">
              <img
                src={before}
                alt="Original"
                className="w-full h-full object-contain"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-red-400 font-semibold">
                Original
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-border bg-black/30 flex items-center justify-center">
              <img
                src={after}
                alt="AI Cleaned"
                className="w-full h-full object-contain"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Cleaned
              </span>
            </div>
          </div>
        )}

        {viewMode === 'toggle' && (
          <div
            className="relative w-full h-full flex items-center justify-center cursor-pointer"
            onMouseDown={() => setIsHoldingBefore(true)}
            onMouseUp={() => setIsHoldingBefore(false)}
            onTouchStart={() => setIsHoldingBefore(true)}
            onTouchEnd={() => setIsHoldingBefore(false)}
          >
            <img
              src={isHoldingBefore ? before : after}
              alt="Comparison"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-border text-xs text-white shadow-xl">
              {isHoldingBefore ? 'Showing Original (Release for AI Cleaned)' : 'Press & Hold to View Original'}
            </div>
          </div>
        )}

        {/* Magnifier Loupe */}
        {isLoupeActive && (
          <div
            className="absolute w-36 h-36 rounded-full border-2 border-primary shadow-2xl pointer-events-none z-30 overflow-hidden bg-background"
            style={{
              left: `${mousePos.x - 72}px`,
              top: `${mousePos.y - 72}px`,
            }}
          >
            <img
              src={after}
              alt="Loupe Zoom"
              className="absolute w-[300%] h-[300%] max-w-none"
              style={{
                left: `${-mousePos.x * 2}px`,
                top: `${-mousePos.y * 2}px`,
              }}
            />
            <div className="absolute inset-0 rounded-full border border-white/20 shadow-inner" />
          </div>
        )}
      </div>
    </div>
  )
}
