/**
 * Detect letterbox / pillarbox bars in an image (canvas-based).
 *
 * Common scenario: YouTube cinematic thumbnails are 1280×720 with content
 * letterboxed — when imported into Riff cover (1080×890), the bars carry
 * through. This util finds the content bbox so we can offer auto-trim.
 *
 * Algorithm:
 *   1. Sample each row (top→down) until we find a row where ≥5% of pixels
 *      are NOT near-black → that's the top of content.
 *   2. Repeat from bottom-up, left-in, right-in.
 *   3. If total trimmed > 40% of dim → mark untrustworthy (likely a dark
 *      scene, not bars). Caller should warn instead of silently trimming.
 *
 * Runs entirely client-side in a regular HTMLCanvasElement (broad support).
 */

const NEAR_BLACK_THRESHOLD = 24 // RGB ≤ 24 each = "near black"
const BAR_RATIO_THRESHOLD = 0.95 // ≥95% near-black pixels in a line = bar
const UNTRUSTWORTHY_TRIM_RATIO = 0.4 // >40% trimmed on either axis = suspicious

export type BlackBarBox = {
  top: number
  bottom: number // pixels trimmed from bottom
  left: number
  right: number // pixels trimmed from right
  trustworthy: boolean
  width: number // original image width
  height: number // original image height
}

export async function detectBlackBars(imageUrl: string): Promise<BlackBarBox> {
  const img = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return defaultBox(img.naturalWidth, img.naturalHeight, false)
  }
  ctx.drawImage(img, 0, 0)

  let imageData: ImageData
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  } catch {
    // CORS-tainted canvas — can't read pixels. Return no-trim.
    return defaultBox(img.naturalWidth, img.naturalHeight, false)
  }
  const { data, width, height } = imageData

  const rowIsBar = (y: number): boolean => {
    let blackCount = 0
    const rowStart = y * width * 4
    for (let x = 0; x < width; x++) {
      const i = rowStart + x * 4
      if (
        data[i] <= NEAR_BLACK_THRESHOLD &&
        data[i + 1] <= NEAR_BLACK_THRESHOLD &&
        data[i + 2] <= NEAR_BLACK_THRESHOLD
      ) {
        blackCount++
      }
    }
    return blackCount / width >= BAR_RATIO_THRESHOLD
  }

  const colIsBar = (x: number): boolean => {
    let blackCount = 0
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4
      if (
        data[i] <= NEAR_BLACK_THRESHOLD &&
        data[i + 1] <= NEAR_BLACK_THRESHOLD &&
        data[i + 2] <= NEAR_BLACK_THRESHOLD
      ) {
        blackCount++
      }
    }
    return blackCount / height >= BAR_RATIO_THRESHOLD
  }

  let top = 0
  while (top < height && rowIsBar(top)) top++

  let bottom = 0
  while (bottom < height - top && rowIsBar(height - 1 - bottom)) bottom++

  let left = 0
  while (left < width && colIsBar(left)) left++

  let right = 0
  while (right < width - left && colIsBar(width - 1 - right)) right++

  const trimVertical = (top + bottom) / height
  const trimHorizontal = (left + right) / width
  const trustworthy =
    trimVertical < UNTRUSTWORTHY_TRIM_RATIO &&
    trimHorizontal < UNTRUSTWORTHY_TRIM_RATIO

  return { top, bottom, left, right, trustworthy, width, height }
}

function defaultBox(width: number, height: number, trustworthy: boolean): BlackBarBox {
  return { top: 0, bottom: 0, left: 0, right: 0, trustworthy, width, height }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

/**
 * Render a cropped canvas region to a PNG Blob.
 * Used to send the cropper output to Storage upload.
 *
 * pixelArea is in image native pixels (matches react-easy-crop onCropComplete
 * second argument).
 */
export async function cropImageToBlob(
  imageUrl: string,
  pixelArea: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const img = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = pixelArea.width
  canvas.height = pixelArea.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')

  ctx.drawImage(
    img,
    pixelArea.x,
    pixelArea.y,
    pixelArea.width,
    pixelArea.height,
    0,
    0,
    pixelArea.width,
    pixelArea.height,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('canvas toBlob returned null'))
        else resolve(blob)
      },
      'image/png',
      1.0,
    )
  })
}
