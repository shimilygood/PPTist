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
          <button class="section-more" @click="enterCategoryView(section.key)">查看分类 ›</button>
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
import api from '@/services'

const props = defineProps<{ searchKeyword?: string }>()

interface ImgItem {
  id: number
  width: number
  height: number
  src: string
}

const topTabs = [
  { key: 'business', label: '商务' },
  { key: 'tech', label: '科技' },
  { key: 'scenery', label: '风景' },
  { key: 'texture', label: '质感' },
] as const

type TopTag = typeof topTabs[number]['key']

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

const topLabelMap: Record<TopTag, string> = {
  business: '商务',
  tech: '科技',
  scenery: '风景',
  texture: '质感',
}

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
    const searchMatch = matchesSearch(section.label, item.title, item.category, topLabelMap[item.topTag], ...section.categories)
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

const attachAssets = (
  items: ImgItem[],
  titles: string[],
  categories: string[],
  topTags: TopTag[],
): MediaAsset[] => {
  return items.map((item, index) => ({
    ...item,
    title: titles[index % titles.length],
    category: categories[index % categories.length],
    topTag: topTags[index % topTags.length],
  }))
}

onMounted(() => {
  api.getMockData('imgs').then((data: any) => {
    const imgs: ImgItem[] = Array.isArray(data) ? data : (data.imgs || [])

    sections[0].items = attachAssets(
      imgs.slice(0, 8),
      ['未来城市', '雪山湖景', '光影商务', '柔和质感'],
      ['商务', '风景', '科技', '质感'],
      ['business', 'scenery', 'tech', 'texture'],
    )

    sections[1].items = attachAssets(
      imgs.slice(8, 20),
      ['职场男士', '商务女士', '会议沟通', '精英形象'],
      ['商务精英', '办公人物', '会议交流', '职业形象'],
      ['business', 'business', 'tech', 'texture'],
    )

    sections[2].items = attachAssets(
      imgs.slice(20, 32),
      ['清新女生', '夜景写真', '温柔肖像', '时尚人物'],
      ['清新', '时尚', '生活', '职场'],
      ['texture', 'texture', 'scenery', 'business'],
    )

    sections[3].items = attachAssets(
      imgs.slice(32, 44),
      ['亲子陪伴', '家庭时光', '母婴居家', '成长记录'],
      ['亲子', '陪伴', '居家', '成长'],
      ['texture', 'business', 'scenery', 'tech'],
    )
  }).catch(() => {
    sections.forEach(section => {
      section.items = []
    })
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
  margin-bottom: 18px;
}

.top-tab,
.cat-tab {
  height: 46px;
  border: 0;
  border-radius: 10px;
  background: #f3f5fb;
  font-size: 13px;
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
  color: $themeColor;
  font-size: 12px;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
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
