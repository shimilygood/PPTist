import axios from '@/services/axios'

const api = '/api'

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

export const GetTokenInfo = () => {
  return axios.post(`${api}/auth/getTokenInfo`, buildPayload({}), { withCredentials: true })
}

export const GetUserInfo = () => {
  return axios.post(`${api}/auth/user/getUserInfo`, buildPayload({}))
}

export const GetTemplatePage = () => {
  return axios.post(`${api}/design/template/page`, buildPayload({}))
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

export const GetTempFile = (id: number) => {
  return axios.post(`${api}/design/template/getTempFile`, buildPayload({ id }))
}

export const GetMaterial = () => {
  return axios.post(`${api}/design/material/getMaterial`, buildPayload({}))
}

export const GetMaterialOther = () => {
  return axios.post(`${api}/design/material/getMaterialOther`, buildPayload({}))
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
  getTempFile: GetTempFile,
  getMaterial: GetMaterial,
  getMaterialOther: GetMaterialOther,
}

export default editorApi
