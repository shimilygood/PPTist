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
          <div class="label">分页：</div>
          <Select 
            class="config-content"
            style="width: 110px;"
            v-model:value="pageRange"
            :options="pageRangeOptions"
          />
        </div>
        <!-- <div class="config-item">
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
        </div> -->
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
          <div class="config-item" style="margin-top: 10px;">
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
       <div ref="outlineRef" class="outline-stream" v-if="outlineCreating" v-html="outlineHtml"></div>
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
            :key="tab.groupId"
            :class="{ active: currentTab === tab.groupId }"
            @click="selectTab(tab.groupId)"
          >{{ tab.groupName }}</div>
        </div>
      </div>
      
      <div class="templates">
        <div class="template" 
          :class="{ 'selected': selectedTemplate === template.id }" 
          v-for="template in templateCards" 
          :key="template.id" 
          @click="selectedTemplate = template.id"
        >
          <img :src="template.coverUrl" :alt="template.name">
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
import { ref, onMounted, useTemplateRef, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { GetHotTopicList, GeneratePPTOutline, GeneratePPT, GetPPTGroups, GetPPTContentJson, SearchPPTTemplates } from '@/api/editor'
import useSlideHandler from '@/hooks/useSlideHandler'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
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


const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const router = useRouter()
const route = useRoute()

const { isEmptySlide } = useSlideHandler()
const { addSlidesFromData } = useAddSlidesOrElements()

const language = ref('中文')
const style = ref('通用')
const img = ref('')
const keyword = ref('')
const keywords = ref('')
const outline = ref('')
const selectedTemplate = ref<number | null>(null)
const pageRange = ref('5')
const loading = ref(false)
const outlineCreating = ref(false)
const overwrite = ref(true)
const step = ref<'setup' | 'outline' | 'template'>('setup') // setup
const outlineRef = useTemplateRef<HTMLElement>('outlineRef')
const inputRef = useTemplateRef<InstanceType<typeof Input>>('inputRef')
const outlineHtml = ref('')

const pageRangeOptions = [
  { label: '5页', value: '5' },
  { label: '10页', value: '10' },
  { label: '15页', value: '15' },
  { label: '20页以上', value: '20+' },
]

const pageRangeMap: Record<string, number> = {
  '5': 5,
  '10': 10,
  '15': 15,
  '20+': 20,
}

const AI_HOME_CACHE_PREFIX = 'AI_HOME_GENERATED_PPT_'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

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

const fetchHotTopics = async () => {
  try {
    const res = await GetHotTopicList({ type: 0 }) as { code?: number; data?: Array<{ title?: string }> }
    if (res.code === 0 && Array.isArray(res.data)) {
      const titles = res.data.map(item => item.title || '').filter(Boolean)
      if (titles.length) recommends.value = titles
    }
  }
  catch {
    // keep local fallback recommends when request fails
  }
}

onMounted(async () => {
  setTimeout(() => {
    inputRef.value!.focus()
  }, 500)

  await fetchHotTopics()
  await fetchTemplateGroups()
  await fetchTemplateList({ hasRecommend: 0 })
})

const setKeyword = (value: string) => {
  keyword.value = value
  inputRef.value!.focus()
}

type PPTGroup = {
  groupId: number
  groupName: string
}

type PPTTemplateCard = {
  id: number
  name: string
  cover: string
  coverUrl: string
  json: string | null
  width?: number
  height?: number
}

const currentTab = ref<number | null>(null)
const TabbarList = ref<PPTGroup[]>([])
const templateCards = ref<PPTTemplateCard[]>([])

const parseCoverUrl = (cover: string) => {
  const text = (cover || '').trim()
  if (!text) return ''
  if (text.startsWith('http')) return text

  try {
    const parsed = JSON.parse(text) as Array<{ url?: string }>
    if (Array.isArray(parsed) && parsed.length) return parsed[0]?.url || ''
  }
  catch {
    return text
  }

  return text
}

const fetchTemplateList = async (queryParameter: { groupId?: number; hasRecommend?: 0 | 1 }) => {
  try {
    const res = await SearchPPTTemplates(queryParameter) as {
      code?: number
      msg?: string
      data?: { list?: Array<{ id: number; name: string; cover: string; json: string | null; width?: number; height?: number }> }
    }

    if (res.code !== 0) {
      templateCards.value = []
      return message.error(res.msg || '获取模板列表失败')
    }

    const list = Array.isArray(res.data?.list) ? res.data!.list! : []
    templateCards.value = list.map(item => ({
      ...item,
      coverUrl: parseCoverUrl(item.cover),
    }))
    selectedTemplate.value = templateCards.value[0]?.id ?? null
  }
  catch {
    templateCards.value = []
    message.error('获取模板列表失败')
  }
}

const fetchTemplateGroups = async () => {
  try {
    const res = await GetPPTGroups() as { code?: number; msg?: string; data?: PPTGroup[] }
    if (res.code !== 0) {
      TabbarList.value = []
      return message.error(res.msg || '获取模板分组失败')
    }

    TabbarList.value = Array.isArray(res.data) ? res.data : []
    currentTab.value = TabbarList.value[0]?.groupId ?? null
  }
  catch {
    TabbarList.value = []
    message.error('获取模板分组失败')
  }
}

const selectTab = async (groupId: number) => {
  currentTab.value = groupId
  await fetchTemplateList({ groupId, hasRecommend: 1 })
}

type GeneratedPPTContent = {
  title?: string
  width?: number
  height?: number
  theme?: SlideTheme
  slides?: Slide[]
}

const parseGeneratedContent = (raw: unknown): GeneratedPPTContent | null => {
  if (!raw) return null

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as GeneratedPPTContent
    }
    catch {
      return null
    }
  }

  if (typeof raw === 'object') {
    return raw as GeneratedPPTContent
  }

  return null
}

const setGeneratedContentCache = (id: number, content: GeneratedPPTContent) => {
  const key = `${AI_HOME_CACHE_PREFIX}${id}`
  sessionStorage.setItem(key, JSON.stringify({ id, content, createdAt: Date.now() }))
}

const applyGeneratedContent = (content: GeneratedPPTContent, themeFallback?: SlideTheme) => {
  const generatedSlides = Array.isArray(content.slides) ? content.slides : []
  const generatedTheme = themeFallback || content.theme

  if (!generatedSlides.length) {
    message.error('生成结果为空')
    return false
  }

  if (typeof content.title === 'string' && content.title.trim()) {
    slidesStore.setTitle(content.title.trim())
  }

  if (typeof content.width === 'number' && content.width > 0) {
    slidesStore.setViewportSize(content.width)
    if (typeof content.height === 'number' && content.height > 0) {
      slidesStore.setViewportRatio(content.height / content.width)
    }
  }

  if (overwrite.value || isEmptySlide.value) {
    slidesStore.setSlides(generatedSlides, generatedTheme)
    slidesStore.updateSlideIndex(0)
  }
  else {
    addSlidesFromData(generatedSlides)
    if (generatedTheme) slidesStore.setTheme(generatedTheme)
  }

  return true
}

const closeAllEditorDialogs = () => {
  mainStore.setDialogForExport('')
  mainStore.setSelectPanelState(false)
  mainStore.setSearchPanelState(false)
  mainStore.setNotesPanelState(false)
  mainStore.setSymbolPanelState(false)
  mainStore.setMarkupPanelState(false)
  mainStore.setImageLibPanelState(false)
  mainStore.setAIPPTDialogState(false)
}

const outlineJsonToMarkdown = (raw: string) => {
  try {
    const parsed = JSON.parse(raw) as {
      title?: string
      subtitle?: string
      slides?: Array<{ title?: string; items?: string[]; content?: string; layout?: string }>
    }
    const lines: string[] = []

    if (parsed.title) lines.push(`# ${parsed.title}`)
    if (parsed.subtitle) lines.push(`## ${parsed.subtitle}`)

    for (const slide of parsed.slides || []) {
      if (slide.layout === 'toc') {
        lines.push('## 目录')
      }
      else if (slide.title) {
        lines.push(`## ${slide.title}`)
      }

      for (const item of slide.items || []) {
        lines.push(`- ${item}`)
      }

      if (slide.content && !slide.items?.length) {
        lines.push(`- ${slide.content}`)
      }
    }

    return lines.join('\n')
  }
  catch {
    return raw
  }
}

const outlineJsonToMarkdownPreview = (raw: string, fallback = '') => {
  const normalized = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n')

  // 只有在完整 JSON 可解析时才走标准 markdown 转换，避免展示原始 JSON 片段
  try {
    JSON.parse(normalized)
    return outlineJsonToMarkdown(normalized)
  }
  catch {
    // ignore parse failure for stream fragments
  }

  const lines: string[] = []
  const mainTitle = normalized.match(/"title"\s*:\s*"([^"]*)"/)
  if (mainTitle?.[1]) lines.push(`# ${mainTitle[1]}`)

  const subtitle = normalized.match(/"subtitle"\s*:\s*"([^"]*)"/)
  if (subtitle?.[1]) lines.push(`## ${subtitle[1]}`)

  const titleMatches = Array.from(normalized.matchAll(/"title"\s*:\s*"([^"]*)"/g)).map(item => item[1]).filter(Boolean)
  for (let i = 1; i < titleMatches.length; i++) {
    lines.push(`## ${titleMatches[i]}`)
  }

  const itemBlocks = Array.from(normalized.matchAll(/"items"\s*:\s*\[([^\]]*)/g)).map(item => item[1])
  for (const block of itemBlocks) {
    const items = Array.from(block.matchAll(/"([^"]+)"/g)).map(item => item[1]).filter(Boolean)
    for (const item of items) lines.push(`- ${item}`)
  }

  const contentMatches = Array.from(normalized.matchAll(/"content"\s*:\s*"([^"]+)"/g)).map(item => item[1]).filter(Boolean)
  for (const item of contentMatches) lines.push(`- ${item}`)

  return lines.length ? lines.join('\n') : fallback
}

const renderMarkdownLine = (line: string) => {
  if (!line.trim()) return '<div class="outline-line"><br/></div>'
  return `<div class="outline-line">${markdown.render(line)}</div>`
}

const createOutline = async () => {
  if (!keyword.value) return message.error('请先输入PPT主题')

  outline.value = ''
  outlineHtml.value = ''
  loading.value = true
  outlineCreating.value = true

  try {
    const size = pageRangeMap[pageRange.value] || pageRangeMap['5']
    const response = await GeneratePPTOutline({
      topic: keyword.value,
      outline: '',
      templateId: null,
      size,
    })

    if (!response.ok || !response.body) {
      loading.value = false
      outlineCreating.value = false
      return message.error('生成大纲失败')
    }

    loading.value = false
    step.value = 'outline'

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let chunkBuffer = ''
    let outlineJson = ''
    let outlineMarkdown = ''
    let finalized = false
    let renderedLineCount = 0
    const pendingLines: string[] = []
    let lineTimer: ReturnType<typeof setInterval> | null = null
    const lineRenderInterval = 140

    const scrollToBottom = () => {
      if (outlineRef.value) {
        outlineRef.value.scrollTop = outlineRef.value.scrollHeight + 20
      }
    }

    const clearLineTimer = () => {
      if (lineTimer) {
        clearInterval(lineTimer)
        lineTimer = null
      }
    }

    const startLineRender = () => {
      if (lineTimer) return
      lineTimer = setInterval(() => {
        if (!pendingLines.length) {
          clearLineTimer()
          return
        }

        const line = pendingLines.shift() as string
        outlineHtml.value += renderMarkdownLine(line)
        scrollToBottom()
      }, lineRenderInterval)
    }

    const finalizeOutline = () => {
      if (finalized) return
      finalized = true

      const finalMarkdown = outlineJsonToMarkdown(outlineJson)
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<think>[\s\S]*?<\/think>/g, '')

      syncMarkdownRender(finalMarkdown)
      outline.value = finalMarkdown

      // 确保定时器里的剩余行快速落盘
      while (pendingLines.length) {
        const line = pendingLines.shift() as string
        outlineHtml.value += renderMarkdownLine(line)
      }

      // 收尾兜底：确保流式区已是最终完整内容
      outlineHtml.value = markdown.render(finalMarkdown)

      clearLineTimer()
      scrollToBottom()

      // 给用户一个可见完成瞬间，再切换到可编辑视图
      nextTick(() => {
        setTimeout(() => {
          outlineCreating.value = false
        }, 1000)
      })
    }

    const isDoneToken = (text: string) => {
      const normalized = text.trim().replace(/^"|"$/g, '')
      return normalized === '[DONE]' || normalized.toUpperCase() === 'DONE'
    }

    const syncMarkdownRender = (nextMarkdown: string) => {
      const normalized = nextMarkdown.replace(/\r\n/g, '\n')
      const prev = outlineMarkdown

      if (normalized === prev) return

      // 流式阶段只做“追加渲染”，避免非前缀更新导致的整块重绘闪烁
      if (!normalized.startsWith(prev)) return

      outlineMarkdown = normalized
      outline.value = normalized

      const lines = normalized.split('\n')
      const nextLines = lines.slice(renderedLineCount)
      if (nextLines.length) {
        pendingLines.push(...nextLines)
        renderedLineCount += nextLines.length
        startLineRender()
      }
    }

    const flushEvents = () => {
      const events = chunkBuffer.split('\n\n')
      chunkBuffer = events.pop() || ''

      for (const event of events) {
        if (finalized) break

        const dataStr = event
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.replace(/^data:\s?/, ''))
          .join('')

        if (!dataStr) continue

        if (isDoneToken(dataStr)) {
          finalizeOutline()
          void reader.cancel().catch(() => undefined)
          continue
        }

        try {
          const payload = JSON.parse(dataStr) as { code?: number; msg?: string; data?: string }
          if (payload.code !== 0) throw new Error(payload.msg || '生成大纲失败')

          const text = typeof payload.data === 'string' ? payload.data : ''
          if (isDoneToken(text)) {
            finalizeOutline()
            void reader.cancel().catch(() => undefined)
            continue
          }

          outlineJson += text
          const previewMarkdown = outlineJsonToMarkdownPreview(outlineJson, outlineMarkdown)
          syncMarkdownRender(previewMarkdown)
        }
        catch {
          // ignore incomplete event fragments
        }
      }
    }

    const readStream = () => {
      reader.read().then(({ done, value }) => {
        if (finalized) return

        if (done) {
          if (chunkBuffer.trim()) {
            chunkBuffer += '\n\n'
            flushEvents()
          }

          finalizeOutline()
          return
        }

        chunkBuffer += decoder.decode(value, { stream: true })
        flushEvents()
        if (finalized) return
        readStream()
      }).catch(() => {
        if (finalized) return
        clearLineTimer()
        outlineCreating.value = false
        message.error('生成大纲失败')
      })
    }

    readStream()
  }
  catch {
    loading.value = false
    outlineCreating.value = false
    outlineHtml.value = ''
    message.error('生成大纲失败')
  }
}

const createPPT = async (template?: { slides: Slide[], theme: SlideTheme }) => {
  loading.value = true
  let success = false
  const inHomePage = route.path === '/home'

  try {
    const topic = (keywords.value || keyword.value).trim()
    const templateIdNumber = Number(selectedTemplate.value)
    const size = pageRangeMap[pageRange.value] || pageRangeMap['5']

    const res = await GeneratePPT({
      topic,
      outline: outline.value,
      templateId: Number.isFinite(templateIdNumber) && templateIdNumber > 0 ? templateIdNumber : null,
      size,
      id: slidesStore.pptId,
    }) as {
      code?: number
      msg?: string
      data?: { id?: number | string | null; contentJson?: string | GeneratedPPTContent | null; contentJsonUrl?: string | null }
    }
  
    if (res.code !== 0) {
      return message.error(res.msg || '生成PPT失败')
    }

    const contentRaw = res.data?.contentJson ?? (res.data?.contentJsonUrl
      ? await GetPPTContentJson<GeneratedPPTContent>(res.data.contentJsonUrl)
      : null)
    const content = parseGeneratedContent(contentRaw)

    // Home 场景：生成后直接带 id 跳转编辑页，由编辑器按 id 拉取并应用内容
    if (inHomePage) {
      const generatedId = Number(res.data?.id)
      if (!Number.isFinite(generatedId) || generatedId <= 0) {
        return message.error('生成成功但未返回有效ID，无法进入编辑页')
      }

      if (!content) {
        return message.error('生成数据解析失败')
      }

      const applied = applyGeneratedContent(content, template?.theme)
      if (!applied) {
        return
      }

      slidesStore.setPptId(generatedId)
      setGeneratedContentCache(generatedId, content)
     
      success = true
      await router.push({
        path: '/editor',
        query: { id: String(generatedId) },
      })
      return
    }

    if (!content) {
      return message.error('生成数据解析失败')
    }

    const applied = applyGeneratedContent(content, template?.theme)
    if (!applied) {
      return
    }

    success = true
   router.push({
        path: '/editor',
        query: { id: slidesStore.pptId },
      })
  }
  catch {
    message.error('生成PPT失败')
  }
  finally {
    loading.value = false
    if (success) closeAllEditorDialogs()
  }
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
    font-size: 14px;
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
  background: linear-gradient(180deg, #f8fbff 0%, #f4f8ff 100%);
  border: 1px solid #e6eefc;
  border-radius: 14px;
  padding: 14px;

  pre {
    max-height: 450px;
    padding: 12px;
    margin-bottom: 15px;
    background-color: #fff;
    border: 1px solid #e7edf8;
    border-radius: 10px;
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
    overflow: auto;
  }

  .outline-view {
    max-height: 450px;
    padding: 12px;
    margin-bottom: 15px;
    background-color: #fff;
    border: 1px solid #e7edf8;
    border-radius: 10px;
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
    overflow: auto;
  }

  .outline-stream {
    max-height: 450px;
    padding: 12px;
    margin-bottom: 15px;
    background-color: #fff;
    border: 1px solid #e7edf8;
    border-radius: 10px;
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
    overflow: auto;
  }

  .outline-stream :deep(.outline-line) {
    opacity: 1;
  }

  .outline-stream :deep(h1),
  .outline-stream :deep(h2),
  .outline-stream :deep(h3),
  .outline-stream :deep(p),
  .outline-stream :deep(ul) {
    margin: 0 0 8px;
  }

  .outline-stream :deep(ul) {
    padding-left: 20px;
  }

  .btns {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    .btn {
      width: 128px;
      height: 38px;
      margin: 0;
      border-radius: 10px;
      font-weight: 600;
    }
  }
}

.select-template {
  background: #fff;
  border: 1px solid #e8edf7;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);

  .input-wrapper2 {
    border: 1px solid #e5eaf4;
    border-radius: 10px;
    padding: 2px;
    background: #f9fbff;
  }

  .scene-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .scene-label {
      font-size: 13px;
      color: #5b6478;
      font-weight: 600;
      margin-right: 10px;
      width: 50px;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .chip {
        font-size: 13px;
        color: #4d5a73;
        background-color: #f5f8ff;
        border: 1px solid #e4ebfb;
        border-radius: 16px;
        padding: 4px 12px;
        margin-right: 0;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #b5cdfd;
          background-color: #edf4ff;
          color: #294d9d;
        }

        &.active {
           background: linear-gradient(90deg, #3f8cff 0%, #2d6bff 100%);
           border-color: transparent;
           color: #fff;
           box-shadow: 0 6px 14px rgba(45, 107, 255, 0.25);
        }
      }
    }
  }

  .templates {
    max-height: 320px;
    overflow: auto;
    display: flex;
    margin-bottom: 12px;
    padding-right: 5px;
    @include flex-grid-layout();
  
    .template {
      border: 1px solid #e8eefb;
      border-radius: $borderRadius10;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      @include flex-grid-layout-children(4, 24%);

      &:hover {
        transform: translateY(-2px);
        border-color: #bed2ff;
        box-shadow: 0 8px 18px rgba(41, 77, 157, 0.14);
      }

      &.selected {
        border: 1px solid $themeColor;
        box-shadow: 0 0 0 2px rgba(80, 141, 255, 0.16);
      }
  
      img {
        width: 100%;
        display: block;
        object-fit: cover;
        min-height: 100px;
      }
    }
  }

  .btns {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    .btn {
      width: 128px;
      height: 38px;
      margin: 0;
      border-radius: 10px;
      font-weight: 600;
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
.label {
  margin-right: 6px;
  flex-shrink: 0;
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