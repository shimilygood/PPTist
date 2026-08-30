import axios from '@/services/axios'

const trimBase = (base: string) => base.replace(/\/+$/, '')
const joinPath = (base: string, path: string) => `${trimBase(base)}/${path.replace(/^\/+/, '')}`

const api = trimBase((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api')
const ai = trimBase((import.meta.env.VITE_AI_BASE_URL as string | undefined)?.trim() || '/ai')

const DEFAULT_BASIC_INFO = {
  busId: 123456,
  cid: 123456,
  refer: 'home',
  source: 0,
  hcode: 'linlang',
  version: '0.0.1',
}

const DEFAULT_I18N = {
  language: 'zh',
  timezone: '+0800',
}

const buildPayload = (queryParameter: any = {}) => ({
  basicInfo: DEFAULT_BASIC_INFO,
  i18n: DEFAULT_I18N,
  queryParameter,
})

export const getCookieAuthToken = (): string => {
  if (typeof document === 'undefined' || !document.cookie) return '';
  // 兼容所有顺序和空格
  const match = document.cookie.match(/(?:^|;\s*)AUTH_TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1].trim()) : '';
};

const getAuthorizationHeader = (): Record<string, string> => {
  const accessToken = localStorage.getItem('ACCESS_TOKEN')
  const token = accessToken || getCookieAuthToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export const GetTokenInfo = () => {
  return axios.post(`${api}/auth/getTokenInfo`, buildPayload({}), { withCredentials: true })
}

export const GetUserInfo = () => {
  return axios.post(`${api}/auth/user/getUserInfo`, buildPayload({}), { withCredentials: true })
}

export const GetTemplatePage = (queryParameter: any) => {
  return axios.post(`${api}/design/template/page`, buildPayload(queryParameter))
}

export const SearchContentMaterial = (data: any = {}) => {
  return axios.post(`${api}/content/material/search`, buildPayload(data))
}

export const SaveMySize = (data: any) => {
  return axios.post(`${api}/design/template/saveMySize`, buildPayload(data))
}

export const UpdateMySize = (data: any) => {
  return axios.post(`${api}/design/template/updateMySize`, buildPayload(data))
}

export const GetRecommendSize = () => {
  return axios.post(`${api}/design/template/recommendSize`, buildPayload({}))
}

export const GetMySize = () => {
  return axios.post(`${api}/design/template/mySize`, buildPayload({}))
}

export const SearchDesignMaterial = (data: any = {}) => {
  return axios.post(`${api}/design/material/search`, buildPayload(data))
}

export const TemplateAction = (data: any) => {
  return axios.post(`${api}/design/template/action`, buildPayload(data))
}

// PPT保存 /api/design/ppt/pptAction POST
export const buildPPTActionQuery = (data: any) => {
  const queryParameter: any = {
    name: data.name,
    pptVO: data.pptVO,
  }
  if (data.productId !== undefined && data.productId !== null) {
    queryParameter.productId = data.productId
  }
  if (data.spaceUid) queryParameter.spaceUid = data.spaceUid
  return queryParameter
}

export const PPTAction = (data: any) => {
  return axios.post(`${api}/design/ppt/pptAction`, buildPayload(buildPPTActionQuery(data)))
}

export const UploadTempFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return axios.post(`${api}/content/fileTempOss/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const GetPPTGroups = () => {
  return axios.post(`${api}/design/ppt/pptGroups`, buildPayload({}))
}

// 分页查询PPT模板列表 /api/design/ppt/pptSearch POST
export const SearchPPTTemplates = (data: any = {}) => {
  return axios.post(`${api}/design/ppt/pptSearch`, buildPayload({
    pageNo: 1,
    pageSize: 20,
    ...data,
  }))
}

export const PPT_INFO_ID_CACHE_PREFIX = 'PPT_TEMPLATE_PPT_INFO_ID_'

export const cachePptInfoId = (keyId: number | string | null | undefined, pptInfoId: number | null | undefined) => {
  if (keyId == null || keyId === '') return
  const infoId = Number(pptInfoId)
  if (!Number.isFinite(infoId) || infoId <= 0) return
  sessionStorage.setItem(`${PPT_INFO_ID_CACHE_PREFIX}${keyId}`, String(infoId))
}

export const getCachedPptInfoId = (keyId: number | string | null | undefined) => {
  if (keyId == null || keyId === '') return null
  try {
    const val = Number(sessionStorage.getItem(`${PPT_INFO_ID_CACHE_PREFIX}${keyId}`))
    return Number.isFinite(val) && val > 0 ? val : null
  }
  catch {
    return null
  }
}

export const resolvePptInfoIdValue = (...sources: Array<number | string | null | undefined>) => {
  for (const source of sources) {
    const val = Number(source)
    if (Number.isFinite(val) && val > 0) return val
  }
  return null
}

// 查询PPT模板详情 /api/design/ppt/pptDetail POST
export const buildPPTDetailQuery = (data: any) => {
  const source = typeof data === 'object' && data !== null ? data : { id: data }
  const queryParameter: any = {}
  const id = Number(source.id)
  const pptInfoId = Number(source.pptInfoId)

  if (Number.isFinite(id) && id > 0) queryParameter.id = id
  if (Number.isFinite(pptInfoId) && pptInfoId > 0) queryParameter.pptInfoId = pptInfoId

  return queryParameter
}

export const GetPPTDetail = (data: any) => {
  return axios.post(`${api}/design/ppt/pptDetail`, buildPayload(buildPPTDetailQuery(data)))
}

const OSS_HOST = 'yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com'

const getPPTContentRequestUrls = (url: string) => {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== OSS_HOST) return [url]

    const proxyPath = `${parsed.pathname}${parsed.search}`
    const candidates = []

    // Dev: try local Vite proxy first, then backend proxy
    if (import.meta.env.DEV) {
      // candidates.push(`/oss-proxy${proxyPath}`)
      candidates.push(`/api/oss-proxy${proxyPath}`)
    }

    // All environments: try backend proxy (avoids CORS, requires server config)
    candidates.push(`/api/oss-proxy${proxyPath}`)

    // Fallback to original OSS URL (may trigger CORS in prod)
    candidates.push(url)

    return candidates
  }
  catch {
    return [url]
  }
}

export const GetPPTContentJson = async <T = unknown>(url: string) => {
  const candidates = getPPTContentRequestUrls(url)
  console.log('[GetPPTContentJson] Trying candidates:', candidates)

  for (const requestUrl of candidates) {
    try {
      console.log('[GetPPTContentJson] Attempting:', requestUrl)
      const response = await fetch(requestUrl, {
        method: 'GET',
        credentials: 'omit',
      })

      if (!response.ok) {
        console.warn(`[GetPPTContentJson] ${requestUrl} returned ${response.status}`)
        continue
      }

      const data = await response.json() as T & { code?: number; msg?: string }
      
      // Check if response is API error (has code field that's not 0)
      if (typeof data?.code === 'number' && data.code !== 0) {
        console.warn(`[GetPPTContentJson] ${requestUrl} returned API error: code ${data.code}, msg: ${data.msg}`)
        continue
      }

      console.log('[GetPPTContentJson] ✓ Success with:', requestUrl)
      return data
    }
    catch (err) {
      console.warn(`[GetPPTContentJson] ${requestUrl} failed:`, err instanceof Error ? err.message : err)
    }
  }

  const errorMsg = `fetch ppt content failed after trying ${candidates.length} candidates`
  console.error('[GetPPTContentJson] ✗', errorMsg)
  throw new Error(errorMsg)
}

type JsonSource<T> = {
  json?: string | T | null
  contentJsonUrl?: string | null
  preferContentUrl?: boolean
}

const parseJsonContent = <T = unknown>(raw?: string | T | null): T | null => {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const text = raw.trim()
    if (!text) return null
    return JSON.parse(text) as T
  }
  return raw
}

export const ResolvePPTContent = async <T = unknown>(source: JsonSource<T>): Promise<T | null> => {
  const { json, contentJsonUrl, preferContentUrl = true } = source

  if (preferContentUrl && contentJsonUrl) {
    try {
      console.log('[ResolvePPTContent] Fetching from contentJsonUrl:', contentJsonUrl)
      return await GetPPTContentJson<T>(contentJsonUrl)
    }
    catch (err) {
      console.warn('[ResolvePPTContent] contentJsonUrl fetch failed:', err instanceof Error ? err.message : err)
    }
  }

  try {
    console.log('[ResolvePPTContent] Parsing inline json')
    const parsed = parseJsonContent<T>(json)
    if (parsed != null) {
      console.log('[ResolvePPTContent] ✓ Parsed inline json successfully')
      return parsed
    }
  }
  catch (err) {
    console.warn('[ResolvePPTContent] inline json parse failed:', err instanceof Error ? err.message : err)
  }

  if (!preferContentUrl && contentJsonUrl) {
    try {
      console.log('[ResolvePPTContent] Fetching from contentJsonUrl (fallback):', contentJsonUrl)
      return await GetPPTContentJson<T>(contentJsonUrl)
    }
    catch (err) {
      console.error('[ResolvePPTContent] contentJsonUrl fallback also failed:', err instanceof Error ? err.message : err)
      return null
    }
  }

  console.error('[ResolvePPTContent] ✗ All resolve attempts failed')
  return null
}

export const GetTempFile = (id: number) => {
  return axios.post(`${api}/design/template/getTempFile`, buildPayload({ id }))
}

export const GetMaterial = (data?: { typeName?: string; typeId?: number }) => {
  return axios.post(`${api}/design/material/getMaterial`, buildPayload(data))
}




// export const SearchPPTTemplates = (data: { groupId?: number; hasRecommend?: 0 | 1 } = { hasRecommend: 0 }) => {
//   return axios.post(`${api}/design/ppt/pptSearch`, buildPayload(data))
// }

export const GetMaterialOther = (data?: { typeName?: string; typeId?: number }) => {
  return axios.post(`${api}/design/material/getMaterialOther`, buildPayload(data))
}

// 获取用户个人空间 /app-api/space/getUserSpace POST
export const GetUserSpace = (queryParameter: any = {}) => {
  return axios.post(`/app-api/space/getUserSpace`, buildPayload(queryParameter))
}

// 获取收藏列表 /app-api/substation/getCollectList POST
export const GetSubstationCollectList = (queryParameter: any) => {
  return axios.post(`/app-api/substation/getCollectList`, buildPayload(queryParameter))
}

// 获取文件夹信息 /app-api/substation/info POST
export const GetSubstationInfo = (queryParameter: any) => {
  return axios.post(`/app-api/substation/info`, buildPayload(queryParameter))
}

// 获取我的作品列表（仅PPT） /app-api/substation/getMyWorkList POST
export const GetSubstationMyWorkList = (queryParameter: any) => {
  return axios.post(`/app-api/substation/getMyWorkList`, buildPayload(queryParameter))
}

// 获取我的作品列表（全部业务） /app-api/substation/getMyAllWorkList POST
export const GetSubstationMyAllWorkList = (queryParameter: any) => {
  return axios.post(`/app-api/substation/getMyAllWorkList`, buildPayload(queryParameter))
}

// 发布素材到公共素材库 /app-api/substation/publishMaterial POST
export const PublishSubstationMaterial = (queryParameter: any) => {
  return axios.post(`/app-api/substation/publishMaterial`, buildPayload(queryParameter))
}

// 发布作品到公共模板库 /app-api/substation/publishWork POST
export const PublishSubstationWork = (queryParameter: any) => {
  return axios.post(`/app-api/substation/publishWork`, buildPayload(queryParameter))
}

// 获取副站当前团队空间 /app-api/substation/current-team GET
export const GetSubstationCurrentTeam = () => {
  const payload = buildPayload({})
  payload.basicInfo = { ...payload.basicInfo, refer: 'substation-current-team' }
  return axios({
    method: 'GET',
    url: '/app-api/substation/current-team',
    data: payload,
  })
}

// 获取团队空间作品列表 /app-api/substation/getTeamWorkList POST
export const GetSubstationTeamWorkList = (queryParameter: any) => {
  return axios.post(`/app-api/substation/getTeamWorkList`, buildPayload(queryParameter))
}

// 获取团队空间标签列表 /app-api/substation/getTeamTagList POST
export const GetSubstationTeamTagList = (queryParameter: any) => {
  return axios.post(`/app-api/substation/getTeamTagList`, buildPayload(queryParameter))
}

export const GetHotTopicList = (data: { type?: number } = { type: 0 }) => {
  return axios.post(`${api}/content/hot-topic/list`, buildPayload(data))
}

// 生成PPT大纲（SSE流式） POST /ai/ppt/generate-outline
export const GeneratePPTOutline = (data: any) => {
  const payload: any = { topic: data.topic }
  if (data.outline !== undefined) payload.outline = data.outline
  if (data.templateId != null) payload.templateId = data.templateId
  if (data.scheme !== undefined) payload.scheme = data.scheme
  if (data.webSearch !== undefined) payload.webSearch = data.webSearch
  if (data.imageType !== undefined) payload.imageType = data.imageType
  if (data.language !== undefined) payload.language = data.language
  if (data.pageCount != null) payload.pageCount = data.pageCount
  if (data.enableImageBackground !== undefined) payload.enableImageBackground = data.enableImageBackground

  return fetch(joinPath(ai, '/ppt/generate-outline'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(buildPayload(payload)),
  })
}

// 异步生成PPT POST /ai/ppt/generate
export const GeneratePPT = async (data: any) => {
  const params: any = { topic: data.topic }
  if (data.outline) params.outline = data.outline
  if (data.templateId != null) params.templateId = data.templateId
  if (data.size) params.size = data.size
  if (data.mode) params.mode = data.mode
  if (data.useReasoning != null) params.useReasoning = data.useReasoning
  if (data.enableImageBackground != null) params.enableImageBackground = data.enableImageBackground
  if (data.imageModelId != null) params.imageModelId = data.imageModelId
  if (data.outlineId != null) params.outlineId = data.outlineId

  const response = await fetch(joinPath(ai, '/ppt/generate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(buildPayload(params)),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

// 获取大纲详情 POST /ai/ppt/outline/get
export const GetPPTOutline = async (params: any) => {
  const response = await fetch(joinPath(ai, '/ppt/outline/get'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(buildPayload({ id: params.id })),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

// 保存编辑后的大纲 POST /ai/ppt/outline/save
export const SavePPTOutline = async (data: any) => {
  const response = await fetch(joinPath(ai, '/ppt/outline/save'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(buildPayload({
      id: data.id,
      version: data.version,
      title: data.title,
      subtitle: data.subtitle,
      sections: data.sections,
    })),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

// 删除大纲 POST /ai/ppt/outline/delete
export const DeletePPTOutline = async (params: any) => {
  const response = await fetch(joinPath(ai, '/ppt/outline/delete'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(buildPayload({ id: params.id })),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

// 轮询获取PPT生成任务 POST /ai/ppt/getPptStatus
export const GetPPTTask = async (id: any) => {
  const response = await fetch(joinPath(ai, '/ppt/getPptStatus'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(buildPayload({ id })),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

// 下载PPT文件 POST /ai/ppt/download
export const DownloadPPT = (id: any) => {
  return axios.post(joinPath(ai, '/ppt/download'), buildPayload({ id }), {
    responseType: 'blob',
  })
}

// 提交PPT加工任务（异步） POST /ai/ppt/refine
export const RefinePPT = (data: any) => {
  return axios.post(joinPath(ai, '/ppt/refine'), buildPayload({
    sourceType: data.sourceType,
    sourceId: data.sourceId,
    operation: data.operation,
    targetLang: data.targetLang,
    styleHint: data.styleHint,
    exportPptx: data.exportPptx,
  }))
}

// 轮询获取PPT加工任务 POST /ai/ppt/refine/get
export const GetRefineTask = (id: any) => {
  return axios.post(joinPath(ai, '/ppt/refine/get'), buildPayload({ id }))
}

// 兼容旧调用：editorApi.getCookieAuthToken() / editorApi.getUserInfo() 等
const editorApi = {
  getCookieAuthToken,
  getTokenInfo: GetTokenInfo,
  getUserInfo: GetUserInfo,
  getTemplatePage: GetTemplatePage,
  searchContentMaterial: SearchContentMaterial,
  saveMySize: SaveMySize,
  updateMySize: UpdateMySize,
  recommendSize: GetRecommendSize,
  mySize: GetMySize,
  searchDesignMaterial: SearchDesignMaterial,
  templateAction: TemplateAction,
  pptAction: PPTAction,
  buildPPTActionQuery,
  uploadTempFile: UploadTempFile,
  getPPTGroups: GetPPTGroups,
  searchPPTTemplates: SearchPPTTemplates,
  getPPTDetail: GetPPTDetail,
  buildPPTDetailQuery,
  cachePptInfoId,
  getCachedPptInfoId,
  resolvePptInfoIdValue,
  getPPTContentJson: GetPPTContentJson,
  resolvePPTContent: ResolvePPTContent,
  getTempFile: GetTempFile,
  getMaterial: GetMaterial,
  getMaterialOther: GetMaterialOther,
  getHotTopicList: GetHotTopicList,
  generatePPTOutline: GeneratePPTOutline,
  getPPTOutline: GetPPTOutline,
  savePPTOutline: SavePPTOutline,
  deletePPTOutline: DeletePPTOutline,
  generatePPT: GeneratePPT,
  getPPTTask: GetPPTTask,
  downloadPPT: DownloadPPT,
  refinePPT: RefinePPT,
  getRefineTask: GetRefineTask,
}

export default editorApi
