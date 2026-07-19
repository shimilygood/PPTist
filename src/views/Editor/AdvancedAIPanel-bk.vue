<template>
  <div class="adv-ai">
    <!-- 工具列表 -->
    <template v-if="!activeToolKey">
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
    </template>

    <!-- 内联详情面板 -->
    <template v-else>
      <div class="refine-panel">
        <div class="refine-header">
          <button class="refine-back" @click="backToGrid">‹</button>
          <span class="refine-title">{{ panelTitle }}</span>
        </div>

        <div class="refine-body">
          <!-- ===== AI 绘图 ===== -->
          <template v-if="activeToolKey === 'ai-draw'">
            <div class="refine-field">
              <div class="refine-label">创意描述</div>
              <div class="refine-textarea-wrap refine-textarea-wrap--draw">
                <textarea
                  v-model="customText"
                  class="refine-textarea"
                  placeholder="请输入您要生成的内容"
                  rows="4"
                  maxlength="50"
                  @focus="onTextFocus"
                  @blur="onTextBlur"
                  @keydown.enter.stop
                  @keydown.delete.stop
                  @keydown.backspace.stop
                />
                <label class="refine-upload">
                  <input type="file" accept="image/*" class="refine-upload-input" @change="onUploadImage" />
                  <span class="refine-upload-icon">🖼</span>
                  <span>上传图片</span>
                </label>
                <span class="refine-count">{{ customText.length }} / 50</span>
              </div>
              <div v-if="uploadPreview" class="refine-upload-preview">
                <img :src="uploadPreview" alt="" />
                <button class="refine-upload-remove" @click="clearUpload">✕</button>
              </div>
            </div>
            <div class="refine-field">
              <div class="refine-label">比例</div>
              <div class="refine-ratio-grid">
                <button
                  v-for="item in ratioOptions"
                  :key="item.value"
                  class="refine-ratio-btn"
                  :class="{ active: drawRatio === item.value }"
                  @click="drawRatio = item.value"
                >{{ item.label }}</button>
              </div>
            </div>
          </template>

          <!-- ===== 文本类（文案/扩写/润色/翻译/缩写） ===== -->
          <template v-else>
            <div class="refine-field">
              <div class="refine-label">文本</div>
              <div class="refine-textarea-wrap">
                <textarea
                  v-model="customText"
                  class="refine-textarea"
                  placeholder="请输入内容"
                  rows="4"
                  :maxlength="textMaxLength"
                  @focus="onTextFocus"
                  @blur="onTextBlur"
                  @keydown.enter.stop
                  @keydown.delete.stop
                  @keydown.backspace.stop
                />
                <span class="refine-count">{{ customText.length }} / {{ textMaxLength }}</span>
              </div>
            </div>

            <!-- 风格（文案/扩写/润色） -->
            <div v-if="showStyleField" class="refine-field">
              <div class="refine-label">风格</div>
              <el-select
                v-model="styleHint"
                class="refine-select"
                size="small"
                placeholder="请选择风格"
                :teleported="false"
              >
                <el-option
                  v-for="opt in currentStyleOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>

            <!-- 目标语言（翻译） -->
            <div v-if="activeToolKey === 'ai-translate'" class="refine-field">
              <div class="refine-label">目标语言</div>
              <el-select
                v-model="targetLang"
                class="refine-select"
                size="small"
                placeholder="请选择目标语言"
                :teleported="false"
              >
                <el-option label="英文" value="en" />
                <el-option label="日语" value="ja" />
                <el-option label="韩语" value="ko" />
                <el-option label="粤语" value="yue" />
                <el-option label="中文（繁体）" value="zh-tw" />
                <el-option label="中文（简体）" value="zh-cn" />
              </el-select>
            </div>

            <!-- 生成字数（文案/扩写/缩写） -->
            <div v-if="showWordCountField" class="refine-field">
              <div class="refine-label">生成字数</div>
              <div class="refine-word-grid">
                <button
                  v-for="item in currentWordCountOptions"
                  :key="item.value"
                  class="refine-word-btn"
                  :class="{ active: wordCountLimit === item.value }"
                  @click="wordCountLimit = item.value"
                >{{ item.label }}</button>
              </div>
            </div>
          </template>

          <!-- 开始生成 -->
          <button class="refine-submit" :disabled="submitLoading || pageLoading" @click="handleSubmit">
            <span class="refine-submit-icon">✦</span>
            <template v-if="submitLoading || pageLoading">生成中...</template>
            <template v-else>开始生成<span class="refine-cost">（消耗3点积分）</span></template>
          </button>

          <!-- 生成结果 -->
          <div class="refine-result">
            <div class="refine-result-head">
              <span class="refine-result-icon">✦</span>
              <span class="refine-result-title">生成结果</span>
            </div>
            <div class="refine-result-box" :class="{ 'refine-result-box--image': activeToolKey === 'ai-draw' && resultImage }">
              <div v-if="pageLoading" class="refine-result-loading">
                <div class="refine-spin"></div>
                <span>{{ loadingText }}</span>
              </div>
              <img v-else-if="activeToolKey === 'ai-draw' && resultImage" :src="resultImage" class="refine-result-img" alt="" />
              <div v-else-if="resultDone" class="refine-result-text">{{ resultSummary }}</div>
              <div v-else-if="resultError" class="refine-result-error">{{ resultError }}</div>
              <div v-else class="refine-result-empty">点击上方按钮开始生成</div>
            </div>
            <div v-if="resultDone || resultError" class="refine-result-actions">
              <button class="refine-action-btn" :disabled="submitLoading || pageLoading" @click="resubmit">
                <span class="refine-action-icon">↻</span>重新生成
              </button>
              <button class="refine-action-btn refine-action-btn--primary" :disabled="!resultDone" @click="applyToCanvas">
                <span class="refine-action-icon">⊕</span>添加画布
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
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
const { pptId } = storeToRefs(slidesStore)
const { handleElement } = storeToRefs(mainStore)

const refineOperationMap: any = {
  'ai-expand': 'EXPAND',
  'ai-polish': 'POLISH',
  'ai-translate': 'TRANSLATE',
}

const opLabelMap: any = { EXPAND: '扩写', POLISH: '润色', TRANSLATE: '翻译' }

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

const copyStyleOptions: any[] = [
  { label: '学术论文', value: '学术论文' },
  { label: '商业报告', value: '商业报告' },
  { label: '故事叙事', value: '故事叙事' },
  { label: '新闻稿', value: '新闻稿' },
  { label: '营销文案', value: '营销文案' },
]

const polishStyleOptions: any[] = [
  { label: '友好', value: '友好的' },
  { label: '口语化', value: '口语化' },
  { label: '官方口吻', value: '官方口吻' },
  { label: '专业的', value: '专业的' },
  { label: '直接的', value: '直接的' },
  { label: '自信的', value: '自信的' },
]

const expandStyleOptions: any[] = [
  { label: '详细扩写', value: '详细扩写' },
  { label: '专业', value: '专业的' },
  { label: '生动', value: '生动的' },
  { label: '简洁', value: '简洁的' },
]

const copyWordCountOptions: any[] = [
  { label: '不限', value: 'unlimited' },
  { label: '100字', value: '100' },
  { label: '200字', value: '200' },
]

const summarizeWordCountOptions: any[] = [
   { label: '不限', value: 'unlimited' },
  { label: '50字', value: '50' },
  { label: '100字', value: '100' },
]

const ratioOptions: any[] = [
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '4:3', value: '4:3' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '2:1', value: '2:1' },
]

const activeToolKey = ref('')
const customText = ref('')
const styleHint = ref('')
const targetLang = ref('en')
const wordCountLimit = ref('unlimited')
const drawRatio = ref('1:1')
const uploadPreview = ref('')
const resultImage = ref('')
const pageLoading = ref(false)
const submitLoading = ref(false)
const loadingText = ref('正在加工中，请稍候...')
const resultDone = ref(false)
const resultError = ref('')
const resultSummary = ref('')

const REFINE_POLL_INTERVAL = 3000
const REFINE_POLL_MAX = 200

const panelTitle = computed(() => {
  const tool = tools.find(t => t.key === activeToolKey.value)
  return tool?.label || ''
})

const activeRefineOperation = computed(() => refineOperationMap[activeToolKey.value] || '')

const showStyleField = computed(() =>
  ['ai-copy', 'ai-expand', 'ai-polish'].includes(activeToolKey.value)
)

const showWordCountField = computed(() =>
  ['ai-copy', 'ai-expand', 'ai-summarize'].includes(activeToolKey.value)
)

const textMaxLength = computed(() =>
  activeToolKey.value === 'ai-expand' ? 500 : 50
)

const currentStyleOptions = computed(() => {
  if (activeToolKey.value === 'ai-copy') return copyStyleOptions
  if (activeToolKey.value === 'ai-polish') return polishStyleOptions
  if (activeToolKey.value === 'ai-expand') return expandStyleOptions
  return []
})

const currentWordCountOptions = computed(() => {
  if (activeToolKey.value === 'ai-summarize') return summarizeWordCountOptions
  return copyWordCountOptions
})

const selectedElementText = computed(() => {
  const el = handleElement.value as any
  if (!el) return ''
  if (el.type === 'text' && el.content) return htmlToText(el.content).trim()
  if (el.type === 'shape' && el.text?.content) return htmlToText(el.text.content).trim()
  return ''
})

watch(handleElement, () => {
  if (activeToolKey.value && activeToolKey.value !== 'ai-draw' && selectedElementText.value) {
    customText.value = selectedElementText.value
  }
})

const onTextFocus = () => mainStore.setDisableHotkeysState(true)
const onTextBlur = () => mainStore.setDisableHotkeysState(false)

const onUploadImage = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadPreview.value = URL.createObjectURL(file)
}

const clearUpload = () => {
  uploadPreview.value = ''
}

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
    const opLabel = opLabelMap[activeRefineOperation.value] || '加工'
    resultSummary.value = `AI ${opLabel}完成，共 ${content.slides?.length ?? 0} 页内容已更新，可点击「添加画布」确认应用到当前 PPT。`
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

const submitRefineTask = () => {
  if (!customText.value.trim()) {
    message.error('请输入文本内容')
    return
  }
  if (activeRefineOperation.value === 'TRANSLATE' && !targetLang.value) {
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
    operation: activeRefineOperation.value,
  }
  if (activeRefineOperation.value === 'TRANSLATE') data.targetLang = targetLang.value
  if (['POLISH', 'EXPAND'].includes(activeRefineOperation.value) && styleHint.value) {
    data.styleHint = styleHint.value
  }
  if (wordCountLimit.value && wordCountLimit.value !== 'unlimited') {
    data.styleHint = [data.styleHint, `约${wordCountLimit.value}字`].filter(Boolean).join('，')
  }

  pageLoading.value = true
  submitLoading.value = true
  resultDone.value = false
  resultError.value = ''
  resultSummary.value = ''
  resultImage.value = ''
  loadingText.value = '正在提交加工任务...'

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
    return pollRefineTask(refineTaskId)
  }).finally(() => {
    pageLoading.value = false
    submitLoading.value = false
  })
}

const submitMockTask = () => {
  if (!customText.value.trim()) {
    message.error('请输入内容')
    return
  }
  pageLoading.value = true
  submitLoading.value = true
  resultDone.value = false
  resultError.value = ''
  resultSummary.value = ''
  resultImage.value = ''
  loadingText.value = '正在生成中...'

  setTimeout(() => {
    pageLoading.value = false
    submitLoading.value = false
    resultDone.value = true
    if (activeToolKey.value === 'ai-draw') {
      resultImage.value = uploadPreview.value || aiBg2
    }
    else if (activeToolKey.value === 'ai-copy') {
      resultSummary.value = `【${styleHint.value || '默认风格'}】${customText.value}——经 AI 文案优化后的完整表达，语言流畅、结构清晰，适合直接用于演示文稿。`
    }
    else if (activeToolKey.value === 'ai-summarize') {
      resultSummary.value = customText.value.length > 30
        ? customText.value.slice(0, 30) + '...'
        : customText.value
    }
    else {
      resultSummary.value = '生成完成，请点击「添加画布」应用到当前 PPT。'
    }
  }, 1500)
}

const handleSubmit = () => {
  if (activeRefineOperation.value) {
    submitRefineTask()
    return
  }
  submitMockTask()
}

const resubmit = () => {
  resultDone.value = false
  resultError.value = ''
  resultSummary.value = ''
  resultImage.value = ''
  handleSubmit()
}

const applyToCanvas = () => {
  if (!resultDone.value) return
  message.success('已添加到画布')
}

const resetPanelState = () => {
  pageLoading.value = false
  submitLoading.value = false
  resultDone.value = false
  resultError.value = ''
  resultSummary.value = ''
  resultImage.value = ''
  uploadPreview.value = ''
}

const initPanelDefaults = (key: string) => {
  customText.value = key === 'ai-draw' ? '' : (selectedElementText.value || '')
  targetLang.value = 'en'
  drawRatio.value = '1:1'
  wordCountLimit.value = key === 'ai-summarize' ? '100' : 'unlimited'
  if (key === 'ai-copy') styleHint.value = '学术论文'
  else if (key === 'ai-polish') styleHint.value = '友好的'
  else if (key === 'ai-expand') styleHint.value = '详细扩写'
  else styleHint.value = ''
}

const backToGrid = () => {
  activeToolKey.value = ''
  resetPanelState()
}

const openToolPanel = (key: string) => {
  activeToolKey.value = key
  resetPanelState()
  initPanelDefaults(key)
}

const handleToolClick = (tool: any) => {
  const panelKeys = ['ai-expand', 'ai-polish', 'ai-translate', 'ai-copy', 'ai-summarize', 'ai-draw']
  if (panelKeys.includes(tool.key)) {
    openToolPanel(tool.key)
    return
  }
  emit('openAI')
}
</script>

<style lang="scss" scoped>
.adv-ai {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-heading {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  padding: 4px 0 12px;
  flex-shrink: 0;
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

.refine-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.refine-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 0 12px;
  flex-shrink: 0;
}

.refine-back {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #374151;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  line-height: 1;
  padding: 0;

  &:hover { background: #f3f4f6; }
}

.refine-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.refine-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 16px;
}

.refine-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.refine-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.refine-textarea-wrap {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.2s;

  &:focus-within { border-color: #D5E4FD; }

  &--draw {
    padding-bottom: 8px;
  }
}
.refine-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  padding: 10px 12px 28px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  background: transparent;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  font-family: inherit;

  &::placeholder { color: #9ca3af; }
}

.refine-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 11px;
  color: #9ca3af;
  pointer-events: none;
}

.refine-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 12px 24px;
  padding: 16px;
  border: 1.5px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
  transition: border-color 0.2s;

  &:hover { border-color: #D5E4FD; color: $themeColor; }
}

.refine-upload-input {
  display: none;
}

.refine-upload-icon {
  font-size: 20px;
}

.refine-upload-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.refine-upload-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refine-select {
  width: 100%;

  :deep(.el-select__wrapper) {
    padding: 5px;

    &.is-focused,
    &.is-hovering {
      box-shadow: 0 0 0 1px #D5E4FD inset !important;
    }
  }
}

.refine-word-grid,
.refine-ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.refine-word-btn,
.refine-ratio-btn {
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #D5E4FD;
    color: $themeColor;
  }

  &.active {
    border-color: #D5E4FD;
    background: #eff6ff;
    color: $themeColor;
    font-weight: 600;
  }
}

.refine-submit {
  width: 100%;
  height: 44px;
  background: $themeColor;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) { opacity: 0.9; }
}

.refine-submit-icon { font-size: 14px; }

.refine-cost {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.85;
}

.refine-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.refine-result-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.refine-result-icon {
  font-size: 14px;
  color: $themeColor;
}

.refine-result-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.refine-result-box {
  min-height: 120px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;

  &--image {
    padding: 0;
    overflow: hidden;
    min-height: auto;
  }
}

.refine-result-img {
  width: 100%;
  display: block;
  border-radius: 8px;
}

.refine-result-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0;
  font-size: 13px;
  color: #6b7280;
}

.refine-spin {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: $themeColor;
  border-radius: 50%;
  animation: refine-spin 0.8s linear infinite;
}

.refine-result-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.7;
  word-break: break-all;
}

.refine-result-error {
  font-size: 13px;
  color: #ef4444;
  line-height: 1.6;
}

.refine-result-empty {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 32px 0;
}

.refine-result-actions {
  display: flex;
  gap: 10px;
}

.refine-action-btn {
  flex: 1;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: $themeColor;
    color: $themeColor;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: #f0f4ff;
    border-color: $themeColor;
    color: $themeColor;
    font-weight: 600;
  }
}

.refine-action-icon { font-size: 14px; }

@keyframes refine-spin {
  to { transform: rotate(360deg); }
}
</style>
