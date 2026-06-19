import type { Slide } from '@/types/slides'
import { UploadTempFile } from '@/api/editor'

const BASE64_IMAGE_REG = /^data:image\/([a-zA-Z0-9.+-]+);base64,/

const MIME_EXT_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
}

const base64UrlCache = new Map<string, string>()

const getExtFromMime = (mime: string) => {
  if (MIME_EXT_MAP[mime]) return MIME_EXT_MAP[mime]

  const maybe = mime.split('/')[1] || 'png'
  return maybe.replace(/\+.*/, '')
}

const safeAtob = (input: string) => {
  try {
    return atob(input)
  }
  catch {
    return ''
  }
}

const dataURLtoFile = (dataURL: string, fileNamePrefix: string) => {
  const [header, body = ''] = dataURL.split(',', 2)
  const mime = (header.match(/^data:([^;]+)/)?.[1] || 'image/png').toLowerCase()
  const ext = getExtFromMime(mime)
  const binary = safeAtob(body)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new File([bytes], `${fileNamePrefix}.${ext}`, { type: mime })
}

const randomName = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

export const isBase64Image = (url?: string | null): url is string => {
  if (!url) return false
  return BASE64_IMAGE_REG.test(url)
}

export const uploadTempFile = async (file: File) => {
  const response = await UploadTempFile(file) as {
    code?: number
    msg?: string
    data?: {
      url?: string
      id?: number
      filePath?: string
      name?: string
      size?: number
    }
  }

  if (response?.code !== 0 || !response?.data?.url) {
    throw new Error(response?.msg || 'upload temp file failed')
  }

  return response.data
}

const uploadBase64Image = async (base64: string, filenamePrefix = 'ppt_img') => {
  if (base64UrlCache.has(base64)) return base64UrlCache.get(base64)!

  const file = dataURLtoFile(base64, randomName(filenamePrefix))
  const uploaded = await uploadTempFile(file)
  const url = uploaded.url as string
  base64UrlCache.set(base64, url)
  return url
}

const runWithConcurrency = async <T>(tasks: Array<() => Promise<T>>, limit: number) => {
  if (!tasks.length) return [] as T[]

  const results = new Array<T>(tasks.length)
  let nextIndex = 0

  const worker = async () => {
    while (true) {
      const current = nextIndex
      nextIndex++
      if (current >= tasks.length) return
      results[current] = await tasks[current]()
    }
  }

  const count = Math.min(Math.max(limit, 1), tasks.length)
  await Promise.all(Array.from({ length: count }, () => worker()))
  return results
}

type SlideStringRef = {
  get: () => string | undefined
  set: (value: string) => void
}

const collectSlideImageRefs = (slides: Slide[]): SlideStringRef[] => {
  const refs: SlideStringRef[] = []

  for (const slide of slides) {
    if (slide.background?.type === 'image' && slide.background.image?.src) {
      refs.push({
        get: () => slide.background?.type === 'image' ? slide.background.image?.src : undefined,
        set: (value: string) => {
          if (slide.background?.type === 'image' && slide.background.image) {
            slide.background.image.src = value
          }
        },
      })
    }

    for (const element of slide.elements) {
      if (element.type === 'image') {
        refs.push({
          get: () => element.src,
          set: (value: string) => {
            element.src = value
          },
        })
      }

      if (element.type === 'shape' && element.pattern) {
        refs.push({
          get: () => element.pattern,
          set: (value: string) => {
            element.pattern = value
          },
        })
      }
    }
  }

  return refs
}

export const normalizeSlidesImageToOss = async (
  sourceSlides: Slide[],
  options?: { concurrency?: number }
) => {
  const concurrency = options?.concurrency || 4
  const slides = JSON.parse(JSON.stringify(sourceSlides)) as Slide[]

  const refs = collectSlideImageRefs(slides)
  const refsByBase64 = new Map<string, SlideStringRef[]>()

  for (const ref of refs) {
    const value = ref.get()
    if (!isBase64Image(value)) continue

    const list = refsByBase64.get(value) || []
    list.push(ref)
    refsByBase64.set(value, list)
  }

  const uniqueBase64List = Array.from(refsByBase64.keys())
  if (!uniqueBase64List.length) {
    return {
      slides,
      converted: 0,
      failed: 0,
      total: 0,
    }
  }

  const tasks = uniqueBase64List.map(base64 => async () => {
    try {
      const url = await uploadBase64Image(base64)
      return { base64, url, ok: true as const }
    }
    catch {
      return { base64, url: '', ok: false as const }
    }
  })

  const uploadResults = await runWithConcurrency(tasks, concurrency)

  let converted = 0
  let failed = 0
  for (const result of uploadResults) {
    if (!result.ok) {
      failed++
      continue
    }

    const refsToUpdate = refsByBase64.get(result.base64) || []
    for (const ref of refsToUpdate) {
      ref.set(result.url)
      converted++
    }
  }

  return {
    slides,
    converted,
    failed,
    total: uniqueBase64List.length,
  }
}

export const uploadJsonToOss = async (jsonText: string, fileNamePrefix = 'ppt_content') => {
  const fileName = `${randomName(fileNamePrefix)}.json`
  const file = new File([jsonText], fileName, { type: 'application/json' })
  const uploaded = await uploadTempFile(file)

  return uploaded.url as string
}
