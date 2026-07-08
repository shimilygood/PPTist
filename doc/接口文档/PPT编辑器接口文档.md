# PPT编辑器接口文档

基础路径：`/api/design/ppt`

## 通用说明

### 请求结构

所有接口请求体统一为 `BaseRequest<T>` 格式：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| basicInfo | BasicInfo | 是 | 基础信息 |
| i18n | I18nInfo | 是 | 国际化信息 |
| queryParameter | T | 否 | 业务参数（各接口不同） |

#### BasicInfo

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| busId | Long | 是 | 商户ID |
| cid | Long | 是 | 用户ID |
| refer | String | 是 | 页面唯一标识 |
| source | Integer | 是 | 页面渠道来源（0-Web, 1-Mobile, 2-App, 3-WeChat, 4-Other） |
| hcode | String | 是 | 租户标识 |
| version | String | 是 | 版本信息 |

#### I18nInfo

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| language | String | 是 | 语言代码（zh-中文, en-英文, ja-日文, ko-韩文） |
| timezone | String | 是 | 时区（格式: +HHmm 或 -HHmm） |

### 响应结构

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 错误码，0 表示成功 |
| msg | String | 错误提示信息 |
| data | T | 返回数据（各接口不同） |

---

## 1. PPT模板列表（分页）

**POST** `/api/design/ppt/pptSearch`

**鉴权：** 无需登录（@PermitAll）

**描述：** 分页查询PPT模板列表，支持关键词搜索。通过 `ppt_info` 表获取PPT数据，`template` 表获取基础信息。固定查询 `typeId=2`（PPT类型）下的模板。

### 请求参数（queryParameter）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNo | Integer | 是 | 1 | 页码，从1开始 |
| pageSize | Integer | 是 | 10 | 每页条数，最大100 |
| keywords | String | 否 | - | 关键词（模板名称模糊搜索） |
| groupId | Long | 否 | - | 分组ID（不传则查所有分组） |
| hasRecommend | Integer | 否 | 0 | 是否推荐（0-推荐, 1-非推荐） |

### 请求示例

```json
{
  "basicInfo": {
    "busId": 1001,
    "cid": 2001,
    "refer": "ppt_editor",
    "source": 0,
    "hcode": "linlang",
    "version": "1.0.0"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {
    "pageNo": 1,
    "pageSize": 10,
    "keywords": "商务",
    "groupId": 5
  }
}
```

### 响应参数（data）

| 字段 | 类型 | 说明 |
|------|------|------|
| total | Long | 总记录数 |
| list | DesignPptTemplateVO[] | 模板列表 |

#### DesignPptTemplateVO

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 模板ID |
| name | String | 模板名称 |
| cover | String | 模板封面URL |
| json | String | PPT数据（JSON） |
| width | Long | 宽度 |
| height | Long | 高度 |

### 响应示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 25,
    "list": [
      {
        "id": 22,
        "name": "英文",
        "cover": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/xxx.jpg",
        "json": "{\"slides\":[...]}",
        "width": 1920,
        "height": 1080
      }
    ]
  }
}
```

---

## 2. PPT模板保存

**POST** `/api/design/ppt/pptAction`

**鉴权：** 需要登录

**描述：**。

### 请求参数（queryParameter）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | Long | 否 | 我的空间对应的产品ID，不传为新增，传则为编辑 |
| name | String | 是 | 模板名称 |
| pptVO | PptVO | 否 | PPT数据信息 |

#### PptVO

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | PPT信息ID |
| name | String | PPT名称（图层/页面名称） |
| cover | String | PPT封面URL |
| json | String | PPT原始JSON数据 |
| width | Long | 宽度 |
| height | Long | 高度 |

### 请求示例

#### 新增模板

```json
{
  "basicInfo": {
    "busId": 1001,
    "cid": 2001,
    "refer": "ppt_editor",
    "source": 0,
    "hcode": "linlang",
    "version": "1.0.0"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {
    "name": "商务汇报模板",
    "pptVO": {
      "name": "封面页",
      "cover": "https://xxx.oss.com/cover.jpg",
      "json": "{\"slides\":[{\"elements\":[...]}]}",
      "width": 1920,
      "height": 1080
    }
  }
}
```

#### 编辑模板

```json
{
  "basicInfo": { "busId": 1001, "cid": 2001, "refer": "ppt_editor", "source": 0, "hcode": "linlang", "version": "1.0.0" },
  "i18n": { "language": "zh", "timezone": "+0800" },
  "queryParameter": {
    "productId": 22,
    "name": "英文汇报",
    "pptVO": {
      "name": "封面页",
      "cover": "https://xxx.oss.com/new_cover.jpg",
      "json": "{\"slides\":[{\"elements\":[...]}]}",
      "width": 1920,
      "height": 1080
    }
  }
}
```

### 响应示例

```json
{
  "code": 0,
  "msg": "",
  "data": 123
}
```

---

## 3. PPT模板详情

**POST** `/api/design/ppt/pptDetail`

**鉴权：** 无需登录（@PermitAll）

**描述：** 根据模板ID查询PPT模板详情，包含PPT JSON数据。优先从 `ppt_info` 表获取封面和JSON数据，若无数据则回退到 `template` 表。

### 请求参数（queryParameter）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 模板ID |

### 请求示例

```json
{
  "basicInfo": {
    "busId": 1001,
    "cid": 2001,
    "refer": "ppt_editor",
    "source": 0,
    "hcode": "linlang",
    "version": "1.0.0"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {
    "id": 22
  }
}
```

### 响应参数（data）

`DesignPptTemplateVO`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 模板ID |
| name | String | 模板名称 |
| cover | String | 模板封面URL |
| json | String | PPT数据（JSON） |
| width | Long | 宽度 |
| height | Long | 高度 |

### 响应示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 22,
    "name": "英文汇报",
    "cover": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/xxx.jpg",
    "json": "{\"slides\":[{\"elements\":[...]}]}",
    "width": 1920,
    "height": 1080
  }
}
```

---

## 4. 获取PPT分组列表

**POST** `/api/design/ppt/pptGroups`

**鉴权：** 无需登录（@PermitAll）

**描述：** 获取 `typeId=2`（PPT类型）下关联的所有分组列表。通过 `template_type_group_rel` 表查询关联关系，返回分组ID和分组名称。

### 请求参数（queryParameter）

无业务参数，`queryParameter` 可传空对象 `{}`。

### 请求示例

```json
{
  "basicInfo": {
    "busId": 1001,
    "cid": 2001,
    "refer": "ppt_editor",
    "source": 0,
    "hcode": "linlang",
    "version": "1.0.0"
  },
  "i18n": {
    "language": "zh",
    "timezone": "+0800"
  },
  "queryParameter": {}
}
```

### 响应参数（data）

`GroupPptRespVO[]`

| 字段 | 类型 | 说明 |
|------|------|------|
| groupId | Long | 分组ID |
| groupName | String | 分组名称 |

### 响应示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    { "groupId": 5, "groupName": "商务" },
    { "groupId": 6, "groupName": "教育" },
    { "groupId": 7, "groupName": "科技" }
  ]
}
```

---

## 数据模型关系

```
template (模板基础信息)
  ├── id (主键)
  ├── name (模板名称)
  ├── typeId (模板类型ID, PPT固定为2)
  ├── groupId (分组ID)
  ├── width / height (尺寸)
  ├── image (图片信息, JSON数组格式)
  └── ...其他基础字段

       │
       │ 1 : 1
       │
ppt_info (PPT JSON数据)
  ├── id (主键)
  ├── template_id (关联template.id)
  ├── ppt_data (PPT原始JSON数据)
  ├── cover (封面URL)
  ├── name (页面名称)
  └── sort (排序)

template_type_group_rel (类型-分组关联)
  ├── id (主键)
  ├── type_id (关联template_type.id)
  └── group_id (关联template_group.id)
```