import { create } from 'zustand'

export interface SampleItem {
  id: string
  title: string
  thumbnail: string
  url: string
  watermarkDescription: string
  category: 'text' | 'logo' | 'stamp' | 'photobomb'
}

export const SAMPLE_IMAGES: SampleItem[] = [
  {
    id: 'sample-1',
    title: 'Camera Timestamp & Text',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=90',
    watermarkDescription: 'Timestamp watermark in bottom right',
    category: 'text'
  },
  {
    id: 'sample-2',
    title: 'Stock Photo Overlay Logo',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=90',
    watermarkDescription: 'Diagonal watermark pattern across portrait',
    category: 'logo'
  },
  {
    id: 'sample-3',
    title: 'Copyright Banner & Signature',
    thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=90',
    watermarkDescription: 'Signature badge in bottom left',
    category: 'stamp'
  }
]

interface AppStore {
  imageFile: File | null
  imagePreviewUrl: string | null
  videoFile: File | null
  videoPreviewUrl: string | null
  maskDataUrl: string | null
  brushSize: number
  activeTool: 'brush' | 'eraser'
  model: 'cjwbw/big-lama' | 'stability-ai/stable-diffusion-inpainting'
  promptText: string
  selectedSample: SampleItem | null
  
  // Actions
  setFile: (type: 'image' | 'video', file: File) => void
  setImagePreviewUrl: (url: string | null) => void
  setVideoPreviewUrl: (url: string | null) => void
  setMask: (mask: string | null) => void
  setBrushSize: (size: number) => void
  setActiveTool: (tool: 'brush' | 'eraser') => void
  setModel: (model: 'cjwbw/big-lama' | 'stability-ai/stable-diffusion-inpainting') => void
  setPromptText: (prompt: string) => void
  loadSampleImage: (sample: SampleItem) => Promise<void>
  clear: () => void
}

export const useStore = create<AppStore>((set) => ({
  imageFile: null,
  imagePreviewUrl: null,
  videoFile: null,
  videoPreviewUrl: null,
  maskDataUrl: null,
  brushSize: 28,
  activeTool: 'brush',
  model: 'cjwbw/big-lama',
  promptText: '',
  selectedSample: null,

  setFile: (type, file) => {
    const previewUrl = URL.createObjectURL(file)
    if (type === 'image') {
      set({
        imageFile: file,
        imagePreviewUrl: previewUrl,
        maskDataUrl: null,
        selectedSample: null,
      })
    } else {
      set({
        videoFile: file,
        videoPreviewUrl: previewUrl,
        maskDataUrl: null,
        selectedSample: null,
      })
    }
  },

  setImagePreviewUrl: (url) => set({ imagePreviewUrl: url }),
  setVideoPreviewUrl: (url) => set({ videoPreviewUrl: url }),
  setMask: (mask) => set({ maskDataUrl: mask }),
  setBrushSize: (size) => set({ brushSize: size }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setModel: (model) => set({ model }),
  setPromptText: (promptText) => set({ promptText }),

  loadSampleImage: async (sample: SampleItem) => {
    try {
      const res = await fetch(sample.url)
      const blob = await res.blob()
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(blob)
      set({
        imageFile: file,
        imagePreviewUrl: previewUrl,
        maskDataUrl: null,
        selectedSample: sample,
      })
    } catch (e) {
      console.error('Failed to load sample image:', e)
    }
  },

  clear: () =>
    set({
      imageFile: null,
      imagePreviewUrl: null,
      videoFile: null,
      videoPreviewUrl: null,
      maskDataUrl: null,
      selectedSample: null,
    }),
}))
