'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wand2, Image as ImageIcon, Video, Sparkles, Github, ShieldCheck } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary via-accent to-blue-400 p-[1px] shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
            <div className="w-full h-full bg-surface rounded-[11px] flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary-light group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-primary-light transition-colors">
                Watermark<span className="text-gradient">Out</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-light border border-primary/30">
                AI Pro
              </span>
            </div>
            <span className="text-xs text-text-dim hidden sm:inline-block">Neural Inpainting Studio</span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              pathname === '/'
                ? 'bg-surface-hover text-white border border-border'
                : 'text-text-muted hover:text-white hover:bg-surface/60'
            }`}
          >
            Home
          </Link>
          <Link
            href="/editor/image"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              pathname.startsWith('/editor/image')
                ? 'bg-primary/20 text-primary-light border border-primary/40'
                : 'text-text-muted hover:text-white hover:bg-surface/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Editor</span>
          </Link>
          <Link
            href="/editor/video"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              pathname.startsWith('/editor/video')
                ? 'bg-accent/20 text-accent-light border border-accent/40'
                : 'text-text-muted hover:text-white hover:bg-surface/60'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video Editor</span>
          </Link>
        </nav>

        {/* Right Status / Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LaMa AI Model Active</span>
          </div>

          <a
            href="https://replicate.com/cjwbw/big-lama"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white px-2.5 py-1.5 rounded-lg border border-border hover:border-text-dim transition-all"
            title="Powered by Replicate LaMa model"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Big-LaMa</span>
          </a>
        </div>
      </div>
    </header>
  )
}
