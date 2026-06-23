<template>
  <div class="adv-ai">
    <div class="section-heading">创建新的内容</div>

    <div class="ai-grid">
      <button
        v-for="tool in visibleTools"
        :key="tool.key"
        class="ai-card"
        :title="tool.label"
        @click="handleToolClick(tool)"
      >
        <div class="ai-card-img">
          <img :src="tool.cover" :alt="tool.label" loading="lazy" />
        </div>
        <div class="ai-card-label">{{ tool.label }}</div>
      </button>
    </div>

    <div v-if="!visibleTools.length" class="ai-empty">
      <img src="@/assets/images/nodeta.png" class="ai-empty-img" alt="" />
      <span>暂无相关内容</span>
    </div>

    <!-- 加工 可拖动浮窗 -->
    <Teleport to="body">
      <div v-if="refineModalVisible" class="rp-float" :style="floatStyle">
      <div class="rp">
        <!-- 头部 Tab（拖动区） -->
        <div class="rp-header" @mousedown="onDragStart">
          <div class="rp-tabs">
            <span :class="['rp-tab', activeView === 'config' ? 'rp-tab--active' : '']" @mousedown.stop @click="activeView = 'config'">AI 文案</span>
            <span :class="['rp-tab', activeView === 'result' ? 'rp-tab--active' : '']" @mousedown.stop>生成结果</span>
          </div>
          <button class="rp-close" @mousedown.stop @click="closePanel">✕</button>
        </div>

        <!-- 配置区 -->
        <template v-if="activeView === 'config'">
          <div class="rp-body">
            <!-- 操作类型 + 二级选项 同行 -->
            <div class="rp-row">
              <el-select
                v-model="pendingOperation"
                class="rp-select rp-select--op"
                size="small"
                :teleported="false"
                @change="onOperationChange"
              >
                <el-option value="EXPAND" label="AI 扩写" />
                <el-option value="POLISH" label="AI 润色" />
                <el-option value="TRANSLATE" label="AI 翻译" />
              </el-select>
              <el-select
                v-if="pendingOperation === 'TRANSLATE'"
                v-model="targetLang"
                class="rp-select rp-select--sub"
                size="small"
                placeholder="目标语言"
                :teleported="false"
              >
                <el-option label="英文" value="en" />
                <el-option label="日语" value="ja" />
                <el-option label="韩语" value="ko" />
                <el-option label="粤语" value="yue" />
                <el-option label="中文（繁体）" value="zh-tw" />
                <el-option label="中文（简体）" value="zh-cn" />
              </el-select>
              <el-select
                v-if="pendingOperation === 'POLISH'"
                v-model="styleHint"
                class="rp-select rp-select--sub"
                size="small"
                placeholder="风格"
                :teleported="false"
              >
                <el-option label="口语化" value="口语化" />
                <el-option label="官方口吻" value="官方口吻" />
                <el-option label="友好的" value="友好的" />
                <el-option label="专业的" value="专业的" />
                <el-option label="直接的" value="直接的" />
                <el-option label="自信的" value="自信的" />
              </el-select>
            </div>

            <!-- 文本区 -->
            <div class="rp-text-block">
              <div class="rp-text-block-header">
                <span class="rp-text-label">文本</span>
              </div>
              <textarea
                v-model="customText"
                class="rp-text-content"
                :placeholder="selectedElementHint"
                rows="3"
                @focus="mainStore.setDisableHotkeysState(true)"
                @blur="mainStore.setDisableHotkeysState(false)"
                @keydown.enter.stop
                @keydown.delete.stop
                @keydown.backspace.stop
              />
            </div>
          </div>

          <!-- 底部 -->
          <div class="rp-footer">
            <div class="rp-footer-meta">
              <span class="rp-credit-dot"></span>
              <span class="rp-credit-text">免责声明 &amp; 举报</span>
            </div>
            <button class="rp-start-btn" :disabled="submitLoading" @click="submitRefineTask">
              <template v-if="submitLoading">
                <span class="rp-btn-spin"></span>生成中...
              </template>
              <template v-else>开始生成</template>
            </button>
          </div>
        </template>

        <!-- 结果区 -->
        <template v-if="activeView === 'result'">
          <div class="rp-result-wrap">
            <!-- 原文卡片 -->
            <div class="rp-src-card">
              <div class="rp-src-text">{{ customText || pptTitle }}</div>
              <div class="rp-src-actions">
                <button class="rp-src-btn" title="复制" @click="copySource">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                <button class="rp-src-btn" title="删除" @click="resubmit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>

            <!-- 结果内容区 -->
            <div class="rp-result-body">
              <div v-if="pageLoading" class="rp-result-loading">
                <div class="rp-spin"></div>
                <span class="rp-spin-text">{{ loadingText }}</span>
              </div>
              <div v-else-if="resultDone" class="rp-result-text">{{ resultSummary }}</div>
              <div v-else-if="resultError" class="rp-result-error">{{ resultError }}</div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="rp-result-footer">
            <div class="rp-credit-row">
              <span class="rp-credit-dot"></span>
              <span class="rp-credit-num">共 30 豆</span>
              <span class="rp-credit-split"></span>
              <span class="rp-credit-link">免责声明 &amp; 举报</span>
            </div>
            <div class="rp-btn-row">
              <button class="rp-btn-regen" :disabled="submitLoading || pageLoading" @click="resubmit">
                重新生成 <span class="rp-btn-cost">（1🪨）</span>
              </button>
              <button class="rp-btn-apply" :disabled="!resultDone" @click="closePanel">
                替换文案
              </button>
              <button class="rp-btn-more" title="更多">⋯</button>
            </div>
            <div class="rp-ai-label">内容由 AI 生成</div>
          </div>
        </template>
      </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import aiBg1 from '@/assets/images/ai-bg-1.png'
import aiBg2 from '@/assets/images/ai-bg-2.png'
import aiBg3 from '@/assets/images/ai-bg-3.png'
import aiBg4 from '@/assets/images/ai-bg-4.png'
import aiBg5 from '@/assets/images/ai-bg-5.png'
import aiBg6 from '@/assets/images/ai-bg-6.png'
import aiBg7 from '@/assets/images/ai-bg-7.png'
import aiBg8 from '@/assets/images/ai-bg-8.png'
import { RefinePPT, GetRefineTask, ResolvePPTContent } from '@/api/editor'
import { useMainStore, useSlidesStore } from '@/store'
import { htmlToText } from '@/utils/common'
import message from '@/utils/message'

const props = defineProps<{ searchKeyword?: string }>()
const emit = defineEmits<{ (e: 'openAI'): void }>()

const route = useRoute()
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { pptId, title } = storeToRefs(slidesStore)
const { handleElement } = storeToRefs(mainStore)

const pptTitle = computed(() => title.value || '（未命名演示文稿）')

// 当前选中元素的纯文本
const selectedElementText = computed(() => {
  const el = handleElement.value as any
  if (!el) return ''
  if (el.type === 'text' && el.content) return htmlToText(el.content).trim()
  if (el.type === 'shape' && el.text?.content) return htmlToText(el.text.content).trim()
  return ''
})

const selectedElementHint = computed(() =>
  selectedElementText.value || pptTitle.value
)

// 用户自定义/编辑的文本，选中元素变化时自动同步
const customText = ref('')

watch(handleElement, () => {
  if (selectedElementText.value) customText.value = selectedElementText.value
}, { immediate: true })

const fillFromSelection = () => {
  customText.value = selectedElementText.value || pptTitle.value
}

// ========== 拖拽逻辑 ==========
const floatX = ref(Math.max(0, (window.innerWidth - 380) / 2))
const floatY = ref(Math.max(0, (window.innerHeight - 520) / 2))
const isDragging = ref(false)
let dragOffsetX = 0
let dragOffsetY = 0

const floatStyle = computed(() => ({
  left: floatX.value + 'px',
  top: floatY.value + 'px',
}))

const onDragStart = (e: MouseEvent) => {
  isDragging.value = true
  dragOffsetX = e.clientX - floatX.value
  dragOffsetY = e.clientY - floatY.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

const onDragMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  floatX.value = Math.min(Math.max(0, e.clientX - dragOffsetX), window.innerWidth - 380)
  floatY.value = Math.min(Math.max(0, e.clientY - dragOffsetY), window.innerHeight - 100)
}

const onDragEnd = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

const refineOperationMap: any = {
  'ai-expand': 'EXPAND',
  'ai-polish': 'POLISH',
  'ai-translate': 'TRANSLATE',
}

const tools: any[] = [
  { key: 'ai-bg', label: 'AI 背景', cover: aiBg1 },
  { key: 'ai-draw', label: 'AI 绘图', cover: aiBg2 },
  { key: 'ai-material', label: 'AI 素材', cover: aiBg3 },
  { key: 'ai-expand', label: 'AI 扩写', cover: aiBg4 },
  { key: 'ai-copy', label: 'AI 文案', cover: aiBg5 },
  { key: 'ai-summarize', label: 'AI 缩写', cover: aiBg6 },
  { key: 'ai-translate', label: 'AI 翻译', cover: aiBg7 },
  { key: 'ai-polish', label: 'AI 润色', cover: aiBg8 },
]

const refineModalVisible = ref(false)
const activeView = ref<'config' | 'result'>('config')
const pendingOperation = ref('EXPAND')
const styleHint = ref('口语化')
const targetLang = ref('en')
const pageLoading = ref(false)
const submitLoading = ref(false)
const loadingText = ref('正在加工中，请稍候...')
const resultDone = ref(false)
const resultError = ref('')
const resultSummary = ref('')

const opLabelMap: any = { EXPAND: '扩写', POLISH: '润色', TRANSLATE: '翻译' }

const copySource = () => {
  const text = customText.value || pptTitle.value
  navigator.clipboard?.writeText(text).then(() => message.success('已复制'))
}

const REFINE_POLL_INTERVAL = 3000
const REFINE_POLL_MAX = 200

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}

const visibleTools = computed(() =>
  tools.filter(tool => matchesSearch(tool.label, tool.key))
)

const getQueryVal = (key: string): any => {
  const val = route.query[key]
  return Array.isArray(val) ? val[0] : val
}

const resolveRefineSource = (): any => {
  const sourceType = getQueryVal('sourceType')
  const idFromRoute = Number(getQueryVal('id'))
  const idFromStore = pptId.value
  const fallbackId = (idFromStore && idFromStore > 0) ? idFromStore : idFromRoute

  if (sourceType === 'TASK') {
    const taskId = Number(getQueryVal('taskId') || fallbackId)
    if (Number.isFinite(taskId) && taskId > 0) return { sourceType: 'TASK', sourceId: taskId }
  }
  if (sourceType === 'TEMPLATE') {
    const templateId = Number(getQueryVal('templateId') || fallbackId)
    if (Number.isFinite(templateId) && templateId > 0) return { sourceType: 'TEMPLATE', sourceId: templateId }
  }
  if (Number.isFinite(fallbackId) && (fallbackId as number) > 0) {
    return { sourceType: 'TASK', sourceId: fallbackId }
  }
  return null
}

const parseRefineTaskId = (data: any): any => {
  if (data == null) return null
  if (typeof data === 'object') return data.id ?? data.taskId ?? null
  return data
}

const applyRefineResult = (task: any) => {
  if (!task.resultContentUrl) {
    resultError.value = '加工结果地址为空'
    return
  }
  loadingText.value = '正在加载加工结果...'
  return ResolvePPTContent({ contentJsonUrl: task.resultContentUrl }).then((content: any) => {
    if (!content || !Array.isArray(content.slides) || !content.slides.length) {
      resultError.value = '加工结果为空，请重新生成'
      return
    }
    slidesStore.setSlides(content.slides, content.theme || {})
    slidesStore.updateSlideIndex(0)
    if (content.title) slidesStore.setTitle(content.title)
    const width = Number(content.width)
    const height = Number(content.height)
    if (Number.isFinite(width) && width > 0) {
      slidesStore.setViewportSize(width)
      if (Number.isFinite(height) && height > 0) slidesStore.setViewportRatio(height / width)
    }
    resultDone.value = true
    const opLabel = opLabelMap[pendingOperation.value] || '加工'
    resultSummary.value = `AI ${opLabel}完成！共 ${content.slides?.length ?? 0} 页已更新，结果已自动应用到当前 PPT。`
    message.success('加工完成')
  })
}

const pollRefineTask = (refineTaskId: any, retries = 0): Promise<any> => {
  loadingText.value = `正在加工中，请稍候...（${retries + 1}）`
  return GetRefineTask(refineTaskId).then((pollRes: any) => {
    if (pollRes.code !== 0) {
      resultError.value = pollRes.msg || '获取加工任务失败'
      return
    }
    const task = pollRes.data || {}
    const status = Number(task.status)
    if (status === 1) return applyRefineResult(task)
    if (status === 2) {
      resultError.value = task.errorMessage || 'PPT加工失败'
      return
    }
    if (retries >= REFINE_POLL_MAX) {
      resultError.value = '加工超时，请重新生成'
      return
    }
    return new Promise((resolve: any) => {
      setTimeout(resolve, REFINE_POLL_INTERVAL)
    }).then(() => pollRefineTask(refineTaskId, retries + 1))
  })
}

const doSubmit = () => {
  if (pendingOperation.value === 'TRANSLATE' && !targetLang.value) {
    message.error('请选择目标语言')
    return
  }
  const source = resolveRefineSource()
  if (!source) {
    message.error('缺少 PPT 来源，请确认已生成或打开过 PPT')
    return
  }

  const data: any = {
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    operation: pendingOperation.value,
  }
  if (pendingOperation.value === 'TRANSLATE') data.targetLang = targetLang.value
  if ((pendingOperation.value === 'POLISH' || pendingOperation.value === 'EXPAND') && styleHint.value) {
    data.styleHint = styleHint.value
  }

  activeView.value = 'result'
  pageLoading.value = true
  submitLoading.value = true
  resultDone.value = false
  resultError.value = ''
  loadingText.value = '正在提交加工任务...'

  // 步骤2：POST /ai/ppt/refine 提交 → 拿 refineTaskId
  RefinePPT(data).then((res: any) => {
    if (res.code !== 0) {
      resultError.value = res.msg || '提交加工任务失败'
      return
    }
    const refineTaskId = parseRefineTaskId(res.data)
    if (!refineTaskId) {
      resultError.value = '未返回加工任务ID'
      return
    }
    // 步骤3：每 3 秒轮询 status 0→1
    return pollRefineTask(refineTaskId)
  }).finally(() => {
    pageLoading.value = false
    submitLoading.value = false
  })
}

const submitRefineTask = () => doSubmit()

const resubmit = () => {
  resultDone.value = false
  resultError.value = ''
  resultSummary.value = ''
  activeView.value = 'config'
}

const closePanel = () => {
  refineModalVisible.value = false
  pageLoading.value = false
  submitLoading.value = false
}

const onOperationChange = () => {
  styleHint.value = pendingOperation.value === 'POLISH' ? '口语化' : ''
  targetLang.value = pendingOperation.value === 'TRANSLATE' ? 'en' : ''
}

const handleToolClick = (tool: any) => {
  const operation = refineOperationMap[tool.key]
  if (operation) {
    pendingOperation.value = operation
    activeView.value = 'config'
    resultDone.value = false
    resultError.value = ''
    resultSummary.value = ''
    onOperationChange()
    customText.value = selectedElementText.value || ''
    // 首次打开时居中
    if (!refineModalVisible.value) {
      floatX.value = Math.max(0, (window.innerWidth - 380) / 2)
      floatY.value = Math.max(0, (window.innerHeight - 520) / 2)
    }
    refineModalVisible.value = true
    return
  }
  emit('openAI')
}
</script>

<style lang="scss" scoped>
.adv-ai {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-heading {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  padding: 4px 0;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ai-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 1.5px solid $borderColor;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: $themeColor;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
}

.ai-card-img {
  width: 100%;
  aspect-ratio: 1;
  background: #f0f4f8;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.ai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 220px;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
}

.ai-empty-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 8px;
}

.ai-card-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  padding: 0 8px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ========== 可拖动浮窗 ========== */
.rp-float {
  position: fixed;
  z-index: 9999;
  width: 360px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: visible;
  user-select: none;
}

/* ========== 加工面板 ========== */
.rp {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  background: #fff;
  border-radius: 12px;
  overflow: visible;
}

.rp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  cursor: grab;
  border-radius: 12px 12px 0 0;

  &:active { cursor: grabbing; }
}

.rp-tabs {
  display: flex;
  gap: 20px;
}

.rp-tab {
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;

  &--active {
    color: #111827;
    font-weight: 600;
    border-bottom-color: $themeColor;
  }
}

.rp-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: #374151;
    background: #f3f4f6;
  }
}

.rp-body {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: visible;

  &--result {
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
}

.rp-row {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow: visible;
  position: relative;
  z-index: 10;
}

.rp-select {
  &--op {
    flex: 0 0 auto;
    width: 120px;
  }

  &--sub {
    flex: 1;
    min-width: 0;
  }
}

.rp-text-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* rp-text-block-header 已合并到 rp-text-content 上方 */

.rp-text-label {
  font-size: 13px;
  color: #6b7280;
}

.rp-text-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.rp-text-add {
  font-size: 12px;
  color: $themeColor;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover { opacity: 0.8; }
}

.rp-text-content {
  width: 100%;
  box-sizing: border-box;
  min-height: 72px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  line-height: 1.6;
  word-break: break-all;
  resize: vertical;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    border-color: $themeColor;
    background: #fff;
  }

  &::placeholder { color: #9ca3af; }
}

.rp-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.rp-footer-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rp-credit-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $themeColor;
  flex-shrink: 0;
}

.rp-credit-text {
  font-size: 12px;
  color: #9ca3af;
}

.rp-start-btn {
  width: 100%;
  height: 40px;
  background: $themeColor;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.88;
  }
}

.rp-btn-spin {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: rp-spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* 结果区整体布局 */
.rp-result-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
}

/* 原文卡片 */
.rp-src-card {
  margin: 14px 16px 0;
  padding: 12px 12px 10px;
  border: 2px solid $themeColor;
  border-radius: 10px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.rp-src-text {
  font-size: 13px;
  color: #111827;
  line-height: 1.6;
  word-break: break-all;
}

.rp-src-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.rp-src-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: #374151;
    background: #f3f4f6;
  }
}

/* 结果内容区 */
.rp-result-body {
  flex: 1;
  margin: 10px 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  overflow-y: auto;
  min-height: 80px;
  display: flex;
  align-items: flex-start;
}

.rp-result-loading {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
}

.rp-spin {
  width: 28px;
  height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: $themeColor;
  border-radius: 50%;
  animation: rp-spin 0.8s linear infinite;
}

.rp-spin-text {
  font-size: 13px;
  color: #6b7280;
}

.rp-result-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.7;
  white-space: pre-line;
  word-break: break-all;
}

.rp-result-error {
  font-size: 13px;
  color: #ef4444;
  line-height: 1.6;
}

/* 结果区底部 */
.rp-result-footer {
  padding: 10px 16px 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.rp-credit-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rp-credit-num {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.rp-credit-split {
  flex: 1;
}

.rp-credit-link {
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;

  &:hover { color: #6b7280; }
}

.rp-btn-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rp-btn-regen {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #e5e7eb; }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.rp-btn-cost {
  font-size: 12px;
  opacity: 0.7;
}

.rp-btn-apply {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.85; }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.rp-btn-more {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #f3f4f6;
  color: #374151;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover { background: #e5e7eb; }
}

.rp-ai-label {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}

.rp-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

@keyframes rp-spin {
  to { transform: rotate(360deg); }
}
</style>
