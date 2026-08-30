<template>
  <div class="editor-header">
    <div class="left">
      <span class="pptfont ppt-nav-home "  style="margin-right: 10px;" />

      <Popover
        trigger="click"
        placement="bottom-start"
        v-model:value="mainMenuVisible"
        :contentStyle="{ padding: '0', border: '0', boxShadow: 'none', background: 'transparent' }"
      >
        <template #content>
          <div class="file-menu">
            <div class="file-menu-header">
              <div class="file-menu-title" :title="title">{{ title || '未命名演示文稿' }}</div>
              <div class="file-menu-meta">{{ canvasMetaText }}</div>
            </div>
            <Divider :margin="0" />
            <div class="file-menu-section">
              <button class="file-menu-item" @click="handleCreateDesign">创建设计</button>
              <button class="file-menu-item" @click="handleImportDesign">导入设计</button>
              <button class="file-menu-item" @click="importFileExpanded = !importFileExpanded">
                导入文件
              </button>
              <div v-if="importFileExpanded" class="file-import-sub">
                <FileInput
                  class="file-import-option"
                  accept="application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  @change="handleImportPPTX"
                >
                  导入 PPTX
                </FileInput>
                <FileInput class="file-import-option" accept=".json" @change="handleImportJSON">
                  导入 JSON
                </FileInput>
                <FileInput class="file-import-option" accept=".pptist" @change="handleImportPPTIST">
                  导入 PPTIST
                </FileInput>
              </div>
              <button class="file-menu-item" :disabled="menuActionLoading" @click="handleCreateVersion">
                创建新版本
              </button>
              <button class="file-menu-item" @click="handleViewVersions">查看版本记录</button>
              <button class="file-menu-item" :disabled="menuActionLoading" @click="handleCreateCopy">
                创建副本
              </button>
            </div>
            <Divider :margin="0" />
            <div class="file-menu-section">
              <button class="file-menu-item" :disabled="menuActionLoading" @click="handleSaveToMySpace">
                保存到我的空间
              </button>
              <button class="file-menu-item" :disabled="menuActionLoading" @click="handleSaveToTeamSpace">
                保存到团队空间
              </button>
            </div>
          </div>
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

    <Drawer :width="360" v-model:visible="versionDrawerVisible" placement="right">
      <div class="version-drawer">
        <div v-if="versionLoading" class="version-empty">加载中...</div>
        <div v-else-if="!versionList.length" class="version-empty">暂无版本记录</div>
        <button
          v-for="item in versionList"
          :key="item.id"
          class="version-item"
          @click="handleApplyVersion(item)"
        >
          <div class="version-item-name">{{ item.name }}</div>
          <div class="version-item-time">{{ item.updatedAt || item.createdAt || '' }}</div>
        </button>
      </div>
      <template v-slot:title>版本记录</template>
    </Drawer>

    <FullscreenSpin :loading="exporting || menuActionLoading" tip="正在处理..." />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { saveAs } from 'file-saver'
import { useMainStore, useSlidesStore, useSnapshotStore } from '@/store'
import useScreening from '@/hooks/useScreening'
import useImport from '@/hooks/useImport'
import type { DialogForExportTypes } from '@/types/export'
import FileInput from '@/components/FileInput.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import Drawer from '@/components/Drawer.vue'
import Input from '@/components/Input.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import Divider from '@/components/Divider.vue'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import type { EditorMode } from '@/store/main'
import {
  DownloadPPT,
  GetPPTDetail,
  GetSubstationCurrentTeam,
  GetSubstationMyWorkList,
  PPTAction,
  PublishSubstationWork,
  ResolvePPTContent,
  cachePptInfoId,
  getCachedPptInfoId,
  resolvePptInfoIdValue,
} from '@/api/editor'
import message from '@/utils/message'
import { normalizeSlidesImageToOss, uploadFirstSlideCoverToOss, uploadJsonToOss } from '@/utils/assetUpload'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const route = useRoute()
const router = useRouter()
const { pptId, pptInfoId, title, slides, theme, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { enterScreening, enterScreeningFromStart } = useScreening()
const { importSpecificFile, importPPTXFile, importJSON, exporting } = useImport()

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

const mainMenuVisible = ref(false)
const importFileExpanded = ref(false)
const versionDrawerVisible = ref(false)
const versionLoading = ref(false)
const versionList = ref<any[]>([])
const menuActionLoading = ref(false)

const closeMainMenu = () => {
  mainMenuVisible.value = false
  importFileExpanded.value = false
}

const handleImportPPTX = (files: FileList | File[]) => {
  importPPTXFile(files)
  closeMainMenu()
}

const handleImportJSON = (files: FileList | File[]) => {
  importJSON(files)
  closeMainMenu()
}

const handleImportPPTIST = (files: FileList | File[]) => {
  importSpecificFile(files)
  closeMainMenu()
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

const canvasWidth = computed(() => Math.round(viewportSize.value))
const canvasHeight = computed(() => Math.round(viewportSize.value * viewportRatio.value))

const canvasMetaText = computed(() => {
  const ratio = viewportRatio.value
  let orientation = '横版'
  if (ratio > 1.05) orientation = '竖版'
  else if (ratio >= 0.95 && ratio <= 1.05) orientation = '方形'
  return `${orientation}演示文稿 ${canvasWidth.value}px × ${canvasHeight.value}px`
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

const buildSavePayload = (options: { json: string; contentJsonUrl?: string; cover?: string; spaceUid?: string }) => {
  const productId = savedProductId.value
  const id = resolvePptVOId()
  const width = viewportSize.value
  const height = viewportSize.value * viewportRatio.value

  const payload: any = {
    productId: productId || '',
    name: title.value || '未命名演示文稿',
    pptVO: {
      id: id || '',
      name: title.value || '未命名演示文稿',
      cover: options.cover || '',
      json: options.json,
      ...(options.contentJsonUrl ? { contentJsonUrl: options.contentJsonUrl } : {}),
      width,
      height,
    },
  }
  if (options.spaceUid) payload.spaceUid = options.spaceUid
  return payload
}

const savePPT = async (options?: { silent?: boolean; spaceUid?: string; forceNew?: boolean }): Promise<boolean> => {
  if (publishing.value) return false

  publishing.value = true
  let success = false
  const prevProductId = savedProductId.value

  if (options?.forceNew) savedProductId.value = null

  try {
    const width = viewportSize.value
    const height = viewportSize.value * viewportRatio.value

    await nextTick()
    const coverUrl = await uploadFirstSlideCoverToOss(slides.value[0])

    const normalized = await normalizeSlidesImageToOss(slides.value)
    const normalizedSlides = normalized.slides

    const jsonData = {
      title: title.value || '未命名演示文稿',
      width,
      height,
      theme: theme.value,
      slides: normalizedSlides,
    }

    const fullJson = JSON.stringify(jsonData)
    let contentJsonUrl = ''
    let payloadJson = fullJson

    try {
      contentJsonUrl = await uploadJsonToOss(fullJson)
      payloadJson = '{}'
    }
    catch {
      contentJsonUrl = ''
      payloadJson = fullJson
    }

    syncSavedProductId()
    const payload = buildSavePayload({
      json: payloadJson,
      contentJsonUrl,
      cover: coverUrl,
      spaceUid: options?.spaceUid,
    })
    let response = await PPTAction(payload)
    let res = response as unknown as { code?: number; msg?: string; data?: any }

    if (!(res.code === 0 && res.data != null) && contentJsonUrl) {
      const fallbackPayload = buildSavePayload({
        json: fullJson,
        cover: coverUrl,
        spaceUid: options?.spaceUid,
      })
      response = await PPTAction(fallbackPayload)
      res = response as unknown as { code?: number; msg?: string; data?: any }
    }

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
    if (options?.forceNew) savedProductId.value = prevProductId
  }
  finally {
    publishing.value = false
  }

  return success
}

const handleCreateDesign = () => {
  closeMainMenu()
  router.push({ path: '/home' })
}

const handleImportDesign = () => {
  closeMainMenu()
  mainStore.setEditorMode('advanced')
  mainStore.setAIPPTDialogState(true)
}

const handleCreateVersion = () => {
  closeMainMenu()
  menuActionLoading.value = true
  savePPT().finally(() => {
    menuActionLoading.value = false
  })
}

const fetchVersionList = () => {
  versionLoading.value = true
  const currentProductId = savedProductId.value
  GetSubstationMyWorkList({
    pageNo: 1,
    pageSize: 100,
  }).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      versionList.value = list.filter((item: any) => {
        if (!currentProductId) return true
        return Number(item.id) === Number(currentProductId)
          || Number(item.sourceMaterialId) === Number(currentProductId)
      })
    } else {
      versionList.value = []
    }
  }).finally(() => {
    versionLoading.value = false
  })
}

const handleViewVersions = () => {
  closeMainMenu()
  versionDrawerVisible.value = true
  fetchVersionList()
}

const handleApplyVersion = (item: any) => {
  if (!item?.url) {
    message.error('版本数据无效')
    return
  }
  versionLoading.value = true
  ResolvePPTContent({ contentJsonUrl: item.url }).then((content: any) => {
    if (!content?.slides?.length) {
      message.error('版本内容为空')
      return
    }
    slidesStore.setSlides(content.slides, content.theme || {})
    if (content.title) slidesStore.setTitle(content.title)
    if (content.width) slidesStore.setViewportSize(content.width)
    if (content.width && content.height) {
      slidesStore.setViewportRatio(content.height / content.width)
    }
    slidesStore.updateSlideIndex(0)
    if (item.id) savedProductId.value = Number(item.id)
    if (item.name) slidesStore.setTitle(item.name)
    versionDrawerVisible.value = false
    message.success('已应用该版本')
  }).finally(() => {
    versionLoading.value = false
  })
}

const handleCreateCopy = () => {
  closeMainMenu()
  const copyTitle = `${title.value || '未命名演示文稿'} 副本`
  slidesStore.setTitle(copyTitle)
  menuActionLoading.value = true
  savePPT({ forceNew: true }).finally(() => {
    menuActionLoading.value = false
  })
}

const handleSaveToMySpace = () => {
  closeMainMenu()
  menuActionLoading.value = true
  savePPT().finally(() => {
    menuActionLoading.value = false
  })
}

const handleSaveToTeamSpace = () => {
  closeMainMenu()
  menuActionLoading.value = true
  GetSubstationCurrentTeam().then((res: any) => {
    if (res.code === 0 && res.data?.uid) {
      return savePPT({ spaceUid: res.data.uid })
    }
    message.error('暂无团队空间，请前往主站加入或创建团队')
    return false
  }).finally(() => {
    menuActionLoading.value = false
  })
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
.file-menu {
  width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.file-menu-header {
  padding: 16px 20px 14px;
}

.file-menu-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.5;
  word-break: break-all;
}

.file-menu-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.file-menu-section {
  padding: 8px 0;
}

.file-menu-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 10px 20px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.file-import-sub {
  padding: 0 12px 6px 28px;
}

.file-import-option {
  display: block;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: #f3f4f6;
  }
}

.version-drawer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-empty {
  padding: 24px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.version-item {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: #c7d2fe;
    background: #f8faff;
  }
}

.version-item-name {
  font-size: 13px;
  color: #111827;
  font-weight: 600;
}

.version-item-time {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
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
