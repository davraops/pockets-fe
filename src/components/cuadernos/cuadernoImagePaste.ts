const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_WIDTH = 1920
const JPEG_QUALITY = 0.88

export function getClipboardImageFile(
  event: Pick<ClipboardEvent, 'clipboardData'>
): File | null {
  const items = event.clipboardData?.items
  if (!items) {
    return null
  }

  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item.getAsFile()
    }
  }

  return null
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('No se pudo leer la imagen'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Imagen inválida'))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('No se pudo comprimir la imagen'))
        }
      },
      type,
      quality
    )
  })
}

async function compressDataUrl(dataUrl: string, maxWidth: number): Promise<string> {
  const image = await loadImage(dataUrl)
  const scale = image.width > maxWidth ? maxWidth / image.width : 1
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No se pudo procesar la imagen')
  }
  context.drawImage(image, 0, 0, width, height)

  const outputType = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
  const blob = await canvasToBlob(
    canvas,
    outputType,
    outputType === 'image/jpeg' ? JPEG_QUALITY : undefined
  )

  if (blob.size > MAX_IMAGE_BYTES && outputType !== 'image/jpeg') {
    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY)
    return readFileAsDataUrl(new File([jpegBlob], 'image.jpg', { type: 'image/jpeg' }))
  }

  return readFileAsDataUrl(new File([blob], 'image', { type: outputType }))
}

export async function prepareClipboardImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo pegado no es una imagen')
  }

  const dataUrl = await readFileAsDataUrl(file)
  if (file.size <= MAX_IMAGE_BYTES) {
    try {
      const image = await loadImage(dataUrl)
      if (image.width <= MAX_IMAGE_WIDTH) {
        return dataUrl
      }
    } catch {
      return dataUrl
    }
  }

  return compressDataUrl(dataUrl, MAX_IMAGE_WIDTH)
}

export function isDataImageSrc(value: string | undefined): value is string {
  return typeof value === 'string' && value.startsWith('data:image/')
}
