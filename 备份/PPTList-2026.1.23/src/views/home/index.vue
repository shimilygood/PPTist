<template>
 <div class="home-page">
    <AIPPTDialog>
       <template #skipHome>
         <button @click="skipHome()">跳过首页</button>
       </template>
    </AIPPTDialog>
   
 </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore } from '@/store'
import AIPPTDialog from '../Editor/AIPPTDialog.vue'
const { isHome } = storeToRefs(useScreenStore())
const skipHome = () => {
  useScreenStore().setIsHome(false)
}
</script>

<style lang="scss" scoped>
.home-page{
  width: 1040px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  align-items: center;
}

</style>