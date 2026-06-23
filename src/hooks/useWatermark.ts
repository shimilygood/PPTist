import { onMounted, onBeforeUnmount, watchEffect, type Ref } from 'vue'

interface WatermarkOptions {
  text?: string
  fontSize?: number
  color?: string
  rotate?: number
  gap?: number
  gridColor?: string
  gridSize?: number
  enabled?: boolean | (() => boolean)
}

export function useWatermark(
  containerRef: Ref<HTMLElement | null | undefined>,
  options: WatermarkOptions = {},
) {
  const defaultOpt: Required<Omit<WatermarkOptions, 'enabled'>> & Pick<WatermarkOptions, 'enabled'> = {
    text: '云绘',
    fontSize: 48,
    color: 'rgba(190, 210, 230, 0.5)',
    rotate: 0,
    gap: 200,
    gridColor: 'rgba(195, 215, 230, 0.3)',
    gridSize: 400,
    enabled: true,
  }
  const cfg = { ...defaultOpt, ...options }
  let watermarkEl: HTMLDivElement | null = null
  let observer: MutationObserver | null = null

  const createWatermarkImg = () => {
    const canvas = document.createElement('canvas')
    const size = cfg.gap * 2
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    ctx.strokeStyle = cfg.gridColor
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = -size; i < size * 2; i += cfg.gridSize) {
      ctx.moveTo(i, 0)
      ctx.lineTo(i + size, size)
    }
    for (let i = -size; i < size * 2; i += cfg.gridSize) {
      ctx.moveTo(i, size)
      ctx.lineTo(i + size, 0)
    }
    ctx.stroke()

    const clearW = cfg.fontSize * 3.2
    const clearH = cfg.fontSize * 1.6
    ctx.clearRect(size / 2 - clearW / 2, size / 2 - clearH / 2, clearW, clearH)

    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate((cfg.rotate * Math.PI) / 180)
    ctx.fillStyle = cfg.color
    ctx.font = `bold ${cfg.fontSize}px PingFang SC, Microsoft YaHei, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(cfg.text, 0, 0)
    ctx.restore()

    return canvas.toDataURL('image/png')
  }

  const removeWatermark = () => {
    observer?.disconnect()
    observer = null
    if (watermarkEl) {
      watermarkEl.remove()
      watermarkEl = null
    }
  }

  const renderWatermark = () => {
    const container = containerRef.value
    if (!container) return

    removeWatermark()

    watermarkEl = document.createElement('div')
    watermarkEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 998;
      pointer-events: none;
      background-image: url(${createWatermarkImg()});
      background-repeat: repeat;
    `
    container.appendChild(watermarkEl)

    observer = new MutationObserver(() => {
      if (watermarkEl && !container.contains(watermarkEl)) {
        observer?.disconnect()
        observer = null
        watermarkEl = null
        renderWatermark()
      }
    })
    observer.observe(container, { childList: true })
  }

  const destroy = () => {
    removeWatermark()
  }

  let stopWatch: (() => void) | null = null
  onMounted(() => {
    stopWatch = watchEffect(() => {
      const enabled = typeof cfg.enabled === 'function' ? cfg.enabled() : cfg.enabled
      if (enabled) {
        renderWatermark()
      }
      else {
        removeWatermark()
      }
    })
  })

  onBeforeUnmount(() => {
    stopWatch?.()
    destroy()
  })

  return { renderWatermark, destroy }
}
