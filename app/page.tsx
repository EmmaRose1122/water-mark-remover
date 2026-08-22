'use client'

import { FileDropzone } from '@/components/upload/FileDropzone'
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Film,
  Image as ImageIcon,
  Check,
} from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* ─── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 flex flex-col items-center text-center">
        {/* Glow Orb & Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-primary/30 shadow-lg shadow-primary/10 mb-6 animate-float">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold tracking-wide text-text-primary">
            Powered by <span className="text-gradient">Big-LaMa AI</span> & FFmpeg WASM
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Remove Any Watermark.{' '}
          <span className="text-gradient">Instantly.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-text-muted max-w-2xl font-normal leading-relaxed mb-12">
          AI inpainting that fills the watermark area with realistic surrounding content —{' '}
          <span className="text-text-primary font-medium">not blur, not smear</span>.
          Upload, draw, and download crystal clean photos & videos.
        </p>

        {/* ─── TWO UPLOAD CARDS ────────────────────────────────────────────────── */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Card 1: Image Watermark */}
          <div className="p-6 rounded-3xl bg-surface/80 border border-border/80 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative group hover:border-primary/50 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 text-primary-light">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-white">Image Watermark</h2>
                </div>
                <span className="text-[11px] font-semibold text-primary-light bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  Instant AI
                </span>
              </div>

              <FileDropzone
                type="image"
                accept={{
                  'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                }}
                maxSize={20 * 1024 * 1024}
                title="Drop Photo Here"
                description="Supports JPG, PNG, WebP & GIF up to 20MB"
              />
            </div>
          </div>

          {/* Card 2: Video Watermark */}
          <div className="p-6 rounded-3xl bg-surface/80 border border-border/80 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative group hover:border-accent/50 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/30 text-accent-light">
                    <Film className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-white">Video Watermark</h2>
                </div>
                <span className="text-[11px] font-semibold text-accent-light bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                  Smart WASM
                </span>
              </div>

              <FileDropzone
                type="video"
                accept={{
                  'video/*': ['.mp4', '.mov', '.webm', '.m4v'],
                }}
                maxSize={200 * 1024 * 1024}
                title="Drop Video Here"
                description="Supports MP4, MOV, WebM up to 200MB"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (3 SIMPLE STEPS) ────────────────────────────────────── */}
      <section className="w-full border-y border-border/70 bg-surface-subtle/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-light">
              Simple 3-Step Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              How WatermarkOut Works
            </h2>
            <p className="text-sm text-text-muted">
              Intuitive canvas brush tools paired with deep learning inpainting neural networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 relative group hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary-light font-mono font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Upload Media</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Drag and drop your photo or video. Large files are handled smoothly with browser memory optimization.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 relative group hover:border-accent/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent-light font-mono font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Brush Over Watermark</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Use the responsive brush tool to highlight text stamps, logos, date watermarks, or unwanted objects.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 relative group hover:border-emerald-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-white">AI Inpainting & Download</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Big-LaMa AI synthesizes seamless background textures. Compare with the split slider and download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY AI INPAINTING VS TRADITIONAL BLUR ────────────────────────────── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">
              Quality Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Why Neural Inpainting Beats Traditional Blur Tools
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Old watermark removers merely apply a heavy gaussian blur or smear filter over the watermark, leaving an ugly foggy smudge that ruins your content.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">WatermarkOut (Big-LaMa AI)</h4>
                  <p className="text-xs text-text-muted">
                    Synthesizes realistic background pixels (wood grain, skies, skin, textures) with zero smearing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <span className="text-xs font-bold text-red-400 shrink-0 mt-0.5">✕</span>
                <div>
                  <h4 className="text-sm font-semibold text-red-300">Legacy Watermark Removers</h4>
                  <p className="text-xs text-text-muted">
                    Blurs, clones, or mosaic-pixelates the area, drawing even more attention to the destroyed image spot.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 rounded-3xl bg-surface border border-border shadow-2xl relative overflow-hidden">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary-light" />
                <span>Zero Blur Neural Texture Synthesis</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-text-dim block mb-1">Inpainting Model</span>
                  <span className="font-bold text-white">Big-LaMa (Fast & Crisp)</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-text-dim block mb-1">Video Processing</span>
                  <span className="font-bold text-white">FFmpeg 0.12 WASM</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-text-dim block mb-1">Output Resolution</span>
                  <span className="font-bold text-emerald-400">100% Original 1:1</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-text-dim block mb-1">Data Privacy</span>
                  <span className="font-bold text-emerald-400">Browser Isolated</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Ready to try it out?</span>
                  <span className="text-[11px] text-text-muted">Jump straight into the image or video editor</span>
                </div>
                <Link
                  href="/editor/image"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS ───────────────────────────────────────── */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border/60">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary-light" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-muted">
            Everything you need to know about WatermarkOut AI.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
            <h3 className="text-sm font-semibold text-white">How does the AI fill the watermark area?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              We utilize the state-of-the-art Big-LaMa (Large Mask Inpainting) deep neural network. It understands global context, textures, lines, and gradients to synthesize realistic pixels that blend seamlessly into the original photo or video frame.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
            <h3 className="text-sm font-semibold text-white">How does Video Watermark Removal work?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Video processing happens in your browser via FFmpeg WebAssembly. In &quot;Smart Fast Mode&quot;, the AI inpainting is computed on a keyframe, and the clean synthesized patch is blended across all video frames with zero quality loss in seconds!
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
            <h3 className="text-sm font-semibold text-white">Is there any quality degradation?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              No. Pixels outside the drawn mask remain untouched at their exact original bit-depth and resolution.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
