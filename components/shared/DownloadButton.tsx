'use client'

import { useState } from 'react'
import { Download, ChevronDown, Check, Sparkles } from 'lucide-react'
import { downloadBlob, downloadUrl } from '@/lib/image-utils'
import confetti from 'canvas-confetti'

interface DownloadButtonProps {
  url?: string | null
  blob?: Blob | null
  filename?: string
  type?: 'image' | 'video'
  className?: string
}

export function DownloadButton({
  url,
  blob,
  filename = 'watermarkout_clean',
  type = 'image',
  className = '',
}: DownloadButtonProps) {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'mp4'>(
    type === 'video' ? 'mp4' : 'png'
  )
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#8b5cf6', '#10b981', '#60a5fa'],
    })
  }

  const handleDownload = async (chosenFormat = format) => {
    if (!url && !blob) return
    setDownloading(true)
    triggerConfetti()

    try {
      if (type === 'video') {
        const finalName = `${filename}.${chosenFormat}`
        if (blob) {
          downloadBlob(blob, finalName)
        } else if (url) {
          downloadUrl(url, finalName)
        }
      } else {
        // Image format conversion
        const finalName = `${filename}.${chosenFormat}`

        if (url && (chosenFormat === 'jpeg' || chosenFormat === 'webp')) {
          // Convert using canvas
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')!
            if (chosenFormat === 'jpeg') {
              ctx.fillStyle = '#FFFFFF'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
            ctx.drawImage(img, 0, 0)
            canvas.toBlob(
              (newBlob) => {
                if (newBlob) downloadBlob(newBlob, finalName)
                else downloadUrl(url, finalName)
                setDownloading(false)
              },
              `image/${chosenFormat}`,
              0.95
            )
          }
          img.onerror = () => {
            downloadUrl(url, finalName)
            setDownloading(false)
          }
          img.src = url
          return
        }

        if (blob) {
          downloadBlob(blob, finalName)
        } else if (url) {
          downloadUrl(url, finalName)
        }
      }
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setDownloading(false)
      setIsMenuOpen(false)
    }
  }

  return (
    <div className={`relative inline-flex rounded-xl shadow-lg shadow-primary/20 ${className}`}>
      <button
        onClick={() => handleDownload(format)}
        disabled={downloading || (!url && !blob)}
        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-l-xl bg-gradient-to-r from-primary via-blue-600 to-accent text-white font-semibold text-sm hover:from-primary-hover hover:to-accent-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
        <span>
          {downloading
            ? 'Downloading...'
            : `Download Clean ${type === 'video' ? 'MP4' : format.toUpperCase()}`}
        </span>
      </button>

      {type === 'image' && (
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={!url && !blob}
            className="h-full px-2.5 bg-accent/90 hover:bg-accent text-white border-l border-white/20 rounded-r-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Choose format"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-44 bg-surface border border-border rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-text-dim uppercase tracking-wider">
                Select Format
              </div>
              {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    setFormat(fmt)
                    handleDownload(fmt)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    format === fmt
                      ? 'bg-primary/20 text-primary-light font-medium'
                      : 'text-text-muted hover:bg-surface-hover hover:text-white'
                  }`}
                >
                  <span>{fmt.toUpperCase()} Image</span>
                  {format === fmt && <Check className="w-3.5 h-3.5 text-primary-light" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
