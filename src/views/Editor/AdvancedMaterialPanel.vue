<template>
  <div class="adv-material">

    <!-- ===== 主视图 ===== -->
    <template v-if="view === 'main'">
      <!-- 顶部类型快捷按钮 -->
      <div class="type-row">
        <button
          v-for="t in typeList" :key="t.key"
          class="type-chip" :class="{ active: activeType === t.key }"
          @click="activeType = t.key"
        >{{ t.label }}</button>
      </div>

      <div v-if="loading" class="mat-loading">加载中…</div>

      <template v-else>
        <div v-for="sec in sections" :key="sec.key" class="mat-section">
          <div class="section-header">
            <span class="section-title">{{ sec.label }}</span>
            <!-- 查看分类 → 进入分类视图 -->
            <button class="section-more" @click="enterCategoryView(sec.key)">查看分类 ›</button>
          </div>
          <!-- 固定展示2行(8个)预览 -->
          <div class="mat-grid">
            <div
              v-for="item in sec.items.slice(0, 8)" :key="item.id"
              class="mat-item" @click="insertImage(item.src)"
            >
              <img :src="item.src" loading="lazy" />
            </div>
            <div v-if="!sec.items.length" class="mat-empty">暂无数据</div>
          </div>
        </div>
      </template>
    </template>

    <!-- ===== 分类视图 ===== -->
    <template v-else-if="view === 'category'">
      <!-- 返回标题栏 -->
      <div class="cat-header">
        <button class="back-btn" @click="view = 'main'">‹ 返回</button>
        <span class="cat-title">{{ currentSection?.label }}</span>
      </div>

      <!-- 分类横向列表 -->
      <div class="cat-tabs">
        <button
          v-for="cat in currentSection!.categories" :key="cat"
          class="cat-tab" :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >{{ cat }}</button>
      </div>

      <!-- 分类内容 4列网格（全部展示） -->
      <div class="mat-grid cat-grid">
        <div
          v-for="item in categoryItems" :key="item.id"
          class="mat-item" @click="insertImage(item.src)"
        >
          <img :src="item.src" loading="lazy" />
        </div>
        <div v-if="!categoryItems.length" class="mat-empty">暂无数据</div>
      </div>
    </template>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api from '@/services'
import useCreateElement from '@/hooks/useCreateElement'
const props = defineProps<{ searchKeyword?: string }>()

interface ImgItem { id: number; width: number; height: number; src: string }

interface Section {
  key: string
  label: string
  categories: string[]  // 该分区下的分类列表
  items: ImgItem[]
}

const typeList = [
  { key: 'shape', label: '形状' },
  { key: 'container', label: '容器' },
  { key: 'arrow', label: '箭头' },
  { key: 'frame', label: '边框' },
]
const activeType = ref('shape')
const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}
const visibleSections = computed(() => {
  return sections.filter(section => matchesSearch(section.label, ...section.categories, ...typeList.map(item => item.label)))
})

const { createImageElement } = useCreateElement()

// 视图状态：main=主视图，category=分类视图
const view = ref<'main' | 'category'>('main')
const loading = ref(false)
const allImgs = ref<ImgItem[]>([])

// 三个分区，每个分区有自己的分类列表
const sections = reactive<Section[]>([
  {
    key: 'sticker',
    label: '贴纸',
    categories: ['全部', '表情', '自然', '趣味', '节日'],
    items: [],
  },
  {
    key: 'shape',
    label: '形状',
    categories: ['全部', '几何', '箭头', '线条', '容器', '边框'],
    items: [],
  },
  {
    key: 'popular',
    label: '热门素材',
    categories: ['全部', '3D', '插画', '图标', '手绘'],
    items: [],
  },
])

// 当前进入分类视图的分区key与选中分类
const activeSectionKey = ref('')
const activeCategory = ref('全部')

const currentSection = computed(() => sections.find(s => s.key === activeSectionKey.value))

// 分类视图的条目：按分类截取不同切片（全部=全量，其他各取8张模拟区分）
const categoryItems = computed(() => {
  const sec = currentSection.value
  if (!sec) return []
  if (!matchesSearch(sec.label, activeCategory.value, ...sec.categories)) return []
  if (activeCategory.value === '全部') return sec.items
  // 用分类 index 做偏移切片，模拟不同分类展示不同内容
  const idx = sec.categories.indexOf(activeCategory.value)
  const per = 8
  return sec.items.slice((idx * per) % Math.max(sec.items.length, 1))
})

const insertImage = (src: string) => createImageElement(src)

// 进入某分区的分类视图
const enterCategoryView = (key: string) => {
  activeSectionKey.value = key
  activeCategory.value = '全部'
  view.value = 'category'
}

const splitImgs = (imgs: ImgItem[]) => {
  const per = 12
  sections[0].items = imgs.slice(0, per)
  sections[1].items = imgs.slice(per, per * 2)
  sections[2].items = imgs.slice(per * 2)
}

onMounted(() => {
  loading.value = true
  api.getMockData('imgs').then((data: any) => {
    const list: ImgItem[] = Array.isArray(data) ? data : (data.imgs || [])
    allImgs.value = list
    splitImgs(list)
    loading.value = false
  }).catch(() => { loading.value = false })
})
</script>

<style lang="scss" scoped>
.adv-material {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 顶部类型按钮行 */
.type-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.type-chip {
  height: 30px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid $borderColor;
  background: #f8fafc;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;

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

/* 分区 */
.mat-section {
  margin-bottom: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.section-more {
  font-size: 12px;
  color: $themeColor;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover { text-decoration: underline; }
}

/* 分类视图 */
.cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.back-btn {
  font-size: 13px;
  color: $themeColor;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-weight: 600;
  flex-shrink: 0;

  &:hover { text-decoration: underline; }
}

.cat-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.cat-tab {
  min-width: 68px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 0;
  background: #f3f5fb;
  font-size: 13px;
  font-weight: 600;
  color: #2f3643;
  cursor: pointer;
  transition: all 0.15s;

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

.cat-grid {
  flex: 1;
}

/* 4列图标网格 */
.mat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.mat-item {
  aspect-ratio: 1;
  background: #f5f7fc;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1.5px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 4px;
  }

  &:hover {
    border-color: $themeColor;
    background: #edf3ff;
  }
}

.mat-loading,
.mat-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  padding: 20px 0;
}
</style>
