<template>
  <div class="pptist-editor">
    <EditorHeader class="layout-header" />
    <div class="layout-content">
      <Thumbnails
        class="layout-content-left" :thumbnailsWidth="thumbnailsWidth-40"
        :style="{ width: `${thumbnailsWidth}px` }"
      />
       <div
         class="resizer"
         ref="resizer"
         @mousedown.prevent="startDrag($event)"
         @touchstart.prevent="startDrag($event)"
       ></div>
      <div
        class="layout-content-center"
        :style="{ width: `calc(100% - ${thumbnailsWidth}px - 260px)` }"
      >
        <CanvasTool class="center-top" />
        <Canvas class="center-body" :style="{ height: `calc(100% - ${remarkHeight + 40}px)` }" />
        <Remark
          class="center-bottom" 
          v-model:height="remarkHeight" 
          :style="{ height: `${remarkHeight}px` }"
        />
      </div>
      <Toolbar class="layout-content-right" />
    </div>
  </div>

  <SelectPanel v-if="showSelectPanel" />
  <SearchPanel v-if="showSearchPanel" />
  <NotesPanel v-if="showNotesPanel" />
  <MarkupPanel v-if="showMarkupPanel" />
  <SymbolPanel v-if="showSymbolPanel" />
  <ImageLibPanel v-if="showImageLibPanel" />

  <Modal
    :visible="!!dialogForExport" 
    :width="680"
    @closed="closeExportDialog()"
  >
    <ExportDialog />
  </Modal>

  <Modal
    :visible="showAIPPTDialog" 
    :width="720"
    :closeOnClickMask="false"
    :closeOnEsc="false"
    closeButton
    @closed="closeAIPPTDialog()"
  >
    <AIPPTDialog />
  </Modal>
</template>

<script lang="ts" setup>
import { ref, onMounted,onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import useGlobalHotkey from '@/hooks/useGlobalHotkey'
import usePasteEvent from '@/hooks/usePasteEvent'

import EditorHeader from './EditorHeader/index.vue'
import Canvas from './Canvas/index.vue'
import CanvasTool from './CanvasTool/index.vue'
import Thumbnails from './Thumbnails/index.vue'
import Toolbar from './Toolbar/index.vue'
import Remark from './Remark/index.vue'
import ExportDialog from './ExportDialog/index.vue'
import SelectPanel from './SelectPanel.vue'
import SearchPanel from './SearchPanel.vue'
import NotesPanel from './NotesPanel.vue'
import SymbolPanel from './SymbolPanel.vue'
import MarkupPanel from './MarkupPanel.vue'
import ImageLibPanel from './ImageLibPanel.vue'
import AIPPTDialog from './AIPPTDialog.vue'
import Modal from '@/components/Modal.vue'

const mainStore = useMainStore()
const {
  dialogForExport,
  showSelectPanel,
  showSearchPanel,
  showNotesPanel,
  showSymbolPanel,
  showMarkupPanel,
  showImageLibPanel,
  showAIPPTDialog,
} = storeToRefs(mainStore)

const closeExportDialog = () => mainStore.setDialogForExport('')
const closeAIPPTDialog = () => mainStore.setAIPPTDialogState(false)

const remarkHeight = ref(40)

useGlobalHotkey()
usePasteEvent()

// 新增：缩略图区宽度和拖拽逻辑
const thumbnailsWidth = ref<number>(280) // 初始宽度
const resizer = ref<HTMLElement | null>(null)

let dragging = false
let startX = 0
let startWidth = 0

const MIN_WIDTH = 200
const MAX_WIDTH = 280

function clampWidth(w: number) {
  // 仅在 200 - 280 范围内限制缩略图区宽度
  return Math.min(Math.max(w, MIN_WIDTH), MAX_WIDTH)
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  const delta = e.clientX - startX
  thumbnailsWidth.value = clampWidth(startWidth + delta)
}

function onTouchMove(e: TouchEvent) {
  if (!dragging) return
  const touch = e.touches[0]
  const delta = touch.clientX - startX
  thumbnailsWidth.value = clampWidth(startWidth + delta)
}


function stopDrag() {
  if (!dragging) return
  dragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', stopDrag)
  document.body.style.userSelect = ''
}

function startDrag(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  dragging = true
  if (e instanceof MouseEvent) {
    startX = e.clientX
  } else {
    startX = (e.touches[0] || e.changedTouches[0]).clientX
  }
  startWidth = thumbnailsWidth.value
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', stopDrag)
  document.body.style.userSelect = 'none'
}

const resizerHandler = () => {
  const width = window.innerWidth
    if (width < 1280) {
      thumbnailsWidth.value = 200 // 留出其他区域宽度
    } else {
      thumbnailsWidth.value = 280
    }
}
//屏幕放大缩小
onMounted(() => {
  resizerHandler();
   window.addEventListener('resize', resizerHandler)
})
onBeforeUnmount(() => {
  stopDrag()
})
</script>

<style lang="scss" scoped>
.pptist-editor {
  height: 100%;
  min-width: 1200px;
}
.layout-header {
  height: 40px;
}
.layout-content {
  height: calc(100% - 40px);
  display: flex;
}
.layout-content-left {
  width: 280px; /* 缩略图宽度 2026.1.20 */
  height: 100%;
  flex-shrink: 0;
}
.resizer { 
    width: 6px;
    height: 100%;
    background-color: #e9ecef;
    cursor: col-resize; /* 鼠标变为左右拖拽样式 */
    user-select: none; /* 防止拖拽时选中文本 */
    /* 鼠标悬浮时的视觉反馈 */
    &:hover {
        background-color: #adb5bd;
    }
}
.layout-content-center {
  width: calc(100% - 280px - 260px);

  .center-top {
    height: 40px;
  }
}
.layout-content-right {
  width: 260px;
  height: 100%;
}


</style>