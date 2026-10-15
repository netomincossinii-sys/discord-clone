export const AVATAR_OUTPUT_SIZE = 320
export const BANNER_OUTPUT_WIDTH = 640
export const BANNER_OUTPUT_HEIGHT = 240
export const BANNER_ASPECT = BANNER_OUTPUT_WIDTH / BANNER_OUTPUT_HEIGHT

export const MAX_AVATAR_UPLOAD_BYTES = 8 * 1024 * 1024
export const MAX_BANNER_UPLOAD_BYTES = 12 * 1024 * 1024

export function isAnimatedImage(file: File) {
  return file.type === 'image/gif'
}

export function readFileAsDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error('file_too_large'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

export function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('invalid_image'))
    img.src = dataUrl
  })
}
