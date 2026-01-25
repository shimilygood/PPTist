<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <Editor v-else-if="_isPC" />
    <Mobile v-else />
  </template>
  <FullscreenSpin tip="数据初始化中，请稍等 ..." v-else  loading :mask="false" />
</template>



<script lang="ts" setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { isPC } from '@/utils/common'
import api from '@/services'

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

onMounted(async () => {
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
/*新增公共样式*/

.flex {
  display: flex;
}
.flex-column {
  flex-direction: column;
}
.flex-1 {
  flex: 1;
}
.flex-center {
  justify-content: center;
  align-items: center;
}
.flex-between {
  justify-content: space-between;
}
.flex-wrap {
  flex-wrap: wrap;
}.hidden {
  display: none;
}
.pointer {
  cursor: pointer;
}
.align-center {
  align-items: center;
}
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.ml-5 {
  margin-left: 5px;
}
.mr-5 {
  margin-right: 5px;
}
.mt-5 {
  margin-top: 5px;
}
.mb-5 {
  margin-bottom: 5px;
}
.ml-10 {
  margin-left: 10px;
}
.mr-10 {
  margin-right: 10px;
}
.mt-10 {
  margin-top: 10px;
}
.mb-10 {
  margin-bottom: 10px;
}
.ml-15 {
  margin-left: 15px;
}

.mr-15 {
  margin-right: 15px;
}
.mt-15 {
  margin-top: 15px;
}
.mb-15 {
  margin-bottom: 15px;
}
.ml-20 {
  margin-left: 20px;
}
.mr-20 {
  margin-right: 20px;
}
.mt-20 {
  margin-top: 20px;
}
.mb-20 {
  margin-bottom: 20px;
}
.p-5 {
  padding: 5px;
}
.p-10 {
  padding: 10px;
}
.p-15 {
  padding: 15px;
}
.p-20 {
  padding: 20px;
}
.pl-5 {
  padding-left: 5px;
}
.pr-5 {
  padding-right: 5px;
}
.pt-5 {
  padding-top: 5px;
}
.pb-5 {
  padding-bottom: 5px;
}
.pl-10 {
  padding-left: 10px;
}
.pr-10 {
  padding-right: 10px;
}
.pt-10 {
  padding-top: 10px;
}
.pb-10 {
  padding-bottom: 10px;
}
.pl-15 {
  padding-left: 15px;
} 
.pr-15 {
  padding-right: 15px;
} 
.pt-15 {
  padding-top: 15px;
}
.pb-15 {
  padding-bottom: 15px;
}
.font-bold {
  font-weight: bold;
}
.font-normal {
  font-weight: normal;
}
.font-italic {
  font-style: italic;
}
.xs {
  font-size: 12px !important;
}
.sm {
  font-size: 14px !important;
}
.md {
  font-size: 16px !important;
}
.lg {
  font-size: 18px !important;
}
.xl {
  font-size: 20px !important;
}
.gray-200 {
  color: #E3E3E3;
}
.gray-400 {
  color: rgba(0, 0, 0, 0.4);
}
.radius5{
  border-radius: 5px;
}
.radius10{
  border-radius: 10px;
}
.radius20{
  border-radius: 20px;
}
.radius30{
  border-radius: 30px;
}

.fullscreen{
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: -1;
  &.aiMask {
   background: url("../src/assets/images/aippt-bg.jpg") no-repeat center center;
   background-size:cover;


  }
}



.red{
  color: red;
}
.red-border{
  border: 1px solid red;
}

</style>