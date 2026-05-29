<template>
  <div class="pptist-editor">
    <!-- 顶部编辑器头部 -->
    <EditorHeader class="layout-header" />

    <!-- 标准版工作区：缩略图 + 画布 + 备注 + 右侧工具栏 -->
    <div v-if="editorMode === 'standard'" class="layout-content">
      <Thumbnails class="layout-content-left" :thumbnailsWidth="thumbnailsWidth - 40" :style="{ width: `${thumbnailsWidth}px` }" />
      <div class="resizerBar" ref="resizerBar" @mousedown.prevent="startDrag($event)" @touchstart.prevent="startDrag($event)">
        <span class="pptfont ppt-operation-move z-index10"></span>
      </div>
      <div
        class="layout-content-center"
        :style="{ width: rightToolVisible ? `calc(100% - ${thumbnailsWidth}px - 260px)` : `calc(100% - ${thumbnailsWidth}px)` }"
      >
      <div class="layout-center-top advanced-center">
          <CanvasTool class="center-top" />
          <div class="center-top-actions">
            <Popover
              trigger="click"
              placement="bottom-start"
              v-model:value="presetLayoutPopoverVisible"
              center
            >
              <template #content>
                <Templates
                  @select="handleTemplateSelect"
                  @selectAll="handleTemplateSelectAll"
                />
              </template>
              <div class="menu-item xs">
                <span class="handler-item pptfont ppt-create-createDirectly" />
                <span class="header-txt">模版</span>
              </div>
            </Popover>

            <div class="menu-item xs" @click="openAIPPTDialog()">
              <span class="handler-item pptfont ppt-operate-AI-Creation" />
              <span class="header-txt">AI</span>
            </div>
          </div>
      </div>
        
        <Canvas class="center-body" :style="{ height: `calc(100% - ${remarkHeight + 40}px)` }" />
        <Remark class="center-bottom" v-model:height="remarkHeight" :style="{ height: `${remarkHeight}px` }" />
      </div>
      <Toolbar class="layout-content-right" v-show="rightToolVisible" />
    </div>

    <!-- 高级版工作区：左侧导航/面板 + 中央画布 + 底部时间轴缩略图 -->
    <div v-else class="layout-content advanced-layout">
      <!-- 高级版左侧功能导航与内容面板 -->
      <div class="advanced-left">
        <div class="advanced-nav">
          <div
            v-for="item in advancedTools"
            :key="item.key"
            class="advanced-nav-item"
            :class="{ active: activeAdvancedTool === item.key }"
            @click="toggleAdvancedTool(item.key)"
          >
            <span class="advanced-nav-icon">
              <span class="designfont" :class="getAdvancedToolIconClass(item)"></span>
            </span>
            <span class="label">{{ item.label }}</span>
          </div>
          <!-- 帮助 -->
          <div class="advanced-nav-item help" >
            <span class="advanced-nav-icon">
              <span class="pptfont ppt-screen--help" ></span>
            </span>
            <span class="label">帮助</span>
          </div>
        </div>

        <div v-if="activeAdvancedTool !== 'none'" class="advanced-panel" :style="{ width: `${advancedToolPanelWidth}px` }">
          <!-- 非“我的”模块显示统一搜索框 -->
          <div v-if="activeAdvancedTool !== 'my'" class="panel-search">
            <!-- ai-design.png -->
             <img src="@/assets/images/ai-design.png" alt="" style="width: 230px; 
             margin-bottom: 8px;" @click="openAIPPTDialog()" />
            <input v-model="advancedSearchKeyword" type="text" placeholder="请输入您要搜索的内容" />
          </div>

          <!-- 添加模块：图片/文字/绘制/组件 -->
          <template v-if="activeAdvancedTool === 'add'">
            <div v-if="addPanelMatches.image" class="panel-group">
              <div class="panel-title">图片</div>
              <div class="upload-actions">
                <FileInput class="upload-input" @change="handleAdvancedImageChange">
                  <div class="upload-btn">
                    <span class="pptfont ppt-menu-image"></span>
                    <span>本地上传</span>
                  </div>
                </FileInput>
                <button class="upload-btn" @click="mainStore.setImageLibPanelState(true)">
                  <span class="pptfont ppt-design-cloud"></span>
                  <span>手机上传</span>
                </button>
              </div>
            </div>

            <div v-if="addPanelMatches.text" class="panel-group mt16">
              <div class="panel-title">文字</div>
              <div class="text-actions">
                <button class="text-btn" @click="startCreateText(false)"><strong>H1</strong><span>标题</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>H</strong><span>副标题</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>T</strong><span>正文</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>T</strong><span>变形文字</span></button>
                <button class="text-btn" @click="startCreateText(false)"><strong>T</strong><span>3D文字</span></button>
              </div>
            </div>

            <div v-if="addPanelMatches.draw" class="panel-group mt16">
              <div class="panel-title">绘制</div>
              <div class="draw-actions">
                <button class="shape-btn" @click="startCreateRectShape()"><span class="shape-square"></span></button>
                <button class="shape-btn" @click="startCreateTriangleShape()"><span class="shape-triangle"></span></button>
                <button class="shape-btn" @click="startCreateCircleShape()"><span class="shape-circle"></span></button>
                <button class="shape-btn" @click="startCreateLineShape()"><span class="shape-line"></span></button>
                <button class="shape-btn" @click="startCreateLineShape()"><span class="shape-dash-line"></span></button>
              </div>
            </div>

            <div v-if="addPanelMatches.component" class="panel-group mt16">
              <div class="panel-title">组件</div>
              <div class="panel-grid component-grid">
                <button class="grid-btn" @click="createSlide()">拼图</button>
                <button class="grid-btn" @click="mainStore.setSymbolPanelState(true)">二维码</button>
                <button class="grid-btn" @click="insertAdvancedTableElement()">图表</button>
                <button class="grid-btn" @click="mainStore.setSymbolPanelState(true)">图例</button>
              </div>
            </div>

            <div v-if="!hasAddPanelMatches" class="panel-empty">当前模块下未找到匹配内容</div>
          </template>

          <!-- 模板模块 -->
          <template v-else-if="activeAdvancedTool === 'template'">
            <AdvancedTemplatePanel
              :searchKeyword="advancedSearchKeyword"
              @insertPage="createSlideByTemplate"
              @replaceCurrentPage="replaceCurrentSlideByTemplate"
              @replaceAll="replaceAllByTemplate"
            />
          </template>

          <!-- 图层模块 -->
          <template v-else-if="activeAdvancedTool === 'layer'">
            <AdvancedLayerPanel />
          </template>

          <!-- 素材模块 -->
          <template v-else-if="activeAdvancedTool === 'material'">
            <AdvancedMaterialPanel :searchKeyword="advancedSearchKeyword" />
          </template>

          <!-- 背景模块 -->
          <template v-else-if="activeAdvancedTool === 'background'">
            <AdvancedBackgroundPanel :searchKeyword="advancedSearchKeyword" />
          </template>

          <!-- 图片模块 -->
          <template v-else-if="activeAdvancedTool === 'media'">
            <AdvancedMediaPanel :searchKeyword="advancedSearchKeyword" />
          </template>

          <!-- 文字模块 -->
          <template v-else-if="activeAdvancedTool === 'text'">
            <AdvancedTextPanel :searchKeyword="advancedSearchKeyword" />
          </template>

          <!-- 形状模块 -->
          <template v-else-if="activeAdvancedTool === 'shape'">
            <div class="panel-title">形状工具</div>
            <div class="panel-actions">
              <button class="action-btn" @click="startCreateRectShape()">插入矩形</button>
              <button class="action-btn" @click="mainStore.setSelectPanelState(true)">打开图层面板</button>
              <button class="action-btn" @click="mainStore.setSymbolPanelState(true)">打开符号面板</button>
            </div>
          </template>

          <!-- 我的模块 -->
          <template v-else-if="activeAdvancedTool === 'my'">
            <AdvancedMyPanel />
          </template>

          <!-- 团队模块 -->
          <template v-else-if="activeAdvancedTool === 'team'">
            <div class="panel-title">团队协作</div>
            <div class="panel-actions">
              <button class="action-btn" @click="mainStore.setNotesPanelState(true)">打开批注面板</button>
              <button class="action-btn" @click="mainStore.setSelectPanelState(true)">打开图层面板</button>
              <button class="action-btn" @click="mainStore.setSearchPanelState(true)">查找替换</button>
            </div>
          </template>

          <!-- AI 模块 -->
          <template v-else-if="activeAdvancedTool === 'ai'">
            <AdvancedAIPanel :searchKeyword="advancedSearchKeyword" />
          </template>
        </div>

        <!-- 左侧面板折叠/展开控制 -->
        <div class="advanced-panel-toggle" @click="toggleAdvancedPanelCollapse()" :title="activeAdvancedTool === 'none' ? '展开工具栏' : '折叠工具栏'">
          <!-- <span class="toggle-arrow" :class="{ collapsed: activeAdvancedTool === 'none' }"></span> -->
        </div>
      </div>

      <!-- 高级版中央区域：画布 + 底部工具/缩略图 -->
      <div class="layout-content-center advanced-center" :style="{ width: advancedCenterWidth }">
        <!-- <div class="layout-center-top" >
          <CanvasTool class="center-top" />
          <div class="center-top-actions">
            <div class="menu-item xs" @click="openAIPPTDialog()">
              <span class="handler-item pptfont ppt-operate-AI-Creation" />
              <span class="header-txt">AI创建</span>
            </div>
          </div>
        </div> -->

        <Canvas class="center-body" :style="{ height: `calc(100% - ${advancedBottomHeight}px)` }" />

        <!-- 底部条：页码控制、缩放、视图控制、缩略图时间轴 -->
        <div class="advanced-bottom" :style="{ height: `${advancedBottomHeight}px` }">
          <div class="advanced-thumb-toolbar">
            <div class="toolbar-left">
              <button class="layer-entry" @click="toggleAdvancedTool('layer')">
                <span class="pptfont ppt-menu-layer"></span>
                <span>图层</span>
              </button>
              <div class="advanced-page-stat">
                <span class="stat-label">幻灯片：</span>
                <!-- <input
                  v-model="pageJumpValue"
                  class="page-jump-input"
                  @keydown.enter.prevent="jumpToSlideByInput()"
                  @blur="jumpToSlideByInput()"
                > -->
               
                <span> {{pageJumpValue}} / {{ slides.length }}</span>
                 <span class="designfont designicon-layer-expand" style="font-size: 12px;" :class="{ collapsed: advancedThumbsCollapsed }"
                  @click.stop="toggleAdvancedThumbsCollapse()"/>
                <!-- <span
                  class="stat-arrow"
                  :class="{ collapsed: advancedThumbsCollapsed }"
                  @click.stop="toggleAdvancedThumbsCollapse()"
                ></span> -->
              </div>
            </div>
            <Remark class="center-bottom remarkRight" :isShowRemark="false" v-model:height="remarkHeight" :style="{ height: `${remarkHeight}px` }" />
            
          </div>
          <!-- 幻灯片缩略图拖拽区 -->
          <div
            v-show="!advancedThumbsCollapsed"
            class="advanced-thumbnails"
            v-contextmenu="contextmenusAdvancedThumbnails"
          >
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
                  <!-- 高级版底部 幻灯片缩略图 -->
                  <ThumbnailSlide :slide="element" :size="advancedThumbSize" />
                </div>
              </template>
            </Draggable>
            <div class="add-thumb" @click="createSlide()">
              <span class="pptfont ppt-screen-amplify"></span>
            </div>
          </div>
        </div>
      </div>

      <Toolbar class="layout-content-right" v-show="rightToolVisible" />
    </div>
  </div>

  <!-- 全局弹窗与侧边面板挂载区 -->
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
/* eslint-disable max-lines */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useKeyboardStore, useMainStore, useSlidesStore } from '@/store'
import useGlobalHotkey from '@/hooks/useGlobalHotkey'
import usePasteEvent from '@/hooks/usePasteEvent'
import useSlideHandler from '@/hooks/useSlideHandler'
import useScreening from '@/hooks/useScreening'
import useSectionHandler from '@/hooks/useSectionHandler'
import useCreateElement from '@/hooks/useCreateElement'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import { getImageDataURL } from '@/utils/image'
import { createElementIdMap, createSlideIdMap } from '@/utils/element'
import type { Slide, SlideTheme } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'

import EditorHeader from './EditorHeader/index.vue'
import Canvas from './Canvas/index.vue'
import CanvasTool from './CanvasTool/index.vue'
import Thumbnails from './Thumbnails/index.vue'
import AdvancedTemplatePanel from './AdvancedTemplatePanel.vue'
import AdvancedLayerPanel from './AdvancedLayerPanel.vue'
import AdvancedMaterialPanel from './AdvancedMaterialPanel.vue'
import AdvancedTextPanel from './AdvancedTextPanel.vue'
import AdvancedMediaPanel from './AdvancedMediaPanel.vue'
import AdvancedBackgroundPanel from './AdvancedBackgroundPanel.vue'
import AdvancedAIPanel from './AdvancedAIPanel.vue'
import AdvancedMyPanel from './AdvancedMyPanel.vue'
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
import FileInput from '@/components/FileInput.vue'
import Popover from '@/components/Popover.vue'
import Draggable from 'vuedraggable'
import Templates from './Thumbnails/Templates.vue'

// 基础 store 与状态
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

// 业务能力 hooks
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
const { addHistorySnapshot } = useHistorySnapshot()
const { enterScreening } = useScreening()
const { createImageElement, createTableElement } = useCreateElement()
const { addSlidesFromData } = useAddSlidesOrElements()
const {
  removeSection,
  removeAllSection,
  removeSectionSlides,
  updateSectionTitle,
  createSection,
} = useSectionHandler()

// 顶部创建入口（迁移自 Header）：模板创建仅标准版显示，AI创建标准版和高级版均显示
const presetLayoutPopoverVisible = ref(false)

const insertAllTemplates = (payload: Slide[] | { slides: Slide[]; theme?: Partial<SlideTheme> }) => {
  const list: Slide[] = Array.isArray(payload) ? payload : payload?.slides || []
  const theme = Array.isArray(payload) ? undefined : payload?.theme
  if (isEmptySlide.value) slidesStore.setSlides(list, theme)
  else addSlidesFromData(list)
}

const handleTemplateSelect = (slide: Slide) => {
  createSlideByTemplate(slide)
  presetLayoutPopoverVisible.value = false
}

const handleTemplateSelectAll = (payload: { slides: Slide[]; theme: Partial<SlideTheme> }) => {
  insertAllTemplates(payload)
  presetLayoutPopoverVisible.value = false
}

const openAIPPTDialog = () => {
  mainStore.setAIPPTDialogState(true)
}

// 对话框状态控制
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
  | 'layer' // 图层面板（底部按钮触发）
  | 'none'

type AdvancedNavItem = {
  key: Exclude<AdvancedTool, 'layer' | 'none'>
  label: string
  icon: string
  activeIcon?: string
}

const activeAdvancedTool = ref<AdvancedTool>('add')
const lastAdvancedTool = ref<Exclude<AdvancedTool, 'none'>>('add')
const advancedSearchKeyword = ref('')
const pageJumpValue = ref('1')
const advancedTools: AdvancedNavItem[] = [
  { key: 'add', label: '添加', icon: 'designicon-nav-create', activeIcon: 'designicon-nav-create-active' },
  { key: 'template', label: '模板', icon: 'designicon-nav-template', activeIcon: 'designicon-nav-template-active' },
  { key: 'material', label: '素材', icon: 'designicon-nav-material', activeIcon: 'designicon-nav-material-active' },
  { key: 'text', label: '文字', icon: 'designicon-nav-text', activeIcon: 'designicon-nav-text-active' },
  { key: 'media', label: '图片', icon: 'designicon-nav-image', activeIcon: 'designicon-nav-image-active' },
  { key: 'background', label: '背景', icon: 'designicon-nav-background', activeIcon: 'designicon-nav-background-active' },
  { key: 'ai', label: 'AI工具', icon: 'designicon-nav-ai', activeIcon: 'designicon-nav-AI-active' },
  { key: 'my', label: '我的', icon: 'designicon-nav-space', activeIcon: 'designicon-nav-space-active' },
  { key: 'team', label: '团队', icon: 'designicon-nav-team', activeIcon: 'designicon-nav-team-hover' },
]

// 高级版导航统一复用 icons-design 字体图标，高亮态优先切换到 active 图标。
const getAdvancedToolIconClass = (item: AdvancedNavItem) => {
  if (activeAdvancedTool.value === item.key && item.activeIcon) return item.activeIcon
  return item.icon
}

const normalizeAdvancedSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesAdvancedSearch = (...texts: string[]) => {
  const keyword = normalizeAdvancedSearch(advancedSearchKeyword.value.trim())
  if (!keyword) return true
  return texts.some(text => normalizeAdvancedSearch(text).includes(keyword))
}

const addPanelMatches = computed(() => ({
  image: matchesAdvancedSearch('图片 本地上传 手机上传 上传 图片'),
  text: matchesAdvancedSearch('文字 标题 副标题 正文 变形文字 3D文字'),
  draw: matchesAdvancedSearch('绘制 矩形 三角形 圆形 直线 虚线'),
  component: matchesAdvancedSearch('组件 拼图 二维码 图表 图例'),
}))

const hasAddPanelMatches = computed(() => Object.values(addPanelMatches.value).some(Boolean))

const hasSection = computed(() => slides.value.some(item => item.sectionTag))
const advancedEditingSectionId = ref('')

const advancedToolPanelWidth = computed(() => {
  if (activeAdvancedTool.value === 'none') return 0
  return 260
})

const advancedSelectedSlidesIndex = computed(() => [..._selectedSlidesIndex.value, slideIndex.value])

const advancedCenterWidth = computed(() => {
  const left = 56 + advancedToolPanelWidth.value
  const right = rightToolVisible.value ? 260 : 0
  return `calc(100% - ${left + right}px)`
})

const advancedThumbSize = 150
const advancedThumbsCollapsed = ref(false)

const toggleAdvancedThumbsCollapse = () => {
  advancedThumbsCollapsed.value = !advancedThumbsCollapsed.value
}

const advancedBottomHeight = computed(() => advancedThumbsCollapsed.value ? 56 : 155)

// 复用标准版图片上传逻辑：本地选择后直接创建图片元素
const insertAdvancedImageElement = (files: FileList | File[]) => {
  const imageFile = files[0]
  if (!imageFile) return
  getImageDataURL(imageFile).then(dataURL => createImageElement(dataURL))
}

const handleAdvancedImageChange = (files: FileList | File[]) => {
  insertAdvancedImageElement(files)
}

// 复用标准版表格插入能力：高级版点击图表时直接插入默认表格
const insertAdvancedTableElement = () => {
  createTableElement(3, 3)
}

const toggleAdvancedTool = (tool: AdvancedTool) => {
  activeAdvancedTool.value = activeAdvancedTool.value === tool ? 'none' : tool
  if (activeAdvancedTool.value !== 'none') lastAdvancedTool.value = activeAdvancedTool.value
}

// 折叠后可一键恢复到上次打开的工具页
const toggleAdvancedPanelCollapse = () => {
  activeAdvancedTool.value = activeAdvancedTool.value === 'none' ? lastAdvancedTool.value : 'none'
}

const changeSlideIndex = (index: number) => {
  mainStore.setActiveElementIdList([])
  if (slideIndex.value === index) return
  slidesStore.updateSlideIndex(index)
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

const cloneTemplateSlide = (source: Slide): Slide => {
  const slide = JSON.parse(JSON.stringify(source)) as Slide
  const { groupIdMap, elIdMap } = createElementIdMap(slide.elements)

  for (const element of slide.elements) {
    element.id = elIdMap[element.id]
    if (element.groupId) element.groupId = groupIdMap[element.groupId]
    if (element.link && element.link.type === 'slide') delete element.link
  }

  if (slide.animations) {
    for (const animation of slide.animations) {
      animation.id = nanoid(10)
      animation.elId = elIdMap[animation.elId]
    }
  }

  return {
    ...slide,
    id: nanoid(10),
  }
}

const replaceCurrentSlideByTemplate = (slide: Slide) => {
  if (!slides.value.length) return

  const currentIndex = slideIndex.value
  const nextSlides = JSON.parse(JSON.stringify(slides.value)) as Slide[]
  const sectionTag = nextSlides[currentIndex]?.sectionTag
  const nextSlide = cloneTemplateSlide(slide)
  if (sectionTag) nextSlide.sectionTag = sectionTag

  nextSlides[currentIndex] = nextSlide
  slidesStore.setSlides(nextSlides)
  mainStore.setActiveElementIdList([])
  mainStore.updateSelectedSlidesIndex([])
  addHistorySnapshot()
}

const replaceAllByTemplate = (payload: { slides: Slide[]; theme?: Partial<SlideTheme> }) => {
  const sourceSlides = Array.isArray(payload?.slides) ? payload.slides : []
  if (!sourceSlides.length) return

  const copiedSlides = JSON.parse(JSON.stringify(sourceSlides)) as Slide[]
  const slideIdMap = createSlideIdMap(copiedSlides)

  const nextSlides = copiedSlides.map(slide => {
    const { groupIdMap, elIdMap } = createElementIdMap(slide.elements)

    for (const element of slide.elements) {
      element.id = elIdMap[element.id]
      if (element.groupId) element.groupId = groupIdMap[element.groupId]
      if (element.link && element.link.type === 'slide') {
        if (slideIdMap[element.link.target]) element.link.target = slideIdMap[element.link.target]
        else delete element.link
      }
    }

    if (slide.animations) {
      for (const animation of slide.animations) {
        animation.id = nanoid(10)
        animation.elId = elIdMap[animation.elId]
      }
    }

    return {
      ...slide,
      id: slideIdMap[slide.id],
    }
  })

  slidesStore.setSlides(nextSlides, payload.theme)
  slidesStore.updateSlideIndex(0)
  mainStore.setActiveElementIdList([])
  mainStore.updateSelectedSlidesIndex([])
  addHistorySnapshot()
}

useGlobalHotkey()
usePasteEvent()

const thumbnailsWidth = ref<number>(220)
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
    thumbnailsWidth.value = 220
  }
}


import { useRoute } from 'vue-router'

const route = useRoute()

// AI生成PPT缓存前缀，需与AIPPTDialog.vue保持一致
const AI_HOME_CACHE_PREFIX = 'AI_HOME_GENERATED_PPT_'

onMounted(() => {
  resizerBarHandler()
  window.addEventListener('resize', resizerBarHandler)

  // 只要进入 /editor?id=xxx 页面，无论 slidesStore 状态如何，立即清理 AI_HOME_GENERATED_PPT_xxx 缓存，彻底避免污染
  const id = route.query.id
  if (id) {
    const cacheKey = `${AI_HOME_CACHE_PREFIX}${id}`
    const cacheStr = sessionStorage.getItem(cacheKey)
    if (cacheStr) {
      try {
        const cache = JSON.parse(cacheStr)
        if (cache && cache.content && Array.isArray(cache.content.slides) && cache.content.slides.length > 0) {
          slidesStore.setSlides(cache.content.slides, cache.content.theme)
          if (typeof cache.content.title === 'string') slidesStore.setTitle(cache.content.title)
          if (typeof cache.content.width === 'number') slidesStore.setViewportSize(cache.content.width)
          if (typeof cache.content.height === 'number' && typeof cache.content.width === 'number' && cache.content.width > 0) {
            slidesStore.setViewportRatio(cache.content.height / cache.content.width)
          }
          slidesStore.setPptId(Number(id))
          slidesStore.updateSlideIndex(0)
        }
      }
      catch (e) {
        // ignore parse error
      }
    }
    // 无论是否读取，始终清理缓存，彻底避免污染
    sessionStorage.removeItem(cacheKey)
  }
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
  height: 56px;
}

.layout-content {
  height: calc(100% - 56px);
  display: flex;
}

.layout-content-left {
  width: 220px;
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
  width: calc(100% - 220px - 260px);

  .layout-center-top {
    height: 55px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 12px;

  }

  .center-top {
    height: 50px;
    width: 100%;
  }
}

.center-top-actions {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.06);
    background-color: #fff;
    border-radius: 5px;
}

.menu-item {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 13px;
  padding: 0 10px;
  border-radius: $borderRadius;
  cursor: pointer;

  .pptfont {
    font-size: 18px !important;
    margin-right: 5px;
  }

  &:hover {
    background-color: #f1f1f1;
  }
}

.handler-item {
  height: 30px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.layout-content-right {
  width: 260px;
  padding: 0 8px;
  height: 100%;
}

.center-bottom {
  background: $lightGray;
 
}
.center-bottom.remarkRight{
 display: flex;
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
  position: relative;
}

.advanced-nav {

  border-right: 1px solid $borderColor;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  gap: 4px;
}

.advanced-nav-item {
  width: 52px;
  min-height: 52px;
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
  &.help{
    position: absolute;
    bottom:20px;
  }

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
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  .designfont {
    font-size: 20px;
  }
}

.advanced-panel {
  height: 100%;
  overflow: auto;
  background: #fff;
  padding: 0px 14px 16px;
}

.advanced-panel-toggle {
  position: absolute;
  right: -21px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 56px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  background: url(../src/assets/images/toggle-arrow.png) no-repeat center;
  background-size: 100%;
}

.toggle-arrow {
  width: 6px;
  height: 6px;
  border-top: 1.5px solid #6b7280;
  border-right: 1.5px solid #6b7280;
  transform: rotate(225deg) translateX(-1px);
  flex-shrink: 0;

  &.collapsed {
    transform: rotate(45deg) translateX(-1px);
  }
}

.panel-search {
  margin-bottom: 12px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
  padding: 2px 0 8px;

  input {
    display: block;
    width: 100%;
    max-width: 224px;
    height: 31px;
    border: 1px solid $borderColor;
    border-radius: 8px;
    padding: 0 12px;
    margin: 0 auto;
    box-sizing: border-box;
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

.panel-group + .panel-group {
  border-top: 1px solid #edf0f5;
  padding-top: 16px;
}

.upload-actions {
  display: flex;
  gap: 10px;
}

.upload-input {
  flex: 1;
}

.upload-input :deep(.file-input) {
  height: 100%;
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
.shape-line,
.shape-dash-line {
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

.shape-dash-line {
  width: 16px;
  height: 0;
  border-top: 1.5px dashed #4b5563;
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

.component-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));

  .grid-btn {
    height: 66px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
  }
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
  background: #F8F9FA;
   position:relative;
  .center-top {
    height: 50px;
  }
}



.advanced-thumb-toolbar {
  height: 37px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 6px 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.zoom-control,
.view-control {
  height: 30px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 1px 2px rgba(31, 41, 55, 0.06);
}

.zoom-control {
  min-width: 156px;
  display: flex;
  align-items: center;
}



.tool-btn {
  min-width: 50px;

  border: 0;
  background: transparent;
  color: #4b5563;
  font-size: 14px;
  cursor: pointer;

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
  min-width: 56px;
  font-size: 14px;
  font-weight: 600;
}

.advanced-thumbnails {
  height: 126px;
  display: flex;
  align-items: center;
  padding: 10px 18px 12px;
  gap: 12px;
  background: #F8F9FA;
  position: relative;
  padding-right:105px;
}

.layer-entry {
  display: none;
}

.advanced-page-stat {
  min-width: 135px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;

  .pptfont {
    font-size: 12px;
  }

  .stat-label {
    color: #4b5563;
    font-weight: 600;
  }

  .stat-arrow {
    width: 7px;
    height: 7px;
    cursor: pointer;
    border-top: 1.4px solid #6b7280;
    border-right: 1.4px solid #6b7280;
    transform: rotate(-45deg) translateY(1px);
    margin-left: 2px;
    cursor: pointer;
    transition: transform .2s ease;

    &.collapsed {
      transform: rotate(135deg) translateY(0);
    }
  }
}

.page-jump-input {
  width: 20px;
  height: 26px;
  border: 0;
  text-align: center;
  padding: 0;
  background: transparent;
  outline: none;
  color: inherit;
  font-weight: 700;
  border-radius: 6px;

  &:focus {
    box-shadow: inset 0 0 0 1px rgba($color: $themeColor, $alpha: 0.35);
    background: rgba(255, 255, 255, 0.66);
  }
}

.add-thumb {
  width: 84px;
  height: 88px;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #7b8391;
  position: absolute;
  top: 12px;
  right:10px;

  .pptfont {
    font-size: 44px;
    color: #7f8793;
  }

  &:hover {
    border-color: #aeb7c7;
    color: #5f6b7a;
    background: #eef1f6;

    .pptfont {
      color: #5f6b7a;
    }
  }
}

.thumb-list {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  align-items: center;
  gap: 5px;

  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.75) transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.75);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.thumb-item {
  width: fit-content;
  min-width: fit-content;
  cursor: pointer;
  border-radius: 12px;
  padding: 3px;
  border: 1px solid transparent;
  transition: all .15s ease;
  position: relative;

  :deep(.thumbnail-slide) {
    border-radius: 10px !important;
  }

  &.selected {
    border-color: rgba($color: $themeColor, $alpha: 0.22);
    background: transparent;
  }

  &.active {
    border-color: $themeColor;
    background: transparent;
    box-shadow: 0 0 0 1px rgba($color: $themeColor, $alpha: 0.18);
     .thumb-index {
      color: #2f5fb3;
    }
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
  min-width: 14px;
  height: 14px;
  border-radius: 0;
  font-size: 11px;
  font-weight: 700;
  color: #000;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(2px);
 border-radius: 2px;
  border: 0;
  position: absolute;
  left: 9px;
  top: 8px;
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