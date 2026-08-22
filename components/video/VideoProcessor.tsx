'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  extractVideoKeyframe,
} from '@/lib/ffmpeg-helpers'
import { processVideoWithNativeEngine, VideoProcessingResult } from '@/lib/video-canvas-engine'
import { precomputeMask, inpaintFrameDynamic, ProcessedMask } from '@/lib/dynamic-inpainter'
import { formatDuration } from '@/lib/image-utils'
import { ProcessingSteps, StepItem } from './ProcessingSteps'
import { MaskCanvas } from '../canvas/MaskCanvas'
import { DownloadButton } from '../shared/DownloadButton'
import {
  Play,
  Pause,
  Zap,
  Sparkles,
  AlertTriangle,
  Film,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Cpu,
  Volume2,
  VolumeX,
  Eye,
  Activity,
} from 'lucide-react'

interface VideoProcessorProps {
  videoFile: File
  onReset?: () => void
}

type Mode = 'dynamic-frame' | 'full-batch'

export function VideoProcessor({ videoFile, onReset }: VideoProcessorProps) {
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [keyframeUrl, setKeyframeUrl] = useState<string | null>(null)
  const [keyframeBlob, setKeyframeBlob] = useState<Blob | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  // Mask & Tool State
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null)
  const [hasDrawnMask, setHasDrawnMask] = useState<boolean>(false)
  const [brushSize, setBrushSize] = useState<number>(30)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')

  const handleMaskChange = useCallback((mask: string) => {
    setMaskDataUrl(mask)
  }, [])

  const handleHasDrawnChange = useCallback((drawn: boolean) => {
    setHasDrawnMask(drawn)
  }, [])

  // Processing state
  const [mode, setMode] = useState<Mode>('dynamic-frame')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resultVideoBlob, setResultVideoBlob] = useState<Blob | null>(null)
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null)
  const [activeMask, setActiveMask] = useState<ProcessedMask | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Result Live Player State
  const [resultCurrentTime, setResultCurrentTime] = useState<number>(0)
  const [resultIsPlaying, setResultIsPlaying] = useState<boolean>(false)
  const [resultIsMuted, setResultIsMuted] = useState<boolean>(true)
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false)

  // Steps
  const [steps, setSteps] = useState<StepItem[]>([
    {
      id: 'extract',
      title: '1. Prepare Video Stream',
      description: 'Analyzing video stream and extracting keyframes',
      state: 'pending',
      progress: 0,
    },
    {
      id: 'inpaint',
      title: '2. Dynamic Per-Frame Inpainting',
      description: 'Continuously reconstructing clean background from current scene pixels',
      state: 'pending',
      progress: 0,
    },
    {
      id: 'rebuild',
      title: '3. Reconstruct Clean Video',
      description: 'Encoding video frames and synchronizing audio track',
      state: 'pending',
      progress: 0,
    },
  ])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<any>(null)
  const resultVideoRef = useRef<HTMLVideoElement>(null)
  const resultCanvasOverlayRef = useRef<HTMLCanvasElement>(null)

  // Initialize video URL & extract initial keyframe
  useEffect(() => {
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)

    extractVideoKeyframe(videoFile, 0)
      .then(({ frameBlob, frameDataUrl, duration: dur }) => {
        setKeyframeBlob(frameBlob)
        setKeyframeUrl(frameDataUrl)
        setDuration(dur || 10)
      })
      .catch((err) => {
        console.error('Error extracting initial keyframe:', err)
      })

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoFile])

  // Scrub to different frame to mask
  const handleSeek = async (time: number) => {
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    try {
      const { frameBlob, frameDataUrl } = await extractVideoKeyframe(videoFile, time)
      setKeyframeBlob(frameBlob)
      setKeyframeUrl(frameDataUrl)
      setMaskDataUrl(null)
      setHasDrawnMask(false)
      canvasRef.current?.clear()
    } catch (e) {
      console.error(e)
    }
  }

  // Update step helper
  const updateStep = (id: string, updates: Partial<StepItem>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates } : step))
    )
  }

  // Real-time Dynamic Inpainting render loop for Result Player
  useEffect(() => {
    if (!activeMask || !resultVideoUrl) return

    let animationFrameId: number

    const renderDynamicFrame = () => {
      const overlay = resultCanvasOverlayRef.current
      const v = resultVideoRef.current

      if (overlay && v && v.readyState >= 2 && !showOriginalComparison) {
        const w = v.videoWidth || 1280
        const h = v.videoHeight || 720

        if (overlay.width !== w || overlay.height !== h) {
          overlay.width = w
          overlay.height = h
        }

        const ctx = overlay.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          // 1. Draw CURRENT video frame to overlay canvas
          ctx.drawImage(v, 0, 0, w, h)

          // 2. Inpaint watermark dynamically using the CURRENT frame's background!
          inpaintFrameDynamic(ctx, activeMask, w, h)
        }
      } else if (overlay && showOriginalComparison) {
        const ctx = overlay.getContext('2d')
        ctx?.clearRect(0, 0, overlay.width, overlay.height)
      }

      animationFrameId = requestAnimationFrame(renderDynamicFrame)
    }

    animationFrameId = requestAnimationFrame(renderDynamicFrame)
    return () => cancelAnimationFrame(animationFrameId)
  }, [activeMask, resultVideoUrl, showOriginalComparison])

  // Run the Dynamic Video Inpainting Pipeline
  const handleStartProcessing = async () => {
    if (!maskDataUrl || !keyframeUrl) {
      setErrorMessage('Please draw a mask over the watermark area on the video frame.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setResultVideoBlob(null)
    setResultVideoUrl(null)
    setActiveMask(null)

    // Reset steps
    setSteps([
      {
        id: 'extract',
        title: '1. Prepare Video Stream',
        description: 'Analyzing video stream and extracting keyframes',
        state: 'active',
        progress: 100,
      },
      {
        id: 'inpaint',
        title: '2. Dynamic Per-Frame Inpainting',
        description: 'Continuously reconstructing clean background from current scene pixels...',
        state: 'active',
        progress: 15,
      },
      {
        id: 'rebuild',
        title: '3. Reconstruct Clean Video',
        description: 'Deterministic frame-stepping compositor with audio sync',
        state: 'pending',
        progress: 0,
      },
    ])

    try {
      const result: VideoProcessingResult = await processVideoWithNativeEngine({
        videoFile,
        maskDataUrl,
        onProgress: (stepName, progress, message) => {
          if (stepName === 'inpaint') {
            updateStep('inpaint', {
              state: progress >= 100 ? 'done' : 'active',
              progress,
              description: message,
            })
            if (progress >= 100) {
              updateStep('rebuild', { state: 'active', progress: 10 })
            }
          } else if (stepName === 'render') {
            updateStep('rebuild', {
              state: progress >= 100 ? 'done' : 'active',
              progress,
              description: message,
            })
          }
        },
      })

      const blobUrl = URL.createObjectURL(result.outputBlob)
      setResultVideoBlob(result.outputBlob)
      setResultVideoUrl(blobUrl)
      setActiveMask(result.processedMask)
      updateStep('rebuild', { state: 'done', progress: 100 })
    } catch (err: any) {
      console.error('Video processing error:', err)
      setErrorMessage(err.message || 'Video processing failed. Please verify browser capabilities.')
      setSteps((prev) =>
        prev.map((s) => (s.state === 'active' ? { ...s, state: 'error' } : s))
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const estimatedFrames = Math.round((duration || 5) * 30)

  return (
    <div className="space-y-6">
      {/* Top Row: Video Player & Keyframe Scrubber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Original Video Player */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-accent-light" />
              <span>Original Video Source</span>
            </h3>
            <span className="text-xs text-text-dim font-mono">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-black shadow-xl">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
              }}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Custom Play/Pause Overlay */}
            <button
              onClick={() => {
                if (!videoRef.current) return
                if (isPlaying) {
                  videoRef.current.pause()
                  setIsPlaying(false)
                } else {
                  videoRef.current.play()
                  setIsPlaying(true)
                }
              }}
              className="absolute bottom-4 left-4 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Select Frame to Mark Watermark Area</span>
              <span className="font-mono text-primary-light">{currentTime.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 10}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Mask Drawing Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-light" />
              <h3 className="text-sm font-semibold text-white">Draw Watermark Mask</h3>
            </div>
            <span className="text-xs text-text-dim">
              {hasDrawnMask ? 'Mask Ready' : 'Draw over text / logo'}
            </span>
          </div>

          <div className="h-[280px] sm:h-[320px]">
            {keyframeUrl ? (
              <MaskCanvas
                ref={canvasRef}
                imageSrc={keyframeUrl}
                brushSize={brushSize}
                tool={tool}
                onMaskChange={handleMaskChange}
                onHasDrawnChange={handleHasDrawnChange}
              />
            ) : (
              <div className="w-full h-full rounded-2xl border border-border bg-surface flex items-center justify-center text-xs text-text-muted">
                Loading keyframe...
              </div>
            )}
          </div>

          {/* Brush Controls */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTool('brush')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  tool === 'brush'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Brush
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  tool === 'eraser'
                    ? 'bg-primary/20 text-primary-light border border-primary/40'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Eraser
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-[160px]">
              <span className="text-text-dim text-[11px]">Size</span>
              <input
                type="range"
                min={5}
                max={80}
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-primary h-1 bg-border rounded-lg cursor-pointer"
              />
              <span className="font-mono text-text-muted w-6 text-right">{brushSize}</span>
            </div>

            <button
              onClick={() => {
                canvasRef.current?.clear()
                setMaskDataUrl(null)
                setHasDrawnMask(false)
              }}
              className="px-2.5 py-1.5 text-text-dim hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Settings, Estimator & Pipeline Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-border/80">
        {/* Left: Mode Selection & Estimator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                Processing Mode
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Dynamic Scene Adaptation</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => setMode('dynamic-frame')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'dynamic-frame'
                    ? 'bg-primary/15 border-primary/50 shadow-md shadow-primary/10'
                    : 'bg-surface-subtle border-border/70 hover:border-border hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-semibold text-sm text-white">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Dynamic Per-Frame Inpainting (Recommended)</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    Auto Background
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Dynamically reconstructs the clean background of each frame in real-time. Automatically matches changing scenes (bright rooms, dark scenes, moving backgrounds) without black boxes.
                </p>
              </button>

              <button
                onClick={() => setMode('full-batch')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'full-batch'
                    ? 'bg-accent/15 border-accent/50 shadow-md shadow-accent/10'
                    : 'bg-surface-subtle border-border/70 hover:border-border hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-semibold text-sm text-white">
                    <Layers className="w-4 h-4 text-accent-light" />
                    <span>Cloud GPU Frame Synthesizer</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-accent/20 text-accent-light px-2 py-0.5 rounded-full">
                    Big-LaMa
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Connects to Replicate Big-LaMa Cloud GPU API to inpaint complex textures and organic scenes.
                </p>
              </button>
            </div>
          </div>

          {/* Video Duration & Cost Estimator Table */}
          <div className="p-4 rounded-2xl bg-surface/60 border border-border space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-text-muted font-medium">
              <Clock className="w-3.5 h-3.5 text-primary-light" />
              <span>Pipeline Estimates</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-surface-subtle border border-border/60">
                <span className="text-[10px] text-text-dim block">Frames</span>
                <span className="font-mono font-bold text-white">~{estimatedFrames}</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-subtle border border-border/60">
                <span className="text-[10px] text-text-dim block">Est. Time</span>
                <span className="font-mono font-bold text-primary-light">
                  ~5-10 sec
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface-subtle border border-border/60">
                <span className="text-[10px] text-text-dim block">AI Cost</span>
                <span className="font-mono font-bold text-emerald-400">
                  $0.00 (Local)
                </span>
              </div>
            </div>

            {duration > 30 && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Long video detected. Dynamic Per-Frame mode will process smoothly.</span>
              </div>
            )}
          </div>

          {/* Action CTA */}
          <button
            onClick={handleStartProcessing}
            disabled={isProcessing || !hasDrawnMask}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-primary via-blue-600 to-accent text-white font-bold text-sm hover:from-primary-hover hover:to-accent-hover shadow-xl shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Removing Watermark & Encoding Video...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Remove Video Watermark</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right: Steps Progress / Result Live Player */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-light" />
                <span>Pipeline Status</span>
              </h4>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Dynamic Scene Engine
              </span>
            </div>

            <ProcessingSteps steps={steps} />

            {/* Clean Result Player when complete */}
            {resultVideoUrl && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clean Video Ready (Audio & 1.0x Speed Synced)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOriginalComparison((prev) => !prev)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        showOriginalComparison
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-surface-subtle text-text-muted hover:text-white border-border'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showOriginalComparison ? 'Viewing Original' : 'Compare with Original'}</span>
                    </button>

                    <DownloadButton
                      url={resultVideoUrl}
                      blob={resultVideoBlob}
                      filename="clean_video_watermarkout"
                      type="video"
                    />
                  </div>
                </div>

                {/* High-Performance Clean Video Player with Full Audio */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/40 bg-black shadow-2xl group">
                  {/* Clean Rendered Video / Original Video */}
                  <video
                    ref={resultVideoRef}
                    key={showOriginalComparison ? 'orig' : 'clean'}
                    src={showOriginalComparison ? videoUrl : resultVideoUrl}
                    playsInline
                    muted={resultIsMuted}
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => {
                      if (resultVideoRef.current) {
                        setResultCurrentTime(resultVideoRef.current.currentTime)
                      }
                    }}
                    onEnded={() => setResultIsPlaying(false)}
                  />

                  {/* Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>
                      {showOriginalComparison
                        ? 'Original Video (Watermark Present)'
                        : 'Clean Video (Watermark Removed + Audio Synced)'}
                    </span>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-3 text-white transition-opacity">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!resultVideoRef.current) return
                          if (resultIsPlaying) {
                            resultVideoRef.current.pause()
                            setResultIsPlaying(false)
                          } else {
                            resultVideoRef.current.play()
                            setResultIsPlaying(true)
                          }
                        }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        {resultIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => {
                          if (!resultVideoRef.current) return
                          resultVideoRef.current.muted = !resultIsMuted
                          setResultIsMuted(!resultIsMuted)
                        }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-text-muted hover:text-white"
                        title={resultIsMuted ? 'Unmute Audio' : 'Mute Audio'}
                      >
                        {resultIsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      </button>

                      <span className="font-mono text-xs text-text-muted">
                        {formatDuration(resultCurrentTime)} / {formatDuration(duration)}
                      </span>
                    </div>

                    {/* Timeline bar */}
                    <div className="flex-1 max-w-[340px]">
                      <input
                        type="range"
                        min={0}
                        max={duration || 10}
                        step={0.05}
                        value={resultCurrentTime}
                        onChange={(e) => {
                          const t = parseFloat(e.target.value)
                          setResultCurrentTime(t)
                          if (resultVideoRef.current) {
                            resultVideoRef.current.currentTime = t
                          }
                        }}
                        className="w-full accent-emerald-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
