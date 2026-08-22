import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { demoPredictions } from '@/lib/demo-store'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Prediction ID required' }, { status: 400 })
    }

    // Demo Mode handling
    if (id.startsWith('demo_')) {
      const demo = demoPredictions.get(id)
      return NextResponse.json({
        status: demo ? demo.status : 'succeeded',
        output: demo ? demo.output : null,
        isDemo: true,
      })
    }

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured on server' },
        { status: 500 }
      )
    }

    const replicate = new Replicate({
      auth: token,
    })

    const prediction = await replicate.predictions.get(id)

    return NextResponse.json({
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs,
    })
  } catch (error: any) {
    console.error('Inpaint polling error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to poll prediction status' },
      { status: 500 }
    )
  }
}
