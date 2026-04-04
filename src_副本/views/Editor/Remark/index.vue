<template>
  <div class="remark">
    <div 
      class="resize-handler"
      @mousedown="$event => resize($event)"
    ></div>
   <div class="editor flex flex-row flex-around"> 
     <Editor
      :value="remark"
      ref="editorRef" class="remark-left flex-1"
      @update="value => handleInput(value)"
    />
    <div class="remark-center flex-3"></div>
    <div class="remark-right flex flex-row flex-between align-center" >
       <div class="right-handler">
          <IconMinus class="handler-item viewport-size" v-tooltip="'画布缩小（Ctrl + -）'" @click="scaleCanvas('-')" />
          <Popover trigger="click" v-model:value="canvasScaleVisible">
            <template #content>
              <PopoverMenuItem
                center
                v-for="item in canvasScalePresetList" 
                :key="item" 
                @click="applyCanvasPresetScale(item)"
              >{{item}}%</PopoverMenuItem>
              <PopoverMenuItem center @click="resetCanvas(); canvasScaleVisible = false">适应屏幕</PopoverMenuItem>
            </template>
            <span class="text">{{ canvasScalePercentage }}</span>
          </Popover>
          <IconPlus class="handler-item viewport-size" v-tooltip="'画布放大（Ctrl + =）'" @click="scaleCanvas('+')" />
          <IconFullScreen class="handler-item viewport-size-adaptation" v-tooltip="'适应屏幕（Ctrl + 0）'" @click="resetCanvas()" />
        </div>
    </div>
  </div>
    
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, useTemplateRef, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import Editor from './Editor.vue'

const props = defineProps<{
  height: number
}>()

const emit = defineEmits<{
  (event: 'update:height', payload: number): void
}>()

const slidesStore = useSlidesStore()
const { currentSlide } = storeToRefs(slidesStore)

const editorRef = useTemplateRef<InstanceType<typeof Editor>>('editorRef')
watch(() => currentSlide.value.id, () => {
  nextTick(() => {
    editorRef.value!.updateTextContent()
  })
}, {
  immediate: true,
})

const remark = computed(() => currentSlide.value?.remark || '')

const handleInput = (content: string) => {
  slidesStore.updateSlide({ remark: content })
}

//  画布缩放
const canvasScalePresetList = [200, 150, 125, 100, 75, 50]
const canvasScaleVisible = ref(false)
const {
  scaleCanvas,
  setCanvasScalePercentage,
  resetCanvas,
  canvasScalePercentage,
} = useScaleCanvas()
const applyCanvasPresetScale = (value: number) => {
  setCanvasScalePercentage(value)
  canvasScaleVisible.value = false
}

const resize = (e: MouseEvent) => {
  let isMouseDown = true
  const startPageY = e.pageY
  const originHeight = props.height

  document.onmousemove = e => {
    if (!isMouseDown) return

    const currentPageY = e.pageY

    const moveY = currentPageY - startPageY
    let newHeight = -moveY + originHeight

    if (newHeight < 40) newHeight = 40
    if (newHeight > 360) newHeight = 360

    emit('update:height', newHeight)
  }

  document.onmouseup = () => {
    isMouseDown = false
    document.onmousemove = null
    document.onmouseup = null
  }
}
</script>

<style lang="scss" scoped>
.remark {
  position: relative;
  padding: 0 20px;
  /*border-top: 1px solid $borderColor;*/
}
.resize-handler {
  height: 7px;
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  cursor: n-resize;
  z-index: 2;
}

.right-handler {
  display: flex;
  align-items: center;
.handler-item {
  height: 30px;
  font-size: 14px;
  margin: 0 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: $borderRadius5;
  overflow: hidden;
  background-color: #fff;
  cursor: pointer;
  padding: 0 10px;

  &.disable {
    opacity: .5;
  }
}
  .text {
    display: inline-block;
    width: 40px;
    text-align: center;
    cursor: pointer;
  }

  .viewport-size {
    font-size: 13px;
  }
}
.remark-left{
  background-color: #fff;
  border-radius: $borderRadius5;
}
.remark-right{
  background-color: #fff;
   border-radius: $borderRadius5;
}
</style>