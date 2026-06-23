<template>
  <div class="adv-background">
    <div class="top-tabs">
      <button
        class="top-tab"
        :class="{ active: activeBgTab === 'bg' }"
        @click="activeBgTab = 'bg'"
      >背景</button>
      <button
        class="top-tab"
        :class="{ active: activeBgTab === 'aibg' }"
        @click="activeBgTab = 'aibg'"
      >AI背景</button>
    </div>

    <template v-if="activeBgTab === 'bg'">
      <template v-if="view === 'main'">
        <!-- Solid colors section -->
        <div class="solid-colors-section">
          <div class="solid-colors-grid">
            <button
              v-for="item in solidColorItems"
              :key="item.id"
              class="solid-color-item"
              :style="{ background: item.value }"
              @click="applySolidBackground(item.value)"
              :title="item.value"
            ></button>
          </div>
        </div>

        <!-- Background sections -->
        <template v-for="section in visibleBgSections" :key="section.key">
          <div class="bg-section">
            <div class="section-header">
              <span class="section-title">{{ section.label }}</span>
              <button class="section-more" @click="enterCategoryView(section.key)">更多 <span class="pptfont ppt-operate-subordinate icon-more" /></button>
            </div>

            <div v-if="section.type === 'gradient'" class="bg-preview-grid">
              <button
                v-for="item in section.items.slice(0, 3)"
                :key="item.id"
                class="bg-preview-item"
                :style="{ backgroundImage: item.value }"
                @click="applyGradientBackground(item.gradient!)"
              ></button>
            </div>

            <div v-else class="bg-preview-grid">
              <button
                v-for="item in section.items.slice(0, 3)"
                :key="item.id"
                class="bg-preview-item"
                @click="applyImageBackground(item.value)"
              >
                <img :src="item.value" :alt="section.label" loading="lazy" />
              </button>
            </div>
          </div>
        </template>

        <button class="apply-all-btn" @click="applyBackgroundAllSlide()">应用背景到全部</button>
      </template>

      <template v-else>
        <div class="cat-header">
          <button class="back-btn" @click="view = 'main'">‹ 返回</button>
          <span class="cat-title">{{ currentSection?.label }}</span>
        </div>

        <div class="cat-tabs">
          <button
            v-for="category in currentSection?.categories || []"
            :key="category"
            class="cat-tab"
            :class="{ active: activeCategory === category }"
            @click="activeCategory = category"
          >{{ category }}</button>
        </div>

        <div v-if="currentSection?.type === 'gradient'" class="category-grid">
          <button
            v-for="item in currentCategoryItems"
            :key="item.id"
            class="bg-grid-item"
            :style="{ backgroundImage: item.value }"
            @click="applyGradientBackground(item.gradient!)"
          ></button>
        </div>

        <div v-else class="category-grid">
          <button
            v-for="item in currentCategoryItems"
            :key="item.id"
            class="bg-grid-item"
            @click="applyImageBackground(item.value)"
          >
            <img :src="item.value" :alt="currentSection?.label || '背景'" loading="lazy" />
          </button>
        </div>
      </template>
    </template>

    <template v-else>
      <div class="ai-bg-panel">
        <button class="ai-launch-btn" @click="mainStore.setAIPPTDialogState(true)">
          <span class="pptfont ppt-menu-aippt"></span>
          <span>打开 AI 背景生成</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { useMainStore } from '@/store'
import { getImageDataURL } from '@/utils/image'
import editorApi from '@/api/editor'
import { mapMaterialOtherData } from '@/utils/material'
import type { Gradient, SlideBackground } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import FileInput from '@/components/FileInput.vue'

const props = defineProps<{ searchKeyword?: string }>()

interface BgItem {
  id: string
  value: string
  category: string
  gradient?: Gradient
}

interface BgSection {
  key: string
  label: string
  type: 'gradient' | 'image'
  categories: string[]
  items: BgItem[]
}

const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { slides, currentSlide } = storeToRefs(slidesStore)
const { addHistorySnapshot } = useHistorySnapshot()

const activeBgTab = ref<'bg' | 'aibg'>('bg')
const view = ref<'main' | 'category'>('main')
const activeSectionKey = ref('')
const activeCategory = ref('全部')

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}

// Solid colors (displayed as grid at top, not in sections)
const solidColors = [
  '#f5f7fb', '#dbeafe', '#bfdbfe', '#fde68a', '#fecaca', 
  '#d1fae5', '#e9d5ff', '#e5e7eb', '#0f172a', '#1d4ed8', 
  '#f97316', '#10b981', '#06b6d4', '#d946ef', '#ec4899'
]

const solidColorItems = computed(() => {
  return solidColors.map((color, index) => ({
    id: `solid-${index}`,
    value: color,
    category: 'solid',
  }))
})

const sections = reactive<BgSection[]>([
  {
    key: 'minimalist-fashion',
    label: '简约时尚',
    type: 'gradient',
    categories: ['全部', '蓝调', '暖色', '中性'],
    items: [],
  },
  {
    key: 'cute-guide',
    label: '可爱手帐',
    type: 'image',
    categories: ['全部', '甜蜜', '清新', '温暖'],
    items: [],
  },
  {
    key: 'diffuse-bg',
    label: '弥散背景',
    type: 'image',
    categories: ['全部', '粉色', '蓝色', '绿色'],
    items: [],
  },
  {
    key: 'starry-sky',
    label: '浩瀚星空',
    type: 'image',
    categories: ['全部', '宇宙', '星空', '梦幻'],
    items: [],
  },
  {
    key: 'black-cool',
    label: '黑色炫酷',
    type: 'image',
    categories: ['全部', '霓虹', '科技', '神秘'],
    items: [],
  },
])

const visibleBgSections = computed(() => {
  return sections.filter(section => 
    matchesSearch(section.label, ...section.categories)
  )
})

const currentSection = computed(() => sections.find(item => item.key === activeSectionKey.value))

const currentCategoryItems = computed(() => {
  const section = currentSection.value
  if (!section) return []
  if (!matchesSearch(section.label, activeCategory.value, ...section.categories)) return []
  if (activeCategory.value === '全部') return section.items
  return section.items.filter(item => item.category === activeCategory.value)
})

const updateBackground = (background: SlideBackground) => {
  slidesStore.updateSlide({ background })
  addHistorySnapshot()
}

const applySolidBackground = (color: string) => {
  updateBackground({
    type: 'solid',
    color,
  })
}

const applyGradientBackground = (gradient: Gradient) => {
  updateBackground({
    type: 'gradient',
    gradient,
  })
}

const applyImageBackground = (src: string) => {
  updateBackground({
    type: 'image',
    image: {
      src,
      size: currentSlide.value.background?.image?.size || 'cover',
    },
  })
}

const enterCategoryView = (sectionKey: string) => {
  activeSectionKey.value = sectionKey
  activeCategory.value = '全部'
  view.value = 'category'
}

const applyBackgroundAllSlide = () => {
  const background = currentSlide.value.background
  if (!background) return
  slidesStore.setSlides(slides.value.map(slide => ({
    ...slide,
    background: JSON.parse(JSON.stringify(background)),
  })))
  addHistorySnapshot()
}

const createGradientStyle = (gradient: Gradient) => {
  const colors = gradient.colors.map(item => `${item.color} ${item.pos}%`).join(', ')
  if (gradient.type === 'radial') return `radial-gradient(${colors})`
  return `linear-gradient(${gradient.rotate}deg, ${colors})`
}

onMounted(() => {
   let params: any = {
    typeId: 10,
  }
  editorApi.getMaterialOther(params).then((res: any) => {
    const types = Array.isArray(res?.data) ? res.data : []
    const bgType = types.find((t: any) => t.typeName === '背景')
    if (!bgType) return

    const mapped = mapMaterialOtherData([bgType], 6)
    const apiSections: BgSection[] = mapped.map((section: any, index: number) => ({
      key: `api-bg-${section.key}-${index}`,
      label: section.label,
      type: 'image',
      categories: section.categories,
      items: section.items.map((item: any) => ({
        id: String(item.id),
        value: item.src,
        category: item.category,
      })),
    }))

    sections.splice(0, sections.length, ...apiSections)
  }).finally(() => {})
})
</script>

<style lang="scss" scoped>
.adv-background {
  display: flex;
  flex-direction: column;
  gap:7px;
  padding: 0;
}

.top-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid $borderColor;
  background: #f8fafc;

  .top-tab {
    flex: 1;
    height: 40px;
    border: 0;
    background: transparent;
    color: #6b7280;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      color: $themeColor;
      background: rgba(37, 99, 235, 0.05);
    }

    &.active {
      color: $themeColor;
      border-bottom-color: $themeColor;
      background: #fff;
    }
  }
}

// Solid colors section
.solid-colors-section {
  padding: 12px 0;
  border-bottom: 1px solid $borderColor;
}

.solid-colors-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.solid-color-item {
  width: 100%;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }
}

// Background sections
.bg-section {
  padding: 12px 0;
  border-bottom: 1px solid $borderColor;

  &:last-child {
    border-bottom: 0;
  }
}

.section-header,
.cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0;
}

.section-title,
.cat-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.section-more,
.back-btn {
  border: 0;
  background: none;
  color: #7E8792;
  font-size: 12px;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }
}

.back-btn {
  padding: 4px 8px;
}

// Preview grids
.bg-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.bg-preview-item {
  width: 100%;
  aspect-ratio: 1.5;
  border: 1px solid $borderColor;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    border-color: $themeColor;
  }
}

// Category view
.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 2px 0;
}

.cat-tab {
 padding: 2px 8px;
  border: 0;
  border-radius: 10px;
  background: #f3f5fb;
  font-size: 12px;
  font-weight: 600;
  color: #2f3643;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    background: #edf1f9;
    color: #111827;
  }

  &.active {
    background: rgba(37, 99, 235, 0.1);
    color: $themeColor;
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.14);
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px 0;
}

.bg-grid-item {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid $borderColor;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    border-color: $themeColor;
  }
}

// Apply to all button
.apply-all-btn {
  width: 100%;
  height: 36px;
  margin-top: 8px;
  border: 1px solid $borderColor;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    background: rgba(37, 99, 235, 0.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

// AI Background panel
.ai-bg-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  text-align: center;
}

.ai-launch-btn {
  width: 100%;
  max-width: 200px;
  padding: 16px;
  border: 2px solid $themeColor;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  color: $themeColor;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  .pptfont {
    font-size: 32px;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
