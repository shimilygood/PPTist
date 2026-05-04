<template>
  <div class="editor-header">
    <div class="left">
      <span class="pptfont ppt-nav-home" />

      <Popover trigger="click" placement="bottom-start" v-model:value="mainMenuVisible">
        <template #content>
          <div class="main-menu">
            <div
              class="ai-menu"
              @click="
                openAIPPTDialog();
                mainMenuVisible = false;
              "
            >
              <div class="icon">
                <IconClick theme="two-tone" :fill="['#ffc158', '#fff']" />
              </div>
              <div class="aippt-content">
                <div class="aippt"><span>AIPPT</span></div>
                <div class="aippt-subtitle">输入一句话，智能生成演示文稿</div>
              </div>
            </div>
          </div>
          <Divider :margin="10" />
          <div class="import-section">
            <div class="import-label">导入文件</div>
            <div class="import-grid">
              <FileInput
                class="import-block"
                accept="application/vnd.openxmlformats-officedocument.presentationml.presentation"
                @change="handleImportPPTX"
              >
                <span class="icon"
                  ><IconFilePdf theme="multi-color" :fill="['#333', '#d14424', '#fff']"
                /></span>
                <span class="label">PPTX</span>
                <span class="sub-label">（仅供测试）</span>
              </FileInput>
              <FileInput
                class="import-block"
                accept=".json"
                @change="handleImportJSON"
              >
                <span class="icon"
                  ><IconFileJpg theme="multi-color" :fill="['#333', '#d14424', '#fff']"
                /></span>
                <span class="label">JSON</span>
                <span class="sub-label">（仅供测试）</span>
              </FileInput>
              <FileInput
                class="import-block"
                accept=".pptist"
                @change="handleImportPPTIST"
              >
                <span class="icon"
                  ><IconNotes theme="multi-color" :fill="['#333', '#d14424', '#fff']"
                /></span>
                <span class="label">PPTIST</span>
                <span class="sub-label">（专属格式）</span>
              </FileInput>
            </div>
          </div>
          <Divider :margin="10" />
          <PopoverMenuItem class="popover-menu-item" @click="setDialogForExport('pptx')"
            ><IconDownload class="icon" /> 导出文件</PopoverMenuItem
          >
          <Divider :margin="10" />
          <PopoverMenuItem
            class="popover-menu-item"
            @click="
              resetSlides();
              mainMenuVisible = false;
            "
            ><IconRefresh class="icon" /> 重置幻灯片</PopoverMenuItem
          >
          <PopoverMenuItem
            class="popover-menu-item"
            @click="
              openMarkupPanel();
              mainMenuVisible = false;
            "
            ><IconMark class="icon" /> 幻灯片类型标注</PopoverMenuItem
          >
          <PopoverMenuItem
            class="popover-menu-item"
            @click="
              mainMenuVisible = false;
              hotkeyDrawerVisible = true;
            "
            ><IconCommand class="icon" /> 快捷操作</PopoverMenuItem
          >
          <PopoverMenuItem
            class="popover-menu-item"
            @click="goLink('https://github.com/pipipi-pikachu/PPTist/issues')"
            ><IconComment class="icon" /> 意见反馈</PopoverMenuItem
          >
          <PopoverMenuItem
            class="popover-menu-item"
            @click="
              goLink('https://github.com/pipipi-pikachu/PPTist/blob/master/doc/Q&A.md')
            "
            ><IconHelpcenter class="icon" /> 常见问题</PopoverMenuItem
          >
          <!-- <Divider :margin="10" />
          <div class="statement">注：略</div> -->
        </template>
        <div class="menu-item">
          文件<span class="icon-item pptfont ppt-design-down ml-5" />
        </div>
      </Popover>
      <span class="handler-item pptfont ppt-fengexian gray-200" />
      <div class="title">
        <Input
          class="title-input"
          ref="titleInputRef"
          v-model:value="titleValue"
          @blur="handleUpdateTitle()"
          v-if="editingTitle"
        ></Input>
        <div class="title-text" @click="startEditTitle()" :title="title" v-else>
          {{ title }}
        </div>
      </div>
      <span class="icon-item pptfont ppt-design-down ml-5" />
      <span class="handler-item pptfont ppt-fengexian gray-200" />
      <span class="icon-item pptfont ppt-design-cloud ml-5" />
      <span class="xs gray-400 ml-5">保存于 13:16</span>
    </div>
    <div class="center">
      <div class="center-actions">
        <span
          class="handler-item pptfont ppt-design-rollback"
          :class="{ disable: !canUndo }"
          v-tooltip="'撤销（Ctrl + Z）'"
          @click="undo()"
        />
        <span
          class="handler-item pptfont ppt-design-advance"
          :class="{ disable: !canRedo }"
          v-tooltip="'重做（Ctrl + Y）'"
          @click="redo()"
        />

        <span class="center-divider" />

        <div class="center-tool-item" @click="showRightTool">
          <span class="pptfont ppt-Vector" />
          <span class="header-txt">属性</span>
        </div>
        <div class="center-tool-item" @click="toggleSelectPanel()">
          <span class="pptfont ppt-menu-layer" />
          <span>图层</span>
        </div>
        <div class="center-tool-item" @click="toggleSraechPanel()">
          <span class="pptfont ppt-general-search-icon" />
         <span class="header-txt">搜索</span>
        </div>

        <div class="group-menu-item center-demo-item">
          <div class="menu-item" v-tooltip="'幻灯片放映（F5）'" @click="enterScreening()">
            <span class="pptfont ppt-operate-demo" />
            <span class="header-txt">演示</span>
          </div>
          <Popover trigger="click" center>
            <template #content>
              <PopoverMenuItem
                class="popover-menu-item"
                @click="enterScreeningFromStart()"
                ><IconSlideTwo class="icon" /> 从头开始</PopoverMenuItem
              >
              <PopoverMenuItem class="popover-menu-item" @click="enterScreening()"
                ><IconPpt class="icon" /> 从当前页开始</PopoverMenuItem
              >
            </template>
            <div class="arrow-btn"><IconDown class="arrow" /></div>
          </Popover>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="header-right-actions">
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
            <span class="header-txt">模版创建</span>
          </div>
          <!-- <div class="select-btn"><IconDown /></div> -->
        </Popover>

        <div
          class="menu-item xs"
          @click="
            openAIPPTDialog();
            mainMenuVisible = false;
          "
        >
          <span class="handler-item pptfont ppt-operate-AI-Creation" />
          <span class="header-txt">AI创建</span>
        </div>
        <div class="mode-switch">
          <div class="mode-indicator" :class="{ 'pos-advanced': editorMode === 'advanced', shake: shake }" />
          <div
            class="mode-btn"
            :class="{ cur: editorMode === 'standard' }"
            @click="switchEditorMode('standard')"
          >
            标准版
          </div>
          <div
            class="mode-btn"
            :class="{ cur: editorMode === 'advanced' }"
            @click="switchEditorMode('advanced')"
          >
            高级版
          </div>
        </div>
        <!-- <div
          class="flex flex-center pl-12 pr-12 btnPlain"
          @click="setDialogForExport('pptx')"
        >
          <span class="designfont designicon-operation-release xs mr-6" style=' margin-right: 5px;' /> 保存
        </div> -->

        <div
          class="flex flex-center pl-12 pr-12 btnPlain"
          @click="publishTemplate(0)"
        >
          <span class="designfont designicon-operation-release xs mr-6" style=' margin-right: 5px;' /> 保存
        </div>
        <div
          class="flex flex-center pl-12 pr-12 btnPlain"
          @click="publishTemplate(1)"
        >
          <span class="designfont designicon-operation-release xs mr-6" style=' margin-right: 5px;' /> 发布
        </div>
        <div
          class="flex flex-center pl-12 pr-12 btnBlue"
          @click="handleDownloadPPT()"
        >
          <span class="pptfont ppt-create-download xs mr-4" />下载
        </div>
      </div>

    

      
    </div>

    <Drawer :width="320" v-model:visible="hotkeyDrawerVisible" placement="right">
      <HotkeyDoc />
      <template v-slot:title>快捷操作</template>
    </Drawer>

    <FullscreenSpin :loading="exporting" tip="正在导入..." />
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { saveAs } from 'file-saver'
import { useMainStore, useSlidesStore, useSnapshotStore } from '@/store'
import useScreening from '@/hooks/useScreening'
import useImport from '@/hooks/useImport'
import useSlideHandler from '@/hooks/useSlideHandler'
import type { DialogForExportTypes } from '@/types/export'
import HotkeyDoc from './HotkeyDoc.vue'
import FileInput from '@/components/FileInput.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import Drawer from '@/components/Drawer.vue'
import Input from '@/components/Input.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import Divider from '@/components/Divider.vue'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Templates from './../Thumbnails/Templates.vue'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import type { Slide, SlideTheme } from '@/types/slides'
import type { EditorMode } from '@/store/main'
import { DownloadPPT, PPTAction } from '@/api/editor'
import message from '@/utils/message'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const route = useRoute()
const { title, slides, theme, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { enterScreening, enterScreeningFromStart } = useScreening()
const { importSpecificFile, importPPTXFile, importJSON, exporting } = useImport()
const { resetSlides, createSlideByTemplate, isEmptySlide } = useSlideHandler()

const {
  showSelectPanel,
  showSearchPanel,
  editorMode,
} = storeToRefs(mainStore)
const { canUndo, canRedo } = storeToRefs(useSnapshotStore())
const { redo, undo } = useHistorySnapshot()
// 打开选择面板
const toggleSelectPanel = () => {
  mainStore.setSelectPanelState(!showSelectPanel.value)
}

// 打开搜索替换面板
const toggleSraechPanel = () => {
  mainStore.setSearchPanelState(!showSearchPanel.value)
}

const handleImportPPTX = (files: FileList | File[]) => {
  importPPTXFile(files)
  mainMenuVisible.value = false
}

const handleImportJSON = (files: FileList | File[]) => {
  importJSON(files)
  mainMenuVisible.value = false
}

const handleImportPPTIST = (files: FileList | File[]) => {
  importSpecificFile(files)
  mainMenuVisible.value = false
}

// 模版创建
const presetLayoutPopoverVisible = ref(false)
const { addSlidesFromData } = useAddSlidesOrElements()
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

const switchEditorMode = (mode: EditorMode) => {
  if (editorMode.value === mode) return
  mainStore.setEditorMode(mode)
}

// 小抖动效果开关
const shake = ref(false)
watch(editorMode, (nv, ov) => {
  if (nv === ov) return
  shake.value = true
  setTimeout(() => (shake.value = false), 360)
})

const mainMenuVisible = ref(false)
const hotkeyDrawerVisible = ref(false)
const editingTitle = ref(false)
const titleValue = ref('')
const titleInputRef = useTemplateRef<InstanceType<typeof Input>>('titleInputRef')

const startEditTitle = () => {
  titleValue.value = title.value
  editingTitle.value = true
  nextTick(() => titleInputRef.value?.focus())
}

const handleUpdateTitle = () => {
  slidesStore.setTitle(titleValue.value)
  editingTitle.value = false
}

const goLink = (url: string) => {
  window.open(url)
  mainMenuVisible.value = false
}

const setDialogForExport = (type: DialogForExportTypes) => {
  mainStore.setDialogForExport(type)
  mainMenuVisible.value = false
}

const publishing = ref(false)

const buildPublishPayload = (type: 0 | 1) => {
  const routeId = Number(route.query.id)
  const id = Number.isFinite(routeId) && routeId > 0 ? routeId : undefined
  const width = viewportSize.value
  const height = viewportSize.value * viewportRatio.value
  const jsonData = {
    title: title.value || '未命名演示文稿',
    width,
    height,
    theme: theme.value,
    slides: slides.value,
  }

  return {
    ...(id ? { id } : {}),
    action: type,
    name: title.value || '未命名演示文稿',
    pptVO: {
      name: title.value || '未命名演示文稿',
      cover: '',
      json: JSON.stringify(jsonData),
      width,
      height,
    },
  }
}

const publishTemplate = async (type: 0 | 1) => {
  if (publishing.value) return
  publishing.value = true

  const actionText = type === 0 ? '保存' : '发布'

  try {
    const response = await PPTAction(buildPublishPayload(type))
    const res = response as unknown as { code?: number; msg?: string; data?: boolean }
    if (res.code === 0 && res.data) {
      message.success(`${actionText}成功`)
    }
    else {
      message.error(res.msg || `${actionText}失败`)
    }
  }
  catch {
    message.error(`${actionText}失败`)
  }
  finally {
    publishing.value = false
  }
}

const handleDownloadPPT = async () => {
  const routeId = Number(route.query.id)
  const id = Number.isFinite(routeId) && routeId > 0 ? routeId : undefined

  if (!id) {
    setDialogForExport('pptx')
    return
  }

  try {
    const fileData = await DownloadPPT(id) as Blob | { data?: Blob }
    const fileBlob = fileData instanceof Blob ? fileData : fileData.data
    if (!fileBlob) throw new Error('empty file')
    saveAs(fileBlob, `${title.value || '演示文稿'}.pptx`)
  }
  catch {
    message.error('下载失败')
  }
}

const openMarkupPanel = () => {
  mainStore.setMarkupPanelState(true)
}

const openAIPPTDialog = () => {
  mainStore.setAIPPTDialogState(true)
}

const showRightTool = () => {
  mainStore.setRightToolVisible(!mainStore.rightToolVisible)
}
</script>

<style lang="scss" scoped>
.editor-header {
  background-color: #fff;
  user-select: none;
  border-bottom: 0.5px solid $borderColor;
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
}
.left,
.center,
.right {
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 10px;
}

.center-actions {
  display: flex;
  align-items: center;
}

.center-divider {
  width: 1px;
  height: 18px;
  background: #d9dde6;
  margin: 0 8px;
}

.center-tool-item {
  height: 30px;
  padding: 0 8px;
  margin: 0 2px;
  border-radius: $borderRadius;
  font-size: 13px;
  color: #404653;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;

  .pptfont {
    font-size: 16px;
  }

  &:hover {
    background-color: #f1f1f1;
  }
}

.center-demo-item {
  margin-left: 4px;
}

.left-handler {
  display: flex;
  align-items: center;
}
.icon-item {
  margin-right: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  .icon {
    margin-right: 3px;
  }
}
.handler-item {
  height: 30px;
  font-size: 20px;
  margin: 0 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: $borderRadius;
  overflow: hidden;
  cursor: pointer;

  &.disable {
    opacity: 0.5;
  }
}
.left-handler {
  .handler-item {
    padding: 0 8px;

    &.active,
    &:not(.disable):hover {
      background-color: #f1f1f1;
    }
  }
}
.menu-item {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  padding: 0 10px;
  border-radius: $borderRadius;
  cursor: pointer;

  .icon {
    font-size: 18px;
    color: #666;
  }
  .text {
    width: 18px;
    text-align: center;
    font-size: 17px;
  }
  .ai {
    background: linear-gradient(270deg, #d897fd, #33bcfc);
    background-clip: text;
    color: transparent;
    font-weight: 700;
  }

  &:hover {
    background-color: #f1f1f1;
  }
}
.popover-menu-item {
  display: flex;
  padding: 8px 10px;

  .icon {
    font-size: 18px;
    margin-right: 12px;
  }
}
.statement {
  font-size: 12px;
  color: #999;
  padding: 8px 10px;
  font-style: italic;
}
.main-menu {
  width: 300px;
}
.ai-menu {
  background: linear-gradient(270deg, #f8edff, #d4f1ff);
  color: $themeColor;
  border-radius: $borderRadius;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;

  .icon {
    font-size: 22px;
    margin-right: 16px;
  }
  .aippt-content {
    display: flex;
    flex-direction: column;
  }
  .aippt {
    font-weight: 700;
    font-size: 16px;

    span {
      background: linear-gradient(270deg, #d897fd, #33bcfc);
      background-clip: text;
      color: transparent;
    }
  }
  .aippt-subtitle {
    font-size: 12px;
    color: #777;
    margin-top: 5px;
  }
}

.import-section {
  padding: 5px 0;

  .import-label {
    font-size: 12px;
    color: #999;
    margin-bottom: 6px;
  }
  .import-grid {
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }
  .import-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    border-radius: $borderRadius;
    border: 1px solid $borderColor;
    transition: background-color 0.2s;
    cursor: pointer;

    &:hover {
      background-color: #f1f1f1;
    }
    .icon {
      font-size: 24px;
      margin-bottom: 2px;
    }
    .label {
      font-size: 12px;
      text-align: center;
    }
    .sub-label {
      font-size: 10px;
      color: #999;
    }
  }
}

.group-menu-item {
  height: 30px;
  display: flex;
  margin: 0 8px;
  padding: 0 2px;
  border-radius: $borderRadius;

  &:hover {
    background-color: #f1f1f1;
  }

  .menu-item {
    padding: 0 3px;
  }
  .arrow-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
  }
}
.title {
  height: 30px;
  margin-left: 2px;
  font-size: 13px;

  .title-input {
    width: 200px;
    height: 100%;
    padding-left: 0;
    padding-right: 0;

    ::v-deep(input) {
      height: 28px;
      line-height: 28px;
    }
  }
  .title-text {
    min-width: 20px;
    max-width: 400px;
    line-height: 30px;
    padding: 0 6px;
    border-radius: $borderRadius;
    cursor: pointer;

    @include ellipsis-oneline();

    &:hover {
      background-color: #f1f1f1;
    }
  }
}
.github-link {
  display: inline-block;
  height: 30px;
}

.mode-switch {
  height: 32px;
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(86px, 1fr));
  align-items: center;
  gap: 0;
  background: #f3f4f6;
  padding: 2px;
  border-radius: 8px;
  margin: 0 2px;
}

.mode-btn {

  min-width: 86px;
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  background: transparent;
  color: #2f3136;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.22s ease;
  position: relative;

  & + .mode-btn {
    margin-left: -1px;
  }

  &:hover {
    color: #1f2f6a;
  }

  &.cur {
    color: #2a68e8;
    z-index: 3;
  }
}

.mode-indicator {
  --tx: 0%;
  position: absolute;
  left: 2px;
  top: 2px;
  width: calc(50% - 4px);
  height: 28px;
  background: #f7faff;
  border: 1px solid #2a68e8;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(42, 104, 232, 0.08);
  transition: transform 260ms cubic-bezier(.2,.9,.3,1), background 180ms;
  transform: translateX(var(--tx));
  z-index: 1;
}

.mode-indicator.pos-advanced {
  --tx: 100%;
}

@keyframes indicator-shake {
  0% { transform: translateX(var(--tx)); }
  20% { transform: translateX(calc(var(--tx) - 8px)); }
  40% { transform: translateX(calc(var(--tx) + 8px)); }
  60% { transform: translateX(calc(var(--tx) - 5px)); }
  80% { transform: translateX(calc(var(--tx) + 5px)); }
  100% { transform: translateX(var(--tx)); }
}

.mode-indicator.shake {
  animation: indicator-shake 360ms cubic-bezier(.2,.9,.3,1);
}

.version-label {
  height: 32px;
  padding: 0 16px;
  background: #f0f4ff;
  border-radius: 6px;
  color: #2a68e8;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btnPublish {
  background: #fff;
  border: 1px solid #2a68e8;
  color: #2a68e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.16s ease;
  font-size: 14px;
  font-weight: 600;
  height: 32px;

  &:hover {
    background: #f0f4ff;
  }
}

/* Override: make header icons 16px and header text 12px */
.editor-header {
  .icon {
    font-size: 16px !important;
  }

  .pptfont {
    font-size: 16px !important;
  }

  .menu-item,
  .title-text,
  .xs,
  .import-label,
  .label,
  .sub-label {
    font-size: 12px !important;
  }
}


@media screen and (max-width: 1500px) {
  .header-txt {
    display: none;
  }
}
</style>
