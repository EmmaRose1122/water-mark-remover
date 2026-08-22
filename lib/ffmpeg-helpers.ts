import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let isFFmpegLoading = false

export function isSharedArrayBufferSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.SharedArrayBuffer !== 'undefined'
}

export async function loadFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance
  }

  if (isFFmpegLoading) {
    while (isFFmpegLoading) {
      await new Promise((r) => setTimeout(r, 200))
    }
    if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance
  }

  isFFmpegLoading = true
  const ffmpeg = new FFmpeg()

  if (onLog) {
    ffmpeg.on('log', ({ message }) => onLog(message))
  }

  // Attempt 1: Load from unpkg / jsdelivr @ffmpeg/core@0.12.10 (Exact matched version)
  try {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpegInstance = ffmpeg
    isFFmpegLoading = false
    return ffmpeg
  } catch (cdnErr) {
    console.warn('Primary CDN FFmpeg load failed, attempting jsdelivr fallback:', cdnErr)
  }

  // Attempt 2: Load from jsdelivr CDN
  try {
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpegInstance = ffmpeg
    isFFmpegLoading = false
    return ffmpeg
  } catch (jsDelivrErr) {
    console.warn('jsDelivr FFmpeg load failed, attempting local fallback:', jsDelivrErr)
  }

  // Attempt 3: Load from local origin
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    await ffmpeg.load({
      coreURL: await toBlobURL(`${origin}/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${origin}/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpegInstance = ffmpeg
    isFFmpegLoading = false
    return ffmpeg
  } catch (localErr) {
    isFFmpegLoading = false
    console.error('All FFmpeg load attempts failed:', localErr)
    throw new Error('WebAssembly FFmpeg engine unavailable in this browser environment.')
  }
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
}

export interface ExtractedFramesData {
  frames: Blob[]
  fps: number
  audioBlob: Blob | null
  metadata: VideoMetadata
}

/**
 * Extracts a single keyframe from a video at a given timestamp using HTML5 video element
 */
export function extractVideoKeyframe(
  videoFile: File,
  time = 0
): Promise<{ frameBlob: Blob; frameDataUrl: string; width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(videoFile)
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, Math.max(0, video.duration - 0.1))
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return reject(new Error('Failed to get 2D canvas context'))
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              frameBlob: blob,
              frameDataUrl: dataUrl,
              width: canvas.width,
              height: canvas.height,
              duration: video.duration,
            })
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
          URL.revokeObjectURL(video.src)
        },
        'image/jpeg',
        0.95
      )
    }

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata: ' + e))
    }
  })
}

/**
 * Extracts all frames and audio from a video using FFmpeg WASM
 */
export async function extractFrames(
  ffmpeg: FFmpeg,
  videoFile: File,
  targetFps = 24,
  maxDuration = 10,
  onProgress?: (pct: number) => void
): Promise<ExtractedFramesData> {
  const inputName = 'input.mp4'
  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))

  // Extract audio universally using uncompressed PCM WAV (guaranteed to work for any audio codec)
  let audioBlob: Blob | null = null
  try {
    await ffmpeg.exec(['-i', inputName, '-vn', '-c:a', 'pcm_s16le', '-ar', '44100', 'audio.wav'])
    const audioData = await ffmpeg.readFile('audio.wav')
    audioBlob = new Blob([audioData as any], { type: 'audio/wav' })
  } catch (e) {
    console.warn('No audio stream or failed audio extraction:', e)
  }

  // Extract frames limited to maxDuration to protect browser memory
  const fps = targetFps
  await ffmpeg.exec([
    '-i',
    inputName,
    '-t',
    String(maxDuration),
    '-vf',
    `fps=${fps}`,
    '-f',
    'image2',
    'frame_%04d.png',
  ])

  const frames: Blob[] = []
  let idx = 1

  while (true) {
    const filename = `frame_${String(idx).padStart(4, '0')}.png`
    try {
      const data = await ffmpeg.readFile(filename)
      frames.push(new Blob([data as any], { type: 'image/png' }))
      await ffmpeg.deleteFile(filename).catch(() => null)
      idx++
      if (onProgress) {
        onProgress(Math.min(95, Math.round((idx / (maxDuration * fps)) * 100)))
      }
    } catch {
      break // No more frames
    }
  }

  await ffmpeg.deleteFile(inputName).catch(() => null)
  if (audioBlob) {
    await ffmpeg.deleteFile('audio.wav').catch(() => null)
  }

  onProgress?.(100)

  return {
    frames,
    fps,
    audioBlob,
    metadata: {
      duration: frames.length / fps,
      width: 0,
      height: 0,
      fps,
    },
  }
}

/**
 * Reconstructs MP4 video from inpainted image frames
 */
export async function reconstructVideo(
  ffmpeg: FFmpeg,
  frames: Blob[],
  fps = 24,
  audioBlob: Blob | null = null,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  // Write frames to virtual FS
  for (let i = 0; i < frames.length; i++) {
    const filename = `out_${String(i + 1).padStart(4, '0')}.png`
    await ffmpeg.writeFile(filename, await fetchFile(frames[i]))
    if (onProgress && i % 5 === 0) {
      onProgress(Math.round((i / frames.length) * 40))
    }
  }

  const args: string[] = ['-framerate', String(fps), '-i', 'out_%04d.png']

  if (audioBlob) {
    await ffmpeg.writeFile('audio.wav', await fetchFile(audioBlob))
    args.push('-i', 'audio.wav', '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'ultrafast', '-shortest', 'output.mp4')
  } else {
    args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'ultrafast', 'output.mp4')
  }

  onProgress?.(60)
  await ffmpeg.exec(args)
  onProgress?.(90)

  const data = await ffmpeg.readFile('output.mp4')

  // Clean up
  for (let i = 0; i < frames.length; i++) {
    await ffmpeg.deleteFile(`out_${String(i + 1).padStart(4, '0')}.png`).catch(() => null)
  }
  if (audioBlob) {
    await ffmpeg.deleteFile('audio.wav').catch(() => null)
  }
  await ffmpeg.deleteFile('output.mp4').catch(() => null)

  onProgress?.(100)
  return new Blob([data as any], { type: 'video/mp4' })
}
