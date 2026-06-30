<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <router-view v-else />
  </template>
  <FullscreenSpin tip="" v-else  loading :mask="false" />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore, useUserStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { GetPPTDetail, GetPPTTask, GetTokenInfo, GetUserInfo, ResolvePPTContent, cachePptInfoId, getCachedPptInfoId, resolvePptInfoIdValue } from '@/api/editor'
import type { Slide, SlideTheme } from '@/types/slides'
import { normalizeSlidesImageToOss } from '@/utils/assetUpload'

import Screen from './views/Screen/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'

type GeneratedPPTContent = {
  title?: string
  width?: number
  height?: number
  theme?: Partial<SlideTheme>
  slides?: Slide[]
}

const AI_HOME_CACHE_PREFIX = 'AI_HOME_GENERATED_PPT_'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { databaseId } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)
const { screening } = storeToRefs(useScreenStore())

const getTemplateIdFromRoute = () => {
  const routeId = route.query.id ?? route.query.editor ?? route.params.id
  const routeIdRaw = Array.isArray(routeId) ? routeId[0] : routeId
  const fromRoute = Number(routeIdRaw)
  if (Number.isFinite(fromRoute) && fromRoute > 0) return fromRoute

  const searchParams = new URLSearchParams(window.location.search)
  const fromSearch = Number(searchParams.get('id') || searchParams.get('editor'))
  if (Number.isFinite(fromSearch) && fromSearch > 0) return fromSearch

  const hashQuery = window.location.hash.split('?')[1] || ''
  const hashParams = new URLSearchParams(hashQuery)
  const fromHash = Number(hashParams.get('id') || hashParams.get('editor'))
  if (Number.isFinite(fromHash) && fromHash > 0) return fromHash

  return null
}

const getPptInfoIdFromRoute = () => {
  const routeInfoId = route.query.pptInfoId
  const routeInfoIdRaw = Array.isArray(routeInfoId) ? routeInfoId[0] : routeInfoId
  const fromRoute = Number(routeInfoIdRaw)
  if (Number.isFinite(fromRoute) && fromRoute > 0) return fromRoute

  const searchParams = new URLSearchParams(window.location.search)
  const fromSearch = Number(searchParams.get('pptInfoId'))
  if (Number.isFinite(fromSearch) && fromSearch > 0) return fromSearch

  const hashQuery = window.location.hash.split('?')[1] || ''
  const hashParams = new URLSearchParams(hashQuery)
  const fromHash = Number(hashParams.get('pptInfoId'))
  if (Number.isFinite(fromHash) && fromHash > 0) return fromHash

  return null
}

const getAIGeneratedCache = (id: number | null) => {
  if (!id) return null

  try {
    const key = `${AI_HOME_CACHE_PREFIX}${id}`
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as { content?: GeneratedPPTContent; pptInfoId?: number; templateId?: number }
  }
  catch {
    return null
  }
}

const getAIGeneratedContentFromCache = (id: number | null): GeneratedPPTContent | null => {
  return getAIGeneratedCache(id)?.content || null
}

const resolveEditorPptInfoId = (docId: number | null) => {
  const cacheMeta = getAIGeneratedCache(docId)
  return resolvePptInfoIdValue(
    getPptInfoIdFromRoute(),
    getCachedPptInfoId(docId),
    cacheMeta?.pptInfoId,
    cacheMeta?.templateId ? getCachedPptInfoId(cacheMeta.templateId) : null,
  )
}

const applyContentToEditor = async (content: GeneratedPPTContent, titleFallback = '') => {
  const list = Array.isArray(content?.slides) ? content.slides : []
  if (!list.length) return false

  const normalized = await normalizeSlidesImageToOss(list)
  const nextSlides = normalized.slides

  slidesStore.setSlides(nextSlides, content.theme || {})
  slidesStore.updateSlideIndex(0)

  const title = (content.title || titleFallback || '').trim()
  if (title) slidesStore.setTitle(title)

  const width = Number(content.width)
  const height = Number(content.height)
  if (Number.isFinite(width) && width > 0) {
    slidesStore.setViewportSize(width)
    if (Number.isFinite(height) && height > 0) {
      slidesStore.setViewportRatio(height / width)
    }
  }

  return true
}

const loadFromTaskServer = async (taskId: number) => {
  try {
    const res = await GetPPTTask(taskId) as {
      code?: number
      data?: {
        status?: number
        topic?: string
        contentJsonUrl?: string
        contentJson?: string
      }
    }
    if (res.code !== 0 || !res.data || res.data.status !== 1) return false

    const parsed = await ResolvePPTContent<GeneratedPPTContent>({
      contentJsonUrl: res.data.contentJsonUrl,
      json: res.data.contentJson,
      preferContentUrl: true,
    })
    if (!parsed) return false

    const applied = await applyContentToEditor(parsed, res.data.topic || '')
    if (!applied) return false

    slidesStore.setPptId(taskId)
    const infoId = resolveEditorPptInfoId(taskId)
    slidesStore.setPptInfoId(infoId)
    if (infoId) cachePptInfoId(taskId, infoId)
    return true
  }
  catch {
    return false
  }
}

const loadFromPptDetail = async (docId: number | null, pptInfoId: number | null) => {
  if (!docId && !pptInfoId) return false

  try {
    const res = await GetPPTDetail({
      ...(docId ? { id: docId } : {}),
      ...(pptInfoId ? { pptInfoId } : {}),
    }) as {
      code?: number
      data?: {
        id?: number
        pptInfoId?: number
        name?: string
        json?: string | GeneratedPPTContent
        contentJsonUrl?: string | null
      }
    }
    if (res.code !== 0 || !res.data) return false

    const detail = res.data
    const parsed = await ResolvePPTContent<GeneratedPPTContent>({
      json: detail.json,
      contentJsonUrl: detail.contentJsonUrl,
      preferContentUrl: true,
    })
    if (!parsed) return false

    const applied = await applyContentToEditor(parsed, detail.name || '')
    if (!applied) return false

    slidesStore.setPptId(Number.isFinite(detail.id) && Number(detail.id) > 0 ? Number(detail.id) : docId)
    const infoId = resolvePptInfoIdValue(detail.pptInfoId, pptInfoId)
    slidesStore.setPptInfoId(infoId)
    if (infoId && slidesStore.pptId) cachePptInfoId(slidesStore.pptId, infoId)
    return true
  }
  catch {
    return false
  }
}

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`
}

const isLocalDev = () => {
  return window.location.hostname === '127.0.0.1'
}

const resolveAccessToken = (payload: any): string => {
  return payload?.data?.accessToken || payload?.accessToken || ''
}

const resolveUserInfo = (payload: any) => {
  return payload?.data || payload || {}
}

const redirectToLogin = () => {
  window.location.href = 'https://aiyunhui.com/login?redirect=' + encodeURIComponent(window.location.href)

}

const initEditorUserInfo = async () => {
  try {
    const tokenInfo = await GetTokenInfo()
    const accessToken = resolveAccessToken(tokenInfo)
    if (accessToken) localStorage.setItem('ACCESS_TOKEN', accessToken)
    else localStorage.removeItem('ACCESS_TOKEN')
  }
  catch {
    localStorage.removeItem('ACCESS_TOKEN')
  }

  try {
    const userInfo:any = await GetUserInfo()
    console.log('获取用户信息userInfo', userInfo)
    if(userInfo && userInfo.code==0 ){
      console.log('用户信息获取2222222')
      localStorage.setItem('EDITOR_USER_INFO', JSON.stringify(userInfo))
      userStore.setUserInfo(userInfo)
    }else{
      console.log('用户信息获取33333333')
      localStorage.removeItem('EDITOR_USER_INFO')
      userStore.clearUserInfo()
      //移除cookie
      setCookie('ACCESS_TOKEN', '')
      redirectToLogin()
    }
   
    
  }
  catch {
    localStorage.removeItem('EDITOR_USER_INFO')
    userStore.clearUserInfo()
    redirectToLogin()
  }
}

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

onMounted(async () => {
  // 判断本地环境，模拟登录
  if (isLocalDev()) {
    setCookie('AUTH_TOKEN', '7c15e1a1310d4df8a5ad6a09f74ffaa9')
  }

  await initEditorUserInfo()

  await router.isReady()

  // 非编辑器路由（如首页）直接放行，无需加载PPT数据
  if (route.path !== '/editor') {
    const emptySlide: Slide = {
      id: nanoid(10),
      elements: [],
      background: {
        type: 'solid',
        color: slidesStore.theme.backgroundColor,
      },
    }
    slidesStore.setSlides([emptySlide])
    slidesStore.updateSlideIndex(0)
    await deleteDiscardedDB()
    snapshotStore.initSnapshotDatabase()
    return
  }

  const templateId = getTemplateIdFromRoute() || null
  const sourceType = String(route.query.sourceType || '')
  const isTaskSource = sourceType === 'TASK'
  const routePptInfoId = resolveEditorPptInfoId(templateId)
  const cachedGeneratedContent = getAIGeneratedContentFromCache(templateId)

  let initialized = false
  if (!isTaskSource && templateId) {
    try {
      initialized = await loadFromPptDetail(templateId, routePptInfoId)
      if (initialized) {
        router.replace({
          query: {
            ...route.query,
            id: slidesStore.pptId,
            sourceType: 'TEMPLATE',
            templateId: String(slidesStore.pptId),
            ...(slidesStore.pptInfoId ? { pptInfoId: String(slidesStore.pptInfoId) } : {}),
          },
        })
        console.log('[PPT Init] ✓ Initialization from template detail')
      }
    }
    catch {
      initialized = false
    }
  }

  if (!initialized && cachedGeneratedContent) {
    initialized = await applyContentToEditor(cachedGeneratedContent)
    if (initialized && templateId) {
      slidesStore.setPptId(templateId)
      const infoId = resolveEditorPptInfoId(templateId)
      slidesStore.setPptInfoId(infoId)
      if (infoId) cachePptInfoId(templateId, infoId)
      router.replace({
        query: {
          ...route.query,
          id: String(templateId),
          sourceType: 'TASK',
          taskId: String(templateId),
          ...(infoId ? { pptInfoId: String(infoId) } : {}),
        },
      })
      console.log('[PPT Init] ✓ Initialization from cached generated content')
    }
  }

  if (!initialized && isTaskSource && templateId) {
    initialized = await loadFromTaskServer(templateId)
    if (initialized) {
      console.log('[PPT Init] ✓ Initialization from task server')
    }
  }

  if (!initialized && routePptInfoId) {
    initialized = await loadFromPptDetail(templateId, routePptInfoId)
    if (initialized) {
      console.log('[PPT Init] ✓ Initialization from pptInfoId detail')
    }
  }

  if (!initialized) {
    console.error('初始化失败，请检查网络连接')
    if (!templateId) {
      router.push({ path: '/home' })
      slidesStore.setPptId(null)
      slidesStore.setPptInfoId(null)
    }
    else {
      slidesStore.setPptId(templateId)
      slidesStore.setPptInfoId(resolveEditorPptInfoId(templateId))
    }
    const emptySlide: Slide = {
      id: nanoid(10),
      elements: [],
      background: {
        type: 'solid',
        color: slidesStore.theme.backgroundColor,
      },
    }
    slidesStore.setSlides([emptySlide])
    slidesStore.updateSlideIndex(0)
  }

  await deleteDiscardedDB()
  snapshotStore.initSnapshotDatabase()
})

// 应用注销时向 localStorage 中记录下本次 indexedDB 的数据库ID，用于之后清除数据库
window.addEventListener('beforeunload', () => {
  const discardedDB = localStorage.getItem(LOCALSTORAGE_KEY_DISCARDED_DB)
  const discardedDBList: string[] = discardedDB ? JSON.parse(discardedDB) : []

  discardedDBList.push(databaseId.value)

  const newDiscardedDB = JSON.stringify(discardedDBList)
  localStorage.setItem(LOCALSTORAGE_KEY_DISCARDED_DB, newDiscardedDB)
})
</script>

<style lang="scss">
#app {
  height: 100%;
}
.icon-more {
  font-size: 12px !important;
}
</style>