<template>
  <div class="adv-team">
    <div v-if="teamInfo" class="team-header">
      <img v-if="teamInfo.icon" :src="teamInfo.icon" class="team-icon-img" alt="" />
      <span v-else class="designfont designicon-nav-team team-icon"></span>
      <span class="team-title">{{ teamInfo.name }} 团队空间</span>
    </div>

    <template v-if="teamInfo">
      <div class="search-row">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="localKeyword"
            type="text"
            :placeholder="searchPlaceholder"
            @keyup.enter="handleSearch"
          />
        </div>
        <FileInput class="top-upload-input" accept="image/*,video/*" @change="files => handleTopUpload(files)">
          <button class="add-btn">+ 添加</button>
        </FileInput>
      </div>
    </template>

    <div v-if="pageLoading" class="panel-loading">加载中...</div>

    <template v-else-if="!teamInfo">
      <div class="panel-empty">暂无团队，请前往主站加入或创建团队</div>
    </template>

    <template v-else-if="contentViewMode === 'upload'">
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
        <button class="folder-back-btn" @click="backToParent">‹ 返回</button>
        <span class="folder-back-name">{{ activeFolderName }}</span>
      </div>

      <div v-if="folderList.length" class="section-block">
        <div class="section-title">文件夹 ({{ folderList.length }})</div>
        <div class="folder-row">
          <button
            v-for="item in folderList"
            :key="item.uid"
            class="folder-item"
            @click="openFolder(item)"
          >
            <span class="folder-icon-wrap">
              <img class="folder-icon-img" :src="getFolderIcon(item)" :alt="item.name" />
            </span>
            <span class="folder-name">{{ item.name }}</span>
          </button>
        </div>
      </div>

      <div class="section-block">
        <div class="content-head">
          <div class="section-title">内容 ({{ contentTotal || contentList.length }})</div>
          <div class="content-actions">
            <button
              class="action-link"
              :class="{ active: contentViewMode === 'upload' }"
              @click="toggleUploadView"
            >我的上传</button>
            <Popover
              trigger="click"
              placement="right-start"
              :offset="12"
              v-model:value="showTagPopup"
              :contentStyle="{ padding: '0', border: '0', boxShadow: 'none', background: 'transparent' }"
              @show="loadTagList"
            >
              <template #content>
                <div class="tag-popup">
                  <div v-if="tagLoading" class="tag-popup-loading">加载中...</div>
                  <template v-else-if="tagGroups.length">
                    <div
                      v-for="group in tagGroups"
                      :key="group.letter"
                      class="tag-group"
                    >
                      <div class="tag-group-letter">{{ group.letter }}</div>
                      <div class="tag-group-list">
                        <button
                          v-for="tag in group.tags"
                          :key="tag.id"
                          class="tag-pill"
                          :class="{ active: selectedTagId === tag.id }"
                          @click="selectTag(tag)"
                        >
                          <span class="tag-pill-icon designfont designicon-ai-filter"></span>
                          <span class="tag-pill-text">{{ tag.name }}</span>
                        </button>
                      </div>
                    </div>
                  </template>
                  <div v-else class="tag-popup-empty">暂无标签</div>
                </div>
              </template>
              <button
                class="action-link tag-link"
                :class="{ active: showTagPopup || selectedTagId }"
              >
                <span class="designfont designicon-ai-filter"></span>
                标签
              </button>
            </Popover>
          </div>
        </div>

        <div v-if="!activeFolderUid" class="filter-row">
          <button
            v-for="tab in contentFilters"
            :key="tab.key"
            class="filter-chip"
            :class="{ active: activeContentFilter === tab.key }"
            @click="handleContentFilterChange(tab.key)"
          >{{ tab.label }}</button>
        </div>

        <div v-if="contentLoading" class="panel-loading small">加载中...</div>
        <div v-else-if="contentList.length" class="content-grid">
          <button
            v-if="featuredItem"
            class="banner-card"
            @click="handleItemClick(featuredItem)"
          >
            <img :src="featuredItem.coverUrl" :alt="featuredItem.name" loading="lazy" />
          </button>

          <div class="card-grid two-col">
            <button
              v-for="item in gridItems"
              :key="item.id"
              class="asset-card"
              :class="{ portrait: item.layout === 'portrait' }"
              @click="handleItemClick(item)"
            >
              <img :src="item.coverUrl" :alt="item.name" loading="lazy" />
              <span v-if="item.businessTypeLabel" class="type-tag">{{ item.businessTypeLabel }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="!folderList.length" class="panel-empty small">暂无内容</div>
      </div>
    </template>

    <Modal :visible="showApplyConfirm" :width="420" :closeOnClickMask="false" @closed="closeApplyConfirm">
      <div class="apply-modal">
        <div class="apply-modal-title">应用模板</div>
        <div class="apply-modal-desc">确定将「{{ pendingItem?.name || '该作品' }}」应用到当前编辑器吗？应用后将替换当前全部页面。</div>
        <div class="apply-modal-actions">
          <button class="apply-cancel-btn" @click="closeApplyConfirm">取消</button>
          <button class="apply-confirm-btn" :disabled="applyLoading" @click="confirmApplyPpt">确定</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import useCreateElement from '@/hooks/useCreateElement'
import { getImageDataURL } from '@/utils/image'
import FileInput from '@/components/FileInput.vue'
import Modal from '@/components/Modal.vue'
import Popover from '@/components/Popover.vue'
import message from '@/utils/message'
import myteamFileIconFold from '@/assets/images/myteam-file-icon-fold.png'
import myteamFileIconOpen from '@/assets/images/myteam-file-icon-open.png'
import {
  GetSubstationCurrentTeam,
  GetSubstationInfo,
  GetSubstationTeamTagList,
  GetSubstationTeamWorkList,
  ResolvePPTContent,
} from '@/api/editor'

const props = defineProps<{ active?: boolean }>()

const emit = defineEmits<{
  (e: 'replaceAll', payload: any): void
}>()

const { createImageElement } = useCreateElement()

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

const teamInfo = ref<any>(null)
const localKeyword = ref('')
const pageLoading = ref(false)
const contentLoading = ref(false)
const contentViewMode = ref('all')
const activeContentFilter = ref('all')

const folderList = ref<any[]>([])
const contentList = ref<any[]>([])
const contentTotal = ref(0)
const rootFolderUid = ref('')
const folderStack = ref<any[]>([])
const activeFolderUid = ref('')
const activeFolderName = ref('')
const showApplyConfirm = ref(false)
const applyLoading = ref(false)
const pendingItem = ref<any>(null)
const showTagPopup = ref(false)
const tagLoading = ref(false)
const tagList = ref<any[]>([])
const selectedTagId = ref<any>(null)

const searchPlaceholder = computed(() => {
  const name = teamInfo.value?.name || '团队'
  return `在 ${name} 团队内搜索`
})

const featuredItem = computed(() => contentList.value[0] || null)
const gridItems = computed(() => contentList.value.slice(1))

const getTagLetter = (name: string, item?: any) => {
  if (item?.letter || item?.initial) return String(item.letter || item.initial).toUpperCase()
  const first = (name || '').trim().charAt(0)
  if (/[a-zA-Z]/.test(first)) return first.toUpperCase()
  return '#'
}

const tagGroups = computed(() => {
  const map: Record<string, any[]> = {}
  tagList.value.forEach((tag: any) => {
    const letter = getTagLetter(tag.name, tag)
    if (!map[letter]) map[letter] = []
    map[letter].push(tag)
  })
  return Object.keys(map).sort().map(letter => ({ letter, tags: map[letter] }))
})

const resetState = () => {
  teamInfo.value = null
  folderList.value = []
  contentList.value = []
  contentTotal.value = 0
  rootFolderUid.value = ''
  folderStack.value = []
  activeFolderUid.value = ''
  activeFolderName.value = ''
  contentViewMode.value = 'all'
  activeContentFilter.value = 'all'
  showTagPopup.value = false
  tagList.value = []
  selectedTagId.value = null
}

const mapLayout = (width: any, height: any) => {
  const w = Number(width)
  const h = Number(height)
  if (Number.isFinite(w) && Number.isFinite(h) && h > w) return 'portrait'
  return 'landscape'
}

// type=0 素材；type=1/2 模板/AI生成取 previewUrl
const getCoverUrl = (item: any) => {
  const type = item.type
  const url = item.url || item.materialUrl || ''
  const previewUrl = item.previewUrl || ''
  if (type === 0 || type === '0') return url || previewUrl
  if (type === 1 || type === '1' || type == null) return previewUrl || url
  if (type === 2 || type === '2') return previewUrl || url
  if (Number(item.businessType) === 3) return previewUrl || url
  return previewUrl || url
}

const mapWorkItem = (item: any) => ({
  id: item.id || item.materialId,
  name: item.name || item.materialName || '',
  previewUrl: item.previewUrl || '',
  url: item.url || item.materialUrl || '',
  coverUrl: getCoverUrl(item),
  width: item.width,
  height: item.height,
  type: item.type,
  businessType: item.businessType,
  sourceMaterialId: item.sourceMaterialId,
  businessTypeLabel: businessTypeMap[item.businessType] || '',
  layout: mapLayout(item.width, item.height),
})

const isPptWorkItem = (item: any) => {
  if (isFolderItem(item)) return false
  const type = item.type
  const businessType = Number(item.businessType)
  if (Number(type) === 1 || type === '1') return true
  if (businessType === 3) return true
  return false
}

const buildFolderInfoParams = () => {
  const params: any = {
    pageNo: 1,
    pageSize: 100,
    keywords: localKeyword.value || undefined,
    sort: [{ key: 'createdAt', order: 'DESC' }],
  }
  if (teamInfo.value?.uid) params.spaceUid = teamInfo.value.uid
  const folderUid = activeFolderUid.value || rootFolderUid.value
  if (folderUid) params.folderUid = folderUid
  return params
}

const buildWorkListParams = () => {
  const params: any = {
    pageNo: 1,
    pageSize: 100,
    keyword: localKeyword.value || undefined,
  }
  if (teamInfo.value?.uid) params.spaceUid = teamInfo.value.uid
  if (activeContentFilter.value !== 'all') {
    params.type = Number(activeContentFilter.value)
  }
  if (selectedTagId.value) params.tagId = selectedTagId.value
  return params
}

// type=null 且 sourceType=2 为文件夹，sourceType=4 为物料
const isFolderItem = (item: any) => Number(item.sourceType) === 2 && item.type == null && !!item.uid

const isMaterialItem = (item: any) => Number(item.sourceType) === 4

const mapFolderItem = (item: any) => ({
  uid: item.uid,
  name: item.name,
  materialCount: item.materialCount,
})

const getFolderIcon = (item: any) => {
  return Number(item.materialCount) > 0 ? myteamFileIconOpen : myteamFileIconFold
}

const fetchInfoPaged = () => {
  const allFolders: any[] = []
  const allMaterials: any[] = []
  const loadPage = (pageNo: number): Promise<void> => {
    const params = {
      ...buildFolderInfoParams(),
      pageNo,
      pageSize: 100,
    }
    return GetSubstationInfo(params).then((res: any) => {
      if (res.code !== 0) return
      const list = res.data?.list || []
      list.forEach((item: any) => {
        if (isFolderItem(item)) allFolders.push(item)
        else if (isMaterialItem(item)) allMaterials.push(item)
      })
      const total = Number(res.data?.total) || 0
      if (pageNo * 100 < total) return loadPage(pageNo + 1)
    })
  }
  return loadPage(1).then(() => ({ allFolders, allMaterials }))
}

const fetchFolderList = () => {
  return fetchInfoPaged().then(({ allFolders }) => {
    folderList.value = allFolders.map(mapFolderItem)
  })
}

const insertImage = (src: string) => {
  if (!src) return
  createImageElement(src)
}

const closeApplyConfirm = () => {
  showApplyConfirm.value = false
  pendingItem.value = null
  applyLoading.value = false
}

const confirmApplyPpt = () => {
  const item = pendingItem.value
  if (!item?.url) {
    message.error('该作品暂无可用数据')
    closeApplyConfirm()
    return
  }
  applyLoading.value = true
  ResolvePPTContent({
    contentJsonUrl: item.url,
    preferContentUrl: true,
  }).then((parsed: any) => {
    const slides = Array.isArray(parsed?.slides) ? parsed.slides : []
    if (!slides.length) {
      message.error('该作品暂无可用数据')
      return
    }
    emit('replaceAll', {
      slides,
      theme: parsed?.theme || {},
      templateId: item.sourceMaterialId || item.id,
      pptInfoId: item.sourceMaterialId,
    })
    message.success('已应用到当前编辑器')
    closeApplyConfirm()
  }).finally(() => {
    applyLoading.value = false
  })
}

const handleItemClick = (item: any) => {
  if (isFolderItem(item)) {
    openFolder({ uid: item.uid, name: item.name || item.materialName })
    return
  }
  if (isPptWorkItem(item)) {
    pendingItem.value = item
    showApplyConfirm.value = true
    return
  }
  const type = item.type
  const isMaterialLike = type === 0 || type === '0' || type === 2 || type === '2'
  const src = isMaterialLike ? (item.url || item.previewUrl) : (item.previewUrl || item.url)
  if (!src) return
  insertImage(src)
}

// 获取团队作品列表
const fetchTeamWorkList = () => {
  contentLoading.value = true
  GetSubstationTeamWorkList(buildWorkListParams()).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      contentTotal.value = Number(res.data?.total) || list.length
      contentList.value = list.map(mapWorkItem)
    } else {
      contentList.value = []
      contentTotal.value = 0
    }
  }).finally(() => {
    contentLoading.value = false
  })
}

// 获取文件夹内子文件夹与物料
const fetchFolderContent = () => {
  if (!teamInfo.value?.uid) return
  pageLoading.value = true
  fetchInfoPaged().then(({ allFolders, allMaterials }) => {
    folderList.value = allFolders.map(mapFolderItem)
    contentTotal.value = allMaterials.length
    contentList.value = allMaterials.map(mapWorkItem)
  }).finally(() => {
    pageLoading.value = false
  })
}

// 获取文件夹 + 团队作品
const fetchTeamData = () => {
  if (!teamInfo.value) return
  if (activeFolderUid.value) {
    fetchFolderContent()
    return
  }

  pageLoading.value = true

  let folderDone = false
  let workDone = false
  const finishLoading = () => {
    if (folderDone && workDone) pageLoading.value = false
  }

  fetchFolderList().finally(() => {
    folderDone = true
    finishLoading()
  })

  GetSubstationTeamWorkList(buildWorkListParams()).then((res: any) => {
    if (res.code === 0) {
      const list = res.data?.list || []
      contentTotal.value = Number(res.data?.total) || list.length
      contentList.value = list.map(mapWorkItem)
    } else {
      contentList.value = []
      contentTotal.value = 0
    }
  }).finally(() => {
    workDone = true
    finishLoading()
  })
}

// 点击团队时优先获取当前团队，再拉取文件夹与作品
const initTeam = () => {
  resetState()
  pageLoading.value = true
  GetSubstationCurrentTeam().then((res: any) => {
    if (res.code === 0 && res.data) {
      teamInfo.value = res.data
      rootFolderUid.value = res.data.rootFolder?.uid || ''
      fetchTeamData()
    } else {
      teamInfo.value = null
      pageLoading.value = false
    }
  })
}

const handleContentFilterChange = (key: string) => {
  contentViewMode.value = 'all'
  activeContentFilter.value = key
  selectedTagId.value = null
  if (activeFolderUid.value) fetchFolderContent()
  else fetchTeamWorkList()
}

const handleSearch = () => {
  contentViewMode.value = 'all'
  selectedTagId.value = null
  if (activeFolderUid.value) fetchFolderContent()
  else fetchTeamData()
}

const toggleUploadView = () => {
  contentViewMode.value = contentViewMode.value === 'upload' ? 'all' : 'upload'
}

const loadTagList = () => {
  if (tagList.value.length || !teamInfo.value?.uid) return
  tagLoading.value = true
  GetSubstationTeamTagList({ spaceUid: teamInfo.value.uid }).then((res: any) => {
    if (res.code === 0) {
      const raw = res.data?.list || res.data || []
      const list = Array.isArray(raw) ? raw : []
      tagList.value = list.map((item: any) => ({
        id: item.id || item.tagId,
        name: item.name || item.tagName || '',
        letter: item.letter || item.initial,
      }))
    } else {
      tagList.value = []
    }
  }).finally(() => {
    tagLoading.value = false
  })
}

const selectTag = (tag: any) => {
  selectedTagId.value = selectedTagId.value === tag.id ? null : tag.id
  showTagPopup.value = false
  contentViewMode.value = 'all'
  if (activeFolderUid.value) fetchFolderContent()
  else fetchTeamWorkList()
}

const openFolder = (folder: any) => {
  contentViewMode.value = 'all'
  if (activeFolderUid.value) {
    folderStack.value.push({
      uid: activeFolderUid.value,
      name: activeFolderName.value,
    })
  }
  activeFolderUid.value = folder.uid
  activeFolderName.value = folder.name
  fetchFolderContent()
}

const backToParent = () => {
  const parent = folderStack.value.pop()
  if (parent) {
    activeFolderUid.value = parent.uid
    activeFolderName.value = parent.name
    fetchFolderContent()
    return
  }
  backToRoot()
}

const backToRoot = () => {
  activeFolderUid.value = ''
  activeFolderName.value = ''
  folderStack.value = []
  fetchTeamData()
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
  if (!teamInfo.value || contentViewMode.value === 'upload') return
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    handleSearch()
  }, 400)
})

watch(
  () => props.active,
  (val) => {
    if (val) initTeam()
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.adv-team {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.team-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.team-icon-img {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.team-icon {
  font-size: 20px;
  color: $themeColor;
  flex-shrink: 0;
}

.team-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  text-align: center;
  padding: 0 12px;

  &.small {
    min-height: 120px;
  }
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  flex-shrink: 0;
}

.content-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.action-link {
  border: 0;
  background: transparent;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;

  &.active {
    color: #111827;
  }
}

.tag-link {
  cursor: pointer;
  height: 24px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 12px;

  &.active {
    border-color: #e5e7eb;
    background: #fff;
    color: #111827;
  }
}

.tag-popup {
  width: 280px;
  max-height: 420px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  padding: 16px 14px;
}

.tag-popup-loading,
.tag-popup-empty {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
}

.tag-group {
  display: flex;
  gap: 10px;
  align-items: flex-start;

  & + .tag-group {
    margin-top: 14px;
  }
}

.tag-group-letter {
  width: 16px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  line-height: 30px;
}

.tag-group-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-pill {
  height: 30px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;

  &.active {
    border-color: $themeColor;
    color: $themeColor;
    background: rgba(42, 106, 233, 0.06);
  }
}

.tag-pill-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.tag-pill-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.banner-card {
  border: 1px solid transparent;
  border-radius: 14px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #eef3f9;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  position: relative;

  &:hover {
    border-color: #2A6AE9;
    box-shadow: 0 4px 12px rgba(42, 106, 233, 0.12);
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.asset-card {
  border: 1px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  background: #eef3f9;
  padding: 0;
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: #2A6AE9;
    box-shadow: 0 4px 12px rgba(42, 106, 233, 0.12);
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
  width: 80px;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
}

.folder-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-icon-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.folder-name {
  width: 100%;
  font-size: 11px;
  color: #374151;
  text-align: center;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  word-break: break-all;
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
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &.active {
    background: #eef0f4;
    color: #111827;
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

.apply-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apply-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.apply-modal-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.apply-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.apply-cancel-btn,
.apply-confirm-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.apply-cancel-btn {
  border: 1px solid $borderColor;
  background: #fff;
  color: #374151;
}

.apply-confirm-btn {
  border: 0;
  background: $themeColor;
  color: #fff;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
