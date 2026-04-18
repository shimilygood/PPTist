<template>
  <div class="adv-ai">
    <div class="section-heading">创建新的内容</div>

    <div class="ai-grid">
      <button
        v-for="tool in visibleTools"
        :key="tool.key"
        class="ai-card"
        :title="tool.label"
        @click="insertImage(tool.cover)"
      >
        <div class="ai-card-img">
          <img :src="tool.cover" :alt="tool.label" loading="lazy" />
        </div>
        <div class="ai-card-label">{{ tool.label }}</div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import useCreateElement from '@/hooks/useCreateElement'
import api from '@/services'

const props = defineProps<{ searchKeyword?: string }>()

const { createImageElement } = useCreateElement()

interface AITool {
  key: string
  label: string
  cover: string
}

const tools = ref<AITool[]>([
  { key: 'ai-bg', label: 'AI 背景', cover: '' },
  { key: 'ai-draw', label: 'AI 绘图', cover: '' },
  { key: 'ai-material', label: 'AI 素材', cover: '' },
  { key: 'ai-expand', label: 'AI 扩写', cover: '' },
  { key: 'ai-copy', label: 'AI 文案', cover: '' },
  { key: 'ai-summarize', label: 'AI 缩写', cover: '' },
  { key: 'ai-translate', label: 'AI 翻译', cover: '' },
  { key: 'ai-polish', label: 'AI 润色', cover: '' },
])

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}

const visibleTools = computed(() =>
  tools.value.filter(tool => matchesSearch(tool.label, tool.key))
)

const insertImage = (src: string) => {
  if (!src) return
  createImageElement(src)
}

onMounted(() => {
  api.getMockData('imgs').then((data: any) => {
    const imgs: string[] = (Array.isArray(data) ? data : (data.imgs || [])).map((item: any) => item.src)
    tools.value = tools.value.map((tool, index) => ({
      ...tool,
      cover: imgs[index] || '',
    }))
  }).catch(() => {})
})
</script>

<style lang="scss" scoped>
.adv-ai {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-heading {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  padding: 4px 0;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ai-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 1.5px solid $borderColor;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: $themeColor;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
}

.ai-card-img {
  width: 100%;
  aspect-ratio: 1;
  background: #f0f4f8;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.ai-card-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  padding: 0 8px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
