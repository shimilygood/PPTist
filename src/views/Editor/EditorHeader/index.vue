<template>
  <div class="editor-header">
    <div class="left">
      <span class="pptfont ppt-nav-home"/>

      <Popover trigger="click" placement="bottom-start" v-model:value="mainMenuVisible">
        <template #content>
          <div class="main-menu">
            <div class="ai-menu" @click="openAIPPTDialog(); mainMenuVisible = false">
              <div class="icon"><IconClick theme="two-tone" :fill="['#ffc158', '#fff']" /></div>
              <div class="aippt-content">
                <div class="aippt"><span>AIPPT</span></div>
                <div class="aippt-subtitle">输入一句话，智能生成演示文稿</div>
              </div>
            </div>
          </div>
          <Divider :margin="10" />
          <div class="import-section">
            <div class="import-label">导入文件</div>
            <div class="import-grid">
              <FileInput class="import-block" accept="application/vnd.openxmlformats-officedocument.presentationml.presentation" @change="files => {
                importPPTXFile(files)
                mainMenuVisible = false
              }">
                <span class="icon"><IconFilePdf theme="multi-color" :fill="['#333', '#d14424', '#fff']" /></span>
                <span class="label">PPTX</span>
                <span class="sub-label">（仅供测试）</span>
              </FileInput>
              <FileInput class="import-block" accept=".json" @change="files => {
                importJSON(files)
                mainMenuVisible = false
              }">
                <span class="icon"><IconFileJpg theme="multi-color" :fill="['#333', '#d14424', '#fff']" /></span>
                <span class="label">JSON</span>
                <span class="sub-label">（仅供测试）</span>
              </FileInput>
              <FileInput class="import-block" accept=".pptist" @change="files => {
                importSpecificFile(files)
                mainMenuVisible = false
              }">
                <span class="icon"><IconNotes theme="multi-color" :fill="['#333', '#d14424', '#fff']" /></span>
                <span class="label">PPTIST</span>
                <span class="sub-label">（专属格式）</span>
              </FileInput>
            </div>
          </div>
          <Divider :margin="10" />
          <PopoverMenuItem class="popover-menu-item" @click="setDialogForExport('pptx')"><IconDownload class="icon" /> 导出文件</PopoverMenuItem>
          <Divider :margin="10" />
          <PopoverMenuItem class="popover-menu-item" @click="resetSlides(); mainMenuVisible = false"><IconRefresh class="icon" /> 重置幻灯片</PopoverMenuItem>
          <PopoverMenuItem class="popover-menu-item" @click="openMarkupPanel(); mainMenuVisible = false"><IconMark class="icon" /> 幻灯片类型标注</PopoverMenuItem>
          <PopoverMenuItem class="popover-menu-item" @click="mainMenuVisible = false; hotkeyDrawerVisible = true"><IconCommand class="icon" /> 快捷操作</PopoverMenuItem>
          <PopoverMenuItem class="popover-menu-item" @click="goLink('https://github.com/pipipi-pikachu/PPTist/issues')"><IconComment class="icon" /> 意见反馈</PopoverMenuItem>
          <PopoverMenuItem class="popover-menu-item" @click="goLink('https://github.com/pipipi-pikachu/PPTist/blob/master/doc/Q&A.md')"><IconHelpcenter class="icon" /> 常见问题</PopoverMenuItem>
          <Divider :margin="10" />
          <div class="statement">注：本站仅作测试/演示，不提供任何形式的服务</div>
        </template>
        <div class="menu-item">文件<span class="icon-item pptfont ppt-design-down ml-5" /></div>
      </Popover>
 <span class="handler-item pptfont ppt-fengexian gray-200"/>
      <div class="title">
        <Input 
          class="title-input" 
          ref="titleInputRef"
          v-model:value="titleValue" 
          @blur="handleUpdateTitle()" 
          v-if="editingTitle" 
        ></Input>
        <div 
          class="title-text"
          @click="startEditTitle()"
          :title="title"
          v-else
        >{{ title }}</div>
      </div>
      <span class="icon-item pptfont ppt-design-down ml-5" />
      <span class="handler-item pptfont ppt-fengexian gray-200"/>
      <span class="icon-item pptfont ppt-design-cloud ml-5" /> 
      <span class="xs gray-400 ml-5">保存于 13:16</span>
    </div>
    <div class="center">
          <div class="left-handler">
              <span class="handler-item pptfont ppt-design-rollback" :class="{ 'disable': !canUndo }" v-tooltip="'撤销（Ctrl + Z）'" @click="undo()" />
              <span class="handler-item pptfont ppt-design-advance" :class="{ 'disable': !canRedo }" v-tooltip="'重做（Ctrl + Y）'" @click="redo()" />
              
              <Popover trigger="click" center>
                <template #content>
                  <PopoverMenuItem class="popover-menu-item" @click="">手机海报1</PopoverMenuItem>
                  <PopoverMenuItem class="popover-menu-item" @click="">手机海报2</PopoverMenuItem>
                </template>
                <div class="arrow-btn">
                  <span style="font-size: 14px;">手机海报</span>
                  <IconDown class="arrow ml-10" /></div>
              </Popover>
              <div > <span class="handler-item pptfont ppt-fengexian gray-200"/></div>
              <div  class="icon-item"> <span class="handler-item pptfont ppt-Vector"/></div>
              <div class="icon-item" @click="enterScreening()"> <span class="handler-item pptfont ppt-animation-play"/></div>
            </div>
    </div>
    <div class="right">
       <div class="flex align-center mr-10">
       

        <Popover trigger="click" placement="bottom-start" v-model:value="presetLayoutPopoverVisible" center>
        <template #content>
          <Templates 
            @select="slide => { createSlideByTemplate(slide); presetLayoutPopoverVisible = false }"
            @selectAll="slides => { insertAllTemplates(slides); presetLayoutPopoverVisible = false }"
          />
        </template>
         <div class="menu-item xs"><span class="handler-item pptfont ppt-create-createDirectly"/>模版创建</div>
        <!-- <div class="select-btn"><IconDown /></div> -->
      </Popover>


        <div class="menu-item xs" @click="openAIPPTDialog(); mainMenuVisible = false"><span class="handler-item pptfont ppt-operate-AI-Creation"/>AI创建</div>
         <div class="group-menu-item">
        <div class="menu-item" v-tooltip="'幻灯片放映（F5）'" @click="enterScreening()">
         <span class="handler-item pptfont ppt-operate-demo"/>演示
        </div>
        <Popover trigger="click" center>
          <template #content>
            <PopoverMenuItem class="popover-menu-item" @click="enterScreeningFromStart()"><IconSlideTwo class="icon" /> 从头开始</PopoverMenuItem>
            <PopoverMenuItem class="popover-menu-item" @click="enterScreening()"><IconPpt class="icon" /> 从当前页开始</PopoverMenuItem>
          </template>
          <div class="arrow-btn"><IconDown class="arrow" /></div>
        </Popover>
      </div>
        <div class="btn button-ppt cur radius5">标准版</div>
        <div class="btn button-ppt mr-20 radius5">高级版</div>
         <div class="flex flex-center pl-10 pr-10 btnBlue"  @click="setDialogForExport('pptx')">
            <span class="pptfont ppt-create-download xs" />下载
          </div>
        <!-- <Button type="primary" size="small" class="radius5 "  v-tooltip="'导出'" @click="setDialogForExport('pptx')">
          <div class="flex flex-center pl-10 pr-10 radius5 btnOK">
            <span class="pptfont ppt-create-download xs"/>下载
          </div>
        </Button> -->
       </div>



     
      <!-- <div class="menu-item" v-tooltip="'AI生成PPT'" @click="openAIPPTDialog(); mainMenuVisible = false">
        <span class="text ai">AI</span>
      </div>
      <div class="menu-item" v-tooltip="'导出'" @click="setDialogForExport('pptx')">
        <IconDownload class="icon" />
      </div>
      <a class="github-link" v-tooltip="'Copyright © 2020-PRESENT pipipi-pikachu'" href="https://github.com/pipipi-pikachu/PPTist" target="_blank">
        <div class="menu-item"><IconGithub class="icon" /></div>
      </a> -->

    </div>

    <Drawer
      :width="320"
      v-model:visible="hotkeyDrawerVisible"
      placement="right"
    >
      <HotkeyDoc />
      <template v-slot:title>快捷操作</template>
    </Drawer>

    <FullscreenSpin :loading="exporting" tip="正在导入..." />
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore,useSnapshotStore } from '@/store'
import useScreening from '@/hooks/useScreening'
import useImport from '@/hooks/useImport'
import useSlideHandler from '@/hooks/useSlideHandler'
import type { DialogForExportTypes } from '@/types/export'
import Button from '@/components/Button.vue'
import HotkeyDoc from './HotkeyDoc.vue'
import FileInput from '@/components/FileInput.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import Drawer from '@/components/Drawer.vue'
import Input from '@/components/Input.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import Divider from '@/components/Divider.vue'

import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import Templates from './../Thumbnails/Templates.vue'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import type { Slide } from '@/types/slides'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { title } = storeToRefs(slidesStore)
const { enterScreening, enterScreeningFromStart } = useScreening()
const { importSpecificFile, importPPTXFile, importJSON, exporting } = useImport()
const { resetSlides,createSlideByTemplate,isEmptySlide, } = useSlideHandler()


const { creatingElement, creatingCustomShape, showSelectPanel, showSearchPanel, showNotesPanel, showSymbolPanel } = storeToRefs(mainStore)
const { canUndo, canRedo } = storeToRefs(useSnapshotStore())
const { redo, undo } = useHistorySnapshot()
// 打开选择面板
const toggleSelectPanel = () => {
  mainStore.setSelectPanelState(!showSelectPanel.value)
}

// 打开搜索替换面板
const toggleSraechPanel = () => {
  mainStore.setSearchPanelState(!showSearchPanel.value)
}

//模版创建
const presetLayoutPopoverVisible = ref(false)
const { addSlidesFromData } = useAddSlidesOrElements()
const insertAllTemplates = (slides: Slide[]) => {
  if (isEmptySlide.value) slidesStore.setSlides(slides)
  else addSlidesFromData(slides)
}



const mainMenuVisible = ref(false)
const hotkeyDrawerVisible = ref(false)
const editingTitle = ref(false)
const titleValue = ref('')
const titleInputRef = useTemplateRef<InstanceType<typeof Input>>('titleInputRef')

const startEditTitle = () => {
  titleValue.value = title.value
  editingTitle.value = true
  nextTick(() => titleInputRef.value?.focus())
}

const handleUpdateTitle = () => {
  slidesStore.setTitle(titleValue.value)
  editingTitle.value = false
}

const goLink = (url: string) => {
  window.open(url)
  mainMenuVisible.value = false
}

const setDialogForExport = (type: DialogForExportTypes) => {
  mainStore.setDialogForExport(type)
  mainMenuVisible.value = false
}

const openMarkupPanel = () => {
  mainStore.setMarkupPanelState(true)
}

const openAIPPTDialog = () => {
  mainStore.setAIPPTDialogState(true)
}
</script>

<style lang="scss" scoped>
.editor-header {
  background-color: #fff;
  user-select: none;
  border-bottom: 1px solid $borderColor;
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
}
.left, .center,.right {
  display: flex;
  justify-content: center;
  align-items: center;
}
.left-handler{
  display: flex;
  align-items: center;
}
.icon-item{
    margin-right: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    .icon{
      margin-right: 3px;
    }
  }
.handler-item {
  height: 30px;
  font-size: 14px;
  margin: 0 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: $borderRadius;
  overflow: hidden;
  cursor: pointer;

  &.disable {
    opacity: .5;
  }
}
.left-handler {
  .handler-item {
    padding: 0 8px;

    &.active,
    &:not(.disable):hover {
      background-color: #f1f1f1;
    }
  }
}
.menu-item {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  padding: 0 10px;
  border-radius: $borderRadius;
  cursor: pointer;

  .icon {
    font-size: 18px;
    color: #666;
  }
  .text {
    width: 18px;
    text-align: center;
    font-size: 17px;
  }
  .ai {
    background: linear-gradient(270deg, #d897fd, #33bcfc);
    background-clip: text;
    color: transparent;
    font-weight: 700;
  }

  &:hover {
    background-color: #f1f1f1;
  }
}
.popover-menu-item {
  display: flex;
  padding: 8px 10px;

  .icon {
    font-size: 18px;
    margin-right: 12px;
  }
}
.statement {
  font-size: 12px;
  color: #999;
  padding: 8px 10px;
  font-style: italic;
}
.main-menu {
  width: 300px;
}
.ai-menu {
  background: linear-gradient(270deg, #f8edff, #d4f1ff);
  color: $themeColor;
  border-radius: $borderRadius;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;

  .icon {
    font-size: 22px;
    margin-right: 16px;
  }
  .aippt-content {
    display: flex;
    flex-direction: column;
  }
  .aippt {
    font-weight: 700;
    font-size: 16px;

    span {
      background: linear-gradient(270deg, #d897fd, #33bcfc);
      background-clip: text;
      color: transparent;
    }
  }
  .aippt-subtitle {
    font-size: 12px;
    color: #777;
    margin-top: 5px;
  }
}

.import-section {
  padding: 5px 0;

  .import-label {
    font-size: 12px;
    color: #999;
    margin-bottom: 6px;
  }
  .import-grid {
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }
  .import-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    border-radius: $borderRadius;
    border: 1px solid $borderColor;
    transition: background-color .2s;
    cursor: pointer;
  
    &:hover {
      background-color: #f1f1f1;
    }
    .icon {
      font-size: 24px;
      margin-bottom: 2px;
    }
    .label {
      font-size: 12px;
      text-align: center;
    }
    .sub-label {
      font-size: 10px;
      color: #999;
    }
  }
}

.group-menu-item {
  height: 30px;
  display: flex;
  margin: 0 8px;
  padding: 0 2px;
  border-radius: $borderRadius;

  &:hover {
    background-color: #f1f1f1;
  }

  .menu-item {
    padding: 0 3px;
  }
  .arrow-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
  }
}
.title {
  height: 30px;
  margin-left: 2px;
  font-size: 13px;

  .title-input {
    width: 200px;
    height: 100%;
    padding-left: 0;
    padding-right: 0;

    ::v-deep(input) {
      height: 28px;
      line-height: 28px;
    }
  }
  .title-text {
    min-width: 20px;
    max-width: 400px;
    line-height: 30px;
    padding: 0 6px;
    border-radius: $borderRadius;
    cursor: pointer;

    @include ellipsis-oneline();

    &:hover {
      background-color: #f1f1f1;
    }
  }
}
.github-link {
  display: inline-block;
  height: 30px;
}

.button-ppt{
  border: 1px solid $borderColor;
  padding: 1px 10px;
  font-size: 14px;
}
.button-ppt.cur{
  border: 1px solid #2A6AE9;
}
</style>