<template>
  <div class="adv-text">
    <template v-if="view === 'main'">
      <div class="text-section">
        <div class="section-header">
          <span class="section-title">添加文字</span>
          <button class="section-more" @click="enterCategoryView('basic')">
            查看分类 <span class="pptfont ppt-operate-subordinate icon-more" />
          </button>
        </div>

        <div class="text-basic-card">
          <button class="basic-item" @click="insertPresetText('title')">
            <span class="basic-icon"><strong>H</strong><sub>1</sub></span>
            <span class="basic-label">标题</span>
          </button>
          <button class="basic-item" @click="insertPresetText('subtitle')">
            <span class="basic-icon"><strong>H</strong></span>
            <span class="basic-label">副标题</span>
          </button>
          <button class="basic-item" @click="insertPresetText('body')">
            <span class="basic-icon"><strong>T</strong></span>
            <span class="basic-label">正文</span>
          </button>
          <button class="basic-item" @click="insertPresetText('warp')">
            <span class="basic-icon warp-icon"><strong>T</strong></span>
            <span class="basic-label">变形文字</span>
          </button>
          <button class="basic-item" @click="insertPresetText('3d')">
            <span class="basic-icon icon-3d">
              <strong>T</strong>
              <i class="cube-mark"></i>
            </span>
            <span class="basic-label">3D文字</span>
          </button>
        </div>
      </div>

      <div v-for="section in previewSections" :key="section.key" class="text-section">
        <div class="section-header">
          <span class="section-title">{{ section.label }}</span>
          <button class="section-more" @click="enterCategoryView(section.key)">
            查看分类 <span class="pptfont ppt-operate-subordinate icon-more" />
          </button>
        </div>

        <div class="asset-grid" :class="[`asset-grid-${section.key}`]">
          <button
            v-for="(item, index) in section.items.slice(0, section.previewCount)"
            :key="item.id"
            class="asset-item"
            @click="insertAssetImage(item)"
          >
            <img v-if="item.cover" :src="item.cover" :alt="item.title" loading="lazy" />
            <span v-else class="asset-fallback">{{ item.title }}</span>
            <span v-if="section.label.includes('推荐') && index > 0" class="asset-vip">
              <span class="pptfont ppt-general-VIP"></span>
            </span>
            <span v-if="section.label.includes('热门') && index === 0" class="asset-hot">Hot</span>
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

      <template v-if="activeSectionKey === 'basic'">
        <div class="text-basic-grid">
          <button
            v-for="item in basicCategoryItems"
            :key="item.key"
            class="basic-grid-item"
            @click="insertPresetText(item.key)"
          >
            <span class="basic-icon" :class="item.iconClass">
              <template v-if="item.key === 'title'"><strong>H</strong><sub>1</sub></template>
              <template v-else-if="item.key === '3d'">
                <strong>T</strong>
                <i class="cube-mark"></i>
              </template>
              <strong v-else>{{ item.symbol }}</strong>
            </span>
            <span class="basic-label">{{ item.label }}</span>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="asset-grid category-grid">
          <button
            v-for="item in currentCategoryItems"
            :key="item.id"
            class="asset-item"
            @click="insertAssetImage(item)"
          >
            <img v-if="item.cover" :src="item.cover" :alt="item.title" loading="lazy" />
            <span v-else class="asset-fallback">{{ item.title }}</span>
          </button>
          <div v-if="!currentCategoryItems.length" class="panel-empty">暂无内容</div>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import useCreateElement from '@/hooks/useCreateElement'
import editorApi from '@/api/editor'
import { mapMaterialOtherData } from '@/utils/material'

const props = defineProps<{ searchKeyword?: string }>()

interface AssetItem {
  id: string
  title: string
  cover?: string
  category: string
}

interface TextSection {
  key: string
  label: string
  categories: string[]
  previewCount: number
  items: AssetItem[]
}

type PresetKey = 'title' | 'subtitle' | 'body' | 'warp' | '3d' | 'vertical'

const slidesStore = useSlidesStore()
const { viewportRatio, viewportSize } = storeToRefs(slidesStore)
const { createTextElement, createImageElement } = useCreateElement()

const view = ref<'main' | 'category'>('main')
const activeSectionKey = ref('basic')
const activeCategory = ref('全部')

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}

const getPreviewCount = (label: string, index: number) => {
  if (label.includes('推荐')) return 4
  if (label.includes('热门')) return 12
  return index === 0 ? 4 : 12
}

const sections = reactive<TextSection[]>([
  {
    key: 'recommend',
    label: '为你推荐',
    categories: ['全部', '活力', '国风', '简约', '艺术'],
    previewCount: 4,
    items: [],
  },
  {
    key: 'hot',
    label: '热门素材',
    categories: ['全部', '热榜', '品牌', '活动', '创意'],
    previewCount: 12,
    items: [],
  },
])

const previewSections = computed(() => {
  return sections.filter(section => matchesSearch(section.label, ...section.categories, ...section.items.map(item => item.title)))
})
const currentSection = computed(() => sections.find(item => item.key === activeSectionKey.value))

const basicCategoryMap: Record<string, Array<{ key: PresetKey; label: string; symbol: string; iconClass?: string }>> = {
  '全部': [
    { key: 'title', label: '标题', symbol: 'H1' },
    { key: 'subtitle', label: '副标题', symbol: 'H' },
    { key: 'body', label: '正文', symbol: 'T' },
    { key: 'warp', label: '变形文字', symbol: 'T', iconClass: 'warp-icon' },
    { key: '3d', label: '3D文字', symbol: 'T', iconClass: 'icon-3d' },
    { key: 'vertical', label: '竖向文本', symbol: 'T', iconClass: 'vertical' },
  ],
  '基础': [
    { key: 'title', label: '标题', symbol: 'H1' },
    { key: 'subtitle', label: '副标题', symbol: 'H' },
    { key: 'body', label: '正文', symbol: 'T' },
  ],
  '创意': [
    { key: 'warp', label: '变形文字', symbol: 'T', iconClass: 'warp-icon' },
    { key: '3d', label: '3D文字', symbol: 'T', iconClass: 'icon-3d' },
  ],
  '排版': [
    { key: 'vertical', label: '竖向文本', symbol: 'T', iconClass: 'vertical' },
    { key: 'body', label: '正文', symbol: 'T' },
  ],
}

const basicCategoryItems = computed(() => {
  const list = basicCategoryMap[activeCategory.value] || basicCategoryMap['全部']
  return list.filter(item => matchesSearch(item.label))
})

const currentCategoryItems = computed(() => {
  const section = currentSection.value
  if (!section) return []
  const list = activeCategory.value === '全部'
    ? section.items
    : section.items.filter(item => item.category === activeCategory.value)
  return list.filter(item => matchesSearch(section.label, item.title, item.category, ...section.categories))
})

const insertText = (content: string, width: number, height: number, vertical = false) => {
  createTextElement({
    left: (viewportSize.value - width) / 2,
    top: (viewportSize.value * viewportRatio.value - height) / 2,
    width,
    height,
  }, {
    content,
    vertical,
  })
}

const insertPresetText = (key: PresetKey) => {
  if (key === 'title') {
    insertText('<p>请输入标题</p>', 420, 72)
  }
  else if (key === 'subtitle') {
    insertText('<p>请输入副标题</p>', 360, 60)
  }
  else if (key === 'body') {
    insertText('<p>请输入正文内容</p>', 460, 120)
  }
  else if (key === 'warp') {
    insertText('<p>创意文字</p>', 320, 72)
  }
  else if (key === '3d') {
    insertText('<p>3D文字</p>', 300, 72)
  }
  else {
    insertText('<p>竖向文本</p>', 90, 280, true)
  }
}

const insertAssetImage = (item: AssetItem) => {
  if (!item.cover) return
  createImageElement(item.cover)
}

const enterCategoryView = (sectionKey: string) => {
  activeSectionKey.value = sectionKey
  activeCategory.value = '全部'
  view.value = 'category'
}

onMounted(() => {
  const params: any = { typeId: 13 }
  editorApi.getMaterialOther(params).then((res: any) => {
    const types = Array.isArray(res?.data) ? res.data : []
    const textType = types.find((t: any) => t.typeName === '文字')
    if (!textType) return

    const mapped = mapMaterialOtherData([textType], 20)
    const newSections = mapped.map((item: any, index: number) => ({
      key: item.key,
      label: item.label,
      categories: item.categories,
      previewCount: getPreviewCount(item.label, index),
      items: item.items.map((img: any) => ({
        id: img.id,
        title: img.category,
        cover: img.src,
        category: img.category,
      })),
    }))
    if (newSections.length) {
      sections.splice(0, sections.length, ...newSections)
    }
  })
})
</script>

<style lang="scss" scoped>
.adv-text {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.text-section {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #edf0f5;
}

.text-section:last-child {
  border-bottom: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}

.section-header,
.cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.section-title,
.cat-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.section-more,
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 0;
  background: none;
  color: #7E8792;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  line-height: 1;

  .icon-more {
    font-size: 10px;
    transform: scale(0.85);
  }

  &:hover {
    color: #333;
  }
}

.text-basic-card {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  padding: 18px 6px 14px;
  background: #f5f5f5;
  border-radius: 12px;
}

.basic-item,
.basic-grid-item {
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #374151;
  min-height: 72px;
  justify-content: center;
  padding: 0 2px;

  &:hover {
    color: $themeColor;
  }
}

.basic-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;

  strong {
    font-size: 26px;
    line-height: 1;
    font-weight: 500;
  }

  sub {
    font-size: 14px;
    margin-left: 1px;
    font-weight: 500;
    vertical-align: baseline;
  }
}

.basic-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  line-height: 1;
}

.basic-item:hover .basic-label,
.basic-grid-item:hover .basic-label {
  color: $themeColor;
}

.warp-icon {
  width: 28px;
  height: 28px;
  border: 1.5px solid currentColor;
  border-radius: 4px;

  strong {
    font-size: 18px;
  }
}

.icon-3d {
  position: relative;
  padding-right: 10px;

  strong {
    font-style: italic;
    font-size: 24px;
  }

  .cube-mark {
    position: absolute;
    right: 0;
    bottom: 2px;
    width: 8px;
    height: 8px;
    border: 1.5px solid currentColor;
    border-radius: 1px;
    transform: rotate(12deg);
    box-shadow: 2px 2px 0 currentColor;
  }
}

.vertical {
  writing-mode: vertical-rl;
  height: 30px;

  strong {
    font-size: 20px;
  }
}

.text-basic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.basic-grid-item {
  min-height: 88px;
  border: 1px solid $borderColor;
  border-radius: 10px;
  background: #f8fafc;

  &:hover {
    border-color: $themeColor;
    background: #fff;
  }
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.category-grid {
  align-content: start;
}

.asset-item {
  position: relative;
  border: 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease, box-shadow 0.18s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &:hover {
    background: #edf3ff;
    box-shadow: inset 0 0 0 1px rgba(42, 106, 233, 0.35);
  }
}

.asset-vip {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  .ppt-general-VIP {
    font-size: 14px;
    color: #f5a623;
  }
}

.asset-hot {
  position: absolute;
  left: 0;
  top: 0;
  padding: 2px 6px;
  border-radius: 0 0 8px 0;
  background: linear-gradient(135deg, #ff6b4a, #ff3b30);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  pointer-events: none;
}

.asset-fallback {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  padding: 0 8px;
  text-align: center;
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
    color: #111827;
  }

  &.active {
    background: rgba(37, 99, 235, 0.1);
    color: $themeColor;
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.14);
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
