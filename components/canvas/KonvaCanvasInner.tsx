'use client'

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva'
import useImage from 'use-image'
import { ZoomIn, ZoomOut, Undo2, Redo2, Trash2 } from 'lucide-react'

export interface KonvaCanvasHandle {
  clear: () => void
  undo: () => void
  redo: () => void
  getMaskDataUrl: () => string | null
}

interface LineData {
  tool: 'brush' | 'eraser'
  points: number[]
  strokeWidth: number
}

interface KonvaCanvasInnerProps {
  imageSrc: string
  brushSize: number
  tool: 'brush' | 'eraser'
  onMaskChange?: (maskDataUrl: string) => void
  onHasDrawnChange?: (hasDrawn: boolean) => void
}

export const KonvaCanvasInner = forwardRef<KonvaCanvasHandle, KonvaCanvasInnerProps>(
  function KonvaCanvasInner({ imageSrc, brushSize, tool, onMaskChange, onHasDrawnChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<any>(null)
    const [image] = useImage(imageSrc, 'anonymous')

    const [stageSize, setStageSize] = useState({ width: 600, height: 400 })
    const [scale, setScale] = useState(1)
    const [lines, setLines] = useState<LineData[]>([])
    const [redoStack, setRedoStack] = useState<LineData[][]>([])
    const isDrawing = useRef(false)

    // Store callbacks in refs to avoid re-triggering effects
    const onMaskChangeRef = useRef(onMaskChange)
    const onHasDrawnChangeRef = useRef(onHasDrawnChange)

    useEffect(() => {
      onMaskChangeRef.current = onMaskChange
    }, [onMaskChange])

    useEffect(() => {
      onHasDrawnChangeRef.current = onHasDrawnChange
    }, [onHasDrawnChange])

    // Calculate dimensions to fit container while keeping image aspect ratio
    useEffect(() => {
      const updateSize = () => {
        if (!containerRef.current) return
        const containerWidth = containerRef.current.clientWidth || 600
        const containerHeight = containerRef.current.clientHeight || 500

        if (image) {
          const imgAspect = image.width / image.height
          const containerAspect = containerWidth / containerHeight

          let w = containerWidth
          let h = containerHeight

          if (imgAspect > containerAspect) {
            h = containerWidth / imgAspect
          } else {
            w = containerHeight * imgAspect
          }

          setStageSize({ width: Math.max(200, Math.floor(w)), height: Math.max(200, Math.floor(h)) })
        } else {
          setStageSize({ width: containerWidth, height: containerHeight })
        }
      }

      updateSize()
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }, [image])

    // Export high-res black & white mask matching original image dimensions
    const generateMaskFromLines = useCallback((currentLines: LineData[]): string | null => {
      if (!image || currentLines.length === 0) return null

      const origWidth = image.naturalWidth || image.width
      const origHeight = image.naturalHeight || image.height

      const offscreen = document.createElement('canvas')
      offscreen.width = origWidth
      offscreen.height = origHeight
      const ctx = offscreen.getContext('2d')
      if (!ctx) return null

      // Fill black (keep area)
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, origWidth, origHeight)

      // Scale from stage display size to original image size
      const scaleX = origWidth / stageSize.width
      const scaleY = origHeight / stageSize.height

      // Draw mask strokes in white
      ctx.strokeStyle = '#FFFFFF'
      ctx.fillStyle = '#FFFFFF'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const line of currentLines) {
        if (line.tool === 'brush') {
          ctx.globalCompositeOperation = 'source-over'
          ctx.lineWidth = line.strokeWidth * ((scaleX + scaleY) / 2)
          ctx.beginPath()
          for (let i = 0; i < line.points.length; i += 2) {
            const x = line.points[i] * scaleX
            const y = line.points[i + 1] * scaleY
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.stroke()
        } else if (line.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.lineWidth = line.strokeWidth * ((scaleX + scaleY) / 2)
          ctx.beginPath()
          for (let i = 0; i < line.points.length; i += 2) {
            const x = line.points[i] * scaleX
            const y = line.points[i + 1] * scaleY
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.stroke()
        }
      }

      return offscreen.toDataURL('image/png')
    }, [image, stageSize])

    const notifyParent = useCallback((currentLines: LineData[]) => {
      const hasDrawn = currentLines.some((l) => l.tool === 'brush' && l.points.length > 0)
      onHasDrawnChangeRef.current?.(hasDrawn)
      if (hasDrawn) {
        const mask = generateMaskFromLines(currentLines)
        if (mask) onMaskChangeRef.current?.(mask)
      } else {
        onMaskChangeRef.current?.('')
      }
    }, [generateMaskFromLines])

    // Imperative methods for parent
    useImperativeHandle(ref, () => ({
      clear: () => {
        if (lines.length > 0) {
          setRedoStack((prev) => [...prev, lines])
          setLines([])
          notifyParent([])
        }
      },
      undo: () => {
        if (lines.length > 0) {
          const last = lines[lines.length - 1]
          const newLines = lines.slice(0, -1)
          setRedoStack((prev) => [...prev, [last]])
          setLines(newLines)
          notifyParent(newLines)
        }
      },
      redo: () => {
        if (redoStack.length > 0) {
          const toRestore = redoStack[redoStack.length - 1]
          const newLines = [...lines, ...toRestore]
          setRedoStack((prev) => prev.slice(0, -1))
          setLines(newLines)
          notifyParent(newLines)
        }
      },
      getMaskDataUrl: () => generateMaskFromLines(lines),
    }), [lines, redoStack, notifyParent, generateMaskFromLines])

    // Drawing handlers
    const handlePointerDown = (e: any) => {
      isDrawing.current = true
      const stage = e.target.getStage()
      const pos = stage.getPointerPosition()
      if (!pos) return

      const adjustedX = pos.x / scale
      const adjustedY = pos.y / scale

      setLines((prev) => [
        ...prev,
        {
          tool,
          strokeWidth: brushSize,
          points: [adjustedX, adjustedY],
        },
      ])
      setRedoStack([])
    }

    const handlePointerMove = (e: any) => {
      if (!isDrawing.current) return
      const stage = e.target.getStage()
      const pos = stage.getPointerPosition()
      if (!pos) return

      const adjustedX = pos.x / scale
      const adjustedY = pos.y / scale

      setLines((prev) => {
        if (prev.length === 0) return prev
        const lastLine = { ...prev[prev.length - 1] }
        lastLine.points = [...lastLine.points, adjustedX, adjustedY]
        return [...prev.slice(0, -1), lastLine]
      })
    }

    const handlePointerUp = () => {
      if (isDrawing.current) {
        isDrawing.current = false
        setLines((currentLines) => {
          notifyParent(currentLines)
          return currentLines
        })
      }
    }

    const handlePointerLeave = () => {
      if (isDrawing.current) {
        isDrawing.current = false
        setLines((currentLines) => {
          notifyParent(currentLines)
          return currentLines
        })
      }
    }

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-[420px] flex items-center justify-center bg-surface-subtle/50 rounded-2xl overflow-hidden border border-border select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Floating Zoom & Canvas Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-xl">
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="px-2 py-1 text-xs font-mono rounded-lg text-text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
        </div>

        {/* Quick History Floating Bar */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-xl">
          <button
            onClick={() => {
              if (lines.length > 0) {
                const last = lines[lines.length - 1]
                const newLines = lines.slice(0, -1)
                setRedoStack((prev) => [...prev, [last]])
                setLines(newLines)
                notifyParent(newLines)
              }
            }}
            disabled={lines.length === 0}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-40 cursor-pointer"
            title="Undo stroke"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (redoStack.length > 0) {
                const toRestore = redoStack[redoStack.length - 1]
                const newLines = [...lines, ...toRestore]
                setRedoStack((prev) => prev.slice(0, -1))
                setLines(newLines)
                notifyParent(newLines)
              }
            }}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-40 cursor-pointer"
            title="Redo stroke"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-border mx-0.5" />
          <button
            onClick={() => {
              if (lines.length > 0) {
                setRedoStack((prev) => [...prev, lines])
                setLines([])
                notifyParent([])
              }
            }}
            disabled={lines.length === 0}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-40 cursor-pointer"
            title="Clear all mask"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Stage Wrapper */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDrawing.current ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative shadow-2xl rounded-lg overflow-hidden border border-border/50"
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerLeave}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{
              cursor: tool === 'brush' ? 'crosshair' : 'cell',
            }}
          >
            {/* Background Image Layer */}
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  width={stageSize.width}
                  height={stageSize.height}
                  listening={false}
                />
              )}
            </Layer>

            {/* Mask Drawing Layer */}
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={
                    line.tool === 'brush' ? 'rgba(239, 68, 68, 0.65)' : 'rgba(0, 0, 0, 1)'
                  }
                  strokeWidth={line.strokeWidth}
                  tension={0.4}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.tool === 'eraser' ? 'destination-out' : 'source-over'
                  }
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    )
  }
)
