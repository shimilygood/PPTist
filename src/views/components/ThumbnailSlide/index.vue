<template>
  <div class="thumbnail-slide "
    :style="{
      width: size + 'px',
      height: size * safeViewportRatio + 'px',
    }"
  >
    <div 
      class="elements"
      :style="{
        width: safeViewportSize + 'px',
        height: safeViewportSize * safeViewportRatio + 'px',
        transform: `scale(${scale})`,
      }"
      v-if="visible"
    >
      <div class="background" :style="backgroundStyle"></div>

    
      <ThumbnailElement
        v-for="(element, index) in slide.elements"
        :key="element.id"
        :elementInfo="element"
        :elementIndex="index + 1"
      />
    </div>
    <div class="placeholder" v-else>加载中 ...</div>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { Slide } from '@/types/slides'
import { injectKeySlideScale } from '@/types/injectKey'
import useSlideBackgroundStyle from '@/hooks/useSlideBackgroundStyle'

import ThumbnailElement from './ThumbnailElement.vue'

const props = withDefaults(defineProps<{
  slide: Slide
  size: number
  visible?: boolean
}>(), {
  visible: true,
})

const { viewportRatio, viewportSize } = storeToRefs(useSlidesStore())

const safeViewportSize = computed(() => {
  return Number.isFinite(viewportSize.value) && viewportSize.value > 0 ? viewportSize.value : 1000
})

const safeViewportRatio = computed(() => {
  return Number.isFinite(viewportRatio.value) && viewportRatio.value > 0 ? viewportRatio.value : 0.5625
})

const background = computed(() => props.slide.background)
const { backgroundStyle } = useSlideBackgroundStyle(background)

const scale = computed(() => props.size / safeViewportSize.value)
provide(injectKeySlideScale, scale)



</script>

<style lang="scss" scoped>
.thumbnail-slide {
  background-color: #fff;
  overflow: hidden;
  user-select: none;
  border-radius: 3px !important;
}
.elements {
  transform-origin: 0 0;
}
.background {
  width: 100%;
  height: 100%;
  background-position: center;
  position: absolute;
}
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #9ca3af;
  font-size: 12px;
}

.placeholder::before {
  content: '';
  width: 64px;
  height: 64px;
  margin-bottom: 4px;
  background: url('@/assets/images/loading100.gif') center/contain no-repeat;
}
</style>