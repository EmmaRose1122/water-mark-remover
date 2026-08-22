import { Wand2, Zap, Shield, Cpu } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-border/70 bg-surface/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <Wand2 className="w-4 h-4 text-primary-light" />
              </div>
              <span className="font-bold text-white tracking-tight">WatermarkOut</span>
            </div>
            <p className="text-sm text-text-muted max-w-sm">
              State-of-the-art AI inpainting suite for photos and videos. Intelligent texture synthesis removes watermarks, stamps, and objects with zero blur and pristine clarity.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Technologies</h4>
            <ul className="text-sm space-y-1.5 text-text-muted">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-primary-light" />
                <span>Replicate Big-LaMa</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent-light" />
                <span>FFmpeg WebAssembly</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Konva Canvas Engine</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Features</h4>
            <ul className="text-sm space-y-1.5 text-text-muted">
              <li>High-Precision Brush Masking</li>
              <li>Before & After Split Slider</li>
              <li>Frame-by-Frame Video Inpainting</li>
              <li>Zero Quality Degradation</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-text-dim gap-4">
          <p>© {new Date().getFullYear()} WatermarkOut. Built with Next.js 14, Replicate AI & FFmpeg WASM.</p>
          <div className="flex items-center gap-4">
            <span>Privacy First · Browser-Processed Video</span>
            <span>·</span>
            <span>Clean Quality Guaranteed</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
