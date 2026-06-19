<template>
  <div class="canvas-tool">
    
    <div class="left-handler">
      <!-- <IconBack class="handler-item" :class="{ 'disable': !canUndo }" v-tooltip="'撤销（Ctrl + Z）'" @click="undo()" />
      <IconNext class="handler-item" :class="{ 'disable': !canRedo }" v-tooltip="'重做（Ctrl + Y）'" @click="redo()" /> -->
      <div class="more">
        <!-- <Divider type="vertical" style="height: 20px;" /> -->
        <Popover class="more-icon" trigger="click" v-model:value="moreVisible" :offset="10">
          <template #content>
            <PopoverMenuItem class="popover-menu-item" center @click="toggleNotesPanel(); moreVisible = false"><IconComment class="icon" />批注面板</PopoverMenuItem>
            <PopoverMenuItem class="popover-menu-item" center @click="toggleSelectPanel(); moreVisible = false"><IconMoveOne class="icon" />选择窗格</PopoverMenuItem>
            <PopoverMenuItem class="popover-menu-item" center @click="toggleSraechPanel(); moreVisible = false"><IconSearch class="icon" />查找替换</PopoverMenuItem>
          </template>
          <IconMore class="handler-item" />
        </Popover>
        <!-- <IconComment class="handler-item" :class="{ 'active': showNotesPanel }" v-tooltip="'批注面板'" @click="toggleNotesPanel()" /> -->
        <!-- <IconMoveOne class="handler-item" :class="{ 'active': showSelectPanel }" v-tooltip="'选择窗格'" @click="toggleSelectPanel()" />
        <IconSearch class="handler-item" :class="{ 'active': showSearchPanel }"  @click="toggleSraechPanel()" >搜索</IconSearch> -->
        <!-- <div class="handler-item" @click="toggleSelectPanel()"><span class="pptfont ppt-menu-layer"></span>图层</div>
        <div class="handler-item" @click="toggleSraechPanel()"><span class="pptfont ppt-general-search-icon" ></span>搜索</div> -->
      </div>
    </div>

    <div class="add-element-handler">
      
      <div class="insert-handler-item group-btn" :class="{ 'active': creatingElement?.type === 'text' }"  :offset="10">
        <div class="group-btn-main " style="justify-content:start !important;" @click="drawText()">
          <span class="pptfont ppt-menu-text"></span><span class="text " style="margin-left:0px;">文本</span>
        </div>
        
        <Popover trigger="click" v-model:value="textTypeSelectVisible" style="height: 100%;" :offset="10">
          <template #content>
            <PopoverMenuItem center @click="() => { drawText(); textTypeSelectVisible = false }"><IconTextRotationNone class="icon" /> 横向文本框</PopoverMenuItem>
            <PopoverMenuItem center @click="() => { drawText(true); textTypeSelectVisible = false }"><IconTextRotationDown class="icon" /> 竖向文本框</PopoverMenuItem>
          </template>
          <IconDown class="arrow " style="right:1px;" />
        </Popover>
      </div>
      <div class="insert-handler-item group-btn" :class="{ 'active': creatingCustomShape || creatingElement?.type === 'shape' }" v-tooltip="'插入形状'" :offset="10">
        <Popover trigger="click" style="height: 100%;" v-model:value="shapePoolVisible" :offset="10">
          <template #content>
            <ShapePool @select="shape => drawShape(shape)" />
          </template>
          <div class="group-btn-main">
            <!-- <IconGraphicDesign class="icon" /> <span class="text">形状</span> -->
            <span class="pptfont ppt-menu-graphics"></span><span class="text">形状</span>
          </div>
        </Popover>
        
        <Popover trigger="click" v-model:value="shapeMenuVisible" style="height: 100%;" :offset="10">
          <template #content>
            <PopoverMenuItem center @click="shapeMenuVisible = false; shapePoolVisible = true"><IconGraphicDesign class="icon" />预设形状</PopoverMenuItem>
            <PopoverMenuItem center @click="() => { drawCustomShape(); shapeMenuVisible = false }"><IconWritingFluently class="icon" />自由绘制</PopoverMenuItem>
          </template>
          <IconDown class="arrow" style="right:2px;" />
        </Popover>
      </div>
      <div class="insert-handler-item group-btn" :class="{ 'active': imageMenuVisible }" v-tooltip="'插入图片'">
        <FileInput style="height: 100%;" @change="files => insertImageElement(files)">
          <div class="group-btn-main">
            <!-- <IconPicture class="icon" /> <span class="text">图片</span> -->
            <span class="pptfont ppt-menu-image" /><span class="text">图片</span>
          </div>
        </FileInput>
        
        <Popover trigger="click" v-model:value="imageMenuVisible" style="height: 100%;" :offset="10">
          <template #content>
            <FileInput @change="files => { insertImageElement(files); imageMenuVisible = false }">
              <PopoverMenuItem center><IconUpload class="icon" /> 上传图片</PopoverMenuItem>
            </FileInput>
            <PopoverMenuItem center @click="openImageLibPanel(); imageMenuVisible = false"><IconPicture class="icon" /> 在线图库</PopoverMenuItem>
          </template>
          <IconDown class="arrow" style="right:4px;" />
        </Popover>
      </div>

      <div class="insert-handler-item group-btn" :class="{ 'active': latexEditorVisible }" v-tooltip="'插入公式'" @click="latexEditorVisible = true">
        <div class="group-btn-main">
          <!-- <IconFormula class="icon" /> <span class="text">公式</span> -->
          <span class="pptfont ppt-menu-formula" /><span class="text">公式</span>
        </div>
      </div>

       <Popover trigger="click" v-model:value="chartPoolVisible" :offset="10">
        <template #content>
          <ChartPool @select="chart => { createChartElement(chart); chartPoolVisible = false }" />
        </template>
        <div class="insert-handler-item group-btn" :class="{ 'active': chartPoolVisible }" v-tooltip="'插入图表'">
          <div class="group-btn-main">
            <!-- <IconChartProportion class="icon" /> <span class="text">图表</span> -->
            <span class="pptfont ppt-menu-chart" /><span class="text">图表</span>
          </div>
        </div>
      </Popover>

       <Popover trigger="click" v-model:value="tableGeneratorVisible" :offset="10">
        <template #content>
          <TableGenerator
            @close="tableGeneratorVisible = false"
            @insert="({ row, col }) => { createTableElement(row, col); tableGeneratorVisible = false }"
          />
        </template>
        <div class="insert-handler-item group-btn" :class="{ 'active': tableGeneratorVisible }" v-tooltip="'插入表格'">
          <div class="group-btn-main">
            <!-- <IconInsertTable class="icon" /> <span class="text">表格</span> -->
            <span class="pptfont ppt-menu-table" /><span class="text">表格</span>
          </div>
        </div>
      </Popover>
        <Popover trigger="click" v-model:value="mediaInputVisible" :offset="10">
        <template #content>
          <MediaInput 
            @close="mediaInputVisible = false"
            @insertVideo="({ src, ext }) => { createVideoElement(src, ext); mediaInputVisible = false }"
            @insertAudio="({ src, ext }) => { createAudioElement(src, ext); mediaInputVisible = false }"
          />
        </template>
        <div class="insert-handler-item group-btn" :class="{ 'active': mediaInputVisible }" v-tooltip="'插入音视频'">
          <div class="group-btn-main">
            <!-- <IconVideoTwo class="icon" /> <span class="text">音视频</span> -->
            <span class="pptfont ppt-menu-audioVideo"  /><span class="text">音视频</span>
          </div>
        </div>
      </Popover>
      <!-- 暂时隐藏 -->
      <div style="display: none;">
            <Popover trigger="click" v-model:value="linePoolVisible" :offset="10">
              <template #content>
                <LinePool @select="line => drawLine(line)" />
              </template>
              <div class="insert-handler-item" :class="{ 'active': creatingElement?.type === 'line' }" v-tooltip="'插入线条'">
                <IconConnection class="icon" /> <span class="text">线条</span>
              </div>
            </Popover>
          
          
            <div class="insert-handler-item" :class="{ 'active': showSymbolPanel }" v-tooltip="'插入符号'" @click="toggleSymbolPanel()">
              <IconSymbol class="icon" /> <span class="text">符号</span>
            </div>
      </div>
    </div>


    
    <!-- 暂时隐藏 -->
    <div class="right-handler"  style="display: none;">
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

    <Modal
      v-model:visible="latexEditorVisible" 
      :width="880"
    >
      <LaTeXEditor 
        @close="latexEditorVisible = false"
        @update="data => { createLatexElement(data); latexEditorVisible = false }"
      />
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSnapshotStore } from '@/store'
import { getImageDataURL } from '@/utils/image'
import type { ShapePoolItem } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useCreateElement from '@/hooks/useCreateElement'

import ShapePool from './ShapePool.vue'
import LinePool from './LinePool.vue'
import ChartPool from './ChartPool.vue'
import TableGenerator from './TableGenerator.vue'
import MediaInput from './MediaInput.vue'
import LaTeXEditor from '@/components/LaTeXEditor/index.vue'
import FileInput from '@/components/FileInput.vue'
import Modal from '@/components/Modal.vue'
import Divider from '@/components/Divider.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'

const mainStore = useMainStore()
const { creatingElement, creatingCustomShape, showSelectPanel, showSearchPanel, showNotesPanel, showSymbolPanel } = storeToRefs(mainStore)
const { canUndo, canRedo } = storeToRefs(useSnapshotStore())

const { redo, undo } = useHistorySnapshot()

const {
  scaleCanvas,
  setCanvasScalePercentage,
  resetCanvas,
  canvasScalePercentage,
} = useScaleCanvas()

const canvasScalePresetList = [200, 150, 125, 100, 75, 50]
const canvasScaleVisible = ref(false)

const applyCanvasPresetScale = (value: number) => {
  setCanvasScalePercentage(value)
  canvasScaleVisible.value = false
}

const {
  createImageElement,
  createChartElement,
  createTableElement,
  createLatexElement,
  createVideoElement,
  createAudioElement,
} = useCreateElement()

const insertImageElement = (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  getImageDataURL(imageFile).then(dataURL => createImageElement(dataURL))
}

const shapePoolVisible = ref(false)
const linePoolVisible = ref(false)
const chartPoolVisible = ref(false)
const tableGeneratorVisible = ref(false)
const mediaInputVisible = ref(false)
const latexEditorVisible = ref(false)
const textTypeSelectVisible = ref(false)
const shapeMenuVisible = ref(false)
const imageMenuVisible = ref(false)
const moreVisible = ref(false)

// 绘制文字范围
const drawText = (vertical = false) => {
  mainStore.setCreatingElement({
    type: 'text',
    vertical,
  })
}

// 绘制形状范围
const drawShape = (shape: ShapePoolItem) => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: shape,
  })
  shapePoolVisible.value = false
}
// 绘制自定义任意多边形
const drawCustomShape = () => {
  mainStore.setCreatingCustomShapeState(true)
  shapePoolVisible.value = false
}

// 绘制线条路径
const drawLine = (line: LinePoolItem) => {
  mainStore.setCreatingElement({
    type: 'line',
    data: line,
  })
  linePoolVisible.value = false
}

// 打开选择面板
const toggleSelectPanel = () => {
  mainStore.setSelectPanelState(!showSelectPanel.value)
}

// 打开搜索替换面板
const toggleSraechPanel = () => {
  mainStore.setSearchPanelState(!showSearchPanel.value)
}

// 打开批注面板
const toggleNotesPanel = () => {
  mainStore.setNotesPanelState(!showNotesPanel.value)
}

// 打开符号面板
const toggleSymbolPanel = () => {
  mainStore.setSymbolPanelState(!showSymbolPanel.value)
}

// 打开图库面板
const openImageLibPanel = () => {
  mainStore.setImageLibPanelState(true)
}
</script>

<style lang="scss" scoped>
.canvas-tool {
  position: relative;
  background-color: $lightGray;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 13px;
  user-select: none;
}
.left-handler, .more {
  display: flex;
  align-items: center;
}
.more-icon {
  display: none;
}
.popover-menu-item {
  display: flex;
  padding: 8px 10px;

  &.center {
    justify-content: center;
  }

  .icon {
    font-size: 18px;
    margin-right: 8px;
  }
}
.add-element-handler {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 400px;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
   box-shadow: 0px -2px 17px 0px rgba(0, 0, 0, 0.06);
  background-color: #fff;
  border-radius: 8px;
    display: flex;
    justify-content: center;
  & > div {
    flex-shrink: 0;
  }

  .insert-handler-item {
    width: 50px;
    height: 34px;
    font-size: 14px;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: width .2s ease, background-color .2s ease;

    &::before {
      position: absolute;
      z-index: 0;
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 0;
      transform: translateX(100%);
      transition: transform .2s ease;
      background-color: #e7efff;
    }

    &:hover,
    &.active {
      width: 80px;

      &::before {
        transform: translateX(0);
      }

      .text {
        opacity: 1;
        transform: translateX(0);
        display: block;
        padding-left: 2px;
      }

      .pptfont,
      .icon {
        color: #2f6bdf;
      }

      .text {
        color: #2f6bdf;
      }
    }

    .icon {
      position: static;
      margin-right: 0;
      z-index: 1;
      flex-shrink: 0;
    }

    .pptfont {
      position: static;
      margin-right: 0;
      z-index: 1;
      flex-shrink: 0;
      color: #3f3f46;
      transition: color .2s ease;
      font-size: 20px;
    }

    .text {
      z-index: 1;
      opacity: 0;
      transform: translateX(8px);
      transition: transform .2s ease, opacity .2s ease, color .2s ease;
      width: auto;
      text-align: left;
      white-space: nowrap;
      color: #3f3f46;
      font-size: 12px;
      font-weight: 500;
      display: none;
    }

    &.group-btn {
      margin-right: 0;
      padding: 0;

      .group-btn-main {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2px;
        padding: 0 12px;
        z-index: 1;
      }

      .arrow {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        padding: 0 4px;
        position: absolute;
        right: 10px;
        z-index: 2;
        opacity: 0;
        transition: opacity .2s ease;
      }

      &:hover .arrow,
      &.active .arrow {
        opacity: 1;
      }
    }
  }
}
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

  &.disable {
    opacity: .5;
  }
}
.left-handler, .right-handler {
  .handler-item {
    padding: 0 8px;

    &.active,
    &:not(.disable):hover {
      background-color: #f1f1f1;
    }
  }
}
.right-handler {
  display: flex;
  align-items: center;

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

@media screen and (width <= 1600px) {
  .add-element-handler {
    .insert-handler-item {
      .icon {
        margin-right: 0;
      }
    }
  }
}
@media screen and (width <= 1366px) {
  .add-element-handler {
    .insert-handler-item {
      padding: 0 6px;
    }
  }
}
@media screen and (width <= 1200px) {
  .right-handler .text {
    display: none;
  }
  .more > .handler-item {
    display: none;
  }
  .more-icon {
    display: block;
  }
}
@media screen and (width <= 1000px) {
  .left-handler, .right-handler {
    display: none;
  }
}
</style>