export interface InpaintResponse {
  id: string
  status?: string
  output?: string | string[]
  isDemo?: boolean
  error?: string
}

export async function startInpaint(
  imageBase64: string,
  maskBase64: string,
  model = 'cjwbw/big-lama',
  prompt = ''
): Promise<InpaintResponse> {
  const res = await fetch('/api/inpaint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      mask: maskBase64,
      model,
      prompt,
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to start inpainting (${res.status})`)
  }

  return await res.json()
}

export async function pollUntilDone(
  id: string,
  onProgress?: (pct: number, message: string) => void
): Promise<string> {
  // If demo mock id, return immediate mock result
  if (id.startsWith('demo_')) {
    onProgress?.(30, 'Synthesizing neural background...')
    await sleep(800)
    onProgress?.(70, 'Blending surrounding textures...')
    await sleep(800)
    onProgress?.(100, 'Complete!')
    // Return stored demo result
    const res = await fetch(`/api/inpaint-poll/${id}`)
    const data = await res.json()
    return Array.isArray(data.output) ? data.output[0] : data.output
  }

  let attempts = 0
  const maxAttempts = 120 // up to 4 minutes
  let pollInterval = 1500

  while (attempts < maxAttempts) {
    await sleep(pollInterval)

    const res = await fetch(`/api/inpaint-poll/${id}`)
    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited, back off
        pollInterval = Math.min(pollInterval * 1.5, 6000)
        attempts++
        continue
      }
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Polling failed (${res.status})`)
    }

    const { status, output, error } = await res.json()

    if (status === 'succeeded' && output) {
      onProgress?.(100, 'Complete!')
      return Array.isArray(output) ? output[0] : output
    }

    if (status === 'failed' || error) {
      throw new Error(error || 'Inpainting prediction failed')
    }

    if (status === 'canceled') {
      throw new Error('Prediction was canceled')
    }

    // Heuristic progress estimation
    let pct = 10
    let msg = 'Initializing AI model...'
    if (status === 'starting') {
      pct = Math.min(15 + attempts * 3, 35)
      msg = 'Warming up LaMa neural network...'
    } else if (status === 'processing') {
      pct = Math.min(35 + attempts * 4, 92)
      msg = 'Inpainting watermark and synthesizing textures...'
    }

    onProgress?.(pct, msg)
    attempts++
  }

  throw new Error('Prediction timed out after 4 minutes')
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
