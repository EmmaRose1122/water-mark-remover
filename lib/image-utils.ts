export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadUrl(url: string, filename: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    downloadBlob(blob, filename)
  } catch (err) {
    console.error('Download failed, opening in new tab:', err)
    window.open(url, '_blank')
  }
}

export function getImageDimensions(src: string | File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    if (typeof src === 'string') {
      img.src = src
    } else {
      img.src = URL.createObjectURL(src)
    }
  })
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

/**
 * Converts a Black & White mask (white = watermark area, black = background)
 * into an Alpha-Clipped Mask (white = fully opaque, black = 100% transparent)
 */
export function createAlphaMask(maskDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(maskDataUrl)

      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // White or light stroke in mask
        const isWhite = r > 100 && g > 100 && b > 100
        if (isWhite) {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
          data[i + 3] = 255 // Opaque watermark region
        } else {
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
          data[i + 3] = 0 // Transparent background
        }
      }

      ctx.putImageData(imgData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = maskDataUrl
  })
}

/**
 * High-Precision Exemplar & Structure-Aware Inpainting (Zero Blur)
 * Completely eliminates watermarks, logos, stamps, and text by transferring
 * sharp high-resolution texture patches from surrounding background.
 */
export async function createDemoInpaintedImage(imageSrc: string, maskDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const mask = new Image()
    img.crossOrigin = 'anonymous'
    mask.crossOrigin = 'anonymous'

    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount === 2) {
        process()
      }
    }

    img.onload = checkLoaded
    img.onerror = reject
    mask.onload = checkLoaded
    mask.onerror = reject

    img.src = imageSrc
    mask.src = maskDataUrl

    function process() {
      const canvas = document.createElement('canvas')
      const w = img.naturalWidth || img.width || 800
      const h = img.naturalHeight || img.height || 600
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(imageSrc)

      // Draw original image
      ctx.drawImage(img, 0, 0, w, h)

      // Create mask canvas
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = w
      maskCanvas.height = h
      const maskCtx = maskCanvas.getContext('2d')
      if (!maskCtx) return resolve(imageSrc)

      maskCtx.drawImage(mask, 0, 0, w, h)
      const maskData = maskCtx.getImageData(0, 0, w, h)
      const imgData = ctx.getImageData(0, 0, w, h)

      const data = imgData.data
      const mData = maskData.data

      // Create binary mask (1 = watermark to remove, 0 = keep background)
      const isMasked = new Uint8Array(w * h)
      let minX = w, maxX = 0, minY = h, maxY = 0
      let maskedCount = 0

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4
          // White mask pixels (R, G, B > 100)
          if (mData[idx] > 100 && mData[idx + 1] > 100 && mData[idx + 2] > 100) {
            isMasked[y * w + x] = 1
            maskedCount++
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      if (maskedCount === 0) {
        return resolve(imageSrc)
      }

      // Safety dilation (4px) to completely eliminate watermark glow and antialiasing
      const dilatedMask = new Uint8Array(w * h)
      const dilation = 4
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (isMasked[y * w + x] === 1) {
            for (let dy = -dilation; dy <= dilation; dy++) {
              for (let dx = -dilation; dx <= dilation; dx++) {
                const ny = y + dy
                const nx = x + dx
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  dilatedMask[ny * w + nx] = 1
                }
              }
            }
          }
        }
      }

      minX = Math.max(0, minX - dilation)
      maxX = Math.min(w - 1, maxX + dilation)
      minY = Math.max(0, minY - dilation)
      maxY = Math.min(h - 1, maxY + dilation)

      const outputData = new Uint8ClampedArray(data)
      const filledState = new Uint8Array(dilatedMask)

      // Collect clean background source samples nearby
      const patchRadius = 6 // 13x13 patch
      const searchRadius = 90
      const sMinX = Math.max(0, minX - searchRadius)
      const sMaxX = Math.min(w - 1, maxX + searchRadius)
      const sMinY = Math.max(0, minY - searchRadius)
      const sMaxY = Math.min(h - 1, maxY + searchRadius)

      const sourceCandidates: { x: number; y: number }[] = []
      for (let sy = sMinY + patchRadius; sy <= sMaxY - patchRadius; sy += 3) {
        for (let sx = sMinX + patchRadius; sx <= sMaxX - patchRadius; sx += 3) {
          let clean = true
          for (let dy = -patchRadius; dy <= patchRadius && clean; dy += 3) {
            for (let dx = -patchRadius; dx <= patchRadius; dx += 3) {
              if (dilatedMask[(sy + dy) * w + (sx + dx)] === 1) {
                clean = false
                break
              }
            }
          }
          if (clean) {
            sourceCandidates.push({ x: sx, y: sy })
          }
        }
      }

      // Fallback if near region is mostly masked: sample full image perimeter
      if (sourceCandidates.length < 30) {
        for (let sy = patchRadius; sy < h - patchRadius; sy += 8) {
          for (let sx = patchRadius; sx < w - patchRadius; sx += 8) {
            if (dilatedMask[sy * w + sx] === 0) {
              sourceCandidates.push({ x: sx, y: sy })
            }
          }
        }
      }

      // Iterative Inward Texture Synthesizer
      let uncompleted = 0
      for (let i = 0; i < w * h; i++) {
        if (filledState[i] === 1) uncompleted++
      }

      let iteration = 0
      const maxIterations = 2000

      while (uncompleted > 0 && iteration < maxIterations) {
        iteration++

        // Identify boundary pixels (pixels to fill)
        const boundary: { x: number; y: number; validNeighbors: number }[] = []

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            if (filledState[y * w + x] === 1) {
              let neighbors = 0
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const ny = y + dy
                  const nx = x + dx
                  if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    if (filledState[ny * w + nx] === 0) neighbors++
                  }
                }
              }
              if (neighbors > 0) {
                boundary.push({ x, y, validNeighbors: neighbors })
              }
            }
          }
        }

        if (boundary.length === 0) break

        // Prioritize pixels with the most filled neighbors
        boundary.sort((a, b) => b.validNeighbors - a.validNeighbors)
        const batch = boundary.slice(0, Math.min(40, boundary.length))

        for (const target of batch) {
          const tx = target.x
          const ty = target.y

          if (filledState[ty * w + tx] === 0) continue

          // Find best matching source patch
          let bestSrc = sourceCandidates[0] || { x: Math.max(0, tx - 30), y: Math.max(0, ty - 30) }
          let bestScore = Infinity

          const sampleStep = Math.max(1, Math.floor(sourceCandidates.length / 80))

          for (let i = 0; i < sourceCandidates.length; i += sampleStep) {
            const cand = sourceCandidates[i]
            let diff = 0
            let count = 0

            for (let dy = -patchRadius; dy <= patchRadius; dy += 2) {
              for (let dx = -patchRadius; dx <= patchRadius; dx += 2) {
                const cx = tx + dx
                const cy = ty + dy
                const sx = cand.x + dx
                const sy = cand.y + dy

                if (
                  cx >= 0 && cx < w && cy >= 0 && cy < h &&
                  sx >= 0 && sx < w && sy >= 0 && sy < h
                ) {
                  if (filledState[cy * w + cx] === 0) {
                    const cIdx = (cy * w + cx) * 4
                    const sIdx = (sy * w + sx) * 4
                    const dr = outputData[cIdx] - outputData[sIdx]
                    const dg = outputData[cIdx + 1] - outputData[sIdx + 1]
                    const db = outputData[cIdx + 2] - outputData[sIdx + 2]
                    diff += dr * dr + dg * dg + db * db
                    count++
                  }
                }
              }
            }

            const distPenalty = Math.hypot(cand.x - tx, cand.y - ty) * 0.5
            const score = (diff / (count || 1)) + distPenalty

            if (score < bestScore) {
              bestScore = score
              bestSrc = cand
            }
          }

          // Transfer pixels from best source
          for (let dy = -patchRadius; dy <= patchRadius; dy++) {
            for (let dx = -patchRadius; dx <= patchRadius; dx++) {
              const cx = tx + dx
              const cy = ty + dy
              const sx = bestSrc.x + dx
              const sy = bestSrc.y + dy

              if (
                cx >= 0 && cx < w && cy >= 0 && cy < h &&
                sx >= 0 && sx < w && sy >= 0 && sy < h
              ) {
                if (filledState[cy * w + cx] === 1) {
                  const cIdx = (cy * w + cx) * 4
                  const sIdx = (sy * w + sx) * 4

                  outputData[cIdx] = outputData[sIdx]
                  outputData[cIdx + 1] = outputData[sIdx + 1]
                  outputData[cIdx + 2] = outputData[sIdx + 2]
                  outputData[cIdx + 3] = 255

                  filledState[cy * w + cx] = 0
                  uncompleted--
                }
              }
            }
          }
        }
      }

      // If any stray inner pixels remain, fill from nearest synthesized neighbor
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (filledState[y * w + x] === 1) {
            const idx = (y * w + x) * 4
            const sIdx = (Math.max(0, y - patchRadius) * w + Math.max(0, x - patchRadius)) * 4
            outputData[idx] = outputData[sIdx]
            outputData[idx + 1] = outputData[sIdx + 1]
            outputData[idx + 2] = outputData[sIdx + 2]
            outputData[idx + 3] = 255
          }
        }
      }

      const finalImgData = ctx.createImageData(w, h)
      finalImgData.data.set(outputData)
      ctx.putImageData(finalImgData, 0, 0)

      resolve(canvas.toDataURL('image/png'))
    }
  })
}
