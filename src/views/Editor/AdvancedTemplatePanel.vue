<template>
  <div class="adv-tpl">
    <!-- 推荐模板标题 + 更多分类切换 -->
    <div class="tpl-header">
      <span class="tpl-title">推荐模板</span>
      <button class="more-btn" @click="toggleCatalogBar()">{{ showCatalogBar ? '收起分类' : '更多分类 >' }}</button>
    </div>

    <!-- 横向分类，点击即可切换 -->
    <div v-if="showCatalogBar" class="catalog-row">
      <button
        v-for="item in visibleTemplates"
        :key="item.id"
        class="catalog-chip"
        :class="{ active: activeCatalogId === item.id }"
        @click="selectCatalog(item.id)"
      >
        {{ item.name }}
      </button>
    </div>

    <div v-if="loading" class="tpl-loading">加载中…</div>

    <!-- 2列模板网格 -->
    <div v-else class="tpl-grid">
      <div
        v-for="slide in slides"
        :key="slide.id"
        class="tpl-item"
        @click="emit('select', slide)"
      >
        <ThumbnailSlide :slide="slide" :size="108" />
        <div class="tpl-overlay">应用</div>
      </div>
      <div v-if="!slides.length" class="tpl-empty">暂无模板数据</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { Slide, SlideTheme } from '@/types/slides'
import api from '@/services'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'

const props = defineProps<{ searchKeyword?: string }>()

const emit = defineEmits<{
  (e: 'select', slide: Slide): void
  (e: 'selectAll', payload: { slides: Slide[]; theme: Partial<SlideTheme> }): void
}>()

const { templates } = storeToRefs(useSlidesStore())
const slides = ref<Slide[]>([])
const theme = ref<Partial<SlideTheme>>({})
const loading = ref(false)
const catalogIdx = ref(0)
const activeCatalogId = ref('')
const showCatalogBar = ref(false)
const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const visibleTemplates = computed(() => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return templates.value
  return templates.value.filter(item => normalizeSearch(item.name).includes(keyword))
})

const loadCatalog = (id: string) => {
  loading.value = true
  activeCatalogId.value = id
  api.getMockData(id).then((ret: any) => {
    slides.value = ret.slides
    if (ret.theme) theme.value = ret.theme
    loading.value = false
  }).catch(() => { loading.value = false })
}

// 展开/收起分类栏
const toggleCatalogBar = () => {
  showCatalogBar.value = !showCatalogBar.value
}

// 点击分类切换模板
const selectCatalog = (id: string) => {
  const idx = templates.value.findIndex(item => item.id === id)
  if (idx >= 0) catalogIdx.value = idx
  loadCatalog(id)
}

onMounted(() => {
  if (templates.value.length) loadCatalog(templates.value[0].id)
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
  color: $themeColor;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover { text-decoration: underline; }
}

.tpl-loading,
.tpl-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  padding: 24px 0;
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.tpl-item {
  position: relative;
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
