type PhotoThumbnail = {
  file: File
  width: number
  height: number
}

export async function createPhotoThumbnail(
  source: File,
  maxDimension = 640,
): Promise<PhotoThumbnail> {
  const objectUrl = URL.createObjectURL(source)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('画像を読み込めませんでした'))
      element.src = objectUrl
    })
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
    )
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('画像の縮小に失敗しました')
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error('画像の変換に失敗しました')),
        'image/webp',
        0.82,
      )
    })
    return {
      file: new File([blob], 'thumbnail.webp', { type: 'image/webp' }),
      width: image.naturalWidth,
      height: image.naturalHeight,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
