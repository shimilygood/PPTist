<template>
  
  <div class="aippt-dialog">
     <div class="fullscreen aiMask"></div>
    <div class="header">
      <div class="title"></div>
      <span class="subtite" v-if="step === 'template'">从下方挑选合适的模板生成PPT，或<span class="local" v-tooltip="'上传.pptist格式模板文件'" @click="uploadLocalTemplate()">使用本地模板生成</span></span>
      <span class="subtite" v-else-if="step === 'outline'">确认下方内容大纲（点击编辑内容，右键添加/删除大纲项），开始选择模板</span>
      <span class="subtite" v-else>输入内容一键生成PPT</span>
    </div>
    
    <template v-if="step === 'setup'">
      <div class="input-wrapper">
         <Input class="input" 
          ref="inputRef"
         v-model:value="keyword" 
         :maxlength="50" 
         placeholder="请输入您要生成的PPT主题" 
        @enter="createOutline()"
      >
      <template #prefix>
        <span class="pptfont ppt-create-star" style="color: #0C77FF"></span>
      </template>
        <template #suffix>
          <span class="count">{{ keyword.length }} / 50</span>
          <div class="submit" type="primary" @click="createOutline()">
             <span class="pptfont ppt-create-send"></span>
          </div>
        </template>
      </Input>
      <div class="recommends">
        热门PPT主题：
        <div class="recommend" v-for="(item, index) in recommends" :key="index" @click="setKeyword(item)">{{ item }}</div>
      </div>
      </div>
     

      <div class="configs">
        <div class="config-item">
          <div class="label">语言：</div>
          <Select 
            class="config-content"
            style="width: 80px;"
            v-model:value="language"
            :options="[
              { label: '中文', value: '中文' },
              { label: '英文', value: 'English' },
              { label: '日文', value: '日本語' },
            ]"
          />
        </div>
        <div class="config-item">
          <div class="label">风格：</div>
          <Select 
            class="config-content"
            style="width: 80px;"
            v-model:value="style"
            :options="[
              { label: '通用', value: '通用' },
              { label: '学术风', value: '学术风' },
              { label: '职场风', value: '职场风' },
              { label: '教育风', value: '教育风' },
              { label: '营销风', value: '营销风' },
            ]"
          />
        </div>
        <div class="config-item">
          <div class="label">模型：</div>
          <Select 
            class="config-content"
            style="width: 190px;"
            v-model:value="model"
            :options="[
              { label: 'GLM-4.5-Flash', value: 'GLM-4.5-Flash' },
              { label: 'Doubao-Seed-1.6-flash', value: 'ark-doubao-seed-1.6-flash' },
            ]"
          />
        </div>
        <div class="config-item">
          <div class="label">配图：</div>
          <Select 
            class="config-content"
            style="width: 100px;"
            v-model:value="img"
            :options="[
              { label: '无', value: '' },
              { label: '模拟测试', value: 'test' },
              { label: 'AI搜图', value: 'ai-search', disabled: true },
              { label: 'AI生图', value: 'ai-create', disabled: true },
            ]"
          />
        </div>
         
      </div>
     <div v-if="!isEmptySlide">
          <div class="config-item">
            <Checkbox v-model:value="overwrite">覆盖已有幻灯片</Checkbox>
          </div>
        </div>
      <!-- <div class="importFile">
        <div class="item"><span class="pptfont ppt-create-importPPT"></span>导入ppt模版</div>
        <div class="item"><span class="pptfont ppt-create-createDirectly"></span>直接创建</div>
        <div class="item"><span class="pptfont ppt-create-templateCreation"></span>从模版创建</div>
        
      </div> -->
       <div class="dialog-footer flex justify-center align-center">
        <slot name="skipHome"></slot>
        <!-- ...existing footer 按钮或其它内容... -->
      </div>
    </template>
    <div class="preview" v-if="step === 'outline'">
      <pre ref="outlineRef" v-if="outlineCreating">{{ outline }}</pre>
       <div class="outline-view" v-else>
         <OutlineEditor v-model:value="outline" />
       </div>
      <div class="btns" v-if="!outlineCreating">
        <Button class="btn" type="primary" @click="step = 'template'">选择模板</Button>
        <Button class="btn flex align-center" @click="outline = ''; step = 'setup'">
          <span class="pptfont ppt-create-again"></span>重新生成
          </Button>
      </div>
    </div>
    <div class="select-template" v-if="step === 'template'">
       <div class="input-wrapper2 mb-10">
          <Input class="input" 
            ref="inputRef"
          v-model:value="keywords" 
          :maxlength="50" 
          placeholder="请输入您要生成的PPT主题" 
          >
          <template #prefix>
            <span class="pptfont ppt-general-search-icon"></span>
          </template>
        </Input>
      </div>
      <div class="scene-row">
        <div class="scene-label">场景：</div>
        <div class="chips">
          <div
            class="chip"
            v-for="tab in TabbarList"
            :key="tab.value"
            :class="{ active: currentTab === tab.value }"
            @click="selectTab(tab.value)"
          >{{ tab.label }}</div>
          <div class="chip more">›</div>
        </div>
      </div>
      
      <div class="templates">
        <div class="template" 
          :class="{ 'selected': selectedTemplate === template.id }" 
          v-for="template in templates" 
          :key="template.id" 
          @click="selectedTemplate = template.id"
        >
          <img :src="template.cover" :alt="template.name">
        </div>
      </div>
      <div class="btns">
        <Button class="btn" type="primary" @click="createPPT()">生成</Button>
        <Button class="btn" @click="step = 'outline'">返回大纲</Button>
      </div>
    </div>

   
    <FullscreenSpin :loading="loading" tip="AI生成中，请耐心等待 ..." />
   
  
  </div>

</template>

<script lang="ts" setup>
import { ref, onMounted, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import api from '@/services'
import useAIPPT from '@/hooks/useAIPPT'
import useSlideHandler from '@/hooks/useSlideHandler'
import type { AIPPTSlide } from '@/types/AIPPT'
import type { Slide, SlideTheme } from '@/types/slides'
import message from '@/utils/message'
import { decrypt } from '@/utils/crypto'
import { useMainStore, useSlidesStore } from '@/store'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import OutlineEditor from '@/components/OutlineEditor.vue'
import Checkbox from '@/components/Checkbox.vue'
import Tabs from '@/components/Tabs.vue'


const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { templates } = storeToRefs(slidesStore)

const { resetSlides, isEmptySlide } = useSlideHandler()
const { AIPPT, presetImgPool, getMdContent } = useAIPPT()

const language = ref('中文')
const style = ref('通用')
const img = ref('')
const keyword = ref('')
const keywords = ref('')
const outline = ref('')
const selectedTemplate = ref('template_1')
const loading = ref(false)
const outlineCreating = ref(false)
const overwrite = ref(true)
const step = ref<'setup' | 'outline' | 'template'>('setup')   //setup
const model = ref('GLM-4.5-Flash')
const outlineRef = useTemplateRef<HTMLElement>('outlineRef')
const inputRef = useTemplateRef<InstanceType<typeof Input>>('inputRef')

const recommends = ref([
  '2025科技前沿动态',
  '大数据如何改变世界',
  '餐饮市场调查与研究',
  'AIGC在教育领域的应用',
  '社交媒体与品牌营销',
  '5G技术如何改变我们的生活',
  '年度工作总结与展望',
  '区块链技术及其应用',
  '大学生职业生涯规划',
  '公司年会策划方案',
]) 

onMounted(() => {
  setTimeout(() => {
    inputRef.value!.focus()
  }, 500)
})

const setKeyword = (value: string) => {
  keyword.value = value
  inputRef.value!.focus()
}
const currentTab = ref('all')
const TabbarList = ref([
  { label: '全部模板', value: 'all' },
  { label: '总结汇报', value: 'hubao' },
  { label: '教育培训', value: 'jiaoyu' },
  { label: '医学医疗', value: 'yixue' },
  { label: '营销推广', value: 'yingxiao' },
  { label: '商业计划', value: 'jihua' },
])
const selectTab = (value: string) => {
  currentTab.value = value
  
}
const createOutline = async () => {
  if (!keyword.value) return message.error('请先输入PPT主题')

  loading.value = true
  outlineCreating.value = true
  
  const stream = await api.AIPPT_Outline({
    content: keyword.value,
    language: language.value,
    model: model.value,
  })
  if (typeof stream === 'object' && stream.state === -1) {
    loading.value = false
    return message.error('该模型API的并发数过高，请更换其他模型重试')
  }

  loading.value = false
  step.value = 'outline'

  const reader: ReadableStreamDefaultReader = stream.body.getReader()
  const decoder = new TextDecoder('utf-8')
  
  const readStream = () => {
    reader.read().then(({ done, value }) => {
      if (done) {
        outline.value = getMdContent(outline.value)
        outline.value = outline.value.replace(/<!--[\s\S]*?-->/g, '').replace(/<think>[\s\S]*?<\/think>/g, '')
        outlineCreating.value = false
        return
      }
  
      const chunk = decoder.decode(value, { stream: true })
      outline.value += chunk

      if (outlineRef.value) {
        outlineRef.value.scrollTop = outlineRef.value.scrollHeight + 20
      }

      readStream()
    })
  }
  readStream()
}

const createPPT = async (template?: { slides: Slide[], theme: SlideTheme }) => {
  loading.value = true

  if (overwrite.value) resetSlides()

  const stream = await api.AIPPT({
    content: outline.value,
    language: language.value,
    style: style.value,
    model: model.value,
  })
  if (typeof stream === 'object' && stream.state === -1) {
    loading.value = false
    return message.error('该模型API的并发数过高，请更换其他模型重试')
  }

  if (img.value === 'test') {
    const imgs = await api.getMockData('imgs')
    presetImgPool(imgs)
  }

  let templateData = template
  if (!templateData) templateData = await api.getMockData(selectedTemplate.value)
  const templateSlides: Slide[] = templateData!.slides
  const templateTheme: SlideTheme = templateData!.theme

  const reader: ReadableStreamDefaultReader = stream.body.getReader()
  const decoder = new TextDecoder('utf-8')
  
  const readStream = () => {
    reader.read().then(({ done, value }) => {
      if (done) {
        loading.value = false
        mainStore.setAIPPTDialogState(false)
        slidesStore.setTheme(templateTheme)
        return
      }
  
      const chunk = decoder.decode(value, { stream: true })
      try {
        const text = chunk.replace('```json', '').replace('```', '').trim()
        if (text) {
          const slide: AIPPTSlide = JSON.parse(chunk)
          AIPPT(templateSlides, [slide])
        }
      }
      catch (err) {
        // eslint-disable-next-line
        console.error(err)
      }

      readStream()
    })
  }
  readStream()
}

const uploadLocalTemplate = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pptist'
  input.click()
  input.addEventListener('change', e => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        try {
          const { slides, theme } = JSON.parse(decrypt(reader.result as string))
          createPPT({ slides, theme })
        }
        catch {
          message.error('上传的模板文件数据异常，请重新上传或使用预置模板')
        }
      })
      reader.readAsText(file)
    }
  })
}
</script>

<style lang="scss" scoped>
.aippt-dialog {
  margin: -20px;
  padding: 30px;
  z-index: 2;
  border-radius: 10px;
}
.header {
  margin-bottom: 12px;
  text-align: center;
  .title {
    width: 194px;
    height: 56px;
    margin: 0 auto;
    background: url("../../assets/images/aidesign.png");
  }
  .subtite {
    color: #333;
    font-family: PingFang SC;
    font-weight: 600;
    font-style: Semibold;
    font-size: 32px;
    leading-trim: NONE;
    line-height: 60px;
    letter-spacing: 4%;
    text-align: center;


    .local {
      color: $themeColor;
      text-decoration: underline;
      cursor: pointer;
    }
  }
}
.input-wrapper{
  background: linear-gradient(90deg, #D9C8FF 0%, #B7EEFF 100%);
  padding: 20px;
  border-radius: 10px;
}
.input{
  border-radius: 6px;
  height: 40px !important;
  display: flex;
  align-items: center;
  border: none;
}
.preview {
  pre {
    max-height: 450px;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #f1f1f1;
    overflow: auto;
  }
  .outline-view {
    max-height: 450px;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #f1f1f1;
    overflow: auto;
  }
  .btns {
    display: flex;
    justify-content: center;
    align-items: center;

    .btn {
      width: 120px;
      margin: 0 5px;
    }
  }
}
.select-template {
  .scene-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .scene-label {
      font-size: 14px;
      color: #333;
      margin-right: 10px;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;

      .chip {
        font-size: 16px;
        background-color: #F7FAFF;
        border-radius: 16px;
        padding: 5px 15px;
        margin-right: 8px;
        cursor: pointer;

        &.active {
           background-color: $themeColor;
           color: #fff;
        }
      }

      .more {
        font-size: 16px;
        cursor: pointer;
        display: flex;
        border-radius: 20px;
        &:hover {
          
        }
      }
    }
  }
  .templates {
    max-height: 450px;
    overflow: auto;
    display: flex;
    margin-bottom: 10px;
    padding-right: 5px;
    @include flex-grid-layout();
  
    .template {
      border: 2px solid #fff;
      border-radius: $borderRadius10;
      overflow: hidden;
      @include flex-grid-layout-children(4, 24%);

      &.selected {
        border: 2px solid $themeColor;
      }
  
      img {
        width: 100%;
        min-height: 175px;
      }
    }
  }
  .btns {
    display: flex;
    justify-content: center;
    align-items: center;

    .btn {
      width: 120px;
      margin: 0 5px;
    }
  }
}
.recommends {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
  align-items: center;
  font-size: 12px;
  .recommend {
    font-size: 12px;
    background-color: #fff;
    border-radius: $borderRadius;
    padding: 3px 10px;
    margin-right: 5px;
    margin-top: 5px;
    border-radius: 20px;
    cursor: pointer;

    &:hover {
      color: $themeColor;
    }
  }
}
.importFile{
  margin-top: 15px;
  display: flex;
  justify-content: flex-start;
   font-size: 14px;
   .item{
        font-size: 14px;
        color: $textColor;
        margin: 0 10px 0 0;
        padding: 5px 10px;
        border: 1px solid $borderColor;
        border-radius: $borderRadius10;
        align-items: center;
        cursor: pointer;
        .pptfont{
            font-size: 18px;
            margin-right: 5px;
          }
   
        &:hover {
          background-color: $themeHoverColor;
          color: #fff;
        }
   }
  
}
.configs {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .config-item {
    font-size: 13px;
    display: flex;
    align-items: center;
  }
}
.count {
  font-size: 12px;
  color: #999;
  margin-right: 10px;
}
.submit {
  height: 30px;
  font-size: 12px;
  background-color: $themeColor;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: $borderRadius;
  cursor: pointer;

  &:hover {
    background-color: $themeHoverColor;
  }

  .icon {
    font-size: 15px;
    margin-right: 3px;
  }
}


@media screen and (width <= 800px) {
  .configs {
    margin-top: 15px;
    display: flex;
    flex-direction: column;

    .config-item {
      margin-top: 8px;

      .label {
        flex-shrink: 0;
      }

      .config-content {
        width: 100% !important;
      }
    }
  }
  .select-template {
    .templates {
      padding-right: 0;
  
      .template {
        img {
          min-height: 60px;
        }
      }
    }
  }
}

@media screen and (width <= 380px) {
  .preview {
    pre {
      max-height: 400px;
    }
    .outline-view {
      max-height: 400px;
    }
  }
  .select-template {
    .templates {
      max-height: 400px;
    }
  }
}
</style>