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
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { GetPPTDetail, GetTokenInfo, GetUserInfo, ResolvePPTContent } from '@/api/editor'
import type { Slide, SlideTheme } from '@/types/slides'

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

const getAIGeneratedContentFromCache = (id: number | null): GeneratedPPTContent | null => {
  if (!id) return null

  try {
    const key = `${AI_HOME_CACHE_PREFIX}${id}`
    const raw = sessionStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { content?: GeneratedPPTContent }
    return parsed?.content || null
  }
  catch {
    return null
  }
}

const applyContentToEditor = (content: GeneratedPPTContent, titleFallback = '') => {
  const list = Array.isArray(content?.slides) ? content.slides : []
  if (!list.length) return false

  slidesStore.setSlides(list, content.theme || {})
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

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`
}

const isLocalDev = () => {
  return window.location.hostname === '127.0.0.1' && window.location.port === '5173'
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
    }else{
      console.log('用户信息获取33333333')
      localStorage.removeItem('EDITOR_USER_INFO')
      //移除cookie
      setCookie('ACCESS_TOKEN', '')
      redirectToLogin()
    }
   
    
  }
  catch {
    localStorage.removeItem('EDITOR_USER_INFO')
    redirectToLogin()
  }
}

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

onMounted(async () => {
  // 判断本地环境，模拟登录
  if (isLocalDev()) {
    setCookie('AUTH_TOKEN', 'c968ca8a65234e5c87972caa8db17e56')
  }

  await initEditorUserInfo()

  await router.isReady()
  const templateId = getTemplateIdFromRoute() || null
  const cachedGeneratedContent = getAIGeneratedContentFromCache(templateId)

  let initialized = false
  try {
    const res = await GetPPTDetail(templateId) as {
      code?: number
      data?: {
        id?: number
        name?: string
        json?: string | { title?: string; slides?: Slide[]; theme?: Partial<SlideTheme>; width?: number; height?: number }
        contentJsonUrl?: string | null
        width?: number
        height?: number
      }
    }

    if (res.code === 0 && res.data) {
      const detail = res.data
      slidesStore.setPptId(Number.isFinite(detail.id) && Number(detail.id) > 0 ? Number(detail.id) : null)

      router.replace({ query: { ...route.query, id: slidesStore.pptId } })

      const parsed = await ResolvePPTContent<{
        title?: string
        slides?: Slide[]
        theme?: Partial<SlideTheme>
        width?: number
        height?: number
      }>({
        json: detail.json,
        contentJsonUrl: detail.contentJsonUrl,
        preferContentUrl: true,
      })

     
      const list = Array.isArray(parsed?.slides) ? parsed.slides : []
      

      if (list.length > 0) {
        initialized = applyContentToEditor(parsed || {}, detail.name || '')
        console.log('[PPT Init] ✓ Initialization successful')
      }
      else {
       
        // Try fallback: use inline json directly if contentJsonUrl failed
        const fallback = await ResolvePPTContent<{
          title?: string
          slides?: Slide[]
          theme?: Partial<SlideTheme>
          width?: number
          height?: number
        }>({
          json: detail.json,
          contentJsonUrl: null,
          preferContentUrl: false,
        })
        
    
        const fallbackList = Array.isArray(fallback?.slides) ? fallback.slides : []
        
        if (fallbackList.length > 0) {
          initialized = applyContentToEditor(fallback || {}, detail.name || '')
         
        }
      }
    }else{
      //提示模板不存在
      console.log('模板不存在')
    }
    
  }
  catch (err) {
   
    initialized = false
  }

  if (!initialized && cachedGeneratedContent) {
    initialized = applyContentToEditor(cachedGeneratedContent)
    if (initialized && templateId) {
      slidesStore.setPptId(templateId)
      sessionStorage.removeItem(`${AI_HOME_CACHE_PREFIX}${templateId}`)
      console.log('[PPT Init] ✓ Initialization from cached generated content')
    }
  }

  if (!initialized) {
    console.warn('[PPT Init] Creating empty slide as fallback')
    slidesStore.setPptId(null)
  }
  if (!initialized) {
    console.error('初始化失败，请检查网络连接2')
    slidesStore.setPptId(null)
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
</style>