<template>
  <div class="adv-ai">
    <div class="section-heading">创建新的内容</div>

    <div class="ai-grid">
      <button
        v-for="tool in visibleTools"
        :key="tool.key"
        class="ai-card"
        :title="tool.label"
        @click="handleToolClick()"
      >
        <div class="ai-card-img">
          <img :src="tool.cover" :alt="tool.label" loading="lazy" />
        </div>
        <div class="ai-card-label">{{ tool.label }}</div>
      </button>
    </div>

    <div v-if="!visibleTools.length" class="ai-empty">
      <img src="@/assets/images/nodeta.png" class="ai-empty-img" alt="" />
      <span>暂无相关内容</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import aiBg1 from '@/assets/images/ai-bg-1.png'
import aiBg2 from '@/assets/images/ai-bg-2.png'
import aiBg3 from '@/assets/images/ai-bg-3.png'
import aiBg4 from '@/assets/images/ai-bg-4.png'
import aiBg5 from '@/assets/images/ai-bg-5.png'
import aiBg6 from '@/assets/images/ai-bg-6.png'
import aiBg7 from '@/assets/images/ai-bg-7.png'
import aiBg8 from '@/assets/images/ai-bg-8.png'

const props = defineProps<{ searchKeyword?: string }>()

const emit = defineEmits<{
  (e: 'openAI'): void
}>()

interface AITool {
  key: string
  label: string
  cover: string
}

const tools: AITool[] = [
  { key: 'ai-bg', label: 'AI 背景', cover: aiBg1 },
  { key: 'ai-draw', label: 'AI 绘图', cover: aiBg2 },
  { key: 'ai-material', label: 'AI 素材', cover: aiBg3 },
  { key: 'ai-expand', label: 'AI 扩写', cover: aiBg4 },
  { key: 'ai-copy', label: 'AI 文案', cover: aiBg5 },
  { key: 'ai-summarize', label: 'AI 缩写', cover: aiBg6 },
  { key: 'ai-translate', label: 'AI 翻译', cover: aiBg7 },
  { key: 'ai-polish', label: 'AI 润色', cover: aiBg8 },
]

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (...texts: string[]) => {
  const keyword = normalizeSearch(props.searchKeyword || '')
  if (!keyword) return true
  return texts.some(text => normalizeSearch(text).includes(keyword))
}

const visibleTools = computed(() =>
  tools.filter(tool => matchesSearch(tool.label, tool.key))
)

const handleToolClick = () => {
  emit('openAI')
}
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
  border-radius: 4px;
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
    object-fit: contain;
    display: block;
  }
}

.ai-empty {
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

.ai-empty-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 8px;
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
