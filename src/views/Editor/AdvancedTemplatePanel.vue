<template>
  <div class="adv-tpl" @click="closeCatalogPopup">
    <!-- 推荐模板标题 + 分类按钮 -->
    <div class="tpl-header">
      <span class="tpl-title">推荐模板</span>
      <div class="catalog-trigger-wrap" @click.stop>
        <button class="catalog-trigger-btn" :class="{ active: showCatalogPopup || activeGroupId !== null }" @click.stop="toggleCatalogPopup">
          
          分类
           <span class="designfont designicon-ai-filter"  /> 
          
        </button>

        <!-- 分类下拉弹窗 -->
        <div v-if="showCatalogPopup" class="catalog-popup" @click.stop>
          <div v-if="groupLoading" class="catalog-popup-loading">
            <div class="catalog-spin"></div>
          </div>
          <template v-else>
            <div
              class="catalog-popup-item"
              :class="{ active: activeGroupId === null }"
              @click.stop="selectRecommend"
            >推荐</div>
            <div
              v-for="item in groups"
              :key="item.groupId"
              class="catalog-popup-item"
              :class="{ active: activeGroupId === item.groupId }"
              @click.stop="selectGroupFromPopup(item.groupId)"
            >
              {{ item.groupName }}
            </div>
            <div v-if="!groups.length" class="catalog-popup-empty">暂无分类</div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="loading" class="tpl-loading"></div>

    <!-- 封面列表 -->
    <div v-else-if="!selectedTemplate" :class="{ 'tpl-grid': visibleTemplates.length, 'tpl-empty': !visibleTemplates.length }">
    <!-- {{visibleTemplates}} -->
    <div
        v-for="item in visibleTemplates"
        :key="item.id"
        class="tpl-item"
        @click.stop="openTemplate(item)"
      >
      <!-- {{item.cover}} -->
        <img class="tpl-cover" :src="item.cover" :alt="item.name" />
        <div class="tpl-overlay">查看</div>
      </div>
      <div v-if="!visibleTemplates.length" class="tpl-empty">
        <img src="@/assets/images/nodeta.png" class="tpl-empty-img" alt="" />
        <span>暂无相关内容</span>
      </div>
    </div>

    <!-- 当前模板页面列表 -->
    <div v-else class="tpl-pages-wrap">
      <div class="tpl-pages-header">
        <button class="back-btn" @click.stop="backToTemplateList">返回列表</button>
        <button class="apply-btn" @click.stop="applyWholeTemplate">应用此模板</button>
      </div>

      <div :class="{ 'tpl-pages-grid': selectedTemplateSlides.length, 'tpl-pages-empty': !selectedTemplateSlides.length }">
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

      <div v-if="!selectedTemplateSlides.length" class="tpl-empty">
        <img src="@/assets/images/nodeta.png" class="tpl-empty-img" alt="" />
        <span>暂无相关内容2</span>
      </div>
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

const groups = ref<PPTGroup[]>([])
const templateList = ref<PPTTemplateItem[]>([])
const selectedTemplate = ref<PPTTemplateItem | null>(null)
const selectedTemplateSlides = ref<Slide[]>([])
const selectedTemplateTheme = ref<Partial<SlideTheme>>({})
const activeActionIndex = ref<number | null>(null)
const loading = ref(false)
const activeGroupId = ref<number | null>(null)
const showCatalogPopup = ref(false)
const groupLoading = ref(false)
const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')

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
    templateList.value = list
  }
  catch {
    templateList.value = []
    message.error('获取模板列表失败')
  }
  finally {
    loading.value = false
  }
}

// 打开/关闭分类弹窗
const toggleCatalogPopup = async () => {
  showCatalogPopup.value = !showCatalogPopup.value
  if (!showCatalogPopup.value) return

  if (!groups.value.length) {
    groupLoading.value = true
    GetPPTGroups()
      .then((res: any) => {
        if (res.code !== 0) {
          message.error(res.msg || '获取模板分类失败')
          groups.value = []
          return
        }
        groups.value = Array.isArray(res.data) ? res.data : []
      })
      .finally(() => {
        groupLoading.value = false
      })
  }
}

const closeCatalogPopup = () => {
  showCatalogPopup.value = false
}

// 点击推荐，回到默认推荐列表
const selectRecommend = () => {
  showCatalogPopup.value = false
  activeGroupId.value = null
  loadTemplateList({ hasRecommend: 0 })
}

// 点击分类切换模板
const selectGroupFromPopup = (groupId: number) => {
  showCatalogPopup.value = false
  activeGroupId.value = groupId
  loadTemplateList({ groupId, hasRecommend: 1 })
}

const selectGroup = async (groupId: number) => {
  activeGroupId.value = groupId
  await loadTemplateList({ groupId, hasRecommend: 1 })
}

const openTemplate = async (item: PPTTemplateItem) => {
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

.tpl-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.catalog-trigger-wrap {
  position: relative;
}

.catalog-trigger-btn {
  display: flex;
  align-items: center;
  height: 26px;
  padding: 0 8px;
  border: 1px solid #d7dce5;
  border-radius: 6px;
  background: #f8fafc;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    background: #fff;
  }

  &.active {
    border-color: $themeColor;
    color: $themeColor;
    background: rgba(37, 99, 235, 0.08);
  }
}

.catalog-popup {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 110px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  z-index: 99;
}

.catalog-popup-item {
  height: 34px;
  line-height: 34px;
  padding: 0 14px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;

  &:hover {
    background: #f3f4f6;
    color: $themeColor;
  }

  &.active {
    color: $themeColor;
    font-weight: 600;
    background: rgba(37, 99, 235, 0.06);
  }
}

.catalog-popup-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.catalog-spin {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: $themeColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.catalog-popup-empty {
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}

.tpl-loading,
.tpl-empty {
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

.tpl-empty-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 8px;
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
