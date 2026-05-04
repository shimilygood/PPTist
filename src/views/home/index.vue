<template>
 <div class="home-page">
    <AIPPTDialog>
       <template #skipHome>
         <Button type="primary" size="small" class="btnOK"  @click="skipHome()">开始创作</Button>
       </template>
    </AIPPTDialog>
 </div>
</template>

<script lang="ts" setup>
import AIPPTDialog from '@/views/Editor/AIPPTDialog.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const skipHome = () => {
  router.push({
    path: '/editor',
  })
}

</script>

<style scoped>
.home-page{
  width: 640px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  align-items: center;
}

</style>