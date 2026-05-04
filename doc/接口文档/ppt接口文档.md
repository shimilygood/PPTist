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

## POST ppt编辑器-发布或保存模板

POST /api/design/ppt/pptAction

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
      "id": 74,
      "action": 1,
      "name": "商务汇报模板",
      "pptVO": {
        "name": "封面页",
        "cover": "https://xxx.png",
        "json": "{...ppt原始json数据...}",
        "width": 1920,
        "height": 1080
      }
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

## POST ppt编辑器-模板列表

POST /api/design/ppt/pptSearch

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
{"code":0,"msg":"","data":{"total":6,"list":[{"id":75,"name":"大学毕业设计","cover":"[{\"url\":\"https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20260501/b2c7a709-6ee4-4ed8-a986-9e7f3aaaa386_1777604584395.png\",\"name\":\"b2c7a709-6ee4-4ed8-a986-9e7f3aaaa386.png\",\"type\":\"image/png\"}]","json":null,"width":1,"height":1},{"id":74,"name":"商务汇报模板","cover":"https://xxx.png","json":"{...ppt原始json数据...}","width":1920,"height":1080},{"id":67,"name":"测试","cover":"[{\"url\":\"https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20260310/acc52f21-2af9-428e-8d30-9e42ddeb49e2_1773146325176.png\",\"name\":\"acc52f21-2af9-428e-8d30-9e42ddeb49e2.png\",\"type\":\"image/png\"}]","json":null,"width":1,"height":1},{"id":32,"name":"zoe_koo","cover":"[{\"url\":\"https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20260126/ScreenShot_2026-01-26_155606_017_1769414482669.png\",\"name\":\"ScreenShot_2026-01-26_155606_017.png\",\"type\":\"image/png\"}]","json":null,"width":1,"height":1},{"id":21,"name":"无限1","cover":"[{\"url\":\"https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20251227/e4385d11-9768-4e22-9ed9-51202cf58656_1766842925977.jpg\",\"name\":\"e4385d11-9768-4e22-9ed9-51202cf58656.jpg\",\"type\":\"image/jpeg\"},{\"url\":\"https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20251228/Explosion_1080_1766926243801.jpg\",\"name\":\"Explosion_1080.jpg\",\"type\":\"image/jpeg\"}]","json":null,"width":1,"height":1},{"id":22,"name":"英文","cover":"[{\"url\":\"https://yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com/file/20251227/e4385d11-9768-4e22-9ed9-51202cf58656_1766847031723.jpg\",\"name\":\"e4385d11-9768-4e22-9ed9-51202cf58656.jpg\",\"type\":\"image/jpeg\"}]","json":null,"width":1,"height":1}]}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST ppt获取PPT分组列表

POST /api/design/ppt/pptGroups

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
      
      }
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
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "groupId": 0,
      "groupName": "string"
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
|»» groupId|integer|true|none||none|
|»» groupName|string|true|none||none|

# 数据模型

