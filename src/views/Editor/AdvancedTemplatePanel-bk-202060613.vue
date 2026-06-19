<template>
  <div class="adv-tpl" @click="activeActionIndex = null">
    <!-- 推荐模板标题 + 更多分类切换 -->
    <div class="tpl-header">
      <span class="tpl-title">推荐模板</span>
      <button class="more-btn" @click="toggleCatalogBar()">{{ showCatalogBar ? '收起' : '更多 >' }}</button>
    </div>

    <!-- 横向分类，点击即可切换 -->
    <div v-if="showCatalogBar" class="catalog-row">
      <button
        v-for="item in visibleGroups"
        :key="item.groupId"
        class="catalog-chip"
        :class="{ active: activeGroupId === item.groupId }"
        @click="selectGroup(item.groupId)"
      >
        {{ item.groupName }}
      </button>
    </div>

    <div v-if="loading" class="tpl-loading"></div>

    <!-- 封面列表 -->
    <div v-else-if="!selectedTemplate" class="tpl-grid">
      <div
        v-for="item in visibleTemplates"
        :key="item.id"
        class="tpl-item"
        @click.stop="openTemplate(item)"
      >
        <img class="tpl-cover" :src="item.coverUrl" :alt="item.name" />
        <div class="tpl-overlay">查看</div>
      </div>
      <div v-if="!visibleTemplates.length" class="tpl-empty">暂无模板数据</div>
    </div>

    <!-- 当前模板页面列表 -->
    <div v-else class="tpl-pages-wrap">
      <div class="tpl-pages-header">
        <button class="back-btn" @click.stop="backToTemplateList">返回列表</button>
        <button class="apply-btn" @click.stop="applyWholeTemplate">应用此模板</button>
      </div>

      <div class="tpl-pages-grid">
        <div
          v-for="(slide, index) in selectedTemplateSlides"
          :key="`${selectedTemplate?.id}-${index}`"
          class="tpl-page-item"
          :class="{ active: activeActionIndex === index }"
          @click.stop="toggleSlideActions(index)"
        >
          <ThumbnailSlide class="tpl-page-thumb" :slide="slide" :size="90" />
          <div class="tpl-page-index">第{{ index + 1 }}页</div>

          <div v-if="activeActionIndex === index" class="tpl-actions" @click.stop>
            <button class="tpl-action-btn" @click="insertSlide(slide)">插入页面</button>
            <button class="tpl-action-btn" @click="replaceCurrentSlide(slide)">替换当前页面</button>
            <button class="tpl-action-btn" @click="applyWholeTemplate">替换整套模版</button>
          </div>
        </div>
      </div>

      <div v-if="!selectedTemplateSlides.length" class="tpl-empty">该模板暂无页面数据</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import type { Slide, SlideTheme } from '@/types/slides'
import { GetPPTGroups, ResolvePPTContent, SearchPPTTemplates } from '@/api/editor'
import message from '@/utils/message'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'

const props = defineProps<{ searchKeyword?: string }>()

const emit = defineEmits<{
  (e: 'insertPage', slide: Slide): void
  (e: 'replaceCurrentPage', slide: Slide): void
  (e: 'replaceAll', payload: { slides: Slide[]; theme: Partial<SlideTheme> }): void
}>()

interface PPTGroup {
  groupId: number
  groupName: string
}

interface PPTTemplateItem {
  id: number
  name: string
  cover: string
  contentJsonUrl?: string | null
  json: string | { slides?: Slide[]; theme?: Partial<SlideTheme> } | null
  width?: number
  height?: number
}

interface PPTTemplateView extends PPTTemplateItem {
  coverUrl: string
}

const groups = ref<PPTGroup[]>([])
const templateList = ref<PPTTemplateView[]>([])
const selectedTemplate = ref<PPTTemplateView | null>(null)
const selectedTemplateSlides = ref<Slide[]>([])
const selectedTemplateTheme = ref<Partial<SlideTheme>>({})
const activeActionIndex = ref<number | null>(null)
const loading = ref(false)
const activeGroupId = ref<number | null>(null)
const showCatalogBar = ref(false)
const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')

const parseCoverUrl = (cover: string) => {
  if (!cover) return ''

  const text = cover.trim()
  if (!text) return ''

  if (text.startsWith('http')) return text

  try {
    const parsed = JSON.parse(text) as Array<{ url?: string }>
    if (Array.isArray(parsed) && parsed.length) {
      return parsed[0]?.url || ''
    }
  }
  catch {
    return text
  }

  return text
}

const visibleGroups = computed(() => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return groups.value
  return groups.value.filter(item => normalizeSearch(item.groupName).includes(keyword))
})

const visibleTemplates = computed(() => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return templateList.value
  return templateList.value.filter(item => normalizeSearch(item.name).includes(keyword))
})

const loadTemplateList = async (params: { groupId?: number; hasRecommend?: 0 | 1 }) => {
  loading.value = true

  try {
    const res = await SearchPPTTemplates(params) as {
      code?: number
      msg?: string
      data?: { list?: PPTTemplateItem[] }
    }
    if (res.code !== 0) {
      templateList.value = []
      message.error(res.msg || '获取模板列表失败')
      return
    }

    const list = Array.isArray(res.data?.list) ? res.data!.list! : []
    templateList.value = list.map(item => ({
      ...item,
      coverUrl: parseCoverUrl(item.cover),
    }))
  }
  catch {
    templateList.value = []
    message.error('获取模板列表失败')
  }
  finally {
    loading.value = false
  }
}

// 展开/收起分类栏
const toggleCatalogBar = async () => {
  showCatalogBar.value = !showCatalogBar.value

  if (!showCatalogBar.value) {
    activeGroupId.value = null
    await loadTemplateList({ hasRecommend: 0 })
    return
  }

  if (!groups.value.length) {
    loading.value = true
    try {
      const res = await GetPPTGroups() as { code?: number; msg?: string; data?: PPTGroup[] }
      if (res.code !== 0) {
        message.error(res.msg || '获取模板分类失败')
        groups.value = []
        templateList.value = []
        return
      }

      groups.value = Array.isArray(res.data) ? res.data : []
    }
    catch {
      groups.value = []
      templateList.value = []
      message.error('获取模板分类失败')
      return
    }
    finally {
      loading.value = false
    }
  }

  const first = visibleGroups.value[0] || groups.value[0]
  if (first) {
    await selectGroup(first.groupId)
  }
}

// 点击分类切换模板
const selectGroup = async (groupId: number) => {
  activeGroupId.value = groupId
  await loadTemplateList({ groupId, hasRecommend: 1 })
}

const openTemplate = async (item: PPTTemplateView) => {
  activeActionIndex.value = null
  selectedTemplate.value = null
  selectedTemplateSlides.value = []
  selectedTemplateTheme.value = {}

  loading.value = true
  try {
    const parsed = await ResolvePPTContent<{ slides?: Slide[]; theme?: Partial<SlideTheme> }>({
      json: item.json,
      contentJsonUrl: item.contentJsonUrl,
      preferContentUrl: true,
    })

    const slides = Array.isArray(parsed?.slides) ? parsed.slides : []
    if (!slides.length) {
      message.error('该模板暂无可用数据')
      return
    }

    selectedTemplate.value = item
    selectedTemplateSlides.value = slides
    selectedTemplateTheme.value = parsed?.theme || {}
  }
  catch {
    message.error('模板数据异常')
  }
  finally {
    loading.value = false
  }
}

const backToTemplateList = () => {
  selectedTemplate.value = null
  selectedTemplateSlides.value = []
  selectedTemplateTheme.value = {}
  activeActionIndex.value = null
}

const toggleSlideActions = (index: number) => {
  activeActionIndex.value = activeActionIndex.value === index ? null : index
}

const insertSlide = (slide: Slide) => {
  emit('insertPage', slide)
  activeActionIndex.value = null
}

const replaceCurrentSlide = (slide: Slide) => {
  emit('replaceCurrentPage', slide)
  activeActionIndex.value = null
}

const applyWholeTemplate = () => {
  const slides = selectedTemplateSlides.value
  if (!slides.length) {
    message.error('该模板暂无可用数据')
    return
  }
  emit('replaceAll', { slides, theme: selectedTemplateTheme.value })
  activeActionIndex.value = null
}

onMounted(() => {
  loadTemplateList({ hasRecommend: 0 })
})
</script>

<style lang="scss" scoped>
.adv-tpl {
  height: 100%;
}

.tpl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.catalog-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 10px;
  padding-bottom: 4px;
}

.catalog-chip {
  flex-shrink: 0;
  height: 28px;
  border: 1px solid #d7dce5;
  border-radius: 14px;
  background: #f8fafc;
  color: #4b5563;
  font-size: 12px;
  padding: 0 12px;
  cursor: pointer;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    background: #fff;
  }

  &.active {
    border-color: $themeColor;
    background: rgba(37, 99, 235, 0.1);
    color: $themeColor;
    font-weight: 600;
  }
}

.tpl-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.more-btn {
  font-size: 12px;
  color: #7E8792;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover { color:#333; }
}

.tpl-loading,
.tpl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
  padding: 24px 0;
}

.tpl-loading::before {
  content: '';
  width: 64px;
  height: 64px;
  margin-bottom: 6px;
  background: url('@/assets/images/loading100.gif') center/contain no-repeat;
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.tpl-pages-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tpl-pages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn,
.apply-btn {
  border: none;
  cursor: pointer;
  border-radius: 8px;
  height: 34px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
}

.back-btn {
  background: #f3f4f6;
  color: #374151;
}

.apply-btn {
  background: $themeColor;
  color: #fff;
}

.tpl-pages-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.tpl-page-item {
  position: relative;
  padding: 8px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;

  &.active {
    border-color: $themeColor;
  }
}

.tpl-page-thumb {
  width: 100%;
  overflow: hidden;
}

.tpl-page-index {
  margin-top: 6px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

.tpl-actions {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 60px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #dbe1ea;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  padding: 3px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  z-index: 3;
}

.tpl-action-btn {
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 11px;
  cursor: pointer;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
  }
}

.tpl-item {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: border-color 0.15s;

  &:hover {
    border-color: $themeColor;

    .tpl-overlay { opacity: 1; }
  }
}

.tpl-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #f3f4f6;
}

.tpl-overlay {
  position: absolute;
  inset: 0;
  background: rgba(37, 99, 235, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
</style>
