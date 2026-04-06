<template>
  <div class="pptist-editor">
    <EditorHeader class="layout-header" />

    <div v-if="editorMode === 'standard'" class="layout-content">
      <Thumbnails class="layout-content-left" :thumbnailsWidth="thumbnailsWidth - 40" :style="{ width: `${thumbnailsWidth}px` }" />
      <div class="resizerBar" ref="resizerBar" @mousedown.prevent="startDrag($event)" @touchstart.prevent="startDrag($event)">
        <span class="pptfont ppt-operation-move z-index10"></span>
      </div>
      <div
        class="layout-content-center"
        :style="{ width: rightToolVisible ? `calc(100% - ${thumbnailsWidth}px - 260px)` : `calc(100% - ${thumbnailsWidth}px)` }"
      >
        <CanvasTool class="center-top" />
        <Canvas class="center-body" :style="{ height: `calc(100% - ${remarkHeight + 40}px)` }" />
        <Remark class="center-bottom" v-model:height="remarkHeight" :style="{ height: `${remarkHeight}px` }" />
      </div>
      <Toolbar class="layout-content-right" v-show="rightToolVisible" />
    </div>

    <div v-else class="layout-content advanced-layout">
      <div class="advanced-left">
        <div class="advanced-nav">
          <div
            v-for="item in filteredAdvancedTools"
            :key="item.key"
            class="advanced-nav-item"
            :class="{ active: activeAdvancedTool === item.key }"
            @click="toggleAdvancedTool(item.key)"
          >
            <span class="advanced-nav-icon" :class="{ primary: activeAdvancedTool === item.key && item.key === 'add' }">
              <span class="pptfont" :class="item.icon"></span>
            </span>
            <span class="label">{{ item.label }}</span>
          </div>
        </div>

        <div v-if="activeAdvancedTool !== 'none'" class="advanced-panel" :style="{ width: `${advancedToolPanelWidth}px` }">
          <div class="panel-search">
            <input v-model="advancedSearchKeyword" type="text" placeholder="请输入您要搜索的内容" />
          </div>

          <div v-if="!isActiveAdvancedToolVisible" class="panel-empty">未找到匹配功能，请更换关键词</div>

          <template v-else-if="activeAdvancedTool === 'add'">
            <div class="panel-group">
              <div class="panel-title">图片/视频</div>
              <div class="upload-actions">
                <button class="upload-btn" @click="mainStore.setImageLibPanelState(true)">
                  <span class="pptfont ppt-menu-image"></span>
                  <span>本地上传</span>
                </button>
                <button class="upload-btn" @click="mainStore.setImageLibPanelState(true)">
                  <span class="pptfont ppt-design-cloud"></span>
                  <span>手机上传</span>
                </button>
              </div>
            </div>

            <div class="panel-group mt16">
              <div class="panel-title">文字</div>
              <div class="text-actions">
                <button class="text-btn" @click="startCreateText(false)"><strong>H1</strong><span>标题</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>H</strong><span>副标题</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>T</strong><span>正文</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>T</strong><span>变形文字</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>T</strong><span>3D文字</span></button>
              </div>
            </div>

            <div class="panel-group mt16">
              <div class="panel-title">绘制</div>
              <div class="draw-actions">
                <button class="shape-btn" @click="startCreateRectShape()"><span class="shape-square"></span></button>
                <button class="shape-btn" @click="startCreateTriangleShape()"><span class="shape-triangle"></span></button>
                <button class="shape-btn" @click="startCreateCircleShape()"><span class="shape-circle"></span></button>
                <button class="shape-btn" @click="startCreateLineShape()"><span class="shape-line"></span></button>
              </div>
            </div>

            <div class="panel-group mt16">
              <div class="panel-title">组件</div>
              <div class="panel-grid">
                <button class="grid-btn" @click="createSlide()">拼图</button>
                <button class="grid-btn" @click="mainStore.setSymbolPanelState(true)">二维码</button>
                <button class="grid-btn" @click="mainStore.setSearchPanelState(true)">图表</button>
                <button class="grid-btn" @click="mainStore.setSelectPanelState(true)">图例</button>
              </div>
            </div>
          </template>

          <template v-else-if="activeAdvancedTool === 'template'">
            <Templates
              @select="createSlideByTemplate"
              @selectAll="insertAllTemplates"
            />
          </template>

          <template v-else-if="activeAdvancedTool === 'material' || activeAdvancedTool === 'background'">
            <div class="panel-title">素材工具</div>
            <div class="panel-actions">
              <button class="action-btn" @click="mainStore.setImageLibPanelState(true)">打开在线图库</button>
              <button class="action-btn" @click="activeAdvancedTool = 'template'">查看模板库</button>
            </div>

            <div class="panel-title mt16">常用入口</div>
            <div class="panel-grid">
              <button class="grid-btn" @click="mainStore.setImageLibPanelState(true)">背景</button>
              <button class="grid-btn" @click="mainStore.setImageLibPanelState(true)">免抠</button>
              <button class="grid-btn" @click="mainStore.setImageLibPanelState(true)">图标</button>
              <button class="grid-btn" @click="mainStore.setImageLibPanelState(true)">插画</button>
            </div>
          </template>

          <template v-else-if="activeAdvancedTool === 'media'">
            <div class="panel-title">图片与视频</div>
            <div class="panel-actions">
              <button class="action-btn" @click="mainStore.setImageLibPanelState(true)">图片库</button>
              <button class="action-btn" @click="mainStore.setSearchPanelState(true)">视频检索</button>
              <button class="action-btn" @click="mainStore.setSearchPanelState(true)">音频检索</button>
            </div>
          </template>

          <template v-else-if="activeAdvancedTool === 'text'">
            <div class="panel-title">文字工具</div>
            <div class="panel-actions">
              <button class="action-btn" @click="startCreateText(false)">横向文本框</button>
              <button class="action-btn" @click="startCreateText(true)">竖向文本框</button>
              <button class="action-btn" @click="mainStore.setSearchPanelState(true)">查找替换</button>
            </div>
          </template>

          <template v-else-if="activeAdvancedTool === 'shape'">
            <div class="panel-title">形状工具</div>
            <div class="panel-actions">
              <button class="action-btn" @click="startCreateRectShape()">插入矩形</button>
              <button class="action-btn" @click="mainStore.setSelectPanelState(true)">打开图层面板</button>
              <button class="action-btn" @click="mainStore.setSymbolPanelState(true)">打开符号面板</button>
            </div>
          </template>

          <template v-else-if="activeAdvancedTool === 'my'">
            <div class="panel-title">我的资源</div>
            <div class="panel-actions">
              <button class="action-btn" @click="mainStore.setImageLibPanelState(true)">我的素材</button>
              <button class="action-btn" @click="mainStore.setAIPPTDialogState(true)">我的 AI 项目</button>
            </div>
          </template>

          <template v-else-if="activeAdvancedTool === 'team'">
            <div class="panel-title">团队协作</div>
            <div class="panel-actions">
              <button class="action-btn" @click="mainStore.setNotesPanelState(true)">打开批注面板</button>
              <button class="action-btn" @click="mainStore.setSelectPanelState(true)">打开图层面板</button>
              <button class="action-btn" @click="mainStore.setSearchPanelState(true)">查找替换</button>
            </div>
          </template>

          <template v-else-if="activeAdvancedTool === 'ai'">
            <div class="panel-title">AI 工具</div>
            <div class="panel-actions">
              <button class="action-btn" @click="mainStore.setAIPPTDialogState(true)">打开 AI 创建</button>
            </div>
          </template>
        </div>
      </div>

      <div class="layout-content-center advanced-center" :style="{ width: advancedCenterWidth }">
        <Canvas class="center-body" :style="{ height: `calc(100% - ${advancedBottomHeight}px)` }" />

        <div class="advanced-bottom" :style="{ height: `${advancedBottomHeight}px` }">
          <div class="advanced-thumb-toolbar">
            <div class="toolbar-left">
              <button class="layer-entry" @click="mainStore.setSelectPanelState(true)">
                <span class="pptfont ppt-menu-layer"></span>
                <span>图层</span>
              </button>
              <div class="advanced-page-stat">
                <span class="stat-label">幻灯片：</span>
                <input
                  v-model="pageJumpValue"
                  class="page-jump-input"
                  @keydown.enter.prevent="jumpToSlideByInput()"
                  @blur="jumpToSlideByInput()"
                >
                <span>/ {{ slides.length }}</span>
                <span class="stat-arrow"></span>
              </div>
            </div>
            <div class="toolbar-right">
              <div class="zoom-control">
                <button class="tool-btn" @click="scaleCanvas('-')">
                  <span class="icon icon-minus"></span>
                </button>
                <button class="tool-btn zoom-value" @click="resetCanvas()">{{ canvasScalePercentage }}</button>
                <button class="tool-btn" @click="scaleCanvas('+')">
                  <span class="icon icon-plus"></span>
                </button>
              </div>
              <div class="view-control">
                <button class="tool-btn"><span class="icon icon-fit"></span></button>
                <button class="tool-btn"><span class="icon icon-focus"></span></button>
                <button class="tool-btn"><span class="icon icon-expand"></span></button>
                <button class="tool-btn"><span class="icon icon-grid"></span></button>
                <button class="tool-btn split-left"><span class="icon icon-help"></span></button>
                <button class="tool-btn"><span class="icon icon-draw"></span></button>
              </div>
            </div>
          </div>
          <div class="advanced-thumbnails" v-contextmenu="contextmenusAdvancedThumbnails">
            <Draggable
              class="thumb-list"
              :modelValue="slides"
              :animation="200"
              :scroll="true"
              direction="horizontal"
              itemKey="id"
              @end="handleAdvancedDragEnd"
            >
              <template #item="{ element, index }">
                <div
                  class="thumb-item"
                  :data-index="index"
                  :class="{
                    active: index === slideIndex,
                    selected: advancedSelectedSlidesIndex.includes(index),
                  }"
                  @mousedown="handleClickAdvancedThumb($event, index)"
                  @dblclick="enterScreening()"
                  v-contextmenu="contextmenusAdvancedThumbItem"
                >
                  <div
                    class="thumb-section"
                    v-if="element.sectionTag || (hasSection && index === 0)"
                    :data-section-id="element?.sectionTag?.id || ''"
                    :data-index="index"
                    v-contextmenu="contextmenusAdvancedSection"
                    @dblclick.stop="editAdvancedSection(element?.sectionTag?.id || '', index)"
                  >
                    <input
                      v-if="advancedEditingSectionId === (element?.sectionTag?.id || (index === 0 ? 'default' : ''))"
                      :id="`advanced-section-input-${element?.sectionTag?.id || (index === 0 ? 'default' : '')}`"
                      class="thumb-section-input"
                      :value="element?.sectionTag?.title || ''"
                      placeholder="输入节名称"
                      @blur="saveAdvancedSection($event)"
                      @keydown.enter.stop="saveAdvancedSection($event)"
                    >
                    <span v-else>{{ element.sectionTag ? (element.sectionTag.title || '无标题节') : '默认节' }}</span>
                  </div>
                  <div class="thumb-index">{{ index + 1 }}</div>
                  <ThumbnailSlide :slide="element" :size="advancedThumbSize" />
                </div>
              </template>
            </Draggable>
            <div class="add-thumb" @click="createSlide()">
              <span class="pptfont ppt-create-createDirectly"></span>
            </div>
          </div>
        </div>
      </div>

      <Toolbar class="layout-content-right" v-show="rightToolVisible" />
    </div>
  </div>

  <SelectPanel v-if="showSelectPanel" />
  <SearchPanel v-if="showSearchPanel" />
  <NotesPanel v-if="showNotesPanel" />
  <MarkupPanel v-if="showMarkupPanel" />
  <SymbolPanel v-if="showSymbolPanel" />
  <ImageLibPanel v-if="showImageLibPanel" />
  <Modal :visible="!!dialogForExport" :width="680" @closed="closeExportDialog()">
    <ExportDialog />
  </Modal>
  <Modal :visible="showAIPPTDialog" :width="720" :closeOnClickMask="false" :closeOnEsc="false" closeButton @closed="closeAIPPTDialog()">
    <AIPPTDialog />
  </Modal>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useKeyboardStore, useMainStore, useSlidesStore } from '@/store'
import useGlobalHotkey from '@/hooks/useGlobalHotkey'
import usePasteEvent from '@/hooks/usePasteEvent'
import useSlideHandler from '@/hooks/useSlideHandler'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import useScreening from '@/hooks/useScreening'
import useSectionHandler from '@/hooks/useSectionHandler'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import type { Slide, SlideTheme } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'

import EditorHeader from './EditorHeader/index.vue'
import Canvas from './Canvas/index.vue'
import CanvasTool from './CanvasTool/index.vue'
import Thumbnails from './Thumbnails/index.vue'
import Templates from './Thumbnails/Templates.vue'
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
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import Modal from '@/components/Modal.vue'
import Draggable from 'vuedraggable'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const keyboardStore = useKeyboardStore()
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
  editorMode,
  selectedSlidesIndex: _selectedSlidesIndex,
} = storeToRefs(mainStore)
const { slides, slideIndex, currentSlide } = storeToRefs(slidesStore)
const { ctrlKeyState, shiftKeyState } = storeToRefs(keyboardStore)

const {
  copySlide,
  pasteSlide,
  createSlide,
  createSlideByTemplate,
  copyAndPasteSlide,
  deleteSlide,
  cutSlide,
  selectAllSlide,
  sortSlides,
  isEmptySlide,
} = useSlideHandler()
const { addSlidesFromData } = useAddSlidesOrElements()
const { enterScreening } = useScreening()
const { scaleCanvas, resetCanvas, canvasScalePercentage } = useScaleCanvas()
const {
  removeSection,
  removeAllSection,
  removeSectionSlides,
  updateSectionTitle,
  createSection,
} = useSectionHandler()

const closeExportDialog = () => mainStore.setDialogForExport('')
const closeAIPPTDialog = () => mainStore.setAIPPTDialogState(false)

const remarkHeight = ref(60)

type AdvancedTool =
  | 'add'
  | 'template'
  | 'material'
  | 'text'
  | 'shape'
  | 'media'
  | 'background'
  | 'ai'
  | 'my'
  | 'team'
  | 'none'

const activeAdvancedTool = ref<AdvancedTool>('add')
const advancedSearchKeyword = ref('')
const pageJumpValue = ref('1')
const advancedTools = [
  { key: 'add' as const, label: '添加', icon: 'ppt-create-plus' },
  { key: 'template' as const, label: '模板', icon: 'ppt-menu-template' },
  { key: 'material' as const, label: '素材', icon: 'ppt-menu-material' },
  { key: 'text' as const, label: '文字', icon: 'ppt-menu-text' },
  { key: 'media' as const, label: '图片/视频', icon: 'ppt-menu-audioVideo' },
  { key: 'background' as const, label: '背景', icon: 'ppt-menu-image' },
  { key: 'ai' as const, label: 'AI工具', icon: 'ppt-operate-AI-Creation' },
  { key: 'my' as const, label: '我的', icon: 'ppt-design-cloud' },
  { key: 'team' as const, label: '团队', icon: 'ppt-operate-demo' },
]

const normalizeAdvancedSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')

const filteredAdvancedTools = computed(() => {
  const keyword = normalizeAdvancedSearch(advancedSearchKeyword.value.trim())
  if (!keyword) return advancedTools
  return advancedTools.filter(item => normalizeAdvancedSearch(`${item.label}${item.key}`).includes(keyword))
})

const isActiveAdvancedToolVisible = computed(() => {
  return filteredAdvancedTools.value.some(item => item.key === activeAdvancedTool.value)
})

const hasSection = computed(() => slides.value.some(item => item.sectionTag))
const advancedEditingSectionId = ref('')

const advancedToolPanelWidth = computed(() => {
  if (activeAdvancedTool.value === 'none') return 0
  return activeAdvancedTool.value === 'template' ? 520 : 260
})

const advancedSelectedSlidesIndex = computed(() => [..._selectedSlidesIndex.value, slideIndex.value])

const advancedCenterWidth = computed(() => {
  const left = 56 + advancedToolPanelWidth.value
  const right = rightToolVisible.value ? 260 : 0
  return `calc(100% - ${left + right}px)`
})

const advancedBottomHeight = computed(() => 176)
const advancedThumbSize = 168

const toggleAdvancedTool = (tool: AdvancedTool) => {
  activeAdvancedTool.value = activeAdvancedTool.value === tool ? 'none' : tool
}

const changeSlideIndex = (index: number) => {
  mainStore.setActiveElementIdList([])
  if (slideIndex.value === index) return
  slidesStore.updateSlideIndex(index)
}

const jumpToSlideByInput = () => {
  const total = slides.value.length
  const input = Number(pageJumpValue.value)

  if (!Number.isFinite(input) || !total) {
    pageJumpValue.value = String(slideIndex.value + 1)
    return
  }

  const nextIndex = Math.min(Math.max(Math.trunc(input), 1), total) - 1
  mainStore.updateSelectedSlidesIndex([])
  changeSlideIndex(nextIndex)
  pageJumpValue.value = String(nextIndex + 1)
}

const handleClickAdvancedThumb = (e: MouseEvent, index: number) => {
  const isMultiSelected = advancedSelectedSlidesIndex.value.length > 1

  if (isMultiSelected && advancedSelectedSlidesIndex.value.includes(index) && e.button !== 0) return

  if (ctrlKeyState.value) {
    if (slideIndex.value === index) {
      if (!isMultiSelected) return

      const newSelectedSlidesIndex = advancedSelectedSlidesIndex.value.filter(item => item !== index)
      mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      changeSlideIndex(newSelectedSlidesIndex[0] ?? 0)
    }
    else {
      if (advancedSelectedSlidesIndex.value.includes(index)) {
        const newSelectedSlidesIndex = advancedSelectedSlidesIndex.value.filter(item => item !== index)
        mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      }
      else {
        const newSelectedSlidesIndex = [...advancedSelectedSlidesIndex.value, index]
        mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      }
    }
  }
  else if (shiftKeyState.value) {
    if (slideIndex.value === index && !isMultiSelected) return

    let minIndex = Math.min(...advancedSelectedSlidesIndex.value)
    let maxIndex = index

    if (index < minIndex) {
      maxIndex = Math.max(...advancedSelectedSlidesIndex.value)
      minIndex = index
    }

    const newSelectedSlidesIndex = []
    for (let i = minIndex; i <= maxIndex; i++) newSelectedSlidesIndex.push(i)
    mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
  }
  else {
    mainStore.updateSelectedSlidesIndex([])
    changeSlideIndex(index)
  }

  mainStore.setThumbnailsFocus(true)
}

const startCreateText = (vertical = false) => {
  mainStore.setCreatingElement({
    type: 'text',
    vertical,
  })
}

const startCreateRectShape = () => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: {
      viewBox: [200, 200],
      path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
    },
  })
}

const startCreateTriangleShape = () => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: {
      viewBox: [200, 200],
      path: 'M 100 0 L 200 200 L 0 200 Z',
    },
  })
}

const startCreateCircleShape = () => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: {
      viewBox: [200, 200],
      path: 'M 100 0 A 100 100 0 1 0 100.001 0 Z',
    },
  })
}

const startCreateLineShape = () => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: {
      viewBox: [200, 200],
      path: 'M 10 190 L 190 10',
    },
  })
}

const handleAdvancedDragEnd = (eventData: { newIndex: number; oldIndex: number }) => {
  const { newIndex, oldIndex } = eventData
  if (newIndex === undefined || oldIndex === undefined || newIndex === oldIndex) return
  sortSlides(newIndex, oldIndex)
}

const editAdvancedSection = (id: string, index: number) => {
  mainStore.setDisableHotkeysState(true)
  advancedEditingSectionId.value = id || (index === 0 ? 'default' : '')
  if (!advancedEditingSectionId.value) return

  nextTick(() => {
    const inputId = `advanced-section-input-${advancedEditingSectionId.value}`
    const inputRef = document.querySelector(`#${inputId}`) as HTMLInputElement
    inputRef?.focus()
  })
}

const saveAdvancedSection = (e: FocusEvent | KeyboardEvent) => {
  const sectionId = advancedEditingSectionId.value
  if (!sectionId) return

  const title = (e.target as HTMLInputElement).value
  updateSectionTitle(sectionId, title)

  advancedEditingSectionId.value = ''
  mainStore.setDisableHotkeysState(false)
}

const contextmenusAdvancedSection = (el: HTMLElement): ContextmenuItem[] => {
  const sectionId = el.dataset.sectionId || ''
  const index = +(el.dataset.index || 0)

  return [
    {
      text: '删除节',
      handler: () => removeSection(sectionId),
    },
    {
      text: '删除节和幻灯片',
      handler: () => {
        mainStore.setActiveElementIdList([])
        removeSectionSlides(sectionId)
      },
    },
    {
      text: '删除所有节',
      handler: removeAllSection,
    },
    {
      text: '重命名节',
      handler: () => editAdvancedSection(sectionId, index),
    },
  ]
}

const setAdvancedSelectionByIndex = (index: number) => {
  if (advancedSelectedSlidesIndex.value.includes(index)) return
  mainStore.updateSelectedSlidesIndex([index])
  changeSlideIndex(index)
}

const contextmenusAdvancedThumbnails = (): ContextmenuItem[] => {
  return [
    {
      text: '粘贴',
      subText: 'Ctrl + V',
      handler: pasteSlide,
    },
    {
      text: '全选',
      subText: 'Ctrl + A',
      handler: selectAllSlide,
    },
    {
      text: '新建页面',
      subText: 'Enter',
      handler: createSlide,
    },
    {
      text: '幻灯片放映',
      subText: 'F5',
      handler: () => enterScreening(),
    },
  ]
}

const contextmenusAdvancedThumbItem = (el: HTMLElement): ContextmenuItem[] => {
  const index = +(el.dataset.index || 0)
  setAdvancedSelectionByIndex(index)

  return [
    {
      text: '剪切',
      subText: 'Ctrl + X',
      handler: cutSlide,
    },
    {
      text: '复制',
      subText: 'Ctrl + C',
      handler: copySlide,
    },
    {
      text: '粘贴',
      subText: 'Ctrl + V',
      handler: pasteSlide,
    },
    {
      text: '全选',
      subText: 'Ctrl + A',
      handler: selectAllSlide,
    },
    { divider: true },
    {
      text: '新建页面',
      subText: 'Enter',
      handler: createSlide,
    },
    {
      text: '复制页面',
      subText: 'Ctrl + D',
      handler: copyAndPasteSlide,
    },
    {
      text: '删除页面',
      subText: 'Backspace',
      handler: () => deleteSlide(),
    },
    {
      text: '增加节',
      handler: createSection,
      disable: !!currentSlide.value.sectionTag,
    },
    { divider: true },
    {
      text: '从当前放映',
      subText: 'Shift + F5',
      handler: enterScreening,
    },
  ]
}

const insertAllTemplates = (payload: Slide[] | { slides: Slide[]; theme?: Partial<SlideTheme> }) => {
  const list: Slide[] = Array.isArray(payload) ? payload : payload?.slides || []
  const theme = Array.isArray(payload) ? undefined : payload?.theme
  if (isEmptySlide.value) {
    slidesStore.setSlides(list, theme)
  }
  else {
    addSlidesFromData(list)
  }
}

useGlobalHotkey()
usePasteEvent()

const thumbnailsWidth = ref<number>(280)
const resizerBar = ref<HTMLElement | null>(null)

let dragging = false
let startX = 0
let startWidth = 0

const MIN_WIDTH = 160
const MAX_WIDTH = 300

function clampWidth(w: number) {
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
  }
  else {
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
    thumbnailsWidth.value = 200
  }
  else {
    thumbnailsWidth.value = 280
  }
}

onMounted(() => {
  resizerBarHandler()
  window.addEventListener('resize', resizerBarHandler)
})

watch([slideIndex, () => slides.value.length], () => {
  pageJumpValue.value = String(slideIndex.value + 1)
}, { immediate: true })

onBeforeUnmount(() => {
  stopDrag()
  mainStore.setDisableHotkeysState(false)
  window.removeEventListener('resize', resizerBarHandler)
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
  width: 280px;
  height: 100%;
  flex-shrink: 0;
}

.resizerBar {
  width: 1px;
  height: 100%;
  background-color: #e9ecef;
  cursor: col-resize;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;

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

.center-bottom {
  background: $lightGray;
}

.advanced-layout {
  background: #f3f4f6;

  :deep(.layout-content-right .toolbar) {
    border-left: 1px solid #d6dce6;
    background: #fafbfc;
  }

  :deep(.layout-content-right .toolbar .tabs.tabBtn) {
    margin: 10px 12px 8px;
    height: 34px;
    background: #edf1f7;
    border-radius: 8px;
  }

  :deep(.layout-content-right .toolbar .tabs.tabBtn .tab) {
    font-size: 12px;
    border-radius: 7px;
  }

  :deep(.layout-content-right .toolbar .tabs.tabBtn .tab.active) {
    background: #2563eb;
  }

  :deep(.layout-content-right .toolbar .content) {
    padding: 10px 12px 12px;
  }
}

.advanced-left {
  display: flex;
  height: 100%;
  background: #f8f9fb;
  border-right: 1px solid $borderColor;
}

.advanced-nav {
  width: 56px;
  border-right: 1px solid $borderColor;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  gap: 4px;
}

.advanced-nav-item {
  width: 44px;
  min-height: 46px;
  border-radius: 7px;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  line-height: 1.2;
  gap: 2px;
  transition: all .15s ease;

  .label {
    letter-spacing: .2px;
  }

  &:hover,
  &.active {
    background: rgba($color: $themeColor, $alpha: 0.12);
    color: $themeColor;
  }
}

.advanced-nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  .pptfont {
    font-size: 16px;
  }

  &.primary {
    background: #2d6ef8;
    color: #fff;
  }
}

.advanced-panel {
  height: 100%;
  overflow: auto;
  background: #fff;
  padding: 10px 12px 12px;
}

.panel-search {
  margin-bottom: 12px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
  padding-bottom: 6px;

  input {
    width: 100%;
    height: 32px;
    border: 1px solid $borderColor;
    border-radius: 6px;
    padding: 0 12px;
    outline: none;
    background: #f8fafc;
    font-size: 12px;

    &:focus {
      border-color: $themeColor;
      background: #fff;
    }
  }
}

.panel-empty {
  height: 80px;
  border: 1px dashed $borderColor;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6b7280;
}

.panel-title {
  font-size: 13px;
  color: #111827;
  margin-bottom: 8px;
  font-weight: 600;
}

.panel-group {
  padding-bottom: 2px;
}

.upload-actions {
  display: flex;
  gap: 10px;
}

.upload-btn {
  flex: 1;
  height: 58px;
  border: 1px solid $borderColor;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;

  .pptfont {
    font-size: 16px;
    color: #4b5563;
  }

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    background: #f8fbff;

    .pptfont {
      color: $themeColor;
    }
  }
}

.text-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.text-btn {
  height: 56px;
  border: 1px solid $borderColor;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;

  strong {
    font-size: 22px;
    font-weight: 500;
    line-height: 1;
    color: #374151;
  }

  span {
    font-size: 11px;
    color: #6b7280;
    line-height: 1;
  }

  &:hover {
    border-color: $themeColor;
    background: #fff;

    strong,
    span {
      color: $themeColor;
    }
  }
}

.draw-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.shape-btn {
  height: 36px;
  border: 1px solid $borderColor;
  border-radius: 8px;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    border-color: $themeColor;
    background: #f8fbff;
  }
}

.shape-square,
.shape-triangle,
.shape-circle,
.shape-line {
  display: block;
  width: 16px;
  height: 16px;
}

.shape-square {
  border: 1.5px solid #4b5563;
  border-radius: 3px;
}

.shape-triangle {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 14px solid #4b5563;
}

.shape-circle {
  border: 1.5px solid #4b5563;
  border-radius: 50%;
}

.shape-line {
  width: 16px;
  height: 0;
  border-top: 1.5px solid #4b5563;
  transform: rotate(-35deg);
}

.panel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mt16 {
  margin-top: 16px;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.grid-btn {
  height: 34px;
  border: 1px solid $borderColor;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    background: #fff;
  }
}

.action-btn {
  height: 34px;
  border: 1px solid $borderColor;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  padding: 0 12px;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    background: #f8fbff;
  }
}

.advanced-center {
  background: #ededf0;

  .center-top {
    height: 50px;
  }
}

.advanced-bottom {
  border-top: 1px solid #d9dee7;
  background: #fff;
}

.advanced-thumb-toolbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 28px 8px 24px;
  background: #f2f4f7;
  border-top: 1px solid #e0e4eb;
  border-bottom: 1px solid #e0e4eb;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.zoom-control,
.view-control {
  height: 44px;
  border: 1px solid #d7dce5;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;
}

.zoom-control {
  min-width: 196px;
}

.view-control {
  min-width: 286px;
}

.tool-btn {
  min-width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: #4b5563;
  font-size: 14px;
  cursor: pointer;
  border-right: 1px solid #e5e7eb;

  &:last-child {
    border-right: 0;
  }

  &:hover {
    background: #f5f7fb;
    color: #2563eb;
  }
}

.split-left {
  border-left: 1px solid #e5e7eb;
}

.icon {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
}

.icon-minus::before,
.icon-plus::before,
.icon-plus::after {
  content: '';
  position: absolute;
  left: 2px;
  right: 2px;
  top: 7px;
  border-top: 1.6px solid currentColor;
}

.icon-plus::after {
  left: 7px;
  right: auto;
  top: 2px;
  bottom: 2px;
  width: 0;
  border-top: 0;
  border-left: 1.6px solid currentColor;
}

.icon-fit::before,
.icon-fit::after,
.icon-focus::before,
.icon-expand::before,
.icon-grid::before,
.icon-help::before,
.icon-draw::before {
  content: '';
  position: absolute;
}

.icon-fit::before {
  inset: 2px;
  background:
    linear-gradient(currentColor, currentColor) left top / 5px 1.6px no-repeat,
    linear-gradient(currentColor, currentColor) left top / 1.6px 5px no-repeat,
    linear-gradient(currentColor, currentColor) right top / 5px 1.6px no-repeat,
    linear-gradient(currentColor, currentColor) right top / 1.6px 5px no-repeat,
    linear-gradient(currentColor, currentColor) left bottom / 5px 1.6px no-repeat,
    linear-gradient(currentColor, currentColor) left bottom / 1.6px 5px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 5px 1.6px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 1.6px 5px no-repeat;
}

.icon-fit::after {
  content: none;
}

.icon-focus::before {
  inset: 1px;
  border: 1.5px solid currentColor;
}

.icon-focus::after {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1.5px solid currentColor;
}

.icon-expand::before {
  top: 2px;
  left: 2px;
  width: 6px;
  height: 6px;
  border-top: 1.5px solid currentColor;
  border-left: 1.5px solid currentColor;
}

.icon-expand::after {
  content: '';
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
}

.icon-grid::before {
  inset: 2px;
  border: 1.5px solid currentColor;
}

.icon-grid::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 2px;
  bottom: 2px;
  border-left: 1.2px solid currentColor;
  box-shadow: -4px 0 0 currentColor, 4px 0 0 currentColor;
}

.icon-help::before {
  inset: 1px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
}

.icon-help::after {
  content: '?';
  position: absolute;
  left: 4px;
  top: 0;
  font-size: 11px;
  line-height: 16px;
  color: currentColor;
}

.icon-draw::before {
  width: 12px;
  height: 0;
  border-top: 1.6px solid currentColor;
  transform: rotate(-35deg);
  left: 2px;
  top: 8px;
}

.icon-draw::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  border: 1.4px solid currentColor;
  border-radius: 1px;
  right: 1px;
  top: 1px;
  transform: rotate(-35deg);
}

.zoom-value {
  min-width: 96px;
  font-size: 14px;
  font-weight: 600;
}

.advanced-thumbnails {
  height: 122px;
  display: flex;
  align-items: flex-start;
  padding: 10px 24px 12px;
  gap: 14px;
  background: #f2f4f7;
}

.layer-entry {
  height: 44px;
  border: 1px solid #d7dce5;
  border-radius: 10px;
  background: #fff;
  min-width: 120px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;

  .pptfont {
    font-size: 18px;
    color: #4b5563;
  }

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
  }
}

.advanced-page-stat {
  min-width: 194px;
  height: 44px;
  border: 1px solid #d7dce5;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;

  .pptfont {
    font-size: 13px;
  }

  .stat-label {
    color: #6b7280;
    font-weight: 600;
  }

  .stat-arrow {
    width: 8px;
    height: 8px;
    border-top: 1.6px solid #6b7280;
    border-left: 1.6px solid #6b7280;
    transform: rotate(45deg) translateY(1px);
    margin-left: 3px;
  }
}

.page-jump-input {
  width: 48px;
  height: 28px;
  border: 1px solid $borderColor;
  border-radius: 6px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  outline: none;

  &:focus {
    border-color: $themeColor;
  }
}

.add-thumb {
  width: 132px;
  height: 104px;
  border-radius: 12px;
  border: 1px dashed #9ca3af;
  background: #eceff4;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #6b7280;

  .pptfont {
    font-size: 44px;
    color: #7f8793;
  }

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    background: #e9edf5;

    .pptfont {
      color: $themeColor;
    }
  }
}

.thumb-list {
  flex: 1;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  align-items: center;
  gap: 14px;
}

.thumb-item {
  min-width: 186px;
  cursor: pointer;
  border-radius: 10px;
  padding: 3px;
  border: 1px solid transparent;
  transition: all .15s ease;
  position: relative;

  :deep(.thumbnail-slide) {
    border-radius: 10px !important;
  }

  &.selected {
    border-color: rgba($color: $themeColor, $alpha: 0.35);
    background: rgba($color: $themeColor, $alpha: 0.03);
  }

  &.active {
    border-color: $themeColor;
    background: rgba($color: $themeColor, $alpha: 0.08);
    box-shadow: 0 0 0 2px rgba($color: $themeColor, $alpha: 0.12);
  }
}

.thumb-section {
  position: absolute;
  top: 5px;
  left: 24px;
  right: 6px;
  z-index: 3;
  height: 16px;
  font-size: 10px;
  color: #64748b;
  line-height: 1;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.45);
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumb-section-input {
  width: 100%;
  height: 14px;
  border: 1px solid $borderColor;
  border-radius: 4px;
  outline: none;
  font-size: 10px;
  text-align: left;
  padding: 0 4px;

  &:focus {
    border-color: $themeColor;
  }
}

.thumb-index {
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.45);
  position: absolute;
  left: 6px;
  top: 5px;
  margin: 0;
  line-height: 1;
  z-index: 2;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>