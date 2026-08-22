'use client'

import dynamic from 'next/dynamic'
import { forwardRef } from 'react'
import type { KonvaCanvasHandle } from './KonvaCanvasInner'
import { Loader2 } from 'lucide-react'

const DynamicKonvaCanvas = dynamic(
  () => import('./KonvaCanvasInner').then((mod) => mod.KonvaCanvasInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] rounded-2xl border border-border bg-surface flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-medium">Initializing AI Canvas...</span>
      </div>
    ),
  }
)

interface MaskCanvasProps {
  imageSrc: string
  brushSize: number
  tool: 'brush' | 'eraser'
  onMaskChange?: (maskDataUrl: string) => void
  onHasDrawnChange?: (hasDrawn: boolean) => void
}

export const MaskCanvas = forwardRef<KonvaCanvasHandle, MaskCanvasProps>(
  function MaskCanvas(props, ref) {
    return <DynamicKonvaCanvas {...props} ref={ref} />
  }
)
