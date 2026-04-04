<template>
  <div class="pptist-editor">
    <!-- 头部 导航条 -->
    <EditorHeader class="layout-header" />
    <div class="layout-content">
      <!-- 左侧缩略图 -->
      <Thumbnails class="layout-content-left" :thumbnailsWidth="thumbnailsWidth-40"  :style="{ width: `${thumbnailsWidth}px` }"  />
      <!-- 左侧拖动条 -->
      <div class="resizerBar" ref="resizerBar"  @mousedown.prevent="startDrag($event)" @touchstart.prevent="startDrag($event)"><span class="pptfont ppt-operation-move z-index10"></span>
      </div>
      <!-- 中间内容 -->
      <div
        class="layout-content-center"
        :style="{ width: rightToolVisible ? `calc(100% - ${thumbnailsWidth}px - 260px)` : `calc(100% - ${thumbnailsWidth}px)` }"
      >
        <!-- 中间工具栏 -->
        <CanvasTool class="center-top" />
        <!-- 画布区域 -->
        <Canvas class="center-body" :style="{ height: `calc(100% - ${remarkHeight + 40}px)` }" />
        <!-- 底部备注栏 -->
        <Remark class="center-bottom" v-model:height="remarkHeight"  :style="{ height: `${remarkHeight}px` }" />
      </div>
      <!-- 右侧 工具栏 -->
      <Toolbar class="layout-content-right" v-show="rightToolVisible" />
    </div>
  </div>
  <!-- 选择 弹窗 -->
  <SelectPanel v-if="showSelectPanel" />
  <!-- 搜索 弹窗 -->
  <SearchPanel v-if="showSearchPanel" />
  <!-- 备注栏 弹窗 -->
  <NotesPanel v-if="showNotesPanel" />
  <!-- 标记栏 弹窗 -->
  <MarkupPanel v-if="showMarkupPanel" />
  <!-- 符号 弹窗 -->
  <SymbolPanel v-if="showSymbolPanel" />
  <!-- 图片库 弹窗 -->
  <ImageLibPanel v-if="showImageLibPanel" />
  <!-- 导出 弹窗 -->
  <Modal :visible="!!dialogForExport"  :width="680"  @closed="closeExportDialog()" >
    <ExportDialog />
  </Modal>
  <!-- AIPPT 弹窗 -->
  <Modal :visible="showAIPPTDialog" :width="720" :closeOnClickMask="false" :closeOnEsc="false" closeButton @closed="closeAIPPTDialog()">
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
  rightToolVisible,
} = storeToRefs(mainStore)

const closeExportDialog = () => mainStore.setDialogForExport('')
const closeAIPPTDialog = () => mainStore.setAIPPTDialogState(false)

const remarkHeight = ref(60)

useGlobalHotkey()
usePasteEvent()

// 新增：缩略图区宽度和拖拽逻辑
const thumbnailsWidth = ref<number>(280) // 初始宽度
const resizerBar = ref<HTMLElement | null>(null)

let dragging = false
let startX = 0
let startWidth = 0

const MIN_WIDTH = 160
const MAX_WIDTH = 300

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

const resizerBarHandler = () => {
  const width = window.innerWidth
    if (width < 1280) {
      thumbnailsWidth.value = 200 // 留出其他区域宽度
    } else {
      thumbnailsWidth.value = 280
    }
}


//屏幕放大缩小
onMounted(() => {
  resizerBarHandler();
   window.addEventListener('resize', resizerBarHandler)
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
  height: 60px;
}
.layout-content {
  height: calc(100% - 60px);
  display: flex;
}
.layout-content-left {
  width: 280px; /* 缩略图宽度 2026.1.20 */
  height: 100%;
  flex-shrink: 0;
}
.resizerBar { 
    width:1px;
    height: 100%;
    background-color: #e9ecef;
    cursor: col-resize; /* 鼠标变为左右拖拽样式 */
    user-select: none; /* 防止拖拽时选中文本 */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 鼠标悬浮时的视觉反馈 */
    &:hover {
       
    }
    .pptfont {
      display: flex;
      align-items: center;
      width: 18px;
      height: 20px;
      font-size: 16px;
      color: #6c757d;
      background-color: #fff;
      border-radius: $borderRadius;
      filter: drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.16));
    }
}
.layout-content-center {
  width: calc(100% - 280px - 260px);

  .center-top {
    height: 50px;
  }
}
.layout-content-right {
  width: 260px;
  height: 100%;
}

.center-bottom{
  background: $lightGray;
}
</style>