<template>
  <div 
    class="base-element-line"
    v-if="shouldRender"
    :style="{
      top: safeTop + 'px',
      left: safeLeft + 'px',
    }"
  >
    <div 
      class="element-content"
      :style="{ filter: shadowStyle ? `drop-shadow(${shadowStyle})` : '' }"
    >
      <svg
        overflow="visible" 
        :width="svgWidth"
        :height="svgHeight"
      >
        <defs>
          <LinePointMarker
            v-if="elementInfo.points[0]"
            :id="elementInfo.id"
            position="start"
            :type="elementInfo.points[0]"
            :color="elementInfo.color"
            :baseSize="elementInfo.width"
          />
          <LinePointMarker
            v-if="elementInfo.points[1]"
            :id="elementInfo.id"
            position="end"
            :type="elementInfo.points[1]"
            :color="elementInfo.color"
            :baseSize="elementInfo.width"
          />
        </defs>
				<path
          :d="safePath" 
          :stroke="elementInfo.color" 
          :stroke-width="safeStrokeWidth" 
          :stroke-dasharray="lineDashArray"
          fill="none" 
          :marker-start="elementInfo.points[0] ? `url(#${elementInfo.id}-${elementInfo.points[0]}-start)` : ''"
          :marker-end="elementInfo.points[1] ? `url(#${elementInfo.id}-${elementInfo.points[1]}-end)` : ''"
        ></path>
			</svg>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTLineElement } from '@/types/slides'
import { getLineElementPath } from '@/utils/element'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'

import LinePointMarker from './LinePointMarker.vue'

const props = defineProps<{
  elementInfo: PPTLineElement
}>()

const safeNumber = (value: number | undefined, fallback = 0) => {
  return Number.isFinite(value) ? Number(value) : fallback
}

const safeLeft = computed(() => safeNumber(props.elementInfo.left))
const safeTop = computed(() => safeNumber(props.elementInfo.top))
const safeStart = computed<[number, number]>(() => {
  const start = props.elementInfo.start || [0, 0]
  return [safeNumber(start[0]), safeNumber(start[1])]
})
const safeEnd = computed<[number, number]>(() => {
  const end = props.elementInfo.end || [1, 1]
  return [safeNumber(end[0], 1), safeNumber(end[1], 1)]
})
const safeStrokeWidth = computed(() => {
  const width = safeNumber(props.elementInfo.width, 1)
  return width > 0 ? width : 1
})

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)

const svgWidth = computed(() => {
  const width = Math.abs(safeStart.value[0] - safeEnd.value[0])
  return width < 24 ? 24 : width
})
const svgHeight = computed(() => {
  const height = Math.abs(safeStart.value[1] - safeEnd.value[1])
  return height < 24 ? 24 : height
})

const lineDashArray = computed(() => {
  const size = safeStrokeWidth.value
  if (props.elementInfo.style === 'dashed') return size <= 8 ? `${size * 5} ${size * 2.5}` : `${size * 5} ${size * 1.5}`
  if (props.elementInfo.style === 'dotted') return size <= 8 ? `${size * 1.8} ${size * 1.6}` : `${size * 1.5} ${size * 1.2}`
  return '0 0'
})

const safePath = computed(() => {
  const path = getLineElementPath({
    ...props.elementInfo,
    start: safeStart.value,
    end: safeEnd.value,
  })
  return path.includes('NaN') ? 'M 0 0 L 1 1' : path
})

const shouldRender = computed(() => !!safePath.value)
</script>

<style lang="scss" scoped>
.base-element-line {
  position: absolute;
}

.element-content {
  width: 100%;
  height: 100%;
  position: relative;

  svg {
    transform-origin: 0 0;
    overflow: visible;
  }
}
</style>
