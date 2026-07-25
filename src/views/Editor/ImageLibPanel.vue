<template>
  <MoveablePanel
    class="image-lib-panel"
    :width="500"
    :height="400"
    :left="panelLeft"
    :top="110"
    :contentStyle="{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
    title="图片库"
    @close="close()"
  >
    <div class="container" v-loading="loading" element-loading-text="加载中...">
      <div class="tools">
        <Tabs
          :tabs="tabList"
          :value="currentTab"
          tabBtn
          @update:value="key => switchTab(key as string)"
        />
      </div>

      <!-- 全部/我的图片 -->
      <template v-if="currentTab === 'all'">
        <ImageWaterfallViewer
          class="imgs-wrap"
          :list="imgs"
          :columnSpacing="5"
          :columnWidth="160"
          @scrollToBottom="loadMore()"
        >
          <template v-slot:default="props">
            <div class="img-item">
              <img :src="props.src">
              <div class="mask">
                <Button type="primary" size="small" @click="createImageElement(props.src)">插入</Button>
              </div>
            </div>
          </template>
        </ImageWaterfallViewer>
        <div v-if="!loading && imgs.length === 0" class="empty-tip">暂无图片素材</div>
      </template>

      <!-- 文件夹 -->
      <template v-else-if="currentTab === 'folder'">
        <!-- 当前文件夹路径 -->
        <div v-if="activeFolderUid" class="folder-breadcrumb" @click="backToRoot()">
          <span class="back-btn">‹ 返回</span>
          <span class="folder-name">{{ activeFolderName }}</span>
        </div>

        <!-- 文件夹列表 -->
        <div v-if="folderList.length" class="folder-list">
          <div
            v-for="folder in folderList"
            :key="folder.uid"
            class="folder-item"
            @click="enterFolder(folder)"
          >
            <span class="folder-icon pptfont ppt-menu-layer"></span>
            <span class="folder-label">{{ folder.name }}</span>
            <span v-if="folder.materialCount" class="folder-count">{{ folder.materialCount }}</span>
          </div>
        </div>

        <!-- 文件夹内的图片 -->
        <ImageWaterfallViewer
          class="imgs-wrap"
          :list="folderImgs"
          :columnSpacing="5"
          :columnWidth="160"
        >
          <template v-slot:default="props">
            <div class="img-item">
              <img :src="props.src">
              <div class="mask">
                <Button type="primary" size="small" @click="createImageElement(props.src)">插入</Button>
              </div>
            </div>
          </template>
        </ImageWaterfallViewer>
        <div v-if="!loading && folderList.length === 0 && folderImgs.length === 0" class="empty-tip">暂无内容</div>
      </template>
    </div>
  </MoveablePanel>
</template>

<script lang="ts" setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useMainStore } from '@/store/main'
import useCreateElement from '@/hooks/useCreateElement'
import { GetSubstationMyAllWorkList, GetSubstationInfo, GetUserSpace } from '@/api/editor'
import Button from '@/components/Button.vue'
import MoveablePanel from '@/components/MoveablePanel.vue'
import ImageWaterfallViewer from '@/components/ImageWaterfallViewer.vue'
import Tabs from '@/components/Tabs.vue'

const mainStore = useMainStore()
const { createImageElement } = useCreateElement()

const panelWidth = 500
const panelLeft = ref(Math.max((window.innerWidth - panelWidth) / 2, 8))
const updatePanelPosition = () => { panelLeft.value = Math.max((window.innerWidth - panelWidth) / 2, 8) }

const currentTab = ref('all')
const tabList = ref([
  { label: '我的图片', key: 'all' },
  { label: '文件夹', key: 'folder' },
])

const loading = ref(false)

// 全部图片
const imgs = ref<any[]>([])
const page = ref(1)
const pageSize = 50
const total = ref(0)

// 文件夹
const spaceUid = ref('')
const folderList = ref<any[]>([])
const folderImgs = ref<any[]>([])
const activeFolderUid = ref('')
const activeFolderName = ref('')

const close = () => mainStore.setImageLibPanelState(false)

// 将 work item 映射为瀑布流 src 格式，type=0 素材优先用 url/materialUrl，不使用PPT预览图
const mapToImg = (item: any) => {
  const src = item.url || item.materialUrl || item.previewUrl || item.cover || ''
  return { id: item.id || item.materialId, src, width: Number(item.width) || 200, height: Number(item.height) || 200 }
}

const initSpace = () => {
  if (spaceUid.value) return Promise.resolve()
  return GetUserSpace({}).then((res: any) => {
    if (res.code === 0 && res.data) spaceUid.value = res.data.uid || ''
  })
}

// 获取我的图片（businessType=0 为图片素材）
const fetchMyImages = (reset = true) => {
  loading.value = true
  if (reset) { page.value = 1; imgs.value = [] }
  GetSubstationMyAllWorkList({ pageNo: page.value, pageSize, type: 0, businessType: 0 })
    .then((res: any) => {
      if (res.code === 0) {
        const list: any[] = res.data?.list || []
        const images = list.filter((item: any) => {
          const bt = item.businessType
          return bt === 0 || bt === '0' || (bt == null && (item.url || item.materialUrl || '').match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i))
        })
        total.value = Number(res.data?.total) || images.length
        if (reset) imgs.value = images.map(mapToImg)
        else imgs.value = [...imgs.value, ...images.map(mapToImg)]
      }
    })
    .finally(() => { loading.value = false })
}

const loadMore = () => {
  if (loading.value || imgs.value.length >= total.value) return
  page.value += 1
  fetchMyImages(false)
}

// 获取文件夹列表及图片
const fetchFolder = (folderUid = '') => {
  loading.value = true
  folderList.value = []
  folderImgs.value = []
  initSpace()
    .then(() => {
      const params: any = { pageNo: 1, pageSize: 100, sort: [{ key: 'createdAt', order: 'DESC' }] }
      if (spaceUid.value) params.spaceUid = spaceUid.value
      if (folderUid) params.folderUid = folderUid
      return GetSubstationInfo(params)
    })
    .then((res: any) => {
      if (res?.code === 0) {
        const list: any[] = res.data?.list || []
        const folders: any[] = []
        const materials: any[] = []
        list.forEach((item: any) => {
          if (item.sourceType == 2 && item.uid) folders.push({ uid: item.uid, name: item.name, materialCount: item.materialCount })
          else if (item.sourceType == 4 && Number(item.businessType) === 0) materials.push(item)
        })
        folderList.value = folders
        folderImgs.value = materials.map(mapToImg)
      }
    })
    .finally(() => { loading.value = false })
}

const switchTab = (key: string) => {
  currentTab.value = key
  if (key === 'all') fetchMyImages()
  else if (key === 'folder') { activeFolderUid.value = ''; activeFolderName.value = ''; fetchFolder() }
}

const enterFolder = (folder: any) => {
  activeFolderUid.value = folder.uid
  activeFolderName.value = folder.name
  fetchFolder(folder.uid)
}

const backToRoot = () => {
  activeFolderUid.value = ''
  activeFolderName.value = ''
  fetchFolder()
}

onMounted(() => {
  updatePanelPosition()
  window.addEventListener('resize', updatePanelPosition)
  fetchMyImages()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePanelPosition)
})
</script>

<style lang="scss" scoped>
.image-lib-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tools {
  flex-shrink: 0;
  margin-bottom: 10px;
}
.imgs-wrap {
  flex: 1;
}
.img-item {
  border-radius: $borderRadius;
  overflow: hidden;
  position: relative;

  &:hover .mask { display: flex; }

  .mask {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, .25);
    @include absolute-0();
  }
}
.empty-tip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
}
.folder-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0 8px;
  cursor: pointer;
  font-size: 13px;
  color: #666;

  .back-btn {
    color: $themeColor;
    font-weight: 500;
  }
  .folder-name {
    color: #333;
  }
}
.folder-list {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.folder-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #444;
  background: #fafafa;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
  }

  .folder-icon { font-size: 14px; }
  .folder-count { color: #999; font-size: 11px; }
}
</style>
