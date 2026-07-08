# AI PPT 接口文档

> **模块**：linlang-ai-server
> **包路径**：`com.linlang.ai.controller.ppt`
> **Controllers**：`AiPptController` / `AiPptOutlineController` / `AiPptRefineController`
> **基础路径**：`/ai/ppt`（`AiPptOutlineController` 为 `/ai/ppt/outline`）
> **作者**：linlang

---

## 一、模块说明

AI PPT 全域接口，覆盖「**大纲生成 → 大纲编辑回流 → PPT 生成 → 状态轮询 → 文件下载 → 二次加工**」完整闭环。由三个 Controller 协同：

| Controller | 职责 | 基础路径 |
|-----------|------|---------|
| `AiPptController` | PPT 生成核心：流式大纲、异步/流式生成、下载、状态轮询 | `/ai/ppt` |
| `AiPptOutlineController` | 大纲编辑回流 CRUD：获取 / 保存 / 列表 / 删除 | `/ai/ppt/outline` |
| `AiPptRefineController` | PPT 二次加工（扩写 / 润色 / 翻译） | `/ai/ppt`（子路径 `refine`）|

> 与 [[ppt-refactor-roadmap]] / [[ppt-save-publish-model]] 中「越权修复 + 统一 schema + 大纲回流」改造对应，与 [[ai-generate-modules]] 中「配置驱动异步生成统一模式」一致。

核心特性：

- **流式大纲**：`/generate-outline` 走 SSE 流式返回，边生成边推送，提升首字响应。
- **两套生成路径**：`/generate`（一次性异步，轮询 `/getPptStatus`）与 `/generate-stream`（逐页 SSE）；后者断线可用 `/getPptStatus` 兜底。
- **大纲回流**：AI 生成的大纲持久化为可编辑对象（`ai_ppt_outline`），用户编辑后再驱动 PPT 生成（`outlineId` 跳过 AI 二次解析）。
- **二次加工**：基于已生成 PPT 任务或已有模板，异步执行扩写/润色/翻译。
- **鉴权**：所有接口均按登录用户 `userId`（Token 解析）隔离，越权访问统一抛异常。

---

## 二、通用约定

### 2.1 请求外层结构（BaseRequest\<T\>）

所有接口请求体统一为 `BaseRequest<T>`，业务参数放在 `queryParameter` 中：

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| basicInfo | BasicInfo | 是 | 基础公共参数 |
| i18n | I18nInfo | 是 | 国际化参数 |
| queryParameter | T | - | 业务请求参数（各接口不同，见下）|

**BasicInfo**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| busId | Long | 是 | 商户ID |
| cid | Long | 是 | 用户ID |
| refer | String | 是 | 页面唯一标识 |
| source | Integer | 是 | 渠道来源：0-Web 1-Mobile 2-App 3-WeChat 4-Other |
| hcode | String | 是 | 租户标识 |
| version | String | 是 | 版本信息 |

**I18nInfo**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| language | String | 是 | 语言代码：zh / en / ja / ko |
| timezone | String | 是 | 时区，格式 `+HHmm` / `-HHmm`（如 `+0800`）|

### 2.2 分页参数（PageParam）

分页接口的 `queryParameter` 继承 `PageParam`，公共分页字段：

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| pageNo | Integer | 是 | 1 | 页码，从 1 开始 |
| pageSize | Integer | 是 | 10 | 每页条数，最大 100；传 `-1` 不分页 |

### 2.3 响应结构（CommonResult\<T\>）

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 错误码，`0` 表示成功 |
| msg | String | 提示信息，成功时为空串 |
| data | T | 返回数据 |

### 2.4 分页响应（PageResult\<T\>）

分页接口的 `data` 为 `PageResult<T>`：

| 字段 | 类型 | 说明 |
|------|------|------|
| total | Long | 总条数 |
| list | List\<T\> | 当前页数据 |

### 2.5 SSE 流式响应（Flux\<CommonResult\<T\>\>）

`/generate-outline` 与 `/generate-stream` 以 `text/event-stream` 推送，每条消息是一个完整 `CommonResult<T>` JSON。前端按事件流逐条消费，遇到终止信号（`DONE` / `ERROR` 或流关闭）结束。

---

## 三、接口清单

| # | 接口 | 方法 | 路径 | 响应类型 | 说明 |
|:-:|------|:----:|------|------|------|
| 4.1 | 生成 PPT 大纲（流式） | POST | `/ai/ppt/generate-outline` | SSE `Flux<CommonResult<String>>` | AI 流式生成结构化大纲 |
| 4.2 | 生成 PPT | POST | `/ai/ppt/generate` | `CommonResult<Long>` | 异步生成，返回任务 ID |
| 4.3 | 流式生成 PPT | POST | `/ai/ppt/generate-stream` | SSE `Flux<CommonResult<PptStreamEventVO>>` | 逐页推送幻灯片 + 进度（优化中）|
| 4.4 | 下载 PPT 文件 | POST | `/ai/ppt/download` | 二进制流 | 按任务 ID 下载 .pptx |
| 4.5 | 获得 PPT 任务 | POST | `/ai/ppt/getPptStatus` | `CommonResult<AiPptRespVO>` | 轮询生成状态 |
| 5.1 | 获取大纲 | POST | `/ai/ppt/outline/get` | `CommonResult<AiPptOutlineRespVO>` | 校验归属；越权抛 `NOT_EXISTS` |
| 5.2 | 保存编辑后的大纲 | POST | `/ai/ppt/outline/save` | `CommonResult<Boolean>` | 乐观锁；版本不符抛 `VERSION_CONFLICT` |
| 5.3 | 我的大纲列表 | POST | `/ai/ppt/outline/my-page` | `PageResult<AiPptOutlineRespVO>` | `userId` 强制覆盖为登录用户 |
| 5.4 | 删除大纲 | POST | `/ai/ppt/outline/delete` | `CommonResult<Boolean>` | 校验归属 |
| 6.1 | PPT 加工 | POST | `/ai/ppt/refine` | `CommonResult<Long>` | 异步加工，返回任务 ID |
| 6.2 | 获取 PPT 加工任务 | POST | `/ai/ppt/refine/get` | `CommonResult<AiPptRefineRespVO>` | 轮询加工状态 |

---

## 四、AI PPT 生成接口（AiPptController）

### 4.1 生成 PPT 大纲（流式）

**`POST /ai/ppt/generate-outline`**（`Content-Type: text/event-stream`）

AI 流式生成 PPT 结构化大纲，SSE 逐段推送字符串。流末大纲落 `ai_ppt_outline`，前端随后可用 [§五 大纲接口](#五ai-ppt-大纲接口aipptoutlinecontroller) 编辑。

#### queryParameter — AiPptOutlineReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| topic | String | 是 | PPT 主题 |
| outline | String | 否 | 自定义大纲 |
| templateId | Long | 否 | 模板编号，`null` 使用默认风格 |
| scheme | String | 否 | 策划方案类型，影响章节结构：`工作汇报` / `方案策划` / `教学课件` / `学术报告` / `活动宣传` |
| webSearch | Boolean | 否 | 是否联网（启用后大纲可参考最新公开信息）|
| imageType | String | 否 | 配图类型（后续 `generatePpt` 阶段消费）：`智能配图` / `图库配图` / `AI生成图片` |
| language | String | 否 | 输出语言（整份大纲使用此语言）：`中文` / `英文` / `日文` / `韩文` / `法文` / `德文` |
| pageCount | Integer | 否 | 目标页码（期望总页数，含封面/目录/结束页）|

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-outline", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "topic": "2026年AI发展趋势",
    "scheme": "工作汇报",
    "imageType": "智能配图",
    "language": "中文",
    "pageCount": 12
  }
}
```

#### 响应 — SSE `Flux<CommonResult<String>>`

每条 `data` 为大模型逐步吐出的文本片段（增量拼接即为完整大纲 JSON）。

```
data:{"code":0,"msg":"","data":"{\"title\":\"2026年AI发展趋势\""}

data:{"code":0,"msg":"","data":",\"sections\":[{\"sectionTitle\":\"行业概览\"}"}

data:{"code":0,"msg":"","data":"]}"}
```

---

### 4.2 生成 PPT（异步）

**`POST /ai/ppt/generate`**

提交异步生成任务，立即返回任务 ID；前端用 [/getPptStatus](#45-获得-ppt-任务轮询) 轮询状态。

#### queryParameter — AiPptGenerateReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| topic | String | 是 | PPT 主题 |
| outline | String | 否 | 自定义大纲 |
| templateId | Long | 否 | 模板编号，`null` 使用默认风格 |
| size | Long | 否 | 页码（目标页数）|
| useReasoning | Boolean | 否 | 先思考后回答，解决推理问题 |
| enableImageBackground | Boolean | 否 | 是否启用 AI 背景图片 |
| imageModelId | Long | 否 | 图片模型编号，不传使用默认 |
| mode | String | 否 | 生成模式：`outline` 表示基于提纲逐章节生成，不传则使用原有逻辑 |
| outlineId | Long | 否 | 大纲 ID（优先使用，跳过 AI 二次解析，见 [§五 大纲接口](#五ai-ppt-大纲接口aipptoutlinecontroller)）|

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-generate", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "topic": "2026年AI发展趋势",
    "templateId": 1,
    "size": 12,
    "enableImageBackground": true,
    "outlineId": 9001
  }
}
```

#### 响应 — CommonResult\<Long\>

```json
{
  "code": 0,
  "msg": "",
  "data": 1001
}
```

---

### 4.3 流式生成 PPT

**`POST /ai/ppt/generate-stream`**（`Content-Type: text/event-stream`）

> ⚠️ **优化中（V0.0.1）**：逐页 SSE 推送幻灯片 + 生成进度。事件时序：
> `TASK_ID → SLIDE* → FINALIZING* → DONE | ERROR`。断线后可 [/getPptStatus](#45-获得-ppt-任务轮询) 轮询 `pagesDone` / `pagesTotal` / `phase` 续看进度。

设计要点：SSE 只推**小 URL**（单页 OSS JSON 地址），不推 slide 内容；前端复用现有「fetch OSS JSON → 渲染」链路，每页 OSS 文件是自包含 1 页 `PptSlideDataDTO`（slides:[单页] + theme），渲染器零改动。

#### queryParameter — AiPptGenerateReqVO

字段同 [4.2 - AiPptGenerateReqVO](#42-生成-ppt异步)。

#### 响应 — SSE `Flux<CommonResult<PptStreamEventVO>>`

事件流示例（按时间顺序）：

```
data:{"code":0,"msg":"","data":{"type":"TASK_ID","taskId":1001}}

data:{"code":0,"msg":"","data":{"type":"SLIDE","index":1,"total":12,"phase":"rendering","slideUrl":"https://oss.example.com/ppt/task_1001/slide_1.json"}}

data:{"code":0,"msg":"","data":{"type":"SLIDE","index":2,"total":12,"phase":"rendering","slideUrl":"https://oss.example.com/ppt/task_1001/slide_2.json"}}

data:{"code":0,"msg":"","data":{"type":"FINALIZING","phase":"background","index":3,"total":12}}

data:{"code":0,"msg":"","data":{"type":"DONE","taskId":1001,"contentJsonUrl":"https://oss.example.com/ppt/task_1001/deck.json","pageCount":12}}
```

字段全集见 [§七 - PptStreamEventVO](#pptstreameventvo)。

---

### 4.4 下载 PPT 文件

**`POST /ai/ppt/download`**

按任务 ID 下载生成的 `.pptx` 文件。**该接口直接写二进制流到 `HttpServletResponse`**，不返回 `CommonResult`。

#### queryParameter — AiPptIdReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 任务编号 |

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-download", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": { "id": 1001 }
}
```

#### 响应 — 二进制流

- `Content-Type`: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `Content-Disposition`: `attachment; filename=<URL编码后的文件名>.pptx`
- 文件名规则：`{topic}.pptx`，`topic` 为空时回退 `AI生成的PPT.pptx`。
- Body：`.pptx` 字节流。

---

### 4.5 获得 PPT 任务（轮询）

**`POST /ai/ppt/getPptStatus`**

轮询 PPT 生成状态：`status` `0`=生成中 `1`=成功 `2`=失败。任务不存在时返回 `data: null`。该接口同时作为 [4.3 流式生成](#43-流式生成-ppt讯飞智文式) 的断线兜底。

#### queryParameter — AiPptIdReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 任务编号 |

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-status", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": { "id": 1001 }
}
```

#### 响应 — CommonResult\<AiPptRespVO\>

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 1001,
    "userId": 100001,
    "topic": "2026年AI发展趋势",
    "templateId": 1,
    "templateName": "商务蓝",
    "platform": "TongYi",
    "model": "qwen-max",
    "status": 1,
    "contentJson": null,
    "contentJsonUrl": "https://oss.example.com/ppt/task_1001/deck.json",
    "fileUrl": "https://oss.example.com/ppt/task_1001/deck.pptx",
    "pageCount": 12,
    "pagesDone": 12,
    "pagesTotal": 12,
    "phase": "uploading",
    "errorMessage": null,
    "createTime": "2026-07-07 10:00:00"
  }
}
```

完整字段见 [§七 - AiPptRespVO](#aipptrespvo)。

---

## 五、AI PPT 大纲接口（AiPptOutlineController）

AI PPT **大纲编辑回流** CRUD 模块。生成大纲（SSE）仍在 [4.1](#41-生成-ppt-大纲流式)，流末将大纲落 `ai_ppt_outline` 表后，前端用本模块完成 **获取 / 编辑保存 / 列表 / 删除**。

- **三级结构（讯飞智文式）**：`section(sectionTitle/sectionDesc?) → page(pageTitle/points/layout?/note?)`；旧扁平格式 `section(sectionTitle/sectionItems/pageCount?)` 仍兼容（`pages` 为空时降级）。
- **乐观锁**：`save` 按 `id + version` 更新，版本不符抛 `VERSION_CONFLICT`（项目未注册 MP `OptimisticLockerInnerInterceptor`，由 Service 层手动 WHERE/SET 实现）。
- **归属校验**：`get` / `save` / `delete` 均校验任务归属当前登录用户，不存在或越权统一抛 `NOT_EXISTS`。
- **列表强隔离**：`my-page` 的 `userId` 由服务端强制覆盖为登录用户，前端传无效。

### 5.1 获取大纲

**`POST /ai/ppt/outline/get`**

按大纲 ID 获取详情，校验归属；不存在或越权统一抛 `NOT_EXISTS`。

#### queryParameter — AiPptOutlineIdReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 大纲 id |

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-outline-get", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": { "id": 9001 }
}
```

#### 响应 — CommonResult\<AiPptOutlineRespVO\>

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 9001,
    "topic": "2026年AI发展趋势",
    "title": "2026年AI发展趋势",
    "subtitle": "从技术演进到商业落地",
    "outlineData": "[{\"sectionTitle\":\"行业概览\",\"pages\":[{\"pageTitle\":\"市场规模\",\"points\":[\"全球AI市场突破5000亿美元\"]}]}]",
    "templateId": 1,
    "status": 1,
    "version": 3,
    "lastTaskId": 1001,
    "createTime": "2026-07-07 10:00:00"
  }
}
```

完整字段见 [§七 - AiPptOutlineRespVO](#aipptoutlinerespvo)。

---

### 5.2 保存编辑后的大纲

**`POST /ai/ppt/outline/save`**

乐观锁更新；`id + version` 不符抛 `VERSION_CONFLICT`。

#### queryParameter — AiPptOutlineSaveReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 大纲 id |
| version | Integer | 是 | 版本号（乐观锁）|
| title | String | 是 | PPT 主标题 |
| subtitle | String | 否 | 副标题 |
| sections | List\<SectionReq\> | 是 | 章节列表（不可为空）|

**SectionReq**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| sectionTitle | String | 是 | 章节标题 |
| sectionDesc | String | 否 | 章节·一句话概述 |
| pages | List\<PageReq\> | 否 | 页面列表（三级结构，优先于 `sectionItems`）|
| sectionItems | List\<String\> | 否 | 子主题列表（旧扁平格式，`pages` 为空时使用）|
| pageCount | Integer | 否 | 该章节目标页数（旧格式下 `null` 则自动估算）|

**PageReq**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| pageTitle | String | 是 | 页面标题 |
| points | List\<String\> | 否 | 页面要点列表（短语级，下游会再次扩展为详细内容）|
| layout | String | 否 | 布局提示：`content` / `table` / `two_column` |
| note | String | 否 | 演讲备注 |

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-outline-save", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "id": 9001,
    "version": 3,
    "title": "2026年AI发展趋势",
    "subtitle": "从技术演进到商业落地",
    "sections": [
      {
        "sectionTitle": "行业概览",
        "sectionDesc": "宏观市场规模与格局",
        "pages": [
          {
            "pageTitle": "市场规模",
            "points": ["全球AI市场突破5000亿美元", "年复合增长率超30%"],
            "layout": "content",
            "note": "强调中国市场增速"
          }
        ]
      },
      {
        "sectionTitle": "技术趋势",
        "sectionItems": ["多模态大模型", "Agent 智能体"],
        "pageCount": 3
      }
    ]
  }
}
```

#### 响应 — CommonResult\<Boolean\>

```json
{ "code": 0, "msg": "", "data": true }
```

---

### 5.3 我的大纲列表

**`POST /ai/ppt/outline/my-page`**

分页查询当前登录用户的大纲。`userId` 由服务端强制覆盖为登录用户，前端传入会被忽略。

#### queryParameter — AiPptOutlinePageReqVO（extends PageParam）

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| userId | Long | 否 | 用户编号（服务端强制覆盖为登录用户，前端传无效）|
| topic | String | 否 | 主题（模糊匹配）|
| status | Integer | 否 | 状态：`0`-draft `1`-edited `2`-used |
| createTime | LocalDateTime[] | 否 | 创建时间范围 `[起, 止]`，格式 `yyyy-MM-dd HH:mm:ss` |
| pageNo | Integer | 是 | 页码，默认 1 |
| pageSize | Integer | 是 | 每页条数，默认 10，最大 100 |

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-outline-page", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "topic": "AI",
    "status": 1,
    "pageNo": 1,
    "pageSize": 10
  }
}
```

#### 响应 — PageResult\<AiPptOutlineRespVO\>

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 1,
    "list": [
      {
        "id": 9001,
        "topic": "2026年AI发展趋势",
        "title": "2026年AI发展趋势",
        "subtitle": "从技术演进到商业落地",
        "outlineData": "[{\"sectionTitle\":\"行业概览\",...}]",
        "templateId": 1,
        "status": 1,
        "version": 3,
        "lastTaskId": 1001,
        "createTime": "2026-07-07 10:00:00"
      }
    ]
  }
}
```

完整字段见 [§七 - AiPptOutlineRespVO](#aipptoutlinerespvo)。

---

### 5.4 删除大纲

**`POST /ai/ppt/outline/delete`**

按大纲 ID 删除，校验归属；不存在或越权统一抛 `NOT_EXISTS`。

#### queryParameter — AiPptOutlineIdReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 大纲 id |

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-outline-delete", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": { "id": 9001 }
}
```

#### 响应 — CommonResult\<Boolean\>

```json
{ "code": 0, "msg": "", "data": true }
```

---

## 六、AI PPT 加工接口（AiPptRefineController）

AI PPT **加工**（扩写 / 润色 / 翻译）模块。基于「已生成 PPT 任务」或「已有模板」二次加工内容，异步执行，前端通过 `/ai/ppt/refine/get` 轮询状态。

- **双来源**：`sourceType=TASK`（已生成 PPT）/ `TEMPLATE`（已有模板），`sourceId` 分别为 `taskId` / `templateId`。
- **三种操作**：`EXPAND`（扩写）/ `POLISH`（润色）/ `TRANSLATE`（翻译，需带 `targetLang`）。
- **可选导出**：`exportPptx=true` 时除内容 JSON 外额外产出 `.pptx` 文件。
- **异步轮询**：`refine` 立即返回任务 ID，`refine/get` 轮询 `status`：`0`-处理中 `1`-成功 `2`-失败。

> 注：本 Controller 基础路径与 [§四 AiPptController](#四ai-ppt-生成接口aipptcontroller) 同为 `/ai/ppt`，但子路径 `refine` / `refine/get` 不重叠。

### 6.1 PPT 加工（扩写/润色/翻译）

**`POST /ai/ppt/refine`**

提交异步加工任务，立即返回任务 ID；前端通过 [/ai/ppt/refine/get](#62-获取-ppt-加工任务) 轮询状态。

#### queryParameter — AiPptRefineReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| sourceType | String | 是 | 来源类型：`TASK`-已生成 PPT / `TEMPLATE`-已有模板 |
| sourceId | Long | 是 | 来源 ID（`taskId` 或 `templateId`）|
| operation | String | 是 | 操作类型：`EXPAND`-扩写 / `POLISH`-润色 / `TRANSLATE`-翻译 |
| targetLang | String | 否 | 目标语言（翻译时必填，如 `en` / `ja` / `ko`）|
| styleHint | String | 否 | 风格提示（扩写/润色可选，如「更专业」「面向高管」）|
| exportPptx | Boolean | 否 | 是否同时导出 PPTX 文件 |

#### 请求示例（润色已生成的 PPT）

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-refine", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "sourceType": "TASK",
    "sourceId": 1001,
    "operation": "POLISH",
    "styleHint": "更专业、简洁",
    "exportPptx": true
  }
}
```

#### 响应 — CommonResult\<Long\>

```json
{
  "code": 0,
  "msg": "",
  "data": 2001
}
```

---

### 6.2 获取 PPT 加工任务

**`POST /ai/ppt/refine/get`**

轮询加工状态：`status` `0`-处理中 `1`-成功 `2`-失败。任务不存在时返回 `data: null`。

#### queryParameter — AiPptRefineIdReqVO

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 加工任务 ID |

#### 请求示例

```json
{
  "basicInfo": { "busId": 123456, "cid": 100001, "refer": "ai-ppt-refine-get", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": { "id": 2001 }
}
```

#### 响应 — CommonResult\<AiPptRefineRespVO\>

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 2001,
    "userId": 100001,
    "sourceType": "TASK",
    "sourceId": 1001,
    "operation": "POLISH",
    "targetLang": null,
    "styleHint": "更专业、简洁",
    "status": 1,
    "resultContentUrl": "https://oss.example.com/ppt/refine/2001/deck.json",
    "resultFileUrl": "https://oss.example.com/ppt/refine/2001/deck.pptx",
    "pageCount": 12,
    "errorMessage": null,
    "createTime": "2026-07-07 11:00:00"
  }
}
```

完整字段见 [§七 - AiPptRefineRespVO](#aipptrefinerespvo)。

---

## 七、数据结构

### 生成相关

<a id="aipptrespvo"></a>

**AiPptRespVO** — 任务详情（4.5 轮询返回）。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 任务编号 |
| userId | Long | 用户编号 |
| topic | String | PPT 主题 |
| outline | String | 用户提供的自定义大纲 |
| templateId | Long | 使用的模板编号 |
| templateName | String | 使用的模板名称（服务端按 templateId 反查补全）|
| platform | String | 平台 |
| model | String | 模型 |
| status | Integer | 状态：`0`-生成中 `1`-成功 `2`-失败 |
| contentJson | String | AI 生成的结构化内容（JSON）|
| contentJsonUrl | String | 结构化内容 JSON 的 OSS 地址 |
| fileUrl | String | 生成的 PPT 文件路径 |
| pageCount | Integer | PPT 页数 |
| pagesDone | Integer | 生成进度-已完成数（渲染页数或背景图数，配合 `phase` 理解）|
| pagesTotal | Integer | 生成进度-总数 |
| phase | String | 生成阶段：`rendering` / `background` / `merging` / `uploading` |
| errorMessage | String | 错误信息（失败时返回）|
| createTime | LocalDateTime | 创建时间 |

<a id="pptstreameventvo"></a>

**PptStreamEventVO** — 流式生成 SSE 事件（4.3）。

| 字段 | 类型 | 说明 |
|------|------|------|
| type | String | 事件类型：`TASK_ID` / `SLIDE` / `FINALIZING` / `DONE` / `ERROR` |
| taskId | Long | 任务 id |
| index | Integer | 当前序号（1-based；`SLIDE`=页序号，`FINALIZING` phase=`background`=图片序号）|
| total | Integer | 总数（`SLIDE`=总页数，`FINALIZING` phase=`background`=图片总数）|
| phase | String | 阶段：`rendering` / `background` / `merging` / `uploading`（`FINALIZING` 时）|
| slideUrl | String | 单页 `PptSlideDataDTO` JSON 的 OSS 地址（`SLIDE` 时），前端 fetch 后用现有渲染器渲染 |
| contentJsonUrl | String | 全量 PPT JSON 的 OSS 地址（`DONE` 时，含 AI 背景图）|
| pageCount | Integer | PPT 页数（`DONE` 时）|
| message | String | 错误信息（`ERROR` 时）|

事件时序：

```
TASK_ID  → 建立任务（前端拿 taskId，断线可轮询 /getPptStatus 续看）
SLIDE*   → 逐页推送 OSS URL，前端 fetch(slideUrl) 用现有渲染器渲染 1 页
FINALIZING* → 收尾阶段（phase=background 时 index/total=背景图进度）
DONE | ERROR → 终止（DONE 给全量 deck URL，含 AI 背景图）
```

<a id="aipptidreqvo"></a>

**AiPptIdReqVO**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 任务编号 |

### 大纲相关

<a id="aipptoutlinerespvo"></a>

**AiPptOutlineRespVO** — 大纲完整信息（5.1 详情 / 5.3 列表元素）。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 大纲 id |
| topic | String | 原始主题 |
| title | String | PPT 主标题 |
| subtitle | String | 副标题 |
| outlineData | String | 章节 JSON（`List<SectionReq>`：三级 section→page→points，旧扁平 sectionItems 兼容）|
| templateId | Long | 关联模板 |
| status | Integer | 状态：`0`-draft `1`-edited `2`-used |
| version | Integer | 版本号（乐观锁）|
| lastTaskId | Long | 最近一次生成的 PPT 任务 id |
| createTime | LocalDateTime | 创建时间 |

<a id="aipptoutlineidreqvo"></a>

**AiPptOutlineIdReqVO**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 大纲 id |

<a id="aipptoutlinesavereqvo"></a>

**AiPptOutlineSaveReqVO** — 见 [5.2 - queryParameter](#52-保存编辑后的大纲)，含嵌套 `SectionReq` / `PageReq`。

<a id="aipptoutlinepagereqvo"></a>

**AiPptOutlinePageReqVO** — 见 [5.3 - queryParameter](#53-我的大纲列表)。

### 加工相关

<a id="aipptrefinerespvo"></a>

**AiPptRefineRespVO** — 加工任务详情（6.2 轮询返回）。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 任务编号 |
| userId | Long | 用户编号 |
| sourceType | String | 来源类型：`TASK` / `TEMPLATE` |
| sourceId | Long | 来源 ID（`taskId` 或 `templateId`）|
| operation | String | 操作类型：`EXPAND` / `POLISH` / `TRANSLATE` |
| targetLang | String | 目标语言（如 `en` / `ja` / `ko`）|
| styleHint | String | 风格提示 |
| status | Integer | 状态：`0`-处理中 `1`-成功 `2`-失败 |
| resultContentUrl | String | 结果内容 JSON 的 OSS 地址 |
| resultFileUrl | String | 结果 PPTX 地址（`exportPptx=true` 时产出）|
| pageCount | Integer | 页数 |
| errorMessage | String | 错误信息（失败时返回）|
| createTime | LocalDateTime | 创建时间 |

<a id="aipptrefineidreqvo"></a>

**AiPptRefineIdReqVO**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 是 | 加工任务 ID |

---

## 八、业务规则

### 8.1 通用

- **数据归属**：所有接口均按登录用户 `userId` 隔离，`userId` 由服务端从 Token 解析，前端**不要**在 `queryParameter` 传用户ID。
- **越权处理**：跨用户访问任务/大纲统一抛异常（生成、大纲 get/save/delete 均校验归属，越权按 `NOT_EXISTS` 处理）。
- **空结果约定**：轮询接口（`/getPptStatus`、`/refine/get`）任务不存在时返回 `data: null`（非报错）。

### 8.2 生成（AiPptController）

- **两套生成路径**：
  - 简单异步：`/generate` → 轮询 `/getPptStatus` 直到 `status` 非 `0`。
  - 流式：`/generate-stream` 边推边渲染，断线用 `/getPptStatus` 兜底。
- **进度字段语义**：`pagesDone` / `pagesTotal` 的含义随 `phase` 变化（渲染阶段=页数；背景图阶段=图片数），轮询时务必结合 `phase` 判断。
- **下载文件名**：使用 `topic` 命名，`topic` 为空时回退 `AI生成的PPT`，整体 URL 编码后放入 `Content-Disposition`。
- **outlineId 优先**：`AiPptGenerateReqVO.outlineId` 命中时跳过 AI 二次解析，直接走 [§五 已保存大纲](#五ai-ppt-大纲接口aipptoutlinecontroller)。

### 8.3 大纲（AiPptOutlineController）

- **乐观锁**：`save` 必须带 `version`，按 `id + version` 更新；版本不符抛 `VERSION_CONFLICT`。项目未注册 MP `OptimisticLockerInnerInterceptor`，由 Service 层手动 `WHERE id AND version` + `SET version+1` 实现。
- **三级结构优先**：保存时 `sections[].pages` 优先于 `sectionItems`；`pages` 为空才降级使用旧扁平格式。
- **列表强隔离**：`my-page` 的 `userId` 被服务端**强制覆盖**为登录用户（即便前端传入也无效）。
- **联动生成**：保存后可拿 `id` 作为 `AiPptGenerateReqVO.outlineId` 调 [4.2 生成 PPT](#42-生成-ppt异步)，跳过 AI 二次解析。

### 8.4 加工（AiPptRefineController）

- **异步轮询**：`refine` 提交后立即返回任务 ID，前端轮询 `/refine/get`，`status=1` 取 `resultContentUrl` / `resultFileUrl`，`status=2` 取 `errorMessage`。
- **来源映射**：`sourceType=TASK` 时 `sourceId` 为 [4.5 PPT 任务 ID](#45-获得-ppt-任务轮询)；`sourceType=TEMPLATE` 时为模板 ID。两种来源均会拉源内容 JSON 后送模型加工。
- **翻译必填语言**：`operation=TRANSLATE` 时必须传 `targetLang`，否则业务校验失败。
- **可选导出**：仅当 `exportPptx=true` 时 `resultFileUrl` 才有值；否则只产出 `resultContentUrl`。

---

## 九、枚举速查

| 维度 | 取值 | 含义 |
|------|------|------|
| **任务 status**（生成 / 加工）| `0` | 生成中 / 处理中 |
| | `1` | 成功 |
| | `2` | 失败 |
| **phase**（生成阶段）| `rendering` | 渲染幻灯片 |
| | `background` | 生成背景图 |
| | `merging` | 合并模板 |
| | `uploading` | 上传 OSS |
| **type**（SSE 事件）| `TASK_ID` | 任务已创建 |
| | `SLIDE` | 单页就绪 |
| | `FINALIZING` | 收尾阶段 |
| | `DONE` | 全部完成 |
| | `ERROR` | 生成失败 |
| **mode**（生成模式）| `outline` | 基于提纲逐章节生成 |
| | 不传 | 原有逻辑 |
| **大纲 status** | `0` | draft（草稿，AI 刚生成）|
| | `1` | edited（用户已编辑）|
| | `2` | used（已用于生成 PPT）|
| | `3` | archived（归档，DO 字段保留）|
| **layout**（大纲页面布局）| `content` | 内容页 |
| | `table` | 表格页 |
| | `two_column` | 双栏页 |
| **sourceType**（大纲来源，DO 字段）| `ai` | AI 生成 |
| | `manual` | 手动创建 |
| | `imported` | 外部导入 |
| **sourceType**（加工来源）| `TASK` | 已生成 PPT |
| | `TEMPLATE` | 已有模板 |
| **operation**（加工操作）| `EXPAND` | 扩写 |
| | `POLISH` | 润色 |
| | `TRANSLATE` | 翻译 |
