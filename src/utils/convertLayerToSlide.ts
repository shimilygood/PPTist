import type { Slide, PPTElement, PPTImageElement, PPTTextElement, SlideBackground } from '@/types/slides'

function genId(prefix = 'el') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`
}

function toImageElement(node: any): PPTImageElement | null {
  const src = node?.url || node?.attrs?.src || node?.fill?.[0]?.url
  if (!src) return null

  const el: PPTImageElement = {
    id: genId('img'),
    type: 'image',
    left: typeof node?.x === 'number' ? node.x : 100,
    top: typeof node?.y === 'number' ? node.y : 60,
    width: typeof node?.w === 'number' ? node.w : 400,
    height: typeof node?.h === 'number' ? node.h : 300,
    rotate: typeof node?.rotate === 'number' ? node.rotate : 0,
    fixedRatio: !!node?.fixedRatio,
    src,
  }

  return el
}

function toTextElement(node: any): PPTTextElement | null {
  const text = node?.text || node?.value || node?.children?.find((c: any) => c?.tag === 'Text')?.text
  if (!text) return null

  const el: PPTTextElement = {
    id: genId('txt'),
    type: 'text',
    left: typeof node?.x === 'number' ? node.x : 80,
    top: typeof node?.y === 'number' ? node.y : 80,
    width: typeof node?.w === 'number' ? node.w : 560,
    height: typeof node?.h === 'number' ? node.h : 120,
    rotate: typeof node?.rotate === 'number' ? node.rotate : 0,
    content: String(text).replace(/\n/g, '<br/>'),
    defaultFontName: 'sans-serif',
    defaultColor: '#111111',
  }

  return el
}

export default function convertLayerToSlides(layerJson: any, coverFallback?: string): Slide[] {
  if (!layerJson) return []

  const slides: Slide[] = []

  // If input already looks like Slide(s), pass through
  if (Array.isArray(layerJson)) {
    // try to detect Slide shape
    const maybeSlides = layerJson.filter((s: any) => s && Array.isArray(s.elements))
    if (maybeSlides.length) return maybeSlides as Slide[]
  }

  // single frame -> build one slide
  const root = layerJson
  const elements: PPTElement[] = []

  // If frame has fill image, treat as background
  let background: SlideBackground | undefined
  if (root?.fill && Array.isArray(root.fill)) {
    const firstFill = root.fill[0]
    if (firstFill?.type === 'image' && firstFill?.url) {
      background = { type: 'image', image: { src: firstFill.url, size: 'cover' } }
    }
  }

  // parse children for images/text
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      const tag = child?.tag?.toLowerCase?.() || ''
      if (tag.includes('image') || tag === 'customimage') {
        const img = toImageElement(child)
        if (img) elements.push(img)
      }
      else if (tag.includes('text') || tag === 'effecttext') {
        const txt = toTextElement(child)
        if (txt) elements.push(txt)
      }
      else {
        // fallback: if node has image-like fill
        const img = toImageElement(child)
        if (img) elements.push(img)
      }
    }
  }

  // If no background found, use coverFallback
  if (!background && coverFallback) {
    background = { type: 'image', image: { src: coverFallback, size: 'cover' } }
  }

  const slide: Slide = {
    id: genId('slide'),
    elements,
    background,
  }

  slides.push(slide)
  return slides
}
