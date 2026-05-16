<template>
  <div 
    class="base-element-shape"
    v-if="shouldRender"
    :style="{
      top: safeTop + 'px',
      left: safeLeft + 'px',
      width: safeWidth + 'px',
      height: safeHeight + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div 
        class="element-content"
        :style="{
          opacity: elementInfo.opacity,
          filter: shadowStyle ? `drop-shadow(${shadowStyle})` : '',
          transform: flipStyle,
          color: text.defaultColor,
          fontFamily: text.defaultFontName,
        }"
      >
        <svg 
          overflow="visible" 
          :width="safeWidth"
          :height="safeHeight"
        >
          <defs>
            <PatternDefs
              v-if="elementInfo.pattern"
              :id="`base-pattern-${elementInfo.id}`" 
              :src="elementInfo.pattern"
            />
            <GradientDefs
              v-else-if="elementInfo.gradient"
              :id="`base-gradient-${elementInfo.id}`" 
              :type="elementInfo.gradient.type"
              :colors="elementInfo.gradient.colors"
              :rotate="elementInfo.gradient.rotate"
            />
          </defs>
          <g 
            :transform="`scale(${viewBoxScaleX}, ${viewBoxScaleY}) translate(0,0) matrix(1,0,0,1,0,0)`"
          >
            <path 
              vector-effect="non-scaling-stroke" 
              stroke-linecap="butt" 
              stroke-miterlimit="8"
              :d="safePath" 
              :fill="fill"
              :stroke="outlineColor"
              :stroke-width="outlineWidth" 
              :stroke-dasharray="strokeDashArray" 
            ></path>
          </g>
        </svg>

        <div class="shape-text" 
          :class="text.align"
          :style="{
            lineHeight: text.lineHeight,
            letterSpacing: (text.wordSpace || 0) + 'px',
            '--paragraphSpace': `${text.paragraphSpace === undefined ? 5 : text.paragraphSpace}px`,
          }"
        >
          <div class="ProseMirror-static" v-html="text.content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { PPTShapeElement, ShapeText } from '@/types/slides'
import { useSlidesStore } from '@/store'
import useElementOutline from '@/views/components/element/hooks/useElementOutline'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useElementFlip from '@/views/components/element/hooks/useElementFlip'
import useElementFill from '@/views/components/element/hooks/useElementFill'

import GradientDefs from './GradientDefs.vue'
import PatternDefs from './PatternDefs.vue'

const props = defineProps<{
  elementInfo: PPTShapeElement
}>()

const safeNumber = (value: number | undefined, fallback = 0) => {
  return Number.isFinite(value) ? Number(value) : fallback
}

const safeLeft = computed(() => safeNumber(props.elementInfo.left))
const safeTop = computed(() => safeNumber(props.elementInfo.top))
const safeWidth = computed(() => {
  const width = safeNumber(props.elementInfo.width, 1)
  return width > 0 ? width : 1
})
const safeHeight = computed(() => {
  const height = safeNumber(props.elementInfo.height, 1)
  return height > 0 ? height : 1
})
const safePath = computed(() => {
  const path = props.elementInfo.path || ''
  return path.includes('NaN') ? 'M 0 0 L 1 0 L 1 1 L 0 1 Z' : path
})
const shouldRender = computed(() => !!safePath.value)

const { theme } = storeToRefs(useSlidesStore())

const element = computed(() => props.elementInfo)
const { fill } = useElementFill(element, 'base')

const outline = computed(() => props.elementInfo.outline)
const { outlineWidth, outlineColor, strokeDashArray } = useElementOutline(outline)

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)

const flipH = computed(() => props.elementInfo.flipH)
const flipV = computed(() => props.elementInfo.flipV)
const { flipStyle } = useElementFlip(flipH, flipV)

const safeViewBox = computed<[number, number]>(() => {
  const fallbackWidth = safeWidth.value
  const fallbackHeight = safeHeight.value
  const viewBox = props.elementInfo.viewBox
  if (!Array.isArray(viewBox) || viewBox.length < 2) return [fallbackWidth, fallbackHeight]

  const width = Number(viewBox[0])
  const height = Number(viewBox[1])
  return [
    Number.isFinite(width) && width > 0 ? width : fallbackWidth,
    Number.isFinite(height) && height > 0 ? height : fallbackHeight,
  ]
})

const viewBoxScaleX = computed(() => safeWidth.value / safeViewBox.value[0])
const viewBoxScaleY = computed(() => safeHeight.value / safeViewBox.value[1])

const text = computed<ShapeText>(() => {
  const defaultText: ShapeText = {
    content: '',
    align: 'middle',
    defaultFontName: theme.value.fontName,
    defaultColor: theme.value.fontColor,
  }
  if (!props.elementInfo.text) return defaultText

  return props.elementInfo.text
})
</script>

<style lang="scss" scoped>
.base-element-shape {
  position: absolute;
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  position: relative;
  font-family: $textElementFont;

  svg {
    transform-origin: 0 0;
    overflow: visible;
    display: block;
  }
}
.shape-text {
  display: flex;
  flex-direction: column;
  padding: 10px;
  line-height: 1.5;
  word-break: break-word;
  @include absolute-0();

  &.top {
    justify-content: flex-start;
  }
  &.middle {
    justify-content: center;
  }
  &.bottom {
    justify-content: flex-end;
  }
}
</style>
