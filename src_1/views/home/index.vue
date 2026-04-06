<template>
 <div class="home-page">
    <AIPPTDialog>
       <template #skipHome>
         <Button type="primary" size="small" class="btnOK"  @click="skipHome()">去设计</Button>
       </template>
    </AIPPTDialog>
 </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useScreenStore } from '@/store'
import AIPPTDialog from '@/views/Editor/AIPPTDialog.vue'
import {useRouter  } from "vue-router";
const router = useRouter();
const { isHome } = storeToRefs(useScreenStore())
const skipHome = () => {
  useScreenStore().setIsHome(false);
  router.push({
      path: "/editor",
    })
}
</script>

<style scoped>
.home-page{
  width: 1040px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  align-items: center;
}

</style>