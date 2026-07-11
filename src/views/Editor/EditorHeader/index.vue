<template>
  <div class="editor-header">
    <div class="left">
      <span class="pptfont ppt-nav-home "  style="margin-right: 10px;" />

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
                <!-- <span class="sub-label">（仅供测试）</span> -->
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
                <!-- <span class="sub-label">（仅供测试）</span> -->
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
                <!-- <span class="sub-label">（专属格式）</span> -->
              </FileInput>
            </div>
          </div>
          <Divider :margin="10" />
          <!-- <PopoverMenuItem class="popover-menu-item" @click="setDialogForExport('pptx')"
            ><IconDownload class="icon" /> 导出文件</PopoverMenuItem
          > -->
          <!-- <Divider :margin="10" /> -->
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
          <!-- <PopoverMenuItem
            class="popover-menu-item"
            @click="goLink('https://github.com/pipipi-pikachu/PPTist/issues')"
            ><IconComment class="icon" /> 意见反馈</PopoverMenuItem
          > -->
          <!-- <PopoverMenuItem
            class="popover-menu-item"
            @click="
              goLink('https://github.com/pipipi-pikachu/PPTist/blob/master/doc/Q&A.md')
            "
            ><IconHelpcenter class="icon" /> 常见问题</PopoverMenuItem
          > -->
          <!-- <Divider :margin="10" />
          <div class="statement">注：略</div> -->
        </template>
        <div class="menu-item">
          文件<span class="icon-item pptfont ppt-design-down ml-5" />
        </div>
      </Popover>
      <span class="handler-item pptfont ppt-fengexian gray-200 divider-45" />
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
      <!-- 自动保存 -->
     <div class="flex" >
       <span class="icon-item pptfont ppt-design-cloud ml-5" />
      <span class="xs gray-400 ml-5" v-if="saveTimeText">{{ saveTimeText }}</span>
     </div>
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
          <span class="header-txt">图层</span>
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
        <!-- <div
          class="flex flex-center pl-12 pr-12 btnBlue"
          @click="handleDownloadPPT()"
        >
          <span class="pptfont ppt-create-download xs mr-4" />下载
        </div> -->

        <div
          class="flex flex-center pl-12 pr-12 btnBlue"
          @click="setDialogForExport('pptx')"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
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
import type { EditorMode } from '@/store/main'
import { DownloadPPT, GetPPTDetail, PPTAction, PublishSubstationWork, cachePptInfoId, getCachedPptInfoId, resolvePptInfoIdValue } from '@/api/editor'
import message from '@/utils/message'
import { normalizeSlidesImageToOss } from '@/utils/assetUpload'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const route = useRoute()
const { pptId, pptInfoId, title, slides, theme, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { enterScreening, enterScreeningFromStart } = useScreening()
const { importSpecificFile, importPPTXFile, importJSON, exporting } = useImport()
const { resetSlides } = useSlideHandler()

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
const lastSavedAt = ref<Date | null>(null)
const AUTO_SAVE_DELAY = 10 * 1000
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

const formatSaveTime = (time: Date) => {
  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const saveTimeText = computed(() => {
  if (!lastSavedAt.value) return ''
  return `保存于 ${formatSaveTime(lastSavedAt.value)}`
})

const clearAutoSaveTimer = () => {
  if (!autoSaveTimer) return
  clearTimeout(autoSaveTimer)
  autoSaveTimer = null
}

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
const savedProductId = ref<any>(null)

const syncSavedProductId = () => {
  const id = Number(pptId.value)
  if (!Number.isFinite(id) || id <= 0) {
    savedProductId.value = null
    return
  }
  const sourceType = String(route.query.sourceType || '')
  if (sourceType === 'TASK') {
    const taskId = Number(route.query.taskId || route.query.id)
    if (Number.isFinite(taskId) && taskId > 0 && id === taskId) {
      if (!savedProductId.value) savedProductId.value = null
      return
    }
  }
  savedProductId.value = id
}

const getCoverUrlFromSlides = (slideList: typeof slides.value) => {
  const firstSlide = slideList[0]
  if (!firstSlide) return ''

  if (firstSlide.background?.type === 'image' && firstSlide.background.image?.src) {
    return firstSlide.background.image.src
  }

  const firstImage = firstSlide.elements.find(item => item.type === 'image')
  return firstImage?.type === 'image' ? firstImage.src : ''
}

const parseRoutePptInfoId = () => {
  const raw = route.query.pptInfoId
  const val = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(val) && val > 0 ? val : null
}

const resolvePptInfoId = () => {
  const fromStore = Number.isFinite(pptInfoId.value) && Number(pptInfoId.value) > 0 ? Number(pptInfoId.value) : null
  const fromRoute = parseRoutePptInfoId()
  const fromSession = getCachedPptInfoId(pptId.value)
  const resolved = resolvePptInfoIdValue(fromStore, fromRoute, fromSession)
  if (resolved && resolved !== fromStore) {
    slidesStore.setPptInfoId(resolved)
  }
  return resolved
}

const ensurePptInfoId = async () => {
  const existing = resolvePptInfoId()
  if (existing) return existing

  const sourceType = String(route.query.sourceType || '')
  if (sourceType === 'TASK') return resolvePptInfoId()

  const templateId = Number.isFinite(pptId.value) && Number(pptId.value) > 0 ? Number(pptId.value) : null
  if (!templateId) return null

  const requestPptInfoId = resolvePptInfoIdValue(parseRoutePptInfoId(), getCachedPptInfoId(templateId))

  try {
    const res = await GetPPTDetail({
      id: templateId,
      pptInfoId: requestPptInfoId,
    }) as {
      code?: number
      data?: { pptInfoId?: number }
    }
    if (res.code === 0 && Number.isFinite(res.data?.pptInfoId) && Number(res.data!.pptInfoId) > 0) {
      const infoId = Number(res.data!.pptInfoId)
      slidesStore.setPptInfoId(infoId)
      cachePptInfoId(templateId, infoId)
      return infoId
    }
  }
  catch {
    // ignore
  }
  return resolvePptInfoId()
}

onMounted(() => {
  void ensurePptInfoId()
  syncSavedProductId()
})

watch(
  [pptId, () => route.query.sourceType, () => route.query.taskId, () => route.query.id],
  (newVal, oldVal) => {
    const newKey = `${newVal[1]}-${newVal[2]}-${newVal[3]}`
    const oldKey = oldVal ? `${oldVal[1]}-${oldVal[2]}-${oldVal[3]}` : ''
    if (newKey !== oldKey) savedProductId.value = null
    syncSavedProductId()
  }
)

const resolvePptVOId = () => {
  const sourceType = String(route.query.sourceType || '')
  if (sourceType === 'TASK') {
    const taskId = Number(route.query.taskId || route.query.id)
    if (Number.isFinite(taskId) && taskId > 0) return taskId
  }
  const id = Number(pptId.value)
  return Number.isFinite(id) && id > 0 ? id : null
}

const buildSavePayload = (options: { json: string; cover?: string }) => {
  const productId = savedProductId.value
  const id = resolvePptVOId()
  const width = viewportSize.value
  const height = viewportSize.value * viewportRatio.value

  return {
    productId: productId || "",
    name: title.value || '未命名演示文稿',
    pptVO: {
      id: id|| "",
      name: title.value || '未命名演示文稿',
      cover: options.cover || '',
      json: options.json,
      width,
      height,
    },
  }
}

const savePPT = async (options?: { silent?: boolean }): Promise<boolean> => {
  if (publishing.value) return false

  publishing.value = true
  let success = false

  try {
    const width = viewportSize.value
    const height = viewportSize.value * viewportRatio.value

    const normalized = await normalizeSlidesImageToOss(slides.value)
    const normalizedSlides = normalized.slides
    if (normalized.converted > 0) {
      slidesStore.setSlides(normalizedSlides)
    }

    const jsonData = {
      title: title.value || '未命名演示文稿',
      width,
      height,
      theme: theme.value,
      slides: normalizedSlides,
    }

    const fullJson = JSON.stringify(jsonData)
    syncSavedProductId()
    const payload = buildSavePayload({
      json: fullJson,
      cover: getCoverUrlFromSlides(normalizedSlides),
    })
    const response = await PPTAction(payload)
    const res = response as unknown as { code?: number; msg?: string; data?: any }

    if (res.code === 0 && res.data != null) {
      success = true
      lastSavedAt.value = new Date()
      const newProductId = Number(res.data)
      if (Number.isFinite(newProductId) && newProductId > 0) {
        savedProductId.value = newProductId
      }

      if (normalized.failed > 0 && !options?.silent) {
        message.warning(`有 ${normalized.failed} 个图片未上传成功，已保留原始内容`)
      }

      if (!options?.silent) message.success('保存成功')
    }
    else if (!options?.silent) {
      message.error(res.msg || '保存失败')
    }
  }
  catch {
    if (!options?.silent) message.error('保存失败')
  }
  finally {
    publishing.value = false
  }

  return success
}

const publishWork = () => {
  const materialId = savedProductId.value
  if (!materialId) {
    message.error('请先保存作品后再发布')
    return
  }

  publishing.value = true
  PublishSubstationWork({ materialId })
    .then((res: any) => {
      if (res.code === 0) {
        message.success('发布成功')
      } else {
        message.error(res.msg || '发布失败')
      }
    })
    .finally(() => {
      publishing.value = false
    })
}

const publishTemplate = async (type: 0 | 1) => {
  if (type === 0) {
    await savePPT()
    return
  }

  const saved = await savePPT()
  if (saved) publishWork()
}

const scheduleAutoSave = () => {
  clearAutoSaveTimer()
  autoSaveTimer = setTimeout(() => {
    void savePPT({ silent: true })
  }, AUTO_SAVE_DELAY)
}

watch(
  [title, slides, theme, viewportSize, viewportRatio],
  () => {
    scheduleAutoSave()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  clearAutoSaveTimer()
})

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
  background-color: #F8F9FB;
  user-select: none;
  // border-bottom: 0.5px solid $borderColor;
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
.left{
  padding-left: 16px;
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
    font-size: 20px;
  }

  &:hover {
    background-color: #f1f1f1;
  }
}
.ppt-nav-home{
  font-size: 22px !important;
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
.ppt-design-cloud{
 font-size: 16px !important;
}
.handler-item {
  height: 30px;
  font-size: 17px;
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
.divider-45{
  transform: rotate(20deg)
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
  font-size: 13px;
  padding: 0px;
  border-radius: $borderRadius;
  cursor: pointer;
  .pptfont{
      font-size: 18px !important;
      margin-right: 5px;
  }
  .icon {
    font-size: 18px;
    color: #666;
  }
  .text {
    width: 18px;
    text-align: center;
    font-size: 30px;
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
  max-width: 250px;

  .title-input {
    width: 200px;
    height: 100%;
    padding-left: 2px;
    padding-right:  2px;

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
  grid-template-columns: repeat(2, minmax(70px, 1fr));
  align-items: center;
  gap: 0;
  background:#EBEFFF;
  padding: 2px;
  border-radius: 8px;
  margin: 0 2px;
  box-shadow: -2px 0px 9px rgba(0, 0, 0, 0.06);
}

.mode-btn {

  min-width: 70px;
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  background: transparent;
  color: #000;
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
    color: #000;
    border: none;
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
  background: #fff;
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



  .menu-item,
  .title-text,
  .xs,
  .import-label,
  .label,
  .sub-label {
    font-size: 13px !important;
  }
}


@media screen and (max-width: 1300px) {
  .header-txt {
    display: none;
  }
}
</style>
