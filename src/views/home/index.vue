<template>
  <div class="page-wrapper">
    <!-- 头部 -->
    <header class="header-block">
      <div class="content-shell header-shell">
        <div class="header-left">
          <img class="header-logo" :src="logoImage" alt="云绘" />
          <!-- <span class="header-brand">云绘</span> -->
        </div>
        <div class="header-right">
          <button type="button" class="header-vip-btn">
             <span class="pptfont ppt-general-VIP"></span>
            会员限时优惠
          </button>
          <button type="button" class="header-edition-btn">
            个人版
              <span class="pptfont ppt-arrow-down-triangle"></span>
          </button>
          <button type="button" class="header-avatar" aria-label="个人中心">云</button>
        </div>
      </div>
    </header>

    <!-- 一键生成PPT -->
    <section class="hero-section">
      <div class="hero-bg hero-bg-left"></div>
      <div class="hero-bg hero-bg-right"></div>
      <div class="hero-shape hero-shape-triangle"></div>
      <div class="hero-shape hero-shape-circle"></div>
      <div class="content-shell hero-shell">
        <h1 class="hero-title">一键<span class="hero-title-accent">生成PPT</span></h1>
        <p class="hero-subtitle">支持输入主题、上传文件、粘贴大纲创作PPT</p>

        <!-- tab 滑块切换 -->
        <div class="input-method-tabs">
          <div class="tab-glider" :style="{ transform: `translateX(${activeTabIndex * 100}%)` }"></div>
          <button
            v-for="(tab, i) in inputMethods"
            :key="tab.key"
            type="button"
            class="input-method-tab"
            :class="{ active: activeInputMethod === tab.key }"
            @click="activeInputMethod = tab.key"
          >
          <span class="pptfont" :class="tab.icon"></span>
            <!-- <el-icon><component :is="tab.icon" /></el-icon> -->
            {{ tab.label }}
          </button>
        </div>

        <!-- 主卡片 -->
        <div class="hero-card-wrap">
          <div class="hero-card">

            <!-- 输入主题 -->
            <div v-if="activeInputMethod === 'topic'" class="hero-input-box">
              <textarea
                v-model="topicText"
                class="hero-textarea"
                placeholder="帮我生成一份PPT，内容是关于「消防安全意识培训」"
                rows="3"
              />
            </div>

            <!-- 上传文档 -->
            <div
              v-else-if="activeInputMethod === 'upload'"
              class="hero-input-box hero-upload-box"
              :class="{ 'drag-over': isDragOver }"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="handleDrop"
            >
              <input ref="fileInputRef" type="file" accept=".doc,.docx,.pdf,.txt" class="upload-hidden-input" @change="handleFileChange" />
              <div class="upload-drop-inner">
                <el-icon class="upload-cloud-icon"><UploadFilled /></el-icon>
                <p class="upload-main-text">拖拽文档到此处</p>
                <p class="upload-sub-text">支持DOCX文档、PDF文档，支持导图视图，合成智能文档结构导入</p>
                <div class="upload-entry-row">
                  <button type="button" class="upload-entry-btn">
                    <el-icon><FolderOpened /></el-icon>
                    云端文件
                  </button>
                  <button type="button" class="upload-entry-btn" @click="fileInputRef?.click()">
                    <el-icon><Document /></el-icon>
                    本地文件
                  </button>
                </div>
              </div>
            </div>

            <!-- 粘贴大纲 -->
            <div v-else class="hero-input-box hero-outline-box">
              <textarea
                v-model="outlineText"
                class="hero-textarea"
                placeholder="在此处输入或粘贴大纲，内容需要包含页面层级结构，AI将为您智能推理每页内容方向。&#10;示例参考：&#10;第一章写页眉页尾，第二章写核心观点，第三章写案例分析。&#10;此文档正文仅示意，为了效果呈现，请使用真实场景数据。"
                rows="4"
              />
            </div>
            <!-- 底部工具栏 -->
            <div class="hero-tool-row">
              <div class="tool-pills-left">
               
                <!-- 参数配置（仅输入主题） -->
                 
                <el-select v-if="activeInputMethod === 'topic'" v-model="pptPurpose" class="tool-select" :prefix-icon="Connection" placeholder="参数配置" size="small">
                  <el-option v-for="opt in pptPurposeOptions" :key="opt.value" :value="opt.value" :label="opt.label">
                    <span class="select-opt-label">{{ opt.label }}</span>
                    <span class="select-opt-desc">{{ opt.desc }}</span>
                  </el-option>
                </el-select>

                <!-- 联网搜索（仅输入主题） -->
                <button
                  v-if="activeInputMethod === 'topic'"
                  type="button"
                  class="tool-pill"
                  :class="{ 'tool-pill-active': webSearch }"
                  @click="webSearch = !webSearch"
                >
                  <el-icon><Connection /></el-icon>
                  联网搜索
                </button>

                <!-- 智能配图（全部tab） -->
                <el-select v-model="picMode" class="tool-select" :prefix-icon="Picture" placeholder="智能配图" size="small">
                  <el-option v-for="opt in picModeOptions" :key="opt.value" :value="opt.value" :label="opt.label">
                    <span class="select-opt-label">{{ opt.label }}</span>
                    <span class="select-opt-desc">{{ opt.desc }}</span>
                  </el-option>
                </el-select>

                <!-- 语言（输入主题 + 粘贴大纲） -->
                <el-select v-if="activeInputMethod !== 'upload'" v-model="lang" class="tool-select" :prefix-icon="Compass" placeholder="中文" size="small">
                  <el-option v-for="opt in langOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                </el-select>

                <!-- 页数（仅输入主题） -->
                <el-select v-if="activeInputMethod === 'topic'" v-model="pageCount" class="tool-select" :prefix-icon="Document" placeholder="页数" size="small">
                  <el-option v-for="n in pageCountList" :key="n" :value="n" :label="`${n}页`" />
                </el-select>
              </div>

              <button type="button" class="generate-btn" :class="{ 'is-loading': generating }" :disabled="generating" @click="handleGenerate">
                {{ generating ? '生成中…' : '立即生成' }}
                <span class="generate-btn-icon">
                  <el-icon><Right /></el-icon>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- 快捷标签（仅输入主题态显示） -->
        <div v-if="activeInputMethod === 'topic'" class="hero-tags-row">
          <button
            v-for="tag in heroTags"
            :key="tag"
            type="button"
            class="hero-tag"
            @click="topicText = `帮我生成一份PPT，内容是关于「${tag.replace(/PPT$/, '')}」`"
          >
            {{ tag }}
          </button>
          <button type="button" class="hero-tags-refresh" aria-label="换一批" @click="refreshHeroTags">
            <el-icon><RefreshRight /></el-icon>
          </button>
        </div>
      </div>
    </section>


      <!--  PPT模板 -->
      <section class="template-section">
        <div class="section-container">
          <header class="section-header">
            <h2 class="section-title">海量优质PPT模板</h2>
            <p class="section-subtitle">选择模板，AI一键智能排版生成PPT</p>
          </header>

          <div class="template-category-wrap">
            <div v-for="(row, rowIndex) in templateCategoryRows" :key="rowIndex" class="template-category-row">
              <button v-for="item in row" :key="item.groupId" type="button" class="template-category-btn"
                :class="{ active: activeTemplateGroupId === item.groupId }" @click="handleTemplateCategoryClick(item)">
                {{ item.groupName }}
              </button>
            </div>
          </div>

          <div class="template-grid" v-loading="templateLoading">
            <article
              v-for="(card, index) in templateCards"
              :key="`${card.id}-${index}`"
              class="template-card"
              :class="{ active: selectedTemplateId === card.id }"
              @click="selectedTemplateId = card.id"
            >
              <div class="template-card-cover">
                <el-image class="template-card-image" :src="card.cover" :alt="card.name" fit="cover" lazy />
              </div>
              <p class="template-card-title">{{ card.name }}</p>
              <span v-if="selectedTemplateId === card.id" class="template-card-check">
                <el-icon>
                  <Check />
                </el-icon>
              </span>
            </article>
          </div>

          <div v-if="templateCards.length < templateTotal" class="template-more-row">
            <el-button plain class="template-more-btn" :loading="templateLoading" @click="handleTemplateLoadMore">查看更多</el-button>
          </div>
        </div>
      </section>


      <!-- 产品功能 -->
      <section class="feature-section">
        <div class="section-container">
          <header class="section-header">
            <h2 class="section-title section-title-md">产品功能</h2>
            <p class="section-subtitle section-subtitle-sm">AI智能生成与美化PPT，高效完成专业演示制作</p>
          </header>

          <div class="feature-grid">
            <article v-for="card in featureCards" :key="card.title" class="feature-card" :class="card.colSpan">
              <!-- <div class="feature-card-head">
                <h3 class="feature-card-title">{{ card.title }}</h3>
                <p class="feature-card-desc">{{ card.desc }}</p>
              </div> -->
              <div class="feature-card-visual">
                <img class="feature-card-img" :class="card.visualClass" :src="card.visual" :alt="card.title" />
              </div>
            </article>
          </div>
        </div>
      </section>


      <!-- 智能创作 -->
      <section class="scene-section">
        <div class="section-container">
          <header class="section-header">
            <h2 class="section-title section-title-md">智能创作，覆盖全行业场景</h2>
            <p class="section-subtitle section-subtitle-sm">AI深度赋能内容创作，轻松适配多行业专业演示场景</p>
          </header>

          <div class="scene-tab-wrap">
            <div class="scene-tab-bar">
              <button v-for="item in sceneTabs" :key="item" type="button" class="scene-tab-btn"
                :class="{ active: activeSceneTab === item }" @click="activeSceneTab = item">
                {{ item }}
              </button>
            </div>
          </div>

          <div class="scene-content">
            <div class="scene-left">
              <span class="scene-quote"></span>

              <ul class="scene-feature-list">
                <li v-for="item in currentSceneContent.features" :key="item" class="scene-feature-item">
                  {{ item }}
                </li>
              </ul>

              <div class="scene-tag-grid">
                <span v-for="tag in currentSceneContent.tags" :key="tag" class="scene-mini-tag">
                  <el-icon class="scene-tag-icon">
                    <StarFilled />
                  </el-icon>
                  {{ tag }}
                </span>
              </div>

              <button type="button" class="scene-cta-btn">
                <el-icon>
                  <MagicStick />
                </el-icon>
                开始AI生成PPT
              </button>
            </div>

            <div class="scene-visual">
              <img class="scene-img scene-img-main" :src="currentSceneContent.image" :alt="activeSceneTab" />
            </div>
          </div>
        </div>
      </section>

      <footer class="footer-block">
        <div class="content-shell footer-shell">
          <div class="footer-links">
            <span>隐私政策</span>
            <span>用户协议</span>
            <span>联系我们</span>
            <span>帮助中心</span>
            <span>关于我们</span>
            <span>友情链接</span>
          </div>
          <div class="footer-meta">备案号：皖ICP备2023000000号-1｜Copyright © 2024-2026 AI一键生成PPT</div>
        </div>
      </footer>


    <!-- 大纲预览弹窗 -->
    <el-dialog
      v-model="outlineDialogVisible"
      class="outline-gen-dialog"
      :close-on-click-modal="false"
      :width="600"
      :show-close="true"
      append-to-body
    >
      <div class="outline-dialog-body">
        <div class="outline-scroll" ref="outlineScrollRef">
          <transition-group name="outline-line" tag="div">
            <div
              v-for="line in outlineLines"
              :key="line.key"
              class="outline-row"
              :class="{ 'outline-row-sub': line.indent > 0, 'outline-row-end': line.isEnd }"
            >
              <template v-if="line.indent === 0 && !line.isEnd">
                <span v-if="line.badge" class="outline-badge" :class="`outline-badge-${line.badgeType}`">{{ line.badge }}</span>
                <span class="outline-row-dot" :class="!line.badge ? 'outline-row-dot-gray' : ''"></span>
                <span class="outline-row-text">{{ line.text }}</span>
              </template>
              <template v-else-if="line.indent > 0">
                <span class="outline-sub-indent"></span>
                <span class="outline-arrow">—→</span>
                <span class="outline-sub-text">{{ line.text }}</span>
              </template>
              <template v-else-if="line.isEnd">
                <span class="outline-end-dot"></span>
                <span class="outline-row-text outline-row-text-gray">{{ line.text }}</span>
              </template>
            </div>
          </transition-group>

          <!-- 流式光标 -->
          <div v-if="outlineLoading" class="outline-cursor-row">
            <span class="outline-cursor"></span>
          </div>

          <div v-if="!outlineLoading && !outlineLines.length" class="outline-empty">大纲内容将在此处显示</div>
        </div>
      </div>

      <template #footer>
        <div class="outline-dialog-footer">
          <button
            type="button"
            class="outline-btn-regen"
            :disabled="outlineLoading || pptGenerating"
            @click="streamOutline"
          >
            <el-icon><RefreshRight /></el-icon>
            重新生成
          </button>
          <button
            type="button"
            class="outline-btn-gen"
            :class="{ 'is-loading': pptGenerating }"
            :disabled="outlineLoading || pptGenerating"
            @click="handleOutlineGenerate"
          >
            {{ pptGenerating ? '生成中…' : '立即生成' }}
          </button>
        </div>
      </template>
    </el-dialog>

    <FullscreenSpin :loading="generating" tip="AI正在生成中，请耐心等待…" />
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, Bell, Check, Compass, Connection, Document, FolderOpened, Grid, MagicStick, Medal, Picture, QuestionFilled, RefreshRight, Right, Setting, StarFilled, UploadFilled } from "@element-plus/icons-vue";
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import logoImage from "@/assets/images/logo_1.png";
import product1Image from "@/assets/images/product_1.png";
import product2Image from "@/assets/images/product_2.png";
import product3Image from "@/assets/images/product_3.png";
import product4Image from "@/assets/images/product_4.png";
import product5Image from "@/assets/images/product_5.png";
import product6Image from "@/assets/images/product_6.png";
import product7Image from "@/assets/images/product_7.png";
import sence1Image from "@/assets/images/sence_1.png";
import sence2Image from "@/assets/images/sence_2.png";
import sence3Image from "@/assets/images/sence_3.png";
import sence4Image from "@/assets/images/sence_4.png";
import sence5Image from "@/assets/images/sence_5.png";
import sence6Image from "@/assets/images/sence_6.png";
import message from "@/utils/message";
import { GeneratePPT, GeneratePPTOutline, GetPPTGroups, GetPPTTask, ResolvePPTContent, SearchPPTTemplates } from "@/api/editor";
import FullscreenSpin from "@/components/FullscreenSpin.vue";

type InputMethodKey = "topic" | "upload" | "outline";

const inputMethods: { key: InputMethodKey; label: string; icon: any }[] = [
  { key: "topic", label: "输入主题", icon: "ppt-home-generate" },
  { key: "upload", label: "上传文档", icon: "ppt-home-upload-document" },
  { key: "outline", label: "粘贴大纲", icon: "ppt-home-paste-outline" },
];

const activeInputMethod = ref<InputMethodKey>("topic");
const activeTabIndex = computed(() => inputMethods.findIndex(t => t.key === activeInputMethod.value));

const topicText = ref("");
const outlineText = ref("");

// 联网搜索开关
const webSearch = ref(true);

// PPT 场景用途
const pptPurpose = ref("");
const pptPurposeOptions: any[] = [
  { value: "report", label: "工作汇报", desc: "" },
  { value: "plan", label: "方案策划", desc: "" },
  { value: "edu", label: "教学课件", desc: "" },
  { value: "academic", label: "学术报告", desc: "" },
  { value: "event", label: "活动宣传", desc: "" },
];

// 智能配图
const picMode = ref("auto");
const picModeOptions: any[] = [
  { value: "auto", label: "智能配图", desc: "" },
  { value: "library", label: "图库配图", desc: "" },
  { value: "ai", label: "AI 生成图片", desc: "" },
  { value: "smart", label: "智能配图", desc: "" },
];
// 语言
const lang = ref("zh");
const langOptions: any[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "英文" },
  { value: "ja", label: "日文" },
  { value: "ko", label: "韩文" },
  { value: "fr", label: "法文" },
  { value: "de", label: "德文" },
];

// 页数
const pageCount = ref();
const pageCountList = [4,8, 10, 12, 15, 20];

const isDragOver = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleDrop(e: any) {
  isDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) handleUploadFile(file);
}

function handleFileChange(e: any) {
  const file = e.target?.files?.[0];
  if (file) handleUploadFile(file);
}

const router = useRouter();
const generating = ref(false);

// 大纲弹窗
const outlineDialogVisible = ref(false);
const outlineLoading = ref(false);
const outlineData = ref<any>(null);
const outlineLines = ref<any[]>([]);
const outlineScrollRef = ref<HTMLElement | null>(null);
const pptGenerating = ref(false);
const currentTopic = ref('');

// 从 SSE 累积文本（可能是残缺 JSON）中提取可展示的大纲行
function extractOutlineLines(raw: string): any[] {
  const lines: any[] = [];

  // 顶层 title（在 "slides" 关键字之前）
  const preSlides = raw.split('"slides"')[0] || raw;
  const topTitleM = preSlides.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (topTitleM) {
    lines.push({ key: 'topic', badge: '主题', badgeType: 'theme', text: jsonUnescape(topTitleM[1]), indent: 0 });
  }

  // 按 "layout": 分割，逐段处理每张幻灯片
  const parts = raw.split(/"layout"\s*:\s*"/);
  let sectionIdx = 0;
  let pageIdx = 0;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const layoutEnd = part.indexOf('"');
    if (layoutEnd === -1) continue;
    const layout = part.slice(0, layoutEnd);
    const rest = part.slice(layoutEnd + 1);

    const titleM = rest.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const title = titleM ? jsonUnescape(titleM[1]) : '';

    if (layout === 'cover') {
      // 封面：跳过（已有顶层主题）
    } else if (layout === 'toc') {
      lines.push({ key: 'toc-hd', badge: '目录', badgeType: 'toc', text: '目录', indent: 0 });
      const itemsM = rest.match(/"items"\s*:\s*\[([^\]]*)\]/);
      if (itemsM) {
        const items = itemsM[1].match(/"((?:[^"\\]|\\.)*?)"/g) || [];
        items.forEach((s: string, ii: number) => {
          lines.push({ key: `toc-${ii}`, badge: '', badgeType: '', text: jsonUnescape(s.slice(1, -1)), indent: 1 });
        });
      }
    } else if (layout === 'section') {
      if (title) {
        lines.push({ key: `sec-${sectionIdx++}`, badge: '章节', badgeType: 'section', text: title, indent: 0 });
      }
    } else if (layout === 'content' || layout === 'two_column') {
      if (title) {
        const pgKey = `page-${pageIdx}`;
        lines.push({ key: pgKey, badge: '内页', badgeType: 'page', text: title, indent: 0 });
        const itemsM = rest.match(/"items"\s*:\s*\[([^\]]*)\]/);
        if (itemsM) {
          const items = itemsM[1].match(/"((?:[^"\\]|\\.)*?)"/g) || [];
          items.forEach((s: string, ii: number) => {
            lines.push({ key: `${pgKey}-${ii}`, badge: '', badgeType: '', text: jsonUnescape(s.slice(1, -1)), indent: 1 });
          });
        }
        pageIdx++;
      }
    } else if (layout === 'end') {
      lines.push({ key: 'end', badge: '', badgeType: '', text: title || '结语', indent: 0, isEnd: true });
    }
  }

  return lines;
}

// 解转义 JSON 字符串内容（处理 \n \t \uXXXX 等）
function jsonUnescape(s: string): string {
  try { return JSON.parse(`"${s}"`); } catch { return s; }
}

function handleUploadFile(_file: any) {
  // TODO: 接入上传接口
}

function handleGenerate() {
  if (activeInputMethod.value === 'topic' && !topicText.value.trim()) {
    return message.warning('请输入PPT主题');
  }
  if (activeInputMethod.value === 'outline' && !outlineText.value.trim()) {
    return message.warning('请输入或粘贴大纲内容');
  }

  currentTopic.value = activeInputMethod.value === 'topic'
    ? topicText.value.trim()
    : (outlineText.value.split('\n')[0] || '').trim() || 'PPT';

  outlineData.value = null;
  outlineLines.value = [];
  outlineDialogVisible.value = true;
  streamOutline();
}

async function streamOutline() {
  outlineLoading.value = true;
  outlineData.value = null;
  outlineLines.value = [];

  try {
    const response = await GeneratePPTOutline({
      topic: currentTopic.value,
      templateId: selectedTemplateId.value || undefined,
    });

    if (!response.ok || !response.body) throw new Error(`请求失败 HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let chunkBuffer = '';
    let outlineJson = '';

    const isDoneToken = (t: string) => {
      const n = t.trim().replace(/^"|"$/g, '');
      return n === '[DONE]' || n.toUpperCase() === 'DONE';
    };

    const scrollBottom = () => {
      nextTick(() => {
        if (outlineScrollRef.value) {
          outlineScrollRef.value.scrollTop = outlineScrollRef.value.scrollHeight;
        }
      });
    };

    // 按 SSE 规范以 \n\n 分割事件（与 AIPPTDialog.vue 一致）
    const processChunk = () => {
      const events = chunkBuffer.split('\n\n');
      chunkBuffer = events.pop() || '';

      for (const event of events) {
        const dataStr = event
          .split('\n')
          .filter(l => l.startsWith('data:'))
          .map(l => l.replace(/^data:\s?/, ''))
          .join('');

        if (!dataStr || isDoneToken(dataStr)) continue;

        try {
          const payload = JSON.parse(dataStr) as { code?: number; msg?: string; data?: string };
          if (payload.code !== 0) throw new Error(payload.msg || '大纲生成失败');

          const text = typeof payload.data === 'string' ? payload.data : '';
          if (!text || isDoneToken(text)) continue;

          outlineJson += text;

          const parsed = extractOutlineLines(outlineJson);
          if (parsed.length > outlineLines.value.length) {
            outlineLines.value = parsed;
            scrollBottom();
          }
        } catch {}
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (chunkBuffer.trim()) {
          chunkBuffer += '\n\n';
          processChunk();
        }
        break;
      }
      chunkBuffer += decoder.decode(value, { stream: true });
      processChunk();
    }

    // 流结束，完整解析最终 JSON
    if (outlineJson) {
      try {
        outlineData.value = JSON.parse(outlineJson);
        outlineLines.value = extractOutlineLines(outlineJson);
      } catch {
        outlineData.value = { title: currentTopic.value, slides: [] };
      }
    }
  } catch (err: any) {
    message.error(err?.message || '大纲生成失败');
  } finally {
    outlineLoading.value = false;
  }
}

async function handleOutlineGenerate() {
  if (outlineLoading.value || pptGenerating.value) return;
  pptGenerating.value = true;
  generating.value = true;

  try {
    const res = await GeneratePPT({
      topic: currentTopic.value,
      templateId: selectedTemplateId.value || undefined,
      outline: outlineData.value ? JSON.stringify(outlineData.value) : undefined,
      size: pageCount.value,
      mode: 'outline',
    }) as any;

    if (res.code !== 0) throw new Error(res.msg || '生成PPT失败');
    const taskId = res.data;
    if (!taskId) throw new Error('生成PPT失败：未返回任务ID');

    let taskData: any = null;
    let retries = 0;
    const maxRetries = 200;

    const doPoll = async (): Promise<void> => {
      const pollRes = await GetPPTTask(taskId) as any;
      if (pollRes.code !== 0) throw new Error(pollRes.msg || '获取任务状态失败');
      const task = pollRes.data;
      if (task.status === 1) { taskData = task; return; }
      if (task.status === 2) throw new Error(task.errorMessage || 'PPT生成失败');
      if (++retries >= maxRetries) throw new Error('生成超时，请稍后重试');
      await new Promise(r => setTimeout(r, 3000));
      return doPoll();
    };

    await doPoll();

    const content = await ResolvePPTContent({ contentJsonUrl: taskData.contentJsonUrl });
    if (content) {
      const cacheKey = `AI_HOME_GENERATED_PPT_${taskId}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({ content }));
    }

    outlineDialogVisible.value = false;
    router.push({ path: '/editor', query: { id: String(taskId) } });
  } catch (err: any) {
    message.error(err?.message || '生成PPT失败');
  } finally {
    pptGenerating.value = false;
    generating.value = false;
  }
}

const heroTagPool = [
  ["毕业答辩PPT", "年终总结PPT", "商业计划", "产品讲解", "企业安全培训", "法律宣传"],
  ["述职汇报PPT", "营销策划", "教学课件", "竞品分析", "入职培训", "公益科普"],
  ["项目提案", "融资路演", "学术答辩", "品牌宣传", "安全生产", "政策解读"],
];

const heroTags = ref(heroTagPool[0]);
let heroTagIndex = 0;

function refreshHeroTags() {
  heroTagIndex = (heroTagIndex + 1) % heroTagPool.length;
  heroTags.value = heroTagPool[heroTagIndex];
}

const templateLoading = ref(false);
const templateGroups = ref<any[]>([]);
const templateCards = ref<any[]>([]);
const selectedTemplateId = ref<any>(null);
const activeTemplateGroupId = ref<any>(null);
const templatePageNo = ref(1);
const templateTotal = ref(0);
const templatePageSize = 8;

const templateCategoryRows = computed(() => {
  const list = templateGroups.value;
  if (!list.length) return [];
  const mid = Math.ceil(list.length / 2);
  return [list.slice(0, mid), list.slice(mid)];
});

const parseTemplateCover = (cover: any) => {
  const text = String(cover || "").trim();
  if (!text) return "";
  if (text.startsWith("http")) return text;
  try {
    const parsed = JSON.parse(text) as any[];
    if (Array.isArray(parsed) && parsed.length) return parsed[0]?.url || "";
  }
  catch {
    return text;
  }
  return text;
};

const loadTemplateList = (reset = false) => {
  if (reset) templatePageNo.value = 1;
  templateLoading.value = true;
  const params: any = {
    pageNo: templatePageNo.value,
    pageSize: templatePageSize,
    hasRecommend:1
  };
  if (activeTemplateGroupId.value != null) params.groupId = activeTemplateGroupId.value;
  SearchPPTTemplates(params)
    .then((res: any) => {
      if (res.code === 0) {
        const list = Array.isArray(res.data?.list) ? res.data.list : [];
        templateTotal.value = Number(res.data?.total || 0);
        const mapped = list.map((item: any) => ({
          ...item,
          cover: parseTemplateCover(item.cover),
        }));
        templateCards.value = reset ? mapped : [...templateCards.value, ...mapped];
        if (reset) {
          selectedTemplateId.value = mapped[0]?.id ?? null;
        }
      } else if (reset) {
        templateCards.value = [];
        templateTotal.value = 0;
        selectedTemplateId.value = null;
      }
    })
    .finally(() => {
      templateLoading.value = false;
    });
};

const loadTemplateGroups = () => {
  GetPPTGroups()
    .then((res: any) => {
      if (res.code === 0) {
        templateGroups.value = Array.isArray(res.data) ? res.data : [];
        if (templateGroups.value.length) {
          activeTemplateGroupId.value = templateGroups.value[0].groupId;
          loadTemplateList(true);
        }
      } else {
        templateGroups.value = [];
      }
    })
    .finally(() => {});
};

const handleTemplateCategoryClick = (item: any) => {
  activeTemplateGroupId.value = item.groupId;
  loadTemplateList(true);
};

const handleTemplateLoadMore = () => {
  if (templateLoading.value || templateCards.value.length >= templateTotal.value) return;
  templatePageNo.value += 1;
  loadTemplateList(false);
};

onMounted(() => {
  loadTemplateGroups();
});

const featureCards = [
  {
    title: "AI一键生成PPT",
    desc: "输入主题，AI帮您一键生成PPT",
    colSpan: "feature-span-2",
    visualClass: "feature-visual-168",
    visual: product1Image,
  },
  {
    title: "多元化生成方式",
    desc: "自定义主题、文档、PPT，生成结构完整、设计专业的PPT",
    colSpan: "feature-span-2",
    visualClass: "feature-visual-176",
    visual: product2Image,
  },
  {
    title: "AI自动生成PPT大纲",
    desc: "AI赋能让PPT大纲不再困难",
    colSpan: "feature-span-2",
    visualClass: "feature-visual-176",
    visual: product3Image,
  },
  {
    title: "AI辅助内容写作",
    desc: "扩写、精简、润色、翻译、生成标题",
    colSpan: "feature-span-4",
    visualClass: "feature-visual-132",
    visual: product4Image,
  },
  {
    title: "一键换肤智能美化",
    desc: "内容与样式独立，主题设计风格一键调整",
    colSpan: "feature-span-2",
    visualClass: "feature-visual-148",
    visual: product5Image,
  },
  {
    title: "新建单页AI设计",
    desc: "新增页只需提供标题描述或文案，AI自动完成 PPT 页面设计",
    colSpan: "feature-span-3",
    visualClass: "feature-visual-168",
    visual: product6Image,
  },
  {
    title: "标准版/高级版，一键切换",
    desc: "基于 PPT 操作习惯，减少 70% 重复编辑工作量",
    colSpan: "feature-span-3",
    visualClass: "feature-visual-168",
    visual: product7Image,
  },
];

const sceneTabList: any[] = [
  {
    key: "商务职场",
    features: ["AI一键生成", "智能大纲策划", "自动设计美化", "高效编辑协作"],
    tags: ["季度汇报", "项目立项", "竞品分析", "营销策划"],
    image: sence1Image,
  },
  {
    key: "教育培训",
    features: ["课程课件快速生成", "知识内容智能梳理", "教学页面专业美化", "多场景培训高效适配"],
    tags: ["课程讲义", "公开演讲", "培训课件", "知识分享"],
    image: sence2Image,
  },
  {
    key: "学术科研",
    features: ["科研内容智能整理", "论文汇报快速生成", "数据图表清晰呈现", "学术排版专业规范"],
    tags: ["研究成果汇报", "学术讲座", "开题答辩", "论文讲解"],
    image: sence3Image,
  },
  {
    key: "产品经理",
    features: ["产品方案高效输出", "需求逻辑智能梳理", "数据分析直观呈现", "汇报页面专业统一"],
    tags: ["产品介绍", "投资BP", "项目路演", "用户需求分析"],
    image: sence4Image,
  },
  {
    key: "党政机构",
    features: ["政务汇报快速生成", "政策内容智能梳理", "红色主题专业适配", "材料排版规范统一"],
    tags: ["政务宣传", "政策解读", "工作汇报", "党政培训"],
    image: sence5Image,
  },
  {
    key: "品牌市场",
    features: ["营销方案快速生成", "品牌视觉统一呈现", "活动策划高效输出", "数据传播直观展示"],
    tags: ["品牌提案", "活动策划PPT", "视觉风格宣讲", "竞品对比分析"],
    image: sence6Image,
  },
  {
    key: "数据分析",
    features: ["数据报告智能生成", "图表信息清晰呈现", "分析逻辑高效梳理", "汇报展示专业直观"],
    tags: ["数据报告", "趋势分享", "可视化展示", "结论汇报"],
    image: sence6Image,
  },
];

const sceneTabs = sceneTabList.map((item: any) => item.key);
const activeSceneTab = ref(sceneTabs[0]);

const currentSceneContent = computed(() => {
  return sceneTabList.find((item: any) => item.key === activeSceneTab.value) || sceneTabList[0];
});
</script>

<style scoped lang="less">
.page-wrapper {
  min-width: 1440px;
  height: 100vh;
  overflow-x: auto;
  overflow-y: auto;
  background: #f8faff;
  color: #222222;
}

.content-shell {
  padding: 0 20px;
  margin: 0 auto;
}

.header-block {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 52px;
  border-bottom: 1px solid rgba(220, 230, 248, 0.6);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
}

.header-shell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.header-logo {
  width: 100px;
  object-fit: contain;
}

.header-brand {
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
  color: #1f4ea7;
  letter-spacing: 1px;
}

.header-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.header-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-icon-btn:hover {
  color: #2563eb;
  background: #eff6ff;
}

.header-vip-btn {
  height: 28px;
  border: none;
  border-radius: 4px;
  padding: 0 12px;
  background: linear-gradient(90deg, #ffe8b7 0%, #ffd38c 100%);
  color: #9a5a02;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.header-edition-btn {
  height: 28px;
  border: none;
  border-radius: 999px;
  padding: 0 10px;
  background: transparent;
  color: #374151;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.header-avatar {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.hero-section {
  position: relative;
  overflow: hidden;
  padding: 40px 0 64px;
  background: linear-gradient(160deg, #dfe9ff 0%, #e8e0ff 30%, #d8e8ff 65%, #e5eeff 100%);
}

.hero-bg {
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(40px);
}

.hero-bg-left {
  width: 500px;
  height: 500px;
  left: -160px;
  top: 60px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(191, 219, 254, 0.4) 38%, rgba(224, 231, 255, 0) 72%);
}

.hero-bg-right {
  width: 440px;
  height: 440px;
  right: -130px;
  top: 10px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.65) 0%, rgba(221, 214, 254, 0.38) 40%, rgba(191, 219, 254, 0) 72%);
}

.hero-shape {
  position: absolute;
  pointer-events: none;
  opacity: 0.18;
}

.hero-shape-triangle {
  width: 180px;
  height: 180px;
  left: 12%;
  top: 18%;
  background: linear-gradient(135deg, rgba(147, 197, 253, 0.5), rgba(196, 181, 253, 0.3));
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  filter: blur(2px);
  transform: rotate(-12deg);
}

.hero-shape-circle {
  width: 120px;
  height: 120px;
  right: 16%;
  bottom: 22%;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(251, 207, 232, 0.45), rgba(191, 219, 254, 0.35));
  filter: blur(4px);
}

.hero-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-title {
  margin: 0;
  font-size: 54px;
  line-height: 1.1;
  font-weight: 800;
  color: #1a2236;
  letter-spacing: 1px;
}

.hero-title-accent {
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 55%, #8b5cf6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  margin: 12px 0 0;
  font-size: 15px;
  color: #7b88a0;
  letter-spacing: 0.3px;
}

.input-method-tabs {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-top: 24px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 12px rgba(100, 130, 220, 0.14), 0 1px 3px rgba(100, 130, 220, 0.1);
  backdrop-filter: blur(14px);
}

.tab-glider {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  width: calc(100% / 3 - 2.67px);
  border-radius: 999px;
  background: linear-gradient(90deg, #4f8ef7 0%, #5b6ef8 55%, #7c6af5 100%);
  box-shadow: 0 4px 16px rgba(79, 142, 247, 0.4);
  transition: transform 0.28s cubic-bezier(0.35, 0, 0.25, 1);
  pointer-events: none;
  z-index: 1;
}

.input-method-tab {
  position: relative;
  z-index: 2;
  flex: 1;
  height: 36px;
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7a9a;
  background: transparent;
  cursor: pointer;
  transition: color 0.2s ease;
  white-space: nowrap;
  min-width: 108px;

  .el-icon {
    font-size: 14px;
  }
}

.input-method-tab.active {
  color: #ffffff;
  font-weight: 600;
}

.input-method-tab:not(.active):hover {
  color: #374151;
}

.btn {
  height: 42px;
  border-radius: 12px;
  border: 1px solid #d1d9e6;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-primary {
  color: #ffffff;
  border: none;
  background: linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%);
  box-shadow: 0 12px 24px rgba(96, 165, 250, 0.28);
}

.btn-primary:hover {
  background: linear-gradient(90deg, #4f93ef 0%, #9577f0 100%);
}

.btn-ghost {
  color: #444444;
  background: #ffffff;
}

.btn-ghost:hover,
.tool-pill:hover {
  background: #dbeafe;
  border-color: #bfdbfe;
}

.hero-card-wrap {
  width: 100%;
  max-width: 820px;
  margin-top: 20px;
  padding: 1.5px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(180, 210, 255, 0.8) 0%, rgba(200, 190, 255, 0.75) 50%, rgba(160, 200, 255, 0.8) 100%);
  box-shadow:
    0 24px 56px rgba(90, 120, 220, 0.13),
    0 6px 20px rgba(148, 163, 184, 0.1);
}

.hero-card {
  background: #ffffff;
  border-radius: 18.5px;
  padding: 20px 20px 14px;
}

.hero-input-box {
  min-height: 86px;
  padding: 4px 4px 12px;
}

.hero-upload-box {
  min-height: 140px;
  padding: 0 0 12px;
  border-radius: 12px;
  border: 1.5px dashed #c8d4ea;
  background: #f8fafd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, background 0.2s;
  cursor: default;

  &.drag-over {
    border-color: #4f8ef7;
    background: #eff6ff;
  }
}

.upload-drop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 4px;
}

.upload-hidden-input {
  display: none;
}

.upload-cloud-icon {
  font-size: 30px;
  color: #7eb8f8;
  margin-bottom: 8px;
}

.upload-main-text {
  margin: 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.upload-sub-text {
  margin: 5px 0 0;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
  max-width: 380px;
  line-height: 1.6;
}

.upload-entry-row {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 16px;
}

.upload-entry-btn {
  height: 28px;
  border: 1px solid #dce4f0;
  border-radius: 8px;
  background: #ffffff;
  color: #4b5a75;
  font-size: 12px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  .el-icon {
    color: #7b8eaa;
    font-size: 13px;
  }

  &:hover {
    border-color: #4f8ef7;
    color: #4f8ef7;
    background: #f0f6ff;

    .el-icon {
      color: #4f8ef7;
    }
  }
}

.hero-outline-box {
  min-height: 100px;
  padding: 4px 4px 14px;
}

.hero-textarea {
  width: 100%;
  min-height: 72px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.65;
  color: #374151;
  font-family: inherit;

  &::placeholder {
    color: #c5cdd8;
    font-size: 15px;
  }
}

.hero-tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #eef2f9;
}

.tool-pills-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.tool-pill {
  height: 26px;
  border-radius: 4px;
  border: 1px solid #e4ecf8;
  background: #f7f9fc;
  color: #5d6d88;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;

  .el-icon {
    font-size: 13px;
    color: #8fa3c0;
    transition: color 0.18s;
  }

  &:hover {
    background: #edf3ff;
    border-color: #b8d0f8;
    color: #3d72e0;

    .el-icon {
      color: #3d72e0;
    }
  }
}

.tool-pill-active {
  color: #4175e8;
  background: #eef4ff;
  border-color: #a8c6f8;

  .el-icon {
    color: #4175e8;
  }

 

  &:hover {
    background: #e0ecff;
    border-color: #90b8f5;
  }
}

.tool-select {
  height: 26px;
  flex-shrink: 0;
  width: 90px;

  :deep(.el-select__wrapper) {
    height: 26px;
    min-height: 26px;
    border-radius: 4px;
    border: 1px solid #e4ecf8;
    background: #f7f9fc;
    padding: 0 6px 0 8px;
    box-shadow: none !important;
    font-size: 12px;
    color: #5d6d88;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    gap: 2px;

    &:hover {
      border-color: #b8d0f8;
      background: #edf3ff;
    }

    &.is-focused {
      border-color: #90b8f5;
      background: #edf3ff;
    }
  }

  :deep(.el-select__prefix) {
    color: #8fa3c0;
    font-size: 13px;
    margin-right: 2px;
    display: inline-flex;
    align-items: center;
  }

  :deep(.el-select__selected-item) {
    font-size: 12px;
    color: #5d6d88;
    line-height: 26px;
  }

  :deep(.el-select__selected-item span) {
    font-size: 12px;
    color: #5d6d88;
  }

  :deep(.el-select__suffix) {
    color: #b8c8dc;
    padding-right: 0;
  }

  :deep(.el-select__caret) {
    font-size: 10px !important;
    color: #b8c8dc !important;
  }
}

.select-opt-label {
  font-size: 13px;
  color: #1a2540;
  font-weight: 500;
}

.select-opt-desc {
  font-size: 11px;
  color: #9aaec8;
  margin-left: 6px;
}

.generate-btn {
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  padding: 0 5px 0 16px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(90deg, #4f8ef7 0%, #5b6ef8 55%, #7c6af5 100%);
  box-shadow: 0 6px 18px rgba(79, 142, 247, 0.38);
  transition: all 0.22s ease;
  white-space: nowrap;
  letter-spacing: 0.3px;

  &:hover {
    box-shadow: 0 8px 24px rgba(79, 142, 247, 0.48);
    transform: translateY(-1px);
  }

  &:disabled,
  &.is-loading {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.generate-btn-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 11px;
    color: #ffffff;
  }
}

.hero-tags-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  max-width: 820px;
  width: 100%;
}

.hero-tag {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  color: #6a7a9c;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 1px 6px rgba(100, 130, 200, 0.08);

  &:hover {
    background: rgba(255, 255, 255, 0.92);
    color: #3d5299;
    border-color: rgba(160, 190, 255, 0.8);
  }
}

.hero-tags-refresh {
  width: 34px;
  height: 34px;
  margin-left: 4px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.62);
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  flex-shrink: 0;

  .el-icon {
    font-size: 16px;
  }

  &:hover {
    color: #6366f1;
    background: rgba(255, 255, 255, 0.9);
  }
}

.section-container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 32px;
}

.section-header {
  text-align: center;
}

.section-title {
  margin: 0;
  font-size: 36px;
  line-height: 1.15;
  font-weight: 800;
  color: #222222;
}

.section-title-md {
  font-size: 28px;
  line-height: 1.25;
}

.section-subtitle {
  margin: 10px 0 0;
  font-size: 16px;
  color: #777777;
}

.section-subtitle-sm {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.625;
  color: #888888;
}

// 模板区块
.template-section {
  background: #f8faff;
  padding: 40px 0;

  @media (min-width: 1024px) {
    padding: 48px 0;
  }
}

.template-category-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 32px;
}

.template-category-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.template-category-btn {
  height: 32px;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0 14px;
  font-size: 12px;
  line-height: 1;
  color: #51607b;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  &.active {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.22);
  }
}

.template-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 24px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.template-card {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px;
  border: 4px solid #eef2f7;
  background: #ffffff;

   box-shadow: 0 8px 20px rgba(99, 102, 241, 0.08);

  &:hover {
    border-color: #dbeafe;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.08);

    .template-card-cover :deep(img) {
      transform: scale(1.08);
    }
  }

  &.active {
    border-color: #6366f1;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.16);
  }
}

.template-card-cover {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #f1f5f9;

  :deep(.el-image) {
    display: block;
    width: 100%;
    height: 100%;
  }

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    will-change: transform;
  }
}

.template-card-image {
  display: block !important;
  width: 100%;
  height: 100%;
}

.template-card-title {
  margin: 0;
  padding: 10px 12px 12px;
  text-align: center;
  font-size: 14px;
  line-height: 1.45;
  color: #333333;
}

.template-card-check {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 30px;
  border-top-left-radius: 17px;
  background: #6366f1;
  color: #ffffff;
  font-size: 16px;
}

.template-more-row {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.template-more-btn {
  height: 40px !important;
  min-width: 118px !important;
  border-radius: 12px !important;
  border-color: #9fc0ff !important;
  padding: 0 32px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #2563eb !important;

  &:hover {
    border-color: #60a5fa !important;
    background: #eff6ff !important;
  }
}

// 产品功能
.feature-section {
  background: #f8faff;
  padding: 56px 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-top: 32px;
}

.feature-card {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid #EEEFF1;
  background: #f8f8fa;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(115, 138, 175, 0.08);
  grid-column: span 6;

  &:hover{
    box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.12);

  }

  @media (min-width: 1024px) {
    &.feature-span-2 {
      grid-column: span 2;
    }

    &.feature-span-3 {
      grid-column: span 3;
    }

    &.feature-span-4 {
      grid-column: span 4;
    }
  }
}

.feature-card-head {
  flex-shrink: 0;
}

.feature-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.375;
  color: #222222;
}

.feature-card-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: #8e99b0;
}

.feature-card-visual {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  margin-top: 16px;
  overflow: hidden;
}

.feature-card-img {
  width: 100%;
  object-fit: contain;
  object-position: bottom;

}

// 智能创作
.scene-section {
  background: #f8faff;
  padding: 72px 0 56px;
}

.scene-tab-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.scene-tab-bar {
  display: inline-flex;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 999px;
  background: #f0f3fa;
  padding: 6px;
}

.scene-tab-btn {
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  padding: 0 20px;
  font-size: 13px;
  color: #6b7280;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #374151;
  }

  &.active {
    font-weight: 500;
    color: #2563eb;
    background: #ffffff;
    box-shadow: 0 2px 10px rgba(96, 165, 250, 0.18);
  }
}

.scene-content {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 32px;
  margin-top: 32px;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
  }
}

.scene-left {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 0 24px 40px;

  @media (min-width: 1024px) {
    min-height: 480px;
    padding-left: 48px;
  }
}

.scene-quote {
  position: absolute;
  left: 0;
  top: 8px;
  background: url('@/assets/images/scene-quote.png') no-repeat center center;
  background-size: 100% 100%;
  width: 78px;
  height: 67px;
  z-index: 1;
}

.scene-feature-list {
  position: relative;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;

  li+li {
    margin-top: 12px;
  }
}

.scene-feature-item {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.375;
  color: #4d5a73;
}

.scene-tag-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: fit-content;
  margin-top: 28px;
}

.scene-mini-tag {
  display: inline-flex;
  height: 34px;
  min-width: 132px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  border: 1px solid #e4ebf7;
  background: #ffffff;
  padding: 0 12px;
  font-size: 12px;
  color: #5d6a81;
  box-shadow: 0 8px 16px rgba(117, 136, 172, 0.08);
}

.scene-tag-icon {
  font-size: 13px !important;
  color: #f59e0b;
}

.scene-cta-btn {
  display: inline-flex;
  height: 46px;
  width: fit-content;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
  border: none;
  border-radius: 999px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%);
  box-shadow: 0 12px 24px rgba(96, 165, 250, 0.28);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(90deg, #4f93ef 0%, #9577f0 100%);
  }
}

.scene-visual {
  position: relative;
  width: 100%;
  max-width: 580px;
  min-height: 480px;
  margin: 0 auto;
}

.scene-visual-bg {
  position: absolute;
  inset: 0;
}

.scene-img {
  position: absolute;
  border-radius: 16px;
  object-fit: cover;
}

.scene-img-main {
  right: 22%;
  top: 12px;
  z-index: 1;
  width: 100%;
  max-width: 672px;
  box-shadow: 0 20px 42px rgba(116, 138, 177, 0.18);
}

.scene-img-photo {
  right: 0;
  top: 28px;
  z-index: 2;
  width: 29%;
  max-width: 165px;
  box-shadow: 0 16px 32px rgba(116, 138, 177, 0.16);
}

.scene-img-photo2 {
  bottom: 40px;
  left: 24px;
  z-index: 2;
  width: 29%;
  max-width: 165px;
  box-shadow: 0 16px 32px rgba(116, 138, 177, 0.16);
}

.scene-img-report {
  bottom: 20px;
  right: 12px;
  z-index: 3;
  width: 52%;
  max-width: 290px;
  box-shadow: 0 20px 42px rgba(116, 138, 177, 0.22);
}

.footer-block {
  padding: 20px 0 18px;
  background: #f8faff;
}

.footer-shell {
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 11px;
  color: #8d96a8;
}

.footer-meta {
  margin-top: 8px;
  font-size: 11px;
  color: #a0a8b8;
}

:deep(.el-icon) {
  margin-right: 0;
}

@media (min-width: 1600px) {
  .content-shell {
    width: min(1280px, calc(100vw - 80px));
  }

  .hero-title {
    font-size: 60px;
  }

  .section-title {
    font-size: 38px;
  }

  .section-title-md {
    font-size: 30px;
  }
}
</style>

<!-- 大纲弹窗样式 -->
<style lang="less">
.outline-gen-dialog {
  .el-dialog__header {
    padding: 20px 24px 12px;
    border-bottom: 1px solid #f0f3fa;
  }
  .el-dialog__title {
    font-size: 16px;
    font-weight: 600;
    color: #1a2540;
  }
  .el-dialog__body {
    padding: 0;
  }
  .el-dialog__footer {
    padding: 0;
    border-top: 1px solid #f0f3fa;
  }
}

.outline-dialog-body {
  overflow: hidden;
  padding: 0;
}

.outline-scroll {
  max-height: 480px;
  overflow-y: auto;
  padding: 16px 24px 20px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dbe4f5;
    border-radius: 4px;
  }
}

.outline-empty {
  padding: 60px 0;
  text-align: center;
  color: #b0b8cc;
  font-size: 14px;
}

.outline-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  min-height: 30px;

  &.outline-row-sub {
    padding: 3px 0;
  }

  &.outline-row-end {
    padding: 8px 0;
    margin-top: 2px;
  }
}

.outline-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 20px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  padding: 0 6px;
  background: #ebf2ff;
  color: #3671e9;
  border: 1px solid #c7d9ff;
}

.outline-row-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3671e9;
  flex-shrink: 0;

  &.outline-row-dot-gray {
    background: #b0b8cc;
  }
}

.outline-end-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b0b8cc;
  flex-shrink: 0;
  margin-left: 44px;
}

.outline-row-text {
  font-size: 14px;
  font-weight: 500;
  color: #1a2540;
  line-height: 1.5;

  &.outline-row-text-gray {
    color: #7a8aa8;
    font-weight: 400;
  }
}

.outline-sub-indent {
  width: 44px;
  flex-shrink: 0;
}

.outline-arrow {
  font-size: 12px;
  color: #9aaac8;
  flex-shrink: 0;
  font-family: monospace;
  letter-spacing: -1px;
}

.outline-sub-text {
  font-size: 13px;
  color: #4a5878;
  line-height: 1.5;
}

// 流式光标
.outline-cursor-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.outline-cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: #3671e9;
  border-radius: 1px;
  animation: outline-blink 0.9s infinite;
}

@keyframes outline-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// 逐行滑入动画
.outline-line-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.outline-line-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.outline-line-leave-active {
  transition: none;
}
.outline-line-leave-to {
  opacity: 0;
}

.outline-dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
}

.outline-btn-regen {
  flex: 1;
  height: 44px;
  border: 1.5px solid #d4dff5;
  border-radius: 10px;
  background: #fff;
  color: #3d5280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #3671e9;
    color: #3671e9;
    background: #f0f5ff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.outline-btn-gen {
  flex: 2;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #3671e9;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #2a5fd6;
  }

  &:disabled,
  &.is-loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>

<!-- el-select 下拉弹层全局样式（穿透 scoped） -->
<style lang="less">
.tool-select-pop.el-select__popper {
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(60, 90, 180, 0.12) !important;
  border: 1px solid #e8eef8 !important;
  padding: 4px 0 !important;

  .el-select-dropdown__item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: auto;
    padding: 8px 14px;
    border-radius: 8px;
    margin: 0 4px;
    line-height: 1;
    color: #3d4f6e;

    &.is-selected,
    &.selected {
      color: #4175e8;
      font-weight: 600;
      background: #edf3ff;
    }

    &:hover {
      background: #f2f6ff;
    }
  }
}

.sel-opt-label {
  font-size: 13px;
  color: inherit;
  line-height: 1.45;
}

.sel-opt-desc {
  margin-top: 2px;
  font-size: 11px;
  color: #9caabf;
  line-height: 1.4;
  font-weight: 400;
}
</style>
