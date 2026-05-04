<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <router-view v-else />
    
    <!-- <Screen v-if="screening" />
    <Editor v-else-if="_isPC" />
    <Mobile v-else /> -->
  </template>
  <FullscreenSpin tip="数据初始化中，请稍等 ..." v-else loading :mask="false" />
</template>



<script lang="ts" setup>
import { onMounted,ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { isPC } from '@/utils/common'
import api from '@/services'
import { useRouter } from "vue-router";

const router = useRouter();

import Editor from './views/Editor/index.vue'
import Screen from './views/Screen/index.vue'
import Mobile from './views/Mobile/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'

const _isPC = isPC()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const { databaseId } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)
const { screening } = storeToRefs(useScreenStore())

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

const isHome = ref(true)
onMounted(async () => {
  console.log('isHome',isHome.value)
  if(isHome.value){
    router.push({
      path: "/",
    })
  }
  else if(screening.value){
    router.push({
      path: "/screen",
    })
   
  }else if(_isPC){
   router.push({
      path: "/editor",
    })
  }else{
    router.push({
      path: "/mobile",
    })
  }

  const slides = await api.getMockData('slides')
  slidesStore.setSlides(slides)

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
  font-size: 14px;
}
.pptfont{
  font-family: "pptist-icon" !important;
  font-style: normal;
  font-weight: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size:20px;
  margin: 0 5px
}
.colorfont{
  font-family: "pptist-icon" !important;
  font-style: normal;
  font-weight: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size:16px;
  margin: 0 5px
}


</style>