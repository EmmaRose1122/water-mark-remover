# 🎯 WatermarkOut — AI Watermark Remover

A production-ready **Next.js 14** web application that removes watermarks (text overlays, logos, image stamps, timestamps) from photos and videos using **AI inpainting** (Replicate `cjwbw/big-lama` model) and **WebAssembly Video Processing** (`@ffmpeg/ffmpeg`).

The AI fills the removed area intelligently using surrounding context — zero blur, zero quality degradation.

---

## ✨ Features

- **High-Precision Mask Drawing**: Interactive `react-konva` canvas with brush, eraser, zoom & pan, and high-resolution export.
- **State-of-the-Art Inpainting**: Powered by `cjwbw/big-lama` for crisp texture synthesis and `stability-ai/stable-diffusion-inpainting` for complex compositions.
- **Before / After Comparison**: Interactive drag split slider, side-by-side view, hold-to-compare, and magnifying loupe inspector.
- **Browser-Based Video Processing**: Client-side `@ffmpeg/ffmpeg` WebAssembly frame extraction and reconstruction with audio preservation.
- **Smart Fast Video Mode**: Inpaints a keyframe patch once and blends it across all video frames in seconds.
- **Demo / Fallback Mode**: Test the complete workflow even before setting up a Replicate API token.
- **Multi-Format Export**: Download clean photos as PNG, JPG, or WebP, and clean videos as MP4.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```env
REPLICATE_API_TOKEN=your_replicate_api_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> Get your free token at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| **Framework** | Next.js 14 App Router + TypeScript |
| **Styling** | Tailwind CSS v3 (Dark Navy Glassmorphism Theme) |
| **Canvas / Masking** | `react-konva` + `konva` + `use-image` |
| **AI Inpainting** | Replicate API (`cjwbw/big-lama`) |
| **Video Processing** | `@ffmpeg/ffmpeg` 0.12 (WebAssembly) |
| **Global State** | `zustand` |
| **Icons** | `lucide-react` |
| **Celebration FX** | `canvas-confetti` |

---

## 📂 Project Structure

```
watermarkout/
├── app/
│   ├── layout.tsx                         # Root layout with Inter font & dark theme
│   ├── page.tsx                           # Landing page with hero & upload cards
│   ├── editor/
│   │   ├── image/page.tsx                 # 3-column Image Watermark studio
│   │   └── video/page.tsx                 # Video Watermark studio & scrubber
│   └── api/
│       ├── inpaint/route.ts               # POST: initiate Replicate AI prediction
│       └── inpaint-poll/[id]/route.ts     # GET: poll prediction status
├── components/
│   ├── upload/
│   │   └── FileDropzone.tsx               # Drag & drop upload card with samples
│   ├── canvas/
│   │   ├── MaskCanvas.tsx                 # Dynamic SSR-safe Konva wrapper
│   │   ├── KonvaCanvasInner.tsx           # Full Konva brush & mask engine
│   │   └── BeforeAfterSlider.tsx          # Interactive split & loupe comparison
│   ├── video/
│   │   ├── VideoProcessor.tsx             # Video pipeline orchestrator
│   │   └── ProcessingSteps.tsx            # Animated multi-step progress UI
│   └── shared/
│       ├── Header.tsx                     # Top navigation & status
│       ├── Footer.tsx                     # Footer & tech links
│       ├── ProgressBar.tsx                # Animated progress track
│       └── DownloadButton.tsx             # Multi-format download with confetti
├── lib/
│   ├── replicate.ts                       # Replicate API client & polling
│   ├── ffmpeg-helpers.ts                  # FFmpeg WASM extract & reconstruct
│   ├── image-utils.ts                     # Base64, canvas synthesis & formatters
│   └── store.ts                           # Zustand global store & demo samples
├── next.config.mjs                        # COOP/COEP headers & remote domains
├── tailwind.config.js                     # Custom color palette & glow effects
└── vercel.json                            # Serverless function maxDuration config
```
