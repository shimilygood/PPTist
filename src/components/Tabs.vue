<template>
  <div class="tabs"
    :class="{
      'card': card,
      'tabBtn': tabBtn,
      'space-around': spaceAround,
      'space-between': spaceBetween,
    }" 
    :style="tabsStyle || {}"
    ref="tabsEl"
  >
    <div v-if="tabBtn" class="tab-indicator" :style="indicatorStyle"></div>
    <div 
      class="tab" 
      :class="{ 'active': tab.key === value, 'disabled': tab.disabled }"
      v-for="tab in tabs" 
      :key="tab.key"
      :style="{
        ...(tabStyle || {}),
        '--color': tab.color,
      }"
      @click="!tab.disabled && emit('update:value', tab.key)"
    >{{tab.label}}</div>
  </div>
</template>

<script lang="ts" setup>
import { type CSSProperties, ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'

interface TabItem {
  key: string
  label: string
  color?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  value: string
  tabs: TabItem[]
  card?: boolean
  tabBtn?: boolean
  tabsStyle?: CSSProperties
  tabStyle?: CSSProperties
  spaceAround?: boolean
  spaceBetween?: boolean
}>(), {
  card: false,
  tabBtn: false,
  spaceAround: false,
  spaceBetween: false,
})

const emit = defineEmits<{
  (event: 'update:value', payload: string): void
}>()

const tabsEl = ref<HTMLElement | null>(null)
const indicatorStyle = ref<Record<string, string>>({})

const updateIndicator = () => {
  nextTick(() => {
    const el = tabsEl.value
    if (!el || !props.tabBtn) {
      indicatorStyle.value = { width: '0px', transform: 'translateX(0px)' }
      return
    }
    const active = el.querySelector('.tab.active') as HTMLElement | null
    if (!active) {
      indicatorStyle.value = { width: '0px', transform: 'translateX(0px)' }
      return
    }
    const left = active.offsetLeft
    const width = active.offsetWidth-10
    const color = getComputedStyle(active).getPropertyValue('--color') || ''
    indicatorStyle.value = {
      width: `${width}px`,
      transform: `translateX(${left}px)`,
      background: '#fff'
    }
  })
}

onMounted(() => {
  updateIndicator()
  window.addEventListener('resize', updateIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator)
})

watch(() => props.value, updateIndicator)
watch(() => props.tabs, updateIndicator)
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  user-select: none;
  line-height: 1;

    &:not(.card) {
    font-size: 13px;
    align-items: center;
    justify-content: flex-start;

    &.space-around {
      justify-content: space-around;
    }
    &.space-between {
      justify-content: space-between;
    }

    .tab {
      text-align: center;
      padding: 8px 10px;
      cursor: pointer;

      &.disabled {
        opacity: 0.35;
        cursor: default;
      }
    }
  }

  &.card {
    height: 40px;
    font-size: 12px;
    flex-shrink: 0;

    .tab {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: $lightGray;
      border-bottom: 1px solid $borderColor;
      cursor: pointer;

      &.active {
        background-color: transparent;
        border-bottom-color: transparent;
      }

      & + .tab {
        border-left: 1px solid $borderColor;
      }
    }
  }
  &.tabBtn {
    height: 40px;
    font-size: 12px;
    flex-shrink: 0;
    background-color: #F5F8FE;
     border-radius: 4px;
     margin: 10px;
     border: none;
     position: relative;
     overflow: hidden;
    .tab {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
     
      border-radius: 4px;
      cursor: pointer;

      /* tabs keep text static; background handled by indicator */
      &.active {
        color: #000;
        z-index: 2;
      }

      & + .tab {
       
      }
    }
    .tab-indicator {
      position: absolute;
      top: 4px;
      height: calc(100% - 8px);
      left: 4px;
      width: 0px;
      border-radius: 6px;
      background:#fff;
      box-shadow: 0 6px 18px rgba(42,104,232,0.08);
      transition: transform 260ms cubic-bezier(.2,.9,.3,1), width 260ms;
      z-index: 1;
    }
  }
}
</style>