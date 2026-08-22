'use client'

import { useStore } from '@/lib/store'
import { VideoProcessor } from '@/components/video/VideoProcessor'
import { FileDropzone } from '@/components/upload/FileDropzone'
import { ArrowLeft, Film, UploadCloud, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function VideoEditorPage() {
  const { videoFile, clear } = useStore()

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Breadcrumb & Info Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">Video Watermark Studio</h1>
            <span className="text-[11px] font-semibold text-accent-light px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
              FFmpeg WASM
            </span>
          </div>
        </div>

        {videoFile && (
          <button
            onClick={() => clear()}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Different Video</span>
          </button>
        )}
      </div>

      {/* If No Video Selected -> Show Upload Dropzone */}
      {!videoFile ? (
        <div className="max-w-2xl mx-auto w-full my-auto py-12">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-2xl font-bold text-white">Select a Video to Clean</h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Upload an MP4, MOV, or WebM video with watermarks, channel logos, or text stamps.
            </p>
          </div>
          <FileDropzone
            type="video"
            accept={{
              'video/*': ['.mp4', '.mov', '.webm', '.m4v'],
            }}
            maxSize={200 * 1024 * 1024}
          />
        </div>
      ) : (
        /* Video Processor Orchestrator */
        <VideoProcessor videoFile={videoFile} onReset={() => clear()} />
      )}
    </div>
  )
}
