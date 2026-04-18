<template>
  <div class="adv-layer" @click="closeMenu">
    <!-- 画板 / 图层 切换标签 -->
    <div class="layer-tabs">
      <button :class="['layer-tab', { active: tab === 'artboard' }]" @click.stop="tab = 'artboard'">画板</button>
      <button :class="['layer-tab', { active: tab === 'layer' }]" @click.stop="tab = 'layer'">图层</button>
    </div>

    <!-- 画板 tab：幻灯片列表 -->
    <div v-if="tab === 'artboard'" class="artboard-list">
      <div
        v-for="(slide, index) in slides"
        :key="slide.id"
        class="artboard-row"
        :class="{ active: index === slideIndex }"
        @click="switchSlide(index)"
      >
        <span class="row-arrow">›</span>
        <span class="row-hash">#</span>
        <span class="row-name">画板{{ index + 1 }}</span>
        <div class="row-menu-wrap" @click.stop>
          <button class="row-more" @click="toggleMenu(index)">···</button>
          <!-- 操作下拉菜单 -->
          <div v-if="openMenuIdx === index" class="popup-menu">
            <div class="popup-item" @click.stop="doSlideAction('copy', index)">复制</div>
            <div class="popup-item" @click.stop="doSlideAction('paste', index)">粘贴</div>
            <div class="popup-divider"></div>
            <div class="popup-item popup-danger" @click.stop="doSlideAction('delete', index)">删除</div>
            <div class="popup-divider"></div>
            <div class="popup-item" @click.stop="doSlideAction('order', index)">图层顺序</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图层 tab：按幻灯片展开的元素树 -->
    <div v-else class="layer-list">
      <template v-for="(slide, si) in slides" :key="slide.id">
        <!-- 画板标题行（可展开/收起） -->
        <div
          class="slide-row"
          :class="{ active: si === slideIndex }"
          @click="toggleExpand(si)"
        >
          <span class="row-arrow" :class="{ rotated: expandedSet.has(si) }">›</span>
          <span class="row-hash">#</span>
          <span class="row-name">画板{{ si + 1 }}</span>
          <button class="row-more" @click.stop>···</button>
        </div>

        <!-- 展开后显示该幻灯片的元素树 -->
        <template v-if="expandedSet.has(si)">
          <template v-for="item in getGroupedEls(slide)" :key="item.id">
            <!-- 组合元素 -->
            <template v-if="item.type === 'group'">
              <div class="el-group-row">
                <span class="el-icon el-icon-group"></span>
                <span class="el-name">组</span>
              </div>
              <div
                v-for="child in (item as GroupEl).elements"
                :key="child.id"
                class="el-row el-child"
                :class="{ selected: activeElementIdList.includes(child.id) }"
                @click.stop="selectEl(child.id)"
              >
                <span class="el-icon" :class="`el-icon-${child.type}`"></span>
                <span class="el-name">{{ child.name || ELEMENT_TYPE_ZH[child.type] }}</span>
                <div class="el-actions">
                  <button
                    class="el-act"
                    :title="hiddenElementIdList.includes(child.id) ? '显示' : '隐藏'"
                    @click.stop="toggleHideElement(child.id)"
                  >
                    <span :class="hiddenElementIdList.includes(child.id) ? 'act-eye-off' : 'act-eye'"></span>
                  </button>
                </div>
              </div>
            </template>

            <!-- 普通元素 -->
            <div
              v-else
              class="el-row"
              :class="{ selected: activeElementIdList.includes(item.id) }"
              @click.stop="selectEl(item.id)"
            >
              <span class="el-icon" :class="`el-icon-${(item as PPTElement).type}`"></span>
              <span class="el-name">{{ (item as PPTElement).name || ELEMENT_TYPE_ZH[(item as PPTElement).type] }}</span>
              <div class="el-actions">
                <button
                  class="el-act"
                  :title="hiddenElementIdList.includes(item.id) ? '显示' : '隐藏'"
                  @click.stop="toggleHideElement(item.id)"
                >
                  <span :class="hiddenElementIdList.includes(item.id) ? 'act-eye-off' : 'act-eye'"></span>
                </button>
              </div>
            </div>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement, Slide } from '@/types/slides'
import { ELEMENT_TYPE_ZH } from '@/configs/element'
import useSlideHandler from '@/hooks/useSlideHandler'
import useHideElement from '@/hooks/useHideElement'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { slides, slideIndex } = storeToRefs(slidesStore)
const { activeElementIdList, hiddenElementIdList } = storeToRefs(mainStore)

const { copySlide, pasteSlide, deleteSlide } = useSlideHandler()
const { toggleHideElement } = useHideElement()

// 组合元素虚拟类型
interface GroupEl { type: 'group'; id: string; elements: PPTElement[] }
type TreeEl = PPTElement | GroupEl

const tab = ref<'artboard' | 'layer'>('artboard')
// 图层tab展开状态集合
const expandedSet = ref(new Set<number>([slideIndex.value]))
// 画板tab当前打开的菜单索引
const openMenuIdx = ref(-1)

// 切换幻灯片
const switchSlide = (index: number) => {
  mainStore.setActiveElementIdList([])
  slidesStore.updateSlideIndex(index)
}

// 展开/收起画板元素
const toggleExpand = (si: number) => {
  const s = new Set(expandedSet.value)
  s.has(si) ? s.delete(si) : s.add(si)
  expandedSet.value = s
  if (!s.has(si)) return
  // 展开时同步切换当前页
  switchSlide(si)
}

// 切换画板操作菜单
const toggleMenu = (index: number) => {
  openMenuIdx.value = openMenuIdx.value === index ? -1 : index
}

const closeMenu = () => { openMenuIdx.value = -1 }

// 画板操作
const doSlideAction = (action: string, index: number) => {
  openMenuIdx.value = -1
  switchSlide(index)
  if (action === 'copy') copySlide()
  else if (action === 'paste') pasteSlide()
  else if (action === 'delete') deleteSlide()
}

// 选中元素
const selectEl = (id: string) => {
  mainStore.setActiveElementIdList([id])
}

// 将 slide.elements 按 groupId 分组，供模板循环
const getGroupedEls = (slide: Slide): TreeEl[] => {
  const result: TreeEl[] = []
  for (const el of slide.elements) {
    if (el.groupId) {
      const last = result[result.length - 1]
      if (last && last.type === 'group' && last.id === el.groupId) {
        (last as GroupEl).elements.push(el)
      }
      else result.push({ type: 'group', id: el.groupId, elements: [el] })
    }
    else result.push(el)
  }
  return result
}

// 当前幻灯片切换时自动展开对应画板
watch(slideIndex, (val) => {
  const s = new Set(expandedSet.value)
  s.add(val)
  expandedSet.value = s
}, { immediate: true })
</script>

<style lang="scss" scoped>
.adv-layer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 标签切换 */
.layer-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.layer-tab {
  flex: 1;
  height: 32px;
  border-radius: 8px;
  border: 1px solid $borderColor;
  background: #f5f7fb;
  font-size: 13px;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.15s;

  &.active {
    background: $themeColor;
    color: #fff;
    border-color: $themeColor;
    font-weight: 600;
  }

  &:not(.active):hover { background: #edf0f7; }
}

/* 公共行样式 */
.artboard-row,
.slide-row {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 4px 0 6px;
  border-radius: 6px;
  cursor: pointer;
  gap: 4px;
  transition: background 0.12s;

  &:hover { background: #f3f5fb; }
  &.active { background: rgba(37, 99, 235, 0.08); }
}

.row-arrow {
  font-size: 14px;
  color: #9ca3af;
  min-width: 14px;
  transition: transform 0.15s;
}

.row-arrow.rotated { transform: rotate(90deg); }

.row-hash {
  font-size: 11px;
  color: #9ca3af;
  min-width: 12px;
}

.row-name {
  flex: 1;
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-more {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #9ca3af;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -1px;

  &:hover { background: #e5e7eb; color: #374151; }
}

/* 菜单弹出 */
.row-menu-wrap {
  position: relative;
}

.popup-menu {
  position: absolute;
  right: 0;
  top: 28px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 100;
  min-width: 120px;
  overflow: hidden;
}

.popup-item {
  padding: 8px 14px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  &:hover { background: #f5f7fb; }
  &.popup-danger { color: #ef4444; }
  &.popup-danger:hover { background: #fef2f2; }
}

.popup-divider { height: 1px; background: #f3f4f6; }

/* 图层元素行 */
.el-group-row {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 4px 0 28px;
  gap: 6px;
}

.el-row {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 4px 0 28px;
  gap: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;

  &.el-child { padding-left: 44px; }
  &:hover { background: #f3f5fb; }
  &.selected { background: rgba(37, 99, 235, 0.08); }
}

.el-icon,
.el-icon-group {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  position: relative;
}

/* 元素类型图标（CSS绘制） */
.el-icon-text::before {
  content: 'T';
  font-weight: bold;
  font-size: 12px;
  color: #4b5563;
  font-family: serif;
  line-height: 14px;
}

.el-icon-shape::before {
  content: '';
  display: block;
  width: 11px;
  height: 11px;
  border: 1.5px solid #4b5563;
  border-radius: 1px;
  margin-top: 1px;
}

.el-icon-image::before {
  content: '';
  display: block;
  width: 12px;
  height: 10px;
  border: 1.5px solid #4b5563;
  border-radius: 1px;
  margin-top: 2px;
  background: linear-gradient(135deg, #d1d5db 0%, #d1d5db 50%, #9ca3af 50%, #9ca3af 100%);
}

.el-icon-line::before {
  content: '';
  display: block;
  width: 12px;
  height: 0;
  border-top: 1.5px solid #4b5563;
  transform: rotate(-35deg);
  margin-top: 7px;
}

.el-icon-table::before,
.el-icon-chart::before {
  content: '';
  display: block;
  width: 12px;
  height: 10px;
  border: 1.5px solid #4b5563;
  border-radius: 1px;
  margin-top: 2px;
  background: linear-gradient(to bottom, transparent 4px, #d1d5db 4px, #d1d5db 5px, transparent 5px),
    linear-gradient(to right, transparent 5px, #d1d5db 5px, #d1d5db 6px, transparent 6px);
}

.el-icon-video::before { content: '▷'; font-size: 12px; color: #4b5563; line-height: 14px; }
.el-icon-audio::before { content: '♪'; font-size: 12px; color: #4b5563; line-height: 14px; }
.el-icon-latex::before { content: 'Σ'; font-size: 11px; color: #4b5563; font-family: serif; line-height: 14px; }

.el-icon-group::before {
  content: '';
  display: block;
  width: 12px;
  height: 10px;
  border: 1.5px solid #4b5563;
  border-radius: 1px;
  margin-top: 2px;
  box-shadow: -2px -2px 0 #fff, -2px -2px 0 1px #9ca3af;
}

.el-name {
  flex: 1;
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.el-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.1s;
}

.el-row:hover .el-actions,
.el-group-row:hover .el-actions { opacity: 1; }

.el-act {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;

  &:hover { background: #e5e7eb; color: #374151; }
}

/* 显示/隐藏图标 */
.act-eye,
.act-eye-off {
  display: inline-block;
  width: 12px;
  height: 8px;
  position: relative;
}

.act-eye::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1.2px solid currentColor;
  border-radius: 50%;
}

.act-eye::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
}

.act-eye-off::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1.2px solid currentColor;
  border-radius: 50%;
  opacity: 0.4;
}

.act-eye-off::after {
  content: '';
  position: absolute;
  left: 1px;
  top: 50%;
  right: 1px;
  border-top: 1.2px solid currentColor;
  transform: rotate(-30deg);
}
</style>
