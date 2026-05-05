<template>
  <div class="fullscreen-spin" :class="{ 'mask': mask }" v-if="loading">
    <div class="spin">
      <img class="spinner" src="@/assets/images/loading240.gif" alt="loading" />
      <div class="text">{{tip}}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  loading?: boolean
  mask?: boolean
  tip?: string
}>(), {
  loading: false,
  mask: true,
  tip: '',
})
</script>

<style lang="scss" scoped>
.fullscreen-spin {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;

  &.mask {
    background-color: rgba($color: #f1f1f1, $alpha: .7);
  }
}
.spin {
  width: 200px;
  height: 200px;
  position: fixed;
  top: 50%;
  left: 50%;
  margin-top: -100px;
  margin-left: -100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.spinner {
  width: 160px;
  height: 160px;
  object-fit: contain;
}
.text {
  margin-top: 10px;
  color: $themeColor;
}
</style>