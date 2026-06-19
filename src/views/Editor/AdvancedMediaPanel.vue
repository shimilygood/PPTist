<template>
  <div class="adv-media">
    <template v-if="view === 'main'">
      <div v-for="section in visibleSections" :key="section.key" class="media-section">
        <div class="section-header">
          <span class="section-title">{{ section.label }}</span>
          <button class="section-more" @click="enterCategoryView(section.key)">更多 <span class="pptfont ppt-operate-subordinate icon-more" /></button>
        </div>

        <div class="preview-grid">
          <button
            v-for="item in section.items.slice(0, section.previewCount)"
            :key="item.id"
            class="media-item"
            @click="insertImage(item.src)"
          >
            <img :src="item.src" :alt="item.title" loading="lazy" />
          </button>
          <div v-if="!section.items.length" class="panel-empty">暂无内容</div>
        </div>
      </div>
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

      <div class="category-grid">
        <button
          v-for="item in currentCategoryItems"
          :key="item.id"
          class="media-item"
          @click="insertImage(item.src)"
        >
          <img :src="item.src" :alt="item.title" loading="lazy" />
        </button>
        <div v-if="!currentCategoryItems.length" class="panel-empty">暂无内容</div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import useCreateElement from '@/hooks/useCreateElement'
import editorApi from '@/api/editor'
import { mapMaterialOtherData } from '@/utils/material'

const props = defineProps<{ searchKeyword?: string }>()

interface MediaAsset {
  id: number | string
  width: number
  height: number
  src: string
  title: string
  category: string
}

interface MediaSection {
  key: string
  label: string
  categories: string[]
  previewCount: number
  items: MediaAsset[]
}

const { createImageElement } = useCreateElement()

const view = ref<'main' | 'category'>('main')
const activeSectionKey = ref('')
const activeCategory = ref('全部')

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}

const sections = reactive<MediaSection[]>([])

const filterItems = (section: MediaSection) => {
  return section.items.filter(item =>
    matchesSearch(section.label, item.title, item.category, ...section.categories)
  )
}

const visibleSections = computed(() => {
  return sections
    .map(section => ({ ...section, items: filterItems(section) }))
    .filter(section => section.items.length)
})

const currentSection = computed(() => sections.find(item => item.key === activeSectionKey.value))
const currentCategoryItems = computed(() => {
  const section = currentSection.value
  if (!section) return []
  const list = filterItems(section)
  if (activeCategory.value === '全部') return list
  return list.filter(item => item.category === activeCategory.value)
})

const insertImage = (src: string) => {
  createImageElement(src)
}

const enterCategoryView = (sectionKey: string) => {
  activeSectionKey.value = sectionKey
  activeCategory.value = '全部'
  view.value = 'category'
}

onMounted(() => {
  editorApi.getMaterialOther({ typeId: 6 }).then((res: any) => {
    const types = Array.isArray(res?.data) ? res.data : []
    const imageType = types.find((t: any) => t.typeName === '图片')
    if (!imageType) return

    const mapped = mapMaterialOtherData([imageType], 6)
    const nextSections: MediaSection[] = mapped
      .filter(section => section.items.length > 0)
      .map((section, index) => ({
        key: `api-${section.key}-${index}`,
        label: section.label,
        categories: section.categories,
        previewCount: 3,
        items: section.items.map((item:any) => ({
          id: item.id,
          width: item.width,
          height: item.height,
          src: item.src,
          title: item.category,
          category: item.category,
        })),
      }))

    if (nextSections.length) {
      sections.splice(0, sections.length, ...nextSections)
    }
  }).catch((err: any) => {
    console.warn('获取图片素材失败', err)
  })
})
</script>

<style lang="scss" scoped>
.adv-media {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
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
    color: #1f2937;
  }

  &.active {
    background: rgba(37, 99, 235, 0.12);
    color: $themeColor;
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.14);
  }
}

.media-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #edf0f5;
}

.media-section:last-child {
  border-bottom: 0;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-header,
.cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title,
.cat-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.section-more,
.back-btn {
  border: 0;
  background: none;
  color: #7E8792;
  font-size: 12px;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: #333;
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px; 
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
}

.media-item {
  border: 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  transition: background 0.18s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &:hover {
    background: #edf3ff;
    border: #2A6AE9 1px solid;
  }
}

.panel-empty {
  grid-column: 1 / -1;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #9ca3af;
  border: 1px dashed $borderColor;
  border-radius: 10px;
  background: #fafbfc;
}
</style>
