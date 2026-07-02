<template>
  <div class="adv-my">
    <Tabs
      class="toolbar-tabs"
      :tabs="topTabs"
      :value="activeTopTab"
      tabBtn
      :tabStyle="{ padding: '0 5px', borderRadius: '12px', minWidth: '62px', fontSize: '13px' }"
      @update:value="val => handleTopTabChange(val)"
    />

    <template v-if="activeTopTab !== 'draft'">
      <div class="search-row">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="localKeyword"
            type="text"
            placeholder="请输入您要搜索的内容"
            @keyup.enter="handleSearch"
          />
        </div>
        <FileInput class="top-upload-input" accept="image/*,video/*" @change="files => handleTopUpload(files)">
          <button class="add-btn">+ 添加</button>
        </FileInput>
      </div>
    </template>

    <div v-if="pageLoading" class="panel-loading">加载中...</div>

    <template v-else-if="activeTopTab === 'mine'">
      <template v-if="!folderList.length && !contentList.length">
        <div class="upload-empty">
          <div class="empty-illust">
            <div class="folder-shape"></div>
          </div>
          <div class="empty-tip">拖放图片或视频到这里，开始创作</div>
          <FileInput class="upload-input" accept="image/*,video/*" @change="files => handleTopUpload(files)">
            <button class="choose-btn">选择文件</button>
          </FileInput>
        </div>
      </template>

      <template v-else>
        <div v-if="activeFolderUid" class="folder-back-row">
          <button class="folder-back-btn" @click="backToRoot">‹ 返回</button>
          <span class="folder-back-name">{{ activeFolderName }}</span>
        </div>

        <div v-if="!activeFolderUid && folderList.length" class="section-block">
          <div class="section-title">文件夹 ({{ folderList.length }})</div>
          <div class="folder-row">
            <button
              v-for="item in folderList"
              :key="item.uid"
              class="folder-item"
              @click="openFolder(item)"
            >
              <span class="folder-icon"></span>
              <span class="folder-name">{{ item.name }}</span>
            </button>
          </div>
        </div>

        <div v-if="contentList.length" class="section-block">
          <div class="section-title">内容 ({{ contentTotal || contentList.length }})</div>
          <div v-if="!activeFolderUid" class="filter-row">
            <button
              v-for="tab in contentFilters"
              :key="tab.key"
              class="filter-chip"
              :class="{ active: activeContentFilter === tab.key }"
              @click="handleContentFilterChange(tab.key)"
            >{{ tab.label }}</button>
          </div>

          <button
            v-if="featuredItem"
            class="banner-card"
            @click="handleItemClick(featuredItem)"
          >
            <img :src="featuredItem.previewUrl" :alt="featuredItem.name" loading="lazy" />
          </button>

          <div class="card-grid two-col">
            <button
              v-for="item in gridItems"
              :key="item.id"
              class="asset-card"
              :class="{ portrait: item.layout === 'portrait' }"
              @click="handleItemClick(item)"
            >
              <img :src="item.previewUrl" :alt="item.name" loading="lazy" />
              <span v-if="item.businessTypeLabel" class="type-tag">{{ item.businessTypeLabel }}</span>
            </button>
          </div>
        </div>
      </template>
    </template>

    <template v-else-if="activeTopTab === 'favorite'">
      <template v-if="!favoriteList.length">
        <div class="panel-empty">暂无收藏内容</div>
      </template>
      <template v-else>
        <button
          v-if="favoriteFeatured"
          class="banner-card"
          @click="handleItemClick(favoriteFeatured)"
        >
          <img :src="favoriteFeatured.previewUrl" :alt="favoriteFeatured.name" loading="lazy" />
        </button>
        <div class="card-grid two-col">
          <button
            v-for="item in favoriteGridItems"
            :key="item.id"
            class="asset-card"
            :class="{ portrait: item.layout === 'portrait' }"
            @click="handleItemClick(item)"
          >
            <img :src="item.previewUrl" :alt="item.name" loading="lazy" />
          </button>
        </div>
      </template>
    </template>

    <template v-else>
      <template v-if="!draftList.length">
        <div class="panel-empty">暂无草稿</div>
      </template>
      <template v-else>
        <button
          v-if="draftFeatured"
          class="banner-card"
          @click="handleItemClick(draftFeatured)"
        >
          <img :src="draftFeatured.previewUrl" :alt="draftFeatured.name" loading="lazy" />
        </button>
        <div class="card-grid two-col">
          <button
            v-for="item in draftGridItems"
            :key="item.id"
            class="asset-card"
            @click="handleItemClick(item)"
          >
            <img :src="item.previewUrl" :alt="item.name" loading="lazy" />
            <span v-if="item.businessTypeLabel" class="type-tag">{{ item.businessTypeLabel }}</span>
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import Tabs from '@/components/Tabs.vue'
import useCreateElement from '@/hooks/useCreateElement'
import { getImageDataURL } from '@/utils/image'
import FileInput from '@/components/FileInput.vue'
import {
  GetSubstationCollectList,
  GetSubstationInfo,
  GetSubstationMyAllWorkList,
  GetSubstationMyWorkList,
} from '@/api/editor'

const { createImageElement } = useCreateElement()

const topTabs = [
  { key: 'mine', label: '我的' },
  { key: 'favorite', label: '收藏' },
  { key: 'draft', label: '草稿箱' },
]

const contentFilters = [
  { key: 'all', label: '全部' },
  { key: '1', label: '模板' },
  { key: '0', label: '素材' },
  { key: '2', label: 'AI生成' },
]

const businessTypeMap: any = {
  0: '图片',
  1: '语音',
  2: '视频',
  3: 'PPT',
}

const activeTopTab = ref('mine')
const activeContentFilter = ref('all')
const localKeyword = ref('')
const pageLoading = ref(false)

const folderList = ref<any[]>([])
const contentList = ref<any[]>([])
const contentTotal = ref(0)
const favoriteList = ref<any[]>([])
const draftList = ref<any[]>([])

const activeFolderUid = ref('')
const activeFolderName = ref('')

const mapLayout = (width: any, height: any) => {
  const w = Number(width)
  const h = Number(height)
  if (Number.isFinite(w) && Number.isFinite(h) && h > w) return 'portrait'
  return 'landscape'
}

const mapWorkItem = (item: any) => ({
  id: item.id || item.materialId,
  name: item.name || item.materialName || '',
  previewUrl: item.previewUrl || '',
  url: item.url || item.materialUrl || '',
  width: item.width,
  height: item.height,
  type: item.type,
  businessType: item.businessType,
  businessTypeLabel: businessTypeMap[item.businessType] || '',
  isPublish: item.isPublish,
  layout: mapLayout(item.width, item.height),
})

const mapCollectItem = (item: any) => {
  const typeLabel = item.type === '0' ? '素材' : item.type === '1' ? '模板' : ''
  return {
    id: item.id,
    name: item.name || '',
    previewUrl: item.previewUrl || '',
    url: item.url || '',
    width: item.width,
    height: item.height,
    type: item.type,
    businessTypeLabel: typeLabel,
    layout: mapLayout(item.width, item.height),
  }
}

const featuredItem = computed(() => contentList.value[0] || null)
const gridItems = computed(() => contentList.value.slice(1))
const favoriteFeatured = computed(() => favoriteList.value[0] || null)
const favoriteGridItems = computed(() => favoriteList.value.slice(1))
const draftFeatured = computed(() => draftList.value[0] || null)
const draftGridItems = computed(() => draftList.value.slice(1))

const insertImage = (src: string) => {
  if (!src) return
  createImageElement(src)
}

const handleItemClick = (item: any) => {
  const src = item.previewUrl || item.url
  if (!src) return
  insertImage(src)
}

const fetchMyContent = () => {
  pageLoading.value = true
  const params: any = {
    pageNo: 1,
    pageSize: 100,
    keyword: localKeyword.value || undefined,
  }
  if (activeContentFilter.value !== 'all') {
    params.type = Number(activeContentFilter.value)
  }
  GetSubstationMyAllWorkList(params).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      contentTotal.value = Number(res.data?.total) || list.length
      contentList.value = list.map(mapWorkItem)
    } else {
      contentList.value = []
      contentTotal.value = 0
    }
  }).finally(() => {
    pageLoading.value = false
  })
}

const fetchFolderContent = () => {
  pageLoading.value = true
  const params: any = {
    pageNo: 1,
    pageSize: 100,
    folderUid: activeFolderUid.value,
    keywords: localKeyword.value || undefined,
    sort: [{ key: 'createdAt', order: 'DESC' }],
  }
  GetSubstationInfo(params).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      contentTotal.value = Number(res.data?.total) || list.length
      contentList.value = list
        .filter((item: any) => item.sourceType === 4)
        .map(mapWorkItem)
    } else {
      contentList.value = []
      contentTotal.value = 0
    }
  }).finally(() => {
    pageLoading.value = false
  })
}

const fetchMineData = () => {
  if (activeFolderUid.value) {
    fetchFolderContent()
    return
  }
  pageLoading.value = true
  const folderParams: any = {
    pageNo: 1,
    pageSize: 100,
    keywords: localKeyword.value || undefined,
    sort: [{ key: 'createdAt', order: 'DESC' }],
  }
  const contentParams: any = {
    pageNo: 1,
    pageSize: 100,
    keyword: localKeyword.value || undefined,
  }
  if (activeContentFilter.value !== 'all') {
    contentParams.type = Number(activeContentFilter.value)
  }

  let folderDone = false
  let contentDone = false
  const finishLoading = () => {
    if (folderDone && contentDone) pageLoading.value = false
  }

  GetSubstationInfo(folderParams).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      folderList.value = list
        .filter((item: any) => item.sourceType === 2)
        .map((item: any) => ({
          uid: item.uid,
          name: item.name,
          materialCount: item.materialCount,
        }))
    }
  }).finally(() => {
    folderDone = true
    finishLoading()
  })

  GetSubstationMyAllWorkList(contentParams).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      contentTotal.value = Number(res.data?.total) || list.length
      contentList.value = list.map(mapWorkItem)
    } else {
      contentList.value = []
      contentTotal.value = 0
    }
  }).finally(() => {
    contentDone = true
    finishLoading()
  })
}

const fetchFavoriteData = () => {
  pageLoading.value = true
  GetSubstationCollectList({
    pageNo: 1,
    pageSize: 100,
    keyword: localKeyword.value || undefined,
  }).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      favoriteList.value = list.map(mapCollectItem)
    } else {
      favoriteList.value = []
    }
  }).finally(() => {
    pageLoading.value = false
  })
}

const fetchDraftData = () => {
  pageLoading.value = true
  GetSubstationMyWorkList({
    pageNo: 1,
    pageSize: 100,
  }).then((res: any) => {
    if (res.code === 0) {
      const list = (res.data?.list || [])
        .filter((item: any) => item.isPublish === false)
        .map(mapWorkItem)
      draftList.value = list
    } else {
      draftList.value = []
    }
  }).finally(() => {
    pageLoading.value = false
  })
}

const loadActiveTabData = () => {
  if (activeTopTab.value === 'mine') fetchMineData()
  else if (activeTopTab.value === 'favorite') fetchFavoriteData()
  else fetchDraftData()
}

const handleTopTabChange = (val: string) => {
  activeTopTab.value = val
  activeFolderUid.value = ''
  activeFolderName.value = ''
  loadActiveTabData()
}

const handleContentFilterChange = (key: string) => {
  activeContentFilter.value = key
  fetchMyContent()
}

const handleSearch = () => {
  loadActiveTabData()
}

const openFolder = (folder: any) => {
  activeFolderUid.value = folder.uid
  activeFolderName.value = folder.name
  fetchFolderContent()
}

const backToRoot = () => {
  activeFolderUid.value = ''
  activeFolderName.value = ''
  fetchMineData()
}

const handleTopUpload = (files: FileList) => {
  const fileList = Array.from(files || [])
  if (!fileList.length) return
  Promise.all(fileList.map(file => getImageDataURL(file))).then(urls => {
    urls.forEach(src => insertImage(src))
  })
}

let searchTimer: any = null
watch(localKeyword, () => {
  if (activeTopTab.value === 'draft') return
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadActiveTabData()
  }, 400)
})

onMounted(() => {
  loadActiveTabData()
})
</script>

<style lang="scss" scoped>
.adv-my {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.toolbar-tabs {
  margin: 10px 0;
}

.search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 70px;
  gap: 10px;
}

.search-box {
  height: 34px;
  display: flex;
  align-items: center;
  gap: 5px;
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
  width: 100%;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: #f2f4f8;
  color: $themeColor;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.top-upload-input {
  width: 100%;

  :deep(.file-input) {
    width: 100%;
  }
}

.panel-loading,
.panel-empty {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 13px;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.folder-back-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-back-btn {
  border: 0;
  background: transparent;
  color: $themeColor;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.folder-back-name {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 4px;
  }
}

.folder-item {
  flex: 0 0 auto;
  width: 72px;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
}

.folder-icon {
  width: 48px;
  height: 36px;
  border-radius: 8px 8px 10px 10px;
  background: linear-gradient(135deg, #5b9dff 0%, #83d2ff 100%);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: -8px;
    width: 22px;
    height: 10px;
    border-radius: 6px 6px 0 0;
    background: #8fd2ff;
  }
}

.folder-name {
  width: 100%;
  font-size: 11px;
  color: #374151;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 14px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &.active {
    background: #111827;
    color: #fff;
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

.card-grid {
  display: grid;
  gap: 10px;
}

.two-col {
  grid-template-columns: repeat(2, 1fr);
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
}

.type-tag {
  position: absolute;
  left: 8px;
  bottom: 8px;
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.5);
  color: #fff;
  font-size: 12px;
  line-height: 22px;
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
