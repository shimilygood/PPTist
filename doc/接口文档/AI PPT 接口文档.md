# AI PPT 接口文档

> 基础路径：`/ai/ppt` ｜ 本地 Base URL：`http://localhost:48092`
> 认证方式：Bearer Token（所有接口需携带 `Authorization: Bearer {token}` 请求头，`getLoginUserId()` 依赖）
> Content-Type：`application/json`

覆盖 `AiPptController`（PPT 生成）与 `AiPptRefineController`（PPT 加工：扩写 / 润色 / 翻译）全部接口。

---

## 一、通用请求结构（BaseRequest）

所有接口请求体均采用统一封装格式 `BaseRequest<T>`：

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 789,
    "refer": "home",
    "source": 0,
    "hcode": "linlang",
    "version": "0.0.1"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {}
}
```

### BasicInfo 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| busId | Long | 是 | 商户ID |
| cid | Long | 是 | 用户ID |
| refer | String | 是 | 页面唯一标识 |
| source | Integer | 是 | 页面渠道来源：0-Web, 1-Mobile, 2-App, 3-WeChat, 4-Other |
| hcode | String | 是 | 租户标识 |
| version | String | 是 | 版本信息 |

### I18nInfo 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| language | String | 是 | 语言代码：zh-中文, en-英文, ja-日文, ko-韩文 |
| timezone | String | 是 | 时区，格式：+HHmm 或 -HHmm |

> 下文「请求示例」均只突出 `queryParameter`，`basicInfo` / `i18n` 需按上表补全。

### 通用响应结构（CommonResult）

```json
{
  "code": 0,
  "msg": "",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 状态码，0=成功，非0=失败 |
| msg | String | 错误描述（成功时为空） |
| data | Object | 业务数据（结构因接口而异） |

---

## 二、PPT 生成接口（AiPptController）

### 2.1 生成 PPT 大纲（流式 SSE）

`POST /ai/ppt/generate-outline` ｜ Response-Type：`text/event-stream`

AI 流式生成 PPT 结构化大纲内容，基于 SSE（Server-Sent Events）返回，前端可边接收边渲染。

**queryParameter 参数（AiPptOutlineReqVO）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | String | 是 | PPT 主题，如 "2026年AI发展趋势" |
| outline | String | 否 | 自定义大纲参考，如 "1.行业概览 2.技术趋势 3.市场预测" |
| templateId | Long | 否 | 模板编号，null 使用默认风格 |
| enableImageBackground | Boolean | 否 | 是否启用 AI 背景图片（启用时大纲每页会带 imagePrompt） |

**响应示例（SSE 流）**

```
data: {"code":0,"msg":"","data":"{\"title\":\"2026年AI发展趋势\",\"subtitle\":\"技术变革与商业机遇\",\"slides\":[{\"layout\":\"cover\",\"title\":\"...\"}"}

data: {"code":0,"msg":"","data":"{\"layout\":\"toc\",\"items\":[\"行业概览\",\"技术趋势\"]}..."}

data: {"code":0,"msg":"","data":""}
```

**说明**

- 每个 SSE 事件 `data` 字段为 AI 生成的文本片段（JSON 字符串的增量部分）
- 流结束时最后一个事件 `data` 为空字符串
- 完整流拼接后为一个合法的 JSON 对象（PPT 大纲结构）

---

### 2.2 生成 PPT（异步）

`POST /ai/ppt/generate`

异步生成完整 PPT。**立即返回任务 ID**，实际生成在后台执行（耗时较长，可能几十秒到数分钟），前端通过 [2.3 获取任务](#23-获取-ppt-任务) 轮询状态。天然规避网关超时。

**queryParameter 参数（AiPptGenerateReqVO）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | String | 是 | PPT 主题 |
| outline | String | 否 | 自定义大纲参考 |
| templateId | Long | 否 | 模板编号，null 使用默认风格 |
| size | Long | 否 | 内容页数量 |
| useReasoning | Boolean | 否 | 先思考后回答，解决推理问题 |
| enableImageBackground | Boolean | 否 | 是否启用 AI 背景图片 |
| imageModelId | Long | 否 | 图片模型编号，不传用默认图片模型 |
| mode | String | 否 | 生成模式，`outline`=基于提纲逐章节生成 |

**请求示例**

```json
{
  "basicInfo": { "busId": 123456, "cid": 789, "refer": "ppt-generate", "source": 0, "hcode": "linlang", "version": "1.0.0" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "topic": "2026年AI发展趋势",
    "size": 10,
    "mode": "outline"
  }
}
```

**响应示例（返回任务 ID）**

```json
{ "code": 0, "msg": "", "data": 1001 }
```

---

### 2.3 获取 PPT 任务

`POST /ai/ppt/getPptStatus`

轮询 PPT 生成任务状态，返回任务详情。建议每 2~3 秒轮询一次，直到 `status` 变为 1（成功）或 2（失败）。

**queryParameter 参数（AiPptIdReqVO）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | PPT 任务编号（[2.2](#22-生成-ppt异步) 返回的 taskId） |

**响应示例（成功）**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 1001,
    "userId": 28404,
    "topic": "2026年AI发展趋势",
    "templateId": 1,
    "templateName": "商务蓝",
    "platform": "TongYi",
    "model": "qwen-max",
    "status": 1,
    "contentJsonUrl": "https://oss.example.com/ai/ppt/json/ppt_1001.json",
    "fileUrl": "https://oss.example.com/ai/ppt/ppt_1001.pptx",
    "pageCount": 8,
    "errorMessage": null,
    "createTime": "2026-06-14T10:30:00"
  }
}
```

**响应字段说明（AiPptRespVO）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 任务编号 |
| userId | Long | 用户编号 |
| topic | String | PPT 主题 |
| outline | String | 用户提供的自定义大纲 |
| templateId | Long | 使用的模板编号 |
| templateName | String | 使用的模板名称 |
| platform | String | AI 平台（如 TongYi、OpenAI 等） |
| model | String | 使用的 AI 模型名称 |
| status | Integer | 任务状态：0-生成中, 1-成功, 2-失败 |
| contentJson | String | 前端渲染 JSON（旧字段，当前不再写入，保留兼容） |
| contentJsonUrl | String | **结构化内容 JSON 的 OSS 地址（前端渲染取此字段下载）** |
| fileUrl | String | 生成的 .pptx 文件地址 |
| pageCount | Integer | PPT 页数 |
| errorMessage | String | 失败时的错误信息 |
| createTime | String | 创建时间 |

---

### 2.4 下载 PPT 文件

`POST /ai/ppt/download` ｜ Response-Type：`application/vnd.openxmlformats-officedocument.presentationml.presentation`

下载已生成成功的 .pptx 文件（要求任务 `status=1`）。

**queryParameter 参数（AiPptIdReqVO）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | PPT 任务编号 |

**响应**

- **Content-Type**：`application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **Content-Disposition**：`attachment; filename=<URL编码的文件名>.pptx`
- **Body**：.pptx 文件二进制流

---

## 三、PPT 加工接口（AiPptRefineController）

> 对**已存在的 PPT**（已生成结果 / 已有模板）做扩写、润色、翻译。**只改文字，不改视觉**（坐标、样式、背景、布局全保留）。结果写入新的 OSS 地址，**不覆盖原件**，可对结果再次加工。

### 3.1 提交加工任务（异步）

`POST /ai/ppt/refine`

异步加工，**立即返回任务 ID**，前端通过 [3.2 获取加工任务](#32-获取-ppt-加工任务) 轮询状态。

**queryParameter 参数（AiPptRefineReqVO）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourceType | String | 是 | 来源类型：`TASK`-已生成PPT / `TEMPLATE`-已有模板 |
| sourceId | Long | 是 | 来源ID（TASK 填 taskId；TEMPLATE 填 templateId） |
| operation | String | 是 | 操作类型：`POLISH`-润色 / `EXPAND`-扩写 / `TRANSLATE`-翻译 |
| targetLang | String | 翻译必填 | 目标语言（en/ja/ko 等） |
| styleHint | String | 否 | 风格提示（扩写/润色，如「更专业」「面向高管」） |
| exportPptx | Boolean | 否 | 是否同时导出 PPTX |

**请求示例（翻译已生成的 PPT 为英文）**

```json
{
  "basicInfo": { "busId": 123456, "cid": 789, "refer": "ppt-refine", "source": 0, "hcode": "linlang", "version": "1.0.0" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "sourceType": "TASK",
    "sourceId": 1001,
    "operation": "TRANSLATE",
    "targetLang": "en"
  }
}
```

**响应示例（返回任务 ID）**

```json
{ "code": 0, "msg": "", "data": 999 }
```

**operation 取值速查**

| operation | 说明 | 备注 |
|-----------|------|------|
| `POLISH` | 润色：改写得更专业/流畅，语义不变 | 可带 `styleHint` |
| `EXPAND` | 扩写：补充论据/数据，加长单条文字（不增条数） | 可带 `styleHint` |
| `TRANSLATE` | 翻译：转为目标语言，语义不变 | 必填 `targetLang` |

---

### 3.2 获取 PPT 加工任务

`POST /ai/ppt/refine/get`

轮询加工任务状态。建议每 2~3 秒轮询一次，直到 `status` 变为 1 或 2。

**queryParameter 参数（AiPptRefineIdReqVO）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 加工任务编号（[3.1](#31-提交加工任务异步) 返回的 taskId） |

**响应示例（成功）**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 999,
    "userId": 28404,
    "sourceType": "TASK",
    "sourceId": 1001,
    "operation": "POLISH",
    "targetLang": null,
    "styleHint": "更专业",
    "status": 1,
    "resultContentUrl": "https://oss.example.com/ai/ppt/refine/refine_999.json",
    "resultFileUrl": null,
    "pageCount": 12,
    "errorMessage": null,
    "createTime": "2026-06-14T11:00:00"
  }
}
```

**响应字段说明（AiPptRefineRespVO）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 加工任务编号 |
| userId | Long | 用户编号 |
| sourceType | String | 来源类型（TASK/TEMPLATE） |
| sourceId | Long | 来源ID |
| operation | String | 操作类型 |
| targetLang | String | 目标语言 |
| styleHint | String | 风格提示 |
| status | Integer | 状态：0-处理中, 1-成功, 2-失败 |
| resultContentUrl | String | 结果内容 JSON 的 OSS 地址（成功后前端渲染取此字段） |
| resultFileUrl | String | 结果 PPTX 地址（如启用导出） |
| pageCount | Integer | PPT 页数 |
| errorMessage | String | 失败时的错误信息 |
| createTime | String | 创建时间 |

---

## 四、contentJson 结构说明

> 生成任务 `contentJsonUrl`、加工任务 `resultContentUrl` 指向的 OSS JSON，以及旧的 `contentJson` 字段，均为同一结构（`PptSlideDataDTO`）：前端可直接渲染的 JSON，包含完整的元素坐标、主题样式等信息。

### 顶层结构

```json
{
  "title": "PPT主标题",
  "width": 1000,
  "height": 562.5,
  "theme": {},
  "slides": []
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| title | String | PPT 主标题 |
| width | Double | 画布宽度，固定 1000 |
| height | Double | 画布高度，固定 562.5（16:9 比例） |
| theme | Object | 主题配置 |
| slides | Array | 幻灯片列表 |

### theme 主题配置

```json
{
  "themeColors": ["#1F4E79", "#2E75B6", "#ED7D31", "#333333", "#F2F2F2", "#1F4E79"],
  "fontColor": "#333333",
  "fontName": "Microsoft YaHei",
  "backgroundColor": "#F2F2F2",
  "shadow": {
    "h": 2,
    "v": 2,
    "blur": 4,
    "color": "rgba(0,0,0,0.15)"
  },
  "outline": {
    "width": 0,
    "color": "#000000",
    "style": "solid"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| themeColors | Array\<String\> | 主题色列表：[主色, 辅助色, 强调色, 正文色, 浅背景色, 封面色] |
| fontColor | String | 默认字体颜色 |
| fontName | String | 默认字体名称 |
| backgroundColor | String | 默认背景颜色 |
| shadow | Object | 阴影配置：h(水平偏移), v(垂直偏移), blur(模糊), color(颜色) |
| outline | Object | 描边配置：width(宽度), color(颜色), style(样式) |

### slides 幻灯片

```json
{
  "id": "1",
  "type": "cover",
  "background": {
    "type": "solid",
    "color": "#1F4E79"
  },
  "elements": []
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 幻灯片 ID（从 1 递增） |
| type | String | 布局类型：cover / end / content / toc / section / two_column |
| background | Object | 背景配置：type(solid/gradient/image), color(颜色) |
| elements | Array\<Object\> | 元素列表（多态结构，通过 type 字段区分） |

### elements 元素类型

#### shape - 形状元素

```json
{
  "type": "shape",
  "x": 60,
  "y": 165,
  "width": 880,
  "height": 4.2,
  "fill": "#ED7D31",
  "opacity": 1,
  "borderRadius": 0
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | String | 固定值 "shape" |
| x | Double | X 坐标 |
| y | Double | Y 坐标 |
| width | Double | 宽度 |
| height | Double | 高度 |
| fill | String | 填充颜色（hex 格式） |
| opacity | Double | 透明度（0~1） |
| borderRadius | Double | 圆角半径（0=直角, 50=圆形） |

#### text - 文本元素

```json
{
  "type": "text",
  "x": 60,
  "y": 165,
  "width": 880,
  "height": 112.5,
  "content": "<p><span style=\"font-size:24px;\">2026年AI发展趋势</span></p>",
  "textType": "title"
}
```

> 文本元素的可读文字在 `content` 字段（HTML 片段，含样式）。`textType` 为 `title`/`content` 时标识标题/正文槽位。扩写/润色/翻译只替换其中的文字，保留 HTML 样式。

#### line - 线条元素

```json
{
  "type": "line",
  "x1": 60,
  "y1": 197.5,
  "x2": 940,
  "y2": 197.5,
  "color": "#D9D9D9",
  "width": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | String | 固定值 "line" |
| x1 | Double | 起点 X 坐标 |
| y1 | Double | 起点 Y 坐标 |
| x2 | Double | 终点 X 坐标 |
| y2 | Double | 终点 Y 坐标 |
| color | String | 线条颜色 |
| width | Double | 线条宽度 |

### 各布局类型元素组成

| 布局类型 | type 值 | 背景色 | 包含元素 |
|----------|---------|--------|----------|
| 封面页 | cover | bgCover | 上半装饰色块 + 标题 + 副标题 + 装饰线 |
| 目录页 | toc | #FFFFFF | 标题 + 编号列表 + 分隔线 |
| 章节分隔页 | section | bgLight | 竖向色块 + 章节标题 |
| 内容页 | content | #FFFFFF | 顶部色条 + 标题 + 强调线 + 要点列表 + 页码 |
| 双栏页 | two_column | #FFFFFF | 顶部色条 + 标题 + 左栏 + 分隔线 + 右栏 + 页码 |
| 结束页 | end | bgCover | 下半装饰色块 + 标题 + 副标题 + 装饰线 |

---

## 五、错误码与状态枚举

### 通用响应码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 非 0 | 失败（msg 中包含具体错误信息） |

### 业务错误码

| 错误码 | 常量 | 说明 |
|--------|------|------|
| 1_040_012_002 | PPT_GENERATE_ERROR | PPT 生成失败 |
| 1_040_012_003 | PPT_OUTLINE_STREAM_ERROR | PPT 大纲生成异常 |
| 1_040_016_000 | PPT_REFINE_SOURCE_NOT_EXISTS | PPT 加工的来源内容不存在 |
| 1_040_016_001 | PPT_REFINE_OPERATION_INVALID | PPT 加工操作类型不合法 |
| 1_040_016_002 | PPT_REFINE_TARGET_LANG_REQUIRED | 翻译操作必须指定目标语言 |
| 1_040_016_003 | PPT_REFINE_ERROR | PPT 加工失败 |

### 任务状态（status）

| 值 | 含义（生成任务 / 加工任务通用） |
|----|------|
| 0 | 处理中（生成中） |
| 1 | 成功 |
| 2 | 失败 |

### 页面渠道来源（source）

| 值 | 说明 |
|----|------|
| 0 | Web |
| 1 | Mobile |
| 2 | App |
| 3 | WeChat |
| 4 | Other |

---

## 六、典型业务流程

**流程一：生成 PPT**

```
1. POST /ai/ppt/generate-outline   （可选）流式生成大纲
2. POST /ai/ppt/generate           提交生成 → 拿 taskId
3. POST /ai/ppt/get                轮询 status（0→1）
4. status=1 后：
     - 前端用 contentJsonUrl 下载 JSON 渲染
     - 或 POST /ai/ppt/download 下载 .pptx
```

**流程二：二次加工（扩写 / 润色 / 翻译）**

```
1. 拿到一个已存在的 PPT：taskId（生成结果）或 templateId（已有模板）
2. POST /ai/ppt/refine             提交加工（operation + 来源）→ 拿 refineTaskId
3. POST /ai/ppt/refine/get         轮询 status（0→1）
4. status=1 后，用 resultContentUrl 下载 JSON 渲染（原件不受影响，可对结果再次加工）
```
