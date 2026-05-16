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
  const source = document.cookie || ''
  const found = source.split(';').map(s => s.trim()).find(s => s.startsWith('AUTH_TOKEN='))
  return found ? decodeURIComponent(found.slice('AUTH_TOKEN='.length)) : ''
}

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
  return axios.post(`${api}/auth/user/getUserInfo`, buildPayload({}))
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

export const PPTAction = (data: any) => {
  return axios.post(`${api}/design/ppt/pptAction`, buildPayload(data))
}

export const GetPPTGroups = () => {
  return axios.post(`${api}/design/ppt/pptGroups`, buildPayload({}))
}

export const SearchPPTTemplates = (data: { groupId?: number; hasRecommend?: 0 | 1 } = { hasRecommend: 0 }) => {
  return axios.post(`${api}/design/ppt/pptSearch`, buildPayload(data))
}

export const GetPPTDetail = (id: any) => {
  return axios.post(`${api}/design/ppt/pptDetail`, buildPayload({ id }))
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
      candidates.push(`/oss-proxy${proxyPath}`)
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

export const GetMaterial = () => {
  return axios.post(`${api}/design/material/getMaterial`, buildPayload({}))
}

export const GetMaterialOther = () => {
  return axios.post(`${api}/design/material/getMaterialOther`, buildPayload({}))
}

export const GetHotTopicList = (data: { type?: number } = { type: 0 }) => {
  return axios.post(`${api}/content/hot-topic/list`, buildPayload(data))
}

type GenerateOutlineParams = {
  topic: string
  outline?: string
  templateId?: number | null
  size?: number
}

type GeneratePPTParams = {
  topic: string
  outline?: string
  templateId?: number | null
  size?: number
}

export const GeneratePPTOutline = (data: GenerateOutlineParams) => {
  return fetch(joinPath(ai, '/ppt/generate-outline'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(buildPayload(data)),
  })
}

export const GeneratePPT = (data: GeneratePPTParams) => {
  return axios.post(joinPath(ai, '/ppt/generate'), buildPayload(data))
}

export const DownloadPPT = (id: number) => {
  return axios.post(joinPath(ai, '/ppt/download'), buildPayload({ id }), {
    responseType: 'blob',
  })
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
  getPPTGroups: GetPPTGroups,
  searchPPTTemplates: SearchPPTTemplates,
  getPPTDetail: GetPPTDetail,
  getPPTContentJson: GetPPTContentJson,
  resolvePPTContent: ResolvePPTContent,
  getTempFile: GetTempFile,
  getMaterial: GetMaterial,
  getMaterialOther: GetMaterialOther,
  getHotTopicList: GetHotTopicList,
  generatePPTOutline: GeneratePPTOutline,
  generatePPT: GeneratePPT,
  downloadPPT: DownloadPPT,
}

export default editorApi
