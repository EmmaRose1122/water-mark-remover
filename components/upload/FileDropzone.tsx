'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useStore, SAMPLE_IMAGES, SampleItem } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { UploadCloud, Image as ImageIcon, Video, Sparkles, AlertCircle, FileCheck2 } from 'lucide-react'
import { formatBytes } from '@/lib/image-utils'

interface FileDropzoneProps {
  type: 'image' | 'video'
  accept: Record<string, string[]>
  maxSize: number
  title?: string
  description?: string
}

export function FileDropzone({
  type,
  accept,
  maxSize,
  title,
  description,
}: FileDropzoneProps) {
  const router = useRouter()
  const { setFile, loadSampleImage } = useStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoadingSample, setIsLoadingSample] = useState(false)

  const isImage = type === 'image'

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept,
    maxSize,
    multiple: false,
    onDropAccepted: ([file]) => {
      setErrorMessage(null)
      setFile(type, file)
      router.push(`/editor/${type}`)
    },
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0]
      if (err?.code === 'file-too-large') {
        setErrorMessage(`File is too large. Max size is ${formatBytes(maxSize)}.`)
      } else if (err?.code === 'file-invalid-type') {
        setErrorMessage(`Invalid file format. Please upload a supported ${type} file.`)
      } else {
        setErrorMessage(err?.message || 'File upload rejected.')
      }
    },
  })

  const handleSampleClick = async (sample: SampleItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoadingSample(true)
    try {
      await loadSampleImage(sample)
      router.push('/editor/image')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingSample(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        {...getRootProps()}
        className={`
          group relative flex flex-col items-center justify-center p-8 rounded-2xl
          border-2 border-dashed transition-all duration-300 cursor-pointer text-center
          ${
            isDragActive
              ? isImage
                ? 'border-primary bg-primary/10 shadow-2xl shadow-primary/20 scale-[1.01]'
                : 'border-accent bg-accent/10 shadow-2xl shadow-accent/20 scale-[1.01]'
              : 'border-border/80 bg-surface/80 hover:border-border-active hover:bg-surface-hover/90'
          }
          ${isDragReject ? 'border-red-500 bg-red-500/10' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Ambient Glow */}
        <div
          className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 ${
            isImage ? 'bg-primary/20' : 'bg-accent/20'
          }`}
        />

        {/* Icon */}
        <div
          className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isImage
              ? 'bg-gradient-to-tr from-blue-600/30 to-primary/20 border border-primary/40 text-primary-light group-hover:scale-110 shadow-lg shadow-primary/20'
              : 'bg-gradient-to-tr from-purple-600/30 to-accent/20 border border-accent/40 text-accent-light group-hover:scale-110 shadow-lg shadow-accent/20'
          }`}
        >
          {isImage ? <ImageIcon className="w-8 h-8" /> : <Video className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary-light transition-colors">
          {title || (isImage ? 'Remove Watermark from Image' : 'Remove Watermark from Video')}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-muted max-w-xs mb-4">
          {description ||
            (isImage
              ? 'Drag & drop your JPG, PNG, WebP or click to browse'
              : 'Drag & drop your MP4, MOV, WebM or click to browse')}
        </p>

        {/* Badges / Specs */}
        <div className="flex items-center gap-2 text-xs text-text-dim bg-background/60 px-3 py-1.5 rounded-full border border-border">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Max {formatBytes(maxSize)}</span>
          <span>•</span>
          <span>Zero quality loss</span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Quick Test Demo Samples (for images) */}
      {isImage && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-text-dim px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or try with a sample image:</span>
            </span>
            {isLoadingSample && <span className="text-primary-light animate-pulse">Loading sample...</span>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={(e) => handleSampleClick(sample, e)}
                disabled={isLoadingSample}
                className="group relative flex flex-col items-center p-2 rounded-xl bg-surface/60 border border-border hover:border-primary/50 hover:bg-surface-hover transition-all text-left overflow-hidden cursor-pointer"
              >
                <div className="w-full h-16 rounded-lg overflow-hidden mb-1.5 bg-background relative">
                  <img
                    src={sample.thumbnail}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] px-1 py-0.5 rounded bg-black/70 text-white font-medium">
                    {sample.category}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-text-muted group-hover:text-white line-clamp-1 w-full text-center">
                  {sample.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
