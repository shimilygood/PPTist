---
title: 测试用例
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# 测试用例

Base URLs:

# Authentication

# content

## POST 编辑器-素材

POST /api/design/template/page

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST 素材分页列表

POST /api/content/material/search

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "total": 0,
    "list": [
      {
        "id": 0,
        "imageUrl": "string",
        "width": 0,
        "height": 0,
        "fileSize": 0
      }
    ]
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» msg|string|true|none||none|
|» data|object|true|none||none|
|»» total|integer|true|none||none|
|»» list|[object]|true|none||none|
|»»» id|integer|true|none||none|
|»»» imageUrl|string|true|none||none|
|»»» width|integer¦null|true|none||none|
|»»» height|integer¦null|true|none||none|
|»»» fileSize|integer¦null|true|none||none|

## POST 编辑器-保存我的尺寸

POST /api/design/template/saveMySize

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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
    "name": "简约",
    "width": 21,
    "height": 21,
    "unit": "px"
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 否 |none|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "string",
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» msg|string|true|none||none|
|» data|null|true|none||none|

## POST 编辑器-修改我的尺寸

POST /api/design/template/updateMySize

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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
    "id": 1,
    "name": "简约",
    "width": 21,
    "height": 211,
    "unit": "px"
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 否 |none|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "string",
  "data": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» msg|string|true|none||none|
|» data|boolean|true|none||none|

## POST 编辑器-推荐尺寸

POST /api/design/template/recommendSize

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 否 |none|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    null
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» msg|string|true|none||none|
|» data|[any]|true|none||none|

## POST 编辑器-我的尺寸

POST /api/design/template/mySize

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 否 |none|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 0,
      "name": "string",
      "width": 0,
      "height": 0,
      "unit": "string"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» msg|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|integer|false|none||none|
|»» name|string|false|none||none|
|»» width|integer|false|none||none|
|»» height|integer|false|none||none|
|»» unit|string|false|none||none|

## POST 编辑器-素材分页列表

POST /api/design/material/search

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "total": 0,
    "list": [
      {
        "id": 0,
        "name": "string",
        "thumbnailUrl": "string",
        "width": 0,
        "height": 0,
        "fileSize": 0,
        "price": null
      }
    ]
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» msg|string|true|none||none|
|» data|object|true|none||none|
|»» total|integer|true|none||none|
|»» list|[object]|true|none||none|
|»»» id|integer|true|none||none|
|»»» name|string|true|none||none|
|»»» thumbnailUrl|string|true|none||none|
|»»» width|integer¦null|true|none||none|
|»»» height|integer¦null|true|none||none|
|»»» fileSize|integer¦null|true|none||none|
|»»» price|null|true|none||none|

## POST 编辑器-发布或保存模板

POST /api/design/template/action

> Body 请求参数

```json
"{\r\n  \"basicInfo\": {\r\n    \"busId\": 123456,\r\n    \"cid\": 123456,\r\n    \"refer\": \"home\",\r\n    \"source\": 0,\r\n    \"hcode\": \"linlang\",\r\n    \"version\": \"0.0.1\"\r\n  },\r\n  \"i18n\": {\r\n    \"language\": \"zh\",\r\n    \"timezone\": \"+0800\"\r\n  },\r\n  \"queryParameter\": {\r\n    \"action\":\"\", //动作 0: 保存 1: 发布\r\n    \"json\":\"\", // 模板数据\r\n    \"color\":\"\", //颜色\r\n    \"images\":[{\r\n      \"url\": \"\",\r\n      \"name\": \"\"\r\n    }]\r\n  }\r\n}"
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST 编辑器-获取临时文件

POST /api/design/template/getTempFile

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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
    "id": 1
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST 素材分组列表(每个分组最多展示6个)

POST /api/design/material/getMaterial

> Body 请求参数

```json
{
  "basicInfo": {
    "busId": 123456,
    "cid": 123456,
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

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 78,
      "groupName": "短视频",
      "list": [
        {
          "id": 1,
          "name": "独立设计师品牌",
          "data": [
            {
              "id": null,
              "name": "独立设计师品牌",
              "cover": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20260207/hot4_1767706901191_1770479790072.png",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        }
      ]
    },
    {
      "id": 79,
      "groupName": "广告",
      "list": [
        {
          "id": 2,
          "name": "五一大促海报",
          "data": [
            {
              "id": null,
              "name": "五一大促海报",
              "cover": "https://example.com/material/2_thumb.jpg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        },
        {
          "id": 3,
          "name": "年度巨献ppt模板",
          "data": [
            {
              "id": null,
              "name": "年度巨献ppt模板",
              "cover": "https://example.com/material/3_thumb.jpg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        },
        {
          "id": 5,
          "name": "品牌色彩方案",
          "data": [
            {
              "id": null,
              "name": "品牌色彩方案",
              "cover": "https://example.com/material/5_thumb.jpg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        },
        {
          "id": 6,
          "name": "营销文案模板",
          "data": [
            {
              "id": null,
              "name": "营销文案模板",
              "cover": "https://example.com/material/6_thumb.jpg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        },
        {
          "id": 7,
          "name": "平面设计基础",
          "data": [
            {
              "id": null,
              "name": "平面设计基础",
              "cover": "https://example.com/material/7_thumb.jpg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        },
        {
          "id": 8,
          "name": "品牌VI系统",
          "data": [
            {
              "id": null,
              "name": "品牌VI系统",
              "cover": "https://example.com/material/8_thumb.jpg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        },
        {
          "id": 14,
          "name": "五一大促海报",
          "data": [
            {
              "id": null,
              "name": "五一大促海报",
              "cover": "https://example.com/material/5_thumb.jpg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        },
        {
          "id": 15,
          "name": "PHP",
          "data": [
            {
              "id": null,
              "name": "PHP",
              "cover": "https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20260205/8128802937ee161c82bb15c172184433_1770310126505.jpeg",
              "json": null,
              "style": null,
              "layerType": null,
              "sort": 0
            }
          ]
        }
      ]
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

# 数据模型

