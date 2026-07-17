import type { Slide } from '@/types/slides'
import { createApp, h, nextTick } from 'vue'
import { getActivePinia } from 'pinia'
import { toJpeg } from 'html-to-image'
import { UploadTempFile } from '@/api/editor'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const OSS_HOST = 'yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com'

const toBrowserOssUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== OSS_HOST) return url
    return `/api/oss-proxy${parsed.pathname}${parsed.search}`
  }
  catch {
    return url
  }
}

const waitForImagesLoaded = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve()
    return new Promise<void>(resolve => {
      const done = () => resolve()
      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', done, { once: true })
    })
  }))
}

const prepareDomForCapture = (domEl: HTMLElement) => {
  const restores: Array<() => void> = []

  domEl.querySelectorAll('img').forEach(img => {
    const originalSrc = img.currentSrc || img.src
    if (!originalSrc || originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) return

    const proxySrc = toBrowserOssUrl(originalSrc)
    img.crossOrigin = 'anonymous'

    if (proxySrc !== originalSrc) {
      img.src = proxySrc
      restores.push(() => {
        img.removeAttribute('crossorigin')
        img.src = originalSrc
      })
      return
    }

    restores.push(() => img.removeAttribute('crossorigin'))
  })

  return () => {
    restores.forEach(restore => restore())
  }
}

const findFirstSlideThumbnailEl = () => {
  const selectors = [
    '.thumbnail-list .thumbnail-slide',
    '.advanced-thumbnails .thumbnail-slide',
  ]

  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
    for (const el of elements) {
      if (el.querySelector('.placeholder')) continue
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      return el
    }
  }

  return null
}

const getFirstSlideThumbnailSize = () => {
  const el = findFirstSlideThumbnailEl()
  if (el && el.clientWidth > 0) return Math.round(el.clientWidth)
  return 220
}

const captureElementToJpegFile = async (domEl: HTMLElement, fileNamePrefix: string) => {
  const foreignObjectSpans = domEl.querySelectorAll('foreignObject [xmlns]')
  foreignObjectSpans.forEach(spanRef => spanRef.removeAttribute('xmlns'))

  const restoreDom = prepareDomForCapture(domEl)

  try {
    await waitForImagesLoaded(domEl)

    const width = Math.round(domEl.clientWidth || domEl.offsetWidth)
    const height = Math.round(domEl.clientHeight || domEl.offsetHeight)
    if (width <= 0 || height <= 0) {
      throw new Error('invalid thumbnail size')
    }

    const dataUrl = await toJpeg(domEl, {
      quality: 0.85,
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      fontEmbedCSS: '',
      cacheBust: true,
      style: {
        overflow: 'hidden',
      },
    })

    return dataURLtoFile(dataUrl, randomName(fileNamePrefix))
  }
  finally {
    restoreDom()
  }
}

const renderSlideCoverOffscreen = async (slide: Slide, size?: number) => {
  const thumbSize = size || getFirstSlideThumbnailSize()
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-99999px;top:0;opacity:0;pointer-events:none;z-index:-1;'
  document.body.appendChild(host)

  const pinia = getActivePinia()
  const app = createApp({
    render: () => h(ThumbnailSlide, { slide, size: thumbSize, visible: true }),
  })
  if (pinia) app.use(pinia)
  app.mount(host)

  try {
    await nextTick()
    await sleep(400)
    const slideEl = host.querySelector('.thumbnail-slide') as HTMLElement | null
    if (!slideEl || slideEl.querySelector('.placeholder')) {
      throw new Error('slide thumbnail not ready')
    }
    await waitForImagesLoaded(slideEl)
    return await captureElementToJpegFile(slideEl, 'ppt_cover')
  }
  finally {
    app.unmount()
    host.remove()
  }
}

export const uploadFirstSlideCoverToOss = async (firstSlide?: Slide) => {
  const thumbSize = getFirstSlideThumbnailSize()

  try {
    let file: File | null = null
    const domEl = findFirstSlideThumbnailEl()

    if (domEl) {
      await sleep(200)
      file = await captureElementToJpegFile(domEl, 'ppt_cover')
    }
    else if (firstSlide) {
      file = await renderSlideCoverOffscreen(firstSlide, thumbSize)
    }

    if (!file) return ''

    const uploaded = await uploadTempFile(file)
    return uploaded.url as string
  }
  catch {
    if (!firstSlide) return ''

    try {
      const file = await renderSlideCoverOffscreen(firstSlide, thumbSize)
      const uploaded = await uploadTempFile(file)
      return uploaded.url as string
    }
    catch {
      return ''
    }
  }
}

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
