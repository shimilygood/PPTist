<template>
  <div class="adv-media">
    <template v-if="view === 'main'">
      <div class="top-tabs">
        <button
          v-for="item in topTabs"
          :key="item.key"
          class="top-tab"
          :class="{ active: activeTopTag === item.key }"
          @click="activeTopTag = item.key"
        >{{ item.label }}</button>
      </div>

      <div v-for="section in visibleSections" :key="section.key" class="media-section">
        <div class="section-header">
          <span class="section-title">{{ section.label }}</span>
          <button class="section-more" @click="enterCategoryView(section.key)">更多 <span class="pptfont ppt-operate-subordinate icon-more" /></button>
        </div>

        <div
          class="media-grid"
          :class="{
            'recommend-grid': section.layout === 'wide',
            'portrait-grid': section.layout === 'portrait',
          }"
        >
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

        <button v-if="section.key === 'recommend'" class="ai-banner" @click="mainStore.setAIPPTDialogState(true)">
          <span class="banner-badge">AI</span>
          <span class="banner-text">为您生成图片素材</span>
          <span class="banner-arrow">→</span>
        </button>
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

      <div
        class="media-grid category-grid"
        :class="{
          'recommend-grid': currentSection?.layout === 'wide',
          'portrait-grid': currentSection?.layout === 'portrait',
        }"
      >
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
import { useMainStore } from '@/store'
import useCreateElement from '@/hooks/useCreateElement'
import editorApi from '@/api/editor'

const props = defineProps<{ searchKeyword?: string }>()

interface ImgItem {
  id: number | string
  width: number
  height: number
  src: string
}

interface TopTab {
  key: string
  label: string
}

const defaultTopTabs: TopTab[] = [
  { key: 'business', label: '商务' },
  { key: 'tech', label: '科技' },
  { key: 'scenery', label: '风景' },
  { key: 'texture', label: '质感' },
]

const topTabs = ref<TopTab[]>([...defaultTopTabs])

type TopTag = string

interface MediaAsset extends ImgItem {
  title: string
  category: string
  topTag: TopTag
}

interface MediaSection {
  key: string
  label: string
  categories: string[]
  previewCount: number
  layout: 'wide' | 'portrait'
  items: MediaAsset[]
}

const mainStore = useMainStore()
const { createImageElement } = useCreateElement()

const view = ref<'main' | 'category'>('main')
const activeTopTag = ref<TopTag>('business')
const activeSectionKey = ref('')
const activeCategory = ref('全部')

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}

const topLabelMap = computed(() => {
  const map: Record<string, string> = {}
  topTabs.value.forEach(tab => {
    map[tab.key] = tab.label
  })
  return map
})

const sections = reactive<MediaSection[]>([
  {
    key: 'recommend',
    label: '为你推荐',
    categories: ['全部', '商务', '科技', '风景', '质感'],
    previewCount: 2,
    layout: 'wide',
    items: [],
  },
  {
    key: 'workplace',
    label: '职场人物',
    categories: ['全部', '商务', '办公', '会议', '职业'],
    previewCount: 2,
    layout: 'portrait',
    items: [],
  },
  {
    key: 'female',
    label: '女性形象',
    categories: ['全部', '清新', '时尚', '生活', '职场'],
    previewCount: 2,
    layout: 'portrait',
    items: [],
  },
  {
    key: 'parenting',
    label: '母婴',
    categories: ['全部', '亲子', '陪伴', '居家', '成长'],
    previewCount: 2,
    layout: 'portrait',
    items: [],
  },
])

const filterItems = (section: MediaSection) => {
  return section.items.filter(item => {
    const topMatch = item.topTag === activeTopTag.value
    const label = topLabelMap.value[item.topTag] || ''
    const searchMatch = matchesSearch(section.label, item.title, item.category, label, ...section.categories)
    return topMatch && searchMatch
  })
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

    const groups: any[] = Array.isArray(imageType.groups) ? imageType.groups : []

    // 过滤出有实际素材数据的 group
    const nonEmptyGroups = groups.filter((g: any) =>
      Array.isArray(g.materials) && g.materials.some((m: any) => Array.isArray(m.data) && m.data.length > 0)
    )

    if (!nonEmptyGroups.length) return

    // 从 API groups 动态生成 topTabs，使标签过滤语义正确
    const newTopTabs: TopTab[] = nonEmptyGroups.map((g: any) => ({
      key: `group-${g.groupId}`,
      label: g.groupName,
    }))
    topTabs.value = newTopTabs
    activeTopTag.value = newTopTabs[0].key

    // 从 groups 构建 sections，每个 group 为一个 section
    const nextSections: MediaSection[] = nonEmptyGroups.map((group: any) => {
      const materials: any[] = group.materials || []
      const items: MediaAsset[] = []
      const categorySet = new Set<string>()

      materials.forEach((material: any) => {
        const category = material.name || '未分类'
        categorySet.add(category)
        const dataList = Array.isArray(material.data) ? material.data : []

        dataList.forEach((item: any, idx: number) => {
          const src = item.cover || item.imageUrl || item.url || ''
          if (!src) return
          items.push({
            id: item.id || `${group.groupId}-${material.id}-${idx}`,
            width: item.width || 0,
            height: item.height || 0,
            src,
            title: category,
            category,
            topTag: `group-${group.groupId}`,
          })
        })
      })

      return {
        key: `api-group-${group.groupId}`,
        label: group.groupName,
        categories: ['全部', ...Array.from(categorySet)],
        previewCount: 2,
        layout: 'portrait' as const,
        items,
      }
    })

    if (nextSections.length) {
      sections.splice(0, sections.length, ...nextSections)
    }
  }).catch((err: any) => {
    console.warn('获取图片素材失败，使用默认占位数据', err)
    // API 失败时保留默认 topTabs 和 sections
    topTabs.value = [...defaultTopTabs]
  })
})
</script>

<style lang="scss" scoped>
.adv-media {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.top-tabs,
.cat-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.top-tab,
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
  padding-bottom: 18px;
  margin-bottom: 18px;
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
  font-size: 13px;
  font-weight: 600;
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

.media-grid {
  display: grid;
  gap: 10px;
}

.recommend-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.portrait-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.category-grid {
  align-content: start;
}

.media-item {
  border: 0;
  padding: 0;
  background: #f5f7fc;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid transparent;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    border-color: $themeColor;
    background: #edf3ff;
  }
}

.recommend-grid .media-item {
  aspect-ratio: 1.48;
}

.portrait-grid .media-item {
  aspect-ratio: 0.76;
}

.ai-banner {
  width: 100%;
  height: 54px;
  margin-top: 14px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(90deg, #c8e0ff 0%, #95c1ff 100%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  cursor: pointer;
  color: #2563eb;
}

.banner-badge {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.banner-text {
  flex: 1;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
}

.banner-arrow {
  font-size: 18px;
  line-height: 1;
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
