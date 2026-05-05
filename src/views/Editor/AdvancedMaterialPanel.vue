<template>
  <div class="adv-material">

    <!-- ===== 主视图 ===== -->
    <template v-if="view === 'main'">

      <div v-if="loading" class="mat-loading">加载中…</div>

      <template v-else>
        <div v-for="sec in visibleSections" :key="sec.key" class="mat-section">
          <div class="section-header">
            <span class="section-title">{{ sec.label }}</span>
            <!-- 查看分类 → 进入分类视图 -->
            <button class="section-more" @click="enterCategoryView(sec.key)">查看分类 ›</button>
          </div>
          <!-- 展示分组内所有素材 -->
          <div class="mat-grid">
            <div
              v-for="item in sec.items" :key="item.id"
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
import editorApi from '@/api/editor'
import useCreateElement from '@/hooks/useCreateElement'
import { mapMaterialGroups } from '@/utils/material'
const props = defineProps<{ searchKeyword?: string }>()

interface ImgItem { id: number | string; width: number; height: number; src: string; category: string }

interface Section {
  key: string
  label: string
  categories: string[]  // 该分区下的分类列表
  items: ImgItem[]
}

const activeGroupKey = ref('')
const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}
const groupTabs = computed(() => {
  return sections.map(section => ({ key: section.key, label: section.label }))
})

const visibleSections = computed(() => {
  const source = activeGroupKey.value
    ? sections.filter(section => section.key === activeGroupKey.value)
    : sections

  return source.filter(section => matchesSearch(section.label, ...section.categories))
})

const { createImageElement } = useCreateElement()

// 视图状态：main=主视图，category=分类视图
const view = ref<'main' | 'category'>('main')
const loading = ref(false)

const sections = reactive<Section[]>([])

// 当前进入分类视图的分区key与选中分类
const activeSectionKey = ref('')
const activeCategory = ref('全部')

const currentSection = computed(() => sections.find(s => s.key === activeSectionKey.value))

const categoryItems = computed(() => {
  const sec = currentSection.value
  if (!sec) return []
  if (!matchesSearch(sec.label, activeCategory.value, ...sec.categories)) return []
  if (activeCategory.value === '全部') return sec.items
  return sec.items.filter(item => item.category === activeCategory.value)
})

const insertImage = (src: string) => createImageElement(src)

// 进入某分区的分类视图
const enterCategoryView = (key: string) => {
  activeSectionKey.value = key
  activeCategory.value = '全部'
  view.value = 'category'
}

const buildSectionsFromGroups = (groups: any[] = []): Section[] => {
  return mapMaterialGroups(groups, Infinity) as Section[]
}

onMounted(() => {
  loading.value = true
  editorApi.getMaterial().then((res: any) => {
    const groups = Array.isArray(res?.data) ? res.data : []
    const mapped = buildSectionsFromGroups(groups)
    sections.splice(0, sections.length, ...mapped)
  }).finally(() => {
    loading.value = false
  })
})
</script>

<style lang="scss" scoped>
.adv-material {
  display: flex;
  flex-direction: column;
  gap: 0;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
  padding: 20px 0;
}

.mat-loading::before {
  content: '';
  width: 64px;
  height: 64px;
  margin-bottom: 6px;
  background: url('@/assets/images/loading100.gif') center/contain no-repeat;
}
</style>
