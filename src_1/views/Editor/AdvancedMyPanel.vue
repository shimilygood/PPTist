<template>
  <div class="adv-my">
     <Tabs
        :tabs="topTabs"
        :value="activeTopTab"
        tabBtn
        :tabStyle="{ padding: '0 5px', borderRadius: '12px', minWidth: '62px', fontSize: '13px' }"
        @update:value="val => activeTopTab = val"
      />

    <template v-if="activeTopTab !== 'draft'">
      <div class="search-row">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input v-model="localKeyword" type="text" placeholder="输入您要搜索的内容" />
        </div>
        <button class="add-btn" @click="mainStore.setImageLibPanelState(true)">+ 添加</button>
      </div>
    </template>

    <template v-if="activeTopTab === 'mine'">
      <div class="sub-tabs-row">
        <div class="sub-tabs">
          <button
            v-for="tab in mineTabs"
            :key="tab.key"
            class="sub-tab"
            :class="{ active: activeMineTab === tab.key }"
            @click="activeMineTab = tab.key"
          >{{ tab.label }}</button>
        </div>
        <div class="sub-actions">
          <button class="icon-btn filter" aria-label="筛选"></button>
          <button class="icon-btn more" aria-label="更多"></button>
        </div>
      </div>

      <template v-if="activeMineTab === 'upload'">
        <div v-if="uploadedItems.length" class="card-grid two-col">
          <button
            v-for="item in filteredUploadedItems"
            :key="item.id"
            class="asset-card"
            @click="insertImage(item.src)"
          >
            <img :src="item.src" :alt="item.title" loading="lazy" />
          </button>
        </div>

        <div v-else class="upload-empty">
          <div class="empty-illust">
            <div class="folder-shape"></div>
          </div>
          <div class="empty-tip">拖放图片或视频到这里，开始创作</div>
          <FileInput class="upload-input" @change="files => uploadLocalFiles(files)">
            <button class="choose-btn">选择文件</button>
          </FileInput>
        </div>
      </template>

      <template v-else-if="activeMineTab === 'work'">
        <button
          v-if="mainBanner"
          class="banner-card"
          @click="insertImage(mainBanner.src)"
        >
          <img :src="mainBanner.src" :alt="mainBanner.title" loading="lazy" />
          <span class="card-index">1</span>
        </button>

        <div class="card-list">
          <button
            v-for="(item, index) in filteredWorkItems"
            :key="item.id"
            class="list-card"
            @click="insertImage(item.src)"
          >
            <img :src="item.src" :alt="item.title" loading="lazy" />
            <span class="card-index">{{ index + 2 }}</span>
          </button>
        </div>
      </template>

      <template v-else>
        <button
          v-if="mainBanner"
          class="banner-card"
          @click="insertImage(mainBanner.src)"
        >
          <img :src="mainBanner.src" :alt="mainBanner.title" loading="lazy" />
        </button>

        <div class="card-grid two-col">
          <button
            v-for="item in filteredCopyrightMain"
            :key="item.id"
            class="asset-card"
            :class="{ portrait: item.layout === 'portrait' }"
            @click="insertImage(item.src)"
          >
            <img :src="item.src" :alt="item.title" loading="lazy" />
          </button>
        </div>

        <div class="card-grid three-col">
          <button
            v-for="item in filteredCopyrightSticker"
            :key="item.id"
            class="asset-card square"
            @click="insertImage(item.src)"
          >
            <img :src="item.src" :alt="item.title" loading="lazy" />
          </button>
        </div>

        <div class="card-grid four-col">
          <button
            v-for="item in filteredCopyrightIcon"
            :key="item.id"
            class="asset-card icon"
            @click="insertImage(item.src)"
          >
            <img :src="item.src" :alt="item.title" loading="lazy" />
          </button>
        </div>
      </template>
    </template>

    <template v-else-if="activeTopTab === 'favorite'">
      <button
        v-if="mainBanner"
        class="banner-card"
        @click="insertImage(mainBanner.src)"
      >
        <img :src="mainBanner.src" :alt="mainBanner.title" loading="lazy" />
      </button>

      <div class="card-grid two-col">
        <button
          v-for="item in filteredFavoriteItems"
          :key="item.id"
          class="asset-card"
          :class="{ portrait: item.layout === 'portrait' }"
          @click="insertImage(item.src)"
        >
          <img :src="item.src" :alt="item.title" loading="lazy" />
        </button>
      </div>
    </template>

    <template v-else>
      <button
        v-if="mainBanner"
        class="banner-card"
        @click="insertImage(mainBanner.src)"
      >
        <img :src="mainBanner.src" :alt="mainBanner.title" loading="lazy" />
      </button>

      <div class="card-grid two-col">
        <button
          v-for="item in filteredDraftItems"
          :key="item.id"
          class="asset-card"
          @click="insertImage(item.src)"
        >
          <img :src="item.src" :alt="item.title" loading="lazy" />
          <span class="draft-tag">图片</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import Tabs from '@/components/Tabs.vue'
import { useMainStore } from '@/store'
import useCreateElement from '@/hooks/useCreateElement'
import { getImageDataURL } from '@/utils/image'
import FileInput from '@/components/FileInput.vue'
import api from '@/services'

interface MyAsset {
  id: string
  title: string
  src: string
  layout?: 'landscape' | 'portrait' | 'square'
  tags?: string[]
}

const mainStore = useMainStore()
const { createImageElement } = useCreateElement()

const topTabs = [
  { key: 'mine', label: '我的' },
  { key: 'favorite', label: '收藏' },
  { key: 'draft', label: '草稿' },
]

const mineTabs = [
  { key: 'work', label: '作品' },
  { key: 'copyright', label: '版权资产' },
  { key: 'upload', label: '我的上传' },
]

const activeTopTab = ref<string>('mine')
const activeMineTab = ref<string>('work')
const localKeyword = ref('')

const mainBanner = ref<MyAsset | null>(null)
const workItems = ref<MyAsset[]>([])
const copyrightMain = ref<MyAsset[]>([])
const copyrightSticker = ref<MyAsset[]>([])
const copyrightIcon = ref<MyAsset[]>([])
const favoriteItems = ref<MyAsset[]>([])
const draftItems = ref<MyAsset[]>([])
const uploadedItems = ref<MyAsset[]>([])

const normalizeSearch = (text: string) => text.toLowerCase().replace(/[\s/]+/g, '')
const matchesSearch = (item: MyAsset) => {
  const keyword = normalizeSearch(localKeyword.value || '')
  if (!keyword) return true
  return [item.title, ...(item.tags || [])].some(text => normalizeSearch(text).includes(keyword))
}

const filteredWorkItems = computed(() => workItems.value.filter(matchesSearch))
const filteredCopyrightMain = computed(() => copyrightMain.value.filter(matchesSearch))
const filteredCopyrightSticker = computed(() => copyrightSticker.value.filter(matchesSearch))
const filteredCopyrightIcon = computed(() => copyrightIcon.value.filter(matchesSearch))
const filteredFavoriteItems = computed(() => favoriteItems.value.filter(matchesSearch))
const filteredDraftItems = computed(() => draftItems.value.filter(matchesSearch))
const filteredUploadedItems = computed(() => uploadedItems.value.filter(matchesSearch))

const insertImage = (src: string) => {
  if (!src) return
  createImageElement(src)
}

const uploadLocalFiles = (files: FileList) => {
  const fileList = Array.from(files || [])
  if (!fileList.length) return

  Promise.all(fileList.map(file => getImageDataURL(file))).then(urls => {
    const newItems = urls.map((src, index) => ({
      id: `upload-${Date.now()}-${index}`,
      title: '我的上传',
      src,
      layout: 'landscape' as const,
      tags: ['我的上传', '本地'],
    }))
    uploadedItems.value = [...newItems, ...uploadedItems.value]
  })
}

onMounted(() => {
  api.getMockData('imgs').then((data: any) => {
    const imgs: string[] = (Array.isArray(data) ? data : (data.imgs || [])).map((item: any) => item.src)

    mainBanner.value = {
      id: 'banner-0',
      title: '我的封面',
      src: imgs[0] || '',
      layout: 'landscape',
      tags: ['封面', '作品'],
    }

    workItems.value = [
      { id: 'work-1', title: '作品 1', src: imgs[1] || '', tags: ['作品'] },
      { id: 'work-2', title: '作品 2', src: imgs[2] || '', tags: ['作品'] },
      { id: 'work-3', title: '作品 3', src: imgs[3] || '', tags: ['作品'] },
      { id: 'work-4', title: '作品 4', src: imgs[4] || '', tags: ['作品'] },
    ]

    copyrightMain.value = [
      { id: 'cp-main-1', title: '版权资产 1', src: imgs[5] || '', layout: 'landscape', tags: ['版权资产'] },
      { id: 'cp-main-2', title: '版权资产 2', src: imgs[6] || '', layout: 'landscape', tags: ['版权资产'] },
      { id: 'cp-main-3', title: '版权资产 3', src: imgs[7] || '', layout: 'portrait', tags: ['版权资产'] },
      { id: 'cp-main-4', title: '版权资产 4', src: imgs[8] || '', layout: 'portrait', tags: ['版权资产'] },
    ]

    copyrightSticker.value = [
      { id: 'cp-sticker-1', title: '贴纸 1', src: imgs[9] || '', layout: 'square', tags: ['贴纸', '版权资产'] },
      { id: 'cp-sticker-2', title: '贴纸 2', src: imgs[10] || '', layout: 'square', tags: ['贴纸', '版权资产'] },
      { id: 'cp-sticker-3', title: '贴纸 3', src: imgs[11] || '', layout: 'square', tags: ['贴纸', '版权资产'] },
    ]

    copyrightIcon.value = [
      { id: 'cp-icon-1', title: '图标 1', src: imgs[12] || '', layout: 'square', tags: ['图标', '版权资产'] },
      { id: 'cp-icon-2', title: '图标 2', src: imgs[13] || '', layout: 'square', tags: ['图标', '版权资产'] },
      { id: 'cp-icon-3', title: '图标 3', src: imgs[14] || '', layout: 'square', tags: ['图标', '版权资产'] },
      { id: 'cp-icon-4', title: '图标 4', src: imgs[15] || '', layout: 'square', tags: ['图标', '版权资产'] },
    ]

    favoriteItems.value = [
      { id: 'fav-1', title: '收藏 1', src: imgs[16] || '', layout: 'landscape', tags: ['收藏'] },
      { id: 'fav-2', title: '收藏 2', src: imgs[17] || '', layout: 'landscape', tags: ['收藏'] },
      { id: 'fav-3', title: '收藏 3', src: imgs[18] || '', layout: 'portrait', tags: ['收藏'] },
      { id: 'fav-4', title: '收藏 4', src: imgs[19] || '', layout: 'portrait', tags: ['收藏'] },
      { id: 'fav-5', title: '收藏 5', src: imgs[20] || '', layout: 'landscape', tags: ['收藏'] },
      { id: 'fav-6', title: '收藏 6', src: imgs[21] || '', layout: 'landscape', tags: ['收藏'] },
    ]

    draftItems.value = [
      { id: 'draft-1', title: '草稿 1', src: imgs[22] || '', layout: 'landscape', tags: ['草稿'] },
      { id: 'draft-2', title: '草稿 2', src: imgs[23] || '', layout: 'landscape', tags: ['草稿'] },
    ]
  }).catch(() => {
    mainBanner.value = null
  })
})
</script>

<style lang="scss" scoped>
.adv-my {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.top-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  background: #f1f3f8;
}

.top-tab {
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #1f2937;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  word-break: keep-all;

  &.active {
    background: $themeColor;
    color: #fff;
  }
}

.search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 10px;
}

.search-box {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid $borderColor;
  border-radius: 10px;
  background: #fff;
  padding: 0 12px;

  .search-icon {
    color: #9ca3af;
    font-size: 18px;
    line-height: 1;
  }

  input {
    flex: 1;
    border: 0;
    outline: 0;
    font-size: 11px;
    color: #374151;
    background: transparent;

    &::placeholder {
      color: #9ca3af;
    }
  }
}

.add-btn {
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: #f2f4f8;
  color: $themeColor;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.sub-tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  gap: 8px;
  min-width: 0;
}

.sub-tabs {
  display: flex;
  gap: 14px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.sub-tab {
  display: inline-flex;
  align-items: center;
  border: 0;
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  line-height: 24px;
  transition: color 0.2s ease;
  white-space: nowrap;
  word-break: keep-all;
  flex: 0 0 auto;

  &.active {
    color: #111827;
  }
}

.sub-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.icon-btn {
  width: 22px;
  height: 22px;
  border: 0;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  padding: 0;
  position: relative;

  &.filter::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 3px;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top: 0;
    clip-path: polygon(0 0, 100% 0, 62% 45%, 62% 100%, 38% 100%, 38% 45%);
    border-radius: 1px;
  }

  &.more::before {
    content: '•••';
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 12px;
    letter-spacing: 1px;
  }
}

.banner-card {
  border: 0;
  border-radius: 14px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #eef3f9;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
  }

  img {
    width: 100%;
    aspect-ratio: 2.2;
    object-fit: cover;
    display: block;
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-card {
  border: 0;
  border-radius: 14px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #eef3f9;
  transition: transform 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-1px);
  }

  img {
    width: 100%;
    aspect-ratio: 2.2;
    object-fit: cover;
    display: block;
  }
}

.card-grid {
  display: grid;
  gap: 10px;
}

.two-col {
  grid-template-columns: repeat(2, 1fr);
}

.three-col {
  grid-template-columns: repeat(3, 1fr);
}

.four-col {
  grid-template-columns: repeat(4, 1fr);
}

.asset-card {
  border: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #eef3f9;
  padding: 0;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  img {
    width: 100%;
    aspect-ratio: 1.42;
    object-fit: cover;
    display: block;
  }

  &.portrait img {
    aspect-ratio: 0.78;
  }

  &.square img {
    aspect-ratio: 1;
  }

  &.icon {
    background: #f4f6fb;

    img {
      aspect-ratio: 1;
      object-fit: contain;
      padding: 14px;
    }
  }
}

.draft-tag {
  position: absolute;
  left: 8px;
  bottom: 8px;
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.5);
  color: #fff;
  font-size: 14px;
  line-height: 24px;
}

.card-index {
  position: absolute;
  left: 10px;
  top: 8px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.78);
  color: #111827;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  backdrop-filter: blur(1px);
}

.upload-empty {
  min-height: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-illust {
  width: 180px;
  height: 130px;
  display: grid;
  place-items: center;
}

.folder-shape {
  width: 130px;
  height: 86px;
  border-radius: 12px 12px 16px 16px;
  background: linear-gradient(135deg, #2f79ff 0%, #83d2ff 100%);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 12px;
    top: -16px;
    width: 56px;
    height: 20px;
    border-radius: 8px 8px 0 0;
    background: #8fd2ff;
  }
}

.empty-tip {
  color: #6b7280;
  font-size: 14px;
}

.upload-input :deep(.file-input) {
  width: 100%;
  height: 100%;
}

.choose-btn {
  border: 0;
  background: transparent;
  color: $themeColor;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
