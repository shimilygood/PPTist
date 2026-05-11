<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <router-view v-else />
  </template>
  <FullscreenSpin tip="数据初始化中，请稍等 ..." v-else  loading :mask="false" />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { GetPPTDetail, ResolvePPTContent } from '@/api/editor'
import type { Slide, SlideTheme } from '@/types/slides'

import Screen from './views/Screen/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const route = useRoute()
const router = useRouter()
const { databaseId } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)
const { screening } = storeToRefs(useScreenStore())

const getTemplateIdFromRoute = () => {
  const routeId = route.query.id ?? route.params.id
  const routeIdRaw = Array.isArray(routeId) ? routeId[0] : routeId
  const fromRoute = Number(routeIdRaw)
  if (Number.isFinite(fromRoute) && fromRoute > 0) return fromRoute

  const fromSearch = Number(new URLSearchParams(window.location.search).get('id'))
  if (Number.isFinite(fromSearch) && fromSearch > 0) return fromSearch

  const hashQuery = window.location.hash.split('?')[1] || ''
  const fromHash = Number(new URLSearchParams(hashQuery).get('id'))
  if (Number.isFinite(fromHash) && fromHash > 0) return fromHash

  return null
}

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

onMounted(async () => {
  await router.isReady()
  const templateId = getTemplateIdFromRoute() || null

  let initialized = false
  try {
    const res = await GetPPTDetail(templateId ) as {
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
      if (list.length) {
        slidesStore.setSlides(list, parsed?.theme || {})
        slidesStore.updateSlideIndex(0)

        const title = (parsed?.title || detail.name || '').trim()
        if (title) slidesStore.setTitle(title)

        const width = Number(detail.width || parsed?.width)
        const height = Number(detail.height || parsed?.height)
        if (Number.isFinite(width) && width > 0) {
          slidesStore.setViewportSize(width)
          if (Number.isFinite(height) && height > 0) {
            slidesStore.setViewportRatio(height / width)
          }
        }

        initialized = true
      }
    }
  }
  catch {
    initialized = false
  }

  if (!initialized) {
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