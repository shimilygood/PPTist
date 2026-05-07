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

const getPPTContentRequestUrl = (url: string) => {
  if (!import.meta.env.DEV) return url

  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'yunhui-asset-cdn.oss-cn-shanghai.aliyuncs.com') {
      return `/oss-proxy${parsed.pathname}${parsed.search}`
    }
  }
  catch {
    return url
  }

  return url
}

export const GetPPTContentJson = async <T = unknown>(url: string) => {
  const response = await fetch(getPPTContentRequestUrl(url), {
    method: 'GET',
    credentials: 'omit',
  })

  if (!response.ok) {
    throw new Error('fetch ppt content failed')
  }

  return response.json() as Promise<T>
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
}

type GeneratePPTParams = {
  topic: string
  outline?: string
  templateId?: number | null
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
  getTempFile: GetTempFile,
  getMaterial: GetMaterial,
  getMaterialOther: GetMaterialOther,
  getHotTopicList: GetHotTopicList,
  generatePPTOutline: GeneratePPTOutline,
  generatePPT: GeneratePPT,
  downloadPPT: DownloadPPT,
}

export default editorApi
