import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { demoPredictions } from '@/lib/demo-store'

export async function POST(req: NextRequest) {
  try {
    const { image, mask, model = 'cjwbw/big-lama', prompt = '' } = await req.json()

    if (!image || !mask) {
      return NextResponse.json(
        { error: 'Both image and mask data are required' },
        { status: 400 }
      )
    }

    const token = process.env.REPLICATE_API_TOKEN

    // Fallback Demo Mode if token is not configured
    if (!token || token.trim() === '' || token.includes('your_')) {
      const demoId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Store demo task
      demoPredictions.set(demoId, {
        status: 'succeeded',
        output: image, // in demo mode, client performs real-time smart texture patch synthesis
        createdAt: Date.now(),
      })

      // Clean old demo items (> 10 mins)
      const now = Date.now()
      demoPredictions.forEach((data, id) => {
        if (now - data.createdAt > 600000) {
          demoPredictions.delete(id)
        }
      })

      return NextResponse.json({
        id: demoId,
        isDemo: true,
        message: 'Running in Demo Mode. To use Replicate Cloud GPU Inpainting, add REPLICATE_API_TOKEN in .env.local',
      })
    }

    const replicate = new Replicate({
      auth: token,
    })

    // Replicate model identifier
    // cjwbw/big-lama: Large Mask Inpainting
    // stability-ai/stable-diffusion-inpainting: SD Inpainting
    let prediction: any

    if (model === 'stability-ai/stable-diffusion-inpainting') {
      prediction = await replicate.predictions.create({
        version: '95b7223104132402a9ae84ccfb07742084b748269e280023c1d3a84a929f2abf',
        input: {
          image,
          mask,
          prompt: prompt || 'high quality, clean background, seamless removal',
          num_outputs: 1,
        },
      })
    } else {
      // Default: cjwbw/big-lama
      // Using model name or specific version
      try {
        prediction = await replicate.predictions.create({
          model: 'cjwbw/big-lama',
          input: {
            image,
            mask,
          },
        })
      } catch (err: any) {
        // If model name requires version hash fallback
        prediction = await replicate.predictions.create({
          version: 'da3fd90e026da72ce714e63493d168057388934c9f0040f9160264d7a46f742f',
          input: {
            image,
            mask,
          },
        })
      }
    }

    return NextResponse.json({ id: prediction.id, isDemo: false })
  } catch (error: any) {
    console.error('Inpaint API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error while initiating inpainting' },
      { status: 500 }
    )
  }
}
