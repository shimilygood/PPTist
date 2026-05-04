# AI PPT 接口文档

> 基础路径：`/ai/ppt`
> 认证方式：Bearer Token（所有接口需携带 Authorization 请求头）

---

## 通用请求结构

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
  "queryParameter": {
    // 各接口业务参数，见下方各接口说明
  }
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

### 通用响应结构

```json
{
  "code": 0,
  "msg": "",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 状态码，0=成功，非0=失败 |
| msg | String | 错误描述（成功时为空） |
| data | Object | 业务数据（结构因接口而异） |

---

## 接口列表

### 1. 生成 PPT 大纲（流式）

> AI 流式生成 PPT 结构化大纲内容，基于 SSE（Server-Sent Events）返回。

**请求**

- **URL**: `POST /ai/ppt/generate-outline`
- **Content-Type**: `application/json`
- **Response-Type**: `text/event-stream`

**queryParameter 参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | String | 是 | PPT 主题，如 "2026年AI发展趋势" |
| outline | String | 否 | 自定义大纲参考，如 "1.行业概览 2.技术趋势 3.市场预测" |
| templateId | Long | 否 | 模板编号，null 使用默认风格 |

**请求示例**

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 789,
    "refer": "ppt-generate",
    "source": 0,
    "hcode": "linlang",
    "version": "1.0.0"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {
    "topic": "2026年AI发展趋势",
    "outline": "1.行业概览 2.技术趋势 3.市场预测",
    "templateId": null
  }
}
```

**响应示例（SSE 流）**

```
data: {"code":0,"msg":"","data":"{\"title\":\"2026年AI发展趋势\",\"subtitle\":\"技术变革与商业机遇\",\"slides\":[{\"layout\":\"cover\",\"title\":\"2026年AI发展趋势\",\"subtitle\":\"技术变革与商业机遇\"},{\"layout\":\"toc\",\"items\":["}

data: {"code":0,"msg":"","data":"\"行业概览\",\"技术趋势\",\"市场预测\"]},{\"layout\":\"section\",\"title\":\"行业概览\"}..."}

data: {"code":0,"msg":"","data":""}
```

**说明**

- 返回类型为 `text/event-stream`，每个 SSE 事件包含 `data:` 前缀的 JSON
- 每个 JSON 中 `data` 字段为 AI 生成的文本片段（JSON 字符串的增量部分）
- 流结束时最后一个事件 `data` 为空字符串
- 完整的流拼接后为一个合法的 JSON 对象（PPT 大纲结构）
- 生成过程为异步，任务状态会持久化到数据库

---

### 2. 生成 PPT

> 根据主题生成完整的 PPT 文件（.pptx），同时生成前端可渲染的 JSON 结构。

**请求**

- **URL**: `POST /ai/ppt/generate`
- **Content-Type**: `application/json`

**queryParameter 参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | String | 是 | PPT 主题 |
| outline | String | 否 | 自定义大纲参考 |
| templateId | Long | 否 | 模板编号，null 使用默认风格 |

**请求示例**

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 789,
    "refer": "ppt-generate",
    "source": 0,
    "hcode": "linlang",
    "version": "1.0.0"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {
    "topic": "2026年AI发展趋势",
    "outline": null,
    "templateId": 1
  }
}
```

**响应示例**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 1001,
    "userId": 28404,
    "topic": "2026年AI发展趋势",
    "outline": null,
    "templateId": 1,
    "templateName": "商务蓝",
    "platform": "TongYi",
    "model": "qwen-max",
    "status": 1,
    "contentJson": "{\"title\":\"2026年AI发展趋势\",\"width\":1000,\"height\":562.5,\"theme\":{...},\"slides\":[...]}",
    "fileUrl": "https://oss.example.com/ai/ppt/ppt_1001.pptx",
    "pageCount": 8,
    "errorMessage": null,
    "createTime": "2026-05-02T10:30:00"
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
| contentJson | String | 前端渲染 JSON（见下方 contentJson 结构说明） |
| fileUrl | String | 生成的 .pptx 文件下载地址 |
| pageCount | Integer | PPT 页数 |
| errorMessage | String | 失败时的错误信息 |
| createTime | String | 创建时间 |

---

### 3. 下载 PPT 文件

> 下载已生成的 .pptx 文件。

**请求**

- **URL**: `POST /ai/ppt/download`
- **Content-Type**: `application/json`
- **Response-Type**: `application/vnd.openxmlformats-officedocument.presentationml.presentation`

**queryParameter 参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | PPT 任务编号 |

**请求示例**

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 789,
    "refer": "ppt-download",
    "source": 0,
    "hcode": "linlang",
    "version": "1.0.0"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {
    "id": 1001
  }
}
```

**响应**

- **Content-Type**: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **Content-Disposition**: `attachment; filename=<URL编码的文件名>.pptx`
- **Body**: .pptx 文件二进制流

---

## contentJson 结构说明

`contentJson` 字段存储的是前端可直接渲染的 JSON 结构（`PptSlideDataDTO`），包含完整的元素坐标、主题样式等信息。

### 顶层结构

```json
{
  "title": "PPT主标题",
  "width": 1000,
  "height": 562.5,
  "theme": { ... },
  "slides": [ ... ]
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
  "elements": [ ... ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 幻灯片 ID（从 1 递增） |
| type | String | 布局类型：cover / end / content / toc / section / two_column |
| background | Object | 背景配置：type(solid/gradient), color(颜色) |
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
  "text": "2026年AI发展趋势",
  "fontSize": 45.8,
  "fontColor": "#FFFFFF",
  "fontFamily": "Microsoft YaHei",
  "bold": true,
  "textAlign": "left",
  "verticalAlign": "middle"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | String | 固定值 "text" |
| x | Double | X 坐标 |
| y | Double | Y 坐标 |
| width | Double | 宽度 |
| height | Double | 高度 |
| text | String | 文本内容 |
| fontSize | Double | 字号 |
| fontColor | String | 字体颜色（hex 格式） |
| fontFamily | String | 字体名称 |
| bold | Boolean | 是否加粗 |
| textAlign | String | 水平对齐：left / center / right |
| verticalAlign | String | 垂直对齐：top / middle / bottom |

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

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 非0 | 失败（msg 中包含具体错误信息） |

## 状态枚举

### 任务状态（status）

| 值 | 说明 |
|----|------|
| 0 | 生成中 |
| 1 | 生成成功 |
| 2 | 生成失败 |

### 页面渠道来源（source）

| 值 | 说明 |
|----|------|
| 0 | Web |
| 1 | Mobile |
| 2 | App |
| 3 | WeChat |
| 4 | Other |
