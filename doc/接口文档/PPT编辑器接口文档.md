# PPT 编辑器接口文档

> **模块**：linlang-content-server
> **包路径**：`com.ai.linlang.content.controller.design`
> **Controller**：`DesignPptController`
> **基础路径**：`/api/design/ppt`
> **作者**：LSH

---

## 一、模块说明

PPT 编辑器面向 C 端，提供 PPT 模板浏览、分组查询与个人 PPT 作品保存能力。模板数据底层落在 content 公共库（`template` + `ppt_info`），个人 PPT 作品经 workspace RPC 落 `dp_material`。

- **模板浏览**：`pptSearch` 分页查询公共 PPT 模板（`@PermitAll`），通过 `ppt_info` 表获取 PPT 数据、`template` 表获取基础信息；`pptDetail` 按模板 ID 查单个公共 PPT 详情（含 PPT JSON，`@PermitAll`），供编辑器载入。
- **分组查询**：`pptGroups` 获取 PPT 模板分组列表（`@PermitAll`），用于编辑器侧边分类筛选。
- **作品保存**：`pptAction` 把个人 PPT 作品经 workspace RPC `syncPptWork` 写入个人空间 `dp_material`，返回 `productId`。
- **发布**：保存只写个人空间（草稿），**不写** `ppt_info`/`template`；发布到公共库走 **独立流程**——`ppt_info` 在发布时由 `ContentPublishApi` 创建（供公共库 `pptDetail` 读取），与图片编辑器对称，需 **DESIGNER** 角色。
- **鉴权**：除标注 `@PermitAll` 外，其余接口依赖登录态，服务端通过 `SecurityFrameworkUtils.getLoginUserId()` 取当前用户，**前端无需传 userId**。

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
| cid | Long | 是 | 用户ID（需与登录态一致）|
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

列表类接口的 `queryParameter` 继承 `PageParam`：

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| pageNo | Integer | 否 | 1 | 页码，从 1 开始 |
| pageSize | Integer | 否 | 10 | 每页条数 |

### 2.3 统一响应（CommonResult\<T\>）

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 状态码，`0` 表示成功 |
| data | T | 业务数据 |
| msg | String | 提示信息 |

### 2.4 分页响应（PageResult\<T\>）

| 字段 | 类型 | 说明 |
|------|------|------|
| list | List\<T\> | 当前页数据 |
| total | Long | 总条数 |

### 2.5 DesignPptTemplateVO（模板/详情统一结构）

`pptSearch` 列表项与 `pptDetail` 详情返回结构一致：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | PPT 模板ID（template.id）|
| pptInfoId | Long | PPT 信息ID（ppt_info.id）|
| name | String | PPT 模板名称 |
| cover | String | PPT 模板封面 URL |
| contentJsonUrl | String | PPT 数据（JSON）URL |
| width | Long | 宽度 |
| height | Long | 高度 |

---

## 三、接口清单

### 3.1 PPT 编辑器-模板列表

分页查询公共 PPT 模板列表，支持关键词搜索与分组筛选。通过 `ppt_info` 表获取 PPT 数据、`template` 表获取基础信息。

- **URL**：`POST /api/design/ppt/pptSearch`
- **鉴权**：`@PermitAll`（无需登录）

**请求参数（queryParameter = DesignPptTemplateReq extends PageParam）**

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| pageNo | Integer | 否 | 1 | 页码，默认 1 |
| pageSize | Integer | 否 | 10 | 每页条数，默认 10 |
| hasRecommend | Integer | 否 | 0 | 是否推荐：0-推荐 1-非推荐 |
| keywords | String | 否 | - | 关键词（按模板名称模糊匹配）|
| groupId | Long | 否 | - | 分组模板分类ID |

**请求示例**

```json
{
  "basicInfo": { "busId": 1001, "cid": 1001, "refer": "ppt-editor", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "pageNo": 1,
    "pageSize": 10,
    "hasRecommend": 0,
    "keywords": "年终总结",
    "groupId": 12
  }
}
```

**响应**：`CommonResult<PageResult<DesignPptTemplateVO>>`

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 5001,
        "pptInfoId": 8001,
        "name": "商务年终总结 PPT",
        "cover": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/ppt/cover_5001.png",
        "contentJsonUrl": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/ppt/data_5001.json",
        "width": 1920,
        "height": 1080
      }
    ],
    "total": 128
  },
  "msg": ""
}
```

---

### 3.2 PPT 编辑器-保存模板

保存个人 PPT 作品到个人空间（`dp_material`）。经 workspace RPC `syncPptWork` 写入个人作品，**不写** `ppt_info`/`template`。`productId` 非空表示更新、为空表示新建。**发布到公共库走独立流程**，不在本接口处理。

> `dp_material` 是个人 PPT 作品的唯一存储，workspace 同步失败即保存失败，异常上抛前端提示重试。

- **URL**：`POST /api/design/ppt/pptAction`
- **鉴权**：需登录

**请求参数（queryParameter = DesignPptPublishTemplateReq）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| productId | Long | 否 | 个人作品ID（`dp_material.id`）：更新时传入，新建时为空 |
| name | String | 否 | PPT 模板名称 |
| pptVO | PptVO | 否 | PPT 信息 |

**PptVO**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 否 | PPT 模板ID |
| name | String | 否 | PPT 模板名称 |
| cover | String | 否 | PPT 模板封面 URL |
| contentJsonUrl | String | 否 | PPT 数据（JSON）URL |

**请求示例（新建）**

```json
{
  "basicInfo": { "busId": 1001, "cid": 1001, "refer": "ppt-editor", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "productId": null,
    "name": "我的年终总结",
    "pptVO": {
      "id": 5001,
      "name": "我的年终总结",
      "cover": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/ppt/cover_1001_1779000000000.png",
      "contentJsonUrl": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/ppt/data_1001_1779000000000.json"
    }
  }
}
```

**响应**：`CommonResult<Long>`（返回 `productId`，即 `dp_material.id`）

```json
{
  "code": 0,
  "data": 20001,
  "msg": ""
}
```

---

### 3.3 PPT 编辑器-模板详情

根据模板ID查询公共 PPT 模板详情，包含 PPT JSON 数据（`contentJsonUrl`），供编辑器载入公共模板。

- **URL**：`POST /api/design/ppt/pptDetail`
- **鉴权**：`@PermitAll`（无需登录）

**请求参数（queryParameter = DesignPptDetailReq）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| id | Long | 否 | PPT 模板ID（template.id）|
| pptInfoId | Long | 否 | PPT 信息ID（ppt_info.id）|

**请求示例**

```json
{
  "basicInfo": { "busId": 1001, "cid": 1001, "refer": "ppt-editor", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "id": 5001,
    "pptInfoId": 8001
  }
}
```

**响应**：`CommonResult<DesignPptTemplateVO>`

```json
{
  "code": 0,
  "data": {
    "id": 5001,
    "pptInfoId": 8001,
    "name": "商务年终总结 PPT",
    "cover": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/ppt/cover_5001.png",
    "contentJsonUrl": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/ppt/data_5001.json",
    "width": 1920,
    "height": 1080
  },
  "msg": ""
}
```

---

### 3.4 PPT 编辑器-分组列表

获取 PPT 模板分组列表，用于编辑器侧边分类筛选。

- **URL**：`POST /api/design/ppt/pptGroups`
- **鉴权**：`@PermitAll`（无需登录）

**请求参数（queryParameter = GroupReq）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| keywords | String | 否 | 关键词（当前实现未参与查询，返回全部分组）|

**请求示例**

```json
{
  "basicInfo": { "busId": 1001, "cid": 1001, "refer": "ppt-editor", "source": 0, "hcode": "linlang", "version": "0.0.1" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "keywords": ""
  }
}
```

**响应**：`CommonResult<List<GroupPptRespVO>>`

```json
{
  "code": 0,
  "data": [
    { "groupId": 11, "groupName": "商务" },
    { "groupId": 12, "groupName": "教育" },
    { "groupId": 13, "groupName": "节日" }
  ],
  "msg": ""
}
```

---

## 四、错误码

| HTTP / 业务码 | 触发场景 | 处理建议 |
|------|------|------|
| 401 / 未登录 | `pptAction` 未携带有效登录态 | 引导用户登录后重试 |
| 500 / 保存失败 | workspace `syncPptWork` 同步异常 | `dp_material` 为个人 PPT 唯一存储，同步失败即保存失败，前端提示重试 |
